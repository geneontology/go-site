#!/usr/bin/env python3
"""
Generate a report of Noctua models that fail or produce warnings during conversion to GO-CAM.

This script:
1. Reads a pre-computed noctua_conversion_info.txt (JSONL) from the input directory.
2. For models that were filtered, errored, or had warnings, extracts contributor and
   provider information from the original Noctua JSON files in the noctua_in_json/
   subdirectory.
3. Resolves contributor URIs to nicknames using users.yaml (matched by uri then xref)
   and provider URLs to group labels using groups.yaml from the metadata directory.
4. Writes a tab-separated report of failures and warnings with contributor/provider info,
   sorted by error first, then filtered, then warning, then alphabetically by provider,
   contributor, and model name.
"""

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Annotated

import typer
import yaml
from rich.progress import track

app = typer.Typer()

logger = logging.getLogger(__name__)

# Sort order for the status column in the tab-separated report.
_STATUS_SORT_ORDER = {"Error": 0, "Filtered": 1, "Warning": 2}


@dataclass
class ReportRow:
    """A single row in the failure/warning tab-separated report."""

    model: str
    status: str
    reason: str
    contributors: list[str] = field(default_factory=list)
    providers: list[str] = field(default_factory=list)

    @property
    def sort_key(self) -> tuple[int, str, str, str]:
        providers_str = "|".join(self.providers) if self.providers else ""
        contributors_str = "|".join(self.contributors) if self.contributors else ""
        return (_STATUS_SORT_ORDER.get(self.status, 99), providers_str, contributors_str, self.model)


def _collect_from_annotations(
    annotations: list[dict],
    contributors: set[str],
    providers: set[str],
) -> None:
    """Collect contributor and providedBy values from an annotations list.

    Args:
        annotations: A list of annotation dicts with 'key' and 'value' fields.
        contributors: Set to accumulate contributor values into.
        providers: Set to accumulate provider values into.
    """
    for ann in annotations:
        key = ann.get("key")
        value = ann.get("value", "")
        if key == "contributor":
            contributors.add(value)
        elif key == "providedBy":
            providers.add(value)


def extract_contributors_and_providers(
    json_file: Path,
) -> tuple[list[str], list[str]]:
    """Extract all contributor and providedBy values from a Noctua JSON file.

    Searches all annotation locations: top-level model annotations, individual-level
    annotations, and fact-level annotations.

    Args:
        json_file: Path to a Noctua/Minerva model JSON file.

    Returns:
        A tuple of (contributors, providers) as sorted, deduplicated lists.
    """
    with open(json_file) as f:
        data = json.load(f)

    contributors: set[str] = set()
    providers: set[str] = set()

    # Top-level model annotations
    _collect_from_annotations(data.get("annotations", []), contributors, providers)

    # Individual-level annotations
    for individual in data.get("individuals", []):
        _collect_from_annotations(
            individual.get("annotations", []), contributors, providers
        )

    # Fact-level annotations
    for fact in data.get("facts", []):
        _collect_from_annotations(fact.get("annotations", []), contributors, providers)

    return sorted(contributors), sorted(providers)


def load_users(metadata_dir: Path) -> tuple[dict[str, dict], dict[str, dict]]:
    """Load users.yaml and return two dicts: one keyed by uri, one keyed by xref.

    Args:
        metadata_dir: Directory containing users.yaml.

    Returns:
        A tuple of (users_by_uri, users_by_xref) dicts.
    """
    users_path = metadata_dir / "users.yaml"
    if not users_path.exists():
        logger.warning(f"users.yaml not found at {users_path}")
        return {}, {}
    with open(users_path) as f:
        users_list = yaml.safe_load(f)
    users_by_uri: dict[str, dict] = {}
    users_by_xref: dict[str, dict] = {}
    for user in users_list:
        uri = user.get("uri", "")
        if uri:
            users_by_uri[uri] = user
        xref = user.get("xref", "")
        if xref:
            users_by_xref[xref] = user
    return users_by_uri, users_by_xref


def load_groups(metadata_dir: Path) -> dict[str, dict]:
    """Load groups.yaml and return a dict keyed by id.

    Args:
        metadata_dir: Directory containing groups.yaml.

    Returns:
        A dict mapping group id (URL) to group data.
    """
    groups_path = metadata_dir / "groups.yaml"
    if not groups_path.exists():
        logger.warning(f"groups.yaml not found at {groups_path}")
        return {}
    with open(groups_path) as f:
        groups_list = yaml.safe_load(f)
    groups_by_id: dict[str, dict] = {}
    for group in groups_list:
        gid = group.get("id", "")
        if gid:
            groups_by_id[gid] = group
    return groups_by_id


def get_contributor_display_name(
    contributor: str,
    users_by_uri: dict[str, dict],
    users_by_xref: dict[str, dict],
) -> str:
    """Resolve a contributor URI/xref to a display name.

    Lookup order: uri dict first, then xref dict, then fallback to raw value.
    """
    user = users_by_uri.get(contributor) or users_by_xref.get(contributor)
    if user and user.get("nickname"):
        return user["nickname"]
    return contributor


def get_provider_display_name(
    provider: str,
    groups_by_id: dict[str, dict],
) -> str:
    """Resolve a provider URL to a group label."""
    group = groups_by_id.get(provider)
    if group and group.get("label"):
        return group["label"]
    return provider


