import click
import pystache
import json
import datetime
import yamldown
import os
import glob

this_script = os.path.abspath(__file__)


@click.command()
@click.option("--report", type=click.File("r"), required=True)
@click.option("--template", type=click.File("r"), required=True)
@click.option("--date", default=str(datetime.date.today()))
def main(report, template, date):
    report_json = json.load(report)

    header = sorted([{"id": dataset["id"]} for dataset in report_json], key=lambda h: h["id"])
    # click.echo(json.dumps(header, indent=4))

    rules_directory = os.path.normpath(os.path.join(os.path.dirname(this_script), "../metadata/rules"))

    rules_descriptions = dict()
    for rule_path in glob.glob(os.path.join(rules_directory, "gorule*.md")):
        with open(rule_path) as rule_file:
            rule = yamldown.load(rule_file)[0]
            rule_id = rule["id"].lower().replace(":", "-")
            rules_descriptions[rule_id] = rule["title"]


    rule_by_dataset = dict()
    # {
    #     "gorule-0000005": {
    #         "mgi": 30,
    #         "sgd": 25,
    #         "blah": 45
    #     },
    #     "gorule-0000006": {
    #         "mgi": 20,
    #         "sgd": 11
    #     }
    # }

    # [
    #     {
    #         "rule": "gorule-0000005",
    #         "dataset": [
    #             {
    #                 "id": "mgi",
    #                 "messages": 20
    #             }
    #         ]
    #     }
    # ]
    ###################################
    # {
    #     "gorule-0000005": {
    #         "rule": "gorule-0000005",
    #         "mgi": 20,
    #         "sgd": 11,
    #         "wb": 300
    #     },
    #     "other": {
    #         "rule": "other",
    #         "mgi": 25,
    #         "sgd": 25,
    #         "wb": 33
    #     }
    # }

    bootstrap_context_mapping = {
        "warning": "warning",
        "error": "danger",
        "info": "primary"
    }

    for dataset in report_json:
        for rule, messages in dataset["messages"].items():
            if rule not in rule_by_dataset:
                level = messages[0]["level"].lower() if len(messages) > 0 else "info"
                rule_by_dataset[rule] = {
                    dataset["id"]: len(messages),
                    "level": level,
                    "rule": rule
                }
            else:
                rule_by_dataset[rule][dataset["id"]] = len(messages)
                rule_by_dataset[rule]["level"] = messages[0]["level"].lower() if len(messages) > 0 else "info"

    # Add empty cells in as 0s
    for h in header:
        for rule, amounts in rule_by_dataset.items():
            if h["id"] not in amounts:
                amounts[h["id"]] = 0

    # click.echo(json.dumps(rule_by_dataset, indent=4))
    rows = sorted(rule_by_dataset.values(), key=lambda n: n["rule"])
    # print(json.dumps(rows[0:4], indent=4))

    cells = []
    for row in rows:
        contents = []
        level = bootstrap_context_mapping[row["level"]]
        for key, val in row.items():
            if key == "rule":
                continue

            if key == "level":
                continue

            v = {
                "dataset": key,
                "amount": val,
                "has-zero-messages": val==0,
                "level": level if val > 0 else "primary"
            }
            contents.append(v)

        contents = sorted(contents, key=lambda d: d["dataset"])
        cell = {
            "rule": row["rule"],
            "title": rules_descriptions.get(row["rule"], ""),
            "messages": contents,
            "is-other": row["rule"] == "other"
        }
        cells.append(cell)

    # print(json.dumps(cells[0:4], indent=4))

    rendered = pystache.render(template.read(), {"header": header, "rules": cells, "date": date})

    print(rendered)
    # rendered = Template(template.read()).render({"header": sorted(header, key=lambda n: n["id"]),
    #     "rules": sorted(rule_by_dataset.values(), key=lambda n: n["rule"])})
    # print(rendered)

if __name__ == "__main__":
    main()
