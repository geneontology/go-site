CREATE OR REPLACE VIEW homolset_J_gene_product AS
 SELECT
  gp.*,
  gp.id AS gene_product_id,
  h.id AS homolset_id,
  h.symbol AS homolset_symbol,
  h.dbxref_id AS homolset_dbxref_id
 FROM
  gene_product AS gp
  INNER JOIN gene_product_homolset AS gph ON (gp.id=gph.gene_product_id)
  INNER JOIN homolset AS h ON (h.id=gph.homolset_id);

CREATE OR REPLACE VIEW total_homolsets AS
 SELECT
  count(distinct id)
 FROM
  homolset;

CREATE OR REPLACE VIEW total_homolsets_by_species AS
 SELECT
  species.id,
  ncbi_taxa_id,
  genus,
  species,
  common_name,
  count(distinct homolset_id)
 FROM
  gene_product
  INNER JOIN gene_product_homolset AS gph ON (gene_product.id=gph.gene_product_id)
  INNER JOIN species ON (gene_product.species_id=species.id)
 GROUP BY
  species.id,
  ncbi_taxa_id,
  genus,
  species,
  common_name;

-- @@ total_gps_by_homolset
-- number of distinct gene_products that belong to each homolset
CREATE OR REPLACE VIEW total_gps_by_homolset AS
 SELECT
  homolset_id,
  count(DISTINCT gene_product_id) AS total_gps
 FROM gene_product_homolset
 GROUP BY homolset_id;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_gps_by_homolset');
-- CREATE UNIQUE INDEX total_gps_by_homolset_idx1 ON total_gps_by_homolset(homolset_id);
-- CREATE UNIQUE INDEX total_gps_by_homolset_idx2 ON total_gps_by_homolset(homolset_id,total_gps);
-- END MATERIALIZE


-- @@ total_species_by_homolset
-- number of distinct species that have a gene_product belonging to each homolset
CREATE OR REPLACE VIEW total_species_by_homolset AS
 SELECT
  homolset_id,
  count(DISTINCT species_id) AS total_species
 FROM gene_product_homolset
  INNER JOIN gene_product ON (gene_product.id=gene_product_id)
 GROUP BY homolset_id;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_species_by_homolset');
-- CREATE UNIQUE INDEX total_species_by_homolset_idx1 ON total_species_by_homolset(homolset_id);
-- CREATE UNIQUE INDEX total_species_by_homolset_idx2 ON total_species_by_homolset(homolset_id,total_species);
-- END MATERIALIZE


CREATE OR REPLACE VIEW total_gps_by_homolset_with_details AS
 SELECT
  dbxref.xref_dbname,
  dbxref.xref_key,
  homolset.id AS homolset_id,
  homolset.symbol,
  count(DISTINCT gene_product_id) AS total_gps
 FROM homolset 
  INNER JOIN gene_product_homolset ON (homolset.id=homolset_id)
  INNER JOIN dbxref ON (homolset.dbxref_id=dbxref.id)
 GROUP BY homolset.symbol;

CREATE OR REPLACE VIEW homolsets_with_most_gps AS
 SELECT
  symbol,
  total_gps
 FROM 
  total_gps_by_homolset_with_details
 GROUP BY
  symbol
 HAVING
  total_gps=max(total_gps);

CREATE OR REPLACE VIEW avg_avg_gene_product_annotation_entropy_by_homolset AS
 SELECT
  dbxref.xref_dbname,
  dbxref.xref_key,
  homolset.id AS homolset_id,
  homolset.symbol,
  avg(DISTINCT avg_entropy) AS avg_avg_entropy
 FROM homolset 
  INNER JOIN gene_product_homolset AS gphs ON (homolset.id=gphs.homolset_id)
  INNER JOIN avg_annotation_entropy_by_annotated_entity ON (gphs.gene_product_id=annotated_entity_id)
  INNER JOIN dbxref ON (homolset.dbxref_id=dbxref.id)
 GROUP BY homolset.symbol;

CREATE OR REPLACE VIEW homolset_summary AS
 SELECT
  *
 FROM
  total_gps_by_homolset
  INNER JOIN avg_avg_gene_product_annotation_entropy_by_homolset USING (homolset_id);

CREATE VIEW species_with_homolset AS
 SELECT
  DISTINCT species_id
 FROM gene_product INNER JOIN gene_product_homolset ON (gene_product.id=gene_product_id);

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('species_with_homolset');
-- CREATE UNIQUE INDEX species_with_homolset_idx1 ON species_with_homolset(species_id);
-- END MATERIALIZE

CREATE OR REPLACE VIEW homologous_to AS
 SELECT
  gh1.gene_product_id AS gene_product1_id,
  gh2.gene_product_id AS gene_product2_id
 FROM
  gene_product_homolset AS gh1
  INNER JOIN gene_product_homolset AS gh2 USING (homolset_id);


CREATE OR REPLACE VIEW orthologous_to AS
 SELECT
  gh1.gene_product_id AS gene_product1_id,
  g1.symbol AS symbol1,
  g1.species_id AS species1_id,
  g1.dbxref_id AS dbxref1_id,
  gh2.gene_product_id AS gene_product2_id,
  g2.symbol AS symbol2,
  g2.species_id AS species2_id,
  g2.dbxref_id AS dbxref2_id
 FROM
  gene_product_homolset AS gh1
  INNER JOIN gene_product_homolset AS gh2 USING (homolset_id)
  INNER JOIN gene_product AS g1 ON (gh1.gene_product_id=g1.id)
  INNER JOIN gene_product AS g2 ON (gh2.gene_product_id=g2.id)
 WHERE
  g1.species_id != g2.species_id;


CREATE OR REPLACE VIEW orthologous_to_J_xref AS
 SELECT
  gh1.gene_product_id AS gene_product1_id,
  g1.symbol AS symbol1,
  g1.species_id AS species1_id,
  g1.dbxref_id AS dbxref1_id,
  x1.xref_dbname AS xref_dbname1,
  x1.xref_key AS xref_key1,
  gh2.gene_product_id AS gene_product2_id,
  g2.symbol AS symbol2,
  g2.species_id AS species2_id,
  g2.dbxref_id AS dbxref2_id,
  x2.xref_dbname AS xref_dbname2,
  x2.xref_key AS xref_key2
 FROM
  gene_product_homolset AS gh1
  INNER JOIN gene_product_homolset AS gh2 USING (homolset_id)
  INNER JOIN gene_product AS g1 ON (gh1.gene_product_id=g1.id)
  INNER JOIN gene_product AS g2 ON (gh2.gene_product_id=g2.id)
  INNER JOIN dbxref AS x1 ON (g1.dbxref_id=x1.id)
  INNER JOIN dbxref AS x2 ON (g2.dbxref_id=x2.id)
 WHERE
  g1.species_id != g2.species_id;


  

