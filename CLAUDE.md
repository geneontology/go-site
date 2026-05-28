# CLAUDE.md — go-site

Instructions for AI coding agents (Claude Code and friends) working in this repo.

## Project overview

`go-site` is the **metadata and configuration hub** for the
Gene Ontology (GO) Consortium — the data behind geneontology.org. Its GitHub
tracker also doubles as the **catch-all issue tracker** for GO work not tied to
another project.

In day-to-day practice this is **primarily a metadata-curation repo**: the
overwhelming majority of changes are small, hand-edited YAML files under
`metadata/` (new users, dataset source URLs, db-xref prefixes, GO_REFs, QC
rules), each gated by schema validation in CI. Optimize for getting those right.

Note on the pipeline: `go-site` has **never hosted the association-publishing
pipeline** — it hosts metadata, plus a few legacy scripts and tools under
`pipeline/` (and `graphstore/`). The production pipelines live in sister repos:
`geneontology/pipeline`, `geneontology/pipeline-from-goa`, and friends. Don't
treat code under `pipeline/` here as what's running in production.

## Tone

Polite, yet direct. Absolutely no sycophancy, and no "Great question!" energy.
Keep it professional, concise, and sharp.

## Repository layout

```
metadata/              # THE core of this repo — GO metadata, each *.yaml paired with a *.schema.yaml
  users.yaml           #   GOC members & contributors (ORCID, org, accounts, authorizations)
  groups.yaml          #   GOC groups / orgs (the values of 'contributor' / 'assigned_by')
  db-xrefs.yaml        #   CURIE/prefix linkout registry; feeds linkml/prefixmaps GO context
  datasets/*.yaml      #   Per-group annotation source files (one yaml per group: mgi, fb, goa, ...)
  gorefs.yaml          #   GO_REF publication registry (LinkML-validated)
  goex.yaml            #   Organism/taxon registry (LinkML-validated; see README.goex.yaml)
  rules/gorule-*.md    #   GO QC rules — YAML frontmatter + Markdown body, validated by SPARTA
  eco-usage-constraints.yaml, extensions-constraints.yaml, go-reference-species.yaml, ...
  group-contacts.csv
pipeline/              # LEGACY association-pipeline code. The live pipelines now run from the sister
                       #   repos geneontology/pipeline and geneontology/pipeline-from-goa — not here.
                       #   Treat this dir as historical unless you know otherwise.
graphstore/rule-runner/ # SPARTA — SPArql Rule Test Automation (the `sparta` CLI used in CI)
scripts/               # ~40 Python (+ some JS/Perl) maintenance & reporting scripts
releases/              # Timestamped release dirs (informational)
.github/workflows/     # CI: qc.yml (schema + sanity + SPARTA), goex.yml (LinkML)
drupal7/, cgi-bin/, static/, configurations/, fs-to-s3/   # legacy / infra, rarely touched
```

## Validation — run before every PR

CI (`.github/workflows/qc.yml` and `goex.yml`) is the source of truth for what
"valid" means. **A metadata edit is not done until its validator passes.** The
checks run in the `geneontology/dev-base` container; locally you need `kwalify`
(`apt-get install kwalify`) and `pip install linkml linkml-runtime graphstore/rule-runner`.

Most metadata files are validated with **kwalify** against their sibling schema:

```bash
# YAML metadata (users, groups, db-xrefs, datasets, extensions, reference-species):
kwalify -E -f metadata/users.schema.yaml    metadata/users.yaml
kwalify -E -f metadata/groups.schema.yaml   metadata/groups.yaml
kwalify -E -f metadata/db-xrefs.schema.yaml metadata/db-xrefs.yaml
kwalify -E -f metadata/datasets.schema.yaml metadata/datasets/*.yaml
# kwalify exits 0 even on errors — CI greps output for INVALID/ERROR. Eyeball the output.

# LinkML-validated files (different toolchain — do NOT use kwalify on these):
linkml-validate -s metadata/gorefs.schema.yaml      metadata/gorefs.yaml
linkml-validate -s metadata/goex.linkmlschema.yaml  metadata/goex.yaml

# Cross-file consistency (users must reference real groups, etc.):
python3 ./scripts/sanity-check-users-and-groups.py --verbose \
  --users metadata/users.yaml --groups metadata/groups.yaml

# GO rules (metadata/rules/*.md frontmatter):
sparta valid --rules metadata/rules/ --schema metadata/rules.schema.yaml
./scripts/rule-example-validation.sh   # requires: pip install -r pipeline/requirements.txt
```

