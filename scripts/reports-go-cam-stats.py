# python3 ./scripts/reports-go-cam-stats.py --directory /path/to/go_cam_stats_output --template ./scripts/go-cam-stats-template.html > go-cam-stats-report.html

import click
import pystache
import json
import datetime
import os
import glob


@click.command()
@click.option("--directory", type=click.Path(exists=True), required=True)
@click.option("--template", type=click.File("r"), required=True)
@click.option("--date", default=str(datetime.date.today()))
def main(directory, template, date):
    aggregate_files = sorted(glob.glob(os.path.join(directory, "aggregate*.json")))

    if not aggregate_files:
        click.echo("No aggregate JSON files found in {}".format(directory), err=True)
        return

    # Load all aggregate JSON files
    entities = []
    for fpath in aggregate_files:
        with open(fpath) as f:
            entities.append(json.load(f))

    # header: column headers from the "entity" field of each file
    # e.g. [{"id": "Curator"}, {"id": "Group"}, {"id": "Model"}]
    header = [{"id": e["entity"]} for e in entities]

    # Collect the non-array field names from the first file (all files share the same structure).
    # Exclude "entity" since it becomes the column header.
    field_names = [
        key for key, val in entities[0].items()
        if not isinstance(val, list) and key != "entity"
    ]

    # Build rows: one row per non-array field
    rows = []
    for field in field_names:
        values = []
        for e in entities:
            values.append({"value": e.get(field, "")})
        rows.append({
            "field": field,
            "field_display": field.replace("_", " "),
            "values": values,
        })

    rendered = pystache.render(template.read(), {
        "header": header,
        "rows": rows,
        "date": date,
    })

    print(rendered)


if __name__ == "__main__":
    main()