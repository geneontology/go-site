# GO Store Changes
# sudo yum install python34-setuptools
# sudo yum install python34-devel
# pip3 install pyyaml -t .
# sudo python3 -m pip install pyyaml

from obo_parser import OBO_Parser, TermState
import sys, getopt, os

import requests
import json

# import boto3
# import botocore
# go_s3_bucket_name = "geneontology"
# go_obo_key = "go.obo"
# s3_resource = boto3.resource('s3')
# go_s3_bucket = s3_resource.Bucket(name=go_s3_bucket_name)
# from gzip import GzipFile
# from io import BytesIO


#go_doi_url = "https://zenodo.org/api/records/1205166"

go_pipeline_release_url = "http://current.geneontology.org/metadata/release-date.json"
go_obo_url = "http://purl.obolibrary.org/obo/go.obo"

release_date = "N/A"
last_obo = None
last_date = None

# def lambda_handlerLIST(event, context):
#     global release_date
#     release_date = get_release_date()
    
#     global last_obo
#     last_obo = get_last_obo()


#     static_list = [
#         "2018-07-02",
#         "2018-08-09",
#         "2018-09-05",
#         "2018-10-08",
#         "2018-11-15",
#         "2018-12-01",
#         "2019-01-01",
#         "2019-02-01",
#         "2019-03-18",
#         "2019-04-17",
#         "2019-05-09",
#         "2019-06-09"
#     ]
    
#     global last_date
    
#     for i in range(1, len(static_list)):
#         print(i , static_list[i] , " vs " , static_list[i-1])
#         last_date = static_list[i-1]
#         old_obo_url = "https://s3.amazonaws.com/" + go_s3_bucket_name +"/archive/" + last_date + "_go.obo"
        
#         release_date = static_list[i]
#         new_obo_url = "https://s3.amazonaws.com/" + go_s3_bucket_name +"/archive/" + release_date + "_go.obo"

#         try:
#             save_changes(new_obo_url, old_obo_url)
#         except:
#             print("ERROR while generating diff (" + new_obo_url + ", " + old_obo_url + ")")
    
#     return 'success'
    
# def lambda_handler(event, context):
#     global release_date
#     release_date = get_release_date()
    
#     global last_obo
#     last_obo = get_last_obo()

#     new_obo_url = "http://purl.obolibrary.org/obo/go.obo"
#     old_obo_url = "https://s3.amazonaws.com/" + go_s3_bucket_name + "/archive/" + last_obo

#     store_current_go_obo()
#     save_changes(new_obo_url, old_obo_url)
#     return 'success'    
    
