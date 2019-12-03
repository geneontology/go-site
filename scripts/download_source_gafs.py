import click
import yaml
import subprocess
import glob
import os
import collections
import shlex
import multiprocessing
import time
import shutil
import gzip

from typing import List, Dict


Dataset = collections.namedtuple("Dataset", ["group", "dataset", "url", "type", "compression"])


@click.group()
def cli():
    pass

@cli.command()
@click.option("--datasets", "-d", type=click.Path(exists=True), required=True, help="Path to directory with all the dataset yamls")
@click.option("--target", "-T", type=click.Path(exists=False), required=True, help="Path to directory where files will be stored")
@click.option("--type", multiple=True, default=["gaf"], help="The source type (gaf, gpad, etc) to download", show_default=True)
@click.option("--exclude", "-x", multiple=True, help="dataset name we want to not download")
@click.option("--only-group", "-g", multiple=True, default=None,
    help="Ignores resource groups that are not specified by this option. Datasets within the group can still be excluded with --exclude")
@click.option("--parallel", "-p", default=5, help="Number of processes to use to download files", show_default=True)
@click.option("--dry-run", is_flag=True, help="Do everything but download if  flag is set")
@click.option("--retries", "-r", default=3, help="Max number of times to download a single source before giving up on everyone", show_default=True)
@click.option("--retry-time", "-t", default=15, help="Number of seconds between retry attempts", show_default=True)
@click.option("--map-dataset-url", "-m", multiple=True, type=(str, str, str), default=dict(), help="Replacement url mapping for a dataset: `DATASET TYPE URL`")
@click.option("--replace", type=bool, default=True, help="Set to False if the download should not replace existing files")
@click.option("--zip-unzip", is_flag=True, default=False, help="Ensure all sources are both zipped and unzipped up after downloaded")
def all(datasets, target, type, exclude, only_group, parallel, dry_run, retries, retry_time, map_dataset_url, replace, zip_unzip):
    os.makedirs(os.path.abspath(target), exist_ok=True)

    dataset_mappings = { (dataset, t): url for (dataset, t, url) in map_dataset_url }

    click.echo("Using {} for datasets".format(datasets))
    resource_metadata = load_resource_metadata(datasets)
    if len(only_group) > 0:
        # Filter the groups for only ones specified in only-group (if any)
        resource_metadata = list(filter(lambda r: r["id"] in only_group, resource_metadata))
    click.echo("Found {} dataset files".format(len(resource_metadata)))

    dataset_targets = transform_download_targets(resource_metadata, types=type)
    # Filter out datasets that we want excluded
    dataset_targets = list(filter(lambda t: t.dataset not in exclude, dataset_targets))
    # apply dataset URL mapping
    dataset_targets = [ Dataset(group=ds.group, dataset=ds.dataset, url=dataset_mappings.get((ds.dataset, ds.type), ds.url), type=ds.type, compression=ds.compression)
        for ds in dataset_targets ]

    results = multi_download(dataset_targets, target, parallel=parallel, dryrun=dry_run, retries=retries, retry_time=retry_time, replace=replace) # list of (success, path)
    just_successes = [r[0] for r in results]
    if False in just_successes:
        raise click.ClickException("Failed Download")

    if zip_unzip:
        for t in results:
            # We rely here on the file extension. We can do this because we construct
            # the path based on the `compression` field in the metadata yaml, and so
            # paths with .gz should be zipped, and paths without should not be. Here
            # We zip all files with paths that end in gz
            if os.path.splitext(t[1])[1].endswith(".gz"):
                # If we end in gz, then unzip
                unzip(t[1], os.path.splitext(t[1])[0])
            else:
                # We are not zipped, so let's zip up
                zipup(t[1])



