"""
Render GO-CAM statistics reports as HTML (and TSV) from the JSON outputs of
``gocam-py/pipeline/output_stats_for_gocam_models.py``.

Example
-------
    python3 ./scripts/reports-go-cam-stats.py \
        --directory /path/to/go_cam_stats_output \
        --template  ./scripts/go-cam-stats-template.html \
        --template-records ./scripts/go-cam-records-template.html \
        --output    /path/to/output \
        --metadata  /path/to/metadata \
        --resource  /path/to/go.json

What
----
This script consumes the JSON files emitted by ``output_stats_for_gocam_models``
and renders Mustache-templated HTML reports (plus a TSV companion for the
protein-complex activities list). The aggregate report uses a three-column
layout — ``Statistic | Total | Unique`` — where the Unique cell, when non-empty,
hyperlinks to a small per-statistic page that lists the actual unique entries.

Inputs (under ``--directory``)
------------------------------
- ``aggregate_model_stats.json`` — required. A single ``AggregateInfo`` dump
  with both numeric counts and unique-entry collections used to power the
  aggregate page and its drilldown pages. The upstream producer
  (``output_stats_for_gocam_models.py``) emits count fields without the old
  ``number_of_`` / ``total_number_of_`` prefix; three fields where a count
  and a Set would otherwise collide use a ``list_of_unique_`` prefix on the
  Set side. Relevant fields:

    * ``activity_units_enabled_by_gene_product_association``    (total count)
    * ``unique_enabled_by_gene_product``                        (Set — drilldown entries)
    * ``activity_units_enabled_by_protein_complex_association`` (total count)
    * ``unique_protein_complex_in_activity_term``               (Set — semantically the unique entries of ``list_enabled_by_protein_complex``)
    * ``unique_member_protein_complex_genes``                   (count)
    * ``list_of_unique_protein_complex_genes``                  (Set — drilldown entries; renamed to disambiguate from the int count ``unique_protein_complex_genes`` on per-entity records)
    * ``chemical_inputs`` / ``unique_chemical_inputs`` and counterparts for other inputs / chemical outputs / other outputs (all counts)
    * ``list_has_input_term`` / ``list_has_output_term``        (sources for the input/output unique drilldown pages)
    * ``go_terms`` / ``unique_go_terms`` / ``list_go_terms``    (counts + source list)
    * ``unique_references``                                     (count)
    * ``list_of_unique_references``                             (Set — drilldown entries; renamed to disambiguate from the count)
    * ``unique_pmid``                                           (count)
    * ``total_inferred_relations``                              (count)
- ``stats_by_curator/stats_by_curator_*.json`` — optional. Each file is a
  ``GocamStats`` dump for one curator.
- ``stats_by_group/stats_by_group_*.json`` — optional. ``GocamStats`` per group.
- ``aggregate_protein_complex.json`` — optional, drives the Protein Complex
  Activities record-oriented table (with TSV).
- ``member_variable_definitions.json`` — optional, drives the variable
  definitions page.
- ``gene_id_to_label.json`` — optional. Flat ``{id: label}`` map used to
  populate the ``label`` column on gene-valued drilldown pages (gene product
  enablers, protein complex member genes, other inputs, other outputs).
  Keyed by curie-style IDs such as ``UniProtKB:P00387`` or ``FB:FBgn0000566``.
- ``chebi_id_to_label.json`` — optional. Flat ``{id: label}`` map used to
  populate the ``label`` column on chemical drilldown pages (chemical inputs,
  chemical outputs). Keyed by ``CHEBI:<n>`` curies.

Outputs (written to ``--output``)
---------------------------------
- ``go-cam-aggregate-stats.html`` — three-column ``Statistic | Total | Unique``
  table. Row labels intentionally drop the ``number of`` prefix to match the
  prefix-free JSON keys. Rows in order:

    1.  production models                                          — Total only
    2.  activity units                                             — Total only
    3.  activity units enabled by gene product                     — Total + Unique→page
    4.  activity units enabled by protein complex                  — Total + Unique→page
    5.  unique member protein complex gene products                — Unique only → page
    6.  genes                                                      — Total only
    7.  references                                                 — Unique only → page
    8.  pmids                                                      — Unique only → page (PMIDs filtered from list_of_unique_references)
    9.  chemical inputs                                            — Total + Unique→page
    10. other inputs (gene products and protein complexes)         — Total + Unique→page
    11. chemical outputs                                           — Total + Unique→page
    12. other outputs (gene products and protein complexes)        — Total + Unique→page
    13. GO terms                                                   — Total + Unique→page
    14. GO MF terms                                                — Total + Unique→page
    15. GO BP terms                                                — Total + Unique→page
    16. GO CC terms                                                — Total + Unique→page
    17. explicit causal relations                                  — Total only (positioned next to inferred relations for explicit-vs-inferred comparison)
    18. number of inferred relations (has output -> has input)     — Total only

  Cells with no meaningful value render as ``-``.

- ``go-cam-curator-stats.html``, ``go-cam-group-stats.html``,
  ``go-cam-group-curator-stats-<group>.html`` (one per group, plus an
  ``-other`` variant for ungrouped curators) — entity-as-column layouts
  where each row is a stat and each column is a curator / group.

  ``go-cam-group-stats.html`` additionally emits three derived rows after
  the scalar fields read from ``stats_by_group_*.json``:

    * ``GO MF terms``  — count of molecular_function terms in that
      group's ``list_go_terms``
    * ``GO BP terms``  — count of biological_process terms
    * ``GO CC terms``  — count of cellular_component terms

  Counts are totals (with duplicates), matching the existing ``GO terms``
  row's semantics. Namespace classification uses the same ``--resource``
  go.json that drives the aggregate-page MF/BP/CC breakdown; if
  ``--resource`` is omitted, the rows still appear so the table schema is
  stable, but all values are 0.

- Per-statistic drilldown pages (emitted when the corresponding unique
  collection on ``AggregateInfo`` is non-empty). The first column header and
  the (optional) label column depend on what kind of entry the page holds:

    Gene-valued pages — columns ``id`` + ``label`` (label from
    ``gene_id_to_label.json``):
      * ``go-cam-unique-gene-product-enablers.html``
      * ``go-cam-unique-protein-complex-member-genes.html``
      * ``go-cam-unique-other-inputs.html``
      * ``go-cam-unique-other-outputs.html``

    Chemical (CHEBI) pages — columns ``id`` + ``label`` (label from
    ``chebi_id_to_label.json``):
      * ``go-cam-unique-chemical-inputs.html``
      * ``go-cam-unique-chemical-outputs.html``

    GO-term pages — columns ``Entry`` + ``Label`` (label from ``--resource``
    OBO-JSON; the ``Label`` column is omitted when ``--resource`` is not
    supplied):
      * ``go-cam-unique-protein-complex-enablers.html``
      * ``go-cam-unique-go-terms.html``
      * ``go-cam-unique-go-mf-terms.html``
      * ``go-cam-unique-go-bp-terms.html``
      * ``go-cam-unique-go-cc-terms.html``

    No-label pages — single ``Entry`` column:
      * ``go-cam-unique-references.html``
      * ``go-cam-unique-pmids.html``

  Cells whose ID is missing from the chosen lookup render as blank, so the
  page schema stays stable across runs even when the source map is absent
  or incomplete.

- ``go-cam-protein-complex.html`` + ``go-cam-protein-complex.tsv`` —
  unchanged.
- ``go-cam-variable-definitions.html`` — unchanged.

Where
-----
- Aggregate row catalog and drilldown emission live in this script
  (``reports-go-cam-stats.py``).
- Row template lives in ``go-cam-stats-template.html`` (Mustache; the row
  block accepts ``{label, total, unique_value, unique_href}`` so the Unique
  cell renders as count, hyperlinked count, or ``-``).
- Drilldown pages reuse ``go-cam-records-template.html``.
- ``gene_id_to_label.json`` and ``chebi_id_to_label.json`` are emitted by
  ``output_stats_for_gocam_models.py`` into the same directory as
  ``aggregate_model_stats.json`` and are loaded by ``load_id_labels`` here.
- Upstream field definitions live in
  ``gocam-py/pipeline/output_stats_for_gocam_models.py``:

    * ``GocamStats.list_enabled_by_gene_product`` (per-model: list of gene
      product enabler terms, may contain duplicates; sorted).
    * ``GocamStats.list_enabled_by_protein_complex`` (per-model: list of
      protein complex enabler terms — the complex itself, not its member
      genes; may contain duplicates; sorted).
    * ``AggregateInfo.unique_enabled_by_gene_product`` (cross-model set;
      this is what powers row 3's Unique drilldown).
    * ``AggregateInfo.unique_protein_complex_in_activity_term`` (cross-model
      set; semantically the unique entries of
      ``list_enabled_by_protein_complex``; powers row 4's Unique drilldown).
    * ``AggregateInfo.list_of_unique_protein_complex_genes`` (cross-model
      set of gene products that are members of protein complexes; powers
      row 5. Renamed from ``unique_protein_complex_genes`` upstream to
      disambiguate from the int count on ``GocamStats`` with the same
      base name).

Why
---
Issue #2339. Collapses paired count / unique-count rows into one row each
(Total + Unique), gives curators a single-click drilldown into every
unique set, and breaks GO term usage out by namespace (molecular_function
/ biological_process / cellular_component). The gene / chemical drilldown
pages also carry a human-readable ``label`` column next to the curie
``id`` so curators can scan the lists without round-tripping each ID
through an external lookup. Row labels in every emitted table drop the
old ``number of`` prefix to match the prefix-free JSON keys the upstream
producer now emits.

How
---
- Aggregate rows are declared centrally as
  ``(label, total_value, unique_value, unique_entries, unique_page_basename)``
  tuples assembled from the loaded ``AggregateInfo`` dict. ``total_value``
  and ``unique_value`` are either ``int`` or ``None`` (``None`` → renders
  ``-``). ``unique_entries`` is the iterable used to render the drilldown
  page; when empty the Unique cell falls back to a plain count or ``-``.
- GO term namespace classification uses the ``--resource`` OBO-JSON
  ontology file (``go.json``). ``load_ontology_labels`` is extended to also
  return ``namespace_by_id`` derived from each node's
  ``meta.basicPropertyValues`` ``hasOBONamespace`` predicate, mapping
  ``biological_process`` → BP, ``molecular_function`` → MF,
  ``cellular_component`` → CC. ``list_go_terms`` is then partitioned by
  namespace to populate rows 15-17 and their drilldown pages.
- Each drilldown page is rendered via ``render_and_write`` against the
  record-oriented template, with the ``links`` block excluding the
  drilldown's own filename so navigation back to the aggregate works.
- Drilldown column layout is driven by ``drilldown_label_kind`` on each row
  spec — one of ``"gene"``, ``"chebi"``, ``"go"`` or ``None``. The renderer
  picks the corresponding label dict (``gene_labels``, ``chebi_labels``,
  ``ontology_labels``) and headers (``id``/``label`` for gene+chebi,
  ``Entry``/``Label`` for go, ``Entry`` only for no-label pages).
- ``load_id_labels`` reads ``gene_id_to_label.json`` and
  ``chebi_id_to_label.json`` from the ``--directory`` input. Both files are
  optional; absence yields empty dicts and blank ``label`` cells.
- The producer-side schema rename (``number_of_X`` → ``X``,
  ``total_number_of_X`` → ``total_X``, and ``unique_X`` Sets renamed to
  ``list_of_unique_X`` where they would collide with a count) is the source
  of all prefix-free row labels. The per-group ``go-cam-group-stats.html``
  page picks up the rename automatically because it builds row labels via
  ``field.replace("_", " ")`` over whatever scalar field names appear in
  ``stats_by_group_*.json``.

Notes
-----
- The per-curator / per-group HTML pages remain in their existing
  "entity-as-column" layout; only ``go-cam-aggregate-stats.html`` adopts
  the three-column Total/Unique format.
- The MF/BP/CC rows on ``go-cam-group-stats.html`` are derived at render
  time from ``list_go_terms`` and the ``--resource`` namespace dict — they
  are not new fields on ``GocamStats`` upstream. This keeps the
  per-group stats producer unchanged and means refreshing the go.json
  ontology is enough to pick up reclassified terms.
- ``list_enabled_by_gene_product`` / ``list_enabled_by_protein_complex``
  are intentionally NOT added to ``AggregateInfo`` — the corresponding
  ``unique_*`` Sets already carry the deduplicated entries needed for the
  drilldown pages, so no aggregation pass is required at render time.
"""

