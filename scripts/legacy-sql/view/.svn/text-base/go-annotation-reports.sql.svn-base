-- ****************************************
-- annotation reports
-- ****************************************
-- useful high-level summary reports

-- @@ total_gps_by_species
-- total number of GPs in the database instance grouped by species
CREATE OR REPLACE VIEW total_gps_by_species AS
 SELECT 
  species.id AS species_id,
  species.ncbi_taxa_id,
  species.genus,
  species.species,
  species.common_name,
  count(*) AS total_gps
 FROM
  gene_product INNER JOIN species ON (species.id=gene_product.species_id)
 GROUP BY 
  species_id,
  species.ncbi_taxa_id,
  species.genus,
  species.species,
  species.common_name
 ORDER BY
  total_gps;

-- @@ total_gps_by_dbname
-- total number of GPs in the database instance grouped by contributing database (eg FlyBase, UniProt, ..)
CREATE OR REPLACE VIEW total_gps_by_dbname AS
 SELECT 
  dbxref.xref_dbname,
  count(*) AS total_gps
 FROM
  gene_product INNER JOIN dbxref ON (dbxref.id=gene_product.dbxref_id)
 GROUP BY 
  dbxref.xref_dbname
 ORDER BY
  total_gps;

CREATE OR REPLACE VIEW total_annotated_entities_by_dbname_and_type AS
 SELECT 
  dbxref.xref_dbname,
  tt.acc,
  count(*) AS total_gps
 FROM
  gene_product 
  INNER JOIN dbxref ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN term AS tt ON (tt.id=gene_product.type_id)
 GROUP BY 
  dbxref.xref_dbname,
  tt.acc
 ORDER BY
  xref_dbname,acc;

-- @@ non_iea_annotated_total_gps_by_dbname
-- slow in mysql5.0
CREATE OR REPLACE VIEW non_iea_annotated_total_gps_by_dbname AS
 SELECT 
  dbxref.xref_dbname,
  count(distinct gene_product.id) AS total
 FROM
  gene_product 
  INNER JOIN dbxref ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN evidence ON (evidence.association_id=association.id)
 WHERE
  code !='IEA'
 GROUP BY 
  dbxref.xref_dbname
 ORDER BY
  total;

-- @@ annotated_total_gps_by_evidence_code_non_additive
-- non-additive: summing the totals does not give the total number of gene products; this is because they are double counted
-- through distinct annotations using different codes
CREATE OR REPLACE VIEW annotated_total_gps_by_evidence_code_non_additive AS
 SELECT 
  code,
  count(distinct association.gene_product_id) AS total
 FROM
  association
  INNER JOIN evidence ON (evidence.association_id=association.id)
 GROUP BY
  code;

-- @@ non_iea_annotated_total_gps
-- ungrouped: single number
CREATE OR REPLACE VIEW non_iea_annotated_total_gps AS
 SELECT 
  count(distinct association.gene_product_id) AS total
 FROM
  association
  INNER JOIN evidence ON (evidence.association_id=association.id)
 WHERE
  code !='IEA';

-- @@ iea_annotated_total_gps
-- ungrouped: single number
CREATE OR REPLACE VIEW iea_annotated_total_gps AS
 SELECT 
  count(distinct association.gene_product_id) AS total
 FROM
  association
  INNER JOIN evidence ON (evidence.association_id=association.id)
 WHERE
  code ='IEA';

-- @@ non_iea_or_iss_annotated_total_gps
-- ungrouped: single number
CREATE OR REPLACE VIEW non_iea_or_iss_annotated_total_gps AS
 SELECT 
  count(distinct association.gene_product_id) AS total
 FROM
  association
  INNER JOIN evidence ON (evidence.association_id=association.id)
 WHERE
  code !='IEA' AND code !='ISS';

