"""Merge all available pipeline reports into a single HTML file."""
####
#### Merge all available pipeline reports into a single HTML file.
####
#### Example usage to analyze "whatever":
####  python3 merge-all-reports.py --help
####  mkdir -p /tmp/mnt || true
####  mkdir -p /tmp/foo || true
####  sshfs -oStrictHostKeyChecking=no -o IdentitiesOnly=true -o IdentityFile=/home/sjcarbon/local/share/secrets/bbop/ssh-keys/foo.skyhook -o idmap=user skyhook@skyhook.berkeleybop.org:/home/skyhook /tmp/mnt/
####  cp /tmp/mnt/master/reports/whatever* /tmp/foo
####  fusermount -u /tmp/mnt
####  python3 merge-all-reports.py -v -d /tmp/foo
####

import sys
import argparse
import logging
import glob
import os
import subprocess
import markdown

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger('merge')
LOGGER.setLevel(logging.WARNING)

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
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    args = parser.parse_args()

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
    ## independent of the metadata.
    src_filenames = glob.glob(args.directory + '/*.report.md')
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
        ids.append(potential_id)

    ## TODO: Check found resources versus metadata.
    LOGGER.info('Found ' + str(len(ids)) + ' resource(s).')

    ## Now that we have IDs, start the great concatenation.
    lookup = {}
    for aid in ids:

        ###
        ### Read and munge all the files we'll put together.
        ###

        LOGGER.info("Processing: " + aid)

        ##
        rmd_p = False
        rmd_data = 'No report generated.'
        rmd_fname = args.directory + '/' + aid + '.report.md'
        if os.path.isfile(rmd_fname):
            with open(rmd_fname) as fileh:
                rmd_data = fileh.read()
                rmd_p = True

        ##
        otc_p = False
        otc_data = 'No report generated.'
        otc_fname = args.directory + '/' + aid + '-owltools-check.txt'
        if os.path.isfile(otc_fname):
            with open(otc_fname) as fileh:
                otc_data = fileh.read()
                otc_p = True

        ##
        sum_p = False
        sum_data = 'No report generated.'
        sum_fname = args.directory + '/' + aid + '-summary.txt'
        if os.path.isfile(sum_fname):
            with open(sum_fname) as fileh:
                sum_data = fileh.read()
                sum_p = True

        ##
        pre_p = False
        pre_data = 'No report generated.'
        pre_fname = args.directory + '/' + aid + '-prediction-report.txt'
        if os.path.isfile(pre_fname):
            with open(pre_fname) as fileh:
                pre_data = fileh.read()
                pre_p = True

        ##
        epr_p = False
        epr_data = 'No report generated.'
        epr_fname = args.directory + '/' + aid + '-prediction-experimental-report.txt'
        if os.path.isfile(epr_fname):
            with open(epr_fname) as fileh:
                epr_data = fileh.read()
                epr_p = True

        # ###
        # ### Extract information from actual using grep.
        # ###  grep EXIT STATUS
        # ###  The following exit values are returned:
        # ###  0 One or more matches were found.
        # ###  1 No matches were found.
        # ###  2 Syntax errors or inaccessible files (even if matches were found).
        # ###

        # ## Get source count.
        # foo = subprocess.run(
        #     'zgrep -Ec "$" ' + args.directory + '/' + aid + '-src.gaf.gz',
        #     shell=True, check=False, stdout=subprocess.PIPE)
        # if type(foo) is not subprocess.CompletedProcess:
        #     die_screaming('Shell fail on: ' + str(foo))
        # elif foo.returncode == 2:
        #     die_screaming('Bad file on: ' + str(foo))
        # count_gaf_src = int(foo.stdout)

        ## Output file.
        with open(args.directory + '/' + aid + '-report.html', 'w') as f:
            f.write('<html>\n')
            f.write('<body>\n')

            f.write('<h1>Table of contents</h1>\n')
            f.write('<div id="toc">\n')
            f.write(' <p>\n')
            f.write('  <ul>\n')
            f.write('   <li>\n')
            f.write('    <a href="#sum">Summary</a>')
            if sum_p:
                f.write('    (<a href="'+ aid +'-summary.txt">original</a>)\n')
            else:
                f.write('    \n')
            f.write('   </li>\n')
            f.write('   <li>\n')
            f.write('    <a href="#rmd">Report</a>')
            if rmd_p:
                f.write('    (<a href="'+ aid +'.report.md">original</a>)\n')
            else:
                f.write('    \n')
            f.write('   </li>\n')
            f.write('   <li>\n')
            f.write('    <a href="#otc">OWLTools check</a>')
            if otc_p:
                f.write('    (<a href="'+ aid +'-owltools-check.txt">original</a>)\n')
            else:
                f.write('    \n')
            f.write('   </li>\n')
            f.write('   <li>\n')
            f.write('    <a href="#pre">Predictions</a>')
            if pre_p:
                f.write('    (<a href="'+ aid +'-prediction-report.txt">original</a>)\n')
            else:
                f.write('    \n')
            f.write('   </li>\n')
            f.write('   <li>\n')
            f.write('    <a href="#epr">Predictions (experimental)</a>')
            if epr_p:
                f.write('    (<a href="'+ aid +'-prediction-experimental-report.txt">original</a>)\n')
            else:
                f.write('    \n')
            f.write('   </li>\n')
            f.write('  </ul>\n')
            f.write(' </p>\n')
            f.write('</div>\n')

            f.write('<h1>Summary</h1>\n')
            f.write('<div id="sum">\n')
            #f.write(' <blockquote>\n')
            f.write(markdown.markdown(sum_data))
            #f.write(sum_data)
            #f.write(' </blockquote>\n')
            f.write('\n')
            f.write('</div>\n')

            f.write('<h1>Report</h1>\n')
            f.write('<div id="rmd">\n')
            f.write(markdown.markdown(rmd_data))
            #f.write(rmd_data)
            f.write('\n')
            f.write('</div>\n')

            f.write('<h1>OWLTools check</h1>\n')
            f.write('<div id="otc">\n')
            #f.write(' <blockquote>\n')
            #f.write(markdown.markdown(otc_data))
            #f.write(otc_data)
            f.write(otc_data.replace("\n","<br />\n"))
            #f.write(' </blockquote>\n')
            f.write('\n')
            f.write('</div>\n')

            f.write('<h1>Predictions</h1>\n')
            f.write('<div id="pre">\n')
            f.write(pre_data.replace("\n","<br />\n"))
            f.write('\n')
            f.write('</div>\n')

            f.write('<h1>Predictions (experimental)</h1>\n')
            f.write('<div id="epr">\n')
            f.write(epr_data.replace("\n","<br />\n"))
            f.write('\n')
            f.write('</div>\n')

            f.write('</body>\n')
            f.write('</html>\n')
        f.closed

    ## Close out if everything went okay.
    if DIED_SCREAMING_P:
        LOGGER.info('Errors happened.')
        sys.exit(1)
    else:
        LOGGER.info('All passing.')


## You saw it coming...
if __name__ == '__main__':
    main()
