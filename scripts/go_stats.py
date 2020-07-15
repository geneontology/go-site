# GO Update Statistics

import json
import sys, getopt, os

from xml.etree import ElementTree

import go_stats_utils as utils


# INPUT PARAMETERS
golr_base_url = 'http://golr-aux.geneontology.io/solr/'

ALL = "All"
BP = "GO:0008150"
MF = "GO:0003674"
CC = "GO:0005575"


# SET OF REFERENCE GENOMES (used to compute number of annotations by evidence code for each species)
reference_genomes_ids = [
    "NCBITaxon:9606",
    "NCBITaxon:10116",
    "NCBITaxon:10090",
    "NCBITaxon:3702",
    "NCBITaxon:7955",
    "NCBITaxon:6239",
    "NCBITaxon:559292",
    "NCBITaxon:7227",
    "NCBITaxon:44689",
    "NCBITaxon:4896",
    "NCBITaxon:83333"
]


# GOLR prepared queries
golr_select_ontology =  'select?wt=json&fq=document_category:"ontology_class"&fq=id:GO\:*&fq=idspace:"GO"&fl=source,annotation_class,is_obsolete&rows=2000000&q=*:*&facet=true&facet.field=source&facet.limit=1000000&facet.mincount=1'
golr_select_annotations = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&facet=true&facet.field=taxon&facet.field=aspect&facet.field=evidence_type&facet.field=assigned_by&facet.field=reference&facet.field=type&facet.limit=1000000&facet.mincount=1&rows=0'
golr_select_annotations_no_pbinding = golr_select_annotations + "&fq=!annotation_class:\"GO:0005515\"" # to remove only DIRECT annotations to protein binding
golr_select_bioentities = 'select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0'
golr_select_bioentities_pb = 'select?fq=document_category:"bioentity"&q=*:*&wt=json&rows=100000&fq=annotation_class_list:"GO:0005515"&fl=annotation_class_list,type,taxon'
golr_select_qualifiers = 'select?fq=document_category:%22annotation%22&q=*:*&rows=0&wt=json&facet=true&facet.field=qualifier&facet.limit=1000000'
golr_select_references = 'select?fq=document_category:%22annotation%22&q=*:*&rows=0&wt=json&facet=true&facet.field=reference&facet.limit=10000000'



# useful grouping of evidences as discussed with Pascale
evidence_groups = {
    "EXP": ["EXP", "IDA", "IEP", "IGC", "IGI", "IMP", "IPI"],
    "HTP": ["HDA", "HEP", "HGI", "HMP", "HTP"],
    "PHYLO": ["IBA", "IRD", "IKR", "IMR"],
    "IEA": ["IEA"],
    "ND": ["ND"],
    "OTHER": ["IC", "ISA", "ISM", "ISO", "ISS", "NAS", "RCA", "TAS"]
}

# convenience reverse map of evidence groups
reverse_evidence_groups = { }
for key, value in evidence_groups.items():                                                                                                                                                    
    for key2 in value:                                                                                                                                                                        
        reverse_evidence_groups[key2] = key    

# auto computed set of ~ 200 species with > 1000 annotations
usable_taxons = [ ]

# fetch at startup from eutils.ncbi.nlm and parse into a map
taxon_base_url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=taxonomy'
taxon_map_fallback_url = 'https://geneontology.s3.amazonaws.com/taxon_map.json'
taxon_map = { }

# auto computed set of groups doing annotations (assigned_by)
groups = [ ]

# auto computed set of bioentity types
bioentity_types = [ ]

# auto computed map to collapse RNA under a same cluster
bioentity_type_cluster = { }

# convenience reverse map of bioentity_type_cluster
reverse_bioentity_type_cluster = { }


