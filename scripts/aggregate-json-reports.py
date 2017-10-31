"""Give a report on the "sanity" of the pipeline association data."""
####
#### Give a report on the "sanity" of the pipeline association data.
#### This script assumes access to skyhook, or a flat directory of
#### pipeline association products.
####
#### Example usage to analyze "whatever":
####  python3 aggregate-json-reports.py --help
####  mkdir -p /tmp/mnt || true
####  mkdir -p /tmp/foo || true
####  sshfs -oStrictHostKeyChecking=no -o IdentitiesOnly=true -o IdentityFile=/home/sjcarbon/local/share/secrets/bbop/ssh-keys/foo.skyhook -o idmap=user skyhook@skyhook.berkeleybop.org:/home/skyhook /tmp/mnt/
####  cp /tmp/mnt/master/annotations/whatever* /tmp/foo
####  fusermount -u /tmp/mnt
####  python3 aggregate-json-reports.py -v --directory /tmp/foo --metadata ~/local/src/git/go-site/metadata/datasets --output /tmp/all_combined.report.json
####

## Standard imports.
import sys
import argparse
import logging
import glob
import os
import json
from contextlib import closing
import yaml
import requests

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('aggregate')
LOG.setLevel(logging.WARNING)

def die_screaming(instr):
    """Make sure we exit in a way that will get Jenkins's attention."""
    LOG.error(instr)
    sys.exit(1)

def remote_json(url):
    """Get a remote JSON resource"""
    ret = {}
    with closing(requests.get(url, stream=False)) as resp:
        if resp.status_code == 200:
            ret = resp.json()
    return ret

def main():
    """The main runner for our script."""

    ## Deal with incoming.
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-d', '--directory',
                        help='The directory to act on')
    parser.add_argument('-m', '--metadata',
                        help='The metadata directory')
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
    ## Ensure metadata.
    if not args.metadata:
        die_screaming('need a metadata argument')
    LOG.info('Will get metadata from: ' + args.metadata)
    ## Ensure output file.
    if not args.output:
        die_screaming('need an output file argument')
    LOG.info('Will output to: ' + args.output)

    resource_metadata = {}

    ## Read in all of the useful data from the metadata data sources.
    LOG.info('Globbing metadata for sources: ' + args.metadata + '/*.yaml')
    metadata_filenames = glob.glob(args.metadata + '/*.yaml')
    #LOG.info(metadata_filenames)
    for metadata_filename in metadata_filenames:

        LOG.info('metadata_filename: ' + metadata_filename)

        metadata_data = None
        with open(metadata_filename) as mhandle:
            metadata_data = yaml.load(mhandle.read())

        for subset in metadata_data['datasets']:
            ## Add what we want.
            LOG.info('subset id' + subset['id'])
            resource_metadata[subset['id']] = subset
            resource_metadata[subset['id']]['resource-id'] = \
              metadata_data.get('id', None)
            resource_metadata[subset['id']]['resource-label'] = \
              metadata_data.get('label', None)
            resource_metadata[subset['id']]['resource-description'] = \
              metadata_data.get('description', None)
            resource_metadata[subset['id']]['resource-project_name'] = \
              metadata_data.get('project_name', None)
            resource_metadata[subset['id']]['resource-contact_email'] = \
              metadata_data.get('contact_email', None)
            resource_metadata[subset['id']]['resource-project_url'] = \
              metadata_data.get('project_url', None)
            resource_metadata[subset['id']]['resource-funding_source'] = \
              metadata_data.get('funding_source', None)
            resource_metadata[subset['id']]['resource-email_report'] = \
              metadata_data.get('email_report', None)

    LOG.info('resource_metadata')
    LOG.info(resource_metadata)

    ids = []

    ## Get files out of target directory, searching for the IDs
    ## independent of the metadata (as we'll need to check that too).
    LOG.info('Globbing GAFs in data directory: ' + args.directory + '/*.gaf.gz')
    src_filenames = glob.glob(args.directory + '/*.gaf.gz')
    #LOG.info(src_filenames)
    for src_filename in src_filenames:

        LOG.info('src_filename: ' + src_filename)

        ## We are only interested in product GAF files, not source.
        if "-src.gaf.gz" in src_filename:
            pass

        ## As well, at this time, we are only interested in non-IEA
        ## files.
        elif "_noiea.gaf.gz" in src_filename:
            pass

        else:

            ## Generate a usable "id".
            ## First, chop off all extensions.
            potential_id = src_filename
            ## I don't know what extensions we'll be using in the future,
            ## so just chop everything off.
            while os.path.splitext(potential_id)[1] != '':
                potential_id = os.path.splitext(potential_id)[0]
            ## Trim off the path.
            potential_id = os.path.basename(potential_id)
            ## Pass: we know that "-src" should be there, so leave it.
            ids.append(potential_id)

            LOG.info(src_filename)

    ## Get the report file and assemble a data structure for tests.
    lookup = []
    for fid in ids:

        ###
        ### Extract information from the report.
        ###

        LOG.info("fids: " + fid)

        ## Read.
        ## WARNING: Using the markdown version is a holdover from when
        ## the markdown version was the only version.
        read_data = None
        with open(args.directory + '/' + fid + '.report.json') as fhandle:
            read_data = json.loads(fhandle.read())
            ## For the sake of sanity, get rid of some extra stuff.
            read_data.pop("groups", None)

        ## Better be something in there.
        if not read_data:
            die_screaming('No report found for: ' + fid)

        ## Look up to see if we have a hit in the metadata.
        if fid + '.gaf' in resource_metadata:
            ## Assemble report object.
            read_data['id'] = fid
            read_data['metadata'] = resource_metadata[fid + '.gaf']
            LOG.info(read_data)
            lookup.append(read_data)

    #LOG.info(lookup)

    ## Enrich what we got with taxon labels.
    id2labels = {}
    for resource in lookup:
        if 'metadata' in resource and 'taxa' in resource['metadata']:
            if isinstance(resource['metadata']['taxa'], list):
                resource['metadata']['taxa_label_map'] = {}
                for taxa_id in resource['metadata']['taxa']:
                    if taxa_id in id2labels:
                        LOG.info('cache hit for: ' + id2labels[taxa_id])
                    else:
                        LOG.info('cache miss for: ' + taxa_id)
                        url = 'http://amigo2.berkeleybop.org/amigo/term/'+taxa_id+'/json'
                        id2labels[taxa_id] = \
                          remote_json(url).get('results', {}).get('name', taxa_id)

                    resource['metadata']['taxa_labal_map'][taxa_id] = \
                      id2labels[taxa_id]

    ## Final writeout.
    with open(args.output, 'w+') as fhandle:
        fhandle.write(json.dumps(lookup, sort_keys=True, indent=4))

## You saw it coming...
if __name__ == '__main__':
    main()
