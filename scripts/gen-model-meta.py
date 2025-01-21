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

@click.command()
@click.option('-v', '--verbose',
              is_flag=True,
              help='Enable verbose output')
@click.option('-k', '--key',
              required=True,
              help='The key in the Minerva JSON output whose values are going to be extracted into a collection')
def main(verbose, key):
    """Scan all GO-CAM JSON files in the directory and create metadata mapping."""

    if verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose mode enabled')

    provided_models = {}

    for file_path in glob.glob("*.json"):
        model_id = Path(file_path).stem

        with open(file_path) as fhandle:
            try:
                read_data = json.load(fhandle)
            except json.JSONDecodeError:
                die_screaming(f"ERROR decoding JSON in file: {file_path}")

            if not read_data:
                die_screaming(f"ERROR: No data in file: {file_path}")

            # Key scan
            production_p = False
            extracted_values = []

            for annotation in read_data.get('annotations', []):
                if annotation.get('key') == 'state' and annotation.get('value') == 'production':
                    production_p = True
                if annotation.get('key') == key:
                    extracted_values.append(annotation.get('value'))

            if production_p:
                for value in extracted_values:
                    if value not in provided_models:
                        provided_models[value] = []
                    provided_models[value].append(model_id)

    # Print the resulting metadata
    print(json.dumps(provided_models, indent=2))

if __name__ == '__main__':
    main()