def compute_changes(current_obo_url, previous_obo_url):
    # The new published OBO archive
    print("Loading current GO ontology (" + current_obo_url + ")...")
    currentgo = OBO_Parser(requests.get(current_obo_url).text)

    # A previously published OBO archive
    print("Loading previous GO ontology (" + previous_obo_url + ")...")
    oldgo = OBO_Parser(requests.get(previous_obo_url).text)

    # New GO Terms
    created = { }
    created_count = 0
    for id, newterm in currentgo.get_terms().items():                                                                                                                                                                                
        if not oldgo.has_term(id):
            if newterm.namespace not in created:
                created[newterm.namespace] = []
            created[newterm.namespace].append({ "id": id, "name": newterm.name})
            created_count += 1
    print(str(created_count) + " terms created since last revision")

    # Merged GO Terms    
    merged = { }
    merged_list = []
    merged_count = 0
    for id, oldterm in oldgo.get_terms().items():                                                                                                                                                                                  
        if not currentgo.has_term(id):
            if oldterm.namespace not in merged:
                merged[oldterm.namespace] = []
            alts = currentgo.get_alternate_terms(id)
            if len(alts) > 0:
                merged[oldterm.namespace].append( { "current": alts[0], "previous": { "id": id, "name": oldterm.name } } )
                merged_count += 1
                merged_list.append(oldterm.id)
    print(str(merged_count) + " terms merged since last revision")
    
    # Obsoleted GO Terms
    obsoleted = { }
    obsoleted_count = 0
    new_terms = currentgo.get_terms()
    for id, oldterm in oldgo.get_terms().items():                                                                                                                                                                                  
        if id not in new_terms:
            if oldterm.namespace not in obsoleted:
                obsoleted[oldterm.namespace] = []
            if oldterm.id not in merged_list:
                obsoleted[oldterm.namespace].append({ "id": id, "name": oldterm.name})
                obsoleted_count += 1
    print(str(obsoleted_count) + " terms obsoleted since last revision")
    
    # Existing GO Terms with structural changes (is_a, part_of, has_part etc)
    relations_changes = { }
    structural_count = 0
    structural_total_count = 0
    for id, newterm in currentgo.get_terms().items():
        if oldgo.has_term(id):                                                                                                                                                                            
            oldterm = oldgo.get_term(id)
            if not newterm.structural_equals(oldterm):
                if newterm.namespace not in relations_changes:
                    relations_changes[newterm.namespace] = []
                    
                reasons = {}
                for key, reason in newterm.explain_structural_differences(oldterm).items():
                    reasons[key] = { "current" : reason['current'], "previous" : reason['previous'] }
                relations_changes[newterm.namespace].append({ "id" : id, "name": newterm.name , "changes": reasons })
                structural_count += 1
                structural_total_count += len(reasons)
    print(str(structural_count) + " terms relation changes since last revision")
    
    
    # Existing GO Terms with meta changes (synonyms, xrefs, definition, etc)
    meta_changes = { }
    meta_count = 0
    meta_total_count = 0
    for id, newterm in currentgo.get_terms().items():
        if oldgo.has_term(id):                                                                                                                                                                            
            oldterm = oldgo.get_term(id)
            if not newterm.meta_equals(oldterm):
                if newterm.namespace not in meta_changes:
                    meta_changes[newterm.namespace] = []
                    
                reasons = {}
                for key, reason in newterm.explain_meta_differences(oldterm).items():
                    reasons[key] = { "current" : reason['current'], "previous" : reason['previous'] }
                meta_changes[newterm.namespace].append({ "id" : id, "name": newterm.name , "changes": reasons })
                meta_count += 1
                meta_total_count += len(reasons)
    print(str(meta_count) + " terms meta changes since last revision")

    # Existing GO Terms with meta changes (synonyms, NO XREFS, definition, etc)
    meta_noxrefs_changes = { }
    meta_noxrefs_count = 0
    meta_noxrefs_total_count = 0
    for id, newterm in currentgo.get_terms().items():
        if oldgo.has_term(id):                                                                                                                                                                            
            oldterm = oldgo.get_term(id)
            if not newterm.meta_equals(oldterm, False):
                if newterm.namespace not in meta_noxrefs_changes:
                    meta_noxrefs_changes[newterm.namespace] = []
                    
                reasons = {}
                for key, reason in newterm.explain_meta_differences(oldterm, False).items():
                    reasons[key] = { "current" : reason['current'], "previous" : reason['previous'] }
                meta_noxrefs_changes[newterm.namespace].append({ "id" : id, "name": newterm.name , "changes": reasons })
                meta_noxrefs_count += 1                
                meta_noxrefs_total_count += len(reasons)
    print(str(meta_noxrefs_count) + " terms meta (NO XREFS) changes since last revision")
 

    release_date = currentgo.header['data-version']
    release_date = release_date[release_date.index("/") + 1:] if "/" in release_date else release_date

    last_date = oldgo.header['data-version']
    last_date = last_date[last_date.index("/") + 1:] if "/" in last_date else last_date

    print("Creating JSON report...")
    report = { }
    report["releases_compared"] = {
                "current" : { "date": release_date, "version" : currentgo.header['data-version'], "format" : currentgo.header['format-version'] },
                "previous" : { "date" : last_date, "version" : oldgo.header['data-version'], "format" : oldgo.header['format-version'] }
            }
    report["summary"] = {
        "current": {
            "release_date" : release_date,
            "valid_terms" : len(currentgo.get_terms(TermState.VALID)),
            "obsoleted_terms" : len(currentgo.get_terms(TermState.OBSOLETED)),
            "merged_terms" : len(currentgo.get_merged_terms(TermState.ANY)),
            "biological_process_terms" : len(currentgo.get_terms_in("biological_process")),
            "molecular_function_terms" : len(currentgo.get_terms_in("molecular_function")),
            "cellular_component_terms" : len(currentgo.get_terms_in("cellular_component")),
            "meta_statements" : currentgo.count_all_metas(),
            "meta_statements_exclude_xrefs" : currentgo.count_all_metas(TermState.VALID, False),
            "terms_relations" : currentgo.count_all_structurals()
        },
        "previous": {
            "release_date" : last_date,
            "valid_terms" : len(oldgo.get_terms(TermState.VALID)),
            "obsoleted_terms" : len(oldgo.get_terms(TermState.OBSOLETED)),
            "merged_terms" : len(oldgo.get_merged_terms(TermState.ANY)),
            "biological_process_terms" : len(oldgo.get_terms_in("biological_process")),
            "molecular_function_terms" : len(oldgo.get_terms_in("molecular_function")),
            "cellular_component_terms" : len(oldgo.get_terms_in("cellular_component")),
            "meta_statements" : oldgo.count_all_metas(),
            "meta_statements_exclude_xrefs" : oldgo.count_all_metas(TermState.VALID, False),
            "terms_relations" : oldgo.count_all_structurals()
        },
        "changes" : {
            "created_terms" : created_count,
            "obsoleted_terms" : obsoleted_count,
            "merged_terms" : merged_count,
            "relations_changes_by_term" : structural_count,
            "meta_changes_by_term" : meta_count,
            "meta_changes_exclude_xrefs_by_term" : meta_noxrefs_count,
            "relations_changes" : structural_total_count,
            "meta_changes" : meta_total_count,
            "meta_changes_exclude_xrefs" : meta_noxrefs_total_count
        }
    }
    report["detailed_changes"] = {
        "created_terms" : created,
        "obsoleted_terms" : obsoleted,
        "merged_terms" : merged,
        "relations_changes" : relations_changes,
        "meta_changes" : meta_changes,
        "meta_changes_exclude_xrefs" : meta_noxrefs_changes
    }

    print("JSON report created.")

    return report


