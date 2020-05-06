# python3 ./scripts/reports-page-gen.py --report ./combined.report.json --template ./scripts/reports-page-template.html --date 2019-03-26 > gorule-report.html

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
@click.option("--suppress-rule-tag", multiple=True)
def main(report, template, date, suppress_rule_tag):
    report_json = json.load(report)

    # header:
    # [
    #     {"id": "mgi"},
    #     {"id": "goa_chicken"}
    #     ...
    # ]
    header = sorted([{"id": dataset["id"]} for dataset in report_json], key=lambda h: h["id"])
    # click.echo(json.dumps(header, indent=4))

    rules_directory = os.path.normpath(os.path.join(os.path.dirname(this_script), "../metadata/rules"))

    rules_descriptions = dict()
    # Rule Descriptions is a map of rule ID to a {"title": rule title, "tags": list of possible rule tags}
    for rule_path in glob.glob(os.path.join(rules_directory, "gorule*.md")):
        with open(rule_path) as rule_file:
            rule = yamldown.load(rule_file)[0]
            rule_id = rule["id"].lower().replace(":", "-")
            rules_descriptions[rule_id] = {
                "title": rule["title"],
                "tags": rule.get("tags", [])
            }


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
        # Rule: rule ID, messages: List of each message from parsing
        for rule, messages in dataset["messages"].items():
            if any([tag in rules_descriptions.get(rule, {}).get("tags", []) for tag in suppress_rule_tag ]):
                # For any that is passed in to be suppressed, if it is a tag in the rule, then skip the rule.
                continue

            # If we haven't added the rule, then add the messages, level, and rule ID to the value (keyed to the rule ID)
            if rule not in rule_by_dataset:
                level = messages[0]["level"].lower() if len(messages) > 0 else "info"
                rule_by_dataset[rule] = {
                    dataset["id"]: len(messages),
                    "level": level,
                    "rule": rule
                }
            else:
                rule_by_dataset[rule][dataset["id"]] = len(messages)
                # We can only increase `level`. If level is info, but messages are warn or error, than we reset.
                # If level is warning, then only error will replace, since it's "higher".
                if rule_by_dataset[rule]["level"] == "info" and len(messages) > 0 and messages[0]["level"].lower() in ["error", "warning"]:
                    rule_by_dataset[rule]["level"] = messages[0]["level"].lower()
                elif rule_by_dataset[rule]["level"] == "warning" and len(messages) > 0 and messages[0]["level"].lower() == "error":
                    rule_by_dataset[rule]["level"] = "error"


    # Add empty cells in as 0s
    for h in header:
        # h: {"id": "mgi"}
        for rule, amounts in rule_by_dataset.items():
            # rule: "gorule-0000006", amounts: {"mgi": 20, "sgd": 11, ...}
            # If the header name (the dataset name) is not accounted in the amounts dict, add it as 0
            if h["id"] not in amounts:
                amounts[h["id"]] = 0

    # Sort the list of rules -> {set of dataset:number of messages} by rule title (alphabet)
    rows = sorted(rule_by_dataset.values(), key=lambda n: n["rule"])

    # Each "cell" is actually a row in the table.
    # Each `v` below is a cell contents along the row
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
            "title": rules_descriptions.get(row["rule"], {}).get("title", ""),
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
