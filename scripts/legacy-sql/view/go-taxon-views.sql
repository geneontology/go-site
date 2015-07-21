CREATE OR REPLACE VIEW annotated_species_id AS
 SELECT DISTINCT
  species_id
 FROM gene_product;

CREATE OR REPLACE VIEW annotated_species AS
 SELECT 
  species.*
 FROM species
 WHERE
  EXISTS (SELECT * FROM annotated_species_id AS asi WHERE asi.species_id=species.id);

-- @@ species_has_term
-- species_has_term if and only if there exists a gene_product for that species annotated_to* that term,
-- (where annotated_to* indicates inclusion of transitive annotations, based on graph_path)
CREATE OR REPLACE VIEW species_has_term AS
SELECT DISTINCT
 species.genus,
 species.species,
 species.common_name,
 species.ncbi_taxa_id,
 species.id AS species_id,
 term.* 
FROM
 term
 INNER JOIN gene_product_count ON (term.id=gene_product_count.term_id)
 INNER JOIN species ON (gene_product_count.species_id=species.id);

-- @@ species_has_term_d
-- as species_has_term, but does not use pre-computed table (thus slower) 
CREATE OR REPLACE VIEW species_has_term_d AS
SELECT DISTINCT
 species.genus,
 species.species,
 species.common_name,
 species.ncbi_taxa_id,
 species.id AS species_id,
 term.* 
FROM
 term
 INNER JOIN graph_path ON (term.id=graph_path.term1_id)
 INNER JOIN association ON (graph_path.term2_id=association.term_id)
 INNER JOIN gene_product ON (association.gene_product_id=gene_product.id)
 INNER JOIN species ON (gene_product.species_id=species.id);

-- @@ species_lacks_term
-- species_lacks_term if and only if there does not exist a gene_product for that species annotated_to* that term,
-- (where annotated_to* indicates inclusion of transitive annotations, based on graph_path)
CREATE OR REPLACE VIEW species_lacks_term AS
SELECT DISTINCT
 species.genus,
 species.species,
 species.common_name,
 species.ncbi_taxa_id,
 species.id AS species_id,
 term.* 
FROM
 term,
 species
WHERE 
 NOT EXISTS 
  (SELECT * 
   FROM gene_product_count
   WHERE gene_product_count.species_id=species.id
     AND term.id=gene_product_count.term_id);

-- @@ species_lacks_term_d
-- same as species_lacks_term, bypasses pre-computed results
CREATE OR REPLACE VIEW species_lacks_term_d AS
SELECT DISTINCT
 species.genus,
 species.species,
 species.common_name,
 species.ncbi_taxa_id,
 species.id AS species_id,
 term.* 
FROM
 term,
 species
WHERE 
 NOT EXISTS 
  (SELECT * 
   FROM graph_path 
     INNER JOIN association ON (graph_path.term2_id=association.term_id)
     INNER JOIN gene_product ON (association.gene_product_id=gene_product.id)
   WHERE gene_product.species_id=species.id
     AND term.id=graph_path.term1_id);

-- @@ annotated_species_lacks_term
-- annotated_species_lacks_term is true if and only if species_lacks_term is true and
-- species is annotated to at least one term (via gene_product)
CREATE OR REPLACE VIEW annotated_species_lacks_term AS
 SELECT * 
 FROM species_lacks_term 
 WHERE EXISTS 
       (SELECT * 
        FROM gene_product 
        WHERE species_lacks_term.species_id = gene_product.species_id);

CREATE OR REPLACE VIEW gene_product_count_by_inner_taxon AS
 SELECT 
  it.id,
  it.genus,
  it.species,
  it.common_name,
  it.ncbi_taxa_id,
  gpc.term_id,
  sum(gpc.product_count) AS product_count
 FROM
  gene_product_count AS gpc
  INNER JOIN species AS tt ON (tt.id=gpc.species_id)
  INNER JOIN species AS it ON (tt.left_value BETWEEN it.left_value AND it.right_value)
 GROUP BY
  it.id,
  it.genus,
  it.species,
  it.common_name,
  it.ncbi_taxa_id,
  gpc.term_id;

  


