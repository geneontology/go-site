# python3 ./scripts/reports-go-cam-stats.py --directory /path/to/go_cam_stats_output --template ./scripts/go-cam-stats-template.html --output /path/to/output --metadata /path/to/metadata

import click
import pystache
import json
import datetime
import os
import glob
import re
import yaml
from urllib.parse import urlparse


def build_table_data(json_data_list, column_names):
    """Build header and rows from a list of JSON dicts and their column names."""
    header = [{"id": name} for name in column_names]

    # Collect non-array field names from the first file
    field_names = [
        key for key, val in json_data_list[0].items()
        if not isinstance(val, list) and not isinstance(val, dict)
    ]

    rows = []
    for field in field_names:
        values = []
        for data in json_data_list:
            values.append({"value": data.get(field, "")})
        rows.append({
            "field": field,
            "field_display": field.replace("_", " "),
            "values": values,
        })

    return header, rows


def load_ontology_labels(resource_path):
    """Load an OBO JSON ontology file and return a dict mapping GO ID to label.

    The OBO JSON format stores nodes under graphs[0]["nodes"], where each node
    has an "id" (URI like http://purl.obolibrary.org/obo/GO_0042613) and "lbl"
    (the human-readable label).
    """
    with open(resource_path) as f:
        data = json.load(f)
    labels = {}
    for node in data.get("graphs", [{}])[0].get("nodes", []):
        uri = node.get("id", "")
        lbl = node.get("lbl", "")
        if lbl and "/" in uri:
            # Extract GO ID: last segment of URI, replace _ with :
            raw_id = uri.rsplit("/", 1)[-1]
            go_id = raw_id.replace("_", ":")
            labels[go_id] = lbl
    return labels


def get_go_term_label(go_id, ontology_labels):
    """Look up a GO term label from the ontology dict."""
    return ontology_labels.get(go_id, "")


def build_record_table_data(records, field_specs):
    """Build columns and record rows for a row-oriented (records) template.

    Args:
        records: list of dicts (the JSON array)
        field_specs: list of (field_name, display_label, formatter_fn) tuples.
            formatter_fn takes a raw value and returns a display string.

    Returns:
        columns: [{"label": str}]
        record_rows: [{"cells": [{"value": str}]}]
    """
    columns = [{"label": label} for _, label, _ in field_specs]
    record_rows = []
    for rec in records:
        cells = []
        for field_name, _, formatter in field_specs:
            raw = rec.get(field_name, "")
            cells.append({"value": formatter(raw)})
        record_rows.append({"cells": cells})
    return columns, record_rows


def format_curator_list(uris, users_by_uri):
    """Resolve a list of curator URIs to display names, comma-joined."""
    if not uris:
        return ""
    return ", ".join(get_curator_display_name(uri, users_by_uri) for uri in uris)


def format_group_list(uris, groups_by_id):
    """Resolve a list of group URIs to labels, comma-joined."""
    if not uris:
        return ""
    labels = []
    for uri in uris:
        ensure_group_entry(uri, groups_by_id)
        group = groups_by_id.get(uri)
        if group and group.get("label"):
            labels.append(group["label"])
        else:
            labels.append(uri)
    return ", ".join(labels)


def build_links(exclude_filename, available_pages):
    """Build navigation links excluding the current page."""
    return [{"href": fn, "label": label} for fn, label in available_pages if fn != exclude_filename]


def render_and_write(template_str, context, output_path):
    """Render a mustache template and write to output_path."""
    rendered = pystache.render(template_str, context)
    with open(output_path, "w") as f:
        f.write(rendered)
    click.echo("Wrote {}".format(output_path))


def write_tsv(headers, rows, output_path):
    """Write a TSV file with the given headers and rows.

    Args:
        headers: list of column header strings
        rows: list of lists of string values
        output_path: path to write the TSV file
    """
    def quote(val):
        s = str(val)
        return '"' + s.replace('"', '""') + '"'

    with open(output_path, "w") as f:
        f.write("\t".join(quote(h) for h in headers) + "\n")
        for row in rows:
            f.write("\t".join(quote(v) for v in row) + "\n")
    click.echo("Wrote {}".format(output_path))


def load_users(metadata_dir):
    """Load users.yaml and return a dict keyed by uri."""
    users_path = os.path.join(metadata_dir, "users.yaml")
    if not os.path.exists(users_path):
        click.echo("Warning: users.yaml not found at {}".format(users_path), err=True)
        return {}
    with open(users_path) as f:
        users_list = yaml.safe_load(f)
    users_by_uri = {}
    for user in users_list:
        uri = user.get("uri", "")
        if uri:
            users_by_uri[uri] = user
    return users_by_uri


