"""Combined Assigned-By report JSON."""
####
#### Parse the combined.report.json file, which has list of data providers with GO rule violations and applicable GAF line, and output as
#### assigned-by (from GAF line) to GO rule violation
####

## Standard imports.
import sys
import argparse
import logging
import json
import re

## Logger basic setup.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('assigned-by')
LOG.setLevel(logging.WARNING)

def die_screaming(instr):
    """Make sure we exit in a way that will get Jenkins's attention."""
    LOG.error(instr)
    sys.exit(1)

def main():
    """The main runner of our script."""
    
    ## Deal with incoming.
    parser = argparse.ArgumentParser(
        description =__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('-i', '--input',
                        help='combined json input file')    
    parser.add_argument('-o', '--output',
                        help='Output file')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='More verbose output')
    args = parser.parse_args()

    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    if not args.input:
        die_screaming('need a combined json input file argument')
    LOG.info('Will read input data from: ' + args.input)

    if not args.output:
        die_screaming('need an output file argument')
    LOG.info('Will output to: ' + args.output)

    lookup = {}

    ##     
    read_date = None
    with open(args.input) as fhandle:
        # Data looks like:
        # [
        #     {
        #         "associations": 104109,
        #         "dataset": "wb",
        #         "group": "wb",
        #         "id": "wb",
        #         "lines": 135757,
        #         "messages": {
        #             "gorule-0000001": [
        #                 {
        #                     "level": "ERROR",
        #                     "line": "WB\tWBGene00003386\tmod-1\tenables\tGO:0051378\t\tIDA\t\tF\t\tK06C4.6\tgene\ttaxon:6239\t20220614\tUniProt\t\t",
        #                     "message": "reference column 6 is empty",
        #                     "obj": "EMPTY",
        #                     "rule": 1,
        #                     "taxon": "taxon:6239",
        #                     "type": "Invalid identifier"
        #                 }
        #             ],
        #             "gorule-0000002": [],
        #             "gorule-0000006": [],
        #             "gorule-0000007": [],
        #             "gorule-0000008": [
        #                 {
        #                     "level": "WARNING",
        #                     "line": "RNAcentral\tURS00007E3A69_9606\tURS00007E3A69_9606\tpart_of\tGO:0070062\tPMID:31926946\tIDA\t\tC\tHomo sapiens (human) hsa-miR-7847-3p\t\tmiRNA\ttaxon:9606\t20200724\tARUK-UCL\tproduced_by(CL:0000235)\t\n",
        #                     "message": "GORULE:0000061: Found violation of: `Only certain gene product to term relations are allowed for a given GO term` but was repaired: BFO:0000050 should be one of RO:0002325, RO:0001025, RO:0002432",
        #                     "obj": "",
        #                     "rule": 61,
        #                     "taxon": "",
        #                     "type": "Violates GO Rule"
        #                 }
        #             ],...
        #             "other": []
        #         },
        #         "metadata": {
        #             "compression": "gzip",
        #             "dataset": "goa_human_rna",
        #             "description": "gaf file for goa_human_rna from EBI Gene Ontology Annotation Database",
        #             "entity_type": "rna",
        #             "id": "goa_human_rna.gaf",
        #             "label": "goa_human_rna gaf file",
        #             "resource-contact_email": "goa@ebi.ac.uk",
        #             "resource-description": "GO data for EBI Gene Ontology Annotation Database",
        #             "resource-email_report": "goa@ebi.ac.uk",
        #             "resource-funding_source": "unspecified",
        #             "resource-id": "goa",
        #             "resource-label": "EBI Gene Ontology Annotation Database",
        #             "resource-project_name": "EBI GO Annotation program (GOA)",
        #             "resource-project_url": "http://www.ebi.ac.uk/GOA",
        #             "source": "https://ftp.ebi.ac.uk/pub/databases/GO/goa/HUMAN/goa_human_rna.gaf.gz",
        #             "species_code": "Hsap",
        #             "status": "active",
        #             "submitter": "goa",
        #             "taxa": [
        #                 "NCBITaxon:9606"
        #             ],
        #             "taxa_label_map": {
        #                 "NCBITaxon:9606": "NCBITaxon:9606"
        #             },
        #             "type": "gaf",
        #             "url": "http://geneontology.org/gene-associations/goa_human_rna.gaf.gz"
        #         },
        #         "skipped_lines": 6
        #     },
        #     ...
        # ]
        read_data = json.loads(fhandle.read())

    ## Better be something in there.
    if not read_data:
        die_screaming('No report found for: ' + args.input)

    for gaf_creators in read_data:
        msg_obj = gaf_creators['messages']
        #for messages in gaf_creators["messages"]:
        for key, violations in msg_obj.items():
                if (len(violations) != 0):
                    for violation in violations:
                        gaf_line = violation['line']
                        gaf_contents = re.split('\t', gaf_line)

                        ## Get assigned by information from GAF line.  If it does not exist, attempt to get from group that created the GAF file
                        assigned_by = None
                        if (len(gaf_contents) < 14):
                            LOG.error('Found incorrect number of columns in GAF line ' + gaf_line)
                            assigned_by = gaf_creators['id']
                        else:
                            assigned_by = gaf_contents[14]
                        
                        if not assigned_by:
                            LOG.error('Assigned by is empty ' + gaf_line)
                            assigned_by = gaf_creators['id']
                        if ((assigned_by is None) or (not assigned_by)):
                            LOG.error('Skipping since there is no data generator information in ' + msg_obj)
                            continue

                        current_violations = lookup.get(assigned_by)
                        if (current_violations is None):
                            current_violations = {}
                            lookup[assigned_by] = current_violations
                        violation_list = current_violations.get(key)
                        if (violation_list is None):
                            violation_list = []
                            current_violations[key] = violation_list
                        violation_list.append(violation)

    ## output is a list of json objects
    ## Convert dict to list where each entry is a json object
    violator_list = []
    for violator in lookup:
        violator_list.append({violator: lookup.get(violator)})
    

    ## Final writeout.
    with open(args.output, 'w+') as fhandle:
        fhandle.write(json.dumps(violator_list, sort_keys=True, indent=4))

## You saw it coming...
if __name__ == '__main__':
    main()    