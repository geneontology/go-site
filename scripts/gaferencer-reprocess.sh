#!/bin/bash

# Extract gaferences tarball
tar -xvf /opt/go-site/gaferencer-products/gaferences.json.tgz -C /opt/go-site/gaferencer-products
# Concatenate all gaferences.json files into one large JSON object, then write to all.gaferences.json
python3 /opt/go-site/scripts/json-concat-lists.py /opt/go-site/gaferencer-products/*.gaferences.json /opt/go-site/gaferencer-products/all.gaferences.json

# Uncompress all files in annotations/.
unpigz /opt/go-site/annotations/*.gz
# This ould provide absolute paths in $f for all files in /tmp/annotations. Just plug in 'ontobio-parse-assocs' cmd
# by replacing 'echo $f'
make -f /opt/go-site/scripts/Makefile-gaf-reprocess
# After ontobio-parse-assocs is run and we're all
# done, gzip up all.gaferences.json, all
# annotations_new/ files, and then upload.
# annotations_new/ files will clobber existing
# files in skyhook/$BRANCH_NAME/annotations.
pigz /opt/go-site/annotations_new/*
pigz /opt/go-site/gaferencer-products/all.gaferences.json
