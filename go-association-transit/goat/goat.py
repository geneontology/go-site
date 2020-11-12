import click
import os

from goat import parse_into_gpad

"""
Taking an input annotation file, output a valid gpad version 2, report md, json, and gpi
"""

@click.group()
def cli():
    """
    Welcome to GOAT, the Gene Ontology Association Transit, where we safely and quickly
    move your associations from downloaded, to validated, to GO-CAM, and other stations
    along the way.

    All Aboard!
    """
    pass


@cli.command()
@click.argument("source", type=click.Path(exists=True, readable=True, dir_okay=False, resolve_path=True))
@click.option("--gpi", "-g", "gpis", multiple=True, type=click.Path(exists=True, readable=True, dir_okay=False, resolve_path=True))
@click.option("--ontology", "-o", required=True, type=click.Path(exists=True, readable=True, dir_okay=False, resolve_path=True))
@click.option("--target", "-t", required=True, type=click.Path(exists=False, resolve_path=True))
def validate(source, gpis, ontology, target):
    # parse_into_gpad.process_single_file()
    click.echo("hello")
    os.makedirs(target, exist_ok=True)

    parse_into_gpad.process_single_file(source, gpis, ontology, target)


if __name__ == "__main__":
    cli()
