#!/usr/bin/env python3

import click
import yaml
import glob
import os
import collections

from typing import List, Dict

Dataset = collections.namedtuple("Dataset", ["group", "dataset", "url", "type", "compression"])

@click.group()
def cli():
    pass


@cli.command()
@click.option("--datasets", "-d", "datasets_dir", type=click.Path(exists=True), required=True, help="Path to directory with all the dataset group yamls")
@click.option("--groups", "-g", required=True, help="Space separated list of groups. This filters the full set of groups to only these groups")
@click.option("--excludes", "-x", default=None, help="Space separated list of datasets to exclude, to be subtracted from the set of datasets in the given groups")
def paths(datasets_dir, groups, excludes):

    # click.echo("Using {} for datasets".format(datasets_dir))
    resource_metadata = load_resource_metadata(datasets_dir)
    if groups is not None:
        groups_list = groups.split() # Split by whitespace
        resource_metadata = list(filter(lambda r: r["id"] in groups_list, resource_metadata))

    # click.echo("Found {} dataset files".format(len(resource_metadata)))

    dataset_targets = transform_download_targets(resource_metadata)
    # Filter excludes
    if excludes is not None:
        excludes_list = excludes.split()
        dataset_targets = list(filter(lambda t: t.dataset not in excludes_list, dataset_targets))

    # Set notation to erase duplicates
    paths = {"target/groups/{group}/{dataset}".format(group=d.group, dataset=d.dataset) for d in dataset_targets}

    click.echo(" ".join(paths))


def load_resource_metadata(datasets_dir) -> List[Dict]:
    """
    Loads all the YAML files in `datasets_dir` as dicts in a list.
    """
    dataset_paths = glob.glob(os.path.join(datasets_dir, "*.yaml"))
    loaded_yamls = []
    for path in dataset_paths:
        with open(path) as dataset_file:
            dataset = dict()
            if getattr(yaml, "FullLoader", None) == None:
                # We're in PyYaml < 5.1
                dataset = yaml.load(dataset_file)
            else:
                dataset = yaml.load(dataset_file, Loader=yaml.FullLoader)

            loaded_yamls.append(dataset)

    return loaded_yamls


def transform_download_targets(resource_metadata, types=None) -> List[Dataset]:
    """
    Turns the dataset dict into Dataset objects to be used to make download paths, etc
    [
        ("goa", "goa_human", "http://laksdj/blah.gaf.gz")
    ]
    Naturally only bring in datasets of the specified types. If a source is in
    the types list, then it gets transformed. If types is None, all types are assumed.
    """
    transformed_dataset_targets = []
    for g in resource_metadata:
        group = g["id"]
        for d in g["datasets"]:
            t = d["type"]
            if types != None and t not in types:
                # Skip if the type of this dataset is not one we want specified above
                continue

            if d.get("exclude", False):
                # Skip if the dataset is excluded by default in the metadata
                continue


            dataset = d["dataset"]
            url = d["source"]
            comp = d.get("compression", None)
            transformed_dataset_targets.append(Dataset(group=group, dataset=dataset, url=url, type=t, compression=comp))

    return transformed_dataset_targets

if __name__ == "__main__":
    cli()
