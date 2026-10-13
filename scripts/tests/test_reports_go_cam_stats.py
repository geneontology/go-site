"""Tests for ``scripts/reports-go-cam-stats.py`` output layout (go-site #2744).

The release folder ``reports/go-cam-stats/`` should show only
``go-cam-aggregate-stats.html`` at the top level; every other report page,
drilldown page and (with ``--data-subdir``) the raw stats JSON lives under
``full-go-cam-stats/``. Links between pages are plain relative hrefs, so the
tests check that every one of them resolves to a file that was written.

Run from the go-site root:

    env/bin/python -m pytest scripts/tests
"""

import importlib.util
import json
import os
import re
from pathlib import Path

import pytest
import yaml
from click.testing import CliRunner

SCRIPTS_DIR = Path(__file__).resolve().parent.parent

_spec = importlib.util.spec_from_file_location(
    "reports_go_cam_stats", SCRIPTS_DIR / "reports-go-cam-stats.py")
rgcs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rgcs)

FULL = "full-go-cam-stats"
AGGREGATE = "go-cam-aggregate-stats.html"

CURATOR_URI = "https://orcid.org/0000-0001-0000-0001"
UNGROUPED_URI = "https://orcid.org/0000-0002-0000-0002"
GROUP_URI = "http://www.informatics.jax.org"


def _entity_stats(uri):
    return {
        "uri": uri,
        "models": 1,
        "activity_units": 2,
        "unique_gene_product_enablers": 1,
        "unique_enabled_by_gene_product": ["UniProtKB:P1"],
        "list_go_terms": ["GO:0000001", "GO:0000002"],
        "go_terms": 2,
        "unique_go_terms": 2,
        "list_has_input_term": ["CHEBI:1"],
        "chemical_inputs": 1,
        "unique_chemical_inputs": 1,
        "list_of_unique_references": ["PMID:1"],
        "unique_references": 1,
        "unique_pmid": 1,
    }


def _write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data))


def make_stats_dir(root):
    """Create a minimal ``output_stats_for_gocam_models.py`` output tree."""
    aggregate = _entity_stats(None)
    aggregate.update({
        "models_by_status": {"production": 1},
        "unique_activity_units": 2,
        "list_of_unique_protein_complex_genes": ["UniProtKB:P2"],
        "unique_member_protein_complex_genes": 1,
        "list_has_output_term": ["UniProtKB:P3"],
    })
    _write_json(root / "aggregate_model_stats.json", aggregate)
    _write_json(root / "aggregate_curator_stats.json", {})
    _write_json(root / "aggregate_group_stats.json", {})
    _write_json(root / "id_to_label.json", {"UniProtKB:P1": "gene one"})
    _write_json(root / "aggregate_protein_complex.json", [{
        "model_id": "gomodel:1",
        "protein_complex_term": "GO:0000003",
        "protein_complex_members": ["UniProtKB:P2"],
        "unique_curators": [CURATOR_URI],
        "unique_groups": [GROUP_URI],
    }])
    _write_json(root / "member_variable_definitions.json", [
        {"class": "GocamStats", "variable": "models", "description": "d"}])
    _write_json(root / "stats_by_curator" / "stats_by_curator_0000-0001-0000-0001.json",
                _entity_stats(CURATOR_URI))
    _write_json(root / "stats_by_curator" / "stats_by_curator_0000-0002-0000-0002.json",
                _entity_stats(UNGROUPED_URI))
    _write_json(root / "stats_by_group" / "stats_by_group_mgi.json",
                _entity_stats(GROUP_URI))
    _write_json(root / "stats_by_model" / "stats_by_model_1.json", {})
    _write_json(root / "calculated_aggregate_values_by_model" /
                "calculated_aggregate_values_by model_1.json", {})
    return root


