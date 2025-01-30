"""
Script to generate model indexes.  to run:

% cp ~/Downloads/noctua-models-json/*.json to /tmp/gocams
# as downloaded from snapshot.geneontology.org/products/json/noctua-models-json.tgz

% cd scripts
% poetry install
% poetry run python gen-model-meta.py --keys-to-index contributor --keys-to-index providedBy --output-dir /tmp/output

"""
import json
import sys
import logging
from pathlib import Path

import click

from oaklib import get_adapter
import requests
import os
from oaklib.implementations.obograph.obograph_implementation import OboGraphImplementation
from oaklib.resource import OntologyResource

url = "http://snapshot.geneontology.org/ontology/go.json"
save_path = "go.json"


def download_and_initialize_oak_adapter(url: str, save_path: str):
    """
    Downloads an OBOJSON file, initializes an OAK Lib adapter using OboGraphImplementation,
    and returns the adapter for ontology term lookup.

    :param url: URL of the OBOJSON file
    :param save_path: Path to save the downloaded file
    :return: OboGraphImplementation adapter
    """
    # Download the file if it doesn't exist
    if not os.path.exists(save_path):
        print(f"Downloading {url}...")
        response = requests.get(url)
        response.raise_for_status()
        with open(save_path, "wb") as file:
            file.write(response.content)
        print(f"File saved to {save_path}")
    else:
        print(f"Using cached file: {save_path}")

    # Initialize OAK Lib adapter
    resource = OntologyResource(save_path)
    adapter = OboGraphImplementation(resource)
    return adapter


# Example: Fetch term parents
def get_term_parents(adapter, term_id):
    """Fetches parent terms of a given ontology term."""
    return list(adapter.hierarchical_parents(term_id))


# Logger basic setup
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger("gen-model-meta")
LOG.setLevel(logging.WARNING)
json_path = Path("/tmp/gocams/")



def die_screaming(instr):
    """Exit in a way that will get attention."""
    LOG.error(instr)
    sys.exit(1)

def process_json_files(keys_to_index, output_dir, path_to_json=json_path):
    """
    Process all JSON files, generate indices for the specified keys, and save them.
    """
    # Get the list of files from path_to_json
    json_files = [f for f in os.listdir(path_to_json) if f.endswith(".json")]
    indices = {key: {} for key in keys_to_index}
    adapter = download_and_initialize_oak_adapter(url, save_path)
    term_id = "GO:0098754"  # Biological process
    parents = get_term_parents(adapter, term_id)
    print(f"Parents of {term_id}: {parents}")

    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Process each JSON file
    for file_name in json_files:
        model_id = Path(file_name).stem

        # Open, parse, and save the JSON in a dictionary file
        file_url = os.path.join(path_to_json, file_name)
        with open(file_url, "r") as f:
            read_data = json.load(f)

            if not read_data:
                die_screaming(f"ERROR: No data in file: {file_url}")

            # Create indices for the current file
            individuals = read_data.get("individuals", [])
            if "entity" in keys_to_index:
                for individual in individuals:
                    types = individual.get("type", [])
                    for entity_type in types:
                        entity_id = entity_type.get("id")
                        if entity_id not in indices["entity"]:
                            indices["entity"][entity_id] = []
                        if model_id not in indices["entity"][entity_id]:
                            indices["entity"][entity_id].append(model_id)

            for individual in individuals:
                annotations = individual.get("annotations", [])
                for annotation in annotations:
                    key = annotation.get("key")
                    value = annotation.get("value")
                    if key in keys_to_index:
                        if value not in indices[key]:
                            indices[key][value] = []
                        if model_id not in indices[key][value]:
                            indices[key][value].append(model_id)

    # for each top level key in the indicies dictionary, write out the JSON to a file
    for key, value in indices.items():
        with open(os.path.join(output_dir, f"{key}_index.json"), "w") as f:
            json.dump(value, f, indent=4)


# CLI using Click
@click.command()
@click.option(
    "--keys-to-index",
    "-k",
    multiple=True,
    required=True,
    help="List of keys to index (e.g., contributor, bioentity_id, term_id).",
)
@click.option(
    "--output-dir",
    "-o",
    type=click.Path(file_okay=False, dir_okay=True, writable=True, path_type=str),
    required=True,
    help="Directory where the JSON index files will be saved.",
)
def main(keys_to_index, output_dir):
    process_json_files(keys_to_index, output_dir)

# Ensure the script runs only when executed directly
if __name__ == "__main__":
    main()
