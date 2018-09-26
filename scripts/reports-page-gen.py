import click
import pystache
import json
import datetime


@click.command()
@click.option("--report", type=click.File("r"), required=True)
@click.option("--template", type=click.File("r"), required=True)
def main(report, template):
    report_json = json.load(report)

    header = sorted([{"id": dataset["id"]} for dataset in report_json], key=lambda h: h["id"])
    # click.echo(json.dumps(header, indent=4))

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
    for dataset in report_json:
        for rule, messages in dataset["messages"].items():
            if rule not in rule_by_dataset:
                rule_by_dataset[rule] = {
                    dataset["id"]: len(messages),
                    "rule": rule
                }
            else:
                rule_by_dataset[rule][dataset["id"]] = len(messages)

    # Add empty cells in as 0s
    for h in header:
        for rule, amounts in rule_by_dataset.items():
            if h["id"] not in amounts:
                amounts[h["id"]] = 0

    # click.echo(json.dumps(rule_by_dataset, indent=4))
    rows = sorted(rule_by_dataset.values(), key=lambda n: n["rule"])
    # print(json.dumps(rows, indent=4))

    cells = []
    for row in rows:
        contents = []
        for key, val in row.items():
            if key == "rule":
                continue

            v = {
                "dataset": key,
                "amount": val
            }
            contents.append(v)

        contents = sorted(contents, key=lambda d: d["dataset"])
        cell = {
            "rule": row["rule"],
            "messages": contents
        }
        cells.append(cell)

    rendered = pystache.render(template.read(), {"header": header, "rules": cells, "date": str(datetime.date.today())})

    print(rendered)
    # rendered = Template(template.read()).render({"header": sorted(header, key=lambda n: n["id"]),
    #     "rules": sorted(rule_by_dataset.values(), key=lambda n: n["rule"])})
    # print(rendered)

if __name__ == "__main__":
    main()
