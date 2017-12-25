"""*DEPRECATED*. Index the contexts of a directory, creating an Apache HTTPd index-like page dictated by the mustache template provided."""
####
#### *DEPRECATED*
####
#### Example usage (local testing):
####  python3 directory-indexer.py --help
####  mkdir -p /tmp/foo/bar/bib/bab && mkdir -p /tmp/foo/bar/fish && mkdir -p /tmp/foo/bar/foul && touch /tmp/foo/top.md && touch /tmp/foo/bar/bib/bab/bottom.txt && touch /tmp/foo/bar/fish/trout.f && touch /tmp/foo/bar/fish/bass.f
####  python3 ./scripts/directory-indexer.py -v --inject ./scripts/directory-index-template.html --directory /tmp/foo --prefix file:///tmp/foo
#### Example usage (production-like):
####  python3 directory-indexer.py --help
####  mkdir -p /tmp/mnt || true
####  sshfs -oStrictHostKeyChecking=no -o IdentitiesOnly=true -o IdentityFile=/home/sjcarbon/local/share/secrets/bbop/ssh-keys/foo.skyhook -o idmap=user skyhook@skyhook.berkeleybop.org:/home/skyhook /tmp/mnt/
####  python3 directory-indexer.py -v --inject ./scripts/directory-index-template.html --directory /tmp/mnt/annotations --prefix http://foo/bar
####  fusermount -u /tmp/mnt
####

## Standard imports.
import sys
import argparse
import logging
#import glob
import os
import json
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
    parser.add_argument('-i', '--inject',
                        help='Mustache template file to inject into')
    parser.add_argument('-d', '--directory',
                        help='The directory to copy from')
    parser.add_argument('-p', '--prefix',
                        help='The prefix to add to all files and links')
    parser.add_argument('-x', '--execute', action='store_true',
                        help='Actually run--not the default dry run')
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

    ## Ensure directory.
    if not args.directory:
        die_screaming('need a directory argument')
    rootdir = args.directory.rstrip('//')
    LOG.info('Will operate in: ' + rootdir)

    ## Get template in hand.
    if not args.inject:
        die_screaming('need an inject argument')
    LOG.info('Will inject into: ' + args.inject)
    output_template = None
    with open(args.inject) as fhandle:
        output_template = fhandle.read()

    ## Ensure prefix.
    if not args.prefix:
        die_screaming('need a prefix argument')
    prefix = args.prefix.rstrip('//')
    LOG.info('Will use prefix: ' + prefix)

    ## Walk tree.
    ## First, make a clean path to use in making new pathnames.
    #webrootdir = rootdir.lstrip('.').lstrip('//').rstrip('//')
    for currdir, dirs, files in os.walk(rootdir):

        ## Create index on every "root".
        parent = None
        children = []
        current = []

        ## We can navigate up if we are not in the root.
        relative_to_start = currdir.rstrip('//')[len(rootdir):]
        one_up = os.path.dirname(currdir).rstrip('//')[len(rootdir):]
        here = prefix + relative_to_start
        # print('rootdir: ' + rootdir)
        # #print('webrootdir: ' + webrootdir)
        # print('currdir: ' + currdir)
        # print('relative_to_start: ' + relative_to_start)
        # print('one_up: ' + one_up)
        # print('here: ' + here)
        if rootdir != currdir.rstrip('//'):
            parent = prefix + one_up + '/index.html'

        ## Note files and directories.
        for fname in files:
            #print('fname: ' + fname)
            ## Naturally, skip index.html.
            if fname == 'index.html':
                pass
            else:
                current.append({
                    'name': fname,
                    'url': here + '/' + fname
                })
        for dname in dirs:
            #print('dname: ' + dname)
            children.append({
                'name': dname,
                'url': here + '/' + dname + '/index.html'
            })

        ## Assemble for use.
        dir_index = {
            'parent': parent,
            'children': sorted(children, key=lambda x: x['name']),
            'location': here,
            'current': sorted(current, key=lambda x: x['name']),
        }

        ## Test output.
        jsondump = json.dumps(dir_index, sort_keys=True, indent=4)
        LOG.info(jsondump)

        ## Output to filesystem.
        output = pystache.render(output_template, dir_index)

        ## Final writeout.
        outf = currdir + '/index.html'
        if args.execute:
            with open(outf, 'w') as fhandle:
                fhandle.write(output)
        LOG.info('Wrote: ' + outf)

## You saw it coming...
if __name__ == '__main__':
    main()
