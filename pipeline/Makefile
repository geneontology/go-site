OBO= http://purl.obolibrary.org/obo
METADATA_DIR=../metadata/datasets
REPORT=target/combined.report
RDFOX_MEM ?= 32G
GAF_OWL = target/go-gaf.owl

all: target/Makefile extra_files $(REPORT) 

all_blazegraph: all target/blazegraph.jnl

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
ONT_MERGED = target/go-graphstore-merged.ttl
$(ONT_MERGED):
	OWLTOOLS_MEMORY=12G owltools go-graphstore.owl --merge-imports-closure -o -f turtle $@
.PRECIOUS: target/go-graphstore-merged.ttl

.PHONY: extra_files
extra_files: $(GAF_OWL) target/go.obo target/datasets-metadata.json $(ONT_MERGED)

# TODO - update
target/datasets-metadata.json:
	../scripts/combine-datasets-metadata.py ../metadata/datasets/*yaml > $@.tmp && mv $@.tmp $@

target/go.obo:
	wget --no-check-certificate $(OBO)/go.obo -O $@.tmp && mv $@.tmp $@ && touch $@

# target/GO.xrf_abbs:
#	node ../scripts/db-xrefs-yaml2legacy.js  -i ../metadata/db-xrefs.yaml  > $@.tmp && mv $@.tmp $@

proc:
	./util/dataset-metadata-processor.py $(METADATA_DIR)/*.yaml


# ----------------------------------------
# OWLTools checks
# ----------------------------------------

$(GAF_OWL):
	owltools $(OBO)/go/extensions/go-gaf.owl --merge-imports-closure --remove-annotation-assertions -l -r --add-obo-shorthand-to-properties -o $@

CATALOG_DETAILS=
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
--gaf-run-checks || echo 'errors found' ; touch $@

# ----------------------------------------
# Makefile for building GAFs
# ----------------------------------------
# this defines 'all_targets'
target/Makefile: ./util/generate-makefile.py
	mkdir -p target
	$< ../metadata/datasets/*.yaml > $@.tmp && mv $@.tmp $@

include target/Makefile

$(REPORT): target/Makefile all_targets
	cat target/groups/*/*.report > $@

target/noctua-models:
	# If target/noctua-models does not exist, then clone it
	if [ ! -d target/nocuta-models ]; then git clone https://github.com/geneontology/noctua-models.git target/noctua-models; fi

target/rdf: $(REPORT) target/noctua-models $(ONT_MERGED)
	mkdir -p target/rdf
	cp target/groups/*/*.ttl target/rdf/
	cp target/noctua-models/models/* target/rdf/
	cp $(ONT_MERGED) target/rdf/go-graphstore-merged.ttl

BGJAR = target/jars/blazegraph-jar.jar
$(BGJAR):
	mkdir -p target/jars && mvn package
.PRECIOUS: $(BGJAR)

BGMEM ?= 32G
BG = java -server -XX:+UseG1GC -Xmx$(BGMEM) -cp $(BGJAR) com.bigdata.rdf.store.DataLoader

# Load blazegraph
target/blazegraph.jnl: $(BGJAR) target/rdf target/inferred
	$(BG) -defaultGraph http://geneontology.org/rdf/ conf/blazegraph.properties target/rdf
	$(BG) -defaultGraph http://geneontology.org/rdf/inferred/ conf/blazegraph.properties target/inferred/

#
# load-inferences: target/rdf/rdfox.ttl
# 	$(BG) -defaultGraph http://geneontology.org/rdf/inferred/ conf/blazegraph.properties $<

bg-start:
	java -server -Xmx8g -Dbigdata.propertyFile=conf/blazegraph.properties -jar $(BGJAR)