import click
import pystache
import json
import datetime
import os
import glob
import re
import yaml
from urllib.parse import urlparse


def build_table_data(json_data_list, column_names):
    """Build header and rows from a list of JSON dicts and their column names."""
    header = [{"id": name} for name in column_names]

    # Collect non-array field names from the first file
    field_names = [
        key for key, val in json_data_list[0].items()
        if not isinstance(val, list) and not isinstance(val, dict)
    ]

    rows = []
    for field in field_names:
        values = []
        for data in json_data_list:
            values.append({"value": data.get(field, "")})
        rows.append({
            "field": field,
            "field_display": field.replace("_", " "),
            "values": values,
        })

    return header, rows


NAMESPACE_PRED = "http://www.geneontology.org/formats/oboInOwl#hasOBONamespace"


def load_ontology_labels(resource_path):
    """Load an OBO JSON ontology file and return label + namespace dicts.

    The OBO JSON format stores nodes under graphs[0]["nodes"], where each node
    has an "id" (URI like http://purl.obolibrary.org/obo/GO_0042613), "lbl"
    (the human-readable label), and a meta.basicPropertyValues entry whose
    predicate is hasOBONamespace and value is one of
    {"molecular_function", "biological_process", "cellular_component"}.

    Returns:
        (labels_by_id, namespaces_by_id) — two dicts keyed by GO ID
        (e.g. "GO:0042613"). Either may be empty.
    """
    with open(resource_path) as f:
        data = json.load(f)
    labels = {}
    namespaces = {}
    for node in data.get("graphs", [{}])[0].get("nodes", []):
        uri = node.get("id", "")
        if "/" not in uri:
            continue
        raw_id = uri.rsplit("/", 1)[-1]
        go_id = raw_id.replace("_", ":")
        lbl = node.get("lbl", "")
        if lbl:
            labels[go_id] = lbl
        for prop in node.get("meta", {}).get("basicPropertyValues", []) or []:
            if prop.get("pred") == NAMESPACE_PRED:
                ns = prop.get("val", "")
                if ns:
                    namespaces[go_id] = ns
                break
    return labels, namespaces


