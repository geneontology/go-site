"""Update a single file in an already published Zenodo deposition and collect the new version of the DOI."""
####
#### Update a single file in an already published Zenodo deposition
#### and collect the new version of the DOI.
####
#### Example usage to operate in Zenodo:
####  python3 ./scripts/zenodo-version-update.py --help
#### Implicit new version:
####  python3 ./scripts/zenodo-version-update.py --verbose --sandbox --key abc --concept 199441 --file /tmp/go-release-reference.tgz --output /tmp/release-doi.json
#### Explicit new version:
####  python3 ./scripts/zenodo-version-update.py --verbose --sandbox --key abc --concept 199441 --file /tmp/go-release-reference.tgz --output /tmp/release-doi.json --revision `date +%Y-%m-%d`
####

## Standard imports.
import sys
import argparse
import logging
import os
import json
import requests
# from requests_toolbelt.multipart.encoder import MultipartEncoder
import datetime

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('zenodo-version-update')
LOG.setLevel(logging.WARNING)

def die(instr):
    """Die a little inside."""
    LOG.error(instr)
    sys.exit(1)

def main():
    """The main runner for our script."""

    ## Deal with incoming.
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    parser.add_argument('-k', '--key',
                        help='The access key (token) to use for commands.')
    parser.add_argument('-s', '--sandbox', action='store_true',
                        help='If used, will aim at the sandbox server.')
    parser.add_argument('-c', '--concept',
                        help='[optional] The base published concept that we want to work off of.')
    parser.add_argument('-f', '--file',
                        help='[optional] The local file to use in an action.')
    parser.add_argument('-o', '--output',
                        help='[optional] The local file to use in an action.')
    parser.add_argument('-r', '--revision',
                        help='[optional] Add optional revision string to update.')
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    ## Ensure server URL.
    server_url = 'https://zenodo.org'
    if args.sandbox :
        server_url = 'https://sandbox.zenodo.org'
    LOG.info('Will use: ' + server_url)

    ## Ensure key/token.
    if not args.key:
        die('need a "key/token" argument')
    LOG.info('Will use key/token: ' + args.key)

    ## Check JSON output file.
    if args.output:
        LOG.info('Will output to: ' + args.output)

    ## Check JSON output file.
    revision = None
    if args.revision:
        revision = args.revision
        LOG.info('Will add explicit "version" string to revision: ' + revision)
    else:
        revision = datetime.datetime.now().strftime("%Y-%m-%d")
        LOG.info('Will add implicit "version" string to revision: ' + revision)

    ## Ensure concept.
    if not args.concept:
        die('need a "concept" argument')
    concept_id = int(args.concept)
    LOG.info('Will use concept ID: ' + str(concept_id))

    def die_screaming(instr, response=None, deposition_id=None):
        """Make sure we exit in a way that will get Jenkins's attention, giving good response debugging information along the way if available."""
        if str(type(response)) == "<class 'requests.models.Response'>":
            if not response.text or response.text == "":
                LOG.error('no response from server')
                LOG.error(instr)
            else:
                LOG.error(json.dumps(response.json(), indent=4, sort_keys=True))
                LOG.error(response.status_code)
                LOG.error(instr)
                if deposition_id:
                    LOG.error("attempting to discard working deposition: " + str(deposition_id))
                    response = requests.delete(server_url + '/api/deposit/depositions/' + str(deposition_id), params={'access_token': args.key})
                    if response.status_code != 204:
                        LOG.error('failed to discard: manual intervention plz')
                        LOG.error(response.status_code)
                    else:
                        LOG.error('discarded session')
        sys.exit(1)

    ###
    ###
    ###

    ## Convert the filename into a referential base for use later on.
    filename = os.path.basename(args.file)

    ## Get listing of all depositions.
    response = requests.get(server_url + '/api/deposit/depositions', params={'access_token': args.key})

    ## Test file listing okay.
    if response.status_code != 200:
        die_screaming('cannot get deposition listing', response)

    ## Go from concept id to deposition listing.
    depdoc = None
    for entity in response.json():
        conceptrecid = entity.get('conceptrecid', None)
        if conceptrecid and str(conceptrecid) == str(concept_id):
            depdoc = entity

    ## Test deposition doc search okay.
    if not depdoc:
        die_screaming('could not find desired concept', response)

    ## Test that status is published (no open session).
    if depdoc.get('state', None) != 'done':
        die_screaming('desired concept currently has an "open" status', response)

    ## Get current deposition id.
    curr_dep_id = int(depdoc.get('id', None))
    LOG.info('current deposition id: ' + str(curr_dep_id))

    ## Get files for the current depositon.
    response = requests.get(server_url + '/api/deposit/depositions/' + str(curr_dep_id) + '/files', params={'access_token': args.key})

    ## Test file listing okay.
    if response.status_code != 200:
        die_screaming('cannot get file listing', response)

    ## Go from filename to file ID.
    file_id = None
    for filedoc in response.json():
        filedoc_fname = filedoc.get('filename', None)
        if filedoc_fname and filedoc_fname == filename:
            file_id = filedoc.get('id', None)

    ## Test file ID search okay.
    if not file_id:
        die_screaming('could not find desired filename', response)

    ## Open versioned deposition session.
    response = requests.post(server_url + '/api/deposit/depositions/' + str(curr_dep_id) + '/actions/newversion', params={'access_token': args.key})

    ## Test correct opening.
    if response.status_code != 201:
        die_screaming('cannot open new version/session', response, curr_dep_id)

    ## Get the new deposition id for this version.
    new_dep_id = None
    d = response.json()
    if d.get('links', False) and d['links'].get('latest_draft', False):
        new_dep_id = int(d['links']['latest_draft'].split('/')[-1])

    ## Test that there is a new deposition ID.
    if not new_dep_id:
        die_screaming('could not find a new deposition ID', response, curr_dep_id)
    LOG.info('new deposition id: ' + str(new_dep_id))

    ## Delete the current file (by ID) in the session.
    #response = requests.delete('%s/%s' % (new_bucket_url, filename), params={'access_token': args.key})
    response = requests.delete(server_url + '/api/deposit/depositions/' + str(new_dep_id) + '/files/' + str(file_id), params={'access_token': args.key})

    ## Test correct file delete.
    if response.status_code != 204:
        die_screaming('could not delete file', response, new_dep_id)

    ###
    ### WARNING: Slipping into the (currently) unpublished v2 API here
    ### to get around file size issues we ran into.
    ### I don't quite understand the bucket API--the URLs shift more than
    ### I'd expect, but the following works.
    ###
    ### NOTE: secret upload magic: https://github.com/zenodo/zenodo/issues/833#issuecomment-324760423 and
    ### https://github.com/zenodo/zenodo/blob/df26b68771f6cffef267c056cf38eb7e6fa67c92/tests/unit/deposit/test_api_buckets.py
    ###

    ## Get new depositon...as the bucket URLs seem to have changed
    ## after the delete...
    response = requests.get(server_url + '/api/deposit/depositions/' + str(new_dep_id), params={'access_token': args.key})

    ## Get the bucket for upload.
    new_bucket_url = None
    d = response.json()
    if d.get('links', False) and d['links'].get('bucket', False):
        new_bucket_url = d['links'].get('bucket', False)

    ## Test that there are new bucket and publish URLs.
    if not new_bucket_url:
        die_screaming('could not find a new bucket URL', response, curr_dep_id)
    LOG.info('new bucket URL: ' + str(new_bucket_url))

    ## Add the new version of the file. Try and avoid:
    ## https://github.com/requests/requests/issues/2717 with
    ## https://toolbelt.readthedocs.io/en/latest/uploading-data.html#streaming-multipart-data-encoder
    ## Try 1 caused memory overflow issues (I'm trying to upload many GB).
    ## Try 2 "should" have worked, but zenodo seems incompatible.
    ## with requests and the request toolbelt, after a fair amount of effort.
    ## Try 3 appears to work, but uses an unpublished API and injects the
    ## multipart information in to the file... :(
    ##
    ## Try 4...not working...
    # encoder = MultipartEncoder({
    #     'file': (filename, open(args.file, 'rb'),'application/octet-stream')
    # })
    # response = requests.put('%s/%s' % (new_bucket_url, filename),
    #                         data=encoder,
    #                         #data = {'filename': filename},
    #                         #files = {'file': open(args.file, 'rb')},
    #                         params = {'access_token': args.key},
    #                         headers={
    #                             #"Accept":"multipart/related; type=application/octet-stream",
    #                             "Content-Type":encoder.content_type
    #                         })
    ## Try 3

    with open(args.file, "rb") as fp:
        response = requests.put("{url}/{fname}".format(url=new_bucket_url, fname=filename),
                                data=fp,
                                params={'access_token': args.key}
                                )
    # ## Try 2
    # encoder = MultipartEncoder({
    #     #'filename': filename,
    #     'file': (filename, open(args.file, 'rb'))
    # })
    # response = requests.post(server_url + '/api/deposit/depositions/' + str(new_dep_id) + '/files', params={'access_token': args.key}, data=encoder)
    # ## Try 1
    # data = {'filename': filename}
    # files = {'file': open(args.file, 'rb')}
    # response = requests.post(server_url + '/api/deposit/depositions/' + str(new_dep_id) + '/files', params={'access_token': args.key}, data=data, files=files)

    ## Test correct file add.
    if response.status_code > 200:
        die_screaming('could not add file', response, new_dep_id)

    ###
    ### NOTE: Leaving v2 area.
    ###

    ## Update metadata version string; first, get old metadata.
    response = requests.get(server_url + '/api/deposit/depositions/' + str(new_dep_id), params={'access_token': args.key})

    ## Test correct metadata get.
    if response.status_code != 200:
        die_screaming('could not get access to current metadata', response, new_dep_id)

    ## Get metadata or die trying.
    oldmetadata = None
    if response.json().get('metadata', False):
        oldmetadata = response.json().get('metadata', False)
    else:
        die_screaming('could not get current metadata', response, new_dep_id)

    ## Construct update metadata and send to server.
    oldmetadata['version'] = revision
    newmetadata = {
        "metadata": oldmetadata
    }
    headers = {"Content-Type": "application/json"}
    response = requests.put(server_url + '/api/deposit/depositions/' + str(new_dep_id), params={'access_token': args.key}, data=json.dumps(newmetadata), headers=headers)

    ## Test correct metadata put.
    if response.status_code != 200:
        die_screaming('could not add optional metadata', response, new_dep_id)

    ## Publish.
    response = requests.post(server_url + '/api/deposit/depositions/' + str(new_dep_id) + '/actions/publish', params={'access_token': args.key})

    ## Test correct re-publish/version action.
    if response.status_code != 202:
        die_screaming('could not re-publish', response, new_dep_id)

    ## Extract new DOI.
    doi = None
    if response.json().get('doi', False):
        doi = response.json().get('doi', False)
    else:
        die_screaming('could not get DOI', response, new_dep_id)

    ## Done!
    LOG.info(str(doi))
    if args.output:
        with open(args.output, 'w+') as fhandle:
            fhandle.write(json.dumps({'doi': doi}, sort_keys=True, indent=4))

## You saw it coming...
if __name__ == '__main__':
    main()