@cli.command()
@click.argument("group")
@click.option("--datasets", "-d", type=click.Path(exists=True), required=True, help="Path to directory with all the dataset yamls")
@click.option("--target", "-T", type=click.Path(exists=False), required=True, help="Path to directory where files will be stored")
@click.option("--type", multiple=True, default=["gaf"], help="The source type (gaf, gpad, etc) to download")
@click.option("--exclude", "-x", multiple=True, help="dataset name we want to not download")
@click.option("--dry-run", is_flag=True, help="Do everything but download if flag is set")
@click.option("--parallel", "-p", default=5, help="Number of processes to use to download files", show_default=True)
@click.option("--retries", "-r", default=3, help="Max number of times to download a single source before giving up on everyone", show_default=True)
@click.option("--retry-time", "-t", default=15, help="Number of seconds between retry attempts", show_default=True)
@click.option("--replace", type=bool, default=True, help="Set to False if the download should not replace existing files")
@click.option("--zip-unzip", is_flag=True, default=False, help="Ensure all sources are both zipped and unzipped up after downloaded")
def group(group, datasets, target, type, exclude, dry_run, parallel, retries, retry_time, replace, zip_unzip):
    os.makedirs(os.path.abspath(target), exist_ok=True)

    click.echo("Using {} for datasets".format(datasets))
    resource_metadata = load_resource_metadata(datasets)
    # Filter out resource metadatas that are not the one group we specified
    resource_metadata = list(filter(lambda r: r["id"] == group, resource_metadata))
    click.echo("Found {} dataset files".format(len(resource_metadata)))

    dataset_targets = transform_download_targets(resource_metadata, types=type)
    # Filter out datasets that we want excluded
    dataset_targets = list(filter(lambda t: t.dataset not in exclude, dataset_targets))
    results = multi_download(dataset_targets, target, parallel=parallel, dryrun=dry_run, retries=retries, retry_time=retry_time, replace=replace)

    just_successes = [r[0] for r in results]
    if False in just_successes:
        raise click.ClickException("Failed Download")

    if zip_unzip:
        for t in results:
            # We rely here on the file extension. We can do this because we construct
            # the path based on the `compression` field in the metadata yaml, and so
            # paths with .gz should be zipped, and paths without should not be. Here
            # We zip all files with paths that end in gz
            click.echo(t[1])
            if os.path.splitext(t[1])[1].endswith(".gz"):
                # If we end in gz, then unzip
                click.echo("{} to {}".format(t[1], os.path.splitext(t[1])[0]))
                unzip(t[1], os.path.splitext(t[1])[0])
            else:
                # We are not zipped, so let's zip up
                zipup(t[1])

@cli.command()
@click.option("--datasets", "-d", type=click.Path(exists=True), required=True, help="Path to directory with all the dataset yamls")
@click.option("--target", "-T", type=click.Path(exists=False), required=True, help="Path to directory where files will be stored")
@click.option("--source", "-S", type=click.Path(exists=False), required=True, help="Path to directory where files will be copied from")
def organize(datasets, target, source):

    absolute_target = os.path.abspath(target)
    absolute_source = os.path.abspath(source)
    os.makedirs(absolute_target, exist_ok=True)
    resource_metadata = load_resource_metadata(datasets)

    # The types don't really matter here, we're just going to move all sources anyway
    datasets = transform_download_targets(resource_metadata)
    # Key by dataset name
    datasets_dict = { d.dataset: d for d in datasets }

    # Grab all the existing files in source
    for f in glob.glob(os.path.join(absolute_source, "*-src*")):
        name = os.path.basename(f)
        dataset_name = name.split("-src", maxsplit=1)[0]
        # path -> dataset_name -> find Dataset in dict -> build target path
        found_dataset = datasets_dict.get(dataset_name, None)
        if not found_dataset:
            continue

        target_path = construct_grouped_path(found_dataset, name, absolute_target)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        shutil.copyfile(f, target_path)


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