def get_go_term_label(go_id, ontology_labels):
    """Look up a GO term label from the ontology dict."""
    return ontology_labels.get(go_id, "")


def load_id_labels(directory):
    """Load gene and CHEBI ID-to-label maps from the stats input directory.

    Looks for ``gene_id_to_label.json`` and ``chebi_id_to_label.json``
    (emitted alongside ``aggregate_model_stats.json`` by
    ``output_stats_for_gocam_models.py``). Either file may be absent; the
    corresponding dict is returned empty so callers can render the ``label``
    column with blank cells instead of failing.

    Returns:
        (gene_labels, chebi_labels) — two dicts keyed by ID
        (e.g. ``"UniProtKB:P00387"`` → ``"CYC1 Scer"``,
        ``"CHEBI:58211"`` → display label).
    """
    def _load(name):
        path = os.path.join(directory, name)
        if not os.path.exists(path):
            return {}
        with open(path) as f:
            return json.load(f)
    return _load("gene_id_to_label.json"), _load("chebi_id_to_label.json")


def build_record_table_data(records, field_specs):
    """Build columns and record rows for a row-oriented (records) template.

    Args:
        records: list of dicts (the JSON array)
        field_specs: list of (field_name, display_label, formatter_fn) tuples.
            formatter_fn takes a raw value and returns a display string.

    Returns:
        columns: [{"label": str}]
        record_rows: [{"cells": [{"value": str}]}]
    """
    columns = [{"label": label} for _, label, _ in field_specs]
    record_rows = []
    for rec in records:
        cells = []
        for field_name, _, formatter in field_specs:
            raw = rec.get(field_name, "")
            cells.append({"value": formatter(raw)})
        record_rows.append({"cells": cells})
    return columns, record_rows


def format_curator_list(uris, users_by_uri):
    """Resolve a list of curator URIs to display names, comma-joined."""
    if not uris:
        return ""
    return ", ".join(get_curator_display_name(uri, users_by_uri) for uri in uris)


