# GO Update Statistics

import requests
import json
import sys, getopt, os

from xml.etree import ElementTree

# S3 specific imports
# import boto3
# from gzip import GzipFile
# from io import BytesIO

# s3_resource = boto3.resource('s3')
# go_s3_bucket = s3_resource.Bucket(name="geneontology-public")
# go_all_terms_key = "go-terms-aspect.json"
# go_stats_key= "go-stats"
# go_meta_key = "go-meta.json"
# go_most_annotated_gps_key= "go-annotated-gps.json"



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
# golr_select_annotations_no_pbinding = golr_select_annotations + "&fq=!isa_partof_closure:\"GO:0005515\"" # if we want to remove all derivates
golr_select_annotations_no_pbinding = golr_select_annotations + "&fq=!annotation_class:\"GO:0005515\"" # to remove only DIRECT annotations to protein binding
golr_select_bioentities = 'select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0'
golr_select_bioentities_pb = 'select?fq=document_category:"bioentity"&q=*:*&wt=json&rows=100000&fq=annotation_class_list:"GO:0005515"&fl=annotation_class_list,type,taxon'


def golr_fetch(select_query):
    # print("trying: " + golr_base_url + select_query)
    r = requests.get(golr_base_url + select_query)
    response = r.json()
    return response

def build_list(items_list, min_size = None):
    ls = []
    for i in range(0, len(items_list), 2):
        if min_size is None or items_list[i + 1] > min_size:
            ls.append(items_list[i])
    return ls

# utility function to transform a list [A, 1, B, 2] into a map {A: 1, B: 2}
def build_map(items_list, min_size = None):
    map = {}
    for i in range(0, len(items_list), 2):
        if min_size is None or items_list[i + 1] > min_size:
            map[items_list[i]] = items_list[i + 1]
    return map

# utility function to build a reverse map: { "a": 1, "b": 1, "c": 2 } -> {1: ["a", "b"], 2: ["c"]}
def build_reverse_map(map):
    reverse_map = { }
    for key, val in map.items():
        ls = []
        if val in reverse_map:
            ls = reverse_map[val]
        else:
            reverse_map[val] = ls
        ls.append(key)
    return reverse_map

# utility function to cluster elements of an input map based on another map of synonyms
def cluster_map(input_map, synonyms):
    cluster = { }
    for key, val in input_map.items():
        temp = synonyms[key]
        if temp in cluster:
            val_cluster = cluster[temp]
            cluster[temp] = val_cluster + val
        else:
            cluster[temp] = val
    return cluster

# similar as above but the value of each key is also a map
def cluster_complex_map(input_map, synonyms):
    cluster = { }
    for key, val in input_map.items():
        temp = synonyms[key]
        # print("working on : " , key , val)
        if temp in cluster:
            temp_cluster = cluster[temp]
            # print("cluster already found : ", temp , temp_cluster)
            for key_cluster, val_cluster in temp_cluster.items():
                temp_cluster[key_cluster] = val_cluster + val[key_cluster]
        else:
            cluster[temp] = val
    return cluster


# reorder map (python 3.6 keeps order in which items are inserted in map: https://stackoverflow.com/questions/613183/how-do-i-sort-a-dictionary-by-value)
def ordered_map(map):
    ordered_map = { }
    for w in sorted(map, key=map.get, reverse=True):
        ordered_map[w] = map[w]
    return ordered_map
    
def extract_map(map, key_str):
    extracted = { }
    for key, val in map.items():
        if key_str in key:
            extracted[key] = val
    return extracted

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

# will contain the last release date from following url
# release_date = "N/A"
# go_pipeline_release_url = "http://current.geneontology.org/metadata/release-date.json"

# def get_release_date():
    # r = requests.get(go_pipeline_release_url)
    # return r.json()['date']






# def lambda_handler(event, context):
    # stats = compute_stats(golr_base_url)
    # return stats

