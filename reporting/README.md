# Rule Reports

Reports from Rules will use the JSON schema at [go-site/metadata/report.schema.json](../metadata/report.schema.json).

For the interoperability of all GO related groups who would like to make and display reports, we provide a standard report JSON schema and tools.

## Current Usage

Currently as a product of annotation validation in the GO pipeline we produce report JSON files for each dataset of annotations. These reports are focused on GO Rule violations. The validation process also produces markdown files with the same data as the JSON reports but intended for more human consumption. Markdown reports are fed through an HTML renderer and joined with other reports producing a static HTML page with human readable reports, featuring GO Rules.

To make it easy for people to see a broader view of the rules we provide a GO Rules "grid" report, where we join all JSON reports, and make a table mapping (Rule, Dataset) to number of violations that dataset has for that rule. Links to the rule, the report page for the dataset, and the specific reports for the rule are all provided on the Rule Id, Dataset name header, and the cell with the number of violations respectively.

## Generalizing Reports for Other GO report sources

### Report JSON format

The report JSON should have a corresponding schema that allows for a variety of sources and uses of reports. But if it's a GO report, it should all be in the same format, allowing for interoperability. A JSON schema should validate multiple types of reports.

### HEllo

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

But this could be more sophisticated too.

*Make more of the docs based on use cases*

## Reporting Process

Given:
1. A collection of report JSON files
2. Path to GO Rules specs
3. Mapping of `{grouping-key} -> (group-URL, group-rule-URL)` where `group-URL` is a URL that points to the messages in that group key, and `group-rule-URL` is a URL that points to a the collection of messages in that group corresponding to that GO Rule.
    * (The above URLs could be in the report itself, in `report-url`)
    * The URL could be templated. Use `{base}` at the beginning of a URL to make a relative path
    * Use `{group}` for substituting the value of the `{grouping-key}`
    * Use `{ruleid}` for substituting the value of the GO Rule ID
    * Should conform to [RFC6570](https://tools.ietf.org/html/rfc6570), and variables are assumed to be in the level 2 template.
    * Examples:
        * `https://example.com/reports/{group}`
        * `https://example.com/reports/{group}#{ruleid}`
        * `{base}/reports/{group}#{ruleid}`


### Process

1. Normalize all given messages by Rule
    * The normalize occurs by placing keys and their values that occur in the top level of the report that are beyond the required keys into each Message seen for the given report.
    * For example, the existing reports have `group` and `dataset` and keys. For `"group": "mgi"`, we would place `"group": "mgi"` in each Message object, along with `group`, or any other key.
    * The `rule` value will be replaced with the full ID it appears in.
    * Messages from other reports have their messages normalized in this way, and then messages within each rule can be added from multiple files.
2. We can now easily merge all given report JSON together.
3. Produce the grid data with the total Merged data that will be placed into the HTML template.
    * We could also produce an HTML template for each `grouping-key` item.
4. *Do we produce a templated HTML for each `entity-type`?*
5. For the more expanded, advanced proposal, we can generate a `{grouping-key}.report.md` file as a human-readable report using the `message-template` in the report. The produced templated HTML can now link to those produced report files.
