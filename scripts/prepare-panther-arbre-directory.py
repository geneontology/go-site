"""Create a directory mimicking the current directory structure and contents of the loader .arbre files, but with current stable inputs."""
####
#### Create a directory mimicking the current directory structure and
#### contents of the loader .arbre files, but with current stable
#### inputs.
####
#### Example usage to create new output directory:
####  python3 prepare-panther-arbre-directory.py --help
####  python3 ./scripts/prepare-panther-arbre-directory.py -v --names /tmp/names.tab --trees /tmp/tree_files --output /tmp/arbre
####

## Standard imports.
import sys
import argparse
import logging
import os
import re

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('prepare-panther-arbre-directory')
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
    parser.add_argument('-n', '--names',
                        help='The location of the names.tab file')
    parser.add_argument('-t', '--trees',
                        help='The location of the trees directory')
    parser.add_argument('-o', '--output',
                        help='The location to place OWLTools loadable directory structure')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    ## Ensure file.
    if not args.names:
        die_screaming('need a "names" argument')
    LOG.info('Will load names file: ' + args.names)
    ## Ensure directory.
    if not args.trees:
        die_screaming('need a "trees" argument')
    LOG.info('Will use tree directory: ' + args.trees)
    ## Ensure output directory.
    if not args.output:
        die_screaming('need an "output" argument')
    LOG.info('Will place output directory in: ' + args.output)

    ## Read in and process names.tab files, pulling out both the
    ## panther id and family name.
    names_tab = {}
    names_found = 0
    with open(args.names) as fhandle:
        for line in fhandle:

            #print(line)
            line = line.strip()
            parts = line.split("\t")
            panther_filename = parts[0]
            family = parts[1]

            if( not panther_filename ):
                die_screaming('panther file name not found')
            if( not family ):
                family = 'FAMILY NOT NAMED'

            #print(panther_filename)
            #print(family)

            panther_filename_parts = panther_filename.split(".")
            if( panther_filename_parts[1] == 'mag' and
                panther_filename_parts[2] == 'mod'):

                panther_id = panther_filename_parts[0]
                names_found += 1
                names_tab[panther_id] = family

            #print(panther_id)

    LOG.info('Have a handle on ' + str(names_found) + ' family names.')

    ## Walk tree directory.
    trees_tab = {}
    trees_found = 0
    for curr_dir, dirs, files in os.walk(args.trees):

        ## Note files and directories.
        for fname in files:

            ## Calculate strict location.
            filename = os.path.join(curr_dir, fname)

            ## Split and process.
            filename_parts = fname.split(".")
            if( filename_parts[1] == 'tree' ):
                panther_id = filename_parts[0]
                trees_found += 1
                #trees_tab[panther_id] = filename

                ## Inject file into table.
                with open(filename, 'r') as fhandle:
                    tree = fhandle.read()
                    trees_tab[panther_id] = tree

                ## Visual check.
                #LOG.info('file: '+ filename)

    LOG.info('Have a handle on ' + str(trees_found) + ' trees.')

    ## Sanity checks on PANTHER upstream.
    diff = list( set(list(names_tab)) - set(list(trees_tab)) )
    #print(diff)
    #print(list(names_tab)[0])
    #print(list(trees_tab)[0])
    #print((str(len(diff))))
    if( len(diff) != 0 ):
        die_screaming('differing counts on PANTHER IDs')

    ## Create/ensure output path.
    if( os.path.exists(args.output) ):
        if( os.path.isdir(args.output) ):
            #LOG.info('Reusing directory: ' + args.output)
            pass
        else:
            die_screaming('output path already exists and is not a directory')
    else:
        #LOG.info('Creating directory: ' + args.output)
        os.makedirs(args.output)

    ## Assemble .arbre files in the output directory.
    for panther_id, panther_name in names_tab.items():

        ## Create semi-path (part of current OWLTools loader
        ## structure) and final filename.
        semi_path = os.path.join(args.output, panther_id)

        if( os.path.exists(semi_path) ):
            if( os.path.isdir(semi_path) ):
                #LOG.info('Reusing semi_path: ' + semi_path)
                pass
            else:
                die_screaming('semi_path already exists and is not a directory')
        else:
            #LOG.info('Creating semi_path: ' + semi_path)
            os.makedirs(semi_path)

        final_filename = os.path.join(semi_path, panther_id + '.arbre')

        ## Merge names and trees into final form.
        with open(final_filename, "w") as fhandle:
            #LOG.info('Writing final .arbre file: ' + final_filename)
            fhandle.write("NAME=" + panther_name + "\n" + trees_tab[panther_id])

## You saw it coming...
if __name__ == '__main__':
    main()
