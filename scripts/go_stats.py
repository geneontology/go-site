# GO Update Statistics

import requests
import json
import sys, getopt, os

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



# GOLR prepared queries
golr_select_ontology =  'select?wt=json&fq=document_category:"ontology_class"&fq=id:GO\:*&fq=idspace:"GO"&fl=source,annotation_class,is_obsolete&rows=2000000&q=*:*&facet=true&facet.field=source&facet.limit=1000000&facet.mincount=1'
golr_select_annotations = 'select?fq=document_category:%22annotation%22&q=*:*&wt=json&facet=true&facet.field=taxon&facet.field=aspect&facet.field=evidence_type&facet.field=assigned_by&facet.field=reference&facet.field=type&facet.limit=1000000&facet.mincount=1&rows=0'
golr_select_annotations_no_pbinding = golr_select_annotations + "&fq=!isa_partof_closure:\"GO:0005515\""
golr_select_bioentities = 'select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0'


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
    "EXP": ["EXP", "IDA", "IEP", "IGC", "IGI", "IKR", "IMP", "IPI"],
    "HTP": ["HDA", "HEP", "HGI", "HMP", "HTP"],
    "IBA": ["IBA"],
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

# auto computed set of groups doing annotations (assigned_by)
groups = [ ]

# auto computed set of bioentity types
bioentity_types = [ ]

# auto computed map to collapse RNA under a same cluster
bioentity_type_cluster = { }

# convenience reverse map of bioentity_type_cluster
reverse_bioentity_type_cluster = { }

# will contain the last release date from following url
release_date = "N/A"
go_pipeline_release_url = "http://current.geneontology.org/metadata/release-date.json"

def get_release_date():
    r = requests.get(go_pipeline_release_url)
    return r.json()['date']






def lambda_handler(event, context):
    stats = compute_stats(golr_base_url)
    return stats

def compute_stats(golr_url):
    global golr_base_url
    golr_base_url = golr_url

    print("Will use golr url: " , golr_base_url)

    global release_date
    release_date = get_release_date()

    print("1 / 4 - Fetching GO terms...")
    all_terms = golr_fetch(golr_select_ontology)
    print("Done.")
    
    print("2 / 4 - Fetching GO annotations...")
    all_annotations = golr_fetch(golr_select_annotations)
    # all_annotations_no_pbinding = golr_fetch(golr_select_annotations_no_pbinding)
    print("Done.")
    
    print("3 / 4 - Fetching GO bioentities...")
    all_entities = golr_fetch(golr_select_bioentities)
    print("Done.")

    print("4 / 4 - Creating Stats...")    
    prepare_globals(all_annotations)
    stats = create_stats(all_terms, all_annotations, all_entities)
    print("Done.")
    
    return stats

def prepare_globals(all_annotations):
    global usable_taxons
    global groups
    global bioentity_types
    global bioentity_type_cluster
    global reverse_bioentity_type_cluster

    temp = all_annotations['facet_counts']['facet_fields']['assigned_by']
    groups = build_list(temp)

    temp = all_annotations['facet_counts']['facet_fields']['taxon']
    usable_taxons = build_list(temp, 1000)

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
    url_bp = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0&fq=taxon:%22NCBITaxon:9606%22&fq=isa_partof_closure:\"" + BP + "\""
    response_bp = golr_fetch(url_bp)

    url_mf = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0&fq=taxon:%22NCBITaxon:9606%22&fq=isa_partof_closure:\"" + MF + "\""
    response_mf = golr_fetch(url_mf)

    url_cc = "select?fq=document_category:%22bioentity%22&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=0&fq=taxon:%22NCBITaxon:9606%22&fq=isa_partof_closure:\"" + CC + "\""
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
    
def create_stats(all_terms, all_annotations, all_entities):
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

        "taxons" : {
            "total" : int(len(all_annotations['facet_counts']['facet_fields']['taxon']) / 2),
            "filtered" : len(usable_taxons),
        },

        "references" : {
            "total" : int(len(all_annotations['facet_counts']['facet_fields']['reference']) / 2),
            "by_taxon" : references_by_taxon,
            "by_group" : references_by_group
        },

        "pmids" : {
           "total" : len(extract_map(build_map(all_annotations['facet_counts']['facet_fields']['reference']), "PMID:")),
            "by_taxon" : pmids_by_taxon,
            "by_group" : pmids_by_group
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

        "by_group": build_map(all_annotations['facet_counts']['facet_fields']['assigned_by'])
        
    }

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


    text_report += "\n\nTAXONS\n"
    text_report += "total\t" + str(stats_json["annotations"]["taxons"]["total"]) + "\nfiltered\t" + str(stats_json["annotations"]["taxons"]["filtered"])


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
    text_report += "total\t" + str(stats_json["annotations"]["references"]["total"]) + "\t" + str(stats_json["annotations"]["pmids"]["total"])

    text_report += "\n\nREFERENCES AND PMIDS BY GROUP"
    text_report += "\ngroup\treferences\tpmids"
    for key, val in stats_json["annotations"]["references"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(stats_json["annotations"]["pmids"]["by_group"][key])

    text_report += "\n\nREFERENCES AND PMIDS BY TAXON"
    text_report += "\ntaxon\treferences\tpmids"
    for key, val in stats_json["annotations"]["references"]["by_taxon"].items():
        pmid_val = stats_json["annotations"]["pmids"]["by_taxon"][key] if key in stats_json["annotations"]["pmids"]["by_taxon"] else 0
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
        "taxons": {
            "total" : json_stats["annotations"]["taxons"]["total"],
            "filtered" : json_stats["annotations"]["taxons"]["filtered"]
        },
        "bioentities" : {
            "total" : json_stats["annotations"]["bioentities"]["total"],
            "by_type" :json_stats["annotations"]["bioentities"]["by_type"]["cluster"]
        },
        "references": json_stats["annotations"]["references"]["total"],
        "pmids": json_stats["annotations"]["pmids"]["total"]
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
    print('Usage: python go_stats.py -g <golr_url> -o <output_rep>\n')


def main(argv):
    golr_url = ''
    output_rep = ''

    if len(argv) < 3:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"g:o:",["gurl=","ofile="])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)

    for opt, arg in opts:
        if opt == '-h':
            print_help()
            sys.exit()
        elif opt in ("-g", "--gurl"):
            golr_url = arg
        elif opt in ("-o", "--ofile"):
            output_rep = arg
        
    if not output_rep.endswith("/"):
        output_rep += "/"

    if not os.path.exists(output_rep):
        os.mkdir(output_rep)

    output_meta = output_rep + "go-meta.json"
    output_json =  output_rep + "go-stats.json"
    output_tsv =  output_rep + "go-stats.tsv"

    print("Will write stats to " + output_json + " and " + output_tsv)

    json_stats = compute_stats(golr_url)

    print("Saving Stats to <" + output_json + "> ...")    
    write_json(output_json, json_stats)
    print("Done.")


    # output_tsv =  "mystats.tsv"
    # with open('mystats.json') as json_file:  
    #     json_stats = json.load(json_file)

    print("Saving Stats to <" + output_tsv + "> ...")    
    tsv_stats = create_text_report(json_stats)
    write_text(output_tsv, tsv_stats)
    print("Done.")

    json_meta = create_meta(json_stats)
    print("Saving META to <" + output_meta + "> ...")    
    write_json(output_meta, json_meta)
    print("Done.")
    


if __name__ == "__main__":
   main(sys.argv[1:])
   