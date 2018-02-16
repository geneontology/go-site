"""Create a BDBag remote file manifest over chosen directories with given parameters."""
####
#### Create a BDBag remote file manifest over chosen directories with
#### given parameters.
####
#### Example usage to create a manifest:
####  python3 create-bdbag-remote-file-manifest.py --help
####  python3 ./scripts/create-bdbag-remote-file-manifest.py -v --walk ./this/dir --remote http://experimental.geneontology.io --output /tmp/manifest.json
####
#### Example run with our s3-uploader.py and bdbag:
####  python3 ./scripts/s3-uploader.py -v --credentials ~/local/share/secrets/bbop/aws/s3/aws-go-push.json --directory /tmp/waffle/ --bucket go-data-testing-sandbox --number 7 --pipeline foo-pipe
####  python3 ./scripts/create-bdbag-remote-file-manifest.py -v --walk /tmp/waffle --remote https://s3.amazonaws.com/go-data-testing-sandbox --output /tmp/manifest.json
####  mkdir /tmp/foobar
####  bdbag ./foobar --remote-file-manifest /tmp/manifest.json  --archive tgz
####  ...on a different machine, I have gotten foobar.gz
####  tar -zxvf foobar.tgz
####  bdbag ./foobar --resolve-fetch all
####

## Standard imports.
import sys
import argparse
import logging
import os
import json
import hashlib

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('bdbag-manifest')
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
    parser.add_argument('-w', '--walk',
                        help='Combined report JSON file')
    parser.add_argument('-r', '--remote',
                        help='The remote server to map onto')
    parser.add_argument('-o', '--output',
                        help='The file to dump the JSON output to')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    ## Ensure directory.
    if not args.walk:
        die_screaming('need a "walk" argument')
    LOG.info('Will walk directory: ' + args.walk)
    ## Ensure URL.
    if not args.remote:
        die_screaming('need "remote" argument')
    LOG.info('Will map unto URL: ' + args.remote)
    ## Ensure output file.
    if not args.output:
        die_screaming('need an output file argument')
    LOG.info('Will output to: ' + args.output)

    ## Walk tree.
    lookup = [];
    for curr_dir, dirs, files in os.walk(args.walk):

        ## We can navigate up if we are not in the root.
        relative_to_start = curr_dir.rstrip('//')[len(args.walk):]
        relative_to_start = relative_to_start.lstrip('//')
        LOG.info('curr_dir: ' + curr_dir + ' (' + relative_to_start + ')')

        ## Note files and directories.
        for fname in files:

            ## Figure out S3 path/key and final filename, keeping in
            ## mind that relative_to_Start can be empty if root.
            webpath = fname
            if relative_to_start:
                webpath = relative_to_start + '/' + fname
            filename = os.path.join(curr_dir, fname)

            size = os.path.getsize(filename)
            md5sum = hashlib.md5(open(filename, 'rb').read()).hexdigest()

            ## Visual check.
            LOG.info('file: '+ filename + ' -> [' + args.remote + '] / ' + webpath + '; ' + str(size) + ', ' + md5sum)

            lookup.append({
                'url': args.remote + '/' + webpath,
                'length': str(size),
                'filename': webpath,
                'md5': md5sum
            })

    ## Final writeout.
    output = json.dumps(lookup, sort_keys=True, indent=4)
    with open(args.output, 'w+') as fhandle:
        fhandle.write(output)
    LOG.info(output)

## You saw it coming...
if __name__ == '__main__':
    main()
