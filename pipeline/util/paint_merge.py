import click
import os
import yaml
import gzip
import shutil

@click.group()
def cli():
    pass

@cli.command()
@click.argument("paint_metadata", type=click.File("r"))
@click.argument("groups_dir", type=click.Path(exists=True))
def merge(paint_metadata, groups_dir):
    metapaint = yaml.load(paint_metadata)
    merger_groups = metapaint["datasets"]
    merge_data = {
        dataset_id_to_path(dataset["id"], groups_dir): merges_into_path(dataset["merges_into"], groups_dir)
            for dataset in merger_groups if "merges_into" in dataset and dataset["merges_into"] != "other" 
    }

    for paint_gaf, mod_gaf in merge_data.items():
        click.echo("merging {} into {}".format(paint_gaf, mod_gaf))
        append_zip_into_zip(paint_gaf, mod_gaf)

def dataset_id_to_path(dataset_id, groups_dir):
    paint_dir = dataset_id.split(".")[0]
    return os.path.abspath(os.path.join(groups_dir, paint_dir, "{}.gz".format(dataset_id)))

def merges_into_path(merges_into, groups_dir):
    merge_into_gaf = "{}.gaf.gz".format(merges_into)
    return os.path.abspath(os.path.join(groups_dir, merges_into, merge_into_gaf))

def append_zip_into_zip(merger, merge_into):
    if not os.path.exists(merger):
        click.echo(click.style("{} does not exist, skipping".format(merger), fg="red"), err=True)
        return

    if not os.path.exists(merge_into):
        click.echo(click.style("{} does not exist, skipping".format(merge_into), fg="red"), err=True)
        return

    base, leaf = os.path.split(merge_into)
    merged_leaf = leaf.split(".gaf.gz")[0] + "_merged.gaf.gz"
    final = os.path.join(base, merged_leaf)

    final_zip = gzip.GzipFile(final, mode="w")
    merger_zip = gzip.GzipFile(merger)
    merge_into_zip = gzip.GzipFile(merge_into)

    final_zip.write(merge_into_zip.read())
    final_zip.write(merger_zip.read())


if __name__ == "__main__":
    cli()
