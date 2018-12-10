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
#### Fun command if you need to run multiple tests into a fake sandbox
#### (as uploads must be different); also, using the semi-manual command:
####  reset && mkdir -p /tmp/foo || true && echo `date` > /tmp/foo/date.txt && find /tmp/foo -print0 | tar --null -czf /tmp/go-release-archive.tgz --files-from - && python3 ./scripts/zenodo-version-update.py --verbose --wait --sandbox --key K123 --concept C456 --file /tmp/go-release-archive.tgz --output /tmp/release-doi.json --revision `date +%Y-%m-%d`
####

## Standard imports.
import sys
import argparse
import logging
import os
import json
import requests
import pycurl
from io import BytesIO
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

## Stolen from: https://stackoverflow.com/questions/3041986/apt-command-line-interface-like-yes-no-input
def yes_or_die(question, default="yes"):
    """Ask a yes/no question via raw_input() and return their answer.

    "question" is a string that is presented to the user.
    "default" is the presumed answer if the user just hits <Enter>.
        It must be "yes" (the default), "no" or None (meaning
        an answer is required of the user).

    The "answer" return value is True for "yes" or False for "no".
    """
    valid = {"yes": True, "y": True, "ye": True,
             "no": False, "n": False}
    if default is None:
        prompt = " [y/n] "
    elif default == "yes":
        prompt = " [Y/n] "
    elif default == "no":
        prompt = " [y/N] "
    else:
        raise ValueError("invalid default answer: '%s'" % default)

    selection = False
    while True:
        sys.stdout.write(question + prompt)
        choice = input().lower()
        if default is not None and choice == '':
            selection = valid[default]
            break
        elif choice in valid:
            selection = valid[choice]
            break
        else:
            sys.stdout.write("Please respond with 'yes' or 'no' "
                             "(or 'y' or 'n').\n")

    if selection is False:
        sys.exit(1)
    else:
        return selection

