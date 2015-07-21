CREATE OR REPLACE VIEW term_with_concat_synonyms AS
 SELECT
  term.*,
  GROUP_CONCAT(term_synonym ORDER BY term_synonym SEPARATOR '|') AS synonyms
 FROM
  term
  INNER JOIN term_synonym ON (term.id=term_synonym.term_id)
 GROUP BY
  id,
  name,
  term_type,
  acc,
  is_obsolete,
  is_root;

CREATE OR REPLACE VIEW gene_product_with_concat_synonyms AS
 SELECT
  gp.*,
  GROUP_CONCAT(product_synonym ORDER BY product_synonym SEPARATOR '|') AS synonyms
 FROM
  gene_product AS gp
  INNER JOIN gene_product_synonym AS gp2s ON (gp.id=gp2s.gene_product_id)
 GROUP BY
  gp.id,
  gp.symbol,
  gp.dbxref_id,
  gp.species_id,
  gp.type_id,
  gp.full_name;

CREATE OR REPLACE VIEW evidence_with_dbxref AS
 SELECT
  e.*,
  x1.xref_dbname AS x1_dbname,
  x1.xref_key AS x1_key,
  CONCAT_WS(x1.xref_dbname, x1.xref_key) AS x1_xref,
  x2.id AS x2_id,
  x2.xref_dbname AS x2_dbname,
  x2.xref_key AS x2_key,
  CONCAT_WS(x2.xref_dbname, x2.xref_key) AS x2_xref
 FROM
  evidence AS e
  INNER JOIN evidence_dbxref AS ex ON (e.id=ex.evidence_id)
  INNER JOIN dbxref AS x2 ON (x2.id=ex.dbxref_id)
  INNER JOIN dbxref AS x1 ON (x1.id=e.dbxref_id);

-- necessary? seq_acc already denormalized
CREATE OR REPLACE VIEW evidence_with_concat_dbxref AS
 SELECT
  e.*,
  GROUP_CONCAT(x2_xref SEPARATOR '|') AS withs
 FROM
  evidence AS e
  INNER JOIN evidence_dbxref AS ex ON (e.id=ex.evidence_id)
  INNER JOIN dbxref AS x2 ON (x2.id=ex.dbxref_id)
  INNER JOIN dbxref AS x1 ON (x1.id=e.dbxref_id)
 GROUP BY
  e.id,
  e.code,
  e.association_id,
  e.dbxref_id,
  x1_dbname,
  x1_key;



-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('term_with_concat_synonyms');
-- CREATE UNIQUE INDEX term_with_concat_synonyms_idx1 ON term_with_concat_synonyms(id);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('gene_product_with_concat_synonyms');
-- CREATE UNIQUE INDEX gene_product_with_concat_synonyms_idx1 ON gene_product_with_concat_synonyms(id);
-- END MATERIALIZE

