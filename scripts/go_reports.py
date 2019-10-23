import requests
import json
import sys, getopt, os

import go_stats
import go_ontology_changes
import go_annotation_changes


def merge_dict(dict_total, dict_diff):
    new_dict = { }
    for key, val in dict_total.items():
        if type(val) == str:
            new_dict[key] = val
        elif type(val) == int or type(val) == float:
            if val == 0:
                diff_val = dict_diff[key] if key in dict_diff else 0
                new_dict[key] = str(diff_val) + " / " + str(val) + " (0%) "
            else:
                diff_val = dict_diff[key] if key in dict_diff else 0
                new_dict[key] = str(diff_val) + " / " + str(val) + " (" + str(round(100 * diff_val / val, 2)) + "%) "
        elif type(val) == dict:
            diff_val = dict_diff[key] if key in dict_diff else { }
            new_dict[key] = merge_dict(val, diff_val)
        else:
            print("should not happened ! " , val , type(val))
    return new_dict

def minus_dict(dict1, dict2):
    new_dict = { }
    for key, val in dict1.items():
        if type(val) == str:
            new_dict[key] = val
        elif type(val) == int or type(val) == float:
                diff_val = dict2[key] if key in dict2 else 0
                new_dict[key] = val - diff_val
        elif type(val) == dict:
            diff_val = dict2[key] if key in dict2 else { }
            new_dict[key] = merge_dict(val, diff_val)
        else:
            print("should not happened ! " , val , type(val))
    return new_dict    


def has_taxon(stats, taxon_id):
    for taxon in stats["annotations"]["by_taxon"]:
        if taxon_id in taxon:
            return True
    return False

def added_removed_species(current_stats, previous_stats):
    results = {
        "added" : { },
        "removed" : { }
    }

    for taxon in current_stats["annotations"]["by_taxon"]:
        taxon_id = taxon.split("|")[0]
        if not has_taxon(previous_stats, taxon_id):
            results["added"][taxon] = current_stats["annotations"]["by_taxon"][taxon]

    for taxon in previous_stats["annotations"]["by_taxon"]:
        taxon_id = taxon.split("|")[0]
        if not has_taxon(current_stats, taxon_id):
            results["removed"][taxon] = previous_stats["annotations"]["by_taxon"][taxon]
        
    return results


def alter_annotation_changes(current_stats, previous_stats, json_annot_changes):
    addrem_species = added_removed_species(current_stats, previous_stats)
    # print("INITIAL: ", json_annot_changes)
    # print("DEBUG: ", addrem_species)

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
                    "by_aspect" : minus_dict(current_stats["annotations"]["by_aspect"], previous_stats["annotations"]["by_aspect"]),
                    "by_evidence_cluster" : minus_dict(current_stats["annotations"]["by_evidence"]["cluster"], previous_stats["annotations"]["by_evidence"]["cluster"]),
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
    return altered_json_annot_changes  


def print_help():
    print('\nUsage: python go_reports.py -g <golr_url> -d <release_date> -s <previous_stats_url> -n <previous_stats_no_pb_url> -c <current_obo_url> -p <previous_obo_url> -o <output_rep>\n')


