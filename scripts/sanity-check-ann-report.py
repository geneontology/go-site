"""Give a report on the "sanity" of the pipeline association data from available metadata; skips uniprot."""
####
#### Give a report on the "sanity" of the pipeline association data.
####
#### This script assumes access to skyhook or a flat directory of
#### pipeline association products and reports. We used to have those
#### in the same directory, now they are different; they'll need to be
#### recombined for this script to work right now.
#### NOTE: Skip uniprot if identified.
####
#### Example usage to analyze "whatever":
####  python3 sanity-check-ann-report.py --help
####  mkdir -p /tmp/mnt || true
####  mkdir -p /tmp/foo || true
####  sshfs -oStrictHostKeyChecking=no -o IdentitiesOnly=true -o IdentityFile=/home/sjcarbon/local/share/secrets/bbop/ssh-keys/foo.skyhook -o idmap=user skyhook@skyhook.berkeleybop.org:/home/skyhook /tmp/mnt/
####  cp /tmp/mnt/master/annotations/whatever* /tmp/foo
####  cp /tmp/mnt/master/reports/whatever* /tmp/foo
####  cp /tmp/mnt/master/products/upstream_and_raw_data/whatever* /tmp/foo
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
LOGGER = logging.getLogger('sanity')
LOGGER.setLevel(logging.WARNING)

## Some parameters to play with.
src_header_size = 8
small_file_size = 25

## Make sure we exit in a way that will get Jenkins's attention.
DIED_SCREAMING_P = False

def die_screaming(string):
    """ Die and take our toys home. """
    global DIED_SCREAMING_P
    LOGGER.error(string)
    DIED_SCREAMING_P = True
    #sys.exit(1)