def compute_stats(golr_url, release_date, exclude_pb_only = False):
    """
    compute stats on GO annotations - can specify if we include or exclude annotations to protein binding only
    """
    global golr_base_url
    golr_base_url = golr_url

    print("Will use golr url: " , golr_base_url)

    # global release_date
    # release_date = get_release_date()

    print("1 / 4 - Fetching GO terms...")
    all_terms = golr_fetch(golr_select_ontology)
    print("Done.")
    
    print("2 / 4 - Fetching GO annotations...")
    if exclude_pb_only:
        all_annotations = golr_fetch(golr_select_annotations_no_pbinding)
    else:
        all_annotations = golr_fetch(golr_select_annotations)
    print("Done.")
    
    print("3 / 4 - Fetching GO bioentities...")
    all_entities = golr_fetch(golr_select_bioentities)

    # we have to manually update the facts of the first query if we want to remove the bioentities annotated only to protein binding
    if exclude_pb_only:
        all_entities_no_pb = golr_fetch(golr_select_bioentities_pb)
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

    print("4 / 4 - Creating Stats...")    
    prepare_globals(all_annotations)
    print("\t4a - globals prepared")
    stats = create_stats(all_terms, all_annotations, all_entities, release_date)
    print("Done.")
    
    return stats

def load_taxon_map():
    global taxon_map
    print("Using ", taxon_map_fallback_url , " (created from ftp://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdmp.zip) as a fallback to get taxon { id, label }")
    data = requests.get(taxon_map_fallback_url)

    if data.status_code != 200:
        return False

    taxon_map = json.loads(data.content)
    check = taxon_map['9606'] == 'Homo sapiens'
    return check

def prepare_globals(all_annotations):
    global usable_taxons
    global taxon_map
    global groups
    global bioentity_types
    global bioentity_type_cluster
    global reverse_bioentity_type_cluster    

    temp = all_annotations['facet_counts']['facet_fields']['assigned_by']
    groups = build_list(temp)

    temp = all_annotations['facet_counts']['facet_fields']['taxon']
    usable_taxons = build_list(temp, 1000)
    all_taxons = build_list(temp, None)

    # this step will create the global taxon_map to get any name from an id
    temp_taxons = []
    for taxon in all_taxons:
        temp_taxons.append(taxon[taxon.index(":")+1:])

    params = { "id" : ",".join(temp_taxons) }
    data = requests.post(taxon_base_url, data = params)

    if data.status_code == 200:
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

    # verbose check on taxon label mapping
    check = taxon_map['9606'] == 'Homo sapiens'
    if check:
        print("Successfully pass taxon label mapping test (taxon_map['9606'] == 'Homo sapiens'): ", taxon_map['9606'] == 'Homo sapiens')
    else:
        print("Taxon map could not be created, will show taxon labels as UNK")
        

    bioentity_type_cluster = { }
    temp = all_annotations['facet_counts']['facet_fields']['type']
    for i in range(0, len(temp), 2):
        bioentity_types.append(temp[i])
        bioentity_type_cluster[temp[i]] = bioentity_type(temp[i])

    reverse_bioentity_type_cluster = build_reverse_map(bioentity_type_cluster)

def bioentity_type(str_type):
    """
    In a nutshell, collapse all RNA related types into RNA
    """
    if "RNA" in str_type or "ribozyme" in str_type or "transcript" in str_type:
        return "RNA"
    return str_type
    
def golr_fetch_bioentities_taxon(taxon):
    url = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&rows=0&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&fq=taxon:\"" + taxon + "\""
    response = golr_fetch(url)

    # multiple queries: a bit complicated but necessary due to solr 3.6 unable to do composite faceting and for speed considerations
    # * can indicate the is_a closure to find the stats on that specific aspect
    # * if evidence code was present, we could use a similar strategy
    url_bp = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0&fq=taxon:\"" + taxon + "\"&fq=isa_partof_closure:\"" + BP + "\""
    response_bp = golr_fetch(url_bp)

    url_mf = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0&fq=taxon:\"" + taxon + "\"&fq=isa_partof_closure:\"" + MF + "\""
    response_mf = golr_fetch(url_mf)

    url_cc = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0&fq=taxon:\"" + taxon + "\"&fq=isa_partof_closure:\"" + CC + "\""
    response_cc = golr_fetch(url_cc)

    return { ALL : response, BP : response_bp, MF : response_mf, CC : response_cc }
    
