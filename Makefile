
METADATA := users

all: $(patsubst %,kwalify-%,$(METADATA))

kwalify-%: metadata/%.yaml metadata/%.schema.yaml
	pykwalify --data-file $< --schema-file metadata/$*.schema.yaml
