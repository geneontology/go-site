"""
Script to generate model indexes.  to run:

% cd scripts
% poetry install
% poetry run python gen-model-meta.py --keys-to-index contributor --keys-to-index providedBy --output-dir /tmp/output

"""
import os
import json
import sys
import logging
from pathlib import Path
from oaklib import get_implementation_from_shorthand
import click

# Logger basic setup
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger("gen-model-meta")
LOG.setLevel(logging.WARNING)
json_path = Path("/tmp/gocams/")
ontology = get_implementation_from_shorthand("https://purl.obolibrary.org/obo/go.json")


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
