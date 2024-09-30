clean:
	rm -rf target/groups || true
	rm target/*.touch || true
	rm -rf target/noctua-models || true


METADATA_DIR=../metadata

DATASET_EXCLUDES ?= goa_uniprot_gcrp goa_pdb

# The gorule tags used to identify which rules to suppress reports from
GORULE_TAGS_TO_SUPPRESS ?=

NOCTUA_MODELS_BRANCH_NAME ?= master

BRANCH_NAME ?= master
DOWNLOAD_URL_FOR_RELATIVE_PATHS = http://skyhook.berkeleybop.org/${BRANCH_NAME}/

# for each path in the shell `find`, get just the filename, then strip the extension for each group
# Ex: will end up being just the yaml file names in the datasets directory (aspgd mgi goa fb [etc])

# RESOURCE_GROUPS ?= goa aspgd wb
RESOURCE_GROUPS ?= $(foreach path,$(shell find $(METADATA_DIR)/datasets -name '*.yaml'),$(basename $(notdir $(path))))
# for each group, get the base target path from each gaf dataset in a group yaml.
# Ex: fb -> target/groups/fb/fb; goa -> target/groups/goa/goa_uniprot_all target/groups/goa/goa_chicken_complex [etc]
# _ALL_BASE_DATASET_PATHS = $(foreach group,$(RESOURCE_GROUPS),$(addprefix target/groups/$(group)/,$(basename $(shell cat ../metadata/datasets/$(group).yaml | grep "id:.*gaf" | awk '{ print $$2 }'))))

# This turns the excludes into a filter pattern: goa_pdb -> %/goa_pdb
# EXCLUSION_PATTERN = $(foreach excl,$(DATASET_EXCLUDES),%/$(excl))
# Filter out any path from _ALL_BASE_GROUP_PATHS that matches the exclusion
# datasets.py will read the metadata directory and compute the base paths to use based on exclusions and resource groups
BASE_DATASET_PATH = $(shell ../scripts/datasets.py paths --type gaf -d $(METADATA_DIR)/datasets -g '$(RESOURCE_GROUPS)' -x '$(DATASET_EXCLUDES)')
# produces the set of owltools-check.txt targets. One for each in the BASE_GROUP_PATH
# target/groups/fb/fb -> target/groups/fb/fb-owltools-check.txt, for everything in BASE_GROUP_PATH
OWLTOOLS_CHECKS = $(addsuffix -owltools-check.txt,$(BASE_DATASET_PATH))

# all owltools check groups. Will create the file to indicate we've done all groups before moving on.
target/groups.touch: $(OWLTOOLS_CHECKS)
	echo 'BASE_DATSET_PATH is $(BASE_DATASET_PATH)'
	echo $<
	touch target/groups.touch

# produce just the gaf products and ttl, no owltools check
target/gafs.touch: $(foreach group,$(RESOURCE_GROUPS),target/groups/$(group)/$(group).group)
	touch target/gafs.touch

OBO= http://purl.obolibrary.org/obo
ONTOLOGY ?= $(OBO)/go/snapshot/go.json
target/go-ontology.json:
	wget --no-check-certificate $(ONTOLOGY) -O $@.tmp && mv $@.tmp $@ && touch $@

target/go_context.jsonld:
	wget --no-check-certificate https://raw.githubusercontent.com/prefixcommons/biocontext/master/registry/go_context.jsonld -O $@.tmp && mv $@.tmp $@ && touch $@

target/obo_context.jsonld:
	wget --no-check-certificate https://raw.githubusercontent.com/prefixcommons/biocontext/master/registry/obo_context.jsonld -O $@.tmp && mv $@.tmp $@ && touch $@


GAF_OWL = target/go-gaf.owl
$(GAF_OWL):
	wget --no-check-certificate $(OBO)/go/snapshot/extensions/go-gaf.owl -O $@.tmp && mv $@.tmp $@ && touch $@

## Ensure that we are bringing in the environment we want.
OWLTOOLS_MEMORY ?= 8G
# blazegraph-runner memory
BGMEM ?= 12G

DONT_VALIDATE = -x goa_uniprot_all $(foreach exclusion,$(DATASET_EXCLUDES),-x $(exclusion) )
SUPPRESS_THESE_TAGS = $(foreach tag,$(GORULE_TAGS_TO_SUPPRESS),--suppress-rule-reporting-tag $(tag) )

.PRECIOUS: %.sources
%.sources:
	# See comment in %.groups on this construct
	$(eval group := $(lastword $(subst /, ,$*)))
	python3 ../scripts/download_source_gafs.py group $(group) -d $(METADATA_DIR)/datasets --target target/groups/$(group) --type gaf $(DONT_VALIDATE) --replace false --zip-unzip
	touch $*.sources

.PRECIOUS: %.gaferences.json
%.gaferences.json: $(GAF_OWL) target/go_context.jsonld target/obo_context.jsonld %.sources
	$(eval group := $(lastword $(subst /, ,$*)))
	python3 ../scripts/gaferencer-by-metadata.py group $(group) -d $(METADATA_DIR)/datasets --target target/groups/$(group) -c target/go_context.jsonld -c target/obo_context.jsonld --ontology $(GAF_OWL) --gafs target/groups/$(group) $(DONT_VALIDATE)

# Should be something like target/groups/<group>/<group>.group
.PRECIOUS: %.gaf.gz
%.group: target/go-ontology.json %.gaferences.json
	mkdir -p $(dir $*) # Make the group directory
	# This will split each slash in the path to space separated list, then we pick the last one, the group directory
	# assigns a make variable called `group` computed from the $* generic target stem.
	# Ex: target/groups/fb/fb.gaf as a target, the stem ($*) is target/groups/fb/fb, so `group` gets assigned to fb
	$(eval group := $(lastword $(subst /, ,$*)))
	validate.py -v produce $(group) --gpad-gpi-output-version "2.0" --gpad --ttl -m $(METADATA_DIR) --target target/ --ontology $< $(DONT_VALIDATE) $(SUPPRESS_THESE_TAGS) --skip-existing-files --gaferencer-file $*.gaferences.json --base-download-url ${DOWNLOAD_URL_FOR_RELATIVE_PATHS}
	touch $@

# dataset
%-owltools-check.txt: target/gafs.touch $(GAF_OWL)
	ls -l $(dir $*)
	gzip -dcf $*.gaf.gz > $*.gaf
	owltools --log-warning $(GAF_OWL) \
	--gaf $*.gaf \
	--createReport \
	--gaf-report-file $*-owltools-check.txt \
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
	gzip -dcf target/groups/goa/goa_uniprot_all-src.gaf.gz | ./util/goa_filter -v report=target/groups/goa/goa_uniprot_all_skipped.report -v noiea=target/groups/goa/goa_uniprot_all_noiea.gaf > target/groups/goa/goa_uniprot_all.gaf.tmp
	mv target/groups/goa/goa_uniprot_all.gaf.tmp target/groups/goa/goa_uniprot_all.gaf
	gzip -cf target/groups/goa/goa_uniprot_all.gaf > target/groups/goa/goa_uniprot_all.gaf.gz
	gzip -cf target/groups/goa/goa_uniprot_all_noiea.gaf > target/groups/goa/goa_uniprot_all_noiea.gaf.gz
	rm -f target/groups/goa/goa_uniprot_all-src.gaf target/groups/goa/goa_uniprot_all.gaf || true

RDF_GEN = rdfgen.py
target/groups/goa/goa_uniprot_all_noiea_cam.ttl: target/go-ontology.json target/groups/goa/goa_uniprot_all_noiea.gaf
	$(RDF_GEN) convert -a gaf -r target/go-ontology.json -o target/groups/goa/goa_uniprot_all_noiea_cam.ttl target/groups/goa/goa_uniprot_all_noiea.gaf
	gzip -cf target/groups/goa/goa_uniprot_all_noiea_cam.ttl > target/groups/goa/goa_uniprot_all_noiea_cam.ttl.gz

target/groups/goa/goa_uniprot_all_noiea.gpad: target/go-ontology.json target/groups/goa/goa_uniprot_all_noiea.gaf
	ontobio-parse-assocs.py -r target/go-ontology.json -f target/groups/goa/goa_uniprot_all_noiea.gaf -o target/groups/goa/goa_uniprot_all_noiea.gpad.tmp --report-md rep.md convert --to gpad && mv target/groups/goa/goa_uniprot_all_noiea.gpad.tmp target/groups/goa/goa_uniprot_all_noiea.gpad
	gzip -cf target/groups/goa/goa_uniprot_all_noiea.gpad > target/groups/goa/goa_uniprot_all_noiea.gpad.gz

target/groups/goa/goa_uniprot_all_noiea.gpi: target/groups/goa/goa_uniprot_all_noiea.gaf
	owltools --log-error --gaf target/groups/goa/goa_uniprot_all_noiea.gaf --write-gpi -o target/groups/goa/goa_uniprot_all_noiea.gpi.tmp && mv target/groups/goa/goa_uniprot_all_noiea.gpi.tmp target/groups/goa/goa_uniprot_all_noiea.gpi
	gzip -cf target/groups/goa/goa_uniprot_all_noiea.gpi > target/groups/goa/goa_uniprot_all_noiea.gpi.gz

target/groups/goa/goa_uniprot_all_noiea-owltools-check.txt: target/groups/goa/goa_uniprot_all_noiea.gaf $(GOA_UNIPROT_ALL) $(GAF_OWL)
	ls -l target/groups/goa/
	# gzip -dcf target/groups/goa/goa_uniprot_all_noiea.gaf.gz > target/groups/goa/goa_uniprot_all_noiea.gaf
	owltools --log-warning $(GAF_OWL) \
	--gaf target/groups/goa/goa_uniprot_all_noiea.gaf \
	--createReport \
	--gaf-report-file $*-owltools-check.txt \
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
	wget -nv --retry-connrefused --waitretry=10 -t 10 --no-check-certificate $(GOA_UNIPROT_ALL_URL) -O $@.tmp && mv $@.tmp $@

target/alltaxons.txt:
	python3 util/model_organism.py taxons ../metadata/datasets/ --out target/alltaxons.txt

# -------------------------------
# RDF Graphstore
# -------------------------------
target/noctua-models:
	# If target/noctua-models does not exist, then clone it
	# Modified for: https://github.com/geneontology/go-site/issues/2336
	if [ ! -d target/noctua-models ]; then git clone --no-tags --progress --depth 1 --single-branch --branch $(NOCTUA_MODELS_BRANCH_NAME) https://github.com/geneontology/noctua-models.git target/noctua-models; fi

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
	du -sh target
	du -sh target/*
	free -h
	ls -AlF /tmp
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=target/blazegraph.jnl --properties=conf/blazegraph.properties load --use-ontology-graph $(LOAD_TARGETS)
	du -sh target
	du -sh target/*
	free -h
	ls -AlF /tmp
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=target/blazegraph.jnl --properties=conf/blazegraph.properties reason --source-graphs-query=$(CAM_GRAPH_QUERY) --ontology=$(GO_GRAPHSTORE_URI) --append-graph-name="_inferred"
	du -sh target
	du -sh target/*
	free -h
	ls -AlF /tmp

target/blazegraph-internal.jnl: target/blazegraph.jnl
	cp $< $@
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=$@ update sparql/insert/insert_noctua_metadata.sparql
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=$@ update sparql/insert/insert_inferred_models_metadata.sparql
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=$@ update sparql/insert/insert_ontology_metadata.sparql
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=$@ update sparql/insert/insert_reflexive_subclass_closure.sparql

target/blazegraph-production.jnl: target/blazegraph-internal.jnl
	cp $< $@
	JAVA_OPTS=-Xmx$(BGMEM) blazegraph-runner --journal=$@ update sparql/delete/delete_non_production.sparql

# $RANDOM goes from 0 to 32767, so adding to 10000 should generate a good range of ports.
port := $(shell env bash -c 'echo $$(($$RANDOM + 10000))' )
target/sparta-report.json: target/blazegraph-production.jnl
	./triplestore-rulecheck.sh $(port) $< $@

bg-start:
	java -server -Xmx32g -Djetty.port=$(BG_PORT) -Djetty.overrideWebXml=conf/readonly_cors.xml -Dbigdata.propertyFile=conf/blazegraph.properties -cp target/jars/blazegraph-jar.jar:target/jars/jetty-servlets.jar com.bigdata.rdf.sail.webapp.StandaloneNanoSparqlServer
