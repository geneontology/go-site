import requests
import json
import sys, getopt, os

import go_stats
import go_ontology_changes
import go_annotation_changes



def print_help():
    print('Usage: python go_reports.py -g <golr_url> -s <previous_stats_url> -n <previous_stats_no_pb_url> -c <current_obo_url> -p <previous_obo_url> -o <output_rep>\n')


def main(argv):
    golr_url = ''
    previous_stats_url = ''
    previous_stats_no_pb_url = ''
    current_obo_url = ''
    previous_obo_url = ''    
    output_rep = ''

    if len(argv) < 3:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"g:s:n:c:p:o:",["golrurl=", "pstats=", "pnstats=", "cobo=", "pobo=", "orep="])
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

    if not output_rep.endswith("/"):
        output_rep += "/"

    if not os.path.exists(output_rep):
        os.mkdir(output_rep)


    # 1 - Executing go_stats script
    print("\n\n1a - EXECUTING GO_STATS SCRIPT (INCLUDING PROTEIN BINDING)...\n")
    json_stats = go_stats.compute_stats(golr_url)
    go_stats.write_json(output_rep + "go-stats.json", json_stats)

    tsv_stats = go_stats.create_text_report(json_stats)
    go_stats.write_text(output_rep + "go-stats.tsv", tsv_stats)

    json_meta = go_stats.create_meta(json_stats)
    go_stats.write_json(output_rep + "go-meta.json", json_meta)
    print("DONE.")

    print("\n\n1b - EXECUTING GO_STATS SCRIPT (EXCLUDING PROTEIN BINDING)...\n")
    json_stats_no_pb = go_stats.compute_stats(golr_url, True)
    go_stats.write_json(output_rep + "go-stats-no-pb.json", json_stats_no_pb)

    tsv_stats_no_pb = go_stats.create_text_report(json_stats_no_pb)
    go_stats.write_text(output_rep + "go-stats-no-pb.tsv", tsv_stats_no_pb)

    json_meta_no_pb = go_stats.create_meta(json_stats_no_pb)
    go_stats.write_json(output_rep + "go-meta-no-pb.json", json_meta_no_pb)
    print("DONE.")



    # 2 - Executing go_ontology_changes script
    print("\n\n2 - EXECUTING GO_ONTOLOGY_CHANGES SCRIPT...\n")
    json_onto_changes = go_ontology_changes.compute_changes(current_obo_url, previous_obo_url)
    go_annotation_changes.write_json(output_rep + "go-ontology-changes.json", json_onto_changes)

    tsv_onto_changes = go_ontology_changes.create_text_report(json_onto_changes) 
    go_annotation_changes.write_text(output_rep + "go-ontology-changes.tsv", tsv_onto_changes)
    print("DONE.")



    # 3 - Refining go-stats with ontology stats
    print("\n\n3 - EXECUTING GO_REFINE_STATS SCRIPT...\n")
    print("DONE.")



    # 4 - Executing go_annotation_changes script
    print("\n\n4a - EXECUTING GO_ANNOTATION_CHANGES SCRIPT (INCLUDING PROTEIN BINDING)...\n")
    previous_stats = requests.get(previous_stats_url).json()    
    json_annot_changes = go_annotation_changes.compute_changes(json_stats, previous_stats)
    go_annotation_changes.write_json(output_rep + "go-annotation-changes.json", json_annot_changes)

    tsv_annot_changes = go_annotation_changes.create_text_report(json_annot_changes)
    go_annotation_changes.write_text(output_rep + "go-annotation-changes.tsv", tsv_annot_changes)
    print("DONE.")
    
    print("\n\n4b - EXECUTING GO_ANNOTATION_CHANGES SCRIPT (EXCLUDING PROTEIN BINDING)...\n")
    previous_stats_no_pb = requests.get(previous_stats_no_pb_url).json()    # WE STILL NEED TO CORRECT THAT: 1 FILE OR SEVERAL FILE ? IF SEVERAL, ONE MORE PARAMETER
    json_annot_no_pb_changes = go_annotation_changes.compute_changes(json_stats_no_pb, previous_stats_no_pb)
    go_annotation_changes.write_json(output_rep + "go-annotation-changes_no_pb.json", json_annot_no_pb_changes)
    
    tsv_annot_changes_no_pb = go_annotation_changes.create_text_report(json_annot_no_pb_changes)
    go_annotation_changes.write_text(output_rep + "go-annotation-changes_no_pb.tsv", tsv_annot_changes_no_pb)
    print("DONE.")


if __name__ == "__main__":
   main(sys.argv[1:])
   