def golr_fetch_references_taxon(taxon):
    url = "select?fq=document_category:%22annotation%22&q=*:*&wt=json&rows=0&facet.limit=10000000&facet.mincount=1&facet=true&facet.field=reference&fq=taxon:\"" + taxon + "\""
    response = golr_fetch(url)
    return response

def golr_fetch_references_group(group):
    url = "select?fq=document_category:%22annotation%22&q=*:*&wt=json&rows=0&facet.limit=10000000&facet.mincount=1&facet=true&facet.field=reference&fq=assigned_by:\"" + group + "\""
    response = golr_fetch(url)
    return response

# def golr_fetch_evidence_by_species(taxon_id):
#     url = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&fq=taxon:%22' + taxon_id + '%22&facet=true&facet.field=evidence_type&facet.limit=10000&rows=0'
#     response = golr_fetch(url)
#     return response    


def golr_fetch_evidence_by_species(taxon):
    url = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&fq=taxon:%22' + taxon + '%22&facet=true&facet.field=evidence_type&facet.limit=10000&rows=0'
    response = golr_fetch(url)

    url_bp = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&fq=taxon:%22' + taxon + '%22&facet=true&facet.field=evidence_type&facet.limit=10000&rows=0&fq=isa_partof_closure:\"' + BP + '\"'
    response_bp = golr_fetch(url_bp)

    url_mf = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&fq=taxon:%22' + taxon + '%22&facet=true&facet.field=evidence_type&facet.limit=10000&rows=0&fq=isa_partof_closure:\"' + MF + '\"'
    response_mf = golr_fetch(url_mf)

    url_cc = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&fq=taxon:%22' + taxon + '%22&facet=true&facet.field=evidence_type&facet.limit=10000&rows=0&fq=isa_partof_closure:\"' + CC + '\"'
    response_cc = golr_fetch(url_cc)

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