def flattern(A):
    rt = []
    for i in A:
        if isinstance(i,list): rt.extend(flattern(i))
        else: rt.append(i)
    return rt

# def save_changes(new_obo_url, old_obo_url):

#     # The new published OBO archive
#     print("Loading current GO ontology (" + new_obo_url + ")...")
#     newgo = OBO_Parser(requests.get(new_obo_url).text)

#     # A previously published OBO archive
#     print("Loading previous GO ontology (" + old_obo_url + ")...")
#     oldgo = OBO_Parser(requests.get(old_obo_url).text)
    
    
#     # New GO Terms
#     created = { }
#     created_count = 0
#     for id, newterm in newgo.get_terms().items():                                                                                                                                                                                
#         if not oldgo.has_term(id):
#             if newterm.namespace not in created:
#                 created[newterm.namespace] = []
#             created[newterm.namespace].append({ "id": id, "name": newterm.name})
#             created_count += 1
#     print(str(created_count) + " terms created since last revision")

#     # Merged GO Terms    
#     merged = { }
#     merged_list = []
#     merged_count = 0
#     for id, oldterm in oldgo.get_terms().items():                                                                                                                                                                                  
#         if not newgo.has_term(id):
#             if oldterm.namespace not in merged:
#                 merged[oldterm.namespace] = []
#             alts = newgo.get_alternate_terms(id)
#             if len(alts) > 0:
#                 merged[oldterm.namespace].append( { "current": alts[0], "previous": { "id": id, "name": oldterm.name } } )
#                 merged_count += 1
#                 merged_list.append(oldterm.id)
#     print(str(merged_count) + " terms merged since last revision")
    
