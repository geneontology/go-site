"""Create a downloads page for the current GO release."""
####
#### Create a downloads page for the current GO release.
####
#### Example usage to analyze "whatever":
####  python3 downloads-page-gen.py --help
####  python3 ./scripts/downloads-page-gen.py -v --report /tmp/all_combined.report.json --inject ./scripts/downloads-page-template.html --date 2018-08-08
####

## Standard imports.
import sys
import argparse
import logging
#import glob
#import os
import json
#import yaml
import pystache

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('downloads-page')
LOG.setLevel(logging.WARNING)

## Abbr -> species label map.
smap = {
    "Aspergillus": "Aspergillus nidulans",
    "Atal": "Arabidopsis thaliana",
    "Btau": "Bos taurus",
    "Calb": "Candida albicans",
    "Cele": "Caenorhabditis elegans",
    "Cfam": "Canis lupus familiaris",
    "Ddis": "Dictyostelium discoideum",
    "Dmel": "Drosophila melanogaster",
    "Drer": "Danio rerio",
    "Ecol": "Escherichia coli",
    "Ggal": "Gallus gallus",
    "Hsap": "Homo sapiens",
    "Lmaj": "Leishmania major",
    "Mmus": "Mus musculus",
    "Oryz": "Oryza sativa",
    "Pfal": "Plasmodium falciparum",
    "Pseudomonas": "Pseudomonas aeruginosa",
    "Rnor": "Rattus norvegicus",
    "Scer": "Saccharomyces cerevisiae",
    "Solanaceae": "Solanaceae",
    "Sjap": "Schizosaccharomyces japonicus",
    "Spom": "Schizosaccharomyces pombe",
    "Sscr": "Sus scrofa",
    "Tbru": "Trypanosoma brucei",
    "Xtro": "Xenopus tropicalis",
    "Xlae": "Xenopus laevis"
}

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
    parser.add_argument('-r', '--report',
                        help='Combined report JSON file')
    parser.add_argument('-d', '--date',
                        help='The date to report for release')
    parser.add_argument('-i', '--inject',
                        help='Mustache template file to inject into')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    ## Ensure directory, date, and inject.
    if not args.report:
        die_screaming('need a report argument')
    LOG.info('Will operate on: ' + args.report)
    if not args.date:
        die_screaming('need a date argument')
    LOG.info('Will use date: ' + args.date)
    if not args.inject:
        die_screaming('need an inject argument')
    LOG.info('Will inject into: ' + args.inject)

    output_template = None
    with open(args.inject) as fhandle:
        output_template = fhandle.read()

    read_data = None
    with open(args.report) as fhandle:
        read_data = json.loads(fhandle.read())

    ## Inject "species_label" next to "species_code".
    for entry in read_data:
        if entry["metadata"] and entry["metadata"]["species_code"]:
            scode = entry["metadata"]["species_code"]
            if smap[scode]:
                entry["metadata"]["species_label"] = smap[scode]

    ## Prep and execute combining PAINT values into annotations
    ## counts (https://github.com/geneontology/go-site/issues/1999).
    ## Create a hash of all entries keyed by "id".
    entry_hash = {}
    for entry in read_data:
        entry_hash[entry["id"]] = entry
    ## For every entry...
    for entry in read_data:
        ## ...check if PAINT version exists...
        paint_version_id = 'paint_' + entry["id"]
        if entry_hash.get(paint_version_id, False):
            ## ...if it does, add it to create a new full count...
            LOG.info('Found paint version: ' + paint_version_id + ' (' + str(int(entry_hash[paint_version_id]["associations"])) + ') for ' + entry["id"] + ' (' + str(int(entry["associations"])) + ')')
            entry["full_count"] = int(entry["associations"]) + int(entry_hash[paint_version_id]["associations"])
        else:
            ## ...otherwise, just use the local count for the full count.
            LOG.info('No paint version: ' + entry["id"])
            entry["full_count"] = int(entry["associations"])
        LOG.info('  Count: ' + str(entry["full_count"]))

    # ## Read in all of the useful data from the metadata data sources.
    # for datum in read_data:
    #     LOG.info('current: ' + datum['id'])
    render_data = {'date': args.date, 'data': read_data}

    output = pystache.render(output_template, render_data)

    ## Final writeout.
    #with open(args.output, 'w+') as fhandle:
    #    fhandle.write(json.dumps(lookup, sort_keys=True, indent=4))
    print(output)

## You saw it coming...
if __name__ == '__main__':
    main()
