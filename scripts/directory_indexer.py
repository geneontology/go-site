"""Index the contexts of a directory, creating an Apache HTTPd index-like page dictated by the mustache template provided."""
####
#### Example usage (local testing):
####  python3 ./scripts/directory_indexer.py --help
####  mkdir -p /tmp/foo/bar/bib/bab && mkdir -p /tmp/foo/bar/fish && mkdir -p /tmp/foo/bar/foul && touch /tmp/foo/top.md && touch /tmp/foo/bar/bib/bab/bottom.txt && touch /tmp/foo/bar/fish/trout.f && touch /tmp/foo/bar/fish/bass.f
####  python3 ./scripts/directory_indexer.py -v --inject ./scripts/directory-index-template.html --directory /tmp/foo --prefix file:///tmp/foo -x
####  python3 ./scripts/directory_indexer.py -v --inject ./scripts/directory-index-template.html --directory /tmp/foo --prefix file:///tmp/foo -x -u
####
#### Example usage (production-like):
####  python3 directory_indexer.py --help
####  mkdir -p /tmp/mnt || true
####  sshfs -oStrictHostKeyChecking=no -o IdentitiesOnly=true -o IdentityFile=/home/sjcarbon/local/share/secrets/bbop/ssh-keys/foo.skyhook -o idmap=user skyhook@skyhook.berkeleybop.org:/home/skyhook /tmp/mnt/
####  python3 directory_indexer.py -v --inject ./scripts/directory-index-template.html --directory /tmp/mnt/annotations --prefix http://foo/bar
####  fusermount -u /tmp/mnt
####
#### Example usage (production):
####  python3 ./scripts/directory_indexer.py -v --inject ./scripts/directory-index-template.html --directory $WORKSPACE/mnt --prefix http://experimental.geneontology.io -x'
####

## Standard imports.
import sys
import argparse
import logging
#import glob
import os
import urllib.parse
import json
import pathlib
#from contextlib import closing
#import yaml
#import requests
import pystache

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('aggregate')
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
    parser.add_argument('-i', '--inject', required=True,
                        help='Mustache template file to inject into')
    parser.add_argument('-d', '--directory', required=True,
                        help='The directory to copy from')
    parser.add_argument('-p', '--prefix', required=True,
                        help='The prefix to add to all files and links')
    parser.add_argument('-x', '--execute', action='store_true',
                        help='Actually run--not the default dry run')
    parser.add_argument('-u', '--up', action='store_true',
                        help='Release version, where pages have a link pointing up one level')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    if args.execute:
        LOG.info('Will actually write to filesystem.')
    else:
        LOG.info('Will do a dry run.')

    rootdir = os.path.normpath(args.directory)
    LOG.info('Will operate in: ' + rootdir)

    ## Get template in hand.
    LOG.info('Will inject into: ' + args.inject)
    output_template = None
    with open(args.inject) as fhandle:
        output_template = fhandle.read()

    if not args.prefix.endswith("/"):
        prefix = "{}/".format(args.prefix)
    else:
        prefix = args.prefix

    LOG.info('Will use prefix: ' + prefix)

    # Walk tree.
    # First, make a clean path to use in making new pathnames.
    # webrootdir = rootdir.lstrip('.').lstrip('//').rstrip('//')
    for currdir, dirs, files in os.walk(rootdir):

        ## Create index on every "root".
        parent = None
        children = []
        current = []

        ## We can navigate up if we are not in the root.
        # print('one_up: ' + one_up)
        if rootdir != currdir or args.up:
            parent = parent_url(rootdir, currdir, prefix)

        ## Note files and directories.
        for fname in files:
            #print('fname: ' + fname)
            ## Naturally, skip index.html.
            if fname != 'index.html':
                current.append(map_file_to_url(rootdir, currdir, fname, prefix))

        for dname in dirs:
            #print('dname: ' + dname)
            children.append(map_dir_to_url(rootdir, currdir, dname, prefix))

        ## Assemble for use.
        dir_index = {
            'parent': parent,
            'children': sorted(children, key=lambda x: x['name']),
            'location': map_current_dir_to_url(rootdir, currdir, prefix),
            'current': sorted(current, key=lambda x: x['name']),
        }

        ## Test output.
        jsondump = json.dumps(dir_index, sort_keys=True, indent=4)
        LOG.info(jsondump)

        ## Output to filesystem.
        output = pystache.render(output_template, dir_index)

        ## Final writeout.
        outf = os.path.join(currdir, 'index.html')
        if args.execute:
            with open(outf, 'w') as fhandle:
                fhandle.write(output)

        LOG.info('Wrote: ' + outf)

def map_current_dir_to_url(base_dir, current_dir, url_prefix):
    relative_current = os.path.relpath(current_dir, start=base_dir)
    return urllib.parse.urljoin(url_prefix, relative_current)

def map_dir_to_url(base_dir, current_dir, directory, url_prefix):
    relative_current = os.path.relpath(current_dir, start=base_dir)
    directory_index = os.path.normpath(os.path.join(relative_current, directory, "index.html"))
    name = os.path.basename(directory)
    return {
        "name": name,
        "url": urllib.parse.urljoin(url_prefix, directory_index)
    }

def map_file_to_url(base_dir, current_dir, a_file, url_prefix):
    relative_current = os.path.relpath(current_dir, start=base_dir)
    file_path = os.path.normpath(os.path.join(relative_current, a_file))
    name = os.path.basename(a_file)
    return {
        "name": name,
        "url": urllib.parse.urljoin(url_prefix, file_path)
    }

def parent_url(base_dir, current_dir, url_prefix):
    relative_current = os.path.relpath(current_dir, start=base_dir)
    up_one_index = os.path.normpath(os.path.join(relative_current, "..", "index.html"))
    return urllib.parse.urljoin(url_prefix, up_one_index)

## You saw it coming...
if __name__ == '__main__':
    main()
