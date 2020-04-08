#!/usr/bin/env python

import click
import yaml
import glob
import os

@click.command()
@click.option("--datasets", "-d", type=click.Path(exists=True), required=True, help="Path to the datasets yaml in go-site metadata")
def validate(datasets):

    dataset_paths = glob.glob(os.path.join(datasets, "*.yaml"))

    rules = [gpad_must_have_gpi_from_this_dataset]
    found_an_error = False

    for dataset_yaml in dataset_paths:
        with open(dataset_yaml) as ds:
            click.echo("Validating {}".format(dataset_yaml))
            dataset = yaml.load(ds)
            for rule in rules:
                errors = rule(dataset)
                if errors != "":
                    found_an_error = True
                    click.echo(errors, err=True)

    if found_an_error:
        raise click.ClickException("Failed to validate dataset yamls at {}".format(datasets))


def gpad_must_have_gpi_from_this_dataset(dataset) -> str:
    errors = []
    found_gpi = []
    for ds in dataset["datasets"]:
        if ds["type"] == "gpad":
            # Must be gpi:
            if "gpi" in ds:
                found_gpi.append(ds["gpi"])
                # print("gpi is {}".format(ds["gpi"]))
            else:
                errors.append("* '{}' must have a defined gpi set".format(ds["id"]))

    # Check the found_gpis for existing in this file
    ids = [ds["id"] for ds in dataset["datasets"]]
    for found in found_gpi:
        for gpi in found:
            if gpi not in ids:
                errors.append("* Could not find '{}' as an id from in the list of datasets in '{}': {}".format(gpi, dataset["id"], ", ".join(ids)))

    return "\n".join(["    {}".format(e) for e in errors])


if __name__ == "__main__":
    validate()