#     # Obsoleted GO Terms
#     obsoleted = { }
#     obsoleted_count = 0
#     new_terms = newgo.get_terms()
#     for id, oldterm in oldgo.get_terms().items():                                                                                                                                                                                  
#         if id not in new_terms:
#             if oldterm.namespace not in obsoleted:
#                 obsoleted[oldterm.namespace] = []
#             if oldterm.id not in merged_list:
#                 obsoleted[oldterm.namespace].append({ "id": id, "name": oldterm.name})
#                 obsoleted_count += 1
#     print(str(obsoleted_count) + " terms obsoleted since last revision")
    
#     # Existing GO Terms with structural changes (is_a, part_of, has_part etc)
#     relations_changes = { }
#     structural_count = 0
#     structural_total_count = 0
#     for id, newterm in newgo.get_terms().items():
#         if oldgo.has_term(id):                                                                                                                                                                            
#             oldterm = oldgo.get_term(id)
#             if not newterm.structural_equals(oldterm):
#                 if newterm.namespace not in relations_changes:
#                     relations_changes[newterm.namespace] = []
                    
#                 reasons = {}
#                 for key, reason in newterm.explain_structural_differences(oldterm).items():
#                     reasons[key] = { "current" : reason['current'], "previous" : reason['previous'] }
#                 relations_changes[newterm.namespace].append({ "id" : id, "name": newterm.name , "changes": reasons })
#                 structural_count += 1
#                 structural_total_count += len(reasons)
#     print(str(structural_count) + " terms structural changes since last revision")
    
    
#     # Existing GO Terms with meta changes (synonyms, xrefs, definition, etc)
#     meta_changes = { }
#     meta_count = 0
#     meta_total_count = 0
#     for id, newterm in newgo.get_terms().items():
#         if oldgo.has_term(id):                                                                                                                                                                            
#             oldterm = oldgo.get_term(id)
#             if not newterm.meta_equals(oldterm):
#                 if newterm.namespace not in meta_changes:
#                     meta_changes[newterm.namespace] = []
                    
#                 reasons = {}
#                 for key, reason in newterm.explain_meta_differences(oldterm).items():
#                     reasons[key] = { "current" : reason['current'], "previous" : reason['previous'] }
#                 meta_changes[newterm.namespace].append({ "id" : id, "name": newterm.name , "changes": reasons })
#                 meta_count += 1
#                 meta_total_count += len(reasons)
#     print(str(meta_count) + " terms meta changes since last revision")

#     # Existing GO Terms with meta changes (synonyms, NO XREFS, definition, etc)
#     meta_noxrefs_changes = { }
#     meta_noxrefs_count = 0
#     meta_noxrefs_total_count = 0
#     for id, newterm in newgo.get_terms().items():
#         if oldgo.has_term(id):                                                                                                                                                                            
#             oldterm = oldgo.get_term(id)
#             if not newterm.meta_equals(oldterm, False):
#                 if newterm.namespace not in meta_noxrefs_changes:
#                     meta_noxrefs_changes[newterm.namespace] = []
                    
#                 reasons = {}
#                 for key, reason in newterm.explain_meta_differences(oldterm, False).items():
#                     reasons[key] = { "current" : reason['current'], "previous" : reason['previous'] }
#                 meta_noxrefs_changes[newterm.namespace].append({ "id" : id, "name": newterm.name , "changes": reasons })
#                 meta_noxrefs_count += 1                
#                 meta_noxrefs_total_count += len(reasons)
#     print(str(meta_noxrefs_count) + " terms meta (NO XREFS) changes since last revision")
 
