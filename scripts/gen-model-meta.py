"""
Scan all GO-CAM json files in directory and create metadata file
mapping providedBy to GO-CAM model ID for production models.

Legacy usage (backward compatible):
  python3 gen-model-meta.py > ../metadata.json

New usage with indexing:
  python gen-model-meta.py --keys-to-index contributor --keys-to-index providedBy --keys-to-index source --keys-to-index evidence --keys-to-index entity --output-dir /tmp/output
"""
import sys
import logging
import json
from pathlib import Path
import glob
import click

import requests
import os
from oaklib.implementations.obograph.obograph_implementation import OboGraphImplementation
from oaklib.resource import OntologyResource

URL = "https://purl.obolibrary.org/obo/go/go-basic.json"
SAVE_PATH = "go-basic.json"


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


# Logger basic setup
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger("gen-model-meta")
LOG.setLevel(logging.WARNING)
json_path = Path("/tmp/gocams/")



def die_screaming(instr):
    """Exit in a way that will get attention."""
    LOG.error(instr)
    sys.exit(1)


def precompute_all_ancestors(adapter):
    """
    Precompute ancestors for all GO terms in the ontology.
    """
    ancestor_map = {}
    all_go_terms = [term for term in adapter.entities() if term.startswith("GO:")]
    print(f"Precomputing ancestors for {len(all_go_terms)} GO terms...")

    for term in all_go_terms:
        ancestor_map[term] = list(adapter.ancestors(term, predicates=["part_of", "is_a"]))

    print(f"Precomputation complete. Cached {len(ancestor_map)} terms.")
    return ancestor_map

def get_go_parents(go_parent_cache, entity_id):
    """
    Retrieve parents of a GO term from precomputed cache.
    """
    return go_parent_cache.get(entity_id, [])

def legacy_main():
    """
    Legacy mode: scan JSON files in current directory and output providedBy mapping to stdout.
    """
    provided_models = {}
    
    for f in glob.glob(os.path.join("*.json")):
        model_id = Path(f).stem
        
        try:
            with open(f) as fhandle:
                read_data = json.load(fhandle)
                if not read_data:
                    continue
                
                production_p = False
                provided_by = []
                for ann in read_data.get('annotations', []):
                    if ann.get('key') == 'state' and ann.get('value') == 'production':
                        production_p = True
                    if ann.get('key') == 'providedBy':
                        provided_by.append(ann['value'])
                
                if production_p:
                    for provider in provided_by:
                        if provider not in provided_models:
                            provided_models[provider] = []
                        provided_models[provider].append(model_id)
        except (json.JSONDecodeError, KeyError):
            continue
    
    print(json.dumps(provided_models))

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
    adapter = download_and_initialize_oak_adapter(url, save_path)
    go_parent_cache = precompute_all_ancestors(adapter)

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
                for entity_type in individual.get("type", []):
                    entity_id = entity_type.get("id")
                    if not entity_id:
                        continue  # Skip if no ID present

                    parents = get_go_parents(go_parent_cache, entity_id) if entity_id.startswith("GO:") else []

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
    required=False,
    help="List of keys to index (contributor, entity, providedBy, evidence, source).",
)
@click.option(
    "--output-dir",
    "-o",
    type=click.Path(file_okay=False, dir_okay=True, writable=True, path_type=str),
    required=False,
    help="Directory where the JSON index files will be saved.",
)
def main(keys_to_index, output_dir):
    if keys_to_index and output_dir:
        process_json_files(keys_to_index, output_dir)
    elif not keys_to_index and not output_dir:
        legacy_main()
    else:
        die_screaming("ERROR: Both --keys-to-index and --output-dir are required together, or omit both for legacy mode")

# Ensure the script runs only when executed directly
if __name__ == "__main__":
    main()
