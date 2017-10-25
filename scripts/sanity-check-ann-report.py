####
#### Give a report on the "sanity" of the pipeline association data.
#### This script assumes access to skyhook, or a flat directory of
#### pipeline association products.
####
#### Example usage to analyze "whatever":
####  python3 sanity-check-ann-report.py --help
####  mkdir -p /tmp/mnt || true
####  mkdir -p /tmp/foo || true
####  sshfs -oStrictHostKeyChecking=no -o IdentitiesOnly=true -o IdentityFile=/home/sjcarbon/local/share/secrets/bbop/ssh-keys/foo.skyhook -o idmap=user skyhook@skyhook.berkeleybop.org:/home/skyhook /tmp/mnt/
####  cp /tmp/mnt/master/annotations/whatever* /tmp/foo
####  fusermount -u /tmp/mnt
####  python3 sanity-check-ann-report.py -v -d /tmp/foo
####

import sys
import argparse
import logging
import glob
import os
import re
import subprocess

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('sanity')
logger.setLevel(logging.WARNING)

## Make sure we exit in a way that will get Jenkins's attention.
def die_screaming(str):
    logger.error(str)
    sys.exit(1)

def main():
    ## Deal with incoming.
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-d', '--directory',
                        help='The directory to act on')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    args = parser.parse_args()

    ## Regexps for later.
    regexp_lines_skipped = re.compile(r'Lines skipped: (.*)$', re.MULTILINE)
    regexp_lines_in_file = re.compile(r'Lines in file.*: (.*)$', re.MULTILINE)
    regexp_lines_assocs = re.compile(r'Associations: (.*)$', re.MULTILINE)
    regexp_lines_fatal = re.compile(r'FATAL: (.*)$', re.MULTILINE)
    
    ## Get logger doing something.
    
    if args.verbose:
        logger.setLevel(logging.INFO)
        logger.info('Verbose: on')

    ## Ensure directory.
    if not args.directory:
        die_screaming('need a directory argument')
    logger.info('Will operate in: ' + args.directory)

    ids = []
    
    ## Get files out of target directory, searching for the IDs
    ## independent of the metadata (as we'll need to check that too).
    src_filenames = glob.glob(args.directory + '/*-src.*')
    logger.info(src_filenames)
    for src_filename in src_filenames:
        ## Chop off all extensions.
        potential_id = src_filename
        ## I don't know what extensions we'll be using in the future,
        ## so just chop everything off.
        while os.path.splitext(potential_id)[1] != '' :
            potential_id = os.path.splitext(potential_id)[0]
        ## Trim off the path.
        potential_id = os.path.basename(potential_id)
        ## We know that "-src" should be there, so off with that.
        potential_id = potential_id[:-4]
        ids.append(potential_id)

    ## TODO: Check found resources versus metadata.
    print('Found ' + str(len(ids)) + ' resource(s).')
    print('TODO: compare found resources versus metadata.')

    ## Get the report file and assemble a data structure for tests.
    lookup = {}
    for aid in ids:

        # if aid == 'goa_uniprot_all':
        #     break
        
        ###
        ### Extract information from the report.
        ###
        
        logger.info("Processing: " + aid)
        
        ## Read.
        ## WARNING: Using the markdown version is a holdover from when
        ## the markdown version was the only version.
        read_data = None
        with open(args.directory + '/' + aid + '.report.md') as f:
            read_data = f.read()
        f.closed
        
        ## Better be something in there.
        if not read_data:
            die_screaming('No report found for :' + aid)

        ## Found associations.
        res = regexp_lines_assocs.findall(read_data)
        if len(res) != 1:
            die_screaming('Too wrong # matches for associations: ' + len(res))
        lines_assocs = int(res[0])
        
        ## Lines skipped.
        res = regexp_lines_skipped.findall(read_data)
        if len(res) != 1:
            die_screaming('Too wrong # matches for lines skipped: ' + len(res))
        lines_skipped = int(res[0])
        
        ## Lines in file.
        res = regexp_lines_in_file.findall(read_data)
        if len(res) != 1:
            die_screaming('Too wrong # matches for lines in file: ' + len(res))
        lines_in_file = int(res[0])
        
        ## Lines that are fatal.
        res = regexp_lines_fatal.findall(read_data)
        if len(res) != 1:
            die_screaming('Too wrong # matches for lines fatal: ' + len(res))
        lines_fatal = int(res[0])

        ###
        ### Extract information from actual using grep.        
        ###  grep EXIT STATUS
        ###  The following exit values are returned:
        ###  0 One or more matches were found.
        ###  1 No matches were found.
        ###  2 Syntax errors or inaccessible files (even if matches were found).
        ###

        ## Get source count.
        foo = subprocess.run(
            'zgrep -Ec "$" ' + args.directory + '/' + aid + '-src.gaf.gz',
            shell=True, check=False, stdout=subprocess.PIPE)
        if type(foo) is not subprocess.CompletedProcess:
            die_screaming('Shell fail on: ' + str(foo))
        elif foo.returncode == 2:
            die_screaming('Bad file on: ' + str(foo))
        count_gaf_src = int(foo.stdout)
        
        ## Get product count.
        foo = subprocess.run(
            'zgrep -Ec "$" ' + args.directory + '/' + aid + '.gaf.gz',
            shell=True, check=False, stdout=subprocess.PIPE)
        if type(foo) is not subprocess.CompletedProcess:
            die_screaming('Shell fail on: ' + str(foo))
        elif foo.returncode == 2:
            die_screaming('Bad file on: ' + str(foo))
        count_gaf_prod = int(foo.stdout)
        
        ## Assemble report object.
        lookup[aid] = {
            'id': aid,
            'lines': {
                'total': lines_in_file,
                'fatal': lines_fatal,
                'associations': lines_assocs,
                'skipped': lines_skipped
            },
            'actual': {
                'gaf-source': count_gaf_src,
                'gaf-product': count_gaf_prod
            }
        }
    logger.info(lookup)

    ###
    ### Final QC crunching.
    ###

    for aid, obj in lookup.items():

        ## Unwind.
        lines_in_file = obj['lines']['total']
        lines_fatal = obj['lines']['fatal']
        lines_assocs = obj['lines']['associations']
        lines_skipped = obj['lines']['skipped']
        count_gaf_src = obj['actual']['gaf-source']
        count_gaf_prod = obj['actual']['gaf-product']

        ###
        ### Checks.
        ###

        ## There must be a product when something comes in.
        ## Keep in mind that the src files sometimes have header
        ## comments, but no content, so we give a buffer of 8.
        if count_gaf_prod == 0 and count_gaf_src > 8:
            logger.warning('count_gaf_src ' + str(count_gaf_src))
            logger.warning('count_gaf_prod ' + str(count_gaf_prod))
            die_screaming('No product found for: ' + aid)
        ## Product must not be a "severe" reduction from source, but
        ## only in cases of larger files.
        if (count_gaf_prod < (count_gaf_src / 2)) and count_gaf_src > 25:
            die_screaming('Severe reduction of product for: ' + aid)
        ## No fatal remarks should have been made.
        if lines_fatal > 0:
            die_screaming('Fatal error in: ' + aid)
        ## Source count should not be more than 10% off from reported
        ## count.
        if count_gaf_src < (((lines_in_file - lines_assocs) + lines_skipped) * 0.9):
            die_screaming('Expected associations worryingly reduced: ' + aid)

        print(aid + ' okay...')
        
    print('All passing.')

    
## You saw it coming...
if __name__ == '__main__':
    main()
