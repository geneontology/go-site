-- ************************************************************
-- JOINS
-- ************************************************************
-- Collection of convenience views in which common table
-- compositions are pre-coordinated as views

-- @@ dbxrefd
-- combines fields in dbxref table in a conventional bipartite database identifier
-- by concatenating dbname and accession no. E.g. FlyBase:FBgn0000001
CREATE OR REPLACE VIEW dbxrefd AS
 SELECT *, concat(xref_dbname,':',xref_key) AS xref_str
 FROM dbxref;

-- @@ association_J_evidence
-- convenience join-view
CREATE OR REPLACE VIEW association_J_evidence AS
 SELECT
  e.*,
  a.is_not,
  a.term_id,
  a.gene_product_id
 FROM association AS a 
 INNER JOIN evidence AS e ON (a.id=e.association_id);

-- backwards compatibility..
CREATE OR REPLACE VIEW association_evidence AS
 SELECT
  e.*,
  a.is_not,
  a.term_id,
  a.gene_product_id
 FROM association AS a 
 INNER JOIN evidence AS e ON (a.id=e.association_id);

-- @@ association_J_evidence_J_gene_product
-- convenience join-view
CREATE OR REPLACE VIEW association_J_evidence_J_gene_product AS
 SELECT
  gp.*,
  e.dbxref_id AS evidence_dbxref_id,
  e.code,
  a.is_not,
  a.term_id,
  a.gene_product_id
 FROM association AS a 
 INNER JOIN evidence AS e ON (a.id=e.association_id)
 INNER JOIN gene_product AS gp ON (a.gene_product_id=gp.id);

-- @@ evidence_J_evidence_dbxref_J_dbxref
-- convenience join-view
CREATE OR REPLACE VIEW evidence_J_evidence_dbxref_J_dbxref AS
 SELECT
  evidence.code,
  evidence.dbxref_id AS evidence_primary_dbxref_id,
  evidence.association_id,
  evidence_dbxref.*,
  dbxref.xref_dbname,
  dbxref.xref_key
 FROM
  evidence
  INNER JOIN evidence_dbxref ON (evidence.id=evidence_dbxref.evidence_id)
  INNER JOIN dbxref ON (dbxref.id=evidence_dbxref.dbxref_id);


-- @@ term_J_association
-- convenience join-view.
CREATE OR REPLACE VIEW term_J_association AS
 SELECT
  term.name AS term_name,
  term.acc AS term_acc,
  term.term_type AS term_type,
  association.*
 FROM term
 INNER JOIN association ON (term.id=association.term_id);

-- @@ term_J_association_via_graph
-- TRANSITIVE association
CREATE OR REPLACE VIEW term_J_association_via_graph AS
 SELECT
  term.name AS term_name,
  term.acc AS term_acc,
  term.term_type AS term_type,
  graph_path.distance,
  association.id AS association_id,
  association.is_not,
  association.term_id AS association_term_id,
  association.term_id AS gene_product_id
 FROM term
 INNER JOIN graph_path ON (term.id=graph_path.term1_id)
 INNER JOIN association ON (graph_path.term2_id=association.term_id);

-- @@ term_J_association_J_gene_product
-- convenience join-view. DIRECT association between a gene product and a term
CREATE OR REPLACE VIEW term_J_association_J_gene_product AS
 SELECT
  term.name AS term_name,
  term.acc AS term_acc,
  term.term_type AS term_type,
  association.*,
  gene_product.symbol AS gp_symbol,
  gene_product.dbxref_id AS gp_dbxref_id,
  gene_product.species_id AS gp_species_id
 FROM term
 INNER JOIN association ON (term.id=association.term_id)
 INNER JOIN gene_product ON (association.gene_product_id=gene_product.id);

-- @@ term_J_association_J_gene_product_via_graph
-- convenience join-view. TRANSITIVE association between a gene product and a term
CREATE OR REPLACE VIEW term_J_association_J_gene_product_via_graph AS
 SELECT
  term.name AS superterm_name,
  term.acc AS superterm_acc,
  term.term_type AS superterm_type,
  association.*,
  gene_product.symbol AS gp_symbol,
  gene_product.dbxref_id AS gp_dbxref_id,
  gene_product.species_id AS gp_species_id
 FROM term
 INNER JOIN graph_path ON (term.id=graph_path.term1_id)
 INNER JOIN association ON (graph_path.term2_id=association.term_id)
 INNER JOIN gene_product ON (association.gene_product_id=gene_product.id);

-- @@ gene_product_with_term_pair_via_graph
-- co-occurrence of terms via annotations
CREATE OR REPLACE VIEW gene_product_with_term_pair_via_graph AS
 SELECT a1.*,
  term1.name AS term1_name,
  term1.acc  AS term1_acc,
  term1.term_type AS term1_type,
  term2.name AS term2_name,
  term2.acc  AS term2_acc,
  term2.term_type AS term2_type,
  a2.id AS association2_id,
  a2.is_not AS association2_is_not
 FROM 
  term AS term1
  INNER JOIN term_J_association_J_gene_product_via_graph AS a1 ON (term1.id=a1.term_id)
  INNER JOIN association AS a2 ON (a1.gene_product_id=a2.gene_product_id)
  INNER JOIN term AS term2 ON (term2.id=a2.term_id);
  

