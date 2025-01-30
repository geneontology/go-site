"""
Script to generate model indexes.  to run:

% cp ~/Downloads/noctua-models-json/*.json to /tmp/gocams
# as downloaded from snapshot.geneontology.org/products/json/noctua-models-json.tgz

% cd scripts
% poetry install
% poetry run python gen-model-meta.py --keys-to-index contributor --keys-to-index providedBy --output-dir /tmp/output

"""
import sys
import logging
import json
from pathlib import Path
import click

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
    return list(adapter.ancestors(term_id, predicates=["rdfs:subClassOf"]))


# Logger basic setup
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger("gen-model-meta")
LOG.setLevel(logging.WARNING)
json_path = Path("/tmp/gocams/")



def die_screaming(instr):
    """Exit in a way that will get attention."""
    LOG.error(instr)
    sys.exit(1)


def get_go_parents(adapter, go_parent_cache, entity_id):
    """
    Retrieve parents of a GO term, caching results to avoid redundant computation.
    """
    if entity_id in go_parent_cache:
        return go_parent_cache[entity_id]  # Return cached parents

    # Compute parents if not cached
    parents = list(adapter.ancestors(entity_id, predicates=["BFO:0000050", "rdfs:subClassOf"]))
    go_parent_cache[entity_id] = parents  # Store in cache for future use
    return parents

def process_json_files(keys_to_index, output_dir, path_to_json=json_path):
    """
    Process all JSON files, generate indices for the specified keys, and save them.
    """

    # Get the list of JSON files
    json_files = [f for f in os.listdir(path_to_json) if f.endswith(".json")]
    if not json_files:
        die_screaming(f"ERROR: No JSON files found in {path_to_json}")

    # Initialize indices and cache
    indices = {key: {} for key in keys_to_index}
    go_parent_cache = {}  # Store computed GO term parent relationships
    adapter = download_and_initialize_oak_adapter(url, save_path)

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Process each JSON file
    for file_name in json_files:
        model_id = Path(file_name).stem
        file_path = os.path.join(path_to_json, file_name)

        with open(file_path, "r") as f:
            read_data = json.load(f)
            if not read_data:
                die_screaming(f"ERROR: No data in file: {file_path}")

        individuals = read_data.get("individuals", [])

        # Process annotations
        for individual in individuals:
            for annotation in individual.get("annotations", []):
                key, value = annotation.get("key"), annotation.get("value")
                if key in keys_to_index and value:
                    indices[key].setdefault(value, [])
                    if model_id not in indices[key][value]:
                        indices[key][value].append(model_id)

            # Process entity indices
            if "entity" in keys_to_index:
                entity_index = indices["entity"]

                for individual in individuals:
                    for entity_type in individual.get("type", []):
                        entity_id = entity_type.get("id")
                        if not entity_id:
                            continue  # Skip if no ID present

                        print(entity_id)

                        # Compute and cache GO term parents if entity_id is a GO term
                        parents = get_go_parents(adapter, go_parent_cache, entity_id) if entity_id.startswith("GO:") else []

                        # Ensure entity and its parents exist in the index
                        for eid in [entity_id] + parents:
                            entity_index.setdefault(eid, [])

                        # Add model_id only if not already present
                        for eid in [entity_id] + parents:
                            if model_id not in entity_index[eid]:
                                entity_index[eid].append(model_id)

    # Write indices to output files
    for key, value in indices.items():
        output_file = os.path.join(output_dir, f"{key}_index.json")
        with open(output_file, "w") as f:
            json.dump(value, f, indent=4)

    print("Indexing completed successfully.")


# CLI using Click
@click.command()
@click.option(
    "--keys-to-index",
    "-k",
    multiple=True,
    required=True,
    help="List of keys to index (e.g., contributor, entity).",
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
