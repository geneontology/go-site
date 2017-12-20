OBO= http://purl.obolibrary.org/obo
METADATA_DIR=../metadata/datasets
REPORT=target/combined.report.md
RDFOX_MEM ?= 32G
GAF_OWL = target/go-gaf.owl
ONT_MERGED = target/go-graphstore-merged.ttl
PY_ENV ?= target/env
PY_BIN ?= $(PY_ENV)/bin


all: target/Makefile extra_files $(REPORT)

all_blazegraph: all target/blazegraph.jnl

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
extra_files: $(GAF_OWL) target/go.obo target/datasets-metadata.json

# TODO - update
target/datasets-metadata.json:
	python3 ../scripts/combine-datasets-metadata.py ../metadata/datasets/*yaml > $@.tmp && mv $@.tmp $@

target/go.obo:
	wget --no-check-certificate $(OBO)/go.obo -O $@.tmp && mv $@.tmp $@ && touch $@

ONTOLOGY = $(OBO)/go/snapshot/go.json
target/go-ontology.json:
	wget --no-check-certificate $(ONTOLOGY) -O $@.tmp && mv $@.tmp $@ && touch $@

# target/GO.xrf_abbs:
#	node ../scripts/db-xrefs-yaml2legacy.js  -i ../metadata/db-xrefs.yaml  > $@.tmp && mv $@.tmp $@

proc:
	python3 ./util/dataset-metadata-processor.py $(METADATA_DIR)/*.yaml

# ----------------------------------------
# OWLTools checks
# ----------------------------------------

$(GAF_OWL):
	owltools --log-error $(OBO)/go/extensions/go-gaf.owl --merge-imports-closure --remove-annotation-assertions -l -r --add-obo-shorthand-to-properties -o $@

CATALOG_DETAILS=

PARSE_ASSOCS = $(PY_BIN)/ontobio-parse-assocs.py
RDF_GEN = $(PY_BIN)/rdfgen.py

%-owltools-check.txt: %.gaf.gz $(GAF_OWL)
	gzip -dcf $< > $*.gaf
	owltools --log-warning $(CATALOG_DETAILS) $(GAF_OWL) \
	--gaf $*.gaf \
	--createReport \
	--gaf-report-file $*-owltools-check.txt \
	--gaf-report-summary-file $*-summary.txt \
	--gaf-prediction-file $*-prediction.gaf \
	--gaf-prediction-report-file $*-prediction-report.txt \
	--gaf-validation-unsatisfiable-module $*-incoherent.owl \
	--experimental-gaf-prediction-file $*-prediction-experimental.gaf \
	--experimental-gaf-prediction-report-file $*-prediction-experimental-report.txt \
	--gaf-run-checks || echo 'errors found'
	rm -f $*.gaf

%.gaf.gz: %-src.gaf.gz target/go-ontology.json
	gzip -dcf $< > $*-src.gaf
	python3 $(PARSE_ASSOCS) -r target/go-ontology.json --filter-out IEA --filtered-file $*_noiea.gaf -f $*-src.gaf -o $*.gaf --report-md $*.report.md --report-json $*.report.json validate
	rm $*-src.gaf
	gzip -f $*_noiea.gaf
	gzip -f $*.gaf

%.gpad.gz: %.gaf.gz
	gzip -dcf $< > $*.gaf
	owltools --log-error --gaf $*.gaf --write-gpad -o $*.gpad.tmp && mv $*.gpad.tmp $*.gpad
	rm $*.gaf
	gzip -f $*.gpad

%.gpi.gz: %.gaf.gz
	gzip -dcf $< > $*.gaf
	owltools --log-error --gaf $*.gaf --write-gpi -o $*.gpi.tmp && mv $*.gpi.tmp $*.gpi
	rm $*.gaf
	gzip -f $*.gpi

%_cam.ttl: %.gaf.gz $(ONT_MERGED)
	gzip -dcf  $< > $*.gaf
	python3 $(RDF_GEN) convert -a gaf -r target/go-ontology.json -o $*_cam.ttl $*.gaf
	gzip -cf $@ > $@.gz
	rm $*.gaf

%_inferred.ttl: %_cam.ttl
	mkdir -p target/inferred
	arachne --ontology=$(ONT_MERGED) --data=$< --export=$@ --inferred-only

# Specific rule for goa_uniprot_all
target/groups/goa_uniprot_all/goa_uniprot_all.gaf.gz: target/alltaxons.txt target/groups/goa_uniprot_all/goa_uniprot_all-src.gaf.gz
	gzip -dcf target/groups/goa_uniprot_all/goa_uniprot_all-src.gaf.gz | head -n 20000000 | ./util/goa_filter | gzip -c > $@

target/alltaxons.txt:
	python3 util/model_organism.py taxons ../metadata/datasets/ --out target/alltaxons.txt

# ----------------------------------------
# Makefile for building GAFs
# ----------------------------------------
# this defines 'all_targets'
target/Makefile: ./util/generate-makefile.py
	mkdir -p target
	python3 $< ../metadata/datasets/*.yaml > $@.tmp && mv $@.tmp $@

include target/Makefile

$(REPORT): target/Makefile all_targets
	cat target/groups/*/*.report.md > $@

