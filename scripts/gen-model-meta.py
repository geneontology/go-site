####
#### Scan all GO-CAM json files in directory and create metadata file
#### mapping providedBy to GO-CAM model ID for production models.
####
#### Done raw on 3.12.3
####
#### Usage:
####   python3 gen-model-meta.py > ../metadata.json
####

import os
import glob
import json
import sys
import argparse
import logging
from pathlib import Path

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('gen-model-meta')
LOG.setLevel(logging.WARNING)

def die_screaming(instr):
    """Make sure we exit in a way that will get Jenkins's attention."""
    LOG.error(instr)
    sys.exit(1)

parser = argparse.ArgumentParser(
    description =__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter)

parser.add_argument('-v', '--verbose', action='store_true',
                    help='More verbose output')
args = parser.parse_args()

if args.verbose:
    LOG.setLevel(logging.INFO)
    LOG.info('Verbose: on')

def main():
    """The main runner of our script."""


    #LOG.info("test")
    provided_models = {}
    for f in glob.glob(os.path.join("*.json")):
        #LOG.info(f)
        model_id = Path(f).stem
        #LOG.info(model_id)
        with open(f) as fhandle:
            read_data = json.loads(fhandle.read())
            if not read_data:
                die_screaming('ERROR on: ' + f)
            #LOG.info(json.dumps(read_data['annotations']))

            ## Key scan.
            production_p = False
            provided_by = []
            for ann in read_data['annotations']:
                #LOG.info(json.dumps(ann['key']))
                if ann['key'] == 'state' and ann['value'] == 'production':
                    production_p = True
                if ann['key'] == 'providedBy':
                    provided_by.append(ann['value'])
            if production_p:
                #LOG.info(json.dumps(provided_by))

                ## Ensure and add.
                for provider in provided_by:
                    if provider not in provided_models:
                        provided_models[provider] = []
                    provided_models[provider].append(model_id)

    ## Proint what we got:
    print(json.dumps(provided_models))

## You saw it coming...
if __name__ == '__main__':
    main()
