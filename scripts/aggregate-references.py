"""Aggregate all of the GO reference information into a single blob for downstream use."""
####
#### Aggregate all of the GO reference information into a single blob
#### for downstream use.
####
#### This script assumes access (via CLI option) of the directory
#### containing the GO reference data file.
####
#### Example usage to aggregate "whatever":
####  python3 aggregate-references.py --help
####  python3 ./scripts/aggregate-references.py -v --directory ./metadata/gorefs --json /tmp/go-refs.json --stanza /tmp/GO.references
####

## Standard imports.
import sys
import argparse
import logging
import glob
import yamldown
import json
import pypandoc

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('aggregate-references')
LOG.setLevel(logging.WARNING)

def die_screaming(instr):
    """Make sure we exit in a way that will get Jenkins's attention."""
    LOG.error(instr)
    sys.exit(1)

def wtflist2str(wtflist):
    """Convert the crazy pandoc internal format into something that is much plain text."""
    str_cache = ""
    for entity in wtflist:
        if entity['t'] == "Space":
            str_cache = str_cache + " "
        elif entity['t'] == "RawInline":
            #str_cache = str_cache + "\n"
            str_cache = str_cache + " "
        elif entity['t'] == "SoftBreak":
            str_cache = str_cache + " "
        elif entity['t'] == "Str":
            str_cache = str_cache + entity['c']
        else:
            raise Exception("Unknown type in paragraph: " + entity['t'])
    return str_cache

## The header that we want to use for the GO.references header.
header = """!
! DEPRECATED!!!
!
! This file is DEPRECATED. Please see go-refs.json relative to this location.
!
! Gene Ontology Reference Collection
!
! The GO reference collection is a set of abstracts that can be cited
! in the GO ontologies (e.g. as dbxrefs for term definitions) and
! annotation files (in the Reference column).
!
! The collection houses two main kinds of references; one type are
! descriptions of methods that groups use for ISS, IEA, and ND
! evidence codes; the other type are abstract-style descriptions of
! "GO content" meetings at which substantial changes in the ontologies
! are discussed and made.
!
! Data fields for this file:
!
!  go_ref_id: [mandatory; cardinality 1; GO_REF:nnnnnnn]
!  alt_id: [not mandatory; cardinality 0,1,>1; GO_REF:nnnnnnn]
!  title: [mandatory; cardinality 1; free text]
!  authors: [mandatory; cardinality 1; free text??
!            or cardinality 1,>1 and one entry per author?]
!  year: [mandatory, cardinality 1]
!  external_accession: [not mandatory; cardinality 0,1,>1; DB:id]
!  citation: [not mandatory; cardinality 0,1; use for published refs]
!  abstract: [mandatory; cardinality 1; free text]
!  comment: [not mandatory; cardinality 1; free text]
!  is_obsolete: [not mandatory; cardinality 0,1; 'true';
!            if tag is not present, assume that the ref is not obsolete
!            denotes a reference no longer used by the contributing database]
!
!  If a database maintains its own internal reference collection, and
!  has a record that is equivalent to a GO_REF entry, the database's
!  internal ID should be included as an external_accession for the
!  corresponding GO_REF.
!
! This data is available as a web page at
! https://github.com/geneontology/go-site/blob/master/metadata/gorefs/README.md
!
"""