def compute_stats(golr_url, release_date, exclude_pb_only = False):
    """
    compute stats on GO annotations - can specify if we include or exclude annotations to protein binding only
    """
    global golr_base_url
    golr_base_url = golr_url

    print("Will use golr url: " , golr_base_url)

    print("1 / 4 - Fetching GO terms...")
    all_terms = utils.golr_fetch(golr_base_url, golr_select_ontology)
    print("Done.")
    
    print("2 / 4 - Fetching GO annotations...")
    if exclude_pb_only:
        all_annotations = utils.golr_fetch(golr_base_url, golr_select_annotations_no_pbinding)
    else:
        all_annotations = utils.golr_fetch(golr_base_url, golr_select_annotations)
    print("Done.")
    
    print("3 / 4 - Fetching GO bioentities...")
    all_entities = utils.golr_fetch(golr_base_url, golr_select_bioentities)

    # we have to manually update the facts of the first query if we want to remove the bioentities annotated only to protein binding
    if exclude_pb_only:
        all_entities_no_pb = utils.golr_fetch(golr_base_url, golr_select_bioentities_pb)
        # print(all_entities_no_pb)
        entities_type_no_pb = { }
        entities_taxon_no_pb = { }

        count = 0

        for doc in all_entities_no_pb['response']['docs']:
            if len(doc['annotation_class_list']) > 1:
                continue
            count += 1
            if doc['type'] in entities_type_no_pb:
                entities_type_no_pb[doc['type']] += 1
            else:
                entities_type_no_pb[doc['type']] = 1

            if doc['taxon'] in entities_type_no_pb:
                entities_taxon_no_pb[doc['taxon']] += 1
            else:
                entities_taxon_no_pb[doc['taxon']] = 1

        # finally update the type facet field
        types = all_entities['facet_counts']['facet_fields']['type']
        for i in range(0, len(types), 2):
            ctype = types[i]
            retr_value = entities_type_no_pb[ctype] if ctype in entities_type_no_pb else 0
            types[i + 1] = types[i + 1] - retr_value
        all_entities['facet_counts']['facet_fields']['type'] = types

        all_entities['response']['numFound'] = all_entities['response']['numFound'] - count
       
        # and update the taxon facet field
        taxons = all_entities['facet_counts']['facet_fields']['taxon']
        for i in range(0, len(taxons), 2):
            ctaxon = taxons[i]
            retr_value = entities_taxon_no_pb[ctaxon] if ctaxon in entities_taxon_no_pb else 0
            taxons[i + 1] = taxons[i + 1] - retr_value
        all_entities['facet_counts']['facet_fields']['taxon'] = taxons
    
    print("Done.")

    qualifiers = utils.golr_fetch(golr_base_url, golr_select_qualifiers)
    qualifiers = utils.build_map(qualifiers['facet_counts']['facet_fields']['qualifier'])



    print("4 / 4 - Creating Stats...")    
    prepare_globals(all_annotations)
    print("\t4a - globals prepared")
    stats = create_stats(all_terms, all_annotations, all_entities, release_date, qualifiers, exclude_pb_only)
    print("Done.")
    
    return stats

def load_taxon_map():
    global taxon_map
    print("Using ", taxon_map_fallback_url , " (created from ftp://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdmp.zip) as a fallback to get taxon { id, label }")
    data = utils.fetch(taxon_map_fallback_url)

    if data is None or data.status_code != 200:
        return False

    taxon_map = json.loads(data.content)
    check = '9606' in taxon_map and taxon_map['9606'] == 'Homo sapiens'
    return check