-- @@ iea_or_iss_annotated_total_gps
-- ungrouped: single number
CREATE OR REPLACE VIEW iea_or_iss_annotated_total_gps AS
 SELECT 
  count(distinct association.gene_product_id) AS total
 FROM
  association
  INNER JOIN evidence ON (evidence.association_id=association.id)
 WHERE
  code ='IEA' OR code ='ISS';

-- @@ association_total_by_evidence_code
-- this total IS additive
CREATE OR REPLACE VIEW association_total_by_evidence_code AS
 SELECT 
  code,
  count(distinct association_id) AS total
 FROM
  evidence
 GROUP BY
  code;

CREATE OR REPLACE VIEW association_total_by_evidence_code_and_species AS
 SELECT 
  species.ncbi_taxa_id,
  species.genus,
  species.species,
  species.common_name,
  code,
  count(distinct association_id) AS total_associations
 FROM
  evidence
  INNER JOIN association ON (evidence.association_id=association.id)
  INNER JOIN gene_product ON (association.gene_product_id=gene_product.id)
  INNER JOIN species ON (gene_product.species_id=species.id)
 GROUP BY
  species.ncbi_taxa_id,
  species.genus,
  species.species,
  species.common_name,
  code;

CREATE OR REPLACE VIEW association_total_by_evidence_code_and_top_species AS
 SELECT 
  species.ncbi_taxa_id,
  species.genus,
  species.species,
  species.common_name,
  code,
  count(distinct association_id) AS total_associations
 FROM
  evidence
  INNER JOIN association ON (evidence.association_id=association.id)
  INNER JOIN gene_product ON (association.gene_product_id=gene_product.id)
  INNER JOIN total_gps_by_species AS species ON (gene_product.species_id=species.species_id)
 WHERE
  species.total_gps > 100
 GROUP BY
  species.ncbi_taxa_id,
  species.genus,
  species.species,
  species.common_name,
  code;

-- @@ annotated_publication_total_by_evidence_code_non_additive
-- non-additive: summing the totals does not give the total number of publications; this is because a publication
-- may describe two or more distinct pieces of evidence
CREATE OR REPLACE VIEW annotated_publication_total_by_evidence_code_non_additive AS
 SELECT 
  code,
  count(distinct dbxref_id) AS total
 FROM
  evidence
 GROUP BY
  code;

-- @@ annotated_publication_total
-- ungrouped: single number
CREATE OR REPLACE VIEW annotated_publication_total AS
 SELECT 
  count(distinct dbxref_id) AS total
 FROM
  evidence;


-- ========================================
-- dbxref linking tables
-- ========================================

-- @@ seq_dbxref_summary
-- what kind of dbxrefs links to seqs: grouped by database type
-- Many different tables link to the general purpose dbxref table. This summarises one kind of link
CREATE OR REPLACE VIEW seq_dbxref_summary AS
 SELECT xref_dbname, COUNT(*) AS num_seq_dbxrefs
 FROM seq_dbxref AS x INNER JOIN dbxref AS d ON (x.dbxref_id=d.id)
 GROUP BY xref_dbname;

-- @@ term_dbxref_summary
-- what kind of dbxrefs links to terms: grouped by database type
-- Many different tables link to the general purpose dbxref table. This summarises one kind of link
CREATE OR REPLACE VIEW term_dbxref_summary AS
 SELECT xref_dbname, COUNT(*) AS num_term_dbxrefs
 FROM term_dbxref AS x INNER JOIN dbxref AS d ON (x.dbxref_id=d.id)
 GROUP BY xref_dbname;

-- @@ gene_product_dbxref_summary
-- what kind of dbxrefs links to gene_products: grouped by database type
-- Many different tables link to the general purpose dbxref table. This summarises one kind of link
CREATE OR REPLACE VIEW gene_product_dbxref_summary AS
 SELECT xref_dbname, COUNT(*) AS num_gene_product_dbxrefs
 FROM gene_product AS x INNER JOIN dbxref AS d ON (x.dbxref_id=d.id)
 GROUP BY xref_dbname;

