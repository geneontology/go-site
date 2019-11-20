#!/bin/bash
set -x

test_dir=/tmp/test-$(date +%Y-%m-%dT%H%M%S)
mkdir $test_dir
wget http://snapshot.geneontology.org/ontology/go.json -O $test_dir/go-ontology.json
validate.py rule --metadata metadata/ --ontology $test_dir/go-ontology.json --out $test_dir/out.json
cat $test_dir/out.json
validate_exit=$?
rm -rf $test_dir

exit $validate_exit
