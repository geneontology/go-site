CREATE OR REPLACE VIEW count_of_annotated_entity AS
 SELECT 
  count(DISTINCT gene_product_id) AS total
 FROM
  association;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('count_of_annotated_entity');
-- END MATERIALIZE

CREATE OR REPLACE VIEW number_of_genes_annotated_to AS
 SELECT 
  term1_id AS term_id,
  count(DISTINCT a.gene_product_id)     AS num_genes
 FROM
  association AS a
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term2_id)
 GROUP BY
   term1_id;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('number_of_genes_annotated_to');
-- CREATE UNIQUE INDEX number_of_genes_annotated_to_ix1 ON number_of_genes_annotated_to(term_id);
-- CREATE UNIQUE INDEX number_of_genes_annotated_to_ix2 ON number_of_genes_annotated_to(term_id,num_genes);
-- END MATERIALIZE


CREATE OR REPLACE VIEW count_of_annotated_entity_by_species AS
 SELECT 
  species_id,
  count(id) AS total
 FROM
  gene_product
 GROUP BY
  species_id;

CREATE OR REPLACE VIEW count_of_annotated_entity_by_class_node_and_evidence AS
 SELECT 
  term_id       AS node_id,
  code          AS evidence,
  sum(product_count)     AS total
 FROM
  gene_product_count 
 WHERE
  speciesdbname IS NOT NULL
 GROUP BY node_id, evidence;

CREATE OR REPLACE VIEW count_of_annotated_entity_by_class_node_and_species AS
 SELECT 
  term_id       AS node_id,
  code          AS evidence,
  species_id,
  sum(product_count)     AS total
 FROM
  gene_product_count
 WHERE
  species_id IS NOT NULL
 GROUP BY 
  node_id, 
  evidence,
  species_id;

                
-- I(Cn) = -log2 p(Cn)
CREATE OR REPLACE VIEW class_node_entropy_by_evidence AS
 SELECT 
  node_id,
  evidence,
  - log(tbc.total / t.total) / log(2) AS entropy
 FROM
  count_of_annotated_entity_by_class_node_and_evidence  AS tbc,
  count_of_annotated_entity                             AS t
 GROUP BY node_id, evidence;

CREATE OR REPLACE VIEW common_species AS
 SELECT
  DISTINCT species_id
 FROM gene_product_count
 WHERE species_id IS NOT NULL
 AND product_count > 200;
 
CREATE OR REPLACE VIEW class_node_entropy_by_species AS
 SELECT 
  node_id,
  tbc.species_id,
  - log(tbc.total / t.total) / log(2) AS entropy
 FROM
  count_of_annotated_entity_by_class_node_and_species  AS tbc
  INNER JOIN count_of_annotated_entity_by_species      AS t ON (tbc.species_id=t.species_id)
  INNER JOIN common_species ON (tbc.species_id=common_species.species_id)
 WHERE
  evidence = '!IEA'
 GROUP BY 
  node_id, 
  evidence,
  tbc.species_id;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('class_node_entropy_by_species');
-- CREATE INDEX class_node_entropy_by_species_idx_node_id ON class_node_entropy_by_species(node_id);
-- CREATE INDEX class_node_entropy_by_species_idx_entropy_by_species ON class_node_entropy_by_species(entropy);
-- CREATE INDEX class_node_entropy_by_species_idx_species ON class_node_entropy_by_species(species_id);
-- CREATE INDEX class_node_entropy_by_species_idx_ns ON class_node_entropy_by_species(node_id,species_id);
-- CREATE INDEX class_node_entropy_by_species_idx_nse ON class_node_entropy_by_species(node_id,species_id,entropy);
-- END MATERIALIZE


CREATE OR REPLACE VIEW class_node_entropy_by_evidence_J_node_with_max_depth AS
 SELECT * FROM class_node_entropy_by_evidence INNER JOIN node USING (node_id) INNER JOIN node_max_depth USING (node_id);

-- @@ class_node_entropy
-- Information content (Shannon entropy) for a class, based on annotation count
-- transitivity is taken into account
-- I(Cn) = -log2 p(Cn)
DROP TABLE IF EXISTS class_node_entropy;
CREATE OR REPLACE VIEW class_node_entropy AS
 SELECT 
  node_id,
  - log(tbc.total / t.total) / log(2) AS entropy
 FROM
  count_of_annotated_entity_by_class_node_and_evidence  AS tbc,
  count_of_annotated_entity                             AS t;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('class_node_entropy');
-- CREATE UNIQUE INDEX class_node_entropy_idx_node_id ON class_node_entropy(node_id);
-- CREATE INDEX class_node_entropy_idx_entropy ON class_node_entropy(entropy);
-- CREATE UNIQUE INDEX class_node_entropy_idx_node ON class_node_entropy(node_id);
-- CREATE UNIQUE INDEX class_node_entropy_idx_node_entropy ON class_node_entropy(node_id,entropy);
-- END MATERIALIZE


CREATE OR REPLACE VIEW resnick_similarity AS
 SELECT
  tc1.term2_id AS node1_id,
  tc2.term2_id AS node2_id,
  max(entropy)
 FROM
  class_node_entropy,
  graph_path AS tc1,
  graph_path AS tc2
 WHERE
  tc1.term1_id = tc2.term1_id
  AND
  class_node_entropy.node_id = tc1.term1_id
 GROUP BY
  tc1.term2_id,
  tc2.term2_id;
 