def prepare_globals(all_annotations):
    global usable_taxons
    global taxon_map
    global groups
    global bioentity_types
    global bioentity_type_cluster
    global reverse_bioentity_type_cluster    

    temp = all_annotations['facet_counts']['facet_fields']['assigned_by']
    groups = utils.build_list(temp)

    temp = all_annotations['facet_counts']['facet_fields']['taxon']
    usable_taxons = utils.build_list(temp, 1000)
    all_taxons = utils.build_list(temp, None)

    # this step will create the global taxon_map to get any name from an id
    temp_taxons = []
    for taxon in all_taxons:
        temp_taxons.append(taxon[taxon.index(":")+1:])

    params = { "id" : ",".join(temp_taxons) }
    data = utils.post(taxon_base_url, params)

    try :
        if data and data.status_code == 200:
            tree = ElementTree.fromstring(data.content)
            elts = tree.findall("Taxon")
            for i in range(0,len(elts)):
                key = elts[i].findtext("TaxId")
                val = elts[i].findtext("ScientificName")
                taxon_map[key] = val
            print("Note: taxon map of ", len(taxon_map), " taxa loaded from " , taxon_base_url + " - in case of issue could use https://www.ebi.ac.uk/ena/data/taxonomy/v1/taxon/tax-id/xxx")
        else:
            print("WARNING: could not get taxon labels from ", taxon_base_url , " (status code: " , str(data.status_code) + ")")
            load_taxon_map()
    except Exception as x:
        print("Should never happened but life is full of mysteries - API call + retries + check on None still crashed" , x)
        load_taxon_map()


    # verbose check on taxon label mapping
    check = '9606' in taxon_map and taxon_map['9606'] == 'Homo sapiens'
    if check:
        print("Successfully pass taxon label mapping test (taxon_map['9606'] == 'Homo sapiens'): ", taxon_map['9606'] == 'Homo sapiens')
    else:
        print("Taxon map could not be created, will show taxon labels as UNK")
        

    bioentity_type_cluster = { }
    temp = all_annotations['facet_counts']['facet_fields']['type']
    for i in range(0, len(temp), 2):
        bioentity_types.append(temp[i])
        bioentity_type_cluster[temp[i]] = utils.bioentity_type(temp[i])

    reverse_bioentity_type_cluster = utils.build_reverse_map(bioentity_type_cluster)

    
def golr_fetch_bioentities_taxon(taxon):
    url = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&rows=0&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&fq=taxon:\"" + taxon + "\""
    response = utils.golr_fetch(golr_base_url, url)

    # multiple queries: a bit complicated but necessary due to solr 3.6 unable to do composite faceting and for speed considerations
    # * can indicate the is_a closure to find the stats on that specific aspect
    # * if evidence code was present, we could use a similar strategy
    url_bp = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0&fq=taxon:\"" + taxon + "\"&fq=isa_partof_closure:\"" + BP + "\""
    response_bp = utils.golr_fetch(golr_base_url, url_bp)

    url_mf = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0&fq=taxon:\"" + taxon + "\"&fq=isa_partof_closure:\"" + MF + "\""
    response_mf = utils.golr_fetch(golr_base_url, url_mf)

    url_cc = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0&fq=taxon:\"" + taxon + "\"&fq=isa_partof_closure:\"" + CC + "\""
    response_cc = utils.golr_fetch(golr_base_url, url_cc)

    return { ALL : response, BP : response_bp, MF : response_mf, CC : response_cc }
    
def golr_fetch_references_taxon(taxon):
    url = "select?fq=document_category:%22annotation%22&q=*:*&wt=json&rows=0&facet.limit=10000000&facet.mincount=1&facet=true&facet.field=reference&fq=taxon:\"" + taxon + "\""
    response = utils.golr_fetch(golr_base_url, url)
    return response

def golr_fetch_references_group(group):
    url = "select?fq=document_category:%22annotation%22&q=*:*&wt=json&rows=0&facet.limit=10000000&facet.mincount=1&facet=true&facet.field=reference&fq=assigned_by:\"" + group + "\""
    response = utils.golr_fetch(golr_base_url, url)
    return response

