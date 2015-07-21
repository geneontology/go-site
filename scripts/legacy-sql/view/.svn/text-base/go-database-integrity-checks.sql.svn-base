-- good old MySQL, when will we have integrity checks..

CREATE OR REPLACE VIEW gene_product_dbxref_fk_violation AS
 SELECT * FROM gene_product WHERE dbxref_id NOT IN (SELECT id FROM dbxref);
