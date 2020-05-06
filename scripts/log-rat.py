"""Take two (Jenkins) logs and get a time series of how they drift relative to each other."""
####
#### TODO
####
#### Example usage to operate in Zenodo:
####  python3 ./scripts/log-rat.py --help
####  python3 ./scripts/log-rat.py --verbose --file1 f1 --file2 f2
####

## Standard imports.
import sys
import argparse
import logging
import os
import json
import requests

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('log-rat')
LOG.setLevel(logging.WARNING)

def die_screaming(instr):
    """Make sure we exit in a way that will get Jenkins's attention."""
    LOG.error(instr)
    sys.exit(1)

def main():
    """The main runner for our script."""

    ## Deal with incoming.
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    parser.add_argument('-f1', '--file1',
                        help='The first local file to use.')
    parser.add_argument('-f2', '--file2',
                        help='The second local file to use.')
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    ## Read.
    f1 = None
    with open(args.file1) as f1handle:
        f1 = yaml.load(f1handle.read())
    f2 = None
    with open(args.file2) as f2handle:
        f2 = yaml.load(f2handle.read())

    ## Date array.


## You saw it coming...
if __name__ == '__main__':
    main()