def format_group_list(uris, groups_by_id):
    """Resolve a list of group URIs to labels, comma-joined."""
    if not uris:
        return ""
    labels = []
    for uri in uris:
        ensure_group_entry(uri, groups_by_id)
        group = groups_by_id.get(uri)
        if group and group.get("label"):
            labels.append(group["label"])
        else:
            labels.append(uri)
    return ", ".join(labels)


def build_links(exclude_filename, available_pages):
    """Build navigation links excluding the current page."""
    return [{"href": fn, "label": label} for fn, label in available_pages if fn != exclude_filename]


def render_and_write(template_str, context, output_path):
    """Render a mustache template and write to output_path."""
    rendered = pystache.render(template_str, context)
    with open(output_path, "w") as f:
        f.write(rendered)
    click.echo("Wrote {}".format(output_path))


def write_tsv(headers, rows, output_path):
    """Write a TSV file with the given headers and rows.

    Args:
        headers: list of column header strings
        rows: list of lists of string values
        output_path: path to write the TSV file
    """
    def quote(val):
        s = str(val)
        return '"' + s.replace('"', '""') + '"'

    with open(output_path, "w") as f:
        f.write("\t".join(quote(h) for h in headers) + "\n")
        for row in rows:
            f.write("\t".join(quote(v) for v in row) + "\n")
    click.echo("Wrote {}".format(output_path))


def load_users(metadata_dir):
    """Load users.yaml and return a dict keyed by uri."""
    users_path = os.path.join(metadata_dir, "users.yaml")
    if not os.path.exists(users_path):
        click.echo("Warning: users.yaml not found at {}".format(users_path), err=True)
        return {}
    with open(users_path) as f:
        users_list = yaml.safe_load(f)
    users_by_uri = {}
    for user in users_list:
        uri = user.get("uri", "")
        if uri:
            users_by_uri[uri] = user
    return users_by_uri


def load_groups(metadata_dir):
    """Load groups.yaml and return a dict keyed by id."""
    groups_path = os.path.join(metadata_dir, "groups.yaml")
    if not os.path.exists(groups_path):
        click.echo("Warning: groups.yaml not found at {}".format(groups_path), err=True)
        return {}
    with open(groups_path) as f:
        groups_list = yaml.safe_load(f)
    groups_by_id = {}
    for group in groups_list:
        gid = group.get("id", "")
        if gid:
            groups_by_id[gid] = group
    return groups_by_id


def get_curator_display_name(uri, users_by_uri):
    """Get display name for a curator: nickname if available, otherwise the ID part of the URI."""
    user = users_by_uri.get(uri)
    if user and user.get("nickname"):
        return user["nickname"]
    # Extract the ID part from the URI (e.g., last path segment)
    parsed = urlparse(uri)
    return parsed.path.rstrip("/").split("/")[-1]


def get_curator_groups(uri, users_by_uri):
    """Get the list of group IDs a curator belongs to."""
    user = users_by_uri.get(uri)
    if user and user.get("groups"):
        return user["groups"]
    return []


def make_safe_filename(name):
    """Convert a group label to a safe filename."""
    return re.sub(r'[^a-zA-Z0-9_-]', '-', name).lower().strip('-')


def _is_chebi(term):
    return isinstance(term, str) and term.lower().startswith("chebi:")


def _is_pmid(term):
    return isinstance(term, str) and term.lower().startswith("pmid:")


def _classify_go_terms(go_terms, namespaces):
    """Partition a list of GO terms into MF / BP / CC by namespace lookup.

    Terms whose namespace is unknown (missing from ``namespaces``) are dropped
    from all three buckets. Returns (mf_terms, bp_terms, cc_terms) as lists
    preserving original order; callers can ``set(...)`` for uniques.
    """
    mf, bp, cc = [], [], []
    for t in go_terms:
        ns = namespaces.get(t)
        if ns == "molecular_function":
            mf.append(t)
        elif ns == "biological_process":
            bp.append(t)
        elif ns == "cellular_component":
            cc.append(t)
    return mf, bp, cc