-- @@ evidence_pub_dbxref_summary
-- what kind of dbxrefs links to evidence as the primary publication: grouped by database type
-- Many different tables link to the general purpose dbxref table. This summarises one kind of link
CREATE OR REPLACE VIEW evidence_pub_dbxref_summary AS
 SELECT xref_dbname, COUNT(*) AS num_evidence_dbxrefs
 FROM evidence AS x INNER JOIN dbxref AS d ON (x.dbxref_id=d.id)
 GROUP BY xref_dbname;

-- @@ evidence_dbxref_summary
-- what kind of dbxrefs links to evidences on with WITH field: grouped by database type
-- Many different tables link to the general purpose dbxref table. This summarises one kind of link
CREATE OR REPLACE VIEW evidence_dbxref_summary AS
 SELECT xref_dbname, COUNT(*) AS num_evidence_dbxrefs
 FROM evidence_dbxref AS x INNER JOIN dbxref AS d ON (x.dbxref_id=d.id)
 GROUP BY xref_dbname;



-- ========================================
-- totals per gene product
-- ========================================

-- @@ total_annotations_per_gp
-- count of distinct direct annotations broken down by gene product
-- note: does not correspnd to lines in gene_association file
CREATE OR REPLACE VIEW total_annotations_per_gp AS
 SELECT gene_product_id,count(DISTINCT id) AS total_annotations
 FROM 
  association
 GROUP BY gene_product_id;

-- @@ total_nonroot_annotations_per_gp
-- as total_annotations_per_gp, excluding direct annotations to root
CREATE OR REPLACE VIEW total_nonroot_annotations_per_gp AS
 SELECT gene_product_id,count(DISTINCT id) AS total_annotations
 FROM 
  association
 WHERE NOT EXISTS (SELECT * FROM root_term WHERE root_term.id=association.term_id)
 GROUP BY gene_product_id;

CREATE OR REPLACE VIEW total_pubs AS
 SELECT count(DISTINCT evidence.dbxref_id) AS total_pubs
 FROM 
  evidence;

-- @@ total_terms_per_gp
-- total number of distinct publications this gp is annotated with
DROP TABLE IF EXISTS total_pubs_per_gp;
CREATE OR REPLACE VIEW total_pubs_per_gp AS
 SELECT gene_product_id,
  count(DISTINCT evidence.dbxref_id) AS total_pubs
 FROM 
  association
  INNER JOIN evidence ON (association.id=evidence.association_id)
 GROUP BY gene_product_id;

-- @@ total_nonroot_pubs_per_gp
-- as total_terms_per_gp, excludes any annotations to root nodes
DROP TABLE IF EXISTS total_nonroot_pubs_per_gp;
CREATE OR REPLACE VIEW total_nonroot_pubs_per_gp AS
 SELECT gene_product_id,
  count(DISTINCT evidence.dbxref_id) AS total_pubs
 FROM 
  association
  INNER JOIN evidence ON (association.id=evidence.association_id)
 WHERE NOT EXISTS (SELECT * FROM root_term WHERE root_term.id=association.term_id)
 GROUP BY gene_product_id;

-- @@ total_terms_per_gp
-- total number of terms this gp is annotated with, EXCLUDING transitive annotations
DROP TABLE IF EXISTS total_terms_per_gp;
CREATE OR REPLACE VIEW total_terms_per_gp AS
 SELECT gene_product_id,count(DISTINCT association.term_id) AS total_terms
 FROM 
  association
 GROUP BY gene_product_id;

-- @@ total_nonroot_terms_per_gp
-- as total_terms_per_gp, excluding annotations to root
DROP TABLE IF EXISTS total_nonroot_terms_per_gp;
CREATE OR REPLACE VIEW total_nonroot_terms_per_gp AS
 SELECT gene_product_id,count(DISTINCT association.term_id) AS total_terms
 FROM 
  association
 WHERE NOT EXISTS (SELECT * FROM root_term WHERE root_term.id=association.term_id)
 GROUP BY gene_product_id;