#     report = { }
#     report["releases"] = {
#                 "current" : { "date": release_date, "version" : newgo.header['data-version'], "format" : newgo.header['format-version'] },
#                 "previous" : { "date" : last_date, "version" : oldgo.header['data-version'], "format" : oldgo.header['format-version'] }
#             }
#     report["summary"] = {
#         "current": {
#             "release_date" : report["releases"]["current"]["version"],
#             "valid_terms" : len(newgo.get_terms(TermState.VALID)),
#             "obsoleted_terms" : len(newgo.get_terms(TermState.OBSOLETED)),
#             "merged_terms" : len(newgo.get_merged_terms(TermState.ANY)),
#             "biological_processes" : len(newgo.get_terms_in("biological_process")),
#             "molecular_functions" : len(newgo.get_terms_in("molecular_function")),
#             "cellular_components" : len(newgo.get_terms_in("cellular_component")),
#             "meta_statements" : newgo.count_all_metas(),
#             "meta_noxrefs_statements" : newgo.count_all_metas(TermState.VALID, False),
#             "structural_statements" : newgo.count_all_structurals()
#         },
#         "previous": {
#             "release_date" : report["releases"]["previous"]["version"],
#             "valid_terms" : len(oldgo.get_terms(TermState.VALID)),
#             "obsoleted_terms" : len(oldgo.get_terms(TermState.OBSOLETED)),
#             "merged_terms" : len(oldgo.get_merged_terms(TermState.ANY)),
#             "biological_processes" : len(oldgo.get_terms_in("biological_process")),
#             "molecular_functions" : len(oldgo.get_terms_in("molecular_function")),
#             "cellular_components" : len(oldgo.get_terms_in("cellular_component")),
#             "meta_statements" : oldgo.count_all_metas(),
#             "meta_noxrefs_statements" : oldgo.count_all_metas(TermState.VALID, False),
#             "structural_statements" : oldgo.count_all_structurals()
#         },
#         "created_terms" : created_count,
#         "obsoleted_terms" : obsoleted_count,
#         "merged_terms" : merged_count,
#         "relations_changes_by_term" : structural_count,
#         "meta_changes_by_term" : meta_count,
#         "terms_meta_noxrefs_changes" : meta_noxrefs_count,
#         "relations_changes" : structural_total_count,
#         "meta_changes" : meta_total_count,
#         "total_meta_noxrefs_changes" : meta_noxrefs_total_count
#     }
#     report["created_terms"] = created
#     report["obsoleted_terms"] = obsoleted
#     report["merged_terms"] = merged
#     report["relations_changes"] = relations_changes
#     report["meta_changes"] = meta_changes
#     report["meta_noxrefs_changes"] = meta_noxrefs_changes
    
#     # TO READD    
#     store_json("go-last-changes.json", report)
#     store_json("go-last-changes-summary.json", report["summary"])
#     store_json("archive/" + release_date + "_go-last-changes.json", report)
#     store_json("archive/" + release_date + "_go-last-changes-summary.json", report["summary"])

    

 
#     # Creating TSV version of the JSON report
#     txtreport = "CHANGES IN GO ONTOLOGY BETWEEN\ncurrent\t" + report["releases"]["current"]["version"] + " (" + release_date + ")\nprevious\t" + report["releases"]["previous"]["version"] + " (" + last_date + ")\n"