def build_aggregate_row_specs(model_entity, namespaces):
    """Build the row catalog for the aggregate stats page.

    Each row spec is a dict with these keys:
        label              — display label
        total              — int or None ("-" when None)
        unique             — int or None ("-" when None)
        unique_entries     — iterable of entries for the drilldown page, or None
        drilldown_basename — output HTML filename for the drilldown, or None
        drilldown_title    — title shown on the drilldown page, or None
        drilldown_label_kind — what the drilldown's first column holds, used to
            pick header text and the label-lookup source:
              * "gene"  → columns ``id`` + ``label`` (from
                gene_id_to_label.json)
              * "chebi" → columns ``id`` + ``label`` (from
                chebi_id_to_label.json)
              * "go"    → columns ``Entry`` + ``Label`` (from --resource
                ontology labels)
              * None    → single ``Entry`` column (references, PMIDs)
    """
    agg = model_entity
    models_by_status = agg.get("models_by_status", {})

    go_terms = agg.get("list_go_terms", []) or []
    mf_terms, bp_terms, cc_terms = _classify_go_terms(go_terms, namespaces)
    unique_mf = sorted(set(mf_terms))
    unique_bp = sorted(set(bp_terms))
    unique_cc = sorted(set(cc_terms))
    unique_go = sorted(set(go_terms))

    input_terms = agg.get("list_has_input_term", []) or []
    output_terms = agg.get("list_has_output_term", []) or []
    unique_chem_inputs = sorted({t for t in input_terms if _is_chebi(t)})
    unique_other_inputs = sorted({t for t in input_terms if not _is_chebi(t)})
    unique_chem_outputs = sorted({t for t in output_terms if _is_chebi(t)})
    unique_other_outputs = sorted({t for t in output_terms if not _is_chebi(t)})

    unique_refs = sorted(agg.get("list_of_unique_references", []) or [])
    unique_pmids = sorted(r for r in unique_refs if _is_pmid(r))

    def spec(label, total=None, unique=None, entries=None,
             drilldown_basename=None, drilldown_title=None,
             drilldown_label_kind=None):
        return {
            "label": label,
            "total": total,
            "unique": unique,
            "unique_entries": entries,
            "drilldown_basename": drilldown_basename,
            "drilldown_title": drilldown_title,
            "drilldown_label_kind": drilldown_label_kind,
        }

    return [
        spec("production models",
             total=models_by_status.get("production", 0)),
        spec("activity units",
             total=agg.get("unique_activity_units", 0)),
        spec("activity units enabled by gene product",
             total=agg.get("activity_units_enabled_by_gene_product_association", 0),
             unique=agg.get("unique_gene_product_enablers", 0),
             entries=sorted(agg.get("unique_enabled_by_gene_product", []) or []),
             drilldown_basename="go-cam-unique-gene-product-enablers.html",
             drilldown_title="Unique Gene Product Enablers",
             drilldown_label_kind="gene"),
        spec("activity units enabled by protein complex",
             total=agg.get("activity_units_enabled_by_protein_complex_association", 0),
             unique=agg.get("unique_protein_complex_terms", 0),
             entries=sorted(agg.get("unique_protein_complex_in_activity_term", []) or []),
             drilldown_basename="go-cam-unique-protein-complex-enablers.html",
             drilldown_title="Unique Protein Complex Enablers",
             drilldown_label_kind="go"),
        spec("unique member protein complex gene products",
             unique=agg.get("unique_member_protein_complex_genes", 0),
             entries=sorted(agg.get("list_of_unique_protein_complex_genes", []) or []),
             drilldown_basename="go-cam-unique-protein-complex-member-genes.html",
             drilldown_title="Unique Member Protein Complex Gene Products",
             drilldown_label_kind="gene"),
        spec("genes",
             total=agg.get("genes", 0)),
        spec("references",
             unique=agg.get("unique_references", 0),
             entries=unique_refs,
             drilldown_basename="go-cam-unique-references.html",
             drilldown_title="Unique References"),
        spec("pmids",
             unique=agg.get("unique_pmid", 0),
             entries=unique_pmids,
             drilldown_basename="go-cam-unique-pmids.html",
             drilldown_title="Unique PMIDs"),
        spec("chemical inputs",
             total=agg.get("chemical_inputs", 0),
             unique=len(unique_chem_inputs),
             entries=unique_chem_inputs,
             drilldown_basename="go-cam-unique-chemical-inputs.html",
             drilldown_title="Unique Chemical Inputs",
             drilldown_label_kind="chebi"),
        spec("other inputs (gene products and protein complexes)",
             total=agg.get("other_inputs", 0),
             unique=len(unique_other_inputs),
             entries=unique_other_inputs,
             drilldown_basename="go-cam-unique-other-inputs.html",
             drilldown_title="Unique Other Inputs",
             drilldown_label_kind="gene"),
        spec("chemical outputs",
             total=agg.get("chemical_outputs", 0),
             unique=len(unique_chem_outputs),
             entries=unique_chem_outputs,
             drilldown_basename="go-cam-unique-chemical-outputs.html",
             drilldown_title="Unique Chemical Outputs",
             drilldown_label_kind="chebi"),
        spec("other outputs (gene products and protein complexes)",
             total=agg.get("other_outputs", 0),
             unique=len(unique_other_outputs),
             entries=unique_other_outputs,
             drilldown_basename="go-cam-unique-other-outputs.html",
             drilldown_title="Unique Other Outputs",
             drilldown_label_kind="gene"),
        spec("GO terms",
             total=agg.get("go_terms", 0),
             unique=agg.get("unique_go_terms", 0),
             entries=unique_go,
             drilldown_basename="go-cam-unique-go-terms.html",
             drilldown_title="Unique GO Terms",
             drilldown_label_kind="go"),
        spec("GO MF terms",
             total=len(mf_terms),
             unique=len(unique_mf),
             entries=unique_mf,
             drilldown_basename="go-cam-unique-go-mf-terms.html",
             drilldown_title="Unique GO Molecular Function Terms",
             drilldown_label_kind="go"),
        spec("GO BP terms",
             total=len(bp_terms),
             unique=len(unique_bp),
             entries=unique_bp,
             drilldown_basename="go-cam-unique-go-bp-terms.html",
             drilldown_title="Unique GO Biological Process Terms",
             drilldown_label_kind="go"),
        spec("GO CC terms",
             total=len(cc_terms),
             unique=len(unique_cc),
             entries=unique_cc,
             drilldown_basename="go-cam-unique-go-cc-terms.html",
             drilldown_title="Unique GO Cellular Component Terms",
             drilldown_label_kind="go"),
        spec("explicit causal relations",
             total=agg.get("explicit_causal_relations", 0)),
        spec("number of inferred relations (has output -> has input)",
             total=agg.get("total_inferred_relations", 0)),
    ]


def _cell_total(spec_):
    if spec_["total"] is None:
        return {"value": "-"}
    return {"value": spec_["total"]}