-- @@ total_transitive_terms_per_gp
-- total number of terms this gp is annotated with, INCLUDING transitive annotations
-- i.e. all terms above this gp in DAG
DROP TABLE IF EXISTS total_transitive_terms_per_gp;
CREATE OR REPLACE VIEW total_transitive_terms_per_gp AS
 SELECT gene_product_id,count(DISTINCT graph_path.term1_id) AS total_transitive_terms
 FROM 
  association
  INNER JOIN graph_path ON (graph_path.term2_id=association.term_id)
 GROUP BY gene_product_id;

-- @@ total_non_root_transitive_terms_per_gp
-- total_transitive_terms_per_gp, but excludes any annotations to a root node
DROP TABLE IF EXISTS total_nonroot_transitive_terms_per_gp;
CREATE OR REPLACE VIEW total_nonroot_transitive_terms_per_gp AS
 SELECT gene_product_id,count(DISTINCT graph_path.term1_id) AS total_transitive_terms
 FROM 
  association
  INNER JOIN graph_path ON (graph_path.term2_id=association.term_id)
 WHERE NOT EXISTS (SELECT * FROM root_term WHERE root_term.id=association.term_id)
 GROUP BY gene_product_id;

CREATE OR REPLACE VIEW total_nonroot_transitive_terms_per_gp_pair AS
 SELECT 
  a1.gene_product_id AS gp1_id,
  a2.gene_product_id AS gp2_id,
  count(DISTINCT tc1.term1_id) AS total_transitive_terms
 FROM 
  association AS a1,
  graph_path AS tc1,
  graph_path AS tc2,
  association AS a2
 WHERE
   tc1.term2_id=a1.term_id
  AND tc2.term2_id=a2.term_id
  AND tc1.term1_id=tc2.term1_id
  AND
       NOT EXISTS (SELECT * FROM root_term WHERE root_term.id=a1.term_id 
                                              OR root_term.id=a1.term_id)
 GROUP BY gp1_id,gp2_id;

-- ========================================
-- broken down by ontology
-- ========================================

-- @@ total_transitive_terms_per_gp_ont
-- total number of terms this gp is annotated with, INCLUDING transitive annotations
-- i.e. all terms above this gp in DAG
-- too many rows to materialize?
CREATE OR REPLACE VIEW total_transitive_terms_per_gp_ont AS
 SELECT 
  term_type,
  gene_product_id,
  count(DISTINCT graph_path.term1_id) AS total_transitive_terms
 FROM 
  association
  INNER JOIN graph_path ON (graph_path.term2_id=association.term_id)
  INNER JOIN term ON (term.id=graph_path.term1_id)
 GROUP BY 
  term_type,
  gene_product_id;


-- ========================================
-- averages, broken down by db
-- ========================================

-- @@ avg_total_annotations_per_gp_by_db
CREATE OR REPLACE VIEW avg_total_annotations_per_gp_by_db AS
 SELECT xref_dbname,
  avg(total_annotations) AS avg_total_annotations
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_annotations_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
 GROUP BY xref_dbname;

-- @@ avg_total_nonroot_annotations_per_gp_by_db
CREATE OR REPLACE VIEW avg_total_nonroot_annotations_per_gp_by_db AS
 SELECT xref_dbname,
  avg(total_annotations) AS avg_total_annotations
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_annotations_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
 GROUP BY xref_dbname;


-- @@ avg_total_terms_per_gp_by_db
CREATE OR REPLACE VIEW avg_total_pubs_per_gp_by_db AS
 SELECT xref_dbname,
  avg(total_pubs) AS avg_total_pubs
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_pubs_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
 GROUP BY xref_dbname;

-- @@ avg_total_nonroot_terms_per_gp_by_db
CREATE OR REPLACE VIEW avg_total_nonroot_pubs_per_gp_by_db AS
 SELECT xref_dbname,
  avg(total_pubs) AS avg_total_pubs
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_pubs_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
 GROUP BY xref_dbname;