#     txtreport += "\nSUMMARY\n"
#     txtreport += "current_valid_terms\t" + str(report["summary"]["current"]["valid_terms"]) + "\n"
#     txtreport += "current_obsoleted_terms\t" + str(report["summary"]["current"]["obsoleted_terms"]) + "\n"
#     txtreport += "current_merged_terms\t" + str(report["summary"]["current"]["merged_terms"]) + "\n"
#     txtreport += "current_biological_processes\t" + str(report["summary"]["current"]["biological_processes"]) + "\n"
#     txtreport += "current_molecular_functions\t" + str(report["summary"]["current"]["molecular_functions"]) + "\n"
#     txtreport += "current_cellular_components\t" + str(report["summary"]["current"]["cellular_components"]) + "\n"
#     txtreport += "current_meta_statements\t" + str(report["summary"]["current"]["meta_statements"]) + "\n"
#     txtreport += "current_meta_noxrefs_statements\t" + str(report["summary"]["current"]["meta_noxrefs_statements"]) + "\n"
#     txtreport += "current_structural_statements\t" + str(report["summary"]["current"]["structural_statements"]) + "\n"

#     txtreport += "previous_valid_terms\t" + str(report["summary"]["previous"]["valid_terms"]) + "\n"
#     txtreport += "previous_obsoleted_terms\t" + str(report["summary"]["previous"]["obsoleted_terms"]) + "\n"
#     txtreport += "previous_merged_terms\t" + str(report["summary"]["previous"]["merged_terms"]) + "\n"
#     txtreport += "previous_biological_processes\t" + str(report["summary"]["previous"]["biological_processes"]) + "\n"
#     txtreport += "previous_molecular_functions\t" + str(report["summary"]["previous"]["molecular_functions"]) + "\n"
#     txtreport += "previous_cellular_components\t" + str(report["summary"]["previous"]["cellular_components"]) + "\n"
#     txtreport += "previous_meta_statements\t" + str(report["summary"]["previous"]["meta_statements"]) + "\n"
#     txtreport += "previous_meta_noxrefs_statements\t" + str(report["summary"]["previous"]["meta_noxrefs_statements"]) + "\n"
#     txtreport += "previous_structural_statements\t" + str(report["summary"]["previous"]["structural_statements"]) + "\n"

#     txtreport += "created_terms\t" + str(report["summary"]["created_terms"]) + "\n"
#     txtreport += "obsoleted_terms\t" + str(report["summary"]["obsoleted_terms"]) + "\n"
#     txtreport += "merged_terms\t" + str(report["summary"]["merged_terms"]) + "\n"
#     txtreport += "relations_changes_by_term\t" + str(report["summary"]["relations_changes_by_term"]) + "\n"
#     txtreport += "meta_changes_by_term\t" + str(report["summary"]["meta_changes_by_term"]) + "\n"
#     txtreport += "terms_meta_noxrefs_changes\t" + str(report["summary"]["terms_meta_noxrefs_changes"]) + "\n"
#     txtreport += "relations_changes\t" + str(report["summary"]["relations_changes"]) + "\n"
#     txtreport += "meta_changes\t" + str(report["summary"]["meta_changes"]) + "\n"
#     txtreport += "total_meta_noxrefs_changes\t" + str(report["summary"]["total_meta_noxrefs_changes"]) + "\n"

#     txtreport += "\nTERMS CREATED\t" + str(created_count) + "\n"
#     for aspect in report["created_terms"]:
#         for term in report["created_terms"][aspect]:
#             txtreport += aspect + "\t" + term["id"] + "\t" + term["name"] + "\n"
                    
#     txtreport += "\nTERMS OBSOLETED\t" + str(obsoleted_count) + "\n"
#     for aspect in report["obsoleted_terms"]:
#         for term in report["obsoleted_terms"][aspect]:
#             txtreport += aspect + "\t" + term["id"] + "\t" + term["name"] + "\n"

#     txtreport += "\nTERMS MERGED\t" + str(merged_count) + "\n"
#     for aspect in report["merged_terms"]:
#         for term in report["merged_terms"][aspect]:
#             txtreport += aspect + "\t" + term["current"]["id"] + "\t" + term["current"]["name"] + "\t" + term["previous"]["id"] + "\t" + term["previous"]["name"] + "\n"

