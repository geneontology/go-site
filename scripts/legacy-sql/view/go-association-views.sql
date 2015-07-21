CREATE OR REPLACE VIEW nr_association AS
 SELECT
  a.*
 FROM
  association AS a
 WHERE NOT EXISTS (SELECT 
                   FROM association AS b INNER JOIN graph_path AS tc ON (b.term_id=tc.term2_id)
                   WHERE a.gene_product_id = b.gene_product_id AND a.term_id=tc.term1_id AND b.is_not=1)
  AND a.is_not=0;


  