-- @@ avg_total_pubs_per_gp_by_db_filtered
CREATE OR REPLACE VIEW avg_total_pubs_per_gp_by_db_filtered AS
 SELECT xref_dbname,
  avg(total_pubs) AS avg_total_pubs
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_pubs_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN species ON (gene_product.species_id=species.id)
 WHERE (xref_dbname!='UniProt' && xref_dbname!='PDB')
   OR common_name='human'
 GROUP BY xref_dbname;

-- @@ avg_total_nonroot_pubs_per_gp_by_db_filtered
CREATE OR REPLACE VIEW avg_total_nonroot_pubs_per_gp_by_db_filtered AS
 SELECT xref_dbname,
  avg(total_pubs) AS avg_total_pubs
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_pubs_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN species ON (gene_product.species_id=species.id)
 WHERE (xref_dbname!='UniProt' && xref_dbname!='PDB')
   OR common_name='human'
 GROUP BY xref_dbname;

-- @@ avg_total_terms_per_gp_by_db
-- average term coverage broken down by annotation DB
-- here, term coverage is the DIRECT term count for that gene product
-- see also: avg_total_transitive_terms_per_gp_by_db
CREATE OR REPLACE VIEW avg_total_terms_per_gp_by_db AS
 SELECT 
  xref_dbname,
  avg(total_terms) AS avg_total_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
 GROUP BY xref_dbname;

-- @@ avg_total_nonroot_terms_per_gp_by_db
-- as avg_total_terms_per_gp_by_db, excluding direct annotations to root
CREATE OR REPLACE VIEW avg_total_nonroot_terms_per_gp_by_db AS
 SELECT 
  xref_dbname,
  avg(total_terms) AS avg_total_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
 GROUP BY xref_dbname;

-- @@ avg_total_terms_per_gp_by_db_filtered
-- as avg_total_terms_per_gp_by_db, excluding any UniProt that is not human
CREATE OR REPLACE VIEW avg_total_terms_per_gp_by_db_filtered AS
 SELECT 
  xref_dbname,
  avg(total_terms) AS avg_total_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN species ON (gene_product.species_id=species.id)
  WHERE (xref_dbname!='UniProt' && xref_dbname!='PDB')
   OR common_name='human'
 GROUP BY xref_dbname;

-- @@ avg_total_nonroot_terms_per_gp_by_db_filtered
-- as avg_total_terms_per_gp_by_db_filtered, excluding direct annotations to root
CREATE OR REPLACE VIEW avg_total_nonroot_terms_per_gp_by_db_filtered AS
 SELECT 
  xref_dbname,
  avg(total_terms) AS avg_total_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN species ON (gene_product.species_id=species.id)
  WHERE (xref_dbname!='UniProt' && xref_dbname!='PDB')
   OR common_name='human'
 GROUP BY xref_dbname;

-- @@ avg_total_transitive_terms_per_gp_by_db
-- average term coverage broken down by annotation DB
-- here, term coverage is the transitive term count for that gene product -
-- i.e. everything above those gene products in the graph.
-- gene products wth multiple "clustered" annotations will thus have a lower
-- score than the same number of annotations distributed around the DAG.
-- similarly, annotations deeper in the DAG will score higher, as everything
-- above is counted
DROP TABLE IF EXISTS avg_total_transitive_terms_per_gp_by_db;
CREATE OR REPLACE VIEW avg_total_transitive_terms_per_gp_by_db AS
 SELECT 
  xref_dbname,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
 GROUP BY xref_dbname;

CREATE OR REPLACE VIEW avg_total_transitive_terms_per_gp AS
 SELECT 
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  total_transitive_terms_per_gp;

-- @@ avg_total_nonroot_transitive_terms_per_gp_by_db
-- as_total_transitive_terms_per_gp_by_db, excluding root
DROP TABLE IF EXISTS avg_total_nonroot_transitive_terms_per_gp_by_db;
CREATE OR REPLACE VIEW avg_total_nonroot_transitive_terms_per_gp_by_db AS
 SELECT 
  xref_dbname,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
 GROUP BY xref_dbname;