def _cell_unique(spec_):
    if spec_["unique"] is None:
        return {"value": "-"}
    if spec_["unique_entries"] and spec_["drilldown_basename"]:
        return {"value": spec_["unique"], "href": spec_["drilldown_basename"]}
    return {"value": spec_["unique"]}


def render_aggregate_rows(row_specs):
    """Convert aggregate row specs into template-ready row dicts."""
    return [{
        "field_display": s["label"],
        "values": [_cell_total(s), _cell_unique(s)],
    } for s in row_specs]


def render_drilldown_pages(row_specs, records_template_str, output_dir,
                           available_pages, ontology_labels, gene_labels,
                           chebi_labels, date):
    """Emit one drilldown HTML page per row spec that has non-empty entries.

    Each page lists the unique entries (one row per entry). The first column
    header and the optional second "label" column are chosen by
    ``drilldown_label_kind`` on the spec:

        - ``"gene"``  → columns ``id`` + ``label`` (lookups in ``gene_labels``,
          loaded from ``gene_id_to_label.json``).
        - ``"chebi"`` → columns ``id`` + ``label`` (lookups in
          ``chebi_labels``, loaded from ``chebi_id_to_label.json``).
        - ``"go"``    → columns ``Entry`` + ``Label`` (lookups in
          ``ontology_labels``, loaded from the OBO-JSON ``--resource``). The
          ``Label`` column is omitted if no ontology was supplied.
        - otherwise  → single ``Entry`` column (no label lookup).

    Missing keys in the chosen lookup render as blank cells, so the gene /
    chemical pages keep their schema even when the source JSON is missing or
    incomplete.
    """
    if not records_template_str:
        return
    for s in row_specs:
        entries = s.get("unique_entries")
        basename = s.get("drilldown_basename")
        if not entries or not basename:
            continue

        kind = s.get("drilldown_label_kind")
        if kind == "gene":
            columns = [{"label": "id"}, {"label": "label"}]
            label_lookup = gene_labels
        elif kind == "chebi":
            columns = [{"label": "id"}, {"label": "label"}]
            label_lookup = chebi_labels
        elif kind == "go" and ontology_labels:
            columns = [{"label": "Entry"}, {"label": "Label"}]
            label_lookup = ontology_labels
        else:
            columns = [{"label": "Entry"}]
            label_lookup = None

        records = []
        for entry in entries:
            cells = [{"value": entry}]
            if label_lookup is not None:
                cells.append({"value": label_lookup.get(entry, "")})
            records.append({"cells": cells})
        render_and_write(records_template_str, {
            "title": "GO-CAM {} ({})".format(s.get("drilldown_title") or "Unique Entries", len(entries)),
            "columns": columns,
            "records": records,
            "links": build_links(basename, available_pages),
            "date": date,
        }, os.path.join(output_dir, basename))


def ensure_group_entry(group_uri, groups_by_id):
    """If group_uri has no entry in groups_by_id, create a synthetic one with a unique label.

    The label is derived from the last path segment of the URI. If that label
    already exists among existing groups, a numeric suffix is appended to
    ensure uniqueness.
    """
    if not group_uri or group_uri in groups_by_id:
        return
    parsed = urlparse(group_uri)
    base_label = parsed.path.rstrip("/").split("/")[-1]
    # Collect all existing labels for uniqueness check
    existing_labels = {g.get("label", "").lower() for g in groups_by_id.values()}
    label = base_label
    counter = 2
    while label.lower() in existing_labels:
        label = "{}_{}".format(base_label, counter)
        counter += 1
    groups_by_id[group_uri] = {"id": group_uri, "label": label}


@click.command()
@click.option("--directory", type=click.Path(exists=True), required=True)
@click.option("--template", type=click.File("r"), required=True)
@click.option("--output", type=click.Path(), required=True)
@click.option("--template-records", type=click.File("r"), required=False, default=None,
              help="Mustache template for record-oriented tables (protein complex, variable definitions)")
@click.option("-r", "--resource", type=click.Path(exists=True), required=False, default=None,
              help="Ontology file in OBO JSON format (e.g., go.json) for resolving GO term labels")
@click.option("--metadata", type=click.Path(exists=True), required=False, default=None,
              help="Directory containing users.yaml and groups.yaml metadata files")
