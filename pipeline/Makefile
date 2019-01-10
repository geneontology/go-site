clean:
	rm -rf target/groups || true
	rm target/*.touch || true
	rm -rf target/noctua-models || true


METADATA_DIR=../metadata

DATASET_EXCLUDES ?= goa_uniprot_gcrp goa_pdb

# for each path in the shell `find`, get just the filename, then strip the extension for each group
# Ex: will end up being just the yaml file names in the datasets directory (aspgd mgi goa fb [etc])
# RESOURCE_GROUPS ?= goa aspgd wb
RESOURCE_GROUPS ?= $(foreach path,$(shell find $(METADATA_DIR)/datasets -name '*.yaml'),$(basename $(notdir $(path))))
# for each group, get the base target path from each gaf dataset in a group yaml.
# Ex: fb -> target/groups/fb/fb; goa -> target/groups/goa/goa_uniprot_all target/groups/goa/goa_chicken_complex [etc]
_ALL_BASE_DATASET_PATHS = $(foreach group,$(RESOURCE_GROUPS),$(addprefix target/groups/$(group)/,$(basename $(shell cat ../metadata/datasets/$(group).yaml | grep "id:.*gaf" | awk '{ print $$2 }'))))
# This turns the excludes into a filter pattern: goa_pdb -> %/goa_pdb
EXCLUSION_PATTERN = $(foreach excl,$(DATASET_EXCLUDES),%/$(excl))
# Filter out any path from _ALL_BASE_GROUP_PATHS that matches the exclusion
BASE_DATASET_PATH = $(filter-out $(EXCLUSION_PATTERN),$(_ALL_BASE_DATASET_PATHS) )
# produces the set of owltools-check.txt targets. One for each in the BASE_GROUP_PATH
# target/groups/fb/fb -> target/groups/fb/fb-owltools-check.txt, for everything in BASE_GROUP_PATH
OWLTOOLS_CHECKS = $(addsuffix -owltools-check.txt,$(BASE_DATASET_PATH))

# all owltools check groups. Will create the file to indicate we've done all groups before moving on.
target/groups.touch: $(OWLTOOLS_CHECKS)
	touch target/groups.touch

# produce just the gaf products and ttl, no owltools check
target/gafs.touch: $(foreach group,$(RESOURCE_GROUPS),target/groups/$(group)/$(group).group)
	touch target/gafs.touch

OBO= http://purl.obolibrary.org/obo
ONTOLOGY = $(OBO)/go/snapshot/go.json
target/go-ontology.json:
	wget --no-check-certificate $(ONTOLOGY) -O $@.tmp && mv $@.tmp $@ && touch $@


GAF_OWL = target/go-gaf.owl
$(GAF_OWL):
	owltools --log-error $(OBO)/go/extensions/go-gaf.owl --merge-imports-closure --add-obo-shorthand-to-properties -o $@

## Ensure that we are bringing in the environment we want.
OWLTOOLS_MEMORY ?= 8G
# blazegraph-runner memory
BGMEM ?= 12G

PY_ENV ?= target/env
PY_BIN ?= $(PY_ENV)/bin
VALIDATE = $(PY_BIN)/validate.py
DONT_VALIDATE = -x goa_uniprot_all $(foreach exclusion,$(DATASET_EXCLUDES),-x $(exclusion) )

# Should be something like target/groups/<group>/<group>.group
.PRECIOUS: %.gaf.gz
%.group: target/go-ontology.json
	mkdir -p $(dir $*) # Make the group directory
	# This will split each slash in the path to space separated list, then we pick the last one, the group directory
	# assigns a make variable called `group` computed from the $* generic target stem.
	# Ex: target/groups/fb/fb.gaf as a target, the stem ($*) is target/groups/fb/fb, so `group` gets assigned to fb
	$(eval group := $(lastword $(subst /, ,$*)))
	python3 $(VALIDATE) produce $(group) --gpad --ttl -m $(METADATA_DIR) --target target/ --ontology $< $(DONT_VALIDATE)
	touch $@

# dataset
%-owltools-check.txt: target/gafs.touch $(GAF_OWL)
	owltools --log-warning $(GAF_OWL) \
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

# ----------------------------------------------------------------------------------------
# goa_uniprot_all, I'm so sorry. This has to be special cased basically. This is so sad :(
# -----------------------------------------------------------------------------------------

GOA_UNIPROT_ALL = target/groups/goa/goa_uniprot_all_noiea.gpi target/groups/goa/goa_uniprot_all_noiea.gpad target/groups/goa/goa_uniprot_all_noiea_cam.ttl

# target/groups/goa/goa_uniprot_all.gaf.gz
target/groups/goa/goa_uniprot_all_noiea.gaf: target/alltaxons.txt target/groups/goa/goa_uniprot_all-src.gaf.gz
	gzip -dcf target/groups/goa/goa_uniprot_all-src.gaf.gz | ./util/goa_filter > target/groups/goa/goa_uniprot_all.gaf.tmp
	cat noiea > target/groups/goa/goa_uniprot_all_noiea.gaf && rm noiea && mv target/groups/goa/goa_uniprot_all.gaf.tmp target/groups/goa/goa_uniprot_all.gaf

RDF_GEN = $(PY_BIN)/rdfgen.py
target/groups/goa/goa_uniprot_all_noiea_cam.ttl: target/groups/goa/goa_uniprot_all_noiea.gaf
	python3 $(RDF_GEN) convert -a gaf -r target/go-ontology.json -o target/groups/goa/goa_uniprot_all_noiea_cam.ttl target/groups/goa/goa_uniprot_all_noiea.gaf

target/groups/goa/goa_uniprot_all_noiea.gpad: target/groups/goa/goa_uniprot_all_noiea.gaf
	owltools --log-error --gaf target/groups/goa/goa_uniprot_all_noiea.gaf --write-gpad -o target/groups/goa/goa_uniprot_all_noiea.gpad.tmp && mv target/groups/goa/goa_uniprot_all_noiea.gpad.tmp target/groups/goa/goa_uniprot_all_noiea.gpad

target/groups/goa/goa_uniprot_all_noiea.gpi: target/groups/goa/goa_uniprot_all_noiea.gaf
	owltools --log-error --gaf target/groups/goa/goa_uniprot_all_noiea.gaf --write-gpi -o target/groups/goa/goa_uniprot_all_noiea.gpi.tmp && mv target/groups/goa/goa_uniprot_all_noiea.gpi.tmp target/groups/goa/goa_uniprot_all_noiea.gpi

target/groups/goa/goa_uniprot_all_noiea-owltools-check.txt: target/groups/goa/goa_uniprot_all_noiea.gaf $(GOA_UNIPROT_ALL) $(GAF_OWL)
	gzip -dcf target/groups/goa/goa_uniprot_all_noiea.gaf.gz > target/groups/goa/goa_uniprot_all_noiea.gaf
	owltools --log-warning $(GAF_OWL) \
	--gaf target/groups/goa/goa_uniprot_all_noiea.gaf \
	--createReport \
	--gaf-report-file $*-owltools-check.txt \
	--gaf-report-summary-file $*-summary.txt \
	--gaf-prediction-file $*-prediction.gaf \
	--gaf-prediction-report-file $*-prediction-report.txt \
	--gaf-validation-unsatisfiable-module $*-incoherent.owl \
	--experimental-gaf-prediction-file $*-prediction-experimental.gaf \
	--experimental-gaf-prediction-report-file $*-prediction-experimental-report.txt \
	--gaf-run-checks || echo 'errors found'

# This comes from the groups target above, read directly from the metadata.
# This just converts to _noiea version of owltools
.PHONY: target/groups/goa/goa_uniprot_all-owltools-check.txt
target/groups/goa/goa_uniprot_all-owltools-check.txt: target/groups/goa/goa_uniprot_all_noiea-owltools-check.txt

GOA_UNIPROT_ALL_URL ?= $(shell grep -A 10 "id: goa_uniprot_all.gaf" ../metadata/datasets/goa.yaml | grep source: | awk '{ print $$2 }')
target/groups/goa/goa_uniprot_all-src.gaf.gz:
	mkdir -p target/groups/goa
	wget --retry-connrefused --waitretry=10 -t 10 --no-check-certificate $(GOA_UNIPROT_ALL_URL) -O $@.tmp && mv $@.tmp $@

target/alltaxons.txt:
	python3 util/model_organism.py taxons ../metadata/datasets/ --out target/alltaxons.txt

# -------------------------------
# RDF Graphstore
# -------------------------------
target/noctua-models:
	# If target/noctua-models does not exist, then clone it
	if [ ! -d target/nocuta-models ]; then git clone https://github.com/geneontology/noctua-models.git target/noctua-models; fi


ONT_MERGED = target/go-graphstore-merged.ttl
$(ONT_MERGED):
	owltools --log-error go-graphstore.owl --merge-imports-closure -o -f turtle $@
.PRECIOUS: $(ONT_MERGED)

target/rdf: $(ONT_MERGED) target/groups.touch
	mkdir -p target/rdf
	cp target/groups/*/*_cam.ttl target/rdf/