#     txtreport += "\nTERMS STRUCTURAL CHANGES\t" + str(structural_count) + "\n"
#     for aspect in report["relations_changes"]:
#         for term in report["relations_changes"][aspect]:
#             txtreport += aspect + "\t" + term["id"] + "\t" + term["name"]
#             for change in term["changes"]:
#                 curr = term["changes"][change]["current"]
#                 if not isinstance(curr, str):
#                     curr = ", ".join(map(str, curr))
                
#                 prev = term["changes"][change]["previous"]
#                 if not isinstance(prev, str):
#                     prev = ", ".join(map(str, prev))
#                 txtreport += "\t" + change + " (current: " + curr + " previous: " + prev + ")"
#             txtreport += "\n"
        
#     txtreport += "\nTERMS META CHANGES\t" + str(meta_count) + "\n"
#     for aspect in report["meta_changes"]:
#         for term in report["meta_changes"][aspect]:
#             txtreport += aspect + "\t" + term["id"] + "\t" + term["name"]
#             for change in term["changes"]:
#                 curr = term["changes"][change]["current"]
#                 if not isinstance(curr, str):
#                     curr = ", ".join(map(str, curr))
                
#                 prev = term["changes"][change]["previous"]
#                 if not isinstance(prev, str):
#                     prev = ", ".join(map(str, prev))
#                 txtreport += "\t" + change + " (current: " + curr + " previous: " + prev + ")"
#             txtreport += "\n"

#     txtreport += "\nTERMS META CHANGES (NO XREFS)\t" + str(meta_noxrefs_count) + "\n"
#     for aspect in report["meta_noxrefs_changes"]:
#         for term in report["meta_noxrefs_changes"][aspect]:
#             txtreport += aspect + "\t" + term["id"] + "\t" + term["name"]
#             for change in term["changes"]:
#                 curr = term["changes"][change]["current"]
#                 if not isinstance(curr, str):
#                     curr = ", ".join(map(str, curr))
                
#                 prev = term["changes"][change]["previous"]
#                 if not isinstance(prev, str):
#                     prev = ", ".join(map(str, prev))
#                 txtreport += "\t" + change + " (current: " + curr + " previous: " + prev + ")"
#             txtreport += "\n"
            
#     store_text("go-last-changes.tsv", txtreport)
#     store_text("archive/" + release_date + "_go-last-changes.tsv", txtreport)



