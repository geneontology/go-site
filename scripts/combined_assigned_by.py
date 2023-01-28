"""Combined Assigned-By report JSON."""
####
#### Parse the combined.report.json file, which has list of data providers with GO rule violations and applicable GAF line, and output as
#### assigned-by (from GAF line) to GO rule violation
####

## Standard imports.
import copy
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

def clear_creator_info(creator_info):
    for key in creator_info.keys():
        if (key == 'associations' or
            key == 'dataset' or
            key == 'group' or
            key == 'id' or
            key == 'lines' or
            key == 'skipped_lines'):
            
            creator_info[key] = None

        # remove violations for the rules
        if (key == 'messages'):
            msg_obj = creator_info[key]
            for violation_list in msg_obj.values():
                violation_list.clear()

        # Clear metadata
        if (key == 'metadata'):
            metadata_obj = creator_info[key]
            for metadata_key in metadata_obj.keys():
                if (metadata_key == 'compression' or
                        metadata_key == 'dataset' or
                        metadata_key == 'description' or
                        metadata_key == 'entity_type' or
                        metadata_key == 'id' or
                        metadata_key == 'label' or
                        metadata_key == 'resource-contact_email' or
                        metadata_key == 'resource-description' or
                        metadata_key == 'resource-email_report' or                                                                                                                                            
                        metadata_key == 'resource-funding_source' or
                        metadata_key == 'resource-id' or
                        metadata_key == 'resource-label' or
                        metadata_key == 'resource-project_name' or
                        metadata_key == 'resource-project_url' or
                        metadata_key == 'source' or
                        metadata_key == 'species_code' or
                        metadata_key == 'submitter' or                                                                                                                                            
                        metadata_key == 'type' or            
                        metadata_key == 'url'):

                        metadata_obj[metadata_key] = None
                if (metadata_key == 'taxa'):
                    metadata_obj[metadata_key] = []
                if (metadata_key == 'taxa_label_map'):
                    metadata_obj[metadata_key] = {}                 

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
    creator_to_info = {}
    creator_to_messages = {}
    lower_id_to_id = {}
    new_assigned_by_to_info = {}

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

    ## Starting with list of GAF creator data objects in a list
    ## 1. Create a dictionary of GAF creator to GAF creator object
    ## 2. Create a dictionary of GAF creator to the messages object
    ## 3. Remove the violations detail from the GAF creator object in 1.

    empty_gaf_creator = None
    for gaf_creator in read_data:
        msg_obj = gaf_creator['messages']
        
        gaf_creator_copy = copy.deepcopy(gaf_creator)

        # Create an empty gaf creator template object for when we run into assigned_by that is not in our list of gaf_creators
        if empty_gaf_creator is None:
            empty_gaf_creator = copy.deepcopy(gaf_creator)
            clear_creator_info(empty_gaf_creator)
            
        from_id = gaf_creator['id']
        if (from_id is not None):
            if (bool(from_id)):
                from_id_lower = from_id.lower()
                lower_id_to_id[from_id_lower] = from_id
                creator_to_info[from_id_lower] = gaf_creator_copy
                creator_to_messages[from_id_lower] = msg_obj

                msg_copy =  gaf_creator_copy['messages']
                for key, violations in msg_copy.items():
                    if (len(violations) != 0):
                        violations.clear()

    
    for gaf_creator_id_lower, msg_obj in creator_to_messages.items():
        gaf_creator_id = lower_id_to_id.get(gaf_creator_id_lower)            
        for key, violations in msg_obj.items():
            if (len(violations) == 0):
                continue
            
            for violation in violations:
                gaf_line = violation['line']
                gaf_contents = re.split('\t', gaf_line)

                ## Get assigned by information from GAF line.  If it does not exist, attempt to get from group that created the GAF file
                assigned_by = None
                if (len(gaf_contents) < 14):
                    LOG.info('Found incorrect number of columns in GAF line ' + gaf_line)
                    assigned_by = gaf_creator_id
                else:
                    assigned_by = gaf_contents[14]
                
                if not assigned_by:
                    LOG.info('Assigned by is empty in GAF line ' + gaf_line)
                    assigned_by = gaf_creator_id
                if ((assigned_by is None) or (not assigned_by)):
                    LOG.info('Skipping since there is no data generator information in ' + gaf_creator_id + ' for ' + msg_obj)
                    continue
                
                # Get the gaf creator from creator_to_info. If it does not exist, check in new_assigned_by_to_info and if it does not exist in 
                # new_assigned_by_to_info, create a new entry
                assigned_by_lower = assigned_by.lower();
                gaf_creator_details = creator_to_info.get(assigned_by_lower)
                
                if (gaf_creator_details is None):
                    gaf_creator_details = new_assigned_by_to_info.get(assigned_by_lower)
                

                if (gaf_creator_details is None):
                    # Create a new GAF creator object and add to new_assigned_by_to_info
                    gaf_creator_details = copy.deepcopy(empty_gaf_creator)
                    gaf_creator_details['id'] = assigned_by
                    new_assigned_by_to_info[assigned_by_lower] = gaf_creator_details

                # Append the violation detail
                msg_obj = gaf_creator_details['messages']
                if (msg_obj.get(key) is None):  # Not all GAF creators specify all GORULE violations
                    msg_obj[key] = []
                
                msg_obj[key].append(violation)


    ## output is a list of json objects
    ## Convert dict to list where each entry is a json object
    violator_list = []
    for gaf_creator in creator_to_info.values():
        violator_list.append(gaf_creator)

    for gaf_creator in new_assigned_by_to_info.values():
        violator_list.append(gaf_creator)


    ## Final writeout.
    with open(args.output, 'w+') as fhandle:
        fhandle.write(json.dumps(violator_list, sort_keys=True, indent=4))

                        


## You saw it coming...
if __name__ == '__main__':
    main()    