def create_stats(all_terms, all_annotations, all_entities, release_date):
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
        "obsoleted" : obsoleted,
        "by_aspect" : terms_by_aspect
    }
    print("\t4b - terms computed")

    all_bioentities_by_taxon = { }
    cluster_bioentities_by_taxon = { }
    for taxon in usable_taxons:
        responses = golr_fetch_bioentities_taxon(taxon)
        all_map = build_map(responses[ALL]['facet_counts']['facet_fields']['type'])
        bp_map = build_map(responses[BP]['facet_counts']['facet_fields']['type'])
        mf_map = build_map(responses[MF]['facet_counts']['facet_fields']['type'])
        cc_map = build_map(responses[CC]['facet_counts']['facet_fields']['type'])

        merged_map = {}
        for key, value in all_map.items():
            merged_map[key] = { "A" : value , "P" : bp_map[key] if key in bp_map else 0 , "F" : mf_map[key] if key in mf_map else 0 , "C" : cc_map[key] if key in cc_map else 0 }

        all_bioentities_by_taxon[taxon] = merged_map
        cluster_bioentities_by_taxon[taxon] =  cluster_complex_map(all_bioentities_by_taxon[taxon], bioentity_type_cluster)
        
        # all_bioentities_by_taxon[taxon] = build_map(res['facet_counts']['facet_fields']['type'])
        # cluster_bioentities_by_taxon[taxon] =  cluster_map(all_bioentities_by_taxon[taxon], bioentity_type_cluster)
    print("\t4c - bioentities computed")

    references_by_taxon = { }
    pmids_by_taxon = { }
    for taxon in usable_taxons:
        res = golr_fetch_references_taxon(taxon)
        references_by_taxon[taxon] = int(len(res['facet_counts']['facet_fields']['reference']) / 2)
        pmid_map = build_map(res['facet_counts']['facet_fields']['reference'])
        pmid_map = len(extract_map(pmid_map, "PMID:"))
        pmids_by_taxon[taxon] = pmid_map
    references_by_taxon = ordered_map(references_by_taxon)
    pmids_by_taxon = ordered_map(pmids_by_taxon)
    print("\t4d - taxa computed")

    references_by_group = { }
    pmids_by_group = { }
    for group in groups:
        res = golr_fetch_references_group(group)
        references_by_group[group] = int(len(res['facet_counts']['facet_fields']['reference']) / 2)
        pmid_map = build_map(res['facet_counts']['facet_fields']['reference'])
        pmid_map = len(extract_map(pmid_map, "PMID:"))
        pmids_by_group[group] = pmid_map
    references_by_group = ordered_map(references_by_group)
    pmids_by_group = ordered_map(pmids_by_group)
    print("\t4e - references computed")

    # print("CHECK (by evidence):\n" , all_annotations['facet_counts']['facet_fields']['evidence_type'])
    # print("CHECK (buildmap(by_evidence):\n", build_map(all_annotations['facet_counts']['facet_fields']['evidence_type']))
    # print("CHECK (reverse_evidence_group:\n", reverse_evidence_groups)
    # print("CHECK (cluster(buildmap, reverse_evidence_group):\n", cluster_map(build_map(all_annotations['facet_counts']['facet_fields']['evidence_type']), reverse_evidence_groups))




    ref_genome_evidences = { }
    for taxon in reference_genomes_ids:
        responses = golr_fetch_evidence_by_species(taxon)
        all_map = build_map(responses[ALL]['facet_counts']['facet_fields']['evidence_type'])
        bp_map = build_map(responses[BP]['facet_counts']['facet_fields']['evidence_type'])
        mf_map = build_map(responses[MF]['facet_counts']['facet_fields']['evidence_type'])
        cc_map = build_map(responses[CC]['facet_counts']['facet_fields']['evidence_type'])

        merged_map = {}
        for key, value in all_map.items():
            merged_map[key] = { "A" : value , "P" : bp_map[key] if key in bp_map else 0 , "F" : mf_map[key] if key in mf_map else 0 , "C" : cc_map[key] if key in cc_map else 0 }

        ref_genome_evidences[taxon] = {
            "by_evidence" : merged_map
        }
        ref_genome_evidences[taxon]["by_evidence_cluster"] = cluster_complex_map(ref_genome_evidences[taxon]["by_evidence"], reverse_evidence_groups)
        

    annotations = { 
        "total" : all_annotations['response']['numFound'],

        "bioentities" : {
            "total" : all_entities['response']['numFound'],

            "by_type" : {
                "all" : build_map(all_entities['facet_counts']['facet_fields']['type']),
                "cluster" : cluster_map(build_map(all_entities['facet_counts']['facet_fields']['type']), bioentity_type_cluster)
            },

            "by_taxon" : {
                "all" : all_bioentities_by_taxon,
                "cluster" : cluster_bioentities_by_taxon
            }

            # This can not work and would require an evidence fields in the GOLR bioentity docs
            # "by_taxon" : {
            #     "all" : all_bioentities_by_taxon,
            #     "experimental" : experimental_bioentities_by_taxon
            # }
        },

        "taxa" : {
            "total" : int(len(all_annotations['facet_counts']['facet_fields']['taxon']) / 2),
            "filtered" : len(usable_taxons),
        },

        "references" : {
            "all" : {
                "total" : int(len(all_annotations['facet_counts']['facet_fields']['reference']) / 2),
                "by_taxon" : references_by_taxon,
                "by_group" : references_by_group
            },
            "pmids" : {
                "total" : len(extract_map(build_map(all_annotations['facet_counts']['facet_fields']['reference']), "PMID:")),
                "by_taxon" : pmids_by_taxon,
                "by_group" : pmids_by_group
            }
        },


        "by_aspect" : build_map(all_annotations['facet_counts']['facet_fields']['aspect']),

        "by_bioentity_type" : {
            "all" : build_map(all_annotations['facet_counts']['facet_fields']['type']),
            "cluster" : cluster_map(build_map(all_annotations['facet_counts']['facet_fields']['type']), bioentity_type_cluster)
        },

        "by_taxon": build_map(all_annotations['facet_counts']['facet_fields']['taxon']),

        "by_evidence": {
            "all" : build_map(all_annotations['facet_counts']['facet_fields']['evidence_type']),
            "cluster" : cluster_map(build_map(all_annotations['facet_counts']['facet_fields']['evidence_type']), reverse_evidence_groups)
        },

        "by_reference_genome" : ref_genome_evidences,

        "by_group": build_map(all_annotations['facet_counts']['facet_fields']['assigned_by'])
        
    }

    annotations = add_taxon_label(annotations)

    stats["release_date"] = release_date
    stats["terms"] = terms
    stats["annotations"] = annotations

    return stats


