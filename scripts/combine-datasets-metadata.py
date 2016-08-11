#!/usr/bin/env python3

__author__ = 'cjm'

import argparse
import yaml
from json import dumps

def main():

    parser = argparse.ArgumentParser(description='GO Metadata'
                                                 '',
                                     formatter_class=argparse.RawTextHelpFormatter)

    parser.add_argument('files',nargs='*')
    args = parser.parse_args()
    datasets = []
    for fn in args.files:
        f = open(fn, 'r') 
        obj = yaml.load(f)
        datasets.extend(obj['datasets'])
        f.close()
    print(dumps(datasets, sort_keys=True, indent=4, separators=(',', ': ')))
        


if __name__ == "__main__":
    main()
    
