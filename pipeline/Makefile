OBO= http://purl.obolibrary.org/obo
METADATA_DIR=../metadata/datasets

all: target/Makefile extra_files all_gafs

test:
	$(foo)
	$(call foo, bar)

.PHONY: clean
clean:
	rm -rf target/*

.PHONY: null
null:
	echo hi

.PHONY: extra_files
extra_files: target/go.obo target/GO.xrf_abbs target/datasets-metadata.json

# TODO - update
target/datasets-metadata.json:
	../scripts/combine-datasets-metadata.py ../metadata/datasets/*yaml > $@.tmp && mv $@.tmp $@

target/go.obo:
	wget --no-check-certificate $(OBO)/go.obo -O $@.tmp && mv $@.tmp $@ && touch $@
target/GO.xrf_abbs: 
	node ../scripts/db-xrefs-yaml2legacy.js  -i ../metadata/db-xrefs.yaml  > $@.tmp && mv $@.tmp $@

proc:
	./util/dataset-metadata-processor.py $(METADATA_DIR)/*.yaml

target/Makefile: ./util/generate-makefile.py
	$< ../metadata/datasets/*.yaml > $@.tmp && mv $@.tmp $@

include target/Makefile

