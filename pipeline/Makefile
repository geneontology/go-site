OBO= http://purl.obolibrary.org/obo/
METADATA_DIR=../metadata/datasets

all: target/Makefile extra_files all_gafs

test:
	$(foo)
	$(call foo, bar)

.PHONY: clean
clean:
	rm target/*

.PHONY: null
null:
	echo hi

extra_files: target/go.obo target/GO.xrf_abbs

# TODO - update
target/go.obo: null
	$(call wget, $(OBO)/go.obo)
target/GO.xrf_abbs: 
	node ../scripts/db-xrefs-yaml2legacy.js  -i ../metadata/db-xrefs.yaml  > $@.tmp && mv $@.tmp $@

proc:
	./util/dataset-metadata-processor.py $(METADATA_DIR)/*.yaml

target/Makefile: ./util/generate-makefile.py
	$< ../metadata/datasets/*.yaml > $@.tmp && mv $@.tmp $@

include target/Makefile

