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
import gzip

from typing import Union, Dict

from pykwalify.core import Core

from rulerunner import rule

SCHEMA = os.path.join(os.getcwd(), "../metadata/rules.schema.yml")

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


class GlobPath(click.Path):
    name = "glob"

    def __init__(self):
        super(GlobPath, self).__init__(exists=True, file_okay=True, dir_okay=False, readable=True, resolve_path=True)

    def convert(self, value: str, param, ctx):
        paths = glob.glob(value)
        p = [super(GlobPath, self).convert(path, param, ctx) for path in paths]
        click.echo("In convert glob!")
        click.echo(p)
        return p


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
@click.pass_context
@click.argument("ttl", type=click.Path(exists=True), required=True, nargs=-1)
def sanity(ctx, ttl):
    click.echo("Sanity check")
    failed_sanity_check = False

    click.echo(ttl)
    # all_ttl_files = []
    # for files in ttl:
    #     all_ttl_files.extend(files)
    #
    # click.echo(all_ttl_files)

    for ttl_path in ttl:
        with open(ttl_path, 'rb') as a_ttl:
            click.echo("Using {}".format(a_ttl.name))

            target_lines = lines_in_file(find_gaf_zip_from_ttl(a_ttl.name))
            if target_lines == -1:
                click.echo("No corresponding gaf, skipping...")
                continue

            click.echo("{} lines in corresponding gaf".format(target_lines))

            click.echo("loading ttl...")
            graph = rdflib.ConjunctiveGraph()
            graph.parse(a_ttl, format="turtle")

            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../queries/count_annotons.sparql")) as qf:
                results = graph.query(qf.read())
                json_results = json.loads(results.serialize(format="json"))
                annoton_count = [int(binding["count"]["value"]) for binding in json_results["results"]["bindings"] if "count" in binding][0]
                click.echo("{} annotons found".format(annoton_count))

        if annoton_count < target_lines/2:
            click.echo("Fewer than 50% annotons found from the GAF! Sanity Check Failed!")
        else:
            click.echo("Annoton count within reasonable parameters.")

    if failed_sanity_check:
        ctx.exit(1)

def find_gaf_zip_from_ttl(ttl_path):
    group = os.path.basename(ttl_path).split(".")[0].split("_")[0]
    return os.path.join(os.path.dirname(ttl_path), "{group}.gaf.gz".format(group=group))

def lines_in_file(path):
    try:
        with gzip.open(path, "rb") as pf:
            return sum(1 for line in pf if not str(line).startswith("!"))
    except:
        return -1


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
            return yamldown.load(f)[0]

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
