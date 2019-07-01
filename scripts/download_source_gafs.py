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

from typing import List, Dict


Dataset = collections.namedtuple("Dataset", ["group", "dataset", "url", "type", "compression"])


@click.group()
def cli():
    pass

@cli.command()
@click.option("--datasets", "-d", type=click.Path(exists=True), required=True, help="Path to directory with all the dataset yamls")
@click.option("--target", "-T", type=click.Path(exists=False), required=True, help="Path to directory where files will be stored")
@click.option("--type", multiple=True, default=["gaf"], help="The source type (gaf, gpad, etc) to download")
@click.option("--exclude", "-x", multiple=True, help="dataset name we want to not download")
@click.option("--parallel", "-p", default=5, help="Number of processes to use to download files")
@click.option("--dry-run", is_flag=True, help="Do everything but download if  flag is set")
@click.option("--retries", "-r", default=3, help="Max number of times to download a single source before giving up on everyone")
def all(datasets, target, type, exclude, parallel, dry_run, retries):
    os.makedirs(os.path.abspath(target), exist_ok=True)
    
    click.echo("Using {} for datasets".format(datasets))
    resource_metadata = load_resource_metadata(datasets)
    click.echo("Found {} dataset files".format(len(resource_metadata)))
        
    dataset_targets = transform_download_targets(resource_metadata, types=type)
    # Filter out datasets that we want excluded
    dataset_targets = list(filter(lambda t: t.dataset not in exclude, dataset_targets))
    multi_download(dataset_targets, target, parallel=parallel, dryrun=dry_run, retries=retries)


@cli.command()
@click.argument("group")
@click.option("--datasets", "-d", type=click.Path(exists=True), required=True, help="Path to directory with all the dataset yamls")
@click.option("--target", "-T", type=click.Path(exists=False), required=True, help="Path to directory where files will be stored")
@click.option("--type", multiple=True, default=["gaf"], help="The source type (gaf, gpad, etc) to download")
@click.option("--exclude", "-x", multiple=True, help="dataset name we want to not download")
@click.option("--dry-run", is_flag=True, help="Do everything but download if flag is set")
def group(group, datasets, target, type, exclude, dry_run):
    os.makedirs(os.path.abspath(target), exist_ok=True)
    
    click.echo("Using {} for datasets".format(datasets))
    resource_metadata = load_resource_metadata(datasets)
    # Filter out resource metadatas that are not the one group we specified
    resource_metadata = list(filter(lambda r: r["id"] == group, resource_metadata))
    click.echo("Found {} dataset files".format(len(resource_metadata)))
    
    dataset_targets = transform_download_targets(resource_metadata, types=type)
    # Filter out datasets that we want excluded
    dataset_targets = list(filter(lambda t: t.dataset not in exclude, dataset_targets))
    multi_download(dataset_targets, target, dryrun=dry_run)


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
    for f in glob.glob(os.path.join(absolute_source, "*")):
        name = os.path.basename(f)
        dataset_name = name.split("-src", maxsplit=1)[0]
        # path -> dataset_name -> find Dataset in dict -> build target path
        found_dataset = datasets_dict[dataset_name]
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
            dataset = yaml.load(dataset_file, Loader=yaml.FullLoader)
            loaded_yamls.append(dataset)

    return loaded_yamls
    
def multi_download(dataset_targets: List[Dataset], target, parallel=5, retries=3, dryrun=False):

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
            
    async_results = [ pool.apply_async(robust_download, (dataset, target), {"retries": retries, "dryrun": dryrun}, _simple_callback ) 
        for dataset in dataset_targets ] # List[AsyncResult]
        
    pool.close()
    pool.join()


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
            
            dataset = d["dataset"]
            url = d["source"]
            comp = d.get("compression", None)
            transformed_dataset_targets.append(Dataset(group=group, dataset=dataset, url=url, type=t, compression=comp))

    return transformed_dataset_targets

def robust_download(dataset_target: Dataset, target, retries=3, dryrun=False) -> str:
    """
    Robustly downloads the url of the `dataset_target` to a path. The path is:
    target/<group>/<dataset>.extension.gz
    """
    result = ""
    success = True
    for tries in range(0, retries):
        path = construct_download_path(dataset_target, target)
        success, result = download_the_file(dataset_target.url, path, dryrun=dryrun)
        if success:
            # We succeeded, so we can move on.
            break
        else:
            click.echo("Download of {url} failed: {error}{trying}".format(url=dataset_target.url, error=result, trying=" - Trying again" if tries < retries else ""), err=True)
            time.sleep(.5)
            
            
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

if __name__ == "__main__":
    cli()