@click.option("--date", default=str(datetime.date.today()))
def main(directory, template, output, template_records, resource, metadata, date):
    os.makedirs(output, exist_ok=True)
    template_str = template.read()
    records_template_str = template_records.read() if template_records else None

    # Load metadata if provided
    users_by_uri = {}
    groups_by_id = {}
    if metadata:
        users_by_uri = load_users(metadata)
        groups_by_id = load_groups(metadata)

    # Load ontology labels and namespaces if provided
    ontology_labels = {}
    ontology_namespaces = {}
    if resource:
        ontology_labels, ontology_namespaces = load_ontology_labels(resource)

    # Load gene / CHEBI id-to-label maps from the stats input directory.
    # Missing files yield empty dicts so the drilldown 'label' column still
    # renders (with blank values) when the source data isn't available.
    gene_labels, chebi_labels = load_id_labels(directory)

    # Build dynamic available_pages list based on which JSON files exist
    available_pages = [
        ("go-cam-aggregate-stats.html", "Aggregate Statistics"),
        ("go-cam-group-stats.html", "Stats by Group"),
    ]
    protein_complex_file = os.path.join(directory, "aggregate_protein_complex.json")
    definitions_file = os.path.join(directory, "member_variable_definitions.json")
    if records_template_str and os.path.exists(protein_complex_file):
        available_pages.append(("go-cam-protein-complex.html", "Protein Complex Activities"))
    if records_template_str and os.path.exists(definitions_file):
        available_pages.append(("go-cam-variable-definitions.html", "Variable Definitions"))

    # --- Aggregate stats (Model only) ---
    aggregate_file = os.path.join(directory, "aggregate_model_stats.json")
    if not os.path.exists(aggregate_file):
        click.echo("No aggregate_model_stats.json found in {}".format(directory), err=True)
        return

    with open(aggregate_file) as f:
        model_entity = json.load(f)

    row_specs = build_aggregate_row_specs(model_entity, ontology_namespaces)
    aggregate_rows = render_aggregate_rows(row_specs)
    aggregate_header = [{"id": "Total"}, {"id": "Unique"}]

    render_and_write(template_str, {
        "title": "GO-CAM Aggregate Statistics",
        "header": aggregate_header,
        "rows": aggregate_rows,
        "links": build_links("go-cam-aggregate-stats.html", available_pages),
        "date": date,
    }, os.path.join(output, "go-cam-aggregate-stats.html"))

    render_drilldown_pages(row_specs, records_template_str, output,
                           available_pages, ontology_labels, gene_labels,
                           chebi_labels, date)

    # --- Build curator info from stats_by_curator ---
    curator_dir = os.path.join(directory, "stats_by_curator")
    curator_data_list = []
    curator_uris = []
    if os.path.isdir(curator_dir):
        curator_files = sorted(glob.glob(os.path.join(curator_dir, "stats_by_curator_*.json")))
        for fpath in curator_files:
            with open(fpath) as f:
                data = json.load(f)
            curator_data_list.append(data)
            curator_uris.append(data.get("uri", ""))

    # --- Stats by curator (all curators) ---
    if curator_data_list:
        curator_columns = [
            get_curator_display_name(uri, users_by_uri) for uri in curator_uris
        ]

        header, rows = build_table_data(curator_data_list, curator_columns)

        render_and_write(template_str, {
            "title": "GO-CAM Stats by Curator",
            "header": header,
            "rows": rows,
            "links": build_links("go-cam-curator-stats.html", available_pages),
            "date": date,
        }, os.path.join(output, "go-cam-curator-stats.html"))
    else:
        click.echo("No curator stats files found", err=True)

    # --- Stats by group ---
    group_dir = os.path.join(directory, "stats_by_group")
    if os.path.isdir(group_dir):
        group_files = sorted(glob.glob(os.path.join(group_dir, "stats_by_group_*.json")))
        if group_files:
            group_data = []
            group_uris = []
            group_labels = []
            group_page_filenames = []
            for fpath in group_files:
                with open(fpath) as f:
                    data = json.load(f)
                group_data.append(data)
                group_uri = data.get("uri", "")
                group_uris.append(group_uri)
                # Ensure a groups_by_id entry exists for this URI
                ensure_group_entry(group_uri, groups_by_id)
                # Map to group label via groups.yaml
                group = groups_by_id.get(group_uri)
                if group and group.get("label"):
                    label = group["label"]
                else:
                    label = group_uri
                group_labels.append(label)
                group_page_filenames.append("go-cam-group-curator-stats-{}.html".format(make_safe_filename(label)))

            # Build header with links to per-group curator pages
            header = [
                {"id": label, "href": page_fn}
                for label, page_fn in zip(group_labels, group_page_filenames)
            ]

            # Also add "Other" column header if there are ungrouped curators
            # Build group membership for curators
            group_to_curators = {}  # group_id -> list of (data, display_name)
            ungrouped_curators = []
            for data, uri in zip(curator_data_list, curator_uris):
                display_name = get_curator_display_name(uri, users_by_uri)
                curator_groups = get_curator_groups(uri, users_by_uri)
                if not curator_groups:
                    ungrouped_curators.append((data, display_name))
                else:
                    for gid in curator_groups:
                        group_to_curators.setdefault(gid, []).append((data, display_name))

            if ungrouped_curators:
                other_page_fn = "go-cam-group-curator-stats-other.html"
                header.append({"id": "Other", "href": other_page_fn})

            # Build rows from group_data (non-array, non-dict fields)
            field_names = [
                key for key, val in group_data[0].items()
                if not isinstance(val, list) and not isinstance(val, dict)
            ]

            # Display-label overrides for fields whose snake_case key doesn't
            # yield the desired display string when underscores become spaces
            # (e.g., acronyms that should stay uppercased).
            group_field_label_overrides = {
                "go_terms": "GO terms",
                "unique_go_terms": "unique GO terms",
            }

            rows = []
            for field in field_names:
                values = [{"value": data.get(field, "")} for data in group_data]
                # Add empty value for "Other" column if present
                if ungrouped_curators:
                    values.append({"value": ""})
                rows.append({
                    "field": field,
                    "field_display": group_field_label_overrides.get(
                        field, field.replace("_", " ")
                    ),
                    "values": values,
                })

            # Derived MF/BP/CC count rows: partition each group's
            # list_go_terms by namespace (from --resource go.json) and emit
            # one row per namespace. Counts are totals (with duplicates),
            # matching number_of_go_terms semantics. When --resource was not
            # supplied, ontology_namespaces is empty and all counts are 0,
            # but the rows are still emitted to keep the table schema stable.
            mf_counts, bp_counts, cc_counts = [], [], []
            for data in group_data:
                go_terms = data.get("list_go_terms", []) or []
                mf, bp, cc = _classify_go_terms(go_terms, ontology_namespaces)
                mf_counts.append(len(mf))
                bp_counts.append(len(bp))
                cc_counts.append(len(cc))

            for field_name, display_label, per_group_counts in [
                ("go_mf_terms", "GO MF terms", mf_counts),
                ("go_bp_terms", "GO BP terms", bp_counts),
                ("go_cc_terms", "GO CC terms", cc_counts),
            ]:
                values = [{"value": c} for c in per_group_counts]
                if ungrouped_curators:
                    values.append({"value": ""})
                rows.append({
                    "field": field_name,
                    "field_display": display_label,
                    "values": values,
                })

            render_and_write(template_str, {
                "title": "GO-CAM Stats by Group",
                "header": header,
                "rows": rows,
                "links": build_links("go-cam-group-stats.html", available_pages),
                "date": date,
            }, os.path.join(output, "go-cam-group-stats.html"))

            # --- Create per-group curator pages ---
            for group_uri, label, page_fn in zip(group_uris, group_labels, group_page_filenames):
                curators_in_group = group_to_curators.get(group_uri, [])

                grp_links = build_links(page_fn, available_pages)

                if not curators_in_group:
                    click.echo("No curators found for group '{}' via metadata".format(label), err=True)
                    # Still create the page so the link from group stats is not broken
                    render_and_write(template_str, {
                        "title": "GO-CAM Curator Stats - {}".format(label),
                        "header": [],
                        "rows": [],
                        "links": grp_links,
                        "date": date,
                    }, os.path.join(output, page_fn))
                    continue

                grp_curator_data = [c[0] for c in curators_in_group]
                grp_curator_names = [c[1] for c in curators_in_group]

                grp_header, grp_rows = build_table_data(grp_curator_data, grp_curator_names)

                render_and_write(template_str, {
                    "title": "GO-CAM Curator Stats - {}".format(label),
                    "header": grp_header,
                    "rows": grp_rows,
                    "links": grp_links,
                    "date": date,
                }, os.path.join(output, page_fn))

            # --- Create "Other" page for ungrouped curators ---
            if ungrouped_curators:
                other_data = [c[0] for c in ungrouped_curators]
                other_names = [c[1] for c in ungrouped_curators]

                other_header, other_rows = build_table_data(other_data, other_names)

                render_and_write(template_str, {
                    "title": "GO-CAM Curator Stats - Other",
                    "header": other_header,
                    "rows": other_rows,
                    "links": build_links("go-cam-group-curator-stats-other.html", available_pages),
                    "date": date,
                }, os.path.join(output, "go-cam-group-curator-stats-other.html"))

        else:
            click.echo("No group stats files found in {}".format(group_dir), err=True)
    else:
        click.echo("stats_by_group directory not found in {}".format(directory), err=True)

    # --- Protein Complex Activities report ---
    if records_template_str and os.path.exists(protein_complex_file):
        with open(protein_complex_file) as f:
            protein_complex_data = json.load(f)

        if protein_complex_data:
            field_specs = [
                ("model_id", "Model ID", str),
                ("model_name", "Model Name", str),
                ("model_status", "Model Status", str),
                ("activity_id", "Activity ID", str),
                ("protein_complex_term", "Protein Complex Term", str),
            ]
            if ontology_labels:
                field_specs.append(
                    ("protein_complex_term", "Protein Complex Label",
                     lambda go_id: get_go_term_label(go_id, ontology_labels)))
            field_specs.append(("molecular_function", "Molecular Function", str))
            if ontology_labels:
                field_specs.append(
                    ("molecular_function", "Molecular Function Label",
                     lambda go_id: get_go_term_label(go_id, ontology_labels)))
            field_specs.extend([
                ("unique_curators", "Curators", lambda uris: format_curator_list(uris, users_by_uri)),
                ("unique_groups", "Groups", lambda uris: format_group_list(uris, groups_by_id)),
            ])
            columns, records = build_record_table_data(protein_complex_data, field_specs)

            render_and_write(records_template_str, {
                "title": "GO-CAM Protein Complex Activities",
                "columns": columns,
                "records": records,
                "links": build_links("go-cam-protein-complex.html", available_pages),
                "date": date,
            }, os.path.join(output, "go-cam-protein-complex.html"))

            # Also write TSV with the same columns
            tsv_headers = [label for _, label, _ in field_specs]
            tsv_rows = []
            for rec in protein_complex_data:
                row = []
                for field_name, _, formatter in field_specs:
                    raw = rec.get(field_name, "")
                    row.append(formatter(raw))
                tsv_rows.append(row)
            write_tsv(tsv_headers, tsv_rows, os.path.join(output, "go-cam-protein-complex.tsv"))
        else:
            click.echo("aggregate_protein_complex.json is empty", err=True)
    elif records_template_str:
        click.echo("No aggregate_protein_complex.json found in {}".format(directory), err=True)

    # --- Variable Definitions report ---
    if records_template_str and os.path.exists(definitions_file):
        with open(definitions_file) as f:
            definitions_data = json.load(f)

        if definitions_data:
            field_specs = [
                ("class", "Class", str),
                ("variable", "Variable", str),
                ("description", "Description", str),
            ]
            columns, records = build_record_table_data(definitions_data, field_specs)

            render_and_write(records_template_str, {
                "title": "GO-CAM Variable Definitions",
                "columns": columns,
                "records": records,
                "links": build_links("go-cam-variable-definitions.html", available_pages),
                "date": date,
            }, os.path.join(output, "go-cam-variable-definitions.html"))
        else:
            click.echo("member_variable_definitions.json is empty", err=True)
    elif records_template_str:
        click.echo("No member_variable_definitions.json found in {}".format(directory), err=True)


if __name__ == "__main__":
    main()