CREATE OR REPLACE VIEW avg_annotation_entropy AS
 SELECT 
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown');

-- @@ max_entropy_per_gp
-- maximimum information content per gene product, broken down by ontology
CREATE OR REPLACE VIEW max_entropy_per_gp AS
 SELECT DISTINCT
  a.gene_product_id,
  MAX(entropy) AS max_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
 GROUP BY
  a.gene_product_id;

-- @@ max_entropy_per_gp_by_ont
-- maximimum information content per gene product, broken down by ontology
CREATE OR REPLACE VIEW max_entropy_per_gp_by_ont AS
 SELECT DISTINCT
  a.gene_product_id,
  term_type,
  MAX(entropy) AS max_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
 GROUP BY
  a.gene_product_id,
  term_type;

-- @@ avg_max_entropy_per_gp_by_ont
-- this gives a measure of how specific annotations are in the database as a whole.
CREATE OR REPLACE VIEW avg_max_entropy_per_gp_by_ont AS
 SELECT
  AVG(max_entropy) AS avg_max_entropy,
  term_type
 FROM
  max_entropy_per_gp_by_ont
 GROUP BY
  term_type;

-- @@ avg_annotation_entropy_by_annotated_entity
DROP TABLE IF EXISTS avg_annotation_entropy_by_annotated_entity;
CREATE OR REPLACE VIEW avg_annotation_entropy_by_annotated_entity AS
 SELECT 
  gene_product_id AS annotated_entity_id,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY gene_product_id;

-- @@ avg_annotation_entropy_by_annotation_source
-- Average entropy of annotated terms, broken down by annotation source (FlyBase, UniProt, ..)
DROP TABLE IF EXISTS avg_annotation_entropy_by_annotation_source;
CREATE OR REPLACE VIEW avg_annotation_entropy_by_annotation_source AS
 SELECT 
  xref_dbname AS annotation_source,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN gene_product AS gp ON (a.gene_product_id=gp.id)
  INNER JOIN dbxref AS x ON (gp.dbxref_id=x.id)
  INNER JOIN term AS t ON (a.term_id=t.id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY xref_dbname;

-- @@ avg_annotation_entropy_by_annotation_source_and_class_source
-- Average entropy of annotated terms, broken down by annotation source (FlyBase, UniProt, ..) and ontology (MF, BP, CC)
DROP TABLE IF EXISTS avg_annotation_entropy_by_annotation_source_and_class_source;
CREATE OR REPLACE VIEW avg_annotation_entropy_by_annotation_source_and_class_source AS
 SELECT 
  xref_dbname AS annotation_source,
  t.term_type AS class_source,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN gene_product AS gp ON (a.gene_product_id=gp.id)
  INNER JOIN dbxref AS x ON (gp.dbxref_id=x.id)
  INNER JOIN term AS t ON (a.term_id=t.id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')

 GROUP BY xref_dbname, t.term_type;

-- @@ avg_annotation_entropy_by_annotation_source_and_class_source
-- Average entropy of annotated terms, broken down by annotation source (FlyBase, UniProt, ..) and organism (fly, human, ...)
DROP TABLE IF EXISTS avg_annotation_entropy_by_annotation_source_and_organism;
CREATE OR REPLACE VIEW avg_annotation_entropy_by_annotation_source_and_organism AS
 SELECT 
  xref_dbname AS annotation_source,
  s.common_name AS organism_type_name,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN gene_product AS gp ON (a.gene_product_id=gp.id)
  INNER JOIN dbxref AS x ON (gp.dbxref_id=x.id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN species AS s ON (gp.species_id=s.id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')

 GROUP BY 
  xref_dbname,
  s.common_name; 

-- @@ avg_annotation_entropy_uniprot filtered
-- Average entropy of annotated terms, broken down by annotation source (FlyBase, UniProt, ..) and organism (fly, human, ...)
-- Any UniProt non-human annotations are filtered out. This is to give a convenience view summarising human+MODs
CREATE OR REPLACE VIEW avg_annotation_entropy_uniprot_filtered AS
 SELECT * FROM avg_annotation_entropy_by_annotation_source_and_organism
 WHERE (annotation_source != 'UniProt' && annotation_source != 'PDB')
   OR organism_type_name = 'human';


-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('avg_annotation_entropy_by_annotation_source');
-- CREATE UNIQUE INDEX avg_annotation_entropy_by_annotation_source_idx1 ON avg_annotation_entropy_by_annotation_source(annotation_source);
-- CREATE INDEX avg_annotation_entropy_by_annotation_source_idx2 ON avg_annotation_entropy_by_annotation_source(avg_entropy);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('avg_annotation_entropy_by_annotation_source_and_organism');
-- CREATE UNIQUE INDEX avg_annotation_entropy_by_annotation_source_and_organism_idx1 ON avg_annotation_entropy_by_annotation_source_and_organism(annotation_source,organism_type_name);
-- CREATE INDEX avg_annotation_entropy_by_annotation_source_and_organism_idx2 ON avg_annotation_entropy_by_annotation_source_and_organism(avg_entropy);
-- END MATERIALIZE

