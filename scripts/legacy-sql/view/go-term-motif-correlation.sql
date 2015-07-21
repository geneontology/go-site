-- These views are useful for mining correlations between terms
-- and peptide motifs; peptide motifs are stored as seq_dbxrefs



CREATE OR REPLACE VIEW gene_product_dbxref AS
SELECT 
 gene_product.*,
 dbxref.xref_key,
 dbxref.xref_dbname,
 dbxref.xref_desc
FROM
 gene_product
 INNER JOIN dbxref ON (gene_product.dbxref_id=dbxref.id);

CREATE OR REPLACE VIEW gene_product_seq_dbxref AS
SELECT 
 gene_product.*,
 dbxref.xref_key,
 dbxref.xref_dbname,
 dbxref.xref_desc
FROM
 gene_product
 INNER JOIN gene_product_seq AS ps ON (gene_product.id=ps.gene_product_id)
 INNER JOIN seq_dbxref USING (seq_id)
 INNER JOIN dbxref ON (seq_dbxref.dbxref_id=dbxref.id);

CREATE OR REPLACE VIEW gpx_seq_x AS
SELECT
 psx.*,
 x.xref_key AS p_key,
 x.xref_key AS p_dbname
FROM gene_product_seq_dbxref AS psx
 INNER JOIN dbxref AS x ON (psx.dbxref_id=x.id);

CREATE OR REPLACE VIEW term_seq_dbxref AS
SELECT 
 t.*,
 a.id AS association_id,
 dbxref.xref_key,
 dbxref.xref_dbname
FROM
 term_descendent AS t
 INNER JOIN association AS a ON (t.descendent_id=a.term_id)
 INNER JOIN gene_product_seq USING (gene_product_id)
 INNER JOIN seq_dbxref USING (seq_id)
 INNER JOIN dbxref ON (seq_dbxref.dbxref_id=dbxref.id)
WHERE a.is_not=0;

CREATE OR REPLACE VIEW term_species_seq_dbxref AS
SELECT 
 t.*,
 a.id AS association_id,
 a.gene_product_id,
 sp.ncbi_taxa_id,
 sp.common_name,
 sp.lineage_string,
 sp.genus,
 sp.species,
 dbxref.xref_key,
 dbxref.xref_dbname,
 dbxref.xref_desc
FROM
 term_descendent AS t
 INNER JOIN association AS a ON (t.descendent_id=a.term_id)
 INNER JOIN gene_product AS p ON (a.gene_product_id=p.id)
 INNER JOIN species AS sp ON (p.species_id=sp.id)
 INNER JOIN gene_product_seq AS ps ON (p.id=ps.gene_product_id)
 INNER JOIN seq_dbxref USING (seq_id)
 INNER JOIN dbxref ON (seq_dbxref.dbxref_id=dbxref.id)
WHERE a.is_not=0;

CREATE OR REPLACE VIEW term_seq_interpro AS
SELECT * from term_seq_dbxref where xref_dbname='InterPro';




