"""Toolkit for various operations in Zenodo."""
####
#### Toolkit for various operations in Zenodo.
#### This toolkit should be safe to use with jq.
####
#### Example usage to operate in Zenodo:
####  python3 ./scripts/zenodo-ops.py --help
####  python3 ./scripts/zenodo-ops.py --verbose --sandbox --token abc --action list
####  python3 ./scripts/zenodo-ops.py --verbose --sandbox --token abc --action files --deposition 123
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
    parser.add_argument('-t', '--token',
                        help='The token (access key) to use for commands.')
    parser.add_argument('-s', '--sandbox', action='store_true',
                        help='If used, will aim at the sandbox server.')
    parser.add_argument('-a', '--action',
                        help='The action to run: "list", "files", "newdep"')
    parser.add_argument('-d', '--deposition',
                        help='[optional] The desposition number in an action.')
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

    ## Ensure token.
    if not args.token:
        die_screaming('need a "token" argument')
    LOG.info('Will use token: ' + args.token)

    ## Ensure action.
    if not args.action:
        die_screaming('need an "action" argument')
    LOG.info('Will run action: ' + args.action)

    ## Ensure deposition number, return int.
    def get_deposition():
        if not args.deposition:
            die_screaming('need "deposition" argument')
        LOG.info('Will use deposition: ' + args.deposition)
        return int(args.deposition)

    ## Write informative reports to the log.
    def safe_json_report(response, report_list):
        print(json.dumps(response.json(), indent=4, sort_keys=True))
        LOG.info(" http status code: " + str(response.status_code))
        for d in response.json():
            LOG.info(' "' + '", "'.join(str(d[x]) for x in report_list) + '"')

    ## Main action verb drop-through.
    response = None
    if args.action == 'list':

        response = requests.get(server_url + '/api/deposit/depositions', params={'access_token': args.token})

        safe_json_report(response, ['id', 'title'])

    elif args.action == 'files':

        dep = get_deposition()

        response = requests.get(server_url + '/api/deposit/depositions/' + str(dep) + '/files', params={'access_token': args.token})

        safe_json_report(response, ['id', 'filename'])

    elif args.action == 'newempty':

        response = requests.post(server_url + '/api/deposit/depositions/' + str(dep) + '/files', params={'access_token': args.token})

        safe_json_report(response, ['id', 'filename'])

## You saw it coming...
if __name__ == '__main__':
    main()