def create_text_report(stats_json):
    text_report = ""

    text_report = "GENE ONTOLOGY STATISTICS"
    text_report += "\nrelease_date\t" + stats_json["release_date"]    

    text_report += "\n\nTERMS\n"
    text_report += "total\t" + str(stats_json["terms"]["total"]) + "\nobsoleted\t" + str(stats_json["terms"]["obsoleted"]) + "\nvalid total\t" + str(stats_json["terms"]["valid"])
    text_report += "\nvalid P\t" + str(stats_json["terms"]["by_aspect"]["P"]) + "\nvalid F\t" + str(stats_json["terms"]["by_aspect"]["F"]) + "\nvalid C\t" + str(stats_json["terms"]["by_aspect"]["C"])


    text_report += "\n\nBIOENTITIES\n"
    text_report += "total\t" + str(stats_json["annotations"]["bioentities"]["total"])

    text_report += "\n\nBIOENTITIES BY TYPE (CLUSTER)"
    for key, val in stats_json["annotations"]["bioentities"]["by_type"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nBIOENTITIES BY TYPE (ALL)"
    for key, val in stats_json["annotations"]["bioentities"]["by_type"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nBIOENTITIES BY FILTERED TAXON AND BY TYPE (CLUSTER)"
    text_report += "\ntaxon"
    for type, nb in stats_json["annotations"]["bioentities"]["by_type"]["cluster"].items():
        text_report += "\t" + type
    for key, val in stats_json["annotations"]["bioentities"]["by_taxon"]["cluster"].items():
        text_report += "\n" + key
        for type, nb in stats_json["annotations"]["bioentities"]["by_type"]["cluster"].items():
            text_report += "\t" + str(val[type]["A"]) if type in val else "\t0"

    text_report += "\n\nBIOENTITIES BY FILTERED TAXON AND BY TYPE (ALL)"
    text_report += "\ntaxon"
    for type, nb in stats_json["annotations"]["bioentities"]["by_type"]["all"].items():
        text_report += "\t" + type
    for key, val in stats_json["annotations"]["bioentities"]["by_taxon"]["all"].items():
        text_report += "\n" + key
        for type, nb in stats_json["annotations"]["bioentities"]["by_type"]["all"].items():
            text_report += "\t" + str(val[type]["A"]) if type in val else "\t0"


    text_report += "\n\nTAXA\n"
    text_report += "total\t" + str(stats_json["annotations"]["taxa"]["total"]) + "\nfiltered\t" + str(stats_json["annotations"]["taxa"]["filtered"])


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


    text_report += "\n\nREFERENCES AND PMIDS\n"
    text_report += "total\t" + str(stats_json["annotations"]["references"]["all"]["total"]) + "\t" + str(stats_json["annotations"]["references"]["pmids"]["total"])

    text_report += "\n\nREFERENCES AND PMIDS BY GROUP"
    text_report += "\ngroup\treferences\tpmids"
    for key, val in stats_json["annotations"]["references"]["all"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(stats_json["annotations"]["references"]["pmids"]["by_group"][key])

    text_report += "\n\nREFERENCES AND PMIDS BY TAXON"
    text_report += "\ntaxon\treferences\tpmids"
    for key, val in stats_json["annotations"]["references"]["all"]["by_taxon"].items():
        pmid_val = stats_json["annotations"]["references"]["pmids"]["by_taxon"][key] if key in stats_json["annotations"]["references"]["pmids"]["by_taxon"] else 0
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
            "total" : json_stats["annotations"]["taxa"]["total"],
            "filtered" : json_stats["annotations"]["taxa"]["filtered"]
        },
        "bioentities" : {
            "total" : json_stats["annotations"]["bioentities"]["total"],
            "by_type_cluster" :json_stats["annotations"]["bioentities"]["by_type"]["cluster"]
        },
        "references": {
            "all" : json_stats["annotations"]["references"]["all"]["total"],
            "pmids": json_stats["annotations"]["references"]["pmids"]["total"]
        }
    }
    return meta
    
# def save_terms_mapping(all_terms):
#     for doc in all_terms['response']['docs']:
#         doc.pop('is_obsolete', None)

#     # creating the results divided by aspect        
#     mapping = { }
#     for term in all_terms['response']['docs']:
#         if 'source' not in term: # often, obsoleted terms have no source
#             print("Term " , term , " has no source !")
#             continue
#         if term['source'] not in mapping:
#             mapping[term['source']] = []
#         mapping[term['source']].append(term['annotation_class'])
    
#     store_json(go_all_terms_key, mapping)
#     store_json("archive/" + release_date + "_" + go_all_terms_key, mapping)
 

# def store_text(key, content):
#     # Storing a compressed version of the text file
#     gz_body = BytesIO()
#     gz = GzipFile(None, 'wb', 9, gz_body)
#     gz.write(content.encode('utf-8'))
#     gz.close()    

#     go_s3_bucket.put_object(
#         Key=key,  
#         ContentType='text/plain', 
#         ContentEncoding='gzip', 
#         Body=gz_body.getvalue()
#     )    
    
# def store_json(key, content):
#     # Storing a compressed version of the json file
#     gz_body = BytesIO()
#     gz = GzipFile(None, 'wb', 9, gz_body)
#     gz.write(json.dumps(content).encode('utf-8'))
#     gz.close()    

#     go_s3_bucket.put_object(
#         Key=key,  
#         ContentType='application/json', 
#         ContentEncoding='gzip', 
#         Body=gz_body.getvalue()
#     )    

def write_json(key, content):
    with open(key, 'w') as outfile:
        json.dump(content, outfile, indent=2)
 
def write_text(key, content):
    with open(key, 'w') as outfile:
        outfile.write(content)



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
        elif opt in ("-o", "--orep"):
            output_rep = arg
        elif opt in ("-d", "--date"):
            release_date = arg

    if not output_rep.endswith("/"):
        output_rep += "/"

    if not os.path.exists(output_rep):
        os.mkdir(output_rep)

    output_meta = output_rep + "go-meta.json"
    output_meta_no_pb = output_rep + "go-meta-no-pb.json"
    output_json =  output_rep + "go-stats.json"
    output_no_pb_json =  output_rep + "go-stats-no-pb.json"
    output_tsv =  output_rep + "go-stats.tsv"
    output_no_pb_tsv =  output_rep + "go-stats-no-pb.tsv"


    print("Will write stats to " + output_json + " and " + output_tsv)
    json_stats = compute_stats(golr_url, release_date, False)
    print("Saving Stats to <" + output_json + "> ...")    
    write_json(output_json, json_stats)
    print("Done.")

    print("Saving Stats to <" + output_tsv + "> ...")    
    tsv_stats = create_text_report(json_stats)
    write_text(output_tsv, tsv_stats)
    print("Done.")


    print("Will write stats (excluding protein binding) to " + output_no_pb_json + " and " + output_no_pb_tsv)
    json_stats_no_pb = compute_stats(golr_url, release_date, True)
    print("Saving Stats to <" + output_no_pb_json + "> ...")    
    write_json(output_no_pb_json, json_stats_no_pb)
    print("Done.")

    print("Saving Stats (excluding protein binding) to <" + output_no_pb_tsv + "> ...")    
    tsv_stats_no_pb = create_text_report(json_stats_no_pb)
    write_text(output_no_pb_tsv, tsv_stats_no_pb)
    print("Done.")


    json_meta = create_meta(json_stats)
    print("Saving META to <" + output_meta + "> ...")    
    write_json(output_meta, json_meta)
    print("Done.")


    json_meta_no_pb = create_meta(json_stats_no_pb)
    print("Saving META to <" + output_meta_no_pb + "> ...")    
    write_json(output_meta_no_pb, json_meta_no_pb)
    print("Done.")
    


if __name__ == "__main__":
   main(sys.argv[1:])
   