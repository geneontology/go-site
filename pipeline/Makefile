OBO= http://purl.obolibrary.org/obo
METADATA_DIR=../metadata/datasets
REPORT=target/combined.report

all: target/Makefile extra_files all_gafs $(REPORT)

test:
	$(foo)
	$(call foo, bar)

.PHONY: clean
clean:
	rm -rf target/*

# ----------------------------------------
# Generic conversion
# ----------------------------------------
%.gz: %
	gzip -c $< > $@

# ----------------------------------------
# Additional metadata files required
# ----------------------------------------

.PHONY: extra_files
extra_files: target/go.obo target/datasets-metadata.json

# TODO - update
target/datasets-metadata.json:
	../scripts/combine-datasets-metadata.py ../metadata/datasets/*yaml > $@.tmp && mv $@.tmp $@

target/go.obo:
	wget --no-check-certificate $(OBO)/go.obo -O $@.tmp && mv $@.tmp $@ && touch $@
#target/GO.xrf_abbs: 
#	node ../scripts/db-xrefs-yaml2legacy.js  -i ../metadata/db-xrefs.yaml  > $@.tmp && mv $@.tmp $@

proc:
	./util/dataset-metadata-processor.py $(METADATA_DIR)/*.yaml

# ----------------------------------------
# OWLTools checks
# ----------------------------------------

CATALOG_DETAILS=
GAF_OWL= http://purl.obolibrary.org/obo/go/extensions/go-gaf.owl
OWLTOOLS_GAFCHECK = owltools $(CATALOG_DETAILS) $(GAF_OWL) \
--gaf $< \
--createReport \
--gaf-report-file $@-report.txt \
--gaf-report-summary-file $@-summary.txt \
--gaf-prediction-file $@-prediction.gaf \
--gaf-prediction-report-file $@-prediction-report.txt \
--gaf-validation-unsatisfiable-module $@-incoherent.owl \
--experimental-gaf-prediction-file $@-prediction-experimental.gaf \
--experimental-gaf-prediction-report-file $@-prediction-experimental-report.txt \
--gaf-run-checks && touch $@

# ----------------------------------------
# Makefile for building GAFs
# ----------------------------------------
# this defines 'all_gafs'
target/Makefile: ./util/generate-makefile.py
	$< ../metadata/datasets/*.yaml > $@.tmp && mv $@.tmp $@

include target/Makefile

$(REPORT): all_gafs
	cat target/*/*.report > $@
