"""
For a given top-level S3 bucket, get the "directory" listing and output an HTML index suitable for capping. Also see ./scripts/directory_indexer.py.
"""
####
#### For a given top-level S3 bucket, get the "directory" listing and output an HTML index suitable for capping. Also see ./scripts/directory_indexer.py.
####
#### Example usage:
####  python3 bucket-indexer.py --help
####  python3 ./scripts/bucket-indexer.py --verbose --credentials ~/local/share/secrets/bbop/aws/s3/aws-go-push.json --bucket go-data-product-release --inject ./scripts/directory-index-template.html --prefix http://release.geneontology.org
####

## Standard imports.
import sys
import urllib
import argparse
import json
import logging
import boto3
import pystache

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('index')
LOG.setLevel(logging.WARNING)

def die_screaming(instr):
    """
    Make sure we exit in a way that will get Jenkins's attention.
    """
    LOG.error(instr)
    sys.exit(1)

def get_args():
    """
    Deal with incoming.
    """

    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    parser.add_argument('-c', '--credentials', required=True,
                        help='The credentials to used, in JSON')
    parser.add_argument('-b', '--bucket', required=True,
                        help='The S3 bucket to copy into')
    parser.add_argument('-i', '--inject', required=True,
                        help='Mustache template file to inject into')
    parser.add_argument('-p', '--prefix', required=True,
                        help='The prefix to add to all files and links')
    parser.add_argument('-l', '--location',
                        help='The S3 location to use')

    return parser

def main():
    """The main runner for our script."""

    parser = get_args()
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')
    else:
        ## If not verbose, turn down boto3.
        boto3.set_stream_logger(name='boto3', level=logging.WARNING)
        boto3.set_stream_logger(name='botocore', level=logging.WARNING)
        logging.getLogger("requests").setLevel(logging.WARNING)

    ## Ensure credentials.
    if not args.credentials:
        die_screaming('need a credentials argument')
    LOG.info('Will use credentials: ' + args.credentials)
    ## Ensure bucket.
    if not args.bucket:
        die_screaming('need a bucket argument')
    bucket, slash, toppath = args.bucket.partition('/')
    if toppath != '':
        LOG.info('Will put to bucket: ' + bucket + '; with path: ' + toppath)
    else:
        LOG.info('Will put to bucket at top level: ' + bucket)
    ## Ensure bucket location.
    if not args.location:
        args.location = 'us-east-1'
        LOG.info('Will use S3 bucket location default: ' + args.location)
    else:
        LOG.info('Will use S3 bucket location: ' + args.location)

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

    ## Extract S3 credentials.
    creds = None
    with open(args.credentials) as chandle:
        creds = json.loads(chandle.read())
    #LOG.info(creds)

    ## Collect the top-level prefixes.
    s3 = boto3.resource('s3', region_name=args.location,
                          aws_access_key_id=creds['accessKeyId'],
                          aws_secret_access_key=creds['secretAccessKey'])
    bucket = s3.Bucket(args.bucket)
    result = bucket.meta.client.list_objects(Bucket=bucket.name, Delimiter='/')
    dirs = []
    for pre in result.get('CommonPrefixes'):
        name = pre.get('Prefix').rstrip('//')
        url = prefix + name + '/' + 'index.html'
        dirs.append({"name": name, "url": url})

    ## Assemble for use.
    dir_index = {
        'parent': [],
        ##'children': sorted(dirs, key=lambda x: x['name']),
        'children': dirs,
        'location': prefix,
        'current': [],
    }

    ## Test output.
    jsondump = json.dumps(dir_index, sort_keys=True, indent=4)
    LOG.info(jsondump)

    ## Output to filesystem.
    output = pystache.render(output_template, dir_index)

    print(output)

## You saw it coming...
if __name__ == '__main__':
    main()