def golr_fetch_annotation_by_evidence_by_species(taxon, exclude_pb_only):
    options = ""
    if exclude_pb_only:
        options = "&fq=!annotation_class:\"GO:0005515\""

    url = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&fq=taxon:%22' + taxon + '%22&facet=true&facet.field=evidence_type&facet.limit=10000&rows=0' + options
    response = utils.golr_fetch(golr_base_url, url)

    url_bp = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&fq=taxon:%22' + taxon + '%22&facet=true&facet.field=evidence_type&facet.limit=10000&rows=0&fq=isa_partof_closure:\"' + BP + '\"' + options
    response_bp = utils.golr_fetch(golr_base_url, url_bp)

    url_mf = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&fq=taxon:%22' + taxon + '%22&facet=true&facet.field=evidence_type&facet.limit=10000&rows=0&fq=isa_partof_closure:\"' + MF + '\"' + options
    response_mf = utils.golr_fetch(golr_base_url, url_mf)

    url_cc = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&fq=taxon:%22' + taxon + '%22&facet=true&facet.field=evidence_type&facet.limit=10000&rows=0&fq=isa_partof_closure:\"' + CC + '\"' + options
    response_cc = utils.golr_fetch(golr_base_url, url_cc)

    return { ALL : response, BP : response_bp, MF : response_mf, CC : response_cc }
    


def taxon_label(taxon):
    if "NCBITaxon" in taxon:
        taxon_id = taxon[taxon.index(":")+1:]
        taxon_name = taxon_map[taxon_id] if taxon_id in taxon_map else "UNK"
        return taxon + "|" + taxon_name
    return taxon

def add_taxon_label(map):
    new_map = { }
    for key, val in map.items():
        if "NCBITaxon" in key:
            taxon_id = key[key.index(":")+1:]
            taxon_name = taxon_map[taxon_id] if taxon_id in taxon_map else "UNK" 
            # print("mapping ", taxon_id)
            if type(val) == dict:
                new_map[key + "|" + taxon_name] = add_taxon_label(val)
            else:
                new_map[key + "|" + taxon_name] = val
        else:
            if type(val) == dict:
                new_map[key] = add_taxon_label(val)
            else:
                new_map[key] = val
    return new_map

