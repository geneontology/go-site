"""Aggregate all of the GO reference information into a single blob for downstream use."""
####
#### Aggregate all of the GO reference information into a single blob
#### for downstream use.
####
#### This script assumes access (via CLI option) of the directory
#### containing the GO reference data file.
####
#### Example usage to aggregate "whatever":
####  python3 aggregate-references.py --help
####  python3 aggregate-references.py -v --directory ./metadata/gorefs --output /tmp/go-refs.json
####

## Standard imports.
import sys
import argparse
import logging
import glob
import yamldown

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('aggregate-references')
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
    parser.add_argument('-d', '--directory',
                        help='The directory of the GO refs')
    parser.add_argument('-o', '--output',
                        help='Output file')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    ## Ensure directory.
    if not args.directory:
        die_screaming('need a directory argument')
    LOG.info('Will operate in: ' + args.directory)
    ## Ensure output file.
    if not args.output:
        die_screaming('need an output file argument')
    LOG.info('Will output to: ' + args.output)

    reference_data = {}

    ## Get files out of target directory, flipping the frontmatter
    ## into JSON.
    LOG.info('Globbing GO ref YAMLs in data directory: ' + args.directory + '/goref-*.md')
    src_filenames = glob.glob(args.directory + '/go*-*.md')
    for src_filename in src_filenames:

        LOG.info('GO ref filename: ' + src_filename)

        with open(src_filename, "r") as f:
            yml, md = yamldown.load(f)#, yamlfirst=True)
            LOG.info(yml)
            #LOG.info(md)

    # ## Final writeout.
    # with open(args.output, 'w+') as fhandle:
    #     fhandle.write(json.dumps(reference_data, sort_keys=True, indent=4))

## You saw it coming...
if __name__ == '__main__':
    main()
