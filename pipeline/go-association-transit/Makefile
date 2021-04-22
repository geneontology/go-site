# GOAT Line
# 
# 1. Download sources
# 2. Gaferencer on GPAD/GAF sources, to make a gaferences
# 3. Pristine
# 4. ???
# 5. Profit?

DATASET_EXCLUDES ?= goa_uniprot_gcrp goa_pdb goa_uniprot_all paint_cgd paint_dictybase paint_ecocyc paint_goa_chicken paint_goa_human paint_other paint_rgd paint_sgd paint_tair paint_wb paint_zfin
DATASET_EXCLUDES_PARAMETERS = $(foreach exclusion,$(DATASET_EXCLUDES),-x $(exclusion))

GROUPS ?= mgi fb pombase paint
GROUPS_PARAMETERS = $(foreach group,$(GROUPS),-g $(group))

GO_SITE_ROOT = ../..
METADATA = $(GO_SITE_ROOT)/metadata

clean:
	rm -r target/* || true

OBO = http://purl.obolibrary.org/obo
ONTOLOGY ?= $(OBO)/go/snapshot/go.json

target/go-ontology.json:
	wget --no-check-certificate $(ONTOLOGY) -O $@.tmp && mv $@.tmp $@ && touch $@

target/sources:
	python3 $(GO_SITE_ROOT)/scripts/download-annotation-sources.py annotations --datasets $(METADATA)/datasets -T $@ $(DATASET_EXCLUDES_PARAMETERS) $(GROUPS_PARAMETERS) --zip-unzip

# All gpad and gaf source files
# This will be used to compute the target "pristine" paths we want
# Looks like target/sources/[group]-src.gpad
SOURCES_GPAD = $(wildcard target/sources/*-src.gpad)
SOURCES_GAF = $(wildcard target/sources/*-src.gaf)

# To make a target, we need target/sources/[group]_valid.gpad
# notdir to get us [group]-src.(gpad|gaf)
# basename to get us [group]-src
# subst -src,_valid.gpad,[group]-src to get us [group]_valid.gpad
# addprefix to get us target/pristine/(gpad|gaf)/[group]_valid.gpad
PRISTINE_GPAD = $(addprefix target/pristine/gpad/,$(subst -src,_valid.gpad,$(basename $(notdir $(SOURCES_GPAD)))))
PRISTINE_GAF = $(addprefix target/pristine/gaf/,$(subst -src,_valid.gpad,$(basename $(notdir $(SOURCES_GAF)))))
PRISTINE = $(PRISTINE_GPAD) $(PRISTINE_GAF)


pristine: $(PRISTINE)
	cp target/pristine/*/* target/pristine || true


target/pristine/gaf/%_valid.gpad: target/sources/%-src.gaf target/go-ontology.json
	goat pristine -o target/go-ontology.json -t target/pristine/gaf $<

target/pristine/gpad/%_valid.gpad: target/sources/%-src.gpad target/go-ontology.json
	goat pristine -o target/go-ontology.json -t target/pristine/gpad $<