BGJAR = target/jars/blazegraph-jar.jar
$(BGJAR):
	mkdir -p target/jars && mvn package
.PRECIOUS: $(BGJAR)

# Load blazegraph
BG_PORT = 8899
METAGO = <http://model.geneontology.org/>
GO_GRAPHSTORE_URI = http://purl.obolibrary.org/obo/go/extensions/go-graphstore.owl
CAM_GRAPH_QUERY = '\
	PREFIX dc: <http://purl.org/dc/elements/1.1/> \
	SELECT ?source_graph \
	WHERE { \
		GRAPH ?source_graph { \
			?source_graph dc:title ?title . \
		} \
	}'
BG_PROPERTIES = conf/blazegraph.properties
LOAD_TARGETS = $(ONT_MERGED) target/rdf target/noctua-models/models

target/blazegraph.jnl: $(BGJAR) target/rdf target/noctua-models
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=target/blazegraph.jnl --properties=conf/blazegraph.properties load --use-ontology-graph $(LOAD_TARGETS)
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=target/blazegraph.jnl --properties=conf/blazegraph.properties reason --source-graphs-query=$(CAM_GRAPH_QUERY) --ontology=$(GO_GRAPHSTORE_URI) --append-graph-name="_inferred"

target/blazegraph-internal.jnl: target/blazegraph.jnl
	cp $< $@
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=$@ update sparql/insert/insert_noctua_metadata.sparql
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=$@ update sparql/insert/insert_ontology_metadata.sparql

target/blazegraph-production.jnl: target/blazegraph-internal.jnl
	cp $< $@
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=$@ update sparql/delete/delete_non_production.sparql

# $RANDOM goes from 0 to 32767, so adding to 10000 should generate a good range of ports.
port := $(shell env bash -c 'echo $$(($$RANDOM + 10000))' )
target/sparta-report.json: target/blazegraph-production.jnl
	PY_ENV=$(PY_ENV) ./triplestore-rulecheck.sh $(port) $< $@

bg-start:
	java -server -Xmx32g -Djetty.port=$(BG_PORT) -Djetty.overrideWebXml=conf/readonly_cors.xml -Dbigdata.propertyFile=conf/blazegraph.properties -cp target/jars/blazegraph-jar.jar:target/jars/jetty-servlets.jar com.bigdata.rdf.sail.webapp.StandaloneNanoSparqlServer
