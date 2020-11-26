
## See SOP.md for details
## We generate a README by prepending ABOUT.md onto all concatenated rules
README.md: ABOUT.md
	../../scripts/generate-gorules-summary.pl gorule-*.md > $@.tmp && cat ABOUT.md $@.tmp > $@
	rm $@.tmp