CREATE OR REPLACE VIEW avg_total_nonroot_transitive_terms_per_gp AS
 SELECT 
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  total_nonroot_transitive_terms_per_gp;

-- @@ avg_total_transitive_terms_per_gp_by_db_filtered
-- as avg_total_transitive_terms_per_gp_by_db, excluding non-human UniProt
DROP TABLE IF EXISTS avg_total_transitive_terms_per_gp_by_db_filtered;
CREATE OR REPLACE VIEW avg_total_transitive_terms_per_gp_by_db_filtered AS
 SELECT 
  xref_dbname,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN species ON (gene_product.species_id=species.id)
 WHERE (xref_dbname!='UniProt' && xref_dbname!='PDB')
   OR common_name='human'
 GROUP BY xref_dbname;

DROP TABLE IF EXISTS avg_total_nonroot_transitive_terms_per_gp_by_db_filtered;
CREATE OR REPLACE VIEW avg_total_nonroot_transitive_terms_per_gp_by_db_filtered AS
 SELECT 
  xref_dbname,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN species ON (gene_product.species_id=species.id)
 WHERE (xref_dbname!='UniProt' && xref_dbname!='PDB')
   OR common_name='human'
 GROUP BY xref_dbname;


-- ========================================
-- apparent contradictions
-- ========================================


-- @@ association_contradiction_direct 
-- APPARENT contradictions in associations, based on the NOT column.
-- note that these do not genuinely contradict as annotation is context-specific
CREATE OR REPLACE VIEW association_contradiction_direct AS
SELECT
 term.*,
 a_pos.id               AS a_pos_id,
 gp.id                  AS gp_id,
 gp.symbol              AS gp_symbol,
 gp.dbxref_id           AS gp_dbxref_id,
 gp.species_id          AS gp_species_id,
 a_neg.id               AS a_neg_id
FROM
 term
 INNER JOIN association AS a_pos ON (term.id=a_pos.term_id)
 INNER JOIN gene_product AS gp ON (a_pos.gene_product_id=gp.id)
 INNER JOIN association AS a_neg ON (term.id=a_neg.term_id AND a_neg.gene_product_id=gp.id)
WHERE
 a_pos.is_not = 0
 AND a_neg.is_not = 1;

-- @@ association_contradiction_direct_count_by_ontology 
CREATE OR REPLACE VIEW association_contradiction_direct_count_by_ontology AS
 SELECT term_type,
        count(distinct gp_id)
  FROM association_contradiction_direct
  GROUP BY term_type;

-- @@ association_contradiction AS
-- two associations contradict if:
--  P assoc T+
--  P assoc T-
--  T+ child-of T-
CREATE OR REPLACE VIEW association_contradiction AS
SELECT
 term_pos.id            AS term_pos_id,
 term_pos.acc           AS term_pos_acc,
 term_pos.name          AS term_pos_name,
 term_pos.term_type     AS term_pos_term_type,
 term_neg.id            AS term_neg_id,
 term_neg.acc           AS term_neg_acc,
 term_neg.name          AS term_neg_name,
 term_neg.term_type     AS term_neg_term_type,
 a_pos.id               AS a_pos_id,
 gp.id                  AS gp_id,
 gp.symbol              AS gp_symbol,
 gp.dbxref_id           AS gp_dbxref_id,
 gp.species_id          AS gp_species_id,
 a_neg.id               AS a_neg_id
FROM
 term AS term_pos
 INNER JOIN association AS a_pos ON (term_pos.id=a_pos.term_id)
 INNER JOIN graph_path ON (term_pos.id=graph_path.term2_id)
 INNER JOIN association AS a_neg ON (graph_path.term1_id=a_neg.term_id)
 INNER JOIN gene_product AS gp ON (a_neg.gene_product_id=gp.id AND a_pos.gene_product_id=gp.id)
 INNER JOIN term AS term_neg ON (term_neg.id=a_neg.term_id)