def main():
    """The main runner for our script."""

    ## Deal with incoming.
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    parser.add_argument('-w', '--wait', action='store_true',
                        help='Wait for keyboard event for testing')
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

    pause_p = False
    if args.wait:
        LOG.info('Wait: on')
        pause_p = True

    ## Ensure server URL.
    server_url = 'https://zenodo.org'
    if args.sandbox :
        server_url = 'https://sandbox.zenodo.org'
    LOG.info('Will use: ' + server_url)

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

    ## Standard informative death.
    def die_screaming(instr, response=None, deposition_id=None):
        """Make sure we exit in a way that will get Jenkins's attention, giving good response debugging information along the way if available."""
        LOG.error('die sequence: start')
        if str(type(response)) == "<class 'requests.models.Response'>":
            if not response.text or response.text == "":
                LOG.error('no response from server')
                LOG.error(instr)
            else:
                if not response.json():
                    LOG.error('no json response')
                else:
                    LOG.error(json.dumps(response.json(), indent=4, sort_keys=True))
                LOG.error(response.status_code)
                LOG.error(instr)
                if deposition_id:
                    discard_url = server_url + '/api/deposit/depositions/' + str(deposition_id)
                    LOG.error("attempting to discard working deposition: " + discard_url)

                    response = requests.delete(discard_url, params={'access_token': args.key})
                    if response.status_code != 204:
                        LOG.error('failed to discard: manual intervention plz')
                        LOG.error(response.status_code)
                    else:
                        LOG.error('discarded session')
        LOG.error('die sequence: end')
        sys.exit(1)

    if pause_p:
        yes_or_die('Using "--wait" may leak confidential info; sill use?')

    ## Ensure key/token.
    if not args.key:
        die('need a "key/token" argument')
    if pause_p:
        LOG.info('Will use key/token: ' + args.key)
    else:
        LOG.info('Will use key/token: <XYZ>')

    ###
    ###
    ###

    ## Convert the filename into a referential base for use later on.
    filename = os.path.basename(args.file)
    LOG.info('Will upload file: ' + args.file)
    LOG.info('With upload filename: ' + filename)

    ## Get listing of all depositions.
    init_dep_check_url = server_url + '/api/deposit/depositions'
    LOG.info('next command as curl: ' + 'curl -X GET -H "Accept: application/json" -H "Content-Type: application/json" -H "Authorization: Bearer ' + args.key + '" ' + init_dep_check_url)
    if pause_p:
        yes_or_die('Check initial depositions using script?')
    response = requests.get(init_dep_check_url, params={'access_token': args.key})

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

    ## Open new versioned deposition session.
    new_ver_url = server_url + '/api/deposit/depositions/' + str(curr_dep_id) + '/actions/newversion'
    LOG.info('next command as curl: ' + 'curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -H "Authorization: Bearer ' + args.key + '" ' + new_ver_url)
    if pause_p:
        yes_or_die('New deposition session using script?')
    response = requests.post(new_ver_url, params={'access_token': args.key})

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
        die_screaming('could not find new deposition ID', response, curr_dep_id)
    LOG.info('new deposition id: ' + str(new_dep_id))

    ## Get information on the new deposition.
    get_dep_info_url = server_url + '/api/deposit/depositions/' + str(new_dep_id)
    LOG.info('next command as curl: ' + 'curl -X GET -H "Accept: application/json" -H "Content-Type: application/json" -H "Authorization: Bearer ' + args.key + '" ' + get_dep_info_url)
    if pause_p:
        yes_or_die('Get new deposition info using script?')
    response = requests.get(get_dep_info_url, params={'access_token': args.key})

    ## Test info is okay.
    if response.status_code != 200:
        die_screaming('cannot get new deposition info', response)

    ## Get the bucket id for this deposition.
    bucket_url = None
    d = response.json()
    if d.get('links', False) and d['links'].get('bucket', False):
        bucket_url = d['links']['bucket']

    ## Test that we have the bucket information.
    if not bucket_url:
        die_screaming('could not find bucket URL', response, curr_dep_id)
    LOG.info('new bucket url: ' + bucket_url)

    ## Extract bucket file and version info.
    LOG.info('next command as curl: ' + 'curl -X GET -H "Accept: application/json" -H "Content-Type: application/json" -H "Authorization: Bearer ' + args.key + '" ' + bucket_url)
    if pause_p:
        yes_or_die('Get bucket info using script?')
    response = requests.get(bucket_url, params={'access_token': args.key})

    ## Go from filename to file ID.
    delete_url = None
    for filedoc in response.json()['contents']:
        filedoc_fname = filedoc.get('key', None)
        if filedoc_fname and filedoc_fname == filename:
            links = filedoc.get('links', None)
            if links:
                delete_url = links.get('version', None)

    ## Test file ID search okay.
    if not delete_url:
        die_screaming('could not find desired deletion url in bucket', response)
    LOG.info('have versioned delete url: ' + delete_url)

    ## Delete the current file (by ID) in the session.
    #delete_loc = server_url + '/api/deposit/depositions/' + str(new_dep_id) + '/files/' + str(file_id)
    delete_loc = delete_url
    LOG.info('next command as curl: ' + 'curl -X DELETE -H "Accept: application/json" -H "Content-Type: application/json" -H "Authorization: Bearer ' + args.key + '" ' + delete_loc)
    if pause_p:
        yes_or_die('Delete file using script?')
    response = requests.delete(delete_loc, params={'access_token': args.key})

    ## Test correct file delete.
    LOG.info('deleted at: ' + delete_loc)
    if response.status_code != 204:
        die_screaming('could not delete file', response, new_dep_id)

    ## Re-get new depositon...
    re_get_url = server_url + '/api/deposit/depositions/' + str(new_dep_id)
    LOG.info('next command as curl: ' + 'curl -X GET -H "Accept: application/json" -H "Content-Type: application/json" -H "Authorization: Bearer ' + args.key + '" ' + re_get_url)
    if pause_p:
        yes_or_die('Re-get our needed upload bucket info using script?')
    response = requests.get(re_get_url, params={'access_token': args.key})

    ## Get the bucket for upload.
    new_bucket_url = None
    d = response.json()
    if d.get('links', False) and d['links'].get('bucket', False):
        new_bucket_url = d['links'].get('bucket', False)

    ## Test that there is indded a new bucket and publish URLs.
    if not new_bucket_url:
        die_screaming('could not find a new bucket URL', response, new_dep_id)
    LOG.info('new bucket URL: ' + str(new_bucket_url))

    ###
    ### WARNING: Slipping into the (currently) unpublished Zenodo v2
    ### API here to get around file size issues we ran into.
    ### I don't quite understand the bucket API--the URLs shift more than
    ### I'd expect, but the following works.
    ###
    ### NOTE: secret upload magic: https://github.com/zenodo/zenodo/issues/833#issuecomment-324760423 and
    ### https://github.com/zenodo/zenodo/blob/df26b68771f6cffef267c056cf38eb7e6fa67c92/tests/unit/deposit/test_api_buckets.py
    ###
    ### ======================================================
    ###

    # ## Get new depositon...as the bucket URLs seem to have changed
    # ## after the delete...
    # response = requests.get(server_url + '/api/deposit/depositions/' + str(new_dep_id), params={'access_token': args.key})

    # ## Get the bucket for upload.
    # new_bucket_url = None
    # d = response.json()
    # if d.get('links', False) and d['links'].get('bucket', False):
    #     new_bucket_url = d['links'].get('bucket', False)

    ## Upload the file using curl. Previous iterations
    ## attempted to use the python requests library, but after
    ## a great many pitfalls and false starts, it turns out
    ## to not really work with very large file uploads, like we need.
    ## Things that were variously tried:
    ##
    ## Try 1 caused memory overflow issues (I'm trying to upload many GB).
    ## Try 2 "should" have worked, but zenodo seems incompatible.
    ## Try 3 appears to work, but uses an unpublished API and injects the
    ## multipart information in to the file... :( does not work for very
    ## large files.
    ## Try 4...not working... encoder = MultipartEncoder({
    ## with requests and the request toolbelt, after a fair amount of effort: no
    ## https://github.com/requests/requests/issues/2717 with
    ## https://toolbelt.readthedocs.io/en/latest/uploading-data.html#streaming-multipart-data-encoder
    ##
    ## This time, use libcurl, instead of apparently broken requests.
    ## Try an mimick the known working:
    ##  curl -X PUT -H "Accept: application/json" -H "Content-Type: application/octet-stream" -H "Authorization: Bearer T890" -T ./go-release-archive.tgz https://www.zenodo.org/api/files/B456/go-release-archive.tgz
    upload_url = "{url}/{fname}".format(url=new_bucket_url, fname=filename)
    LOG.info("Large upload to: " + upload_url)
    buffer = BytesIO()
    curl = pycurl.Curl()
    #curl.setopt(curl.VERBOSE, True)
    curl.setopt(curl.WRITEDATA, buffer)
    curl.setopt(curl.URL, upload_url)
    curl.setopt(curl.UPLOAD, 1)
    curl.setopt(pycurl.PUT, 1)
    curl.setopt(curl.HTTPHEADER, ['Accept: application/json',
                                  'Content-Type: application/octet-stream',
                                  'Authorization: Bearer ' + args.key])
    file = open(args.file, "rb")
    curl.setopt(curl.READDATA, file)
    ## File size calculation is apparently needed.
    filesize = os.path.getsize(args.file)
    curl.setopt(pycurl.INFILESIZE, filesize)

    ## WARNING: In CLI mode, go ahead and leak secret information
    LOG.info('next command as curl: ' + 'curl -X PUT -H "Accept: application/json" -H "Content-Type: application/octet-stream" -H "Authorization: Bearer ' + args.key + '" -T '+ args.file + ' ' + upload_url + '')
    if pause_p:
        yes_or_die('Upload file using script?')

    ## Monitor for exceptions during execution.
    try:
        curl.perform()
    except pycurl.error as e:
        if e.args[0] == pycurl.E_COULDNT_CONNECT and curl.exception:
            die(curl.exception)
        else:
            die(e)

    ## Decode and examine result.
    body = buffer.getvalue()
    decoded_body = body.decode('iso-8859-1')
    retpay = json.loads(decoded_body)
    curl_response_status_code = int(curl.getinfo(curl.RESPONSE_CODE))
    if curl_response_status_code > 200:
        fail_reason = 'unknown failure'
        if retpay['message']:
            fail_reason = retpay['message']
        die('curl upload failure against API (' + str(curl_response_status_code) + '): ' + fail_reason)
    else:
        LOG.info('Apparent successful large upload.')

    ## Finish up.
    curl.close()
    file.close()

    ###
    ### ======================================================
    ###
    ### NOTE: Leaving Zenodo v2 API area.
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
    LOG.info('metadata updated:' + json.dumps(newmetadata))

    ## Publish.
    publish_url = server_url + '/api/deposit/depositions/' + str(new_dep_id) + '/actions/publish'
    response = requests.post(publish_url, params={'access_token': args.key})

    ## Test correct re-publish/version action.
    if response.status_code != 202:
        die_screaming('could not re-publish (w/code ' + str(response.status_code) + ')', response, new_dep_id)
    LOG.info('republished to ' + publish_url)

    ## Extract new DOI.
    doi = None
    if response.json().get('doi', False):
        doi = response.json().get('doi', False)
        LOG.info('got DOI: ' + str(doi))
    else:
        die_screaming('could not get DOI', response, new_dep_id)

    ## Done!
    if args.output:
        with open(args.output, 'w+') as fhandle:
            fhandle.write(json.dumps({'doi': doi}, sort_keys=True, indent=4))

## You saw it coming...
if __name__ == '__main__':
    main()
