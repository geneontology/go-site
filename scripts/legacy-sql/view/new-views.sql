-- these views require new tables

-- ** for: go-graph-views **

-- @@ avg_max_distance_to_leaf_term_by_annotsubset
-- average maximum-distance-to-leaf per annotation, partitioned by annotation source (eg FlyBase, UniProt, ...)
-- excludes annotations to root nodes (aka "unknowns")
DROP TABLE IF EXISTS avg_max_distance_to_leaf_term_by_annotsubset;
CREATE OR REPLACE VIEW avg_max_distance_to_leaf_term_by_annotsubset AS
 SELECT
  subset.acc AS annotsubset,
  avg(max_distance) AS avg_max_distance
 FROM
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN max_distance_to_leaf_by_term ON (max_distance_to_leaf_by_term.term_id=association.term_id)
  INNER JOIN term ON (association.term_id=term.id)
  INNER JOIN gene_product_subset ON (gene_product.id=gene_product_subset.gene_product_id)
  INNER JOIN term AS subset ON (subset.id=gene_product_subset.subset_id)
 WHERE
  term.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY
  subset.acc;

-- @@ avg_max_distance_to_leaf_term_by_db_and_annotsubset
-- average maximum-distance-to-leaf per annotation, partitioned by annotation source (eg FlyBase, UniProt, ...)
-- excludes annotations to root nodes (aka "unknowns")
DROP TABLE IF EXISTS avg_max_distance_to_leaf_term_by_db_and_annotsubset;
CREATE OR REPLACE VIEW avg_max_distance_to_leaf_term_by_db_and_annotsubset AS
 SELECT
  subset.acc AS annotsubset,
  xref_dbname,
  avg(max_distance) AS avg_max_distance
 FROM
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN max_distance_to_leaf_by_term ON (max_distance_to_leaf_by_term.term_id=association.term_id)
  INNER JOIN term ON (association.term_id=term.id)
  INNER JOIN gene_product_subset ON (gene_product.id=gene_product_subset.gene_product_id)
  INNER JOIN term AS subset ON (subset.id=gene_product_subset.subset_id)
 WHERE
  term.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY
  subset.acc,
  xref_dbname;

-- ** for: obd **

-- @@ avg_annotation_entropy_by_annot_subset_and_source
-- Average entropy of annotated terms, broken down by annotation source (FlyBase, UniProt, ..)
DROP TABLE IF EXISTS avg_annotation_entropy_by_annot_subset_and_source;
CREATE OR REPLACE VIEW avg_annotation_entropy_by_annotation_subset_and_source AS
 SELECT 
  subset.acc AS annotsubset,
  xref_dbname AS annotation_source,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN gene_product AS gp ON (a.gene_product_id=gp.id)
  INNER JOIN dbxref AS x ON (gp.dbxref_id=x.id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN gene_product_subset ON (gp.id=gene_product_subset.gene_product_id)
  INNER JOIN term AS subset ON (subset.id=gene_product_subset.subset_id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY 
  subset.acc,  
  xref_dbname;

-- ** for: annot-reports **

CREATE OR REPLACE VIEW avg_total_pubs_per_gp_by_annotsubset_and_db AS
 SELECT 
  subset.acc AS annotsubset,
  xref_dbname,
  avg(total_pubs) AS avg_total_pubs
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_pubs_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN gene_product_subset ON (gene_product.id=gene_product_subset.gene_product_id)
  INNER JOIN term AS subset ON (subset.id=gene_product_subset.subset_id)
 GROUP BY 
  subset.acc,
  xref_dbname;

CREATE OR REPLACE VIEW avg_total_nonroot_pubs_per_gp_by_annotsubset_and_db AS
 SELECT 
  subset.acc AS annotsubset,
  xref_dbname,
  avg(total_pubs) AS avg_total_pubs
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_pubs_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN gene_product_subset ON (gene_product.id=gene_product_subset.gene_product_id)
  INNER JOIN term AS subset ON (subset.id=gene_product_subset.subset_id)
 GROUP BY 
  subset.acc,
  xref_dbname;

CREATE OR REPLACE VIEW avg_total_terms_per_gp_by_annotsubset_and_db AS
 SELECT 
  subset.acc AS annotsubset,
  xref_dbname,
  avg(total_terms) AS avg_total_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN gene_product_subset ON (gene_product.id=gene_product_subset.gene_product_id)
  INNER JOIN term AS subset ON (subset.id=gene_product_subset.subset_id)
 GROUP BY 
  subset.acc,
  xref_dbname;

CREATE OR REPLACE VIEW avg_total_nonroot_terms_per_gp_by_annotsubset_and_db AS
 SELECT 
  subset.acc AS annotsubset,
  xref_dbname,
  avg(total_terms) AS avg_total_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN gene_product_subset ON (gene_product.id=gene_product_subset.gene_product_id)
  INNER JOIN term AS subset ON (subset.id=gene_product_subset.subset_id)
 GROUP BY 
  subset.acc,
  xref_dbname;

CREATE OR REPLACE VIEW avg_total_transitive_terms_per_gp_by_annotsubset_and_db AS
 SELECT 
  subset.acc AS annotsubset,
  xref_dbname,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN gene_product_subset ON (gene_product.id=gene_product_subset.gene_product_id)
  INNER JOIN term AS subset ON (subset.id=gene_product_subset.subset_id)
 GROUP BY 
  subset.acc,
  xref_dbname;

CREATE OR REPLACE VIEW avg_total_nonroot_transitive_terms_per_gp_by_annotsubset_and_db AS
 SELECT 
  subset.acc AS annotsubset,
  xref_dbname,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN total_nonroot_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN gene_product_subset ON (gene_product.id=gene_product_subset.gene_product_id)
  INNER JOIN term AS subset ON (subset.id=gene_product_subset.subset_id)
 GROUP BY 
  subset.acc,
  xref_dbname;