def main():

    ## Deal with incoming.
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-d', '--directory',
                        help='The directory to act on')
    parser.add_argument('-n', '--ignore_noctua', action='store_const', const=True,
                        help='Ignore noctua files in sanity checks')
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
        LOGGER.setLevel(logging.INFO)
        LOGGER.info('Verbose: on')

    ## Ensure directory.
    if not args.directory:
        die_screaming('need a directory argument')
    LOGGER.info('Will operate in: ' + args.directory)

    ids = []

    ## Get files out of target directory, searching for the IDs
    ## independent of the metadata (as we'll need to check that too).
    src_filenames = glob.glob(args.directory + '/*-src.*')
    LOGGER.info(src_filenames)
    for src_filename in src_filenames:
        ## Chop off all extensions.
        potential_id = src_filename
        ## I don't know what extensions we'll be using in the future,
        ## so just chop everything off.
        while os.path.splitext(potential_id)[1] != '':
            potential_id = os.path.splitext(potential_id)[0]
        ## Trim off the path.
        potential_id = os.path.basename(potential_id)
        ## If we don't want to check noctua annotation files for some reason.
        if args.ignore_noctua and "noctua" in potential_id:
            continue
        ## We know that "-src" should be there, so off with that.
        potential_id = potential_id[:-4]
        ids.append(potential_id)

    ## TODO: Check found resources versus metadata.
    LOGGER.info('Found ' + str(len(ids)) + ' resource(s).')
    LOGGER.info('TODO: compare found resources versus metadata.')

    ## Get the report file and assemble a data structure for tests.
    lookup = {}
    for aid in ids:

        if aid.lower().find('uniprot') != -1:
            LOGGER.info("Smells like uniprot; skipping: " + aid)
            continue
        merge_paint_p = False
        ## This trigger is expected to be removed as we fix
        ## https://github.com/geneontology/go-site/issues/642#issuecomment-393349357
        if aid.lower().find('paint_') != -1 and not aid.lower().find('paint_other') != -1:
            LOGGER.info("Smells like paint, but not paint_other; changing mode: " + aid)
            merge_paint_p = True
            #continue

        ###
        ### Extract information from the report.
        ###

        LOGGER.info("Processing: " + aid)

        ## Read.
        ## WARNING: Using the markdown version is a holdover from when
        ## the markdown version was the only version.
        read_data = None
        with open(args.directory + '/' + aid + '.report.md') as fileh:
            read_data = fileh.read()

        ## Better be something in there.
        if not read_data:
            die_screaming('No report found for :' + aid)

        ## Found associations.
        res = regexp_lines_assocs.findall(read_data)
        if len(res) != 1:
            die_screaming('Too wrong # matches for associations: {}'.format(len(res)))
        lines_assocs = int(res[0])

        ## Lines skipped.
        res = regexp_lines_skipped.findall(read_data)
        if len(res) != 1:
            die_screaming('Too wrong # matches for lines skipped: {}'.format(len(res)))
        lines_skipped = int(res[0])

        ## Lines in file.
        res = regexp_lines_in_file.findall(read_data)
        if len(res) != 1:
            die_screaming('Too wrong # matches for lines in file: {}'.format(len(res)))
        lines_in_file = int(res[0])

        ## Lines that are fatal.
        res = regexp_lines_fatal.findall(read_data)
        if len(res) > 0:
            die_screaming('Too wrong # matches for lines fatal: {}'.format(len(res)))
        lines_fatal = 0 if len(res) == 0 else int(res[0])

        ###
        ### Extract information from actual using grep.
        ###  grep EXIT STATUS
        ###  The following exit values are returned:
        ###  0 One or more matches were found.
        ###  1 No matches were found.
        ###  2 Syntax errors or inaccessible files (even if matches were found).
        ###

        maid = aid
        if merge_paint_p == True:
            maid = aid + '_valid'

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
            'zgrep -Ec "$" ' + args.directory + '/' + maid + '.gaf.gz',
            shell=True, check=False, stdout=subprocess.PIPE)
        if type(foo) is not subprocess.CompletedProcess:
            die_screaming('Shell fail on: ' + str(foo))
        elif foo.returncode == 2:
            die_screaming('Bad file on: ' + str(foo))
        count_gaf_prod = int(foo.stdout)

        ## Check to see if there is a header/comments.
        foo = subprocess.run(
            'zgrep -Ec "^!" ' + args.directory + '/' + maid + '.gaf.gz',
            shell=True, check=False, stdout=subprocess.PIPE)
        if type(foo) is not subprocess.CompletedProcess:
            die_screaming('Shell fail on: ' + str(foo))
        elif foo.returncode == 2:
            die_screaming('Bad file on: ' + str(foo))
        comments_gaf_prod = int(foo.stdout)

        ## Assemble report object.
        lookup[aid] = {
            'id': aid,
            'lines': { # reported lines
                'total': lines_in_file,
                'fatal': lines_fatal,
                'associations': lines_assocs,
                'skipped': lines_skipped
            },
            'actual': { # actual lines
                'gaf-source': count_gaf_src,
                'gaf-product': count_gaf_prod,
                'gaf-product-comments': comments_gaf_prod
            }
        }
    LOGGER.info(lookup)

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
        count_gaf_prod_comments = obj['actual']['gaf-product-comments']

        ###
        ### Checks.
        ###

        ## All files must have /some/ kind of header showing version.
        ## We will approximate that by just looking for comments.
        if count_gaf_prod_comments == 0:
            die_screaming('No comments (header) in product found for: ' + aid)
        ## There must be a product when something comes in.
        ## Keep in mind that the src files sometimes have header
        ## comments, but no content, so we give a buffer of 8.
        if count_gaf_prod == 0 and count_gaf_src > src_header_size:
            LOGGER.warning('count_gaf_src ' + str(count_gaf_src))
            LOGGER.warning('count_gaf_prod ' + str(count_gaf_prod))
            die_screaming('No product found for: ' + aid)
        ## Product must not be a "severe" reduction from source, but
        ## only in cases of larger files.
        ## This dictionary should be a map of  dataset id `aid` to percent allowable reduction.
        ## gramene_oryza is allowed to be 30% of total. This is due to old IEAs (GORULE:0000029)
        ## goa_chicken_complex is temporarily being reduced by bad evidence codes
        ## goa_chicken_isoform from geneontology/pipeline#367
        ## goa_pig_isoform from geneontology/pipeline#367
        ## ecocyc is temporarily being reduced by bad evidence codes
        reduction_threshold = {
            "gramene_oryza": 0.3,
            "goa_chicken_complex": 0.3,
            "goa_chicken_isoform": 0.3,
            "goa_pig_isoform": 0.3,
            "aspgd": 0.1,
            "ecocyc": 0.3,
            "japonicusdb", 0.25,
            "sgd": 0.25
        }
        if severe_line_reduction_test(aid, reduction_threshold, count_gaf_prod, count_gaf_src, small_file_size):
            ## Probably temporary bypass of the fact that ecocyc is not really
            ## ecocyc for the moment:
            ## https://github.com/geneontology/go-site/issues/1961#issuecomment-1439062352
            if not aid == 'ecocyc':
                die_screaming('Severe reduction of product for: ' + aid)
        ## No fatal remarks should have been made.
        if lines_fatal > 0:
            die_screaming('Fatal error in: ' + aid)
        ## Source count should not be more than 10% off from reported
        ## count--two forms to exercise what should be pretty much the
        ## same numbers in the checker.
        if count_gaf_src < (lines_in_file * 0.9):
            die_screaming('Expected associations worryingly reduced (direct): ' + aid)
        if count_gaf_src < ((lines_assocs + lines_skipped) * 0.9):
            die_screaming('Expected associations worryingly reduced (additive): ' + aid)

        LOGGER.info(aid + ' okay...')

    if DIED_SCREAMING_P:
        LOGGER.info('Errors happened.')
        sys.exit(1)
    else:
        LOGGER.info('All passing.')

def severe_line_reduction_test(aid, thresholds, prod, src, small_file_size):
    default = 0.5
    # Get any override in the threshold dictionary, otherwise will return the default amount
    reduction_amount = thresholds.get(aid, default)

    return prod < reduction_amount * src and src > small_file_size

## You saw it coming...
if __name__ == '__main__':
    main()