def make_metadata_dir(root):
    root.mkdir(parents=True, exist_ok=True)
    (root / "users.yaml").write_text(yaml.safe_dump([
        {"uri": CURATOR_URI, "nickname": "Curator One", "groups": [GROUP_URI]},
        {"uri": UNGROUPED_URI, "nickname": "Curator Two"},
    ]))
    (root / "groups.yaml").write_text(yaml.safe_dump([
        {"id": GROUP_URI, "label": "MGI"},
    ]))
    return root


def make_resource(path):
    ns = "http://www.geneontology.org/formats/oboInOwl#hasOBONamespace"

    def node(n, label, namespace):
        return {"id": "http://purl.obolibrary.org/obo/GO_000000{}".format(n),
                "lbl": label,
                "meta": {"basicPropertyValues": [{"pred": ns, "val": namespace}]}}

    _write_json(path, {"graphs": [{"nodes": [
        node(1, "mf one", "molecular_function"),
        node(2, "bp two", "biological_process"),
        node(3, "complex three", "cellular_component"),
    ]}]})
    return path


def run_report(tmp_path, directory, output, data_subdir=None):
    args = [
        "--directory", str(directory),
        "--template", str(SCRIPTS_DIR / "go-cam-stats-template.html"),
        "--template-records", str(SCRIPTS_DIR / "go-cam-records-template.html"),
        "--output", str(output),
        "--metadata", str(make_metadata_dir(tmp_path / "metadata")),
        "--resource", str(make_resource(tmp_path / "go.json")),
        "--date", "2026-10-06",
    ]
    if data_subdir is not None:
        args += ["--data-subdir", data_subdir]
    result = CliRunner().invoke(rgcs.main, args)
    assert result.exit_code == 0, result.output
    return result


def html_pages(output):
    return sorted(Path(output).rglob("*.html"))


def local_hrefs(page):
    hrefs = re.findall(r'href="([^"]+)"', page.read_text())
    # External assets and the pre-existing (never shipped) favicon are not
    # report pages.
    return [h for h in hrefs
            if not h.startswith(("http://", "https://")) and h != "logo-circle.ico"]


@pytest.fixture
def stats_dir(tmp_path):
    return make_stats_dir(tmp_path / "stats")


def test_rel_href():
    assert rgcs.rel_href(AGGREGATE, FULL + "/go-cam-group-stats.html") == \
        FULL + "/go-cam-group-stats.html"
    assert rgcs.rel_href(FULL + "/drilldowns/groups/mgi/unique-go-terms.html", AGGREGATE) == \
        "../../../../" + AGGREGATE
    assert rgcs.rel_href(FULL + "/go-cam-group-stats.html",
                         FULL + "/group-curator-stats/go-cam-group-curator-stats-mgi.html") == \
        "group-curator-stats/go-cam-group-curator-stats-mgi.html"


def test_top_level_shows_only_aggregate_page(tmp_path, stats_dir):
    output = tmp_path / "out"
    run_report(tmp_path, stats_dir, output, data_subdir=FULL + "/data")
    assert sorted(os.listdir(output)) == sorted([AGGREGATE, FULL])


def test_top_level_without_data_subdir(tmp_path, stats_dir):
    output = tmp_path / "out"
    run_report(tmp_path, stats_dir, output)
    assert sorted(os.listdir(output)) == sorted([AGGREGATE, FULL])
    assert not (output / FULL / "data").exists()


def test_report_layout(tmp_path, stats_dir):
    output = tmp_path / "out"
    run_report(tmp_path, stats_dir, output)
    full = output / FULL
    for rel in [
        "go-cam-group-stats.html",
        "go-cam-curator-stats.html",
        "go-cam-protein-complex.html",
        "go-cam-protein-complex.tsv",
        "go-cam-variable-definitions.html",
        "group-curator-stats/go-cam-group-curator-stats-mgi.html",
        "group-curator-stats/go-cam-group-curator-stats-other.html",
        "drilldowns/aggregate/go-cam-unique-gene-product-enablers.html",
        "drilldowns/aggregate/go-cam-unique-pmids.html",
        "drilldowns/groups/mgi/unique-gene-product-enablers.html",
        "drilldowns/curators/0000-0001-0000-0001/unique-go-terms.html",
        "drilldowns/curators/0000-0002-0000-0002/unique-chemical-inputs.html",
    ]:
        assert (full / rel).is_file(), rel
    # No report page is left loose at the top of full-go-cam-stats/ except the
    # four entity/record reports.
    loose = sorted(p.name for p in full.iterdir() if p.is_file())
    assert loose == [
        "go-cam-curator-stats.html",
        "go-cam-group-stats.html",
        "go-cam-protein-complex.html",
        "go-cam-protein-complex.tsv",
        "go-cam-variable-definitions.html",
    ]