Which validator applies to which file:

| File(s) | Validator | Schema |
|---|---|---|
| `users.yaml`, `groups.yaml`, `db-xrefs.yaml`, `datasets/*.yaml`, `extensions-constraints.yaml`, `go-reference-species.yaml` | `kwalify` | sibling `*.schema.yaml` |
| `gorefs.yaml` | `linkml-validate` | `gorefs.schema.yaml` |
| `goex.yaml` | `linkml-validate` (+ `linkml-convert -t json`) | `goex.linkmlschema.yaml` |
| `rules/gorule-*.md` | `sparta valid` | `rules.schema.yaml` |
| `users.yaml` + `groups.yaml` together | `sanity-check-users-and-groups.py` | — |

When editing YAML, **match the surrounding entries exactly** — field order,
quoting, and indentation in these files is conventional and consistent.
Look at neighboring records before adding a new one.

## Git & contribution workflow

- Work on a branch, never commit directly to `master`. Branch naming follows the
  GO org convention: `issue-<n>-<short-desc>` (e.g. `issue-2676-upnums`). Patch-style
  `<user>-patch-NN` branches also appear in history.
- **Every change should reference an issue.** Commit subjects in this repo are
  short and imperative and frequently end with `fixes #NNNN` or `(#NNNN)` /
  `(geneontology/<repo>#NN)` — e.g. `Update db-xrefs.yaml fixes #2657`.
- Open a PR against `master`; CI must be green; a GO Central member reviews and merges.
- Commit message trailer: end commits with `Co-Authored-By: Claude ...` per the
  user's global convention.

## Posting under the user's identity (important)

This is a `geneontology/*` (work-context) repo. Anything posted via `gh`
(issue/PR comments, reviews, **and fresh issue/PR bodies**) surfaces under the
user's name. Append an agency-disclosure trailer, e.g.:

> _— Posted by Claude Code agent on behalf of @kltm._

Does **not** apply to commit messages (already attributed via `Co-Authored-By`),
issue/PR titles, or files committed to the repo. Confirm before posting anything
third parties will read.

## Gotchas

- **The README is stale on CI**: it references `.travis.yml`, but validation is
  actually GitHub Actions (`.github/workflows/qc.yml`, `goex.yml`). Trust the
  workflows.
- **`kwalify` always exits 0** — it does not fail the shell on schema errors. CI
  greps its output for `INVALID`/`ERROR`. Don't assume a 0 exit means valid; read
  the output.
- **Two validation toolchains**: kwalify (Ruby) for most YAML, LinkML (Python)
  for `gorefs.yaml`/`goex.yaml`. Using the wrong one gives misleading results.
- **GO IDs are checksummed by their label** — never invent or guess a GO term,
  GO_REF, PMID, ORCID, NCBITaxon, or ECO ID. Verify against the canonical source
  (OLS/QuickGO/UniProt/the existing metadata) before adding one.
- **Scratch/untracked files**: the working tree often holds local scratch
  (`files.txt`, `out.log`, `invalid.log`, `target/`, `venv/`, editor `*~`
  backups). Do not commit these; do not `git add -A` blindly. Note that some
  `*~` backup files have been committed in the past under `metadata/` — don't
  add more.
- **Datasets source URLs** are migrating to GOex mirrors (see recent history,
  e.g. "Switch tair/zfin/sgn GAF sources to goex mirror"). Check recent commits
  before changing a dataset URL.
- Python pipeline pins specific versions (`ontobio==2.8.4`, `pyparsing==2.4.7`,
  `linkml==1.7.4`) — respect the pins; the toolchain is version-sensitive.

## Related repositories

- `geneontology/pipeline`, `geneontology/pipeline-from-goa` — the **live**
  association-publishing pipelines (the legacy `pipeline/` here is superseded)
- `geneontology/go-ontology` — the ontology itself (terms, axioms)
- `geneontology/go-annotation` — annotation issue tracking
- `geneontology/noctua`, `minerva`, `gocam-py` — GO-CAM curation stack
- `geneontology/operations` — infrastructure / deployment / ops runbooks
