# SOP for creating new rules
GO Rules are a way of documenting the set of filters and reports that should apply
to GAF annotation data. Some rules are expressed as SPARQL on a triplestore, some
are code in the GAF parsing software, [ontobio](https://github.com/biolink/ontobio).

For advanced users who would like to see the python code can feel free to see the details
in the [ontobio/io](https://github.com/biolink/ontobio/tree/master/ontobio/io) directory
and in particular [ontobio/io/gafparser.py](https://github.com/biolink/ontobio/tree/master/ontobio/io/gafparser.py)

Rules are written in a YAML/Markdown combination format colloquially referred to as "yamldown".
This is because in Github YAML is rendered as HTML tables for easy reading in Markdown. The YAML
portion of rules have certain fields and are very important as these are machine read,
in particular by [SPARTA](https://github.com/geneontology/go-site/tree/master/graphstore/rule-runner)
rule SPARQL rule checker. You can use the following template and existing rules to get an idea of
how to format your Rule.

```
---
layout: rule
id: GORULE:nnnnnn
title: "SHORT DESCRIPTIVE TITLE"
type: filter/repair/report
fail_mode: soft/hard
status: proposed/approved/implemented/deprecated
contact: "go-quality@lists.stanford.edu" or your GITHUB handle for proposed rules
implementations:
---

DETAILED DESCRIPTION IN MARKDOWN FORMAT HERE

```

Read more about writing new Rules below.

## Information about `type`s:
- filter: This rule applies to individual lines in a GAF, and will throw out the line on a failure of the rule.
- repair: This rule applies to individual lines in a GAF, and will attempt to map a rule failure into compliance.
- report: This can apply individually or collectively as a SPARQL query.

## `status` definitions:
- proposed: To be used when first creating a GO Rule. When a new Rule is made inside a Pull Request
    for the go-site repository, it is considered to be "proposed". When the PR is approved and merged
    the status becomes `approved`.
- approved: A Rule that is Approved is an official GO Rule. It has been merged from
    a pull request and now everyone can see the Rule definition. When an a Rule has an implementation either in code
    or in some query that is run nominally in a semi-regular fashion and has active reports, it is considered `implemented`
- implemented: When a rule has an implementation that is actively run in some part of
    a pipeline or other regularly scheduled report. Having an implementation in some script
    that is never run regularly or that is run on old data does not count as `implemented`.
- legacy: A previous implementation still exists, but will be replaced by a new implementation matching the new pipeline (ontobio or SPARQL).    
- deprecated: If a rule is no longer needed, is conceptually incorrect, or otherwise should not be used
    it can be `deprecated`. A rule that is deprecated should have no active implementations being
    run on current data.

## `fail_mode` description:
- soft: In general this means the rule is a "warning" if broken, but ultimately not a show stopper.
    Soft generally applies to `report` type rules.
- hard: This means there is a real error in the GAF annotation data and should be fixed as soon as possible.
    Generally this will apply to `filter` and `repair` typed rules. If a repair or filter rule is failed it
    should mean that either the GAF line is removed (in the case of filter) or the offending data is removed
    in favor of computed correct data (in the case of repair). The main takeaway though is that the data will
    have been _changed_ by filter or repair rules.

## `tags` description:
Tags are a general mechanism for hinting to rule implementers about extra behavior implementations for the rule
should have beyond the formal description. If an implementer ignores a tag then the implementation isn't strictly
wrong data but its behavior may be unexpected or undesired. Conversely tags should not have an affect on how GO data
is processed directly. For example, if a tag would change what is considered valid, then that formulation should go
in the description of the rule itself. Tags also group similar behaviors across potentially many Rules.  This is a
controlled vocabulary, and only certain tags are allowed to be used and understood. Tag definitions will be listed here.

To specify a tag, add one of the listed tags below to the rule's `tags` field in a yaml list. More than one tag may be
used if they are each different from each other tag in the list for a rule.

- `silent`: The reporting output for this rule should not appear in standard readable locations. The full report including
the results of a silenced rule should still be accessible and written somewhere, even if not displayed for standard
consumption. For example, `GORULE:0000026` is `silent`. In Ontobio, errors from this rule are put in a JSON report but
not rendered into markdown and not included in the main reports normally read by consumers.
- `context-import`: Rule runners and implementers should _only_ run this rule in the context of a MOD import to Noctua. This is
considered a specialized, non-standard rule that should not be included in a standard rule processing run. Rules with
this tag should be run along with all other standard rules.

## New Rules
New rules should have an ID that is incrementally increased. We do not reuse old IDs that
are deprecated.

First create a ticket in this repo describing the desired rule. A
member of the godev team can help with creating the rule. To create it yourself:

In https://github.com/geneontology/go-site/tree/master/metadata/rules

Click "Create new file" and name it `gorule-nnnnnnn.md`. Make sure there are 7 digits in the ID and that it increments
from the current highest ID number. This ID should be the same as the `id` field.

Use an existing rule as a template

## Other Notes
Note: it is OK to create a stub entry and have a godev member help you
fill out the details. However, stub entries will not be merged until
completed. Note that not every rule is automatable. We use this system to document standard
manual QC checks.

Additional note: Even when your PR is merged, it will not show up in
the README.md summary. Someone needs to run `make` from this folder
(see [Makefile](Makefile). In future we may have a more automated
system.
