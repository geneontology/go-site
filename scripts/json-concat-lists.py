import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('json_file', nargs='+')
parser.add_argument('output_file')

if __name__ == "__main__":
    args = parser.parse_args()

    list_all = []
    for jf in args.json_file:
        with open(jf) as in_f:
            list_all += json.load(in_f)

    with open(args.output_file, 'w') as out_f:
        json.dump(list_all, out_f)
