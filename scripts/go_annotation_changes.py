import sys, getopt, os

import requests
import json



def compute_changes(current_stats, previous_stats):
    stats_changes = {
        "release_compared": {
            "current" : current_stats['release_date'],
            "previous" : previous_stats['release_date']            
        }
    }

    for key, val in current_stats.items():
        if "release_date" in key:
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
            previous_value = previous_json[key] if key in previous_json else 0
            # if current_json[key] != previous_value:
            changes[key] = current_json[key] - previous_value
        elif tp == dict:
            changes[key] = nested_changes(current_json[key], previous_json[key])

    missing = missing_fields(current_json, previous_json)
    for key, val in missing.items():
        changes[key] = val

    return changes

def missing_fields(current_json, previous_json):
    missing = { }
    for key, val in previous_json.items():
        if key in current_json:
            continue

        tp = type(val)
        if tp == str:
            continue
        elif tp == int or tp == float:
            missing[key] = - val
            print("added missing (" , key , " , " , val , ")")
        elif tp == dict:
            missing[key] = missing_fields(current_json[key], previous_json[key])
            
    return missing

def create_text_report(json_changes):
    text_report = ""

    text_report = "CHANGES IN GENE ONTOLOGY STATISTICS"
    text_report += "\ncurrent_release_date\t" + json_changes["release_compared"]["current"]    
    text_report += "\nprevious_release_date\t" + json_changes["release_compared"]["previous"]

    text_report += "\n\nCHANGES IN TERMS\n"
    text_report += "total\t" + str(json_changes["terms"]["total"]) + "\nobsoleted\t" + str(json_changes["terms"]["obsoleted"]) + "\nvalid total\t" + str(json_changes["terms"]["valid"])
    text_report += "\nvalid P\t" + str(json_changes["terms"]["by_aspect"]["P"]) + "\nvalid F\t" + str(json_changes["terms"]["by_aspect"]["F"]) + "\nvalid C\t" + str(json_changes["terms"]["by_aspect"]["C"])


    text_report += "\n\nCHANGES IN BIOENTITIES\n"
    text_report += "total\t" + str(json_changes["annotations"]["bioentities"]["total"])

    text_report += "\n\nCHANGES IN BIOENTITIES BY TYPE (CLUSTER)"
    for key, val in json_changes["annotations"]["bioentities"]["by_type"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nCHANGES IN BIOENTITIES BY TYPE (ALL)"
    for key, val in json_changes["annotations"]["bioentities"]["by_type"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nCHANGES IN BIOENTITIES BY FILTERED TAXON AND BY TYPE (CLUSTER)"
    text_report += "\ntaxon"
    for type, nb in json_changes["annotations"]["bioentities"]["by_type"]["cluster"].items():
        text_report += "\t" + type
    for key, val in json_changes["annotations"]["bioentities"]["by_taxon"]["cluster"].items():
        text_report += "\n" + key
        for type, nb in json_changes["annotations"]["bioentities"]["by_type"]["cluster"].items():
            text_report += "\t" + str(val[type]["A"]) if type in val else "\t0"

    text_report += "\n\nCHANGES IN BIOENTITIES BY FILTERED TAXON AND BY TYPE (ALL)"
    text_report += "\ntaxon"
    for type, nb in json_changes["annotations"]["bioentities"]["by_type"]["all"].items():
        text_report += "\t" + type
    for key, val in json_changes["annotations"]["bioentities"]["by_taxon"]["all"].items():
        text_report += "\n" + key
        for type, nb in json_changes["annotations"]["bioentities"]["by_type"]["all"].items():
            text_report += "\t" + str(val[type]["A"]) if type in val else "\t0"


    text_report += "\n\nCHANGES IN TAXONS\n"
    text_report += "total\t" + str(json_changes["annotations"]["taxons"]["total"])
    text_report += "\nfiltered\t" + str(json_changes["annotations"]["taxons"]["filtered"])


    text_report += "\n\nCHANGES IN ANNOTATIONS\n"
    text_report += "total\t" + str(json_changes["annotations"]["total"])
    for key, val in json_changes["annotations"]["by_aspect"].items():
        text_report += "\n" + key + "\t" + str(val)
        
    text_report += "\n\nCHANGES IN ANNOTATIONS BY BIOENTITY TYPE (CLUSTER)"
    for key, val in json_changes["annotations"]["by_bioentity_type"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY BIOENTITY TYPE (ALL)"
    for key, val in json_changes["annotations"]["by_bioentity_type"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY EVIDENCE (CLUSTER)"
    for key, val in json_changes["annotations"]["by_evidence"]["cluster"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY EVIDENCE (ALL)"
    for key, val in json_changes["annotations"]["by_evidence"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY GROUP"
    for key, val in json_changes["annotations"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY TAXON"
    for key, val in json_changes["annotations"]["by_taxon"].items():
        text_report += "\n" + key + "\t" + str(val)


    text_report += "\n\nCHANGES IN REFERENCES AND PMIDS\n"
    text_report += "total\t" + str(json_changes["annotations"]["references"]["total"])
    text_report += "\t" + str(json_changes["annotations"]["pmids"]["total"])
 
    text_report += "\n\nCHANGES IN REFERENCES AND PMIDS BY GROUP"
    text_report += "\ngroup\treferences\tpmids"
    for key, val in json_changes["annotations"]["references"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(json_changes["annotations"]["pmids"]["by_group"][key])

    text_report += "\n\nCHANGES IN REFERENCES AND PMIDS BY TAXON"
    text_report += "\ntaxon\treferences\tpmids"
    for key, val in json_changes["annotations"]["references"]["by_taxon"].items():
        pmid_val = json_changes["annotations"]["pmids"]["by_taxon"][key] if key in json_changes["annotations"]["pmids"]["by_taxon"] else 0
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(pmid_val)

    return text_report


def write_json(key, content):
    with open(key, 'w') as outfile:
        json.dump(content, outfile, indent=2)
 
def write_text(key, content):
    with open(key, 'w') as outfile:
        outfile.write(content)


def print_help():
    print('Usage: python go_annotation_changes.py -c <current_stats_url> -p <previous_stats_url> -o <output_rep>\n')


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