-- @@ term_J_association_J_evidence_J_gene_product
CREATE OR REPLACE VIEW term_J_association_J_evidence_J_gene_product AS
 SELECT 
  a.*,
  evidence.id AS evidence_id,
  evidence.code,
  evidence.seq_acc,
  evidence.dbxref_id AS evidence_dbxref_id,
  dbxref.xref_dbname AS pub_dbname,
  dbxref.xref_key AS pub_acc
 FROM term_J_association_J_gene_product AS a
  INNER JOIN evidence ON (evidence.association_id=a.id)
  INNER JOIN dbxref ON (evidence.dbxref_id=dbxref.id);

-- @@ term_J_association_J_species_via_graph
CREATE OR REPLACE VIEW term_J_association_J_species_via_graph AS
 SELECT
  term.name AS term_name,
  term.acc AS term_acc,
  term.term_type AS term_type,
  association.*,
  species.id AS species_id,
  species.common_name,
  species.ncbi_taxa_id
 FROM term
 INNER JOIN graph_path ON (term.id=graph_path.term1_id)
 INNER JOIN association ON (graph_path.term2_id=association.term_id)
 INNER JOIN gene_product ON (association.gene_product_id=gene_product.id)
 INNER JOIN species ON (gene_product.species_id=species.id);

-- @@ term_J_association_J_species_summary_via_graph
-- by-species summary of indirectly annotated terms
-- (this view may move to a different module: see go-taxon-views)
CREATE OR REPLACE VIEW term_J_association_J_species_summary_via_graph AS
 SELECT 
  term_name,
  term_acc,
  common_name,
  ncbi_taxa_id,
  count(*) AS total
 FROM
  term_J_association_J_species_via_graph
 GROUP BY
  term_name,
  term_acc,
  common_name,
  ncbi_taxa_id;

-- @@ gene_product_J_gene_product_synonym
-- convenience view for querying gene products by their synonyms
CREATE OR REPLACE VIEW gene_product_J_gene_product_synonym AS
 SELECT
  gene_product.*,
  gene_product_synonym.product_synonym
 FROM
  gene_product
  INNER JOIN gene_product_synonym ON (gene_product.id = gene_product_synonym.gene_product_id);

-- @@ gene_product_J_gene_product_property
CREATE OR REPLACE VIEW gene_product_J_gene_product_property AS
 SELECT
  gene_product.*,
  gene_product_property.property_key,
  gene_product_property.property_val
 FROM
  gene_product
  INNER JOIN gene_product_property ON (gene_product.id = gene_product_property.gene_product_id);

-- @@ gene_product_J_dbxref_via_seq
-- convenience view linking a GP to a dbxref view the seq table - this information is usually
-- sourced from the gp2protein info
CREATE OR REPLACE VIEW gene_product_J_dbxref_via_seq AS
 SELECT
  gene_product.*,
  dbxref.xref_key,
  dbxref.xref_dbname
 FROM
  gene_product
  INNER JOIN gene_product_seq ON (gene_product.id = gene_product_seq.gene_product_id)
  INNER JOIN seq_dbxref ON (gene_product_seq.seq_id = seq_dbxref.seq_id)
  INNER JOIN dbxref ON (dbxref.id = seq_dbxref.dbxref_id);

-- @@ gene_product_J_dbxref
CREATE OR REPLACE VIEW gene_product_J_dbxref AS
 SELECT
  gene_product.*,
  dbxref.xref_dbname,
  dbxref.xref_key
 FROM
  gene_product
  INNER JOIN dbxref ON (gene_product.dbxref_id = dbxref.id);

-- @@ term_J_term
-- term * term2term * term
CREATE OR REPLACE VIEW term_J_term AS
 SELECT
  term.acc AS acc,
  term.name AS name,
  term.term_type AS term_type,
  term2term.*,
  r.acc AS relation_acc,
  p.acc AS parent_acc,
  p.name AS parent_name,
  p.term_type AS parent_term_type
 FROM
  term
  INNER JOIN term2term ON (term.id=term2_id)
  INNER JOIN term AS p ON (term1_id=p.id)
  INNER JOIN term AS r ON (relationship_type_id=r.id);

-- @@ term_JT_term
-- term * graph_path * term
CREATE OR REPLACE VIEW term_JT_term AS
 SELECT
  term.acc AS acc,
  term.name AS name,
  term.term_type AS term_type,
  graph_path.*,
  r.acc AS relation_acc,
  p.acc AS parent_acc,
  p.name AS parent_name,
  p.term_type AS parent_term_type
 FROM
  term
  INNER JOIN graph_path ON (term.id=term2_id)
  INNER JOIN term AS p ON (term1_id=p.id)
  INNER JOIN term AS r ON (relationship_type_id=r.id);

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('dbxrefd');
-- CREATE UNIQUE INDEX dbxrefd_idx1 ON dbxrefd(id);
-- CREATE INDEX dbxrefd_idx2 ON dbxrefd(xref_key);
-- CREATE INDEX dbxrefd_idx3 ON dbxrefd(xref_dbname);
-- CREATE UNIQUE INDEX dbxrefd_idx4 ON dbxrefd(xref_str);
-- END MATERIALIZE

