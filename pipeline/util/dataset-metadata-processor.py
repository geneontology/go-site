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
    artifacts = []
    artifacts_by_dataset = {}
    for fn in args.files:
        f = open(fn, 'r') 
        obj = yaml.load(f)
        artifacts.extend(obj['datasets'])
        f.close()
    for a in artifacts:
        if 'source' not in a:
            # TODO
            continue
        ds = a['dataset']
        if ds == 'paint':
            # TODO
            continue
        if ds == 'rnacentral':
            # TODO
            continue
        
        if ds not in artifacts_by_dataset:
            artifacts_by_dataset[ds] = []
        artifacts_by_dataset[ds].append(a)
    for (ds,alist) in artifacts_by_dataset.items():
        generate_targets(ds, alist)
    targets = [all(ds) for ds in artifacts_by_dataset.keys()]
    rule('all_gafs', ' '.join(targets), 'echo done')
        
def generate_targets(ds, alist):
    types = [a['type'] for a in alist]

    print("## --------------------")
    print("## {}".format(ds))
    print("## --------------------")
    rule(all(ds),filtered_gaf(ds))
    # for now we assume everything comes from a GAF
    if 'gaf' in types:
        [gaf] = [a for a in alist if a['type']=='gaf']
        url = gaf['source']
        # GAF from source
        rule(src_gaf(ds),'',
             'wget --no-check-certificate {url} -O $@.tmp && mv $@.tmp $@ && touch $@'.format(url=url))
    rule(filtered_gaf(ds),src_gaf(ds),
         './util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@')

def all(ds):
    return 'all_'+ds
def src_gaf(ds):
    return 'target/{ds}-src.gaf.gz'.format(ds=ds)
def filtered_gaf(ds):
    return 'target/{ds}-filtered.gaf.gz'.format(ds=ds)

def rule(tgt,dep,ex='echo done'):
    s = "{tgt}: {dep}\n\t{ex}\n".format(tgt=tgt,dep=dep,ex=ex)
    print(s)

if __name__ == "__main__":
    main()
    