def create_text_report(json_changes):
    text_report = ""

    text_report = "CHANGES IN GO ONTOLOGY"
    
    text_report += "\n\nRELEASES COMPARED"
    text_report += "\ncurrent_release_date\t" + json_changes["releases_compared"]["current"]["date"]    
    text_report += "\nprevious_release_date\t" + json_changes["releases_compared"]["previous"]["date"]

    text_report += "\n\nSUMMARY: CURRENT RELEASE"
    for key, val in json_changes["summary"]["current"].items():
        if "release_date" != key:
            text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nSUMMARY: PREVIOUS RELEASE"
    for key, val in json_changes["summary"]["previous"].items():
        if "release_date" != key:
            text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nSUMMARY: DIFF BETWEEN RELEASES"
    for key, val in json_changes["summary"]["changes"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nDETAILED CHANGES"

    text_report += "\n\n" + count(json_changes["detailed_changes"]["created_terms"]) + " CREATED TERMS"
    for key, val in json_changes["detailed_changes"]["created_terms"].items():
        for item in val:
            text_report += "\n" + key + "\t" + item["id"] + "\t" + item["name"]

    text_report += "\n\n" + count(json_changes["detailed_changes"]["obsoleted_terms"]) + " OBSOLETED TERMS"
    for key, val in json_changes["detailed_changes"]["obsoleted_terms"].items():
        for item in val:
            text_report += "\n" + key + "\t" + item["id"] + "\t" + item["name"]

    text_report += "\n\n" + count(json_changes["detailed_changes"]["merged_terms"]) + " MERGED TERMS"
    for key, val in json_changes["detailed_changes"]["merged_terms"].items():
        for item in val:
            text_report += "\n" + key + "\t" + item["current"]["id"] + "\t" + item["current"]["name"] + "\tWAS\t" + "\t" + item["previous"]["id"] + "\t" + item["previous"]["name"]

    text_report += "\n\n" + count(json_changes["detailed_changes"]["relations_changes"]) + " RELATION CHANGES"
    for key, val in json_changes["detailed_changes"]["relations_changes"].items():
        for item in val:
            text_report += "\n" + key + "\t" + item["id"] + "\t" + item["name"]
            data = item["changes"]
            for field in data:
                text_report += "\n\t" + field + "\t" + format(data[field]["current"]) + "\tWAS\t" +format(data[field]["previous"])

    text_report += "\n\n" + count(json_changes["detailed_changes"]["meta_changes_exclude_xrefs"]) + " META CHANGES EXCLUDING XREFS"
    for key, val in json_changes["detailed_changes"]["meta_changes_exclude_xrefs"].items():
        for item in val:
            text_report += "\n" + key + "\t" + item["id"] + "\t" + item["name"]
            data = item["changes"]
            for field in data:
                text_report += "\n\t" + field + "\t" + format(data[field]["current"]) + "\tWAS\t" +format(data[field]["previous"])

    text_report += "\n\n" + count(json_changes["detailed_changes"]["meta_changes"]) + " META CHANGES"
    for key, val in json_changes["detailed_changes"]["meta_changes"].items():
        for item in val:
            text_report += "\n" + key + "\t" + item["id"] + "\t" + item["name"]
            data = item["changes"]
            for field in data:
                text_report += "\n\t" + field + "\t" + format(data[field]["current"]) + "\tWAS\t" +format(data[field]["previous"])

    return text_report

def format(item):
    if type(item) == str:
        return item.strip()
    if type(item) == list:
        return ";".join(item)
    return item

def count(map):
    count = 0
    for key in map:
        count += len(map[key])
    return str(count)



def write_json(key, content):
    with open(key, 'w') as outfile:
        json.dump(content, outfile, indent=2)
 
def write_text(key, content):
    with open(key, 'w') as outfile:
        outfile.write(content)



def print_help():
    print('\nUsage: python go_ontology_changes.py -c <current_obo_url> -p <previous_obo_url> -o <output_rep>\n')


def main(argv):
    current_obo_url = ''
    previous_obo_url = ''
    output_rep = ''

    if len(argv) < 6:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"c:p:o:",["cobo=","pobo=","orep="])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)

    for opt, arg in opts:
        if opt == '-h':
            print_help()
            sys.exit()
        elif opt in ("-c", "--cobo"):
            current_obo_url = arg
        elif opt in ("-p", "--pobo"):
            previous_obo_url = arg
        elif opt in ("-o", "-orep"):
            output_rep = arg
        
    if not output_rep.endswith("/"):
        output_rep += "/"

    if not os.path.exists(output_rep):
        os.mkdir(output_rep)

    output_json =  output_rep + "go-ontology-changes.json"
    output_stats_json = output_rep + "go-ontology-stats.json"
    output_tsv =  output_rep + "go-ontology-changes.tsv"

    print("Will write ontology changes to " + output_json + " and " + output_tsv)

    json_changes = compute_changes(current_obo_url, previous_obo_url)

    print("Saving Stats to <" + output_json + "> ...")    
    write_json(output_json, json_changes)
    write_json(output_stats_json, json_changes["summary"]["current"])
    print("Done.")

    print("Saving Stats to <" + output_tsv + "> ...")    
    tsv_changes = create_text_report(json_changes)
    write_text(output_tsv, tsv_changes)
    print("Done.")
    


if __name__ == "__main__":
   main(sys.argv[1:])