def load_groups(metadata_dir):
    """Load groups.yaml and return a dict keyed by id."""
    groups_path = os.path.join(metadata_dir, "groups.yaml")
    if not os.path.exists(groups_path):
        click.echo("Warning: groups.yaml not found at {}".format(groups_path), err=True)
        return {}
    with open(groups_path) as f:
        groups_list = yaml.safe_load(f)
    groups_by_id = {}
    for group in groups_list:
        gid = group.get("id", "")
        if gid:
            groups_by_id[gid] = group
    return groups_by_id


def get_curator_display_name(uri, users_by_uri):
    """Get display name for a curator: nickname if available, otherwise the ID part of the URI."""
    user = users_by_uri.get(uri)
    if user and user.get("nickname"):
        return user["nickname"]
    # Extract the ID part from the URI (e.g., last path segment)
    parsed = urlparse(uri)
    return parsed.path.rstrip("/").split("/")[-1]


def get_curator_groups(uri, users_by_uri):
    """Get the list of group IDs a curator belongs to."""
    user = users_by_uri.get(uri)
    if user and user.get("groups"):
        return user["groups"]
    return []


def make_safe_filename(name):
    """Convert a group label to a safe filename."""
    return re.sub(r'[^a-zA-Z0-9_-]', '-', name).lower().strip('-')


def ensure_group_entry(group_uri, groups_by_id):
    """If group_uri has no entry in groups_by_id, create a synthetic one with a unique label.

    The label is derived from the last path segment of the URI. If that label
    already exists among existing groups, a numeric suffix is appended to
    ensure uniqueness.
    """
    if not group_uri or group_uri in groups_by_id:
        return
    parsed = urlparse(group_uri)
    base_label = parsed.path.rstrip("/").split("/")[-1]
    # Collect all existing labels for uniqueness check
    existing_labels = {g.get("label", "").lower() for g in groups_by_id.values()}
    label = base_label
    counter = 2
    while label.lower() in existing_labels:
        label = "{}_{}".format(base_label, counter)
        counter += 1
    groups_by_id[group_uri] = {"id": group_uri, "label": label}


@click.command()
@click.option("--directory", type=click.Path(exists=True), required=True)
@click.option("--template", type=click.File("r"), required=True)
@click.option("--output", type=click.Path(), required=True)
@click.option("--template-records", type=click.File("r"), required=False, default=None,
              help="Mustache template for record-oriented tables (protein complex, variable definitions)")
@click.option("-r", "--resource", type=click.Path(exists=True), required=False, default=None,
              help="Ontology file in OBO JSON format (e.g., go.json) for resolving GO term labels")
@click.option("--metadata", type=click.Path(exists=True), required=False, default=None,
              help="Directory containing users.yaml and groups.yaml metadata files")