WHERE
 a_pos.is_not = 0
 AND a_neg.is_not = 1;

-- @@ association_contradiction_count_by_ontology
-- summary of association_contradiction, grouped by ontology
CREATE OR REPLACE VIEW association_contradiction_count_by_ontology AS
 SELECT term_pos_term_type,
        count(distinct gp_id)
  FROM association_contradiction
  GROUP BY term_pos_term_type;

-- ========================================
-- cell fraction terms
-- ========================================

CREATE OR REPLACE VIEW term_association_count_by_fraction_type AS
 SELECT 
  term.acc,
  term.name,
  term.term_type,
  count(DISTINCT gene_product_id) AS n_genes
 FROM
  association
  INNER JOIN term ON (association.term_id=term.id)
 WHERE
  term.id IN (SELECT term2_id FROM graph_path INNER JOIN term AS p ON (p.id=term1_id) WHERE p.acc='GO:0000267')
 GROUP BY
  term.acc,
  term.name,
  term.term_type;

CREATE OR REPLACE VIEW term_association_count_by_fraction_type_and_evidence AS
 SELECT 
  term.acc,
  term.name,
  term.term_type,
  e.code,
  count(DISTINCT gene_product_id) AS n_genes
 FROM
  association
  INNER JOIN term ON (association.term_id=term.id)
  INNER JOIN evidence AS e ON (association.id=e.association_id)
 WHERE
  term.id IN (SELECT term2_id FROM graph_path INNER JOIN term AS p ON (p.id=term1_id) WHERE p.acc='GO:0000267')
 GROUP BY
  term.acc,
  term.name,
  term.term_type,
  e.code;

CREATE OR REPLACE VIEW term_association_count_by_frac_ev_qual AS
 SELECT 
  term.acc,
  term.name,
  term.term_type,
  e.code,
  qterm.acc AS qualifier,
  count(DISTINCT gene_product_id) AS n_genes
 FROM
  association
  INNER JOIN association_qualifier AS aq ON (aq.association_id=association.id)
  INNER JOIN term AS qterm ON (aq.term_id=qterm.id)
  INNER JOIN term ON (association.term_id=term.id)
  INNER JOIN evidence AS e ON (association.id=e.association_id)
 WHERE
  term.id IN (SELECT term2_id FROM graph_path INNER JOIN term AS p ON (p.id=term1_id) WHERE p.acc='GO:0000267')
 GROUP BY
  term.acc,
  term.name,
  term.term_type,
  e.code;

-- ========================================
-- species
-- ========================================

CREATE OR REPLACE VIEW num_species_annotated_by_term AS
 SELECT
  tc.term1_id AS term_id,
  COUNT(DISTINCT species_id) AS num_species
 FROM
  graph_path AS tc
  INNER JOIN association AS a ON (tc.term2_id=a.term_id)
  INNER JOIN gene_product AS g ON (a.gene_product_id=g.id)
 GROUP BY tc.term1_id;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('num_species_annotated_by_term');
-- CREATE UNIQUE INDEX num_species_annotated_by_term_idx1 ON num_species_annotated_by_term(term_id);
-- END MATERIALIZE

-- ========================================
-- association qualifiers
-- ========================================

CREATE OR REPLACE VIEW association_count_by_association_qualifier AS
 SELECT 
  qterm.acc AS qualifier,
  count(DISTINCT association_id) AS n_associations
 FROM
  association_qualifier AS aq
  INNER JOIN term AS qterm ON (aq.term_id=qterm.id)
 GROUP BY
  qterm.acc;