def main():
    """The main runner for our script."""

    ## Deal with incoming.
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-d', '--directory',
                        help='The directory of the GO refs')
    parser.add_argument('-j', '--json',
                        help='JSON output file')
    parser.add_argument('-s', '--stanza',
                        help='Stanza-based output file')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    ## Ensure directories and outputs.
    if not args.directory:
        die_screaming('need a directory argument')
    LOG.info('Will operate in: ' + args.directory)
    ## Ensure output file.
    if not args.json and not args.stanza:
        die_screaming('need an output file argument, --json or --stanza')
    LOG.info('Will output JSON to: ' + args.json)
    LOG.info('Will output stanza to: ' + args.stanza)

    ## Main data hold.
    reference_data = []

    ## Get files out of target directory, flipping the frontmatter
    ## into JSON.
    LOG.info('Globbing GO ref YAMLs in data directory: ' + args.directory + '/goref-*.md')
    src_filenames = glob.glob(args.directory + '/go*-*.md')
    for src_filename in src_filenames:

        LOG.info('GO ref filename: ' + src_filename)

        with open(src_filename, "r") as f:
            yml, md = yamldown.load(f)

            ## Break the md into the title, abstract, and comments.
            mdj_text = pypandoc.convert_text(md, 'json', format='markdown')
            mdj = json.loads(mdj_text)
            title = 'n/a'
            abstract = 'n/a'
            comments = 'n/a'
            next_block_type = None
            ## A workaround for the change in JSON format in pandoc in
            ## 1.18; Ubuntu 16.04 uses 1.16.0.2 and 18.04 uses
            ## 1.19.2.4.
            blocks = None
            if type(mdj) == list:
                blocks = mdj[1]
            else:
                blocks = mdj['blocks']
            for block in blocks:
                ## If is a header and has something there in the
                ## header.
                #LOG.info(json.dumps(block))
                if block.get('t', False) == "Header":
                    if block.get('c', False) and len(block['c']) >= 2:

                        ## Capture the title.
                        header_text = wtflist2str(block['c'][2])
                        #LOG.info('header text: ' + header_text)

                        if header_text.casefold() == "comments" or header_text.casefold() == "comment":
                            next_block_type = "comments"
                            #LOG.info("<<next: comments>>")
                        else:
                            ## Otherwise, we're going to assume this
                            ## is an abstract.
                            title = header_text
                            next_block_type = "abstract"
                            #LOG.info("<<next: abstract>>")

                    else:
                        raise Exception("Unknown HEADER")

                elif block['t'] == "Para":
                    if block.get('c', False) and len(block['c']) > 0:

                        ## Capture the title.
                        para_text = wtflist2str(block['c'])

                        if next_block_type == "comments":
                            comments = para_text
                            #LOG.info('comments text: ' + para_text)
                        elif next_block_type == "abstract":
                            abstract = para_text
                            #LOG.info('abstract text: ' + para_text)

                    else:
                        raise Exception("Unknown PARA")

                else:
                    raise Exception("Unknown ENTITY")

            yml['abstract'] = abstract
            yml['comments'] = comments
            yml['title'] = title
            reference_data.append(yml)

    ## Sort by id.
    reference_data = sorted(reference_data, key=lambda k: k['id'])

    ## Final JSON writeout.
    if args.json:
        with open(args.json, 'w+') as fhandle:
            fhandle.write(json.dumps(reference_data, sort_keys=True, indent=4))

    ## Final JSON writeout.
    if args.stanza:
        with open(args.stanza, 'w+') as fhandle:

            file_cache = []
            for ref in reference_data:
                stanza_cache = []

                if ref.get('id', False):
                    stanza_cache.append('go_ref_id: ' + ref.get('id'))

                alt_ids = ref.get('alt_id', [])
                for alt_id in alt_ids:
                    stanza_cache.append('alt_id: ' + alt_id)

                if ref.get('title', False):
                    stanza_cache.append('title: ' + ref.get('title'))

                if ref.get('authors', False):
                    stanza_cache.append('authors: ' + ref.get('authors'))

                if ref.get('year', False):
                    stanza_cache.append('year: ' + str(ref.get('year')))

                external_accessions = ref.get('external_accession', [])
                for external_accession in external_accessions:
                    stanza_cache.append('external_accession: ' + external_accession)

                if ref.get('abstract', False):
                    stanza_cache.append('abstract: ' + ref.get('abstract'))

                if ref.get('comments', False):
                    stanza_cache.append('comment: ' + ref.get('comments'))

                file_cache.append("\n".join(stanza_cache))

            fhandle.write(header + "\n\n".join(file_cache))

## You saw it coming...
if __name__ == '__main__':
    main()