def main(argv):
    golr_url = ''
    previous_stats_url = ''
    previous_stats_no_pb_url = ''
    current_obo_url = ''
    previous_obo_url = ''    
    output_rep = ''
    release_date = ''

    print(len(argv))
    if len(argv) < 14:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"g:s:n:c:p:o:d:",["golrurl=", "pstats=", "pnstats=", "cobo=", "pobo=", "orep=", "date="])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)

    for opt, arg in opts:
        if opt == '-h':
            print_help()
            sys.exit()
        elif opt in ("-g", "--golrurl"):
            golr_url = arg
        elif opt in ("-s", "--pstats"):
            previous_stats_url = arg
        elif opt in ("-n", "--pnstats"):
            previous_stats_no_pb_url = arg
        elif opt in ("-c", "--cobo"):
            current_obo_url = arg
        elif opt in ("-p", "--pobo"):
            previous_obo_url = arg
        elif opt in ("-o", "--orep"):
            output_rep = arg
        elif opt in ("-d", "--date"):
            release_date = arg

    if not output_rep.endswith("/"):
        output_rep += "/"

    if not os.path.exists(output_rep):
        os.mkdir(output_rep)


    # 1 - Executing go_stats script
    print("\n\n1a - EXECUTING GO_STATS SCRIPT (INCLUDING PROTEIN BINDING)...\n")
    json_stats = go_stats.compute_stats(golr_url, release_date)
    # with open('newstats/2019-06/go-stats.json', 'r') as myfile:
    #     data=myfile.read()
    # json_stats = json.loads(data)
    
    print("DONE.")

    print("\n\n1b - EXECUTING GO_STATS SCRIPT (EXCLUDING PROTEIN BINDING)...\n")
    json_stats_no_pb = go_stats.compute_stats(golr_url, release_date, True)
    # with open('newstats/2019-06/go-stats-no-pb.json', 'r') as myfile:
    #     data=myfile.read()
    # json_stats_no_pb = json.loads(data)
    # print("DONE.")


    # 2 - Executing go_ontology_changes script
    print("\n\n2 - EXECUTING GO_ONTOLOGY_CHANGES SCRIPT...\n")
    json_onto_changes = go_ontology_changes.compute_changes(current_obo_url, previous_obo_url)
    go_annotation_changes.write_json(output_rep + "go-ontology-changes.json", json_onto_changes)

    tsv_onto_changes = go_ontology_changes.create_text_report(json_onto_changes) 
    go_annotation_changes.write_text(output_rep + "go-ontology-changes.tsv", tsv_onto_changes)

    # with open('newstats/2019-06/go-ontology-changes.json', 'r') as myfile:
    #     data=myfile.read()
    # json_onto_changes = json.loads(data)
    print("DONE.")


    # 3 - Executing go_annotation_changes script
    print("\n\n3a - EXECUTING GO_ANNOTATION_CHANGES SCRIPT (INCLUDING PROTEIN BINDING)...\n")
    previous_stats = requests.get(previous_stats_url).json()    
    json_annot_changes = go_annotation_changes.compute_changes(json_stats, previous_stats)
    print("DONE.")
    
    print("\n\n3b - EXECUTING GO_ANNOTATION_CHANGES SCRIPT (EXCLUDING PROTEIN BINDING)...\n")
    previous_stats_no_pb = requests.get(previous_stats_no_pb_url).json()    # WE STILL NEED TO CORRECT THAT: 1 FILE OR SEVERAL FILE ? IF SEVERAL, ONE MORE PARAMETER
    json_annot_no_pb_changes = go_annotation_changes.compute_changes(json_stats_no_pb, previous_stats_no_pb)
    print("DONE.")

    # 4 - Refining go-stats with ontology stats
    print("\n\n4 - EXECUTING GO_REFINE_STATS SCRIPT...\n")
    merged_annotations_diff = merge_dict(json_stats, json_annot_changes)
    json_annot_changes = merged_annotations_diff


    ontology = json_onto_changes["summary"]["current"].copy()
    del ontology["release_date"]
    ontology["changes_created_terms"] = json_onto_changes["summary"]["changes"]["created_terms"]
    ontology["changes_valid_terms"] = json_onto_changes["summary"]["changes"]["valid_terms"]
    ontology["changes_obsolete_terms"] = json_onto_changes["summary"]["changes"]["obsolete_terms"]
    ontology["changes_merged_terms"] = json_onto_changes["summary"]["changes"]["merged_terms"]

    json_stats = {
        "release_date" : json_stats["release_date"],
        "ontology" : ontology,
        "annotations" : json_stats["annotations"],
        "taxa" : json_stats["taxa"],
        "bioentities" : json_stats["bioentities"],
        "references" : json_stats["references"]
    }
    go_stats.write_json(output_rep + "go-stats.json", json_stats)


    json_stats_no_pb = {
        "release_date" : json_stats_no_pb["release_date"],
        "ontology" : ontology,
        "annotations" : json_stats_no_pb["annotations"],
        "taxa" : json_stats_no_pb["taxa"],
        "bioentities" : json_stats_no_pb["bioentities"],
        "references" : json_stats_no_pb["references"]
    }
    go_stats.write_json(output_rep + "go-stats-no-pb.json", json_stats_no_pb)


    annotations_by_reference_genome = json_stats["annotations"]["by_model_organism"]
    for taxon in annotations_by_reference_genome:
        for ecode in annotations_by_reference_genome[taxon]["by_evidence"]:
            annotations_by_reference_genome[taxon]["by_evidence"][ecode]["B"] = json_stats["annotations"]["by_model_organism"][taxon]["by_evidence"][ecode]["F"] - json_stats_no_pb["annotations"]["by_model_organism"][taxon]["by_evidence"][ecode]["F"]
        for ecode in annotations_by_reference_genome[taxon]["by_evidence_cluster"]:
            annotations_by_reference_genome[taxon]["by_evidence_cluster"][ecode]["B"] = json_stats["annotations"]["by_model_organism"][taxon]["by_evidence_cluster"][ecode]["F"] - json_stats_no_pb["annotations"]["by_model_organism"][taxon]["by_evidence_cluster"][ecode]["F"]

    bioentities_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        bioentities_by_reference_genome[key] = json_stats["bioentities"]["by_filtered_taxon"]["cluster"][key] if key in json_stats["bioentities"]["by_filtered_taxon"]["cluster"] else { }
        # TODO: we don't have a way to filter on bioentity documents without direct annotations to PB ?
        # for btype in bioentities_by_reference_genome[key]:
        #     val = json_stats_no_pb["bioentities"]["by_filtered_taxon"]["cluster"][key]["F"] if (key in json_stats_no_pb["bioentities"]["by_filtered_taxon"]["cluster"] and "F" in json_stats_no_pb["bioentities"]["by_filtered_taxon"]["cluster"][key]) else 0
        #     bioentities_by_reference_genome[key][btype]["B"] = bioentities_by_reference_genome[key][btype]["F"] - val

    references_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        references_by_reference_genome[key] = json_stats["references"]["all"]["by_filtered_taxon"][key] if key in json_stats["references"]["all"]["by_filtered_taxon"] else { }

    pmids_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        pmids_by_reference_genome[key] = json_stats["references"]["pmids"]["by_filtered_taxon"][key] if key in json_stats["references"]["pmids"]["by_filtered_taxon"] else { }
        
    json_stats_summary = {
        "release_date" : json_stats["release_date"],
        "ontology" : ontology,
        "annotations" : {
            "total" : json_stats["annotations"]["total"],
            "total_no_pb" : json_stats_no_pb["annotations"]["total"],
            "by_aspect" : {
                "P" : json_stats["annotations"]["by_aspect"]["P"],
                "F" : json_stats["annotations"]["by_aspect"]["F"],
                "C" : json_stats["annotations"]["by_aspect"]["C"],
                "B" : json_stats["annotations"]["by_aspect"]["F"] - json_stats_no_pb["annotations"]["by_aspect"]["F"]
            },
            "by_bioentity_type_cluster" : json_stats["annotations"]["by_bioentity_type"]["cluster"],
            "by_bioentity_type_cluster_no_pb" : json_stats_no_pb["annotations"]["by_bioentity_type"]["cluster"],
            "by_evidence_cluster" : json_stats["annotations"]["by_evidence"]["cluster"],
            "by_evidence_cluster_no_pb" : json_stats_no_pb["annotations"]["by_evidence"]["cluster"],
            "by_model_organism" : annotations_by_reference_genome
        },
        "taxa" : {
            "total" : json_stats["taxa"]["total"],
            "filtered" : json_stats["taxa"]["filtered"],
        },
        "bioentities" : {
            "total" : json_stats["bioentities"]["total"],
            "total_no_pb" : json_stats_no_pb["bioentities"]["total"],
            "by_type_cluster" : json_stats["bioentities"]["by_type"]["cluster"],
            "by_type_cluster_no_pb" : json_stats_no_pb["bioentities"]["by_type"]["cluster"],
            "by_model_organism" : bioentities_by_reference_genome
        },
        "references" : {
            "all" : {
                "total" : json_stats["references"]["all"]["total"],
                "total_no_pb" : json_stats_no_pb["references"]["all"]["total"],
                "by_model_organism" : references_by_reference_genome
            },
            "pmids" : {
                "total" : json_stats["references"]["pmids"]["total"],
                "total_no_pb" : json_stats_no_pb["references"]["pmids"]["total"],
                "by_model_organism" : pmids_by_reference_genome
            }
        },
    }

    # removing by_reference_genome.by_evidence
    for gen in json_stats_summary["annotations"]["by_model_organism"]:
        del json_stats_summary["annotations"]["by_model_organism"][gen]["by_evidence"]
    go_stats.write_json(output_rep + "go-stats-summary.json", json_stats_summary)


    # This is to modify the structure of the annotation changes based on recent requests
    json_annot_changes = alter_annotation_changes(json_stats, previous_stats, json_annot_changes)
    go_annotation_changes.write_json(output_rep + "go-annotation-changes.json", json_annot_changes)
    tsv_annot_changes = go_annotation_changes.create_text_report(json_annot_changes)
    go_annotation_changes.write_text(output_rep + "go-annotation-changes.tsv", tsv_annot_changes)

    json_annot_no_pb_changes = alter_annotation_changes(json_stats_no_pb, previous_stats_no_pb, json_annot_no_pb_changes)
    go_annotation_changes.write_json(output_rep + "go-annotation-changes_no_pb.json", json_annot_no_pb_changes)
    tsv_annot_changes_no_pb = go_annotation_changes.create_text_report(json_annot_no_pb_changes)
    go_annotation_changes.write_text(output_rep + "go-annotation-changes_no_pb.tsv", tsv_annot_changes_no_pb)


    print("SUCCESS.")




if __name__ == "__main__":
   main(sys.argv[1:])
   