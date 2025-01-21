import os
import glob
import json
import sys
import logging
from pathlib import Path
import click


# Logger basic setup
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('gen-model-meta')
LOG.setLevel(logging.WARNING)

def die_screaming(instr):
    """Exit in a way that will get attention."""
    LOG.error(instr)
    sys.exit(1)


def create_indices(read_data, model_id, keys_to_index):
    """
    Process the JSON data structure once and generate indices for the specified keys.

    :param read_data: The JSON data structure
    :param model_id: The model ID to associate with indexed values
    :param keys_to_index: List of keys to index

    :return: A dictionary of indices for the specified keys
    """
    indices = {key: {} for key in keys_to_index}

    individuals = read_data.get("individuals", [])

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

    return indices


@click.command()
@click.option(
    "--keys-to-index",
    "-k",
    multiple=True,
    required=True,
    help="List of keys to index (e.g., contributor, term_id, reference_id).",
)
@click.option(
    "--input-dir",
    "-i",
    type=click.Path(file_okay=False, dir_okay=True, readable=True, path_type=str),
    required=True,
    help="Directory containing the JSON input files.",
)
@click.option(
    "--output-dir",
    "-o",
    type=click.Path(file_okay=False, dir_okay=True, writable=True, path_type=str),
    required=True,
    help="Directory where the JSON index files will be saved.",
)
def main(keys_to_index, input_dir, output_dir):
    """
    Process all JSON files in the input directory, generate indices for the specified keys, and save them.
    """
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Process each JSON file in the input directory
    for file_path in glob.glob(f"{input_dir}/*.json"):
        model_id = Path(file_path).stem

        with open(file_path) as fhandle:
            try:
                read_data = json.load(fhandle)
            except json.JSONDecodeError:
                die_screaming(f"ERROR decoding JSON in file: {file_path}")

            if not read_data:
                die_screaming(f"ERROR: No data in file: {file_path}")

        # Create indices for the current file
        indices = create_indices(read_data, model_id, keys_to_index)

        # Save each index as a JSON file
        for key, index in indices.items():
            output_file = os.path.join(output_dir, f"{key}_index.json")
            # Append to the existing file if it exists
            if os.path.exists(output_file):
                with open(output_file, "r") as f:
                    existing_data = json.load(f)
                for k, v in index.items():
                    if k in existing_data:
                        existing_data[k].extend(v)
                        existing_data[k] = list(set(existing_data[k]))  # Ensure unique entries
                    else:
                        existing_data[k] = v
                index = existing_data

            with open(output_file, "w") as f:
                json.dump(index, f, indent=4)

            click.echo(f"Saved {key} index to {output_file}")


if __name__ == "__main__":
    main()