def multi_download(dataset_targets: List[Dataset], target, parallel=5, retries=3, retry_time=20, dryrun=False, replace=True):

    pool = multiprocessing.Pool(processes=parallel)

    def _simple_callback(download_result_tuple):
        #
        success, result = download_result_tuple
        if success:
            click.echo("Downloaded successfully to {}".format(result))
        else:
            click.echo("Download failed! *{}*".format(result), err=True)
            click.echo("Aborting!")

            pool.terminate()

    async_results = [ pool.apply_async(robust_download, (dataset, target), {"retries": retries, "dryrun": dryrun, "retry_time": retry_time, "replace": replace}, _simple_callback )
        for dataset in dataset_targets ] # List[AsyncResult]

    results = [ result.get() for result in async_results ]
    return results



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

def robust_download(dataset_target: Dataset, target, retries=3, retry_time=20, dryrun=False, replace=True) -> str:
    """
    Robustly downloads the url of the `dataset_target` to a path. The path is:
    target/<group>/<dataset>.extension.gz
    """
    result = ""
    success = True
    for tries in range(0, retries):
        path = construct_download_path(dataset_target, target)
        if os.path.exists(path) and not replace:
            click.echo("{} already exists, and we are not replacing existing files".format(path))
            return (True, path)

        success, result = download_the_file(dataset_target.url, path, dryrun=dryrun)
        if success:
            # We succeeded, so we can move on.
            break
        else:
            click.echo("Download of {url} failed: {error}{trying}".format(url=dataset_target.url, error=result, trying=" - Trying again" if tries < retries else ""), err=True)
            time.sleep(retry_time)


    return (success, path)


def download_the_file(url, out_path, dryrun=False) -> str:
    """
    Does the download with wget in a subprocess
    Result is a tuple of (bool, path OR error message). The first element is
    a bool indicating succcessful completion of the process with True, and False
    if not. If successful, the secend element is the path downloaded. Otherwise
    it's whatever standard error was from wget.
    """
    click.echo("Downloading {}".format(url))
    wget_command = "wget -nv --retry-connrefused --waitretry=10 -t 10 --no-check-certificate {} -O {}".format(url, out_path)

    # click.echo("wget used: `{}`".format(wget_command))
    result = (True, out_path)
    if not dryrun:
        p = subprocess.Popen(wget_command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = p.communicate()
        exit_code = p.wait() # This is probably redundant, but will return the exit code
        if exit_code != 0:
            result = (False, err.decode("utf-8"))
            if os.path.exists(out_path):
                # Must be done because wget -O leaves an empty file if it fails
                os.remove(out_path)
        else:
            result = (True, out_path)
            # Somehow actually verify the the file is correct?
    return result

def construct_download_path(dataset_target: Dataset, target) -> str:
    """
    Builds the path where the given dataset will be downloaded to.

    The path is: target/<dataset>.<extension>
    """
    absolute_target = os.path.abspath(target)
    name = "{dataset}-src.{type}".format(dataset=dataset_target.dataset, type=dataset_target.type)
    if dataset_target.compression is not None:
        name += ".{}".format(extension_map(dataset_target.compression))

    path = os.path.join(absolute_target, name)
    return path

def construct_grouped_path(dataset: Dataset, filename, target):
    """
    Builds the file path for a Dataset, grouped by `group`
    """
    absolute_target = os.path.abspath(target)

    path = os.path.join(absolute_target, dataset.group, filename)
    return path

def extension_map(compression):
    exts = {
        "gzip": "gz"
    }
    return exts.get(compression, compression)

def zipup(file_path):
    click.echo("Zipping {}".format(file_path))
    path, filename = os.path.split(file_path)
    zipname = "{}.gz".format(filename)
    target = os.path.join(path, zipname)

    with open(file_path, "rb") as p:
        with gzip.open(target, "wb") as tf:
            tf.write(p.read())

def unzip(path, target):
    click.echo("Unzipping {}".format(path))
    def chunk_gen():
        with gzip.open(path, "rb") as p:
            while True:
                chunk = p.read(size=512 * 1024)
                if not chunk:
                    break
                yield chunk

    with open(target, "wb") as tf:
        with click.progressbar(iterable=chunk_gen()) as chunks:
            for chunk in chunks:
                tf.write(chunk)

if __name__ == "__main__":
    cli()
