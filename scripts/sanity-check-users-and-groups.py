####
#### Give a report on the "sanity" of the users and groups YAML
#### metadata files.
####
#### Example usage to analyze the usual suspects:
####  python3 sanity-check-users-and-groups.py --help
####  python3 ./scripts/sanity-check-users-and-groups.py --users metadata/users.yaml --groups metadata/groups.yaml
####

import sys
import argparse
import logging
import yaml

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger('sanity')
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
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    parser.add_argument('-u', '--users',
                        help='The users.yaml file to act on')
    parser.add_argument('-g', '--groups',
                        help='The groups.yaml file to act on')
    args = parser.parse_args()

    if args.verbose:
        LOGGER.setLevel(logging.INFO)
        LOGGER.info('Verbose: on')

    ## Ensure targets.
    if not args.users:
        die_screaming('need a users argument')
    LOGGER.info('Will operate on users: ' + args.users)
    if not args.groups:
        die_screaming('need a groups argument')
    LOGGER.info('Will operate on groups: ' + args.groups)

    ## Read.
    users = None
    with open(args.users) as mhandle:
        users = yaml.load(mhandle.read())
    groups_linear = None
    with open(args.groups) as mhandle:
        groups_linear = yaml.load(mhandle.read())

    ## Switch linear groups to lookup by URI.
    groups_lookup = {}
    for group in groups_linear:
        groups_lookup[group['id']] = group['label']

    ## Cycle through users and see if we find any violations.
    for user in users:

        ## Does the user have noctua perms?
        if user.get('authorizations', False):
            auth = user.get('authorizations', {})
            if auth.get('noctua-go', False) or \
               (auth.get('noctua', False) and auth['noctua'].get('go', False)):
                #print('Has perms: ' + user.get('nickname', '???'))

                ## 1: If so, do they have a URI?
                if not user.get('uri', False):
                    # die_screaming(user.get('nickname', '???') +\
                    #               ' has no "uri"')
                    print(user.get('nickname', '???') +\
                          ' has no "uri"')
                else:
                    ## 2: Is it an ORCID?
                    if user.get('uri', 'NIL').find('orcid') == -1:
                        # die_screaming(user.get('nickname', '???') +\
                        #               ' "uri" is not an ORCID.')
                        print(user.get('nickname', '???') +\
                              ' "uri" is not an ORCID.')

                ## 3: If so, do they have a populated groups?
                if not user.get('groups', False):
                    # die_screaming(user.get('nickname', '???') +\
                    #               ' has no "groups"')
                    print(user.get('nickname', '???') +\
                          ' has no "groups"')
                else:
                    ## 4: If so, are all entries in groups?
                    for gid in user.get('groups'):
                        if not groups_lookup.get(gid, False):
                            # die_screaming(user.get('nickname', '???') +\
                            #               ' has mistaken group entry: ' + gid)
                            print(user.get('nickname', '???') +\
                                  ' has mistaken group entry: ' + gid)

    ## TODO: implement hard checks above later.
    if DIED_SCREAMING_P:
        print('Errors happened, alert the sheriff.')
        sys.exit(1)
    else:
        print('Non-failing run.')

## You saw it coming...
if __name__ == '__main__':
    main()
