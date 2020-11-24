# Rule Reports

Reports from Rules will use the JSON schema at [go-site/metadata/report.schema.json](../metadata/report.schema.json).

For the interoperability of all GO related groups who would like to make and display reports, we provide a standard report JSON schema and tools.

## Current Usage

Currently as a product of annotation validation in the GO pipeline we produce report JSON files for each dataset of annotations. These reports are focused on GO Rule violations. The validation process also produces markdown files with the same data as the JSON reports but intended for more human consumption. Markdown reports are fed through an HTML renderer and joined with other reports producing a static HTML page with human readable reports, featuring GO Rules.

To make it easy for people to see a broader view of the rules we provide a GO Rules "grid" report, where we join all JSON reports, and make a table mapping (Rule, Dataset) to number of violations that dataset has for that rule. Links to the rule, the report page for the dataset, and the specific reports for the rule are all provided on the Rule Id, Dataset name header, and the cell with the number of violations respectively.

Thinking ahead to some future, we could generalize the reporting rule system including a number of use-case.

1. Single JSON format general enough to capture a variety of domains
    * GAFs, GO-CAM models, etc
2. One central GO reporting python library to handle collection of reports, templates, etc, to be used by other groups creating reports for GO.
3. Ability to produce a "grid" view like the current [go-rules report page](http://snapshot.geneontology.org/reports/gorule-report.html) for different types of reports.
4. Beside `3)`, generalize the grid view by different columns. The grid view should be able to group reports by arbitrary keys in the message data, specified by the report JSON.
5. Dynamic, report provider driven rendering of underlying HTML/Markdown report pages.
    * For example, in the report JSON, a message render template could be provided, and a Markdown/HTML page could be generated given the template and the report JSON.
    * Gives us the ability to create and link to any report dynamically.

## Generalizing Reports for Other GO report sources

### Report JSON format

The report JSON should have a corresponding schema that allows for a variety of sources and uses of reports. The schema should allow interoperability between reports. A JSON schema should validate multiple types of reports from different providers, and so be general to capture different types of data being validated (GAF/GPAD, GO-CAM, etc)

### One Central Reporting Library

Currently Ontobio has an ad-hoc, mostly specific to ontobio reporting system. A reporting library for use in any GO context should be made that can be general purpose. Ontobio can then depend on that library. This would have features like:
    * Standardized JSON output, guaranteeing conforming to the above schema
    * Standard way of reporting messages of different severity levels, with standardized fields, in a way that's idiomatic for python.
    * General to different contexts that may want to produce reports given some set of "Rules"

### Produce a Grid View ([go-rules report page](http://snapshot.geneontology.org/reports/gorule-report.html))

This is fundamentally a set of headers, a set of rules, and each cell is the number of messages/violations for that rule and header.

The header corresponds to a key in the Message, and all messages that share keys of the value in the header correspond to that column. In this way we can generalize the header, and what we group messages by. This is the `groupable-keys` field at the top level of the [draft report schema](../metadata/draft-report.schema.json).

In the Report format, the messages may not literally have the key, but maybe all messages in a given report JSON document are said to have some property given in the top level of the report. For example, in the existing go-rules reports, the key `dataset` is given at the top. In the generalized future, we would *normalize* each message with this `dataset` key in the given document, so when generating a grid view with `dataset` as the header, we can correctly select among the messages with the matching `dataset` value.

To generate a reports page like at http://snapshot.geneontology.org/reports/gorule-report.html we need:
1. The collection of reports of GO Rule violations
2. A property to "group" the reports by (by default it's `dataset`, like `mgi` or `genedb_lmajor`). This is the set of horizontal headers along the grid. Reports MUST provide a default value in case a Message does not have value
3. Preferably a mapping of whatever value of grouping key above and a URL where we can find that link. For example for the current gorule-report page, we have: `dataset` ->`{base}/reports/{dataset}-report.html#rmd`.
4. Preferably a link to where we can find the specific violations for `(rule-id, grouping-key)`. For example in for the current gorule-report page, we have: `{base}/reports/{dataset}-report.html#{rule-id}`.

This gets us to the gorule-reports.html page, like we have already. Since in this conception, headers are generalized and provided by the reports, we can generate a grid for any set of existing "groupable" header keys against the go-rules.

As a note on implementation details: generating grid views with different header columns could be done by just producing different HTML pages: `gorule-report.dataset.html`, `gorule-report.taxon.html` or something. Alternatively, since we have the the JSON data either way, a slightly fancier javascript rendering where you can just select which header you want live, and the rebuilding of the table happens within the web page live. No outside web requests would be needed still.

### Dynamic rendering of reports

If reports came with a custom template that would take a Message JSON blob and turn it into a single Markdown string, then the reporting library could generate the more user friendly listing of messages, as defined by the template and the general page layout already used by the existing GO Rule reports. See [snapshot fb-report.html](http://snapshot.geneontology.org/reports/fb-report.html#rmd) for an example of the layout.

This would then let the generic Grid View generator also link to the auto-generated detailed reports, and it wouldn't necessarily have to rely on an existing report page somewhere. For instance, in making the GO Rule Grid View, we first produce all the HTML report pages (like the fb-report.html above), and then make the Grid View page with that link in mind.

An example template from our current usage could look like:
```
"{level} - {type}: {message} -- {line}"
```

## Aspirational Reporting Process

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

1. Merge all given messages by Rule
    * The merging occurs by placing keys and their values that occur in the top level of the report that are beyond the required keys into each Message seen for the given report.
    * For example, the existing reports have `group` and `dataset` and keys. For `"group": "mgi"`, we would place `"group": "mgi"` in each Message object, along with `group`, or any other key.
    * The `rule` value will be replaced with the full ID it appears in.
    * Messages from other reports have their messages normalized in this way, and then messages within each rule can be added from multiple files.
2. We can now easily merge all given report JSON together, since each message blob has the same keys.
3. Produce the grid data with the total Merged data that will be placed into the HTML template.
    * We could also produce an HTML template for each `grouping-key` item.
4. *Do we produce a templated HTML for each `entity-type`?*
5. For the more expanded, advanced proposal, we can generate a `{grouping-key}.report.md` file as a human-readable report using the `message-template` in the report. The produced templated HTML can now link to those produced report files.

As a very concrete example of step 1 above:

```
my-report.json
{
    "entities": 2,
    "errors": 0,
    "valid-entities": 2,
    "groupable-keys": [
        {
            "key":"taxon",
            "default": "taxon:0"
        },
        {
            "key": "group",
            "default": "unknown"
        }
    ],
    "group": "rebels",
    "messages": {
        "gorule-0000001": [
            {
                "level": "WARNING",
                "entity": "I'm\ta\tGAF\tline",
                "type": "Violates GO Rule",
                "message": "This is an error message",
                "rule": 1,
                "taxon": "taxon:12345"
            }
        ]
    }
}
```

The message in `gorule-0000001` would be *merged* to be:

```
{
    "level": "WARNING",
    "entity": "I'm\ta\tGAF\tline",
    "type": "Violates GO Rule",
    "message": "This is an error message",
    "rule": 1,
    "taxon": "taxon:12345",
    "group": "rebels"
}
```

The key `group` is taken from the top level. Open question of if we want to convert `rule` to be the actual rule ID, `gorule-0000001`.
