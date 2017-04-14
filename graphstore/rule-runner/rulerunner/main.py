import yaml
import json
import pykwalify
import click

from pykwalify.core import Core

import logging
import glob
from typing import Union
from rulerunner import rule


SCHEMA = "schema/rules.yml"

@click.group(invoke_without_command=True)
@click.pass_context
@click.argument("rules", type=click.Path(exists=True))
@click.argument("endpoint")
@click.option("--schema", type=click.Path(exists=True))
@click.option("--out", type=click.File("w"))
def cli(ctx, rules, endpoint, schema, out) -> None:
    schema = SCHEMA if not schema else schema
    if ctx.invoked_subcommand is None:
        click.echo("Looking for rules in {}".format(rules))
        click.echo("Querying endpoint {}".format(endpoint))

        results = []
        for rule_file in glob.glob("{}/*.yml".format(rules)):
            click.echo("Found {}".format(rule_file))
            validate(rule_file, schema)
            r = load_yaml(rule_file)
            results.append(rule.test_rule(r, endpoint))

        for result in results:
            click.echo("{name}: {passing}".format(name=result.rule["rule"]["name"], passing=result.passing))

        if out is not None:
            json.dump(rule.all_rules_dict(results), out, indent=4)

def load_yaml(path):
    """
    Loads a YAML file at path and returns it as a dictionary.
    """
    try:
        with open(path, "r") as f:
            return yaml.load(f)

    except Exception as e:
        raise click.Exception(e.message)

def validate(yml_path: str, schema_path: str):
    """
    This uses pykwalify to validate the given Rule YAML file against the Rule
    schema.
    """
    try:
        c = Core(source_file=yml_path, schema_files=[schema_path])
        c.validate(raise_exception=True)
    except pykwalify.errors.SchemaError as e:
        raise click.ClickException(e.msg)
