# python3 ./scripts/reports-go-cam-stats.py --directory /path/to/go_cam_stats_output --template ./scripts/go-cam-stats-template.html --output /path/to/output

import click
import pystache
import json
import datetime
import os
import glob
import re


def extract_column_name(filename, prefix):
    """Extract column name from filename by stripping the prefix and .json suffix.

    e.g. stats_by_curator_0000-0001-7299-6685.json -> 0000-0001-7299-6685
         stats_by_group_flybase.org.json -> flybase.org
    """
    base = os.path.basename(filename)
    match = re.match(r"{}(.+)\.json".format(re.escape(prefix)), base)
    if match:
        return match.group(1)
    return base.replace(".json", "")


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


@click.command()
@click.option("--directory", type=click.Path(exists=True), required=True)
@click.option("--template", type=click.File("r"), required=True)
@click.option("--output", type=click.Path(), required=True)
@click.option("--date", default=str(datetime.date.today()))
def main(directory, template, output, date):
    os.makedirs(output, exist_ok=True)
    template_str = template.read()

    # --- Aggregate stats ---
    aggregate_files = sorted(glob.glob(os.path.join(directory, "aggregate*.json")))
    if not aggregate_files:
        click.echo("No aggregate JSON files found in {}".format(directory), err=True)
        return

    entities = []
    for fpath in aggregate_files:
        with open(fpath) as f:
            entities.append(json.load(f))

    # Column headers from the "entity" field
    column_names = [e["entity"] for e in entities]
    # Exclude "entity" from rows since it is the column header
    for e in entities:
        e.pop("entity", None)

    header, rows = build_table_data(entities, column_names)

    links = [
        {"href": "go-cam-curator-stats.html", "label": "Stats by Curator"},
        {"href": "go-cam-group-stats.html", "label": "Stats by Group"},
    ]

    render_and_write(template_str, {
        "title": "GO-CAM Aggregate Statistics",
        "header": header,
        "rows": rows,
        "links": links,
        "date": date,
    }, os.path.join(output, "go-cam-aggregate-stats.html"))

    # --- Stats by curator ---
    curator_dir = os.path.join(directory, "stats_by_curator")
    if os.path.isdir(curator_dir):
        curator_files = sorted(glob.glob(os.path.join(curator_dir, "stats_by_curator_*.json")))
        if curator_files:
            curator_data = []
            curator_columns = []
            for fpath in curator_files:
                with open(fpath) as f:
                    curator_data.append(json.load(f))
                curator_columns.append(extract_column_name(fpath, "stats_by_curator_"))

            header, rows = build_table_data(curator_data, curator_columns)

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
            click.echo("No curator stats files found in {}".format(curator_dir), err=True)
    else:
        click.echo("stats_by_curator directory not found in {}".format(directory), err=True)

    # --- Stats by group ---
    group_dir = os.path.join(directory, "stats_by_group")
    if os.path.isdir(group_dir):
        group_files = sorted(glob.glob(os.path.join(group_dir, "stats_by_group_*.json")))
        if group_files:
            group_data = []
            group_columns = []
            for fpath in group_files:
                with open(fpath) as f:
                    group_data.append(json.load(f))
                group_columns.append(extract_column_name(fpath, "stats_by_group_"))

            header, rows = build_table_data(group_data, group_columns)

            links = [
                {"href": "go-cam-aggregate-stats.html", "label": "Aggregate Statistics"},
                {"href": "go-cam-curator-stats.html", "label": "Stats by Curator"},
            ]

            render_and_write(template_str, {
                "title": "GO-CAM Stats by Group",
                "header": header,
                "rows": rows,
                "links": links,
                "date": date,
            }, os.path.join(output, "go-cam-group-stats.html"))
        else:
            click.echo("No group stats files found in {}".format(group_dir), err=True)
    else:
        click.echo("stats_by_group directory not found in {}".format(directory), err=True)


if __name__ == "__main__":
    main()