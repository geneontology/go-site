all: clean README.md

README.md:
	../../scripts/generate-gorefs-summary.pl goref-*.md > $@.tmp && mv $@.tmp $@

clean:
	rm README.md*

