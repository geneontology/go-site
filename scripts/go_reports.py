import requests
import json
import sys, getopt, os

import go_stats
import go_ontology_changes
import go_annotation_changes



def print_help():
    print('Usage: python go_reports.py -g <golr_url> -s <previous_stats_url> -c <current_obo_url> -p <previous_obo_url> -o <output_rep>\n')


def main(argv):
    golr_url = ''
    previous_stats_url = ''
    current_obo_url = ''
    previous_obo_url = ''
    output_rep = ''

    if len(argv) < 3:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"g:s:c:p:o:",["golrurl=", "pstats=", "cobo=", "pobo=", "orep="])
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
    print("\n\n1 - EXECUTING GO_STATS SCRIPT...\n")
    json_stats = go_stats.compute_stats(golr_url)
    go_stats.write_json(output_rep + "go-stats.json", json_stats)

    tsv_stats = go_stats.create_text_report(json_stats)
    go_stats.write_text(output_rep + "go-stats.tsv", tsv_stats)

    json_meta = go_stats.create_meta(json_stats)
    go_stats.write_json(output_rep + "go-meta.json", json_meta)
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
    print("\n\n4 - EXECUTING GO_ANNOTATION_CHANGES SCRIPT...\n")
    previous_stats = requests.get(previous_stats_url).json()    
    json_annot_changes = go_annotation_changes.compute_changes(json_stats, previous_stats)
    go_annotation_changes.write_json(output_rep + "go-annotation-changes.json", json_annot_changes)

    tsv_annot_changes = go_annotation_changes.create_text_report(json_annot_changes)
    go_annotation_changes.write_text(output_rep + "go-annotation-changes.tsv", tsv_annot_changes)
    print("DONE.")
    

if __name__ == "__main__":
   main(sys.argv[1:])
   