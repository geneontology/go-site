import requests
import json
import sys, getopt, os

import go_stats
import go_ontology_changes
import go_annotation_changes



def print_help():
    print('\nUsage: python go_refine.py -g <golr_url> -d <release_date> -c <current_obo_url> -p <previous_obo_url> -o <output_rep>\n')


def main(argv):
    golr_url = ''
    current_obo_url = ''
    previous_obo_url = ''    
    output_rep = ''
    release_date = ''

    if len(argv) < 10:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"g:c:p:o:d:",["golrurl=", "cobo=", "pobo=", "orep=", "date="])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)

    for opt, arg in opts:
        if opt == '-h':
            print_help()
            sys.exit()
        elif opt in ("-g", "--golrurl"):
            golr_url = arg
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
    # data = None
    # with open('newtest/go-stats.json', 'r') as myfile:
    #     data=myfile.read()
    # json_stats = json.loads(data)


    print("DONE.")

    print("\n\n1b - EXECUTING GO_STATS SCRIPT (EXCLUDING PROTEIN BINDING)...\n")
    json_stats_no_pb = go_stats.compute_stats(golr_url, release_date, True)
    # with open('newtest/go-stats-no-pb.json', 'r') as myfile:
    #     data=myfile.read()
    # json_stats_no_pb = json.loads(data)    
    print("DONE.")


    # 2 - Executing go_ontology_changes script
    print("\n\n2 - EXECUTING GO_ONTOLOGY_CHANGES SCRIPT...\n")
    # with open('newtest/go-ontology-changes.json', 'r') as myfile:
    #     data=myfile.read()
    # json_onto_changes = json.loads(data)
    
    json_onto_changes = go_ontology_changes.compute_changes(current_obo_url, previous_obo_url)
    go_annotation_changes.write_json(output_rep + "go-ontology-changes.json", json_onto_changes)

    tsv_onto_changes = go_ontology_changes.create_text_report(json_onto_changes) 
    go_annotation_changes.write_text(output_rep + "go-ontology-changes.tsv", tsv_onto_changes)
    print("DONE.")


    # 4 - Refining go-stats with ontology stats
    print("\n\n4 - EXECUTING GO_REFINE_STATS SCRIPT...\n")

    ontology = json_onto_changes["summary"]["current"].copy()
    del ontology["release_date"]

    json_stats = {
        "release_date" : json_stats["release_date"],
        "ontology" : ontology,
        "annotations" : json_stats["annotations"]
    }
    go_stats.write_json(output_rep + "go-stats.json", json_stats)


    json_stats_no_pb = {
        "release_date" : json_stats_no_pb["release_date"],
        "ontology" : ontology,
        "annotations" : json_stats_no_pb["annotations"]
    }
    go_stats.write_json(output_rep + "go-stats-no-pb.json", json_stats_no_pb)


    annotations_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        annotations_by_reference_genome[key] = json_stats["annotations"]["by_taxon"][key]

    bioentities_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        bioentities_by_reference_genome[key] = json_stats["annotations"]["bioentities"]["by_taxon"]["cluster"][key]

    references_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        references_by_reference_genome[key] = json_stats["annotations"]["references"]["all"]["by_taxon"][key]

    pmids_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        pmids_by_reference_genome[key] = json_stats["annotations"]["references"]["pmids"]["by_taxon"][key]
        
    json_stats_summary = {
        "release_date" : json_stats["release_date"],
        "ontology" : ontology,
        "annotations" : {
            "total" : json_stats["annotations"]["total"],
            "total_no_pb" : json_stats_no_pb["annotations"]["total"],
            "by_evidence_cluster" : json_stats["annotations"]["by_evidence"]["cluster"],
            "by_evidence_cluster_no_pb" : json_stats_no_pb["annotations"]["by_evidence"]["cluster"],
            "by_reference_genome" : json_stats["annotations"]["by_reference_genome"]
        },
        "taxa" : {
            "total" : json_stats["annotations"]["taxa"]["total"],
            "filtered" : json_stats["annotations"]["taxa"]["filtered"],
        },
        "bioentities" : {
            "total" : json_stats["annotations"]["bioentities"]["total"],
            "total_no_pb" : json_stats_no_pb["annotations"]["bioentities"]["total"],
            "by_type_cluster" : json_stats["annotations"]["bioentities"]["by_type"]["cluster"],
            "by_type_cluster_no_pb" : json_stats_no_pb["annotations"]["bioentities"]["by_type"]["cluster"],
            "by_reference_genome" : bioentities_by_reference_genome
        },
        "references" : {
            "all" : {
                "total" : json_stats["annotations"]["references"]["all"]["total"],
                "total_no_pb" : json_stats_no_pb["annotations"]["references"]["all"]["total"],
                "by_reference_genome" : references_by_reference_genome
            },
            "pmids" : {
                "total" : json_stats["annotations"]["references"]["pmids"]["total"],
                "total_no_pb" : json_stats_no_pb["annotations"]["references"]["pmids"]["total"],
                "by_reference_genome" : pmids_by_reference_genome
            }
        },
    }
    go_stats.write_json(output_rep + "go-stats-summary.json", json_stats_summary)

    print("DONE.")





if __name__ == "__main__":
   main(sys.argv[1:])
   