
import click
import os
import json
import pathlib

from typing import List, Dict

from goat import sources
from goat import parse_into_gpad

from ontobio.io import gaference

"""
Taking an input annotation file, output a valid gpad version 2, report md, json, and gpi
"""

@click.group()
def cli():
    """
    Welcome to GOAT, the Gene Ontology Association Transportation, where we safely and quickly
    move your associations from downloaded, to validated, to GO-CAM, and other stations
    along the way.

    All Aboard!
    """
    pass


@cli.command()
@click.argument("source", type=click.Path(exists=True, readable=True, dir_okay=True, resolve_path=True))
@click.option("--ontology", "-o", required=True, type=click.Path(exists=True, readable=True, dir_okay=False, resolve_path=True))
@click.option("--inferences", "-I", default=[], multiple=True, required=False, type=click.Path(exists=True, readable=True, resolve_path=True))
@click.option("--target", "-t", required=True, type=click.Path(exists=False, resolve_path=True))
def pristine(source, ontology, inferences, target):
    # parse_into_gpad.process_single_file()
    click.echo("hello")
    os.makedirs(target, exist_ok=True)

    loaded_inferences = gaference.load_gaferencer_inferences_from_files(inferences)

    source = pathlib.Path(source)
    aligned_sources = [] # type: List[sources.PairedSource]
    if source.is_file():
        aligned = sources.align_source(source)
        if aligned is None:
            raise click.ClickException("{} is not a proper GAF/GPAD source file!".format(source))
        aligned_sources.append(sources.align_source(source))
    else:
        # If it's not a file, assume it's a directory
        aligned_sources = sources.align_sources(source)

    for s in aligned_sources:
        if not s.unmatched:
            # If we have either a gpi with a gpad, or a gaf
            gpi_list = [str(s.gpi)] if s.gpi else []
            click.echo("Parsing {}".format(s.annotation))
            parse_into_gpad.process_single_file(str(s.annotation), gpi_list, ontology, target, annotation_inferences=loaded_inferences)


if __name__ == "__main__":
    cli()