def create_stats(all_terms, all_annotations, all_entities, release_date, qualifiers, exclude_pb_only = False):
    stats = { }

    terms = 0
    obsoleted = 0
    terms_by_aspect = { "P" : 0, "F" : 0, "C" : 0 }

    for doc in all_terms['response']['docs']:
        if doc['is_obsolete']:
            obsoleted += 1
        else:
            terms += 1

            # some obsoleted annotations don't have a source
            if 'source' not in doc:
                continue

            if "biological_process" in doc['source']:
                terms_by_aspect["P"] += 1
            if "molecular_function" in doc['source']:
                terms_by_aspect["F"] += 1
            if "cellular_component" in doc['source']:
                terms_by_aspect["C"] += 1
            
    terms = { 
        "total" : all_terms['response']['numFound'],
        "valid" : terms,
        "obsolete" : obsoleted,
        "by_aspect" : terms_by_aspect
    }
    print("\t4b - terms computed")

    all_bioentities_by_taxon = { }
    cluster_bioentities_by_taxon = { }
    for taxon in usable_taxons:
        responses = golr_fetch_bioentities_taxon(taxon)
        all_map = utils.build_map(responses[ALL]['facet_counts']['facet_fields']['type'])
        bp_map = utils.build_map(responses[BP]['facet_counts']['facet_fields']['type'])
        mf_map = utils.build_map(responses[MF]['facet_counts']['facet_fields']['type'])
        cc_map = utils.build_map(responses[CC]['facet_counts']['facet_fields']['type'])

        merged_map = {}
        for key, value in all_map.items():
            merged_map[key] = { "A" : value , "P" : bp_map[key] if key in bp_map else 0 , "F" : mf_map[key] if key in mf_map else 0 , "C" : cc_map[key] if key in cc_map else 0 }

        all_bioentities_by_taxon[taxon] = merged_map
        cluster_bioentities_by_taxon[taxon] =  utils.cluster_complex_map(all_bioentities_by_taxon[taxon], bioentity_type_cluster)
        
        # all_bioentities_by_taxon[taxon] = build_map(res['facet_counts']['facet_fields']['type'])
        # cluster_bioentities_by_taxon[taxon] =  cluster_map(all_bioentities_by_taxon[taxon], bioentity_type_cluster)
    print("\t4c - bioentities computed")

    references_by_taxon = { }
    pmids_by_taxon = { }
    for taxon in usable_taxons:
        res = golr_fetch_references_taxon(taxon)
        references_by_taxon[taxon] = int(len(res['facet_counts']['facet_fields']['reference']) / 2)
        pmid_map = utils.build_map(res['facet_counts']['facet_fields']['reference'])
        pmid_map = len(utils.extract_map(pmid_map, "PMID:"))
        pmids_by_taxon[taxon] = pmid_map
    references_by_taxon = utils.ordered_map(references_by_taxon)
    pmids_by_taxon = utils.ordered_map(pmids_by_taxon)
    print("\t4d - taxa computed")

    references_by_group = { }
    pmids_by_group = { }
    for group in groups:
        res = golr_fetch_references_group(group)
        references_by_group[group] = int(len(res['facet_counts']['facet_fields']['reference']) / 2)
        pmid_map = utils.build_map(res['facet_counts']['facet_fields']['reference'])
        pmid_map = len(utils.extract_map(pmid_map, "PMID:"))
        pmids_by_group[group] = pmid_map
    references_by_group = utils.ordered_map(references_by_group)
    pmids_by_group = utils.ordered_map(pmids_by_group)
    print("\t4e - references computed")



    ref_genome_annotation_evidences = { }
    for taxon in reference_genomes_ids:
        responses = golr_fetch_annotation_by_evidence_by_species(taxon, exclude_pb_only)
        all_map = utils.build_map(responses[ALL]['facet_counts']['facet_fields']['evidence_type'])
        bp_map = utils.build_map(responses[BP]['facet_counts']['facet_fields']['evidence_type'])
        mf_map = utils.build_map(responses[MF]['facet_counts']['facet_fields']['evidence_type'])
        cc_map = utils.build_map(responses[CC]['facet_counts']['facet_fields']['evidence_type'])

        merged_map = {}
        for key, value in all_map.items():
            merged_map[key] = { "A" : value , "P" : bp_map[key] if key in bp_map else 0 , "F" : mf_map[key] if key in mf_map else 0 , "C" : cc_map[key] if key in cc_map else 0 }

        ref_genome_annotation_evidences[taxon] = {
            "by_evidence" : merged_map
        }
        ref_genome_annotation_evidences[taxon]["by_evidence_cluster"] = utils.cluster_complex_map(ref_genome_annotation_evidences[taxon]["by_evidence"], reverse_evidence_groups)

        # adding qualifiers for each model organism
        response_qualifiers = utils.golr_fetch_by_taxon(golr_base_url, golr_select_qualifiers, taxon)
        response_qualifiers = response_qualifiers['facet_counts']['facet_fields']['qualifier']
        ref_genome_annotation_evidences[taxon]["by_qualifier"] = utils.build_map(response_qualifiers)
        

    annotations = { 
        "total" : all_annotations['response']['numFound'],

        "by_aspect" : utils.build_map(all_annotations['facet_counts']['facet_fields']['aspect']),

        "by_bioentity_type" : {
            "all" : utils.build_map(all_annotations['facet_counts']['facet_fields']['type']),
            "cluster" : utils.cluster_map(utils.build_map(all_annotations['facet_counts']['facet_fields']['type']), bioentity_type_cluster)
        },

        "by_qualifier" : qualifiers,
        
        "by_taxon": utils.build_map(all_annotations['facet_counts']['facet_fields']['taxon']),

        "by_evidence": {
            "all" : utils.build_map(all_annotations['facet_counts']['facet_fields']['evidence_type']),
            "cluster" : utils.cluster_map(utils.build_map(all_annotations['facet_counts']['facet_fields']['evidence_type']), reverse_evidence_groups)
        },

        "by_model_organism" : ref_genome_annotation_evidences,

        "by_group": utils.build_map(all_annotations['facet_counts']['facet_fields']['assigned_by'])
        
    }
    annotations = add_taxon_label(annotations)

    taxa =  {
        "total" : int(len(all_annotations['facet_counts']['facet_fields']['taxon']) / 2),
        "filtered" : len(usable_taxons),
    }

    bioentities = {
        "total" : all_entities['response']['numFound'],

        "by_type" : {
            "all" : utils.build_map(all_entities['facet_counts']['facet_fields']['type']),
            "cluster" : utils.cluster_map(utils.build_map(all_entities['facet_counts']['facet_fields']['type']), bioentity_type_cluster)
        },

        "by_filtered_taxon" : {
            "all" : all_bioentities_by_taxon,
            "cluster" : cluster_bioentities_by_taxon
        }

        # This can not work and would require an evidence fields in the GOLR bioentity docs
        # "by_taxon" : {
        #     "all" : all_bioentities_by_taxon,
        #     "experimental" : experimental_bioentities_by_taxon
        # }
    }
    bioentities = add_taxon_label(bioentities)

    references = {
        "all" : {
            "total" : int(len(all_annotations['facet_counts']['facet_fields']['reference']) / 2),
            "by_filtered_taxon" : references_by_taxon,
            "by_group" : references_by_group
        },
        "pmids" : {
            "total" : len(utils.extract_map(utils.build_map(all_annotations['facet_counts']['facet_fields']['reference']), "PMID:")),
            "by_filtered_taxon" : pmids_by_taxon,
            "by_group" : pmids_by_group
        }
    }
    references = add_taxon_label(references)
    
    stats["release_date"] = release_date
    stats["terms"] = terms
    stats["annotations"] = annotations
    stats["taxa"] = taxa
    stats["bioentities"] = bioentities
    stats["references"] = references

    return stats


