import click
import os
import sys
import yaml
import re

@click.group()
def cli():
    pass

@cli.command()
@click.argument("dataset_dir", type=click.Path(exists=True))
@click.option("--out", "-o", type=click.File("w"))
def taxons(dataset_dir, out):
    datasets_paths = [os.path.abspath(os.path.join(dataset_dir, dataset)) for dataset in os.listdir(dataset_dir) if dataset.endswith("yaml")]
    taxa = set([taxon for path in datasets_paths for taxon in read_taxa_for_path(path)])
    output = "\n".join(taxa)
    if not out:
        click.echo(output)
    else:
        out.write(output)

def read_taxa_for_path(dataset_path):
    with open(dataset_path) as group_file:
        group_data = yaml.load(group_file)
        gaf_data = [data for data in group_data["datasets"] if data["type"] == "gaf"]
        taxa = [ taxon for gaf in gaf_data if gaf["taxa"] for taxon in gaf["taxa"] ]
        return taxa


if __name__ == "__main__":
    cli()