def parse_conversion_info(
    conversion_info_file: Path,
) -> list[tuple[str, str, str]]:
    """Parse noctua_conversion_info.txt and extract entries needing a report row.

    Extracts entries with:
    - status "error" (all)
    - status "filtered" (all)
    - status "success" with non-empty "warnings" list

    Returns:
        A list of (model_id, status_label, reason) tuples.
    """
    entries: list[tuple[str, str, str]] = []
    with open(conversion_info_file) as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError as e:
                logger.warning(f"Skipping malformed JSON at line {line_num}: {e}")
                continue

            model_id = entry.get("model_id", "")
            status = entry.get("status", "")

            if status == "error":
                reason = entry.get("reason", "unknown error")
                details = entry.get("details", "")
                if details:
                    reason = f"{reason}: {details}"
                entries.append((model_id, "Error", reason))
            elif status == "filtered":
                reason = entry.get("reason", "unknown filter reason")
                entries.append((model_id, "Filtered", reason))
            elif status == "success":
                warnings = entry.get("warnings", [])
                if warnings:
                    reason = "; ".join(warnings)
                    entries.append((model_id, "Warning", reason))

    return entries


def setup_logging(verbosity: int) -> None:
    """Configure logging based on verbosity level."""
    if verbosity >= 2:
        level = logging.DEBUG
    elif verbosity >= 1:
        level = logging.INFO
    else:
        level = logging.WARNING
    logging.basicConfig(level=level, format="%(levelname)s: %(message)s")


def write_failure_warning_report(rows: list[ReportRow], output_file: Path) -> None:
    """Write the tab-separated failure/warning report.

    Args:
        rows: List of report rows to write.
        output_file: Path to the output file.
    """
    rows.sort(key=lambda r: r.sort_key)
    with open(output_file, "w") as f:
        f.write("Model\tStatus\tReason\tContributor\tProvider\n")
        for row in rows:
            contributors = "|".join(row.contributors) if row.contributors else ""
            providers = "|".join(row.providers) if row.providers else ""
            f.write(
                f"{row.model}\t{row.status}\t{row.reason}\t{contributors}\t{providers}\n"
            )


@app.command()
def main(
    input_dir: Annotated[
        Path,
        typer.Option(
            exists=True,
            file_okay=False,
            dir_okay=True,
            readable=True,
            help="Directory containing noctua_conversion_info.txt and noctua_in_json/ subdirectory.",
        ),
    ],
    metadata_dir: Annotated[
        Path,
        typer.Option(
            exists=True,
            file_okay=False,
            dir_okay=True,
            readable=True,
            help="Directory containing users.yaml and groups.yaml metadata files.",
        ),
    ],
    failure_warning_file: Annotated[
        Path,
        typer.Option(
            help="Path for the tab-separated failure/warning report.",
        ),
    ] = Path("noctua_conversion_failure_warning.txt"),
    verbose: Annotated[
        int,
        typer.Option(
            "--verbose",
            "-v",
            count=True,
            help="Increase verbosity level. Can be used multiple times.",
        ),
    ] = 0,
):
    """Generate a failure/warning report from Noctua conversion results."""
    setup_logging(verbose)

    # --- Load metadata ---
    users_by_uri, users_by_xref = load_users(metadata_dir)
    groups_by_id = load_groups(metadata_dir)
    logger.info(
        f"Loaded {len(users_by_uri)} users (by uri), "
        f"{len(users_by_xref)} users (by xref), "
        f"{len(groups_by_id)} groups"
    )

    # --- Parse conversion info JSONL ---
    conversion_info_file = input_dir / "noctua_conversion_info.txt"
    if not conversion_info_file.exists():
        raise typer.BadParameter(
            f"noctua_conversion_info.txt not found in {input_dir}"
        )

    entries = parse_conversion_info(conversion_info_file)
    logger.info(
        f"Found {len(entries)} entries needing report rows "
        f"(filtered/error/warning) from {conversion_info_file}"
    )

    # --- Build report rows ---
    noctua_json_dir = input_dir / "noctua_in_json"
    report_rows: list[ReportRow] = []

    for model_id, status, reason in track(
        entries, description="Building report rows..."
    ):
        json_file = noctua_json_dir / f"{model_id}.json"
        if json_file.exists():
            try:
                raw_contributors, raw_providers = extract_contributors_and_providers(
                    json_file
                )
            except Exception as e:
                logger.warning(
                    f"Could not extract contributor/provider for {model_id}: {e}"
                )
                raw_contributors, raw_providers = [], []
        else:
            logger.warning(f"JSON file not found for {model_id}: {json_file}")
            raw_contributors, raw_providers = [], []

        contributors = list(dict.fromkeys(
            get_contributor_display_name(c, users_by_uri, users_by_xref)
            for c in raw_contributors
        ))
        providers = list(dict.fromkeys(
            get_provider_display_name(p, groups_by_id) for p in raw_providers
        ))

        report_rows.append(
            ReportRow(
                model=model_id,
                status=status,
                reason=reason,
                contributors=contributors,
                providers=providers,
            )
        )

    # --- Write tab-separated report ---
    write_failure_warning_report(report_rows, failure_warning_file)
    logger.info(
        f"Failure/warning report written to {failure_warning_file} "
        f"({len(report_rows)} entries)"
    )


if __name__ == "__main__":
    app()