def create_text_report(stats_json):
    text_report = ""

    text_report = "GENE ONTOLOGY STATISTICS"
    text_report += "\nrelease_date\t" + stats_json["release_date"]    

    text_report += "\n\nTERMS\n"
    text_report += "total\t" + str(stats_json["terms"]["total"]) + "\nobsolete\t" + str(stats_json["terms"]["obsolete"]) + "\nvalid total\t" + str(stats_json["terms"]["valid"])
    text_report += "\nvalid P\t" + str(stats_json["terms"]["by_aspect"]["P"]) + "\nvalid F\t" + str(stats_json["terms"]["by_aspect"]["F"]) + "\nvalid C\t" + str(stats_json["terms"]["by_aspect"]["C"])


    text_report += "\n\nBIOENTITIES\n"
    text_report += "total\t" + str(stats_json["bioentities"]["total"])

    text_report += "\n\nBIOENTITIES BY TYPE (CLUSTER)"
    for key, val in stats_json["bioentities"]["by_type"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nBIOENTITIES BY TYPE (ALL)"
    for key, val in stats_json["bioentities"]["by_type"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nBIOENTITIES BY FILTERED TAXON AND BY TYPE (CLUSTER)"
    text_report += "\ntaxon"
    for type, nb in stats_json["bioentities"]["by_type"]["cluster"].items():
        text_report += "\t" + type
    for key, val in stats_json["bioentities"]["by_filtered_taxon"]["cluster"].items():
        text_report += "\n" + key
        for type, nb in stats_json["bioentities"]["by_type"]["cluster"].items():
            text_report += "\t" + str(val[type]["A"]) if type in val else "\t0"

    text_report += "\n\nBIOENTITIES BY FILTERED TAXON AND BY TYPE (ALL)"
    text_report += "\ntaxon"
    for type, nb in stats_json["bioentities"]["by_type"]["all"].items():
        text_report += "\t" + type
    for key, val in stats_json["bioentities"]["by_filtered_taxon"]["all"].items():
        text_report += "\n" + key
        for type, nb in stats_json["bioentities"]["by_type"]["all"].items():
            text_report += "\t" + str(val[type]["A"]) if type in val else "\t0"


    text_report += "\n\nTAXA\n"
    text_report += "total\t" + str(stats_json["taxa"]["total"]) + "\nfiltered\t" + str(stats_json["taxa"]["filtered"])


    text_report += "\n\nANNOTATIONS\n"
    text_report += "total\t" + str(stats_json["annotations"]["total"])
    for key, val in stats_json["annotations"]["by_aspect"].items():
        text_report += "\n" + key + "\t" + str(val)
        
    text_report += "\n\nANNOTATIONS BY BIOENTITY TYPE (CLUSTER)"
    for key, val in stats_json["annotations"]["by_bioentity_type"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nANNOTATIONS BY BIOENTITY TYPE (ALL)"
    for key, val in stats_json["annotations"]["by_bioentity_type"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nANNOTATIONS BY QUALIFIER"
    for key, val in stats_json["annotations"]["by_qualifier"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nANNOTATIONS BY EVIDENCE (CLUSTER)"
    for key, val in stats_json["annotations"]["by_evidence"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nANNOTATIONS BY EVIDENCE (ALL)"
    for key, val in stats_json["annotations"]["by_evidence"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nANNOTATIONS BY GROUP"
    for key, val in stats_json["annotations"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nANNOTATIONS BY TAXON"
    for key, val in stats_json["annotations"]["by_taxon"].items():
        text_report += "\n" + key + "\t" + str(val)



    text_report += "\n\nANNOTATIONS BY MODEL ORGANISM AND EVIDENCE CODE THEN QUALIFIER"
    text_report += "\nTAXON"
    for evidence in utils.ev_all:
        text_report += "\t" + evidence
    qualifiers = list(stats_json["annotations"]["by_qualifier"].keys())
    qualifiers.sort()
    for qualifier in qualifiers:
        text_report += "\t" + qualifier

    for taxon, val in stats_json["annotations"]["by_model_organism"].items():
        text_report += "\n" + taxon
        for evidence in utils.ev_all:
            text_report += "\t" + str(stats_json["annotations"]["by_model_organism"][taxon]["by_evidence"][evidence]["A"])
        for qualifier in qualifiers:
            text_report += "\t" + str(stats_json["annotations"]["by_model_organism"][taxon]["by_qualifier"][qualifier])


    text_report += "\n\nREFERENCES AND PMIDS\n"
    text_report += "total\t" + str(stats_json["references"]["all"]["total"]) + "\t" + str(stats_json["references"]["pmids"]["total"])

    text_report += "\n\nREFERENCES AND PMIDS BY GROUP"
    text_report += "\ngroup\treferences\tpmids"
    for key, val in stats_json["references"]["all"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(stats_json["references"]["pmids"]["by_group"][key])

    text_report += "\n\nREFERENCES AND PMIDS BY TAXON"
    text_report += "\ntaxon\treferences\tpmids"
    for key, val in stats_json["references"]["all"]["by_filtered_taxon"].items():
        pmid_val = stats_json["references"]["pmids"]["by_filtered_taxon"][key] if key in stats_json["references"]["pmids"]["by_filtered_taxon"] else 0
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(pmid_val)

    return text_report

def create_meta(json_stats):
    meta = {
        "release_date": json_stats["release_date"],
        "terms": {
            "total" : json_stats["terms"]["valid"],
            "by_aspect" : json_stats["terms"]["by_aspect"]
        },
        "annotations" : {
            "total" : json_stats["annotations"]["total"],
            "experimental" : json_stats["annotations"]["by_evidence"]["cluster"]["EXP"]
        },
        "taxa": {
            "total" : json_stats["taxa"]["total"],
            "filtered" : json_stats["taxa"]["filtered"]
        },
        "bioentities" : {
            "total" : json_stats["bioentities"]["total"],
            "by_type_cluster" :json_stats["bioentities"]["by_type"]["cluster"]
        },
        "references": {
            "all" : json_stats["references"]["all"]["total"],
            "pmids": json_stats["references"]["pmids"]["total"]
        }
    }
    return meta
    

def print_help():
    print('\nUsage: python go_stats.py -g <golr_url> -d <release_date> -o <output_rep>\n')


def main(argv):
    golr_url = ''
    output_rep = ''
    release_date = ''

    if len(argv) < 6:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"g:b:o:d:",["golrurl=","orep=","date="])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)

    for opt, arg in opts:
        if opt == '-h':
            print_help()
            sys.exit()
        elif opt in ("-g", "--golrurl"):
            golr_url = arg
            if not golr_url.endswith("/"):
                golr_url = golr_url + "/"
        elif opt in ("-o", "--orep"):
            output_rep = arg
        elif opt in ("-d", "--date"):
            release_date = arg

    if not output_rep.endswith("/"):
        output_rep += "/"

    if not os.path.exists(output_rep):
        os.mkdir(output_rep)


    # actual names of the files to be generated - can change here if needed
    output_meta = output_rep + "go-meta.json"
    output_meta_no_pb = output_rep + "go-meta-no-pb.json"
    output_stats =  output_rep + "go-stats.json"
    output_stats_no_pb =  output_rep + "go-stats-no-pb.json"
    output_stats_tsv =  output_rep + "go-stats.tsv"
    output_stats_no_pb_tsv =  output_rep + "go-stats-no-pb.tsv"
    output_references = output_rep + "go-references.tsv"
    output_pmids = output_rep + "go-pmids.tsv"
    output_pubmed_pmids = output_rep + "GO.uid"


    print("Will write stats to " + output_stats + " and " + output_stats_tsv)
    json_stats = compute_stats(golr_url, release_date, False)
    print("Saving Stats to <" + output_stats + "> ...")    
    utils.write_json(output_stats, json_stats)
    print("Done.")

    print("Saving Stats to <" + output_stats_tsv + "> ...")    
    tsv_stats = create_text_report(json_stats)
    utils.write_text(output_stats_tsv, tsv_stats)
    print("Done.")


    print("Will write stats (excluding protein binding) to " + output_stats_no_pb + " and " + output_stats_no_pb_tsv)
    json_stats_no_pb = compute_stats(golr_url, release_date, True)
    print("Saving Stats to <" + output_stats_no_pb + "> ...")    
    utils.write_json(output_stats_no_pb, json_stats_no_pb)
    print("Done.")

    print("Saving Stats (excluding protein binding) to <" + output_stats_no_pb_tsv + "> ...")    
    tsv_stats_no_pb = create_text_report(json_stats_no_pb)
    utils.write_text(output_stats_no_pb_tsv, tsv_stats_no_pb)
    print("Done.")


    json_meta = create_meta(json_stats)
    print("Saving META to <" + output_meta + "> ...")    
    utils.write_json(output_meta, json_meta)
    print("Done.")


    json_meta_no_pb = create_meta(json_stats_no_pb)
    print("Saving META to <" + output_meta_no_pb + "> ...")    
    utils.write_json(output_meta_no_pb, json_meta_no_pb)
    print("Done.")


    print("Saving PMID file to <" + output_pmids + "> and PubMed PMID file to <" + output_pubmed_pmids + ">")
    references = get_references()
    pmids = {k:v for k,v in references.items() if "PMID:" in k}
    pmids_ids = map(lambda x : x.split(":")[1], pmids)

    pmids_lines = []
    for k,v in pmids.items():
        pmids_lines.append(k + "\t" + str(v))

    utils.write_text(output_pmids, "\n".join(pmids_lines))
    utils.write_text(output_pubmed_pmids, "\n".join(pmids_ids))
    print("Done.")

    



def get_references():
    refs = utils.golr_fetch(golr_base_url, golr_select_references)
    refs = utils.build_map(refs['facet_counts']['facet_fields']['reference'])
    return refs




if __name__ == "__main__":
   main(sys.argv[1:])
   