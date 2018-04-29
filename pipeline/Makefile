clean:
	rm -rf target/*

METADATA_DIR=../metadata

# for each path in the shell `find`, get just the filename, then strip the extension for each group
GROUPS = $(foreach path,$(shell find $(METADATA_DIR)/datasets -name '*.yaml'),$(basename $(notdir $(path))))
# for each group, get the base target path from each gaf dataset in a group yaml.
BASE_GROUP_PATH = $(foreach group,$(GROUPS),$(addprefix target/groups/$(group)/,$(basename $(shell cat ../metadata/datasets/$(group).yaml | grep "id:.*gaf" | awk '{ print $$2 }'))))
# produces the set of owltools-check.txt targets. One for each in the BASE_GROUP_PATH
GAFCHECKS = $(addsuffix -owltools-check.txt,$(BASE_GROUP_PATH))

# all owltools check groups
groups: $(GAFCHECKS)

# produce just the gaf products and ttl, no owltools check
gafs: $(addsuffix .gaf.gz,$(BASE_GROUP_PATH))

OBO= http://purl.obolibrary.org/obo
ONTOLOGY = $(OBO)/go/snapshot/go.json
target/go-ontology.json:
	wget --no-check-certificate $(ONTOLOGY) -O $@.tmp && mv $@.tmp $@ && touch $@


GAF_OWL = target/go-gaf.owl
$(GAF_OWL):
	owltools --log-error $(OBO)/go/extensions/go-gaf.owl --merge-imports-closure --add-obo-shorthand-to-properties -o $@

PY_ENV ?= target/env
PY_BIN ?= $(PY_ENV)/bin
VALIDATE = $(PY_BIN)/validate.py
EXCLUDES = -x goa_uniprot_all -x goa_uniprot_gcrp -x goa_pdb

.PRECIOUS: %.gaf.gz
%_valid.gaf.gz %_noiea.gaf.gz %.gaf.gz %-src.gaf.gz %.gpad.gz %.gpi.gz %_cam.ttl.gz %.report.md %.report.json: target/go-ontology.json
	mkdir -p $(dir $*) # Make the group directory
	# This will split each slash in the path to space separated list, then we pick the last one, the group directory
	$(eval group := $(lastword $(subst /, ,$(dir $*))))
	python3 $(VALIDATE) produce $(group) --gpi --gpad --ttl -m $(METADATA_DIR) --target target/ --ontology $< $(EXCLUDES)
	rm $(dir $*)*.gaf $(dir $*)*.gpad $(dir $*)*.gpi

# %-summary.txt %-prediction.gaf %-prediction-report.txt %-incoherent.owl %-prediction-experimental.gaf %-prediction-experimental-report.txt
%-owltools-check.txt: %.gaf.gz $(GAF_OWL)
	gzip -dcf $< > $*.gaf
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
	rm -f $*.gaf

target/groups/goa/goa_uniprot_all.gaf.gz target/groups/goa/goa_uniprot_all_noiea.gaf.gz : target/alltaxons.txt target/groups/goa/goa_uniprot_all-src.gaf.gz
	gzip -dcf target/groups/goa/goa_uniprot_all-src.gaf.gz | ./util/goa_filter | gzip -c > $@.tmp
	cat noiea | gzip -cf > target/groups/goa/goa_uniprot_all_noiea.gaf.gz && rm noiea  && mv $@.tmp $@

GOA_URL := $(shell grep -A 10 "id: goa_uniprot_all.gaf" ../metadata/datasets/goa.yaml | grep source: | awk '{ print $$2 }')
target/groups/goa/goa_uniprot_all-src.gaf.gz:
	mkdir -p target/groups/goa
	wget --retry-connrefused --waitretry=10 -t 10 --no-check-certificate $(GOA_URL) -O $@.tmp && mv $@.tmp $@

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
	OWLTOOLS_MEMORY=12G owltools --log-error go-graphstore.owl --merge-imports-closure -o -f turtle $@
.PRECIOUS: $(ONT_MERGED)

target/rdf: $(ONT_MERGED) groups
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
	blazegraph-runner --journal=target/blazegraph.jnl --properties=conf/blazegraph.properties load --use-ontology-graph $(LOAD_TARGETS)
	blazegraph-runner --journal=target/blazegraph.jnl --properties=conf/blazegraph.properties reason --source-graphs-query=$(CAM_GRAPH_QUERY) --ontology=$(GO_GRAPHSTORE_URI) --append-graph-name="_inferred"

target/blazegraph-internal.jnl: target/blazegraph.jnl
	cp $< $@
	blazegraph-runner --journal=$@ update sparql/insert/insert_noctua_metadata.sparql
	blazegraph-runner --journal=$@ update sparql/insert/insert_ontology_metadata.sparql

target/blazegraph-production.jnl: target/blazegraph-internal.jnl
	cp $< $@
	blazegraph-runner --journal=$@ update sparql/delete/delete_non_production.sparql

target/sparta-report.json: target/blazegraph-production.jnl
	PY_ENV=$(PY_ENV) ./triplestore-rulecheck.sh 8898 $< $@

bg-start:
	java -server -Xmx32g -Djetty.port=$(BG_PORT) -Djetty.overrideWebXml=conf/readonly_cors.xml -Dbigdata.propertyFile=conf/blazegraph.properties -cp target/jars/blazegraph-jar.jar:target/jars/jetty-servlets.jar com.bigdata.rdf.sail.webapp.StandaloneNanoSparqlServer
