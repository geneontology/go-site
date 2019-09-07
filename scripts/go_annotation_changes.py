import sys, getopt, os

import requests
import json



def compute_changes(current_stats, previous_stats):
    stats_changes = {
        "releases_compared": {
            "current" : current_stats['release_date'],
            "previous" : previous_stats['release_date']            
        }
    }

    for key, val in current_stats.items():
        if "release_date" in key:
            continue
        if "terms" in key:
            continue
        stats_changes[key] = nested_changes(current_stats[key], previous_stats[key])

    return stats_changes


def nested_changes(current_json, previous_json):
    """
    Compute nested changes of numbers (ignore string).
    Assume both json have the exact same structure
    """

    changes = { }

    for key, val in current_json.items():
        tp = type(val)
        if tp == str:
            continue
        elif tp == int or tp == float:
            previous_value = previous_json[key] if previous_json is not None and key in previous_json else 0
            # if current_json[key] != previous_value:
            changes[key] = current_json[key] - previous_value
        elif tp == dict:
            previous_value = previous_json[key] if previous_json is not None and key in previous_json else { }
            changes[key] = nested_changes(current_json[key], previous_value)

    missing = missing_fields(current_json, previous_json)
    for key, val in missing.items():
        changes[key] = val

    return changes

def missing_fields(current_json, previous_json):
    """ 
    Adding fields that were in previous but are not in current stats
    """
    missing = { }
    for key, val in previous_json.items():
        if current_json is not None and key in current_json:
            continue

        tp = type(val)
        if tp == str:
            continue
        elif tp == int or tp == float:
            missing[key] = - val
        elif tp == dict:
            missing[key] = missing_fields(None, previous_json[key])
            
    return missing

