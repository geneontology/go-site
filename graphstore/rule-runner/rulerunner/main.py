import yaml
import json
import pykwalify
import click
import os
import re
import logging
import glob
import yamldown
import rdflib

from typing import Union, Dict

from pykwalify.core import Core

from rulerunner import rule

SCHEMA = os.path.join(os.getcwd(), "../metadata/rules.schema.yaml")

class RuleParameter(click.Path):
    name = "rule"

    def __init__(self):
        super(RuleParameter, self).__init__(exists=True, file_okay=True, dir_okay=False, readable=True, resolve_path=True)

    # accept: /path/to/yamldown.md OR GORULE:nnnnnnn OR nnnnnnn OR N
    def convert(self, value: str, param, ctx):
        path = ""
        if self.is_gorule(value):
            name = "{name}.md".format(name=value.replace(":", "-").lower())
            path = self.build_rule_path(name)
        elif self.is_just_id(value):
            rule_name = "gorule-{id}.md".format(id=value)
            path = self.build_rule_path(rule_name)
        elif self.is_int(value):
            rule_id = "{:0>7}".format(value)
            name = "gorule-{id}.md".format(id=rule_id)
            path = self.build_rule_path(name)
        else:
            path = value

        return super(RuleParameter, self).convert(os.path.normpath(path), param, ctx)

    def build_rule_path(self, gorule: str) -> str:
        rules_path = rules_directory()
        return os.path.join(rules_path, gorule)

    def is_gorule(self, value: str) -> bool:
        return re.match(r"GORULE:[\d]{7}", value) != None

    def is_int(self, value) -> bool:
        return value.isdigit()

    def is_just_id(self, value) -> bool:
        return re.match(r"[\d]:{7}", value)


@click.group()
def cli() -> None:
    pass

@cli.command()
@click.argument("endpoint")
@click.option("rules_dir", "--rules", type=click.Path(exists=True, readable=True, resolve_path=True, dir_okay=True, file_okay=False))
@click.option("--schema", type=click.Path(exists=True, readable=True, dir_okay=False))
@click.option("--verbose", "-V", is_flag=True)
@click.option("-o", "--out", type=click.File("w"))
def group(endpoint, rules_dir, schema, verbose, out) -> None:

    gorules_paths = glob.glob(os.path.join(rules_directory(path=rules_dir), "gorule-*.md"))
    rules = [load_yamldown(path) for path in gorules_paths if rule.sparql_from(load_yamldown(path))]
    s = schema if schema else SCHEMA
    results = []
    for r in rules:
        validate(r, s)
        result = rule.test_rule(r, endpoint)
        results.append(result)
        click.echo(result.short_summary())

        if result.returned and verbose:
            click.echo(result.verbose_readable())

    if out:
        json.dump(rule.generate_results_json(results), out, indent=4)

@cli.command()
@click.pass_context
@click.argument("endpoint")
@click.option("rule_path", "--rule", type=RuleParameter(), required=True)
@click.option("-V", "--verbose", is_flag=True)
@click.option("--schema", type=click.Path(exists=True, readable=True, dir_okay=False))
@click.option("-o", "--out", type=click.File("w"))
def test(ctx, endpoint, rule_path, verbose, schema, out):
    r = load_yamldown(rule_path)
    s = schema if schema else SCHEMA
    validate(r, s)
    if not rule.sparql_from(r):
        raise click.ClickException("No SPARQL implementation for this rule.")

    result = rule.test_rule(r, endpoint)
    click.echo(result.short_summary())

    if result.returned and verbose:
        click.echo(result.verbose_readable())

    if out:
        json.dump(result.jsonify(), out, indent=4)

    if result.passing in ["Warn", "Fail"]:
        ctx.exit(1)


@cli.command()
@click.argument("turtle", type=click.Path(exists=True))
@click.option("sparql_file", "--file", "-f", type=click.File(), required=True)
def local(turtle, sparql_file):
    g = rdflib.ConjunctiveGraph()
    g.parse(turtle, format="trig")
    results = g.query(sparql_file.read())
    click.echo(results.serialize(format="txt"))

@cli.command()
@click.option("rules_dir", "--rules", type=click.Path(exists=True, readable=True, resolve_path=True, dir_okay=True, file_okay=False))
@click.option("--schema", type=click.Path(exists=True, readable=True, dir_okay=False))
def valid(rules_dir, schema):
    validation_failed = False
    gorules_paths = glob.glob(os.path.join(rules_directory(path=rules_dir), "gorule-*.md"))
    validations = {}
    for path in gorules_paths:
        try:
            validations[path] = load_yamldown(path)
        except:
            validations[path] = "Invalid YAML"
            validation_failed = True

    # click.echo(json.dumps(validations, indent=4))
    s = schema if schema else SCHEMA
    click.echo(SCHEMA)
    for (p, r) in validations.items():
        # click.echo("{}: {}".format(p, r))
        if isinstance(r, dict):
            try:
                validate(r, s)
                validations[p] = "Valid"
            except click.ClickException as e:
                validations[p] = e.message
                validation_failed = True

    for (p, r) in validations.items():
        click.echo("{path}: {status}".format(path=p, status=r))

    if validation_failed:
        raise click.ClickException("Failed Validation")

def rules_directory(path=None):
    if path is None:
        return os.path.join(os.getcwd(), "../metadata/rules/")
    else:
        return path

def load_yamldown(path):
    """
    Loads a YAML file at path and returns it as a dictionary.
    """
    try:
        with open(path, "r") as f:
            load = yamldown.load(f)[0]
            if load == None:
                raise click.ClickException("No rule present at {}".format(path))

            return load

    except Exception as e:
        raise click.ClickException(str(e))

def validate(yml_rule: Dict, schema_path: str):
    """
    This uses pykwalify to validate the given Rule YAML file against the Rule
    schema.
    """
    try:
        c = Core(source_data=yml_rule, schema_files=[schema_path], fix_ruby_style_regex=True)
        c.validate(raise_exception=True)
    except pykwalify.errors.SchemaError as e:
        raise click.ClickException(e.msg)