def test_every_relative_link_resolves(tmp_path, stats_dir):
    output = tmp_path / "out"
    run_report(tmp_path, stats_dir, output)
    pages = html_pages(output)
    assert len(pages) > 20
    checked = 0
    for page in pages:
        for href in local_hrefs(page):
            target = (page.parent / href).resolve()
            assert target.is_file(), "{} -> {}".format(page.relative_to(output), href)
            checked += 1
    assert checked > 100


def test_every_page_links_back_to_aggregate(tmp_path, stats_dir):
    output = tmp_path / "out"
    run_report(tmp_path, stats_dir, output)
    aggregate = (output / AGGREGATE).resolve()
    for page in html_pages(output):
        if page.name == AGGREGATE:
            continue
        targets = {(page.parent / h).resolve() for h in local_hrefs(page)}
        assert aggregate in targets, str(page.relative_to(output))


def test_aggregate_page_links_into_full_stats(tmp_path, stats_dir):
    output = tmp_path / "out"
    run_report(tmp_path, stats_dir, output)
    hrefs = local_hrefs(output / AGGREGATE)
    assert FULL + "/go-cam-group-stats.html" in hrefs
    assert FULL + "/drilldowns/aggregate/go-cam-unique-gene-product-enablers.html" in hrefs


def test_data_subdir_copies_inputs(tmp_path, stats_dir):
    output = tmp_path / "out"
    before = sorted(str(p.relative_to(stats_dir)) for p in stats_dir.rglob("*"))
    run_report(tmp_path, stats_dir, output, data_subdir=FULL + "/data")
    data = output / FULL / "data"
    copied = sorted(str(p.relative_to(data)) for p in data.rglob("*"))
    assert copied == before
    # The input directory is left untouched when it is not the output.
    assert sorted(str(p.relative_to(stats_dir)) for p in stats_dir.rglob("*")) == before


def test_data_subdir_in_place_moves_inputs(tmp_path, stats_dir):
    before = sorted(str(p.relative_to(stats_dir)) for p in stats_dir.rglob("*"))
    run_report(tmp_path, stats_dir, stats_dir, data_subdir=FULL + "/data")
    assert sorted(os.listdir(stats_dir)) == sorted([AGGREGATE, FULL])
    data = stats_dir / FULL / "data"
    moved = sorted(str(p.relative_to(data)) for p in data.rglob("*"))
    assert moved == before


def test_data_subdir_in_place_skips_old_report_files(tmp_path, stats_dir):
    # Report pages from an earlier (flat-layout) run are not stats data.
    (stats_dir / "go-cam-group-stats.html").write_text("old")
    (stats_dir / "go-cam-protein-complex.tsv").write_text("old")
    run_report(tmp_path, stats_dir, stats_dir, data_subdir=FULL + "/data")
    data = stats_dir / FULL / "data"
    assert not (data / "go-cam-group-stats.html").exists()
    assert not (data / "go-cam-protein-complex.tsv").exists()


@pytest.mark.parametrize("bad", ["/abs/data", "../data", "", "."])
def test_data_subdir_must_stay_inside_output(tmp_path, stats_dir, bad):
    result = CliRunner().invoke(rgcs.main, [
        "--directory", str(stats_dir),
        "--template", str(SCRIPTS_DIR / "go-cam-stats-template.html"),
        "--output", str(tmp_path / "out"),
        "--data-subdir", bad,
    ])
    assert result.exit_code != 0
