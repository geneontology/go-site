clean:
	rm -rf target/*

METADATA_DIR=../metadata

GROUPS = $(foreach path,$(shell find $(METADATA_DIR)/datasets -name '*.yaml'),$(basename $(notdir $(path))))
groups: $(foreach group,$(GROUPS),target/groups/$(group)/$(group)-owltools-check.txt) target/groups/goa/goa_uniprot_all.gaf.gz

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


%_valid.gaf.gz %_noiea.gaf.gz %.gaf.gz %-src.gaf.gz %.gpad.gz %.gpi.gz %_cam.ttl.gz %.report.md %.report.json %-owltools-check.txt %-summary.txt %-prediction.gaf %-prediction-report.txt %-incoherent.owl %-prediction-experimental.gaf %-prediction-experimental-report.txt : target/go-ontology.json
	python3 $(VALIDATE) produce $(notdir $*) --gpi --gpad --ttl -m $(METADATA_DIR) --target target/ --ontology $< $(EXCLUDES)
	rm $(dir $*)*.gpad $(dir $*)*.gpi $(dir $*)*.ttl
	owltools --log-warning $(GAF_OWL) \
	--gaf blah.gaf \
	--createReport \
	--gaf-report-file $(notdir $*)-owltools-check.txt \
	--gaf-report-summary-file $(notdir $*)-summary.txt \
	--gaf-prediction-file $(notdir $*)-prediction.gaf \
	--gaf-prediction-report-file $(notdir $*)-prediction-report.txt \
	--gaf-validation-unsatisfiable-module $(notdir $*)-incoherent.owl \
	--experimental-gaf-prediction-file $(notdir $*)-prediction-experimental.gaf \
	--experimental-gaf-prediction-report-file $(notdir $*)-prediction-experimental-report.txt \
	--gaf-run-checks || echo 'errors found'
	rm -f $*.gaf


target/groups/goa/goa_uniprot_all.gaf.gz target/groups/goa_uniprot_all/goa_uniprot_all_noiea.gaf.gz : target/alltaxons.txt target/groups/goa/goa_uniprot_all-src.gaf.gz
	gzip -dcf target/groups/goa/goa_uniprot_all-src.gaf.gz | ./util/goa_filter | gzip -c > $@.tmp
	cat noiea | gzip -cf > target/groups/goa/goa_uniprot_all_noiea.gaf.gz && rm noiea  && mv $@.tmp $@

GOA_URL := $(shell grep -A 10 "id: goa_uniprot_all.gaf" ../metadata/datasets/goa.yaml | grep source: | awk '{ print $$2 }')
target/groups/goa/goa_uniprot_all-src.gaf.gz:
	mkdir -p target/groups/goa
	wget --retry-connrefused --waitretry=10 -t 10 --no-check-certificate $(GOA_URL) -O $@.tmp && mv $@.tmp $@

target/alltaxons.txt:
	python3 util/model_organism.py taxons ../metadata/datasets/ --out target/alltaxons.txt