def create_text_report(json_changes):
    text_report = ""

    text_report = "CHANGES IN GO ANNOTATIONS"
    text_report += "\ncurrent_release_date\t" + json_changes["releases_compared"]["current"]    
    text_report += "\nprevious_release_date\t" + json_changes["releases_compared"]["previous"]

    # text_report += "\n\nCHANGES IN TERMS\n"
    # text_report += "total\t" + str(json_changes["terms"]["total"]) + "\nobsoleted\t" + str(json_changes["terms"]["obsoleted"]) + "\nvalid total\t" + str(json_changes["terms"]["valid"])
    # text_report += "\nvalid P\t" + str(json_changes["terms"]["by_aspect"]["P"]) + "\nvalid F\t" + str(json_changes["terms"]["by_aspect"]["F"]) + "\nvalid C\t" + str(json_changes["terms"]["by_aspect"]["C"])

    text_report += "\n\nSUMMARY: CURRENT_RELEASE (" + json_changes["releases_compared"]["current"] + ")"
    text_report += "\nannotated bioentities:\t" + str(json_changes["summary"]["current"]["bioentities"])
    text_report += "\nannotated taxa:\t" + str(json_changes["summary"]["current"]["taxa"]) + "\t" + str(json_changes["summary"]["current"]["taxa_filtered"]) + " (with more than 1000 annotations)"
    text_report += "\nannotations:\t" + str(json_changes["summary"]["current"]["annotations"]["total"])
    for key, val in json_changes["summary"]["current"]["annotations"]["by_aspect"].items():
        text_report += "\nannotations by aspect " + key + ":\t" + str(val)
    for key, val in json_changes["summary"]["current"]["annotations"]["by_evidence_cluster"].items():
        text_report += "\nannotations by evidence cluster " + key + ":\t" + str(val)

    text_report += "\n\nSUMMARY: PREVIOUS (" + json_changes["releases_compared"]["previous"] + ")"
    text_report += "\nannotated bioentities:\t" + str(json_changes["summary"]["previous"]["bioentities"])
    text_report += "\nannotated taxa:\t" + str(json_changes["summary"]["previous"]["taxa"]) + "\t" + str(json_changes["summary"]["previous"]["taxa_filtered"]) + " (with more than 1000 annotations)"
    text_report += "\nannotations:\t" + str(json_changes["summary"]["previous"]["annotations"]["total"])
    for key, val in json_changes["summary"]["previous"]["annotations"]["by_aspect"].items():
        text_report += "\nannotations by aspect " + key + ":\t" + str(val)
    for key, val in json_changes["summary"]["previous"]["annotations"]["by_evidence_cluster"].items():
        text_report += "\nannotations by evidence cluster " + key + ":\t" + str(val)

    text_report += "\n\nSUMMARY: DIFF BETWEEN RELEASES"
    text_report += "\nannotated bioentities:\t" + str(json_changes["summary"]["current"]["bioentities"] - json_changes["summary"]["previous"]["bioentities"])
    text_report += "\nannotated taxa:\t" + str(json_changes["summary"]["current"]["taxa"] - json_changes["summary"]["previous"]["taxa"]) + "\t" + str(json_changes["summary"]["current"]["taxa_filtered"] - json_changes["summary"]["previous"]["taxa_filtered"]) + " (with more than 1000 annotations)"
    text_report += "\nannotations:\t" + str(json_changes["summary"]["current"]["annotations"]["total"] - json_changes["summary"]["previous"]["annotations"]["total"])
    for key, val in json_changes["summary"]["current"]["annotations"]["by_aspect"].items():
        text_report += "\nannotations by aspect " + key + ":\t" + str(val - json_changes["summary"]["previous"]["annotations"]["by_aspect"][key])
    # for key, val in json_changes["summary"]["current"]["annotations"]["by_evidence_cluster"].items():
    #     text_report += "\nannotations by evidence cluster " + key + ":\t" + str(val - json_changes["summary"]["current"]["annotations"]["by_evidence_cluster"][key])
    for key, val in json_changes["summary"]["changes"]["annotations"]["by_evidence_cluster"].items():
        text_report += "\nannotations by evidence cluster " + key + ":\t" + str(json_changes["summary"]["changes"]["annotations"]["by_evidence_cluster"][key])

    text_report += "\n\nDETAILED CHANGES"

    text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES\n"
    text_report += "total\t" + str(json_changes["detailed_changes"]["bioentities"]["total"])

    text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES BY TYPE (CLUSTER)"
    for key, val in json_changes["detailed_changes"]["bioentities"]["by_type"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES BY TYPE (ALL)"
    for key, val in json_changes["detailed_changes"]["bioentities"]["by_type"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES BY FILTERED TAXON AND BY TYPE (CLUSTER)"
    text_report += "\ntaxon"
    for type, nb in json_changes["detailed_changes"]["bioentities"]["by_type"]["cluster"].items():
        text_report += "\t" + type
    for key, val in json_changes["detailed_changes"]["bioentities"]["by_taxon"]["cluster"].items():
        text_report += "\n" + key
        for type, nb in json_changes["detailed_changes"]["bioentities"]["by_type"]["cluster"].items():
            text_report += "\t" + str(val[type]["A"]) if type in val else "\t0"

    text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES BY FILTERED TAXON AND BY TYPE (ALL)"
    text_report += "\ntaxon"
    for type, nb in json_changes["detailed_changes"]["bioentities"]["by_type"]["all"].items():
        text_report += "\t" + type
    for key, val in json_changes["detailed_changes"]["bioentities"]["by_taxon"]["all"].items():
        text_report += "\n" + key
        for type, nb in json_changes["detailed_changes"]["bioentities"]["by_type"]["all"].items():
            text_report += "\t" + str(val[type]["A"]) if type in val else "\t0"


    text_report += "\n\nCHANGES IN ANNOTATED TAXA\n"
    text_report += "total\t" + str(json_changes["detailed_changes"]["taxa"]["total"])
    text_report += "\nfiltered\t" + str(json_changes["detailed_changes"]["taxa"]["filtered"]) + " (with more than 1000 annotations)"


    text_report += "\n\nCHANGES IN ANNOTATIONS\n"
    text_report += "total\t" + str(json_changes["detailed_changes"]["total"])
    for key, val in json_changes["detailed_changes"]["by_aspect"].items():
        text_report += "\n" + key + "\t" + str(val)
        
    text_report += "\n\nCHANGES IN ANNOTATIONS BY BIOENTITY TYPE (CLUSTER)"
    for key, val in json_changes["detailed_changes"]["by_bioentity_type"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY BIOENTITY TYPE (ALL)"
    for key, val in json_changes["detailed_changes"]["by_bioentity_type"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY EVIDENCE (CLUSTER)"
    for key, val in json_changes["detailed_changes"]["by_evidence"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY EVIDENCE (ALL)"
    for key, val in json_changes["detailed_changes"]["by_evidence"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY GROUP"
    for key, val in json_changes["detailed_changes"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY TAXON"
    for key, val in json_changes["detailed_changes"]["by_taxon"].items():
        text_report += "\n" + key + "\t" + str(val)


    text_report += "\n\nCHANGES IN REFERENCES AND PMIDS\n"
    text_report += "total\t" + str(json_changes["detailed_changes"]["references"]["all"]["total"])
    text_report += "\t" + str(json_changes["detailed_changes"]["references"]["pmids"]["total"])
 
    text_report += "\n\nCHANGES IN REFERENCES AND PMIDS BY GROUP"
    text_report += "\ngroup\treferences\tpmids"
    for key, val in json_changes["detailed_changes"]["references"]["all"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(json_changes["detailed_changes"]["references"]["pmids"]["by_group"][key])

    text_report += "\n\nCHANGES IN REFERENCES AND PMIDS BY TAXON"
    text_report += "\ntaxon\treferences\tpmids"
    for key, val in json_changes["detailed_changes"]["references"]["all"]["by_taxon"].items():
        pmid_val = json_changes["detailed_changes"]["references"]["pmids"]["by_taxon"][key] if key in json_changes["detailed_changes"]["references"]["pmids"]["by_taxon"] else 0
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(pmid_val)

    return text_report


def write_json(key, content):
    with open(key, 'w') as outfile:
        json.dump(content, outfile, indent=2)
 
def write_text(key, content):
    with open(key, 'w') as outfile:
        outfile.write(content)


def print_help():
    print('\nUsage: python go_annotation_changes.py -c <current_stats_url> -p <previous_stats_url> -o <output_rep>\n')


def main(argv):
    current_stats_url = ''
    previous_stats_url = ''
    output_rep = ''

    if len(argv) < 3:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"c:p:o:",["current=","previous=","orep="])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)

    for opt, arg in opts:
        if opt == '-h':
            print_help()
            sys.exit()
        elif opt in ("-c", "--current"):
            current_stats_url = arg
        elif opt in ("-p", "--previous"):
            previous_stats_url = arg
        elif opt in ("-o", "-orep"):
            output_rep = arg
        
    if not output_rep.endswith("/"):
        output_rep += "/"

    if not os.path.exists(output_rep):
        os.mkdir(output_rep)

    output_json =  output_rep + "go-stats-changes.json"
    output_tsv =  output_rep + "go-stats-changes.tsv"

    print("Will write stats changes to " + output_json + " and " + output_tsv)


    current_stats = requests.get(current_stats_url).json()
    previous_stats = requests.get(previous_stats_url).json()
    json_changes = compute_changes(current_stats, previous_stats)

    print("Saving Stats to <" + output_json + "> ...")    
    write_json(output_json, json_changes)
    print("Done.")

    print("Saving Stats to <" + output_tsv + "> ...")    
    tsv_changes = create_text_report(json_changes)
    write_text(output_tsv, tsv_changes)
    print("Done.")
    


if __name__ == "__main__":
   main(sys.argv[1:])