@click.option("--date", default=str(datetime.date.today()))
def main(directory, template, output, template_records, resource, metadata, date):
    os.makedirs(output, exist_ok=True)
    template_str = template.read()
    records_template_str = template_records.read() if template_records else None

    # Load metadata if provided
    users_by_uri = {}
    groups_by_id = {}
    if metadata:
        users_by_uri = load_users(metadata)
        groups_by_id = load_groups(metadata)

    # Load ontology labels if provided
    ontology_labels = {}
    if resource:
        ontology_labels = load_ontology_labels(resource)

    # Build dynamic available_pages list based on which JSON files exist
    available_pages = [
        ("go-cam-aggregate-stats.html", "Aggregate Statistics"),
        ("go-cam-group-stats.html", "Stats by Group"),
    ]
    protein_complex_file = os.path.join(directory, "aggregate_protein_complex.json")
    definitions_file = os.path.join(directory, "member_variable_definitions.json")
    if records_template_str and os.path.exists(protein_complex_file):
        available_pages.append(("go-cam-protein-complex.html", "Protein Complex Activities"))
    if records_template_str and os.path.exists(definitions_file):
        available_pages.append(("go-cam-variable-definitions.html", "Variable Definitions"))

    # --- Aggregate stats (Model only) ---
    aggregate_file = os.path.join(directory, "aggregate_model_stats.json")
    if not os.path.exists(aggregate_file):
        click.echo("No aggregate_model_stats.json found in {}".format(directory), err=True)
        return

    with open(aggregate_file) as f:
        model_entity = json.load(f)

    # Extract dict field before build_table_data (which skips dicts)
    models_by_status = model_entity.pop("number_of_models_by_status", {})

    column_name = model_entity.pop("entity", "Model")
    header, rows = build_table_data([model_entity], [column_name])

    # Insert number_of_models_by_status rows right after total_number_of_entities_processed
    status_rows = []
    for status_name in sorted(models_by_status):
        status_rows.append({
            "field": "number_of_models_status_{}".format(status_name),
            "field_display": "number of models {}".format(status_name),
            "values": [{"value": models_by_status[status_name]}],
        })
    insert_idx = next(
        (i + 1 for i, r in enumerate(rows) if r["field"] == "total_number_of_entities_processed"),
        len(rows),
    )
    rows[insert_idx:insert_idx] = status_rows

    render_and_write(template_str, {
        "title": "GO-CAM Aggregate Statistics",
        "header": header,
        "rows": rows,
        "links": build_links("go-cam-aggregate-stats.html", available_pages),
        "date": date,
    }, os.path.join(output, "go-cam-aggregate-stats.html"))

    # --- Build curator info from stats_by_curator ---
    curator_dir = os.path.join(directory, "stats_by_curator")
    curator_data_list = []
    curator_uris = []
    if os.path.isdir(curator_dir):
        curator_files = sorted(glob.glob(os.path.join(curator_dir, "stats_by_curator_*.json")))
        for fpath in curator_files:
            with open(fpath) as f:
                data = json.load(f)
            curator_data_list.append(data)
            curator_uris.append(data.get("uri", ""))

    # --- Stats by curator (all curators) ---
    if curator_data_list:
        curator_columns = [
            get_curator_display_name(uri, users_by_uri) for uri in curator_uris
        ]

        header, rows = build_table_data(curator_data_list, curator_columns)

        render_and_write(template_str, {
            "title": "GO-CAM Stats by Curator",
            "header": header,
            "rows": rows,
            "links": build_links("go-cam-curator-stats.html", available_pages),
            "date": date,
        }, os.path.join(output, "go-cam-curator-stats.html"))
    else:
        click.echo("No curator stats files found", err=True)

    # --- Stats by group ---
    group_dir = os.path.join(directory, "stats_by_group")
    if os.path.isdir(group_dir):
        group_files = sorted(glob.glob(os.path.join(group_dir, "stats_by_group_*.json")))
        if group_files:
            group_data = []
            group_uris = []
            group_labels = []
            group_page_filenames = []
            for fpath in group_files:
                with open(fpath) as f:
                    data = json.load(f)
                group_data.append(data)
                group_uri = data.get("uri", "")
                group_uris.append(group_uri)
                # Ensure a groups_by_id entry exists for this URI
                ensure_group_entry(group_uri, groups_by_id)
                # Map to group label via groups.yaml
                group = groups_by_id.get(group_uri)
                if group and group.get("label"):
                    label = group["label"]
                else:
                    label = group_uri
                group_labels.append(label)
                group_page_filenames.append("go-cam-group-curator-stats-{}.html".format(make_safe_filename(label)))

            # Build header with links to per-group curator pages
            header = [
                {"id": label, "href": page_fn}
                for label, page_fn in zip(group_labels, group_page_filenames)
            ]

            # Also add "Other" column header if there are ungrouped curators
            # Build group membership for curators
            group_to_curators = {}  # group_id -> list of (data, display_name)
            ungrouped_curators = []
            for data, uri in zip(curator_data_list, curator_uris):
                display_name = get_curator_display_name(uri, users_by_uri)
                curator_groups = get_curator_groups(uri, users_by_uri)
                if not curator_groups:
                    ungrouped_curators.append((data, display_name))
                else:
                    for gid in curator_groups:
                        group_to_curators.setdefault(gid, []).append((data, display_name))

            if ungrouped_curators:
                other_page_fn = "go-cam-group-curator-stats-other.html"
                header.append({"id": "Other", "href": other_page_fn})

            # Build rows from group_data (non-array, non-dict fields)
            field_names = [
                key for key, val in group_data[0].items()
                if not isinstance(val, list) and not isinstance(val, dict)
            ]

            rows = []
            for field in field_names:
                values = [{"value": data.get(field, "")} for data in group_data]
                # Add empty value for "Other" column if present
                if ungrouped_curators:
                    values.append({"value": ""})
                rows.append({
                    "field": field,
                    "field_display": field.replace("_", " "),
                    "values": values,
                })

            render_and_write(template_str, {
                "title": "GO-CAM Stats by Group",
                "header": header,
                "rows": rows,
                "links": build_links("go-cam-group-stats.html", available_pages),
                "date": date,
            }, os.path.join(output, "go-cam-group-stats.html"))

            # --- Create per-group curator pages ---
            for group_uri, label, page_fn in zip(group_uris, group_labels, group_page_filenames):
                curators_in_group = group_to_curators.get(group_uri, [])

                grp_links = build_links(page_fn, available_pages)

                if not curators_in_group:
                    click.echo("No curators found for group '{}' via metadata".format(label), err=True)
                    # Still create the page so the link from group stats is not broken
                    render_and_write(template_str, {
                        "title": "GO-CAM Curator Stats - {}".format(label),
                        "header": [],
                        "rows": [],
                        "links": grp_links,
                        "date": date,
                    }, os.path.join(output, page_fn))
                    continue

                grp_curator_data = [c[0] for c in curators_in_group]
                grp_curator_names = [c[1] for c in curators_in_group]

                grp_header, grp_rows = build_table_data(grp_curator_data, grp_curator_names)

                render_and_write(template_str, {
                    "title": "GO-CAM Curator Stats - {}".format(label),
                    "header": grp_header,
                    "rows": grp_rows,
                    "links": grp_links,
                    "date": date,
                }, os.path.join(output, page_fn))

            # --- Create "Other" page for ungrouped curators ---
            if ungrouped_curators:
                other_data = [c[0] for c in ungrouped_curators]
                other_names = [c[1] for c in ungrouped_curators]

                other_header, other_rows = build_table_data(other_data, other_names)

                render_and_write(template_str, {
                    "title": "GO-CAM Curator Stats - Other",
                    "header": other_header,
                    "rows": other_rows,
                    "links": build_links("go-cam-group-curator-stats-other.html", available_pages),
                    "date": date,
                }, os.path.join(output, "go-cam-group-curator-stats-other.html"))

        else:
            click.echo("No group stats files found in {}".format(group_dir), err=True)
    else:
        click.echo("stats_by_group directory not found in {}".format(directory), err=True)

    # --- Protein Complex Activities report ---
    if records_template_str and os.path.exists(protein_complex_file):
        with open(protein_complex_file) as f:
            protein_complex_data = json.load(f)

        if protein_complex_data:
            field_specs = [
                ("model_id", "Model ID", str),
                ("model_name", "Model Name", str),
                ("model_status", "Model Status", str),
                ("activity_id", "Activity ID", str),
                ("protein_complex_term", "Protein Complex Term", str),
            ]
            if ontology_labels:
                field_specs.append(
                    ("protein_complex_term", "Protein Complex Label",
                     lambda go_id: get_go_term_label(go_id, ontology_labels)))
            field_specs.append(("molecular_function", "Molecular Function", str))
            if ontology_labels:
                field_specs.append(
                    ("molecular_function", "Molecular Function Label",
                     lambda go_id: get_go_term_label(go_id, ontology_labels)))
            field_specs.extend([
                ("unique_curators", "Curators", lambda uris: format_curator_list(uris, users_by_uri)),
                ("unique_groups", "Groups", lambda uris: format_group_list(uris, groups_by_id)),
            ])
            columns, records = build_record_table_data(protein_complex_data, field_specs)

            render_and_write(records_template_str, {
                "title": "GO-CAM Protein Complex Activities",
                "columns": columns,
                "records": records,
                "links": build_links("go-cam-protein-complex.html", available_pages),
                "date": date,
            }, os.path.join(output, "go-cam-protein-complex.html"))

            # Also write TSV with the same columns
            tsv_headers = [label for _, label, _ in field_specs]
            tsv_rows = []
            for rec in protein_complex_data:
                row = []
                for field_name, _, formatter in field_specs:
                    raw = rec.get(field_name, "")
                    row.append(formatter(raw))
                tsv_rows.append(row)
            write_tsv(tsv_headers, tsv_rows, os.path.join(output, "go-cam-protein-complex.tsv"))
        else:
            click.echo("aggregate_protein_complex.json is empty", err=True)
    elif records_template_str:
        click.echo("No aggregate_protein_complex.json found in {}".format(directory), err=True)

    # --- Variable Definitions report ---
    if records_template_str and os.path.exists(definitions_file):
        with open(definitions_file) as f:
            definitions_data = json.load(f)

        if definitions_data:
            field_specs = [
                ("class", "Class", str),
                ("variable", "Variable", str),
                ("description", "Description", str),
            ]
            columns, records = build_record_table_data(definitions_data, field_specs)

            render_and_write(records_template_str, {
                "title": "GO-CAM Variable Definitions",
                "columns": columns,
                "records": records,
                "links": build_links("go-cam-variable-definitions.html", available_pages),
                "date": date,
            }, os.path.join(output, "go-cam-variable-definitions.html"))
        else:
            click.echo("member_variable_definitions.json is empty", err=True)
    elif records_template_str:
        click.echo("No member_variable_definitions.json found in {}".format(directory), err=True)


if __name__ == "__main__":
    main()
