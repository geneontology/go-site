from obo_parser import OBO_Parser, TermState
import sys, getopt, os

import requests
import json

go_pipeline_release_url = "http://current.geneontology.org/metadata/release-date.json"
go_obo_url = "http://purl.obolibrary.org/obo/go.obo"

release_date = "N/A"
last_obo = None
last_date = None


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