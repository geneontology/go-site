import click
import os
import yaml


datasets_dir_path = os.path.normpath(os.path.join(os.path.abspath(__file__), "../../../metadata/datasets"))

@click.command()
@click.argument("group")
def get_gaf_id(group):
    metadata_path = os.path.join(datasets_dir_path, "{}.yaml".format(group))
    try:
        with open(metadata_path) as metadata_file:
            metadata = yaml.load(metadata_file)
            gafs = []
            for dataset in metadata["datasets"]:
                if dataset["type"] == "gaf":
                    gafs.append(dataset["dataset"])

            click.echo(" ".join(gafs))
    except:
        click.echo("metadata yaml not found for '{}' in {}".format(group, datasets_dir_path), err=True)
        return

if __name__ == "__main__":
    get_gaf_id()
