CREATE OR REPLACE VIEW term_gp_total_by_code AS
  SELECT 
        path.term1_id                      AS term_id,
        count(DISTINCT ae.gene_product_id) AS total
  FROM 
   association_evidence  AS ae
   INNER JOIN graph_path AS path        ON (path.term2_id=ae.term_id)
  GROUP BY code;

CREATE OR REPLACE VIEW annotated_gp_total_by_code AS
  SELECT code, count(DISTINCT gene_product_id) AS total
  FROM 
   association_evidence
  GROUP BY code;

CREATE OR REPLACE VIEW gene_product_count2 AS
 SELECT 
  term_id,
  code,
  sum(product_count)     AS total
 FROM
  gene_product_count 
 GROUP BY term_id, code;

CREATE OR REPLACE VIEW implied_annotation AS
 SELECT DISTINCT
  p.term1_id    AS term_id,
  a.id,  
  a.gene_product_id
 FROM
  graph_path    AS p
  INNER JOIN association AS a ON (p.term2_id=a.term_id)
 WHERE
  is_not=0;

CREATE OR REPLACE VIEW implied_negative_annotation AS
 SELECT DISTINCT
  p.term1_id    AS term_id,
  a.id,
  a.gene_product_id
 FROM
  graph_path    AS p
  INNER JOIN association AS a ON (p.term2_id=a.term_id)
 WHERE
  is_not=1;

CREATE OR REPLACE VIEW term_correlation_via_transitive_annotation AS
 SELECT
  a1.gene_product_id,
  a1.id AS association1_id,
  a2.id AS association2_id,
  a1.term_id AS term1_id,
  a2.term_id AS term2_id
 FROM
  implied_annotation AS a1
  INNER JOIN implied_annotation AS a2 USING (gene_product_id);

CREATE OR REPLACE VIEW term_correlation_summary AS
 SELECT
  count(DISTINCT a1.gene_product_id),
  a1.term_id AS term1_id,
  a2.term_id AS term2_id
 FROM
  implied_annotation AS a1
  INNER JOIN implied_annotation AS a2 USING (gene_product_id)
 GROUP BY
  term1_id,
  term2_id;

