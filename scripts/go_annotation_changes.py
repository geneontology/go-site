import sys, getopt, os

import json

import go_stats_utils as utils


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


def alter_annotation_changes(current_stats, previous_stats, current_references, previous_references, json_annot_changes):
    addrem_species = utils.added_removed_species(current_stats, previous_stats)

    altered_json_annot_changes = {
        # "releases_compared" : {
        #     "current" : current_stats["release_date"],
        #     "previous" : previous_stats["release_date"]
        # },
        "summary" : {
            "current" : {
                "release_date" : current_stats["release_date"],
                "annotations" : {
                    "total" : current_stats["annotations"]["total"],
                    "by_aspect" : current_stats["annotations"]["by_aspect"],
                    "by_evidence_cluster" : current_stats["annotations"]["by_evidence"]["cluster"],
                    "by_qualifier" : current_stats["annotations"]["by_qualifier"]
                },
                "bioentities" : current_stats["bioentities"]["total"],
                "taxa" : current_stats["taxa"]["total"],
                "taxa_filtered" : current_stats["taxa"]["filtered"],
                "references" : current_stats["references"]["all"]["total"],
                "pmids" : current_stats["references"]["pmids"]["total"]
            },
            "previous" : {
                "release_date" : previous_stats["release_date"],
                "annotations" : {
                    "total" : previous_stats["annotations"]["total"],
                    "by_aspect" : previous_stats["annotations"]["by_aspect"],
                    "by_evidence_cluster" : previous_stats["annotations"]["by_evidence"]["cluster"],
                    "by_qualifier" : previous_stats["annotations"]["by_qualifier"]
                },
                "bioentities" : previous_stats["bioentities"]["total"],
                "taxa" : previous_stats["taxa"]["total"],
                "taxa_filtered" : previous_stats["taxa"]["filtered"],
                "references" : previous_stats["references"]["all"]["total"],
                "pmids" : previous_stats["references"]["pmids"]["total"]
            },
            "changes" : {
                "annotations" : {
                    "total" : current_stats["annotations"]["total"] - previous_stats["annotations"]["total"],
                    "by_aspect" : utils.minus_dict(current_stats["annotations"]["by_aspect"], previous_stats["annotations"]["by_aspect"]),
                    "by_evidence_cluster" : utils.minus_dict(current_stats["annotations"]["by_evidence"]["cluster"], previous_stats["annotations"]["by_evidence"]["cluster"]),
                    "by_qualifier" : utils.minus_dict(current_stats["annotations"]["by_qualifier"], previous_stats["annotations"]["by_qualifier"]),
                },
                "bioentities" : current_stats["bioentities"]["total"] - previous_stats["bioentities"]["total"],
                "taxa" : {
                    "total" : current_stats["taxa"]["total"] - previous_stats["taxa"]["total"],
                    "filtered" : current_stats["taxa"]["filtered"] - previous_stats["taxa"]["filtered"],
                    "added" : len(addrem_species["added"]),
                    "removed" : len(addrem_species["removed"])
                },
                "references" : {
                    "total" : current_stats["references"]["all"]["total"] - previous_stats["references"]["all"]["total"],
                    "added" : 0,
                    "removed" : 0
                },
                "pmids" : {
                    "total" : current_stats["references"]["pmids"]["total"] - previous_stats["references"]["pmids"]["total"],
                    "added" : 0,
                    "removed" : 0
                }
            },
        },
        "detailed_changes" : {
            "annotations" : json_annot_changes["annotations"],
            "taxa" : addrem_species,
            "bioentities" : json_annot_changes["bioentities"],
            "references" : json_annot_changes["references"]
        }
    }

    altered_json_annot_changes["detailed_changes"]["references"]["all"]["added"] = []
    altered_json_annot_changes["detailed_changes"]["references"]["all"]["removed"] = []
    altered_json_annot_changes["detailed_changes"]["references"]["pmids"]["added"] = []
    altered_json_annot_changes["detailed_changes"]["references"]["pmids"]["removed"] = []

    # if pmid lists are provided, add the information to the stats
    if current_references and previous_references:
        # creating sets to accelerate the diff
        set_cur = set(current_references)
        set_prev = set(previous_references)

        added_references = list(filter(lambda x: x not in set_prev, set_cur))
        removed_references = list(filter(lambda x: x not in set_cur, set_prev))

        added_pmids = list(filter(lambda x: "PMID:" in x, added_references))
        removed_pmids = list(filter(lambda x: "PMID:" in x, removed_references))

        print("added references:   \t", len(added_references))
        print("removed references: \t", len(removed_references))
        print("added pmids:        \t", len(added_pmids))
        print("removed pmids:      \t", len(removed_pmids))

        altered_json_annot_changes["summary"]["changes"]["references"]["added"] = len(added_references)
        altered_json_annot_changes["summary"]["changes"]["references"]["removed"] = len(removed_references)

        altered_json_annot_changes["summary"]["changes"]["pmids"]["added"] = len(added_pmids)
        altered_json_annot_changes["summary"]["changes"]["pmids"]["removed"] = len(removed_pmids)

        altered_json_annot_changes["detailed_changes"]["references"]["all"]["added"] = added_references
        altered_json_annot_changes["detailed_changes"]["references"]["all"]["removed"] = removed_references

        altered_json_annot_changes["detailed_changes"]["references"]["pmids"]["added"] = added_pmids
        altered_json_annot_changes["detailed_changes"]["references"]["pmids"]["removed"] = removed_pmids

    return altered_json_annot_changes  


