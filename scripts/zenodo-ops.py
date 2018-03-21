"""Toolkit for various operations in Zenodo."""
####
#### Toolkit for various operations in Zenodo.
#### This toolkit should be safe to use with jq, although suggest
#### noisy --verbose to see what is going on.
####
#### Example usage to operate in Zenodo:
####  python3 ./scripts/zenodo-ops.py --help
####  python3 ./scripts/zenodo-ops.py --verbose --sandbox --key abc --action list --object deposition
####  python3 ./scripts/zenodo-ops.py --verbose --sandbox --key abc --action list --object files --deposition 123
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
LOG = logging.getLogger('zenodo-ops')
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
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    parser.add_argument('-k', '--key',
                        help='The access key (token) to use for commands.')
    parser.add_argument('-s', '--sandbox', action='store_true',
                        help='If used, will aim at the sandbox server.')
    parser.add_argument('-a', '--action',
                        help='The action to run: "list", "create" (deposition only), "delete", "add" (file only), "annotate" (deposition only), "publish" (deposition only)')
    parser.add_argument('-o', '--object',
                        help='The repo object (type) to run an action on: "deposition", "file"')
    parser.add_argument('-d', '--deposition',
                        help='[optional] The desposition number in an action.')
    parser.add_argument('-f', '--file',
                        help='[optional] The local file to use in an action.')
    parser.add_argument('-i', '--id',
                        help='[optional] The ID to itentify an object.')
    parser.add_argument('-t', '--title',
                        help='[optional] The title to use in the metadata.')
    parser.add_argument('-l', '--long',
                        help='[optional] The long/full description to use in the metadata .')
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

    ## Ensure object and action.
    if not args.action:
        die_screaming('need an "action" argument')
    LOG.info('Will run action: ' + args.action)
    if not args.object:
        die_screaming('need an "object" argument')
    LOG.info('Will run object: ' + args.object)

    ## Ensure deposition number, return int.
    def get_deposition():
        if not args.deposition:
            die_screaming('need "deposition" argument')
        LOG.info('Will use deposition: ' + args.deposition)
        return int(args.deposition)

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

    ## Main action verb drop-through.
    response = None
    if args.action == 'list' and args.object == 'deposition':

        check_args([])

        response = requests.get(server_url + '/api/deposit/depositions', params={'access_token': args.key})

        safe_json_report(response, ['id', 'title', 'state'])

    elif args.action == 'list' and args.object == 'file':

        check_args(['deposition'])
        dep = get_deposition()

        response = requests.get(server_url + '/api/deposit/depositions/' + str(dep) + '/files', params={'access_token': args.key})

        safe_json_report(response, ['id', 'filename'])

    elif args.action == 'create' and args.object == 'deposition':

        check_args([])

        response = requests.post(server_url + '/api/deposit/depositions', params={'access_token': args.key}, json={})

        safe_json_report(response, ['id', 'title'])

    elif args.action == 'delete' and args.object == 'deposition':

        check_args(['deposition'])
        dep = get_deposition()

        response = requests.delete(server_url + '/api/deposit/depositions/' + str(dep), params={'access_token': args.key})

        safe_json_report(response, [])

    elif args.action == 'annotate' and args.object == 'deposition':

        check_args(['deposition', 'title', 'long'])
        dep = get_deposition()

        headers = {"Content-Type": "application/json"}
        data = {
            'metadata': {
                'title': str(args.title),
                'upload_type': 'dataset',
                'access_right': 'open',
                'license': 'CC-BY-4.0',
                'description': str(args.long),
                'creators': [{'name': 'Gene Ontology Pipeline',
                                  'affiliation': 'Gene Ontology'}]
            }
        }

        response = requests.put(server_url + '/api/deposit/depositions/' + str(dep), params={'access_token': args.key}, data=json.dumps(data), headers=headers)

        safe_json_report(response, ['id', 'title'])

    elif args.action == 'publish' and args.object == 'deposition':

        check_args(['deposition'])
        dep = get_deposition()

        response = requests.post(server_url + '/api/deposit/depositions/' + str(dep) + '/actions/publish', params={'access_token': args.key})

        safe_json_report(response, ['id', 'title'])

    elif args.action == 'version' and args.object == 'deposition':

        check_args([])
        dep = get_deposition()

        response = requests.post(server_url + '/api/deposit/depositions/' + str(dep) + '/actions/newversion', params={'access_token': args.key})

        safe_json_report(response, ['id', 'title'])

    elif args.action == 'add' and args.object == 'file':

        check_args(['deposition', 'file'])
        dep = get_deposition()

        ## File data and title from filename.
        files = {'file': open(args.file, 'rb')}
        data = {'filename': os.path.basename(args.file)}

        response = requests.post(server_url + '/api/deposit/depositions/' + str(dep) + '/files', params={'access_token': args.key}, data=data, files=files)

        safe_json_report(response, ['id', 'filename'])

    elif args.action == 'delete' and args.object == 'file':

        check_args(['deposition', 'id'])
        dep = get_deposition()

        response = requests.delete(server_url + '/api/deposit/depositions/' + str(dep) + '/files/' + str(args.id), params={'access_token': args.key})

        safe_json_report(response, [])

    else:

        die_screaming("unknown action/object combo: " + args.action + ", " + args.object)


## You saw it coming...
if __name__ == '__main__':
    main()
