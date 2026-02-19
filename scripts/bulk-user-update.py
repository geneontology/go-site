####
#### Bulk update users.yaml based on a list of ORCIDs.
####
#### Example usage:
####  python3 scripts/bulk-user-update.py --users metadata/users.yaml --list orcids.txt --remove-edit
####

import argparse
import re
import sys
import yaml


def load_orcid_list(path):
    """Load ORCIDs from a file.

    First column is an ORCID. Remaining columns are ignored.
    Columns are whitespace or pipe delimited.
    Lines starting with # are skipped. Blank lines are skipped.
    """
    orcids = []
    seen = set()
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            # Split on whitespace or pipe
            parts = re.split(r'[\s|]+', line)
            if parts:
                orcid = parts[0].strip()
                if orcid and orcid not in seen:
                    orcids.append(orcid)
                    seen.add(orcid)
    return orcids


def find_target_orcids(users, orcid_list):
    """Parse users YAML and return the set of ORCIDs that have allow-edit."""
    targets = set()
    matched = set()
    for user in users:
        uri = user.get('uri', '')
        for orcid in orcid_list:
            if orcid in uri:
                matched.add(orcid)
                go_auths = (user.get('authorizations', {})
                            .get('noctua', {})
                            .get('go', {}))
                if go_auths.get('allow-edit', False):
                    targets.add(orcid)
                break
    return targets, matched


def remove_authorizations_block(lines, start):
    """Remove the authorizations block starting at line index `start`.

    Returns the number of lines removed. The block is the line at `start`
    (e.g. '  authorizations:\\n') plus all subsequent lines that are indented
    deeper (more than 2 leading spaces).
    """
    count = 1  # the authorizations: line itself
    base_indent = len(lines[start]) - len(lines[start].lstrip())
    i = start + 1
    while i < len(lines):
        line = lines[i]
        # Empty lines within a block shouldn't happen, but handle them
        stripped = line.rstrip('\n')
        if stripped == '':
            break
        indent = len(line) - len(line.lstrip())
        if indent <= base_indent:
            break
        count += 1
        i += 1
    return count


def main():

    parser = argparse.ArgumentParser(
        description='Bulk update users.yaml based on a list of ORCIDs.')
    parser.add_argument('--users', required=True,
                        help='Path to users.yaml')
    parser.add_argument('--list', required=True,
                        help='Path to file with ORCIDs (first column)')
    parser.add_argument('--remove-edit', action='store_true',
                        help='Remove allow-edit from noctua.go authorizations')
    args = parser.parse_args()

    ## Load ORCID list.
    orcids = load_orcid_list(args.list)
    print('Loaded {} ORCIDs from {}'.format(len(orcids), args.list))

    ## Load users via YAML to identify targets.
    with open(args.users) as f:
        users = yaml.safe_load(f.read())

    if args.remove_edit:
        targets, matched = find_target_orcids(users, orcids)

        print('Matched {} users'.format(len(matched)))
        print('{} users have allow-edit to remove'.format(len(targets)))

        ## Warn about ORCIDs not found.
        unmatched = set(orcids) - matched
        if unmatched:
            print('\nWARNING: {} ORCIDs not found in users.yaml:'.format(
                len(unmatched)))
            for orcid in sorted(unmatched):
                print('  {}'.format(orcid))

        ## Now do text-based processing to preserve formatting.
        with open(args.users) as f:
            lines = f.readlines()

        modified = 0
        i = 0
        while i < len(lines):
            line = lines[i]

            ## Check if this line has a URI containing a target ORCID.
            is_target_uri = False
            if 'uri:' in line:
                for orcid in targets:
                    if orcid in line:
                        is_target_uri = True
                        break

            ## If we found a target user's URI, scan backwards in the
            ## current entry to find and mark the authorizations block.
            ## Also scan forward since authorizations might come after uri.
            if is_target_uri:
                ## Find the start of this entry (the preceding '-' line).
                entry_start = i
                while entry_start > 0:
                    if lines[entry_start].startswith('-'):
                        break
                    entry_start -= 1

                ## Find the end of this entry (next '-' line or EOF).
                entry_end = i + 1
                while entry_end < len(lines):
                    if lines[entry_end].startswith('-'):
                        break
                    entry_end += 1

                ## Find the authorizations line within this entry.
                for j in range(entry_start, entry_end):
                    stripped = lines[j].strip()
                    if stripped == 'authorizations:':
                        count = remove_authorizations_block(lines, j)
                        del lines[j:j + count]
                        modified += 1
                        ## Adjust i since we removed lines before or at i.
                        if j <= i:
                            i -= count
                        break

            i += 1

        print('Modified {} users'.format(modified))

        ## Write back.
        with open(args.users, 'w') as f:
            f.writelines(lines)

        print('Wrote updated {}'.format(args.users))


if __name__ == '__main__':
    main()
