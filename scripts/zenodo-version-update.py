"""Update a single file in an already published Zenodo deposition and collect the new version of the DOI."""
####
#### Update a single file in an already published Zenodo deposition
#### and collect the new version of the DOI.
####
#### Example usage to operate in Zenodo:
####  python3 ./scripts/zenodo-version-update.py --help
####  python3 ./scripts/zenodo-ops.py --verbose --sandbox --key abc --concept 123 --file foo.tgz
####

## Standard imports.
import sys
import argparse
import logging
import os
import json
import requests

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('zenodo-version-update')
LOG.setLevel(logging.WARNING)

def die_screaming(instr, response):
    """Make sure we exit in a way that will get Jenkins's attention, giving good response debugging information along the way if available."""
    if response:
        if not response.text or response.text == "":
            LOG.error('no response from server')
        else:
            LOG.error(json.dumps(response.json(), indent=4, sort_keys=True))
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
        die_screaming('need a "key/token" argument')
    LOG.info('Will use key/token: ' + args.key)

    ## Ensure concept.
    if not args.concept:
        die_screaming('need a "concept" argument')
    concept_id = int(args.concept)
    LOG.info('Will use concept ID: ' + concept_id)

    ## JSON to STDOUT for 'jq'; write informative reports to the log
    ## when verbose.
    def safe_json_report(response, report_list):

        if response.status_code == 204:
            if not response.text or response.text == "":
                LOG.info('successful operation (e.g. no body "delete")')
            else:
                LOG.info(json.dumps(response.json(), indent=4, sort_keys=True))
        elif response.status_code == 400:
            die_screaming(json.dumps(response.json(), indent=4, sort_keys=True))
        elif response.status_code == 410:
            die_screaming(json.dumps(response.json(), indent=4, sort_keys=True))
        elif response.status_code == 500:
            die_screaming(json.dumps(response.json(), indent=4, sort_keys=True))
        else:

            ## Print something for jq.
            print(json.dumps(response.json(), indent=4, sort_keys=True))

            ## Listify response.
            resp = response.json()
            #LOG.info(type(resp))
            if type(resp) is not list:
                resp = [resp]

            LOG.info(" http status code: " + str(response.status_code))
            for d in resp:
                open_draft = ""
                if d.get('links', False) and d['links'].get('latest_draft', False):
                    open_draft = d['links']['latest_draft'].split('/')[-1]
                if open_draft == "":
                    LOG.info(' "'+ '", "'.join(str(d[x]) for x in report_list) +'"')
                else:
                    LOG.info(' "'+ '", "'.join(str(d[x]) for x in report_list) +'"; draft: ' + open_draft)


    ## Check necessary arguments are present.
    def check_args(arg_list):
        safe_args = vars(args)
        for a in arg_list:
            if not safe_args.get(a, False):
                die_screaming('action "'+ args.action +'" requires: "'+ a +'"')

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
    for entity in response:
        conceptrecid = entity.get('conceptrecid', None)
        if conceptrecid and int(conceptrecid) == concept_id:
            depdoc = entity

    ## Test deposition doc search okay.
    if not depdoc:
        die_screaming('could not find desired concept')

    ## Test that status is published (no open session).
    if depdoc.get('status', None) != 'published':
        die_screaming('desired concept currently has open status', response)

    ## Get current deposition id.
    curr_dep = int(depdoc.get('id', None))

    ## Get files for the current depositon.
    response = requests.get(server_url + '/api/deposit/depositions/' + str(curr_dep) + '/files', params={'access_token': args.key})

    ## Test file listing okay.
    if response.status_code != 200:
        die_screaming('cannot get file listing', response)

    ## Go from filename to file ID.
    file_id = None
    for filedoc in response:
        filedoc_fname = filedoc.get('filename', None)
        if filedoc_fname and filedoc_fname == filename:
            file_id = filedoc.get('id', None)

    ## Test file ID search okay.
    if not file_id:
        die_screaming('could not find desired filename', response)

    ## Open versioned deposition session.
    response = requests.post(server_url + '/api/deposit/depositions/' + str(curr_dep) + '/actions/newversion', params={'access_token': args.key})

    ## Test correct opening.
    if response.status_code != 200:
        die_screaming('cannot open new version/session', response)

    ## Get the new deposition id for this version.
    new_dep = None
    d = response.json()
    if d.get('links', False) and d['links'].get('latest_draft', False):
        new_dep = int(d['links']['latest_draft'].split('/')[-1])

    ## Test that there is a new deposition ID.
    if not new_dep:
        die_screaming('could not find a new deposition ID', response)

    ## Delete the current file (by ID) in the session.
    response = requests.delete(server_url + '/api/deposit/depositions/' + str(new_dep) + '/files/' + str(file_id), params={'access_token': args.key})

    ## Test correct file delete.
    if response.status_code != 204:
        die_screaming('could not delete file', response)

    ## Add the new version of the file.
    response = requests.post(server_url + '/api/deposit/depositions/' + str(new_dep) + '/files', params={'access_token': args.key}, data=data, files=files)

    ## Test correct file add.
    if response.status_code != 200:
        die_screaming('could not add file', response)

    response = requests.post(server_url + '/api/deposit/depositions/' + str(new_dep) + '/actions/publish', params={'access_token': args.key})

    ## Test correct re-publish/version action.
    if response.status_code != 200:
        die_screaming('could not re-publish', response)

    ## Extract new DOI.
    doi = None
    if response.get('doi', False):
        doi = response.get('doi', False)
    else:
        die_screaming('could not get DOI', response)

    ## Done!
    print(str(doi))

## You saw it coming...
if __name__ == '__main__':
    main()
