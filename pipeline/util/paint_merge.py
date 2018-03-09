import click
import os
import yaml
import gzip
import shutil
import re
from typing import List

@click.group()
def cli():
    pass

@cli.command()
@click.argument("merger", type=click.Path(exists=True))
@click.argument("merge_into", type=click.Path(exists=True))
def merge(merger, merge_into):
    append_zip_into_zip(merger, merge_into)

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

    final_zip = gzip.GzipFile("", mode="wb", fileobj=open(final, "wb"))
    merger_zip = gzip.GzipFile(merger)
    merge_into_zip = gzip.GzipFile(merge_into)

    merge_into_header, merge_into_annotations = header_and_annotations(gzip.GzipFile(merge_into))
    merger_header, merger_annotations = header_and_annotations(merger_zip)
    all_lines = merge_into_header + paint_header(merger_header, merger) + merge_into_annotations + merger_annotations

    final_zip.write("\n".join(all_lines).encode("utf-8"))


def header_and_annotations(merge_into_zip: gzip.GzipFile) -> (List, List):
    headers = []
    annotations = []

    for line in merge_into_zip.readlines():
        line_utf = line.decode("utf-8").strip()
        if line_utf.startswith("!"):
            headers.append(line_utf)
        else:
            annotations.append(line_utf)

    return (headers, annotations)

def paint_header(header: List[str], filename: str) -> List[str]:
    return ["! merged_from " + os.path.basename(filename) + ": " + line.split("!")[1].strip() for line in header if not re.match("![\s]*gaf.?version", line) ]


if __name__ == "__main__":
    cli()