target/noctua-models:
	# If target/noctua-models does not exist, then clone it
	if [ ! -d target/nocuta-models ]; then git clone https://github.com/geneontology/noctua-models.git target/noctua-models; fi

# ----------------------------------------
# RDF
# ----------------------------------------


$(ONT_MERGED):
	OWLTOOLS_MEMORY=12G owltools --log-error go-graphstore.owl --merge-imports-closure -o -f turtle $@
.PRECIOUS: $(ONT_MERGED)

# $(REPORT)
target/rdf: $(ONT_MERGED)
	mkdir -p target/rdf
	cp target/groups/*/*_cam.ttl target/rdf/

BGJAR = target/jars/blazegraph-jar.jar
$(BGJAR):
	mkdir -p target/jars && mvn package
.PRECIOUS: $(BGJAR)

BGMEM ?= 32G
BG = java -server -XX:+UseG1GC -Xmx$(BGMEM) -cp $(BGJAR) com.bigdata.rdf.store.DataLoader

# Load blazegraph

BG_PORT = 8899
METAGO = <http://model.geneontology.org/>
GO_GRAPHSTORE_URI = http://purl.obolibrary.org/obo/go/extensions/go-graphstore.owl
CAM_GRAPH_QUERY = 'PREFIX metago: $(METAGO) SELECT ?source_graph WHERE { { SELECT DISTINCT ?source_graph WHERE { GRAPH ?source_graph { ?s ?p ?o . } } } FILTER (?source_graph != <$(GO_GRAPHSTORE_URI)>) FILTER NOT EXISTS { ?source_graph metago:graphType metago:gafCam . } }'
BG_PROPERTIES = conf/blazegraph.properties
LOAD_TARGETS = $(ONT_MERGED) target/rdf target/noctua-models/models


target/blazegraph.jnl: $(BGJAR) target/rdf target/noctua-models
	blazegraph-runner --journal=target/blazegraph.jnl --properties=conf/blazegraph.properties load --use-ontology-graph $(LOAD_TARGETS)
	blazegraph-runner --journal=target/blazegraph.jnl --properties=conf/blazegraph.properties reason --source-graphs-query=$(CAM_GRAPH_QUERY) --ontology=$(GO_GRAPHSTORE_URI) --append-graph-name="_inferred"

target/blazegraph-internal.jnl: target/blazegraph.jnl
	cp $< $@
	blazegraph-runner --journal=$@ update sparql/insert/insert_inferred_graph_link.sparql
	blazegraph-runner --journal=$@ update sparql/insert/insert_noctua_metadata.sparql
	blazegraph-runner --journal=$@ update sparql/insert/insert_ontology_metadata.sparql

target/blazegraph-production.jnl: target/blazegraph-internal.jnl
	cp $< $@
	blazegraph-runner --journal=$@ update sparql/delete/delete_non_production.sparql

target/sparta-report.json: target/blazegraph-production.jnl
	PY_ENV=$(PY_ENV) ./triplestore-rulecheck.sh 8898 $< $@

#
# load-inferences: target/rdf/rdfox.ttl
# 	$(BG) -defaultGraph http://geneontology.org/rdf/inferred/ conf/blazegraph.properties $<

bg-start:
	java -server -Xmx32g -Djetty.port=$(BG_PORT) -Djetty.overrideWebXml=conf/readonly_cors.xml -Dbigdata.propertyFile=conf/blazegraph.properties -cp target/jars/blazegraph-jar.jar:target/jars/jetty-servlets.jar com.bigdata.rdf.sail.webapp.StandaloneNanoSparqlServer
