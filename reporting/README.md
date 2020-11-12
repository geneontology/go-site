# Rule Reports

Reports from Rules will use the JSON schema at [go-site/metadata/report.schema.json](../metadata/report.schema.json).

## Generating Rule Report Grid Page

To generate a reports page like at http://snapshot.geneontology.org/reports/gorule-report.html we need:
1. The collection of reports of GO Rule violations
2. A property to "group" the reports by (by default it's `dataset`, like `mgi` or `genedb_lmajor`). This is the set of horizontal headers along the grid. Reports MUST provide a default value in case a Message does not have value
3. Preferably a mapping of whatever value of grouping key above and a URL where we can find that link. For example for the current gorule-report page, we have: `dataset` ->`{base}/reports/{dataset}-report.html#rmd`.
4. Preferably a link to where we can find the specific violations for `(rule-id, grouping-key)`. For example in for teh current gorule-report page, we have: `{base}/reports/{dataset}-report.html#{rule-id}`.

This gets us to the gorule-reports.html page, like we have already.

## Expansions

Consider this section more proposal than requirements at this stage.

In our current setup, we generate outselves the JSON and the MD versions of the report. The Markdown versions are then rendered into HTML and joined with other HTML pages in the reports directory on skyhook/snapshot/et al. Since the process (ontobio) that produces both the JSON and the Markdown reports are the same -- *in this case* -- we can guarantee that what we want to see in the Markdown -> HTML is representative of the JSON. In Ontobio case, the MD report is created *from* the JSON report.

In this vein, I could foresee a way to generically produce a static HTML page of the reports like we see for a `dataset` or a specific rule now (see http://snapshot.geneontology.org/reports/fb-report.html#rmd for example) using just the report JSON, and not rely on the pre-existence of the MD -> HTML page.

This could look like a lot of things, but the basics of the layout is that only the individual error messages need be different for different error providers. For example the Shex reports have more data in each message, and that's good!

If a report provider also supplied a property called, say, `message-template` that conformed to the schema:
```
{
    "type": String,
}
```

And provided some template using the values of the keys in the given message, we could produce the MD/HTML page ourselves directly in the report handling procedures.

For example, our existing message could be templated as:
```
"{level} - {type}: {message} -- {line}"
```
