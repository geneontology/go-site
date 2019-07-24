import sys, getopt, os

import requests
import json



def merge(stats_file, ontology_changes):
    new_stats = stats_file

    return new_stats



def write_json(key, content):
    with open(key, 'w') as outfile:
        json.dump(content, outfile, indent=2)
 
def write_text(key, content):
    with open(key, 'w') as outfile:
        outfile.write(content)


def print_help():
    print('Usage: python go_refine_stats.py -s <stats_file> -c <ontology_changes> -o <output_rep>\n')


def main(argv):
    stats_file = ''
    ontology_changes = ''
    output_rep = ''

    if len(argv) < 3:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"s:c:o:",["stats=","changes=","orep="])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)

    for opt, arg in opts:
        if opt == '-h':
            print_help()
            sys.exit()
        elif opt in ("-s", "--stats"):
            stats_file = arg
        elif opt in ("-c", "--changes"):
            ontology_changes = arg
        elif opt in ("-o", "-orep"):
            output_rep = arg
        
    if not output_rep.endswith("/"):
        output_rep += "/"

    if not os.path.exists(output_rep):
        os.mkdir(output_rep)

    output_json =  output_rep + "go-release-stats.json"
    output_tsv =  output_rep + "go-release-stats.tsv"

    print("Will write stats changes to " + output_json + " and " + output_tsv)

    json_changes = merge(stats_file, ontology_changes)

    print("Saving Stats to <" + output_json + "> ...")    
    write_json(output_json, json_changes)
    print("Done.")

    # print("Saving Stats to <" + output_tsv + "> ...")    
    # tsv_changes = create_text_report(json_changes)
    # write_text(output_tsv, tsv_changes)
    # print("Done.")
    


if __name__ == "__main__":
   main(sys.argv[1:])