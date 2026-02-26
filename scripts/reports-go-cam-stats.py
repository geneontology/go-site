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


def render_and_write(template_str, context, output_path):
    """Render a mustache template and write to output_path."""
    rendered = pystache.render(template_str, context)
    with open(output_path, "w") as f:
        f.write(rendered)
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


@click.command()
@click.option("--directory", type=click.Path(exists=True), required=True)
@click.option("--template", type=click.File("r"), required=True)
@click.option("--output", type=click.Path(), required=True)
@click.option("--metadata", type=click.Path(exists=True), required=False, default=None,
              help="Directory containing users.yaml and groups.yaml metadata files")
@click.option("--date", default=str(datetime.date.today()))
def main(directory, template, output, metadata, date):
    os.makedirs(output, exist_ok=True)
    template_str = template.read()

    # Load metadata if provided
    users_by_uri = {}
    groups_by_id = {}
    if metadata:
        users_by_uri = load_users(metadata)
        groups_by_id = load_groups(metadata)

    # --- Aggregate stats (Model only) ---
    aggregate_file = os.path.join(directory, "aggregate_model_stats.json")
    if not os.path.exists(aggregate_file):
        click.echo("No aggregate_model_stats.json found in {}".format(directory), err=True)
        return

    with open(aggregate_file) as f:
        model_entity = json.load(f)

    column_name = model_entity.pop("entity", "Model")
    header, rows = build_table_data([model_entity], [column_name])

    links = [
        {"href": "go-cam-group-stats.html", "label": "Stats by Group"},
    ]

    render_and_write(template_str, {
        "title": "GO-CAM Aggregate Statistics",
        "header": header,
        "rows": rows,
        "links": links,
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

        links = [
            {"href": "go-cam-aggregate-stats.html", "label": "Aggregate Statistics"},
            {"href": "go-cam-group-stats.html", "label": "Stats by Group"},
        ]

        render_and_write(template_str, {
            "title": "GO-CAM Stats by Curator",
            "header": header,
            "rows": rows,
            "links": links,
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

            links = [
                {"href": "go-cam-aggregate-stats.html", "label": "Aggregate Statistics"},
            ]

            render_and_write(template_str, {
                "title": "GO-CAM Stats by Group",
                "header": header,
                "rows": rows,
                "links": links,
                "date": date,
            }, os.path.join(output, "go-cam-group-stats.html"))

            # --- Create per-group curator pages ---
            for group_uri, label, page_fn in zip(group_uris, group_labels, group_page_filenames):
                curators_in_group = group_to_curators.get(group_uri, [])
                if not curators_in_group:
                    # No curators found for this group via metadata, skip
                    click.echo("No curators found for group '{}' via metadata".format(label), err=True)
                    continue

                grp_curator_data = [c[0] for c in curators_in_group]
                grp_curator_names = [c[1] for c in curators_in_group]

                grp_header, grp_rows = build_table_data(grp_curator_data, grp_curator_names)

                grp_links = [
                    {"href": "go-cam-aggregate-stats.html", "label": "Aggregate Statistics"},
                    {"href": "go-cam-group-stats.html", "label": "Stats by Group"},
                ]

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

                other_links = [
                    {"href": "go-cam-aggregate-stats.html", "label": "Aggregate Statistics"},
                    {"href": "go-cam-group-stats.html", "label": "Stats by Group"},
                ]

                render_and_write(template_str, {
                    "title": "GO-CAM Curator Stats - Other",
                    "header": other_header,
                    "rows": other_rows,
                    "links": other_links,
                    "date": date,
                }, os.path.join(output, "go-cam-group-curator-stats-other.html"))

        else:
            click.echo("No group stats files found in {}".format(group_dir), err=True)
    else:
        click.echo("stats_by_group directory not found in {}".format(directory), err=True)


if __name__ == "__main__":
    main()
