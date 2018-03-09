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
title: "SHORT DESCRIPTIVE TITLE"
contact: YOUR GITHUB HANDLE
status: Proposed
---

DETAILED DESCRIPTION IN MARKDOWN FORMAT HERE

```

Note: it is OK to create a stub entry and have a godev member help you
fill out the details. However, stub entries will not be merged until
completed.

If you wish to have an automated rule, cc @dougli1sqrd. Note that not
every rule is automatable. We use this system to document standard
manual QC checks.