CREATE OR REPLACE VIEW term_association_count_by_association_qualifier AS
 SELECT 
  term.acc,
  term.name,
  term.term_type,
  qterm.acc AS qualifier,
  count(DISTINCT association_id) AS n_associations
 FROM
  association_qualifier AS aq
  INNER JOIN term AS qterm ON (aq.term_id=qterm.id)
  INNER JOIN association ON (aq.association_id=association.id)
  INNER JOIN term ON (association.term_id=term.id)
 GROUP BY
  term.acc,
  term.name,
  term.term_type,
  qterm.acc;

CREATE OR REPLACE VIEW ont_association_count_by_association_qualifier AS
 SELECT 
  term.term_type,
  qterm.acc AS qualifier,
  count(DISTINCT association_id) AS n_associations
 FROM
  association_qualifier AS aq
  INNER JOIN term AS qterm ON (aq.term_id=qterm.id)
  INNER JOIN association ON (aq.association_id=association.id)
  INNER JOIN term ON (association.term_id=term.id)
 GROUP BY
  term.term_type,
  qterm.acc;

CREATE OR REPLACE VIEW association_count_by_association_qualifier_and_dbname AS
 SELECT 
  x.xref_dbname,
  qterm.acc AS qualifier,
  count(DISTINCT association_id) AS n_associations
 FROM
  association_qualifier AS aq
  INNER JOIN term AS qterm ON (aq.term_id=qterm.id)
  INNER JOIN association AS a ON (aq.association_id=a.id)
  INNER JOIN gene_product AS gp ON (a.gene_product_id=gp.id)
  INNER JOIN dbxref AS x ON (gp.dbxref_id=x.id)
 GROUP BY
  qterm.acc,
  x.xref_dbname;


-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_gps_by_species');
-- CREATE UNIQUE INDEX total_gps_by_species_idx1 ON total_gps_by_species(species_id);
-- CREATE INDEX total_gps_by_species_idx2 ON total_gps_by_species(total_gps);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_pubs_per_gp');
-- CREATE UNIQUE INDEX total_pubs_per_gp_idx1 ON total_pubs_per_gp(gene_product_id);
-- CREATE UNIQUE INDEX total_pubs_per_gp_idx2 ON total_pubs_per_gp(gene_product_id,total_pubs);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_terms_per_gp');
-- CREATE UNIQUE INDEX total_terms_per_gp_idx1 ON total_terms_per_gp(gene_product_id);
-- CREATE UNIQUE INDEX total_terms_per_gp_idx2 ON total_terms_per_gp(gene_product_id,total_terms);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_transitive_terms_per_gp');
-- CREATE UNIQUE INDEX total_transitive_terms_per_gp_idx1 ON total_transitive_terms_per_gp(gene_product_id);
-- CREATE UNIQUE INDEX total_transitive_terms_per_gp_idx2 ON total_transitive_terms_per_gp(gene_product_id,total_transitive_terms);
-- END MATERIALIZE


-- BEGIN MATERIALIZE
-- -- NONROOT --
-- CALL create_mview_in_place('total_nonroot_pubs_per_gp');
-- CREATE UNIQUE INDEX total_nonroot_pubs_per_gp_idx1 ON total_nonroot_pubs_per_gp(gene_product_id);
-- CREATE UNIQUE INDEX total_nonroot_pubs_per_gp_idx2 ON total_nonroot_pubs_per_gp(gene_product_id,total_pubs);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_nonroot_terms_per_gp');
-- CREATE UNIQUE INDEX total_nonroot_terms_per_gp_idx1 ON total_nonroot_terms_per_gp(gene_product_id);
-- CREATE UNIQUE INDEX total_nonroot_terms_per_gp_idx2 ON total_nonroot_terms_per_gp(gene_product_id,total_terms);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_nonroot_transitive_terms_per_gp');
-- CREATE UNIQUE INDEX total_nonroot_transitive_terms_per_gp_idx1 ON total_nonroot_transitive_terms_per_gp(gene_product_id);
-- CREATE UNIQUE INDEX total_nonroot_transitive_terms_per_gp_idx2 ON total_nonroot_transitive_terms_per_gp(gene_product_id,total_transitive_terms);
-- END MATERIALIZE

