#!/usr/bin/env python3
"""
Generate a report of Noctua models that fail or produce warnings during conversion to GO-CAM.

This script:
1. Converts Minerva/Noctua JSON models to GO-CAM using the existing conversion pipeline.
2. Writes a JSONL report of all conversion results (success, filtered, error, warnings).
3. For models that failed or had warnings, extracts contributor and provider information
   from the original Noctua JSON files.
4. Writes a tab-separated report of failures and warnings with contributor/provider info,
   sorted by error first, then filtered, then warning, then alphabetically by model name.
"""

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Annotated

import typer
from _common import (
    ErrorResult,
    FilteredResult,
    PipelineResult,
    ResultSummary,
    SuccessResult,
    get_json_files,
    setup_logger,
)
from convert_minerva_models_to_gocam_models import process_minerva_model_file
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
    def sort_key(self) -> tuple[int, str]:
        return (_STATUS_SORT_ORDER.get(self.status, 99), self.model)


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


def classify_result(
    result: PipelineResult,
) -> tuple[str, str] | None:
    """Classify a pipeline result as Error, Filtered, or Warning.

    Returns:
        A (status, reason) tuple, or None if the result is a clean success.
    """
    match result:
        case ErrorResult(reason=reason, details=details):
            reason_str = reason.value
            if details:
                reason_str += f": {details}"
            return ("Error", reason_str)
        case FilteredResult(reason=reason):
            return ("Filtered", reason.value)
        case SuccessResult(warnings=warnings) if warnings:
            return ("Warning", "; ".join(warnings))
        case _:
            return None


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
            help="Directory containing Noctua/Minerva model JSON files.",
        ),
    ],
    output_dir: Annotated[
        Path | None,
        typer.Option(
            exists=True,
            file_okay=False,
            dir_okay=True,
            writable=True,
            help="Directory to save converted GO-CAM model files. Required unless --dry-run.",
        ),
    ] = None,
    conversion_info_file: Annotated[
        Path,
        typer.Option(
            help="Path for the JSONL conversion info report.",
        ),
    ] = Path("noctua_conversion_info.txt"),
    failure_warning_file: Annotated[
        Path,
        typer.Option(
            help="Path for the tab-separated failure/warning report.",
        ),
    ] = Path("noctua_conversion_failure_warning.txt"),
    dry_run: Annotated[
        bool,
        typer.Option(
            help="Convert without writing GO-CAM output files.",
        ),
    ] = False,
    verbose: Annotated[
        int,
        typer.Option(
            "--verbose",
            "-v",
            count=True,
            help="Increase verbosity level. Can be used multiple times.",
        ),
    ] = 0,
    limit: Annotated[
        int,
        typer.Option(
            help="Limit the number of models to process. 0 means no limit.",
        ),
    ] = 0,
):
    """Convert Noctua models to GO-CAM and generate failure/warning reports."""
    setup_logger(verbose)

    if not dry_run and output_dir is None:
        raise typer.BadParameter(
            "Output directory must be specified unless --dry-run is used."
        )

    effective_output_dir = None if dry_run else output_dir

    json_files = get_json_files(input_dir, limit=limit)

    # --- Step 1: Run conversion and collect results ---
    result_summary = ResultSummary()
    results_by_model: dict[str, tuple[PipelineResult, Path]] = {}

    with open(conversion_info_file, "w") as report_fh:
        for json_file in track(
            json_files,
            description="Converting Minerva models to GO-CAM...",
        ):
            model_id = json_file.stem
            result = process_minerva_model_file(
                json_file, output_dir=effective_output_dir
            )
            result_summary.add_result(model_id, result)
            result.write_to_file(report_fh, model_id)
            results_by_model[model_id] = (result, json_file)

    result_summary.print()
    logger.info(f"Conversion info written to {conversion_info_file}")

    # --- Step 2: Build failure/warning report rows ---
    report_rows: list[ReportRow] = []
    for model_id, (result, json_file) in results_by_model.items():
        classification = classify_result(result)
        if classification is None:
            continue
        status, reason = classification

        try:
            contributors, providers = extract_contributors_and_providers(json_file)
        except Exception as e:
            logger.warning(
                f"Could not extract contributor/provider for {model_id}: {e}"
            )
            contributors, providers = [], []

        report_rows.append(
            ReportRow(
                model=model_id,
                status=status,
                reason=reason,
                contributors=contributors,
                providers=providers,
            )
        )

    # --- Step 3: Write tab-separated report ---
    write_failure_warning_report(report_rows, failure_warning_file)
    logger.info(
        f"Failure/warning report written to {failure_warning_file} "
        f"({len(report_rows)} entries)"
    )


if __name__ == "__main__":
    app()