def create_text_report(json_changes):
    text_report = ""

    text_report = "CHANGES IN GO ANNOTATIONS"

    text_report += "\n\nSUMMARY: CURRENT RELEASE (" + json_changes["summary"]["current"]["release_date"] + ")"
    text_report += "\nannotated bioentities:\t" + str(json_changes["summary"]["current"]["bioentities"])
    text_report += "\ntaxa:\t" + str(json_changes["summary"]["current"]["taxa"])
    text_report += "\nfiltered taxa (> 1000 annotations):\t" + str(json_changes["summary"]["current"]["taxa_filtered"])
    text_report += "\nannotations:\t" + str(json_changes["summary"]["current"]["annotations"]["total"])
    for key, val in json_changes["summary"]["current"]["annotations"]["by_aspect"].items():
        text_report += "\nannotations by aspect " + key + ":\t" + str(val)
    for key, val in json_changes["summary"]["current"]["annotations"]["by_evidence_cluster"].items():
        text_report += "\nannotations by evidence cluster " + key + ":\t" + str(val)
    for key, val in json_changes["summary"]["current"]["annotations"]["by_qualifier"].items():
        text_report += "\nannotations by qualifier " + key + ":\t" + str(val)
    text_report += "\nreferences:\t" + str(json_changes["summary"]["current"]["references"])
    text_report += "\npmids:\t" + str(json_changes["summary"]["current"]["pmids"])

    text_report += "\n\nSUMMARY: PREVIOUS RELEASE (" + json_changes["summary"]["previous"]["release_date"] + ")"
    text_report += "\nannotated bioentities:\t" + str(json_changes["summary"]["previous"]["bioentities"])
    text_report += "\ntaxa:\t" + str(json_changes["summary"]["previous"]["taxa"])
    text_report += "\nfiltered taxa (> 1000 annotations):\t" + str(json_changes["summary"]["previous"]["taxa_filtered"])
    text_report += "\nannotations:\t" + str(json_changes["summary"]["previous"]["annotations"]["total"])
    for key, val in json_changes["summary"]["previous"]["annotations"]["by_aspect"].items():
        text_report += "\nannotations by aspect " + key + ":\t" + str(val)
    for key, val in json_changes["summary"]["previous"]["annotations"]["by_evidence_cluster"].items():
        text_report += "\nannotations by evidence cluster " + key + ":\t" + str(val)
    for key, val in json_changes["summary"]["previous"]["annotations"]["by_qualifier"].items():
        text_report += "\nannotations by qualifier " + key + ":\t" + str(val)
    text_report += "\nreferences:\t" + str(json_changes["summary"]["previous"]["references"])
    text_report += "\npmids:\t" + str(json_changes["summary"]["previous"]["pmids"])

    text_report += "\n\nSUMMARY: DIFF BETWEEN RELEASES"
    text_report += "\nannotated bioentities:\t" + str(json_changes["summary"]["current"]["bioentities"] - json_changes["summary"]["previous"]["bioentities"])
    text_report += "\ntaxa:\t" + str(json_changes["summary"]["current"]["taxa"] - json_changes["summary"]["previous"]["taxa"]) + "\t"
    text_report += "\nfiltered taxa (> 1000 annotations):\t" + str(json_changes["summary"]["current"]["taxa_filtered"] - json_changes["summary"]["previous"]["taxa_filtered"])
    text_report += "\nadded taxa\t" + str(json_changes["summary"]["changes"]["taxa"]["added"])
    text_report += "\nremoved taxa\t" + str(json_changes["summary"]["changes"]["taxa"]["removed"])
    text_report += "\nannotations:\t" + str(json_changes["summary"]["current"]["annotations"]["total"] - json_changes["summary"]["previous"]["annotations"]["total"])
    for key, val in json_changes["summary"]["current"]["annotations"]["by_aspect"].items():
        text_report += "\nannotations by aspect " + key + ":\t" + str(val - json_changes["summary"]["previous"]["annotations"]["by_aspect"][key])
    for key, val in json_changes["summary"]["changes"]["annotations"]["by_evidence_cluster"].items():
        text_report += "\nannotations by evidence cluster " + key + ":\t" + str(json_changes["summary"]["changes"]["annotations"]["by_evidence_cluster"][key])
    for key, val in json_changes["summary"]["changes"]["annotations"]["by_qualifier"].items():
        text_report += "\nannotations by qualifier " + key + ":\t" + str(json_changes["summary"]["changes"]["annotations"]["by_qualifier"][key])

    for key, val in json_changes["summary"]["changes"]["references"].items():
        text_report += "\nreferences " + key + ":\t" + str(json_changes["summary"]["changes"]["references"][key])
    
    for key, val in json_changes["summary"]["changes"]["pmids"].items():
        text_report += "\npmids " + key + ":\t" + str(json_changes["summary"]["changes"]["pmids"][key])




    text_report += "\n\nDETAILED CHANGES"

    text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES\n"
    text_report += "total\t" + str(json_changes["detailed_changes"]["bioentities"]["total"])

    # text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES BY TYPE (CLUSTER)"
    # for key, val in json_changes["detailed_changes"]["bioentities"]["by_type"]["cluster"].items():
    #     text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES BY TYPE (ALL)"
    for key, val in json_changes["detailed_changes"]["bioentities"]["by_type"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)




    text_report += "\n\nCHANGES IN ANNOTATIONS\n"
    text_report += "total\t" + str(json_changes["detailed_changes"]["annotations"]["total"])
    for key, val in json_changes["detailed_changes"]["annotations"]["by_aspect"].items():
        text_report += "\n" + key + "\t" + str(val)


    # text_report += "\n\nCHANGES IN ANNOTATIONS BY BIOENTITY TYPE (CLUSTER)"
    # for key, val in json_changes["detailed_changes"]["annotations"]["by_bioentity_type"]["cluster"].items():
    #     text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY BIOENTITY TYPE (ALL)"
    for key, val in json_changes["detailed_changes"]["annotations"]["by_bioentity_type"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)
            
    text_report += "\n\nCHANGES IN ANNOTATIONS BY QUALIFIER"
    for key, val in json_changes["detailed_changes"]["annotations"]["by_qualifier"].items():
        text_report += "\n" + key + "\t" + str(val)

    # text_report += "\n\nCHANGES IN ANNOTATIONS BY EVIDENCE (CLUSTER)"
    # for key, val in json_changes["detailed_changes"]["annotations"]["by_evidence"]["cluster"].items():
    #     text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nCHANGES IN ANNOTATIONS BY EVIDENCE (ALL)"
    for key, val in json_changes["detailed_changes"]["annotations"]["by_evidence"]["all"].items():
        text_report += "\n" + key + "\t" + str(val)
    

    ev_all = []
    ev_cluster = []
    for taxon, val in json_changes["detailed_changes"]["annotations"]["by_model_organism"].items():
            for evidence, evival in val["by_evidence_cluster"].items():            
                if evidence not in ev_cluster:
                    ev_cluster.append(evidence)    
    for taxon, val in json_changes["detailed_changes"]["annotations"]["by_model_organism"].items():
            for evidence, evival in val["by_evidence"].items():            
                if evidence not in ev_all:
                    ev_all.append(evidence)    
    ev_all.sort()
    ev_cluster.sort()

    # using a hard coded evidence list
    ev_all = utils.ev_all

    text_report += "\n\nCHANGES IN ANNOTATIONS BY MODEL ORGANISM AND EVIDENCE (ALL) THEN QUALIFIER"
    text_report += "\nTAXON\tALL"
    for evidence in utils.ev_all:
        text_report += "\t" + evidence

    qualifiers = list(json_changes["summary"]["current"]["annotations"]["by_qualifier"].keys())
    qualifiers.sort()
    for qualifier in qualifiers:
        text_report += "\t" + qualifier

    text_report += "\n"

    warnings = ""

    for taxon, val in json_changes["detailed_changes"]["annotations"]["by_model_organism"].items():
        taxon_all_annotations = 0
        line = ""

        for evidence in ev_all:
            if evidence not in json_changes["detailed_changes"]["annotations"]["by_model_organism"][taxon]["by_evidence"]:
                print("WARNING: evidence " + evidence + " for taxon " + taxon + " is no longer present - QC should check before release")
                warnings += "- evidence " + evidence + " for taxon " + taxon + " is no longer present\n"
                continue

            evival = json_changes["detailed_changes"]["annotations"]["by_model_organism"][taxon]["by_evidence"][evidence]
            if evival:
                te = evival["A"]
                if isinstance(te, str):
                    te = int(te.split(" ")[0])
                else:
                    te = evival["A"]

                line += "\t" + str(te)
                taxon_all_annotations += te                
            else:
                line += "\t0"
        text_report += "\n" + taxon + "\t" + str(taxon_all_annotations) + line

        for qualifier in qualifiers:
            if qualifier not in json_changes["detailed_changes"]["annotations"]["by_model_organism"][taxon]["by_qualifier"]:
                print("WARNING: qualifier " + qualifier + " for taxon " + taxon + " is no longer present - QC should check before release")
                warnings += "- qualifier " + qualifier + " for taxon " + taxon + " is no longer present\n"
                continue
                
            quaval = json_changes["detailed_changes"]["annotations"]["by_model_organism"][taxon]["by_qualifier"][qualifier]
            if isinstance(quaval, str):
                quaval = int(quaval.split(" ")[0])
            text_report += "\t" + str(quaval)


    text_report += "\n\nCHANGES IN ANNOTATIONS BY GROUP"
    for key, val in json_changes["detailed_changes"]["annotations"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val)



    
    text_report += "\n\nADDED TAXA\t" + str(len(json_changes["detailed_changes"]["taxa"]["added"]))
    for key, val in json_changes["detailed_changes"]["taxa"]["added"].items():
        text_report += "\n" + key + "\t" + str(val)
    
    text_report += "\n\nREMOVED TAXA\t" + str(len(json_changes["detailed_changes"]["taxa"]["removed"]))
    for key, val in json_changes["detailed_changes"]["taxa"]["removed"].items():
        text_report += "\n" + key + "\t" + str(val)


    text_report += "\n\nCHANGES IN REFERENCES AND PMIDS\n"
    text_report += "total\t" + str(json_changes["detailed_changes"]["references"]["all"]["total"])
    text_report += "\t" + str(json_changes["detailed_changes"]["references"]["pmids"]["total"])
 
    text_report += "\n\nCHANGES IN REFERENCES AND PMIDS BY GROUP"
    text_report += "\ngroup\treferences\t% references\tpmids\t% pmids"
    for key, val in json_changes["detailed_changes"]["references"]["all"]["by_group"].items():
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(json_changes["detailed_changes"]["references"]["pmids"]["by_group"][key])

    text_report += "\n\nCHANGES IN REFERENCES AND PMIDS BY TAXON"
    text_report += "\ntaxon\treferences\t% references\tpmids\t% pmids"
    for key, val in json_changes["detailed_changes"]["references"]["all"]["by_filtered_taxon"].items():
        pmid_val = json_changes["detailed_changes"]["references"]["pmids"]["by_filtered_taxon"][key] if key in json_changes["detailed_changes"]["references"]["pmids"]["by_filtered_taxon"] else 0
        text_report += "\n" + key + "\t" + str(val) + "\t" + str(pmid_val)


    # text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES BY FILTERED TAXON AND BY BIOENTITY TYPE (CLUSTER)"
    # text_report += "\ntaxon"
    # for type, nb in json_changes["detailed_changes"]["bioentities"]["by_type"]["cluster"].items():
    #     text_report += "\t" + type
    # for key, val in json_changes["detailed_changes"]["bioentities"]["by_filtered_taxon"]["cluster"].items():
    #     text_report += "\n" + key
    #     for type, nb in json_changes["detailed_changes"]["bioentities"]["by_type"]["cluster"].items():
    #         text_report += "\t" + str(val[type]["A"]) if type in val else "\t0"

    text_report += "\n\nCHANGES IN ANNOTATED BIOENTITIES BY FILTERED TAXON AND BY BIOENTITY TYPE (ALL)"
    text_report += "\ntaxon"
    for type, nb in json_changes["detailed_changes"]["bioentities"]["by_type"]["all"].items():
        text_report += "\t" + type + "\t% " + type
    for key, val in json_changes["detailed_changes"]["bioentities"]["by_filtered_taxon"]["all"].items():
        text_report += "\n" + key
        for type, nb in json_changes["detailed_changes"]["bioentities"]["by_type"]["all"].items():
            text_report += "\t" + str(val[type]["A"]) if type in val else "\t0\t0"

    text_report += "\n\nCHANGES IN ANNOTATIONS BY TAXON"
    for key, val in json_changes["detailed_changes"]["annotations"]["by_taxon"].items():
        text_report += "\n" + key + "\t" + str(val)

    text_report += "\n\nADDED REFERENCES\n"
    text_report += "\n".join(json_changes["detailed_changes"]["references"]["all"]["added"])

    text_report += "\n\nREMOVED REFERENCES\n"
    text_report += "\n".join(json_changes["detailed_changes"]["references"]["all"]["removed"])

    text_report += "\n\nADDED PMIDS\n"
    text_report += "\n".join(json_changes["detailed_changes"]["references"]["pmids"]["added"])

    text_report += "\n\nREMOVED PMIDS\n"
    text_report += "\n".join(json_changes["detailed_changes"]["references"]["pmids"]["removed"])


    if len(warnings) == 0:
        return text_report
    else:
        return "WARNINGS:\n" + warnings + "\n" + text_report
    



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


    current_stats = utils.fetch(current_stats_url).json()
    previous_stats = utils.fetch(previous_stats_url).json()
    json_changes = compute_changes(current_stats, previous_stats)

    json_changes = alter_annotation_changes(current_stats, previous_stats, None, None, json_changes)

    print("Saving Stats to <" + output_json + "> ...")    
    utils.write_json(output_json, json_changes)
    print("Done.")

    print("Saving Stats to <" + output_tsv + "> ...")    
    tsv_changes = create_text_report(json_changes)
    utils.write_text(output_tsv, tsv_changes)
    print("Done.")
    


if __name__ == "__main__":
   main(sys.argv[1:])