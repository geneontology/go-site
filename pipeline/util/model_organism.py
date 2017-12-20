import click
import os
import sys
import yaml
import re

@click.command()
@click.argument("taxon")
@click.argument("dataset_path", type=click.Path(exists=True))
@click.option("--silent", "-s", is_flag=True)
def mod(taxon, dataset_path, silent):

    if not re.match("(NCBITaxon|taxon):[0-9]+", taxon):
        return
    else:
        taxonid = taxon.split(":")[1]
        taxon = "NCBITaxon:{}".format(taxonid)

    if taxon == "NCBITaxon:1":
        return

    datasets = [os.path.abspath(os.path.join(dataset_path, dataset)) for dataset in os.listdir(dataset_path) if dataset.endswith("yaml") and dataset != "goa.yaml"]
    model_organisms = []
    for group in datasets:
        with open(group) as group_file:
            group_data = yaml.load(group_file)
            gaf_data = [data for data in group_data["datasets"] if data["type"] == "gaf"]
            for gaf in gaf_data:
                if gaf["taxa"] and taxon in gaf["taxa"]:
                    if not silent:
                        click.echo(gaf["dataset"])

                    sys.exit(1)


if __name__ == "__main__":
    mod()
