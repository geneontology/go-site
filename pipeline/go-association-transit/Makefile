# GOAT Line
# 
# 1. Download sources
# 2. Gaferencer on GPAD/GAF sources, to make a gaferences
# 3. Pristine
# 4. ???
# 5. Profit?

DATASET_EXCLUDES ?= goa_uniprot_gcrp goa_pdb goa_uniprot_all
DATASET_EXCLUDES_PARAMETERS = $(foreach exclusion,$(DATASET_EXCLUDES),-x $(exclusion))

GO_SITE_ROOT = ../..
METADATA = $(GO_SITE_ROOT)/metadata

clean:
	rm -r target/* || true

OBO = http://purl.obolibrary.org/obo
ONTOLOGY ?= $(OBO)/go/snapshot/go.json

target/go-ontology.json:
	wget --no-check-certificate $(ONTOLOGY) -O $@.tmp && mv $@.tmp $@ && touch $@

# All gpad and gaf source files
# This will be used to compute the target "pristine" paths we want
# Looks like target/sources/[group]-src.gpad
SOURCES = $(wildcard target/sources/*-src.gpad) $(wildcard target/sources/*-src.gaf)

# To make a target, we need target/sources/[group]_valid.gpad
# notdir to get us [group]-src.(gpad|gaf)
# basename to get us [group]-src
# subst -src,_valid.gpad,[group]-src to get us [group]_valid.gpad
# addprefix to get us target/pristine/[group]_valid.gpad
PRISTINE = $(addprefix target/pristine/,$(subst -src,_valid.gpad,$(basename $(notdir $(SOURCES)))))

pristine: $(PRISTINE)

target/sources:
	python3 $(GO_SITE_ROOT)/scripts/download_source_gafs.py group mgi --datasets $(METADATA)/datasets -T target/sources --type gaf --type gpi --type gpad --zip-unzip

# create a _valid.gpad from a target/sources/*-src.(gpad|gaf)
# The build `source` variable grabs target/sources/*-src.gpad if it's there,
# otherwise it looks for target/sources/*-src.gaf
# Expressing this correctly as a real prerequisite seems difficult
target/pristine/%_valid.gpad: target/go-ontology.json
	$(eval source := $(if $(wildcard target/sources/$*-src.gpad),target/sources/$*-src.gpad,target/sources/$*-src.gaf))
	goat pristine -o target/go-ontology.json -t target/pristine $(source)
