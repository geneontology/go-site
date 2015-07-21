-- @@ total_seqs_per_gp
-- distinct entries in the seq table per gene_product row.
-- where gene_product rows correspond to genes, multiple protein seqs
-- may indicate alternate splicing
CREATE OR REPLACE VIEW total_seqs_per_gp AS
 SELECT 
  gene_product_id,
  count(DISTINCT seq_id) AS total_seqs
 FROM
  gene_product_seq
 GROUP BY
  gene_product_id;

CREATE OR REPLACE VIEW total_seqs_per_db AS
 SELECT 
  xref_dbname,
  count(DISTINCT seq_id) AS total_seqs
 FROM
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN gene_product_seq ON (gene_product.id=gene_product_seq.gene_product_id)
 GROUP BY
  xref_dbname;

CREATE OR REPLACE VIEW total_gps_with_seq_per_db AS
 SELECT 
  xref_dbname,
  count(DISTINCT gene_product.id) AS total_gps
 FROM
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN gene_product_seq ON (gene_product.id=gene_product_seq.gene_product_id)
 GROUP BY
  xref_dbname;

CREATE OR REPLACE VIEW proportion_gps_with_seq_per_db AS
 SELECT
  xref_dbname,
  n.total_gps AS total_gps_with,
  m.total_gps AS total_gps,
  n.total_gps/m.total_gps AS proportion_gps
 FROM
  total_gps_with_seq_per_db AS n
  INNER JOIN total_gps_by_dbname AS m USING (xref_dbname);

