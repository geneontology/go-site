
VIEWS = prejoined-views \
graph-views \
obd-bridge \
information-content-views \
annotation-reports \
evidence-views \
stats-views \
taxon-views \
seq-views \
refgenomes-views \
homolset-views

VFILES = $(patsubst %,go-%.sql,$(VIEWS))
MFILES = $(patsubst %,materialize-go-%.mysql,$(VIEWS))

all: $(MFILES) all.sql all-mat.sql

recreate-all.sql: $(VFILES)
	./mk-combined.pl AUTOLOAD_VIEWS | ./mk-recreate-view.pl > $@

all.sql: $(VFILES)
	./mk-combined.pl AUTOLOAD_VIEWS > $@

all-mat.sql: $(MFILES)
	./mk-combined.pl AUTOLOAD_MATVIEWS > $@

materialize-%.mysql: %.sql
	./mk-materialize.pl $< > $@.tmp && mv $@.tmp $@

