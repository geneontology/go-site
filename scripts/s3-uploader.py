"""
Copy the contents of a local directory into the correct S3 location,
using the correct metadata as supplied by the metadata file (or
internal defaults).
"""
####
#### Copy the contents of a local directory into the correct S3
#### location, using the correct metadata as supplied by the metadata
#### file (or internal defaults).
####
#### Example usage:
####  python3 s3-uploader.py --help
####  mkdir -p /tmp/mnt || true
####  mkdir -p /tmp/foo || true
####  sshfs -oStrictHostKeyChecking=no -o IdentitiesOnly=true -o IdentityFile=/home/sjcarbon/local/share/secrets/bbop/ssh-keys/foo.skyhook -o idmap=user skyhook@skyhook.berkeleybop.org:/home/skyhook /tmp/mnt/
####  cp -r /tmp/mnt/master/* /tmp/foo
####  fusermount -u /tmp/mnt
####  python3 ./scripts/s3-uploader.py -v --credentials ~/local/share/secrets/bbop/aws/s3/aws-go-push.json --directory ~/tmp/elpa/archives --bucket go-data-testing-sandbox --number 7 --pipeline foo-pipe
####

## Standard imports.
import sys
import urllib
import argparse
import logging
import os
import json
import boto3
import math

from filechunkio import FileChunkIO

## Default mimetype metadata--everything that we'll be dealing with,
## so controlled.
MIMES = {
    'csv': 'text/csv',
    'gaf': 'text/plain',
    'gz': 'application/gzip',
    'html': 'text/html',
    ## http://www.rfc-editor.org/rfc/rfc2046.txt
    'jnl': 'application/octet-stream',
    'js': 'application/javascript',
    'json': 'application/json',
    'md': 'text/markdown',
    'obo': 'text/obo',
    'owl': 'application/rdf+xml',
    'report': 'text/plain',
    ## https://www.w3.org/TeamSubmission/turtle/#sec-mime
    'ttl': 'text/turtle',
    'tsv': 'text/tab-separated-values',
    'txt': 'text/plain',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    ## Default.
    '': 'text/plain'
    }

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('aggregate')
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
    parser.add_argument('-c', '--credentials',
                        help='The credentials to used, in JSON')
    parser.add_argument('-d', '--directory',
                        help='The directory to copy from')
    parser.add_argument('-b', '--bucket',
                        help='The S3 bucket to copy into')
    parser.add_argument('-n', '--number',
                        help='Optional: the "build-number" to add to the meta')
    parser.add_argument('-p', '--pipeline',
                        help='Optional: the "build-pipeline" to add to the meta')
    parser.add_argument('-m', '--mimetypes',
                        help='TODO: The mimetypes metadata to use, in JSON')
    parser.add_argument('-l', '--location',
                        help='TODO: The S3 location to use')

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
    ## Ensure directory.
    if not args.directory:
        die_screaming('need a directory argument')
    args.directory = args.directory.rstrip('//')
    LOG.info('Will operate in: ' + args.directory)
    ## Ensure bucket.
    if not args.bucket:
        die_screaming('need a bucket argument')
    bucket, slash, toppath = args.bucket.partition('/')
    if toppath != '':
        LOG.info('Will put to bucket: ' + bucket + '; with path: ' + toppath)
    else:
        LOG.info('Will put to bucket at top level: ' + bucket)
    ## Ensure mimetype metadata.
    if not args.mimetypes:
        LOG.info('Will use internal mimetype defaults')
    else:
        LOG.info('TODO: Will get mimetype metadata from: ' + args.metadata)
    ## Ensure bucket location.
    if not args.location:
        args.location = 'us-east-1'
        LOG.info('Will use S3 bucket location default: ' + args.location)
    else:
        LOG.info('Will use S3 bucket location: ' + args.location)

    ## Extract S3 credentials.
    creds = None
    with open(args.credentials) as chandle:
        creds = json.loads(chandle.read())
    #LOG.info(creds)

    s3 = boto3.resource('s3', region_name=args.location,
                          aws_access_key_id=creds['accessKeyId'],
                          aws_secret_access_key=creds['secretAccessKey'])

    # s3 = boto3.resource("s3", creds['accessKeyId'], creds['secretAccessKey'])

    #s3.Object('mybucket', 'hello.txt').put(Body=open('/tmp/hello.txt', 'rb'))

    ## Walk tree.
    for curr_dir, dirs, files in os.walk(args.directory):

        ## We can navigate up if we are not in the root.
        relative_to_start = curr_dir.rstrip('//')[len(args.directory):]
        relative_to_start = relative_to_start.lstrip('//')
        LOG.info('curr_dir: ' + curr_dir + ' (' + relative_to_start + ')')

        ## Note files and directories.
        for fname in files:

            ## Get correct mime type.
            fext = os.path.splitext(fname)[1].lstrip('.')
            mime = MIMES.get('') # start with default
            if MIMES.get(fext, False):
                mime = MIMES.get(fext)

            ## Figure out S3 path/key and final filename, keeping in
            ## mind that relative_to_Start can be empty if root.
            s3path = fname
            if relative_to_start:
                s3path = relative_to_start + '/' + fname
            filename = os.path.join(curr_dir, fname)

            tags = {}
            if args.number:
                tags['build-number'] = args.number
            if args.pipeline:
                tags['build-pipeline'] = args.pipeline
            tags_str = urllib.parse.urlencode(tags)

            ## Visual check.
            LOG.info('file: ' + filename)
            if toppath != '':
                s3path = toppath + '/' + s3path
            LOG.info(' -> [' + bucket + '] ' + s3path + \
                      '(' + mime + ', ' + tags_str + ')')

            ## Create the new object that we want.
            s3bucket = s3.Bucket(bucket)
            multipart_upload(filename, s3bucket, s3path, content_type=mime, metadata=tags)

            # newobj = s3.Object(args.bucket, s3path)
            # outfile = open(filename, 'rb')
            # newobj.put(Body=outfile, \
            #                ContentType=mime, \
            #                Metadata=tags,
            #                ACL='public-read') #Tagging=tags_str)

            # outbod = open(os.path.join(curr_dir, fname), 'rb')
            # .put(Body=outbod, 'rb')

        # for dname in dirs:
        #     #LOG.info('dir: ' + os.path.join(curr_dir, dname))
        #     pass

def multipart_upload(source_file_path, s3_bucket, s3_path, content_type=None, metadata=None, policy=None):

    header = {}
    if content_type:
        header["ContentType"] = content_type

    if metadata:
        header["Metadata"] = metadata

    if policy:
        header["ACL"] = policy

    s3_bucket.upload_file(source_file_path, s3_path, ExtraArgs=header)

## You saw it coming...
if __name__ == '__main__':
    main()
