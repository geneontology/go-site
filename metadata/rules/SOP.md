# SOP for creating new rules

First create a ticket in this repo describing the desired rule. A
member of the godev team can help with creating the rule. To create it yourself:

In
https://github.com/geneontology/go-site/tree/master/metadata/rules

Click "Create new file"

Use an existing rule as a template

```
---
layout: rule
id: GORULE:nnnnnn
type: filter/repair/report
title: "SHORT DESCRIPTIVE TITLE"
contact: "go-quality@mailman.stanford.edu" or your GITHUB handle for proposed rules
status: Proposed/Approved/Implemented/Deprecated
fail_mode: soft/hard
---

DETAILED DESCRIPTION IN MARKDOWN FORMAT HERE

```

Information about types:

    filter: This rule applies to individual lines in a GAF, and will throw out the line on a failure of the rule. 
    repair: This rule applies to individual lines in a GAF, and will attempt to map a rule failure into compliance.
    report: This can apply individually or collectively as a SPARQL query.


Note: it is OK to create a stub entry and have a godev member help you
fill out the details. However, stub entries will not be merged until
completed.

If you wish to have an automated rule, cc @dougli1sqrd. Note that not
every rule is automatable. We use this system to document standard
manual QC checks.

Additional note: Even when your PR is merged, it will not show up in
the README.md summary. Someone needs to run `make` from this folder
(see [Makefile](Makefile). In future we may have a more automated
system.
