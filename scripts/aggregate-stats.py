import json
import sys, getopt, os
from os import listdir
from os.path import isfile, join




def create_initial_set(folder):
    stats = list_stats(folder)
    aggregate = []
    for stat in stats:
        json_stats = read_json(folder + stat)
        aggregate.append(json_stats)
    return aggregate

def list_stats(folder):
    files = []
    list_files = sorted(listdir(folder))
    for f in list_files:
        if isfile(join(folder, f)) and "go-stats-summary" in f:
            files.append(f)
    return files

def read_json(filename):
    with open(filename, 'r') as myfile:
        data=myfile.read()
    return json.loads(data)

def write_json(key, content):
    with open(key, 'w') as outfile:
        json.dump(content, outfile, indent=2)

def print_help():
    print("\nUsage: aggregate-stats.py -f <folder> -o <json_output>\nOR\n\taggregate-stats -a <json_file1> -b <json_file2> -o <json_output>\n")

def main(argv):
    try:
        opts, argv = getopt.getopt(argv, "f:o:a:b:",["folder=", "output=", "fileA=", "fileB="])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)

    if len(opts) < 2:
        print_help()
        sys.exit(2)

    folder = ''
    output = ''
    fileA = ''
    fileB = ''
    for opt, arg in opts:
        if opt == '-h':
            print_help()
            sys.exit()
        elif opt in ("-f", "--folder"):
            folder = arg
        elif opt in ("-o", "--output"):
            output = arg
        elif opt in ("-a", "--fileA"):
            fileA = arg
        elif opt in ("-b", "--fileB"):
            fileB = arg

    print("params: ", folder, fileA, fileB)
    if folder != '':
        print("Creating initial aggregate of stats as " , output)
        aggregate = create_initial_set(folder)
        write_json(output, aggregate)

    elif fileA != '' and fileB != '':
        print("Adding stat ", fileB , " to aggregate " , fileA , " and saving to " , output)
        jsonA = read_json(fileA)
        jsonB = read_json(fileB)
        d = { "stats" : jsonA }
        d["stats"].append(jsonB)
        aggregate = d["stats"]
        write_json(output, aggregate)

if __name__ == "__main__":
   main(sys.argv[1:])