
-- @@refg_species
-- hardcoded set of 12 reference genomes selected for annotation and analysis
CREATE OR REPLACE VIEW refg_species AS
 SELECT *
 FROM species
 WHERE ncbi_taxa_id IN (
4896, #Schizosaccharomyces pombe
7955, #Danio rerio
6239, #Caenorhabditis elegans
9606, #Homo sapiens
7227, #Drosophila melanogaster
44689, #Dictyostelium discoideum
4932, #Saccharomyces cerevisiae
10090, #Mus musculus
10116, #Rattus norvegicus
3702, #Arabidopsis thaliana
9031, #Gallus gallus
562 #Escherichia coli
);

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('refg_species');
-- CREATE UNIQUE INDEX refg_species1 ON refg_species(id);
-- CREATE UNIQUE INDEX refg_species2 ON refg_species(ncbi_taxa_id);
-- END MATERIALIZE

-- @@trusted_evidence
-- TODO: use evidence code ontology (ECO)
DROP TABLE IF EXISTS trusted_evidence;
CREATE OR REPLACE VIEW trusted_evidence AS
 SELECT * FROM evidence WHERE code NOT IN ('IEA', 'IGC', 'NAS', 'ND', 'NR', 'RCA', 'TAS');

-- @@ gene_product_with_subset
-- convenience view: gene_product * subset
CREATE OR REPLACE VIEW gene_product_with_subset AS
 SELECT 
  gp.*,
  s.acc AS subset_acc,
  s.name AS subset_name
 FROM
  gene_product AS gp
  INNER JOIN gene_product_subset AS gp2s ON (gp.id=gp2s.gene_product_id)
  INNER JOIN term AS s ON (gp2s.subset_id=s.id);

-- @@ avg_total_pubs_per_gp_by_refg_species
-- avg(pub/gene) in refspecies
CREATE OR REPLACE VIEW avg_total_pubs_per_gp_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(total_pubs) AS avg_total_pubs
 FROM 
  gene_product
  INNER JOIN total_pubs_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;

-- avg(pub/refgene) in refspecies
CREATE OR REPLACE VIEW avg_total_refg_pubs_per_gp_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(total_pubs) AS avg_total_pubs
 FROM 
  gene_product
  INNER JOIN total_pubs_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=gene_product.id)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;

CREATE OR REPLACE VIEW total_transitive_terms_per_gp_ont_for_refspecies AS
 SELECT 
  term_type,
  gene_product_id,
  count(DISTINCT graph_path.term1_id) AS total_transitive_terms
 FROM 
  association
  INNER JOIN graph_path ON (graph_path.term2_id=association.term_id)
  INNER JOIN term ON (term.id=graph_path.term1_id)
  INNER JOIN gene_product ON (association.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 GROUP BY 
  term_type,
  gene_product_id;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_transitive_terms_per_gp_ont_for_refspecies');
-- CREATE INDEX total_transitive_terms_per_gp_ont_for_refspecies_idx1 ON total_transitive_terms_per_gp_ont_for_refspecies(gene_product_id);
-- CREATE INDEX total_transitive_terms_per_gp_ont_for_refspecies_idx2 ON total_transitive_terms_per_gp_ont_for_refspecies(gene_product_id,total_transitive_terms);
-- CREATE UNIQUE INDEX total_transitive_terms_per_gp_ont_for_refspecies_idx3 ON total_transitive_terms_per_gp_ont_for_refspecies(gene_product_id,term_type);
-- CREATE UNIQUE INDEX total_transitive_terms_per_gp_ont_for_refspecies_idx4 ON total_transitive_terms_per_gp_ont_for_refspecies(gene_product_id,term_type,total_transitive_terms);
-- END MATERIALIZE

CREATE OR REPLACE VIEW avg_total_transitive_terms_per_gp_ont_for_refspecies AS
 SELECT 
  term_type,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  total_transitive_terms_per_gp_ont_for_refspecies
 GROUP BY
  term_type
 ORDER BY
  term_type;

CREATE OR REPLACE VIEW total_transitive_terms_per_refg_gp_ont_for_refspecies AS
 SELECT 
  term_type,
  gph.gene_product_id,
  count(DISTINCT graph_path.term1_id) AS total_transitive_terms
 FROM 
  association
  INNER JOIN graph_path ON (graph_path.term2_id=association.term_id)
  INNER JOIN term ON (term.id=graph_path.term1_id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=association.gene_product_id)
 GROUP BY 
  term_type,
  gene_product_id;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('total_transitive_terms_per_refg_gp_ont_for_refspecies');
-- CREATE INDEX total_transitive_terms_per_refg_gp_ont_for_refspecies_idx1 ON total_transitive_terms_per_refg_gp_ont_for_refspecies(gene_product_id);
-- CREATE INDEX total_transitive_terms_per_refg_gp_ont_for_refspecies_idx2 ON total_transitive_terms_per_refg_gp_ont_for_refspecies(gene_product_id,total_transitive_terms);
-- CREATE UNIQUE INDEX total_transitive_terms_per_refg_gp_ont_for_refspecies_idx3 ON total_transitive_terms_per_refg_gp_ont_for_refspecies(gene_product_id,term_type);
-- CREATE UNIQUE INDEX total_transitive_terms_per_refg_gp_ont_for_refspecies_idx4 ON total_transitive_terms_per_refg_gp_ont_for_refspecies(gene_product_id,term_type,total_transitive_terms);
-- END MATERIALIZE

CREATE OR REPLACE VIEW avg_total_transitive_terms_per_refg_gp_ont_for_refspecies AS
 SELECT 
  term_type,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  total_transitive_terms_per_refg_gp_ont_for_refspecies
 GROUP BY
  term_type
 ORDER BY
  term_type;


CREATE OR REPLACE VIEW avg_total_transitive_terms_per_gp_for_refspecies AS
 SELECT 
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  gene_product
  INNER JOIN total_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id);

CREATE OR REPLACE VIEW avg_total_transitive_terms_per_refg_gp_for_refspecies AS
 SELECT 
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
   total_transitive_terms_per_gp AS aa
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=aa.gene_product_id);


-- avg(annot*/gene) in refspecies
CREATE OR REPLACE VIEW avg_total_transitive_terms_per_gp_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  gene_product
  INNER JOIN total_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;

-- avg(annotNRT*/gene) in refspecies
CREATE OR REPLACE VIEW avg_total_nonroot_transitive_terms_per_gp_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  gene_product
  INNER JOIN total_nonroot_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;

-- avg(annot*/refgene) in refspecies
CREATE OR REPLACE VIEW avg_total_transitive_terms_per_refg_gp_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  gene_product
  INNER JOIN total_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=gene_product.id)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;

-- avg(annotNRT*/refgene) in refspecies
CREATE OR REPLACE VIEW avg_total_nonroot_transitive_terms_per_refg_gp_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(total_transitive_terms) AS avg_total_transitive_terms
 FROM 
  gene_product
  INNER JOIN total_nonroot_transitive_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=gene_product.id)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;

-- avg(annotNRT/refgene) in refspecies
CREATE OR REPLACE VIEW avg_total_nonroot_terms_per_refg_gp_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(total_terms) AS avg_total_terms
 FROM 
  gene_product
  INNER JOIN total_nonroot_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=gene_product.id)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;

-- avg(annotNRT/gene) in refspecies
CREATE OR REPLACE VIEW avg_total_nonroot_terms_per_gp_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(total_terms) AS avg_total_terms
 FROM 
  gene_product
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
  INNER JOIN total_nonroot_terms_per_gp AS aa ON (aa.gene_product_id=gene_product.id)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;

CREATE OR REPLACE VIEW avg_max_distance_to_leaf_term_within_refg_species AS
          SELECT
            t.term_type,
            e.code,
            avg(max_distance) AS avg_annot_dist_to_leaf
          FROM 
          association AS a 
          INNER JOIN evidence AS e ON (e.association_id=a.id)
          INNER JOIN non_root_term AS t ON (t.id=a.term_id)
          INNER JOIN max_distance_to_leaf_by_term AS ld ON
            (ld.term_id=t.id)
          INNER JOIN gene_product AS g ON (g.id=a.gene_product_id)
          INNER JOIN refg_species AS sp ON (sp.id=g.species_id)
          GROUP BY
            e.code,
            t.term_type
          ORDER BY term_type,e.code;

CREATE OR REPLACE VIEW avg_max_distance_to_leaf_term_per_refg_within_refg_species AS
          SELECT
            t.term_type,
            e.code,
            avg(max_distance) AS avg_annot_dist_to_leaf
          FROM 
          association AS a 
          INNER JOIN evidence AS e ON (e.association_id=a.id)
          INNER JOIN non_root_term AS t ON (t.id=a.term_id)
          INNER JOIN max_distance_to_leaf_by_term AS ld ON
            (ld.term_id=t.id)
          INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=a.gene_product_id)
          GROUP BY
            e.code,
            t.term_type
          ORDER BY term_type,e.code;



CREATE OR REPLACE VIEW avg_max_distance_to_leaf_term_by_refg_species AS
 SELECT
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(max_distance) AS avg_max_distance
 FROM
  gene_product
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN max_distance_to_leaf_by_term ON (max_distance_to_leaf_by_term.term_id=association.term_id)
 WHERE
  association.term_id NOT IN (SELECT id FROM root_term)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;

CREATE OR REPLACE VIEW avg_max_distance_to_leaf_for_refg_annot_by_refg_species AS
 SELECT
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  avg(max_distance) AS avg_max_distance
 FROM
  gene_product
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN max_distance_to_leaf_by_term ON (max_distance_to_leaf_by_term.term_id=association.term_id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=gene_product.id)
 WHERE
  association.term_id NOT IN (SELECT id FROM root_term)
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species;


CREATE OR REPLACE VIEW avg_entropy_per_annot_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN gene_product ON (a.gene_product_id=gene_product.id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species
 ORDER BY
  avg_entropy;

CREATE OR REPLACE VIEW avg_spentropy_per_annot_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy_by_species AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN gene_product ON (a.gene_product_id=gene_product.id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 WHERE 
  cne.species_id=sp.id AND
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species
 ORDER BY
  avg_entropy;

CREATE OR REPLACE VIEW avg_entropy_per_refg_annot_by_refg_species AS
 SELECT 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN gene_product ON (a.gene_product_id=gene_product.id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=gene_product.id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY 
  sp.ncbi_taxa_id,
  sp.genus,
  sp.species
 ORDER BY
  avg_entropy;

CREATE OR REPLACE VIEW avg_entropy_per_annot_by_ont_within_refg_species AS
 SELECT 
  term_type,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN gene_product ON (a.gene_product_id=gene_product.id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY
  term_type
 ORDER BY
  term_type;

CREATE OR REPLACE VIEW avg_spentropy_per_annot_by_ont_within_refg_species AS
 SELECT 
  term_type,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy_by_species AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN gene_product ON (a.gene_product_id=gene_product.id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 WHERE 
  cne.species_id=sp.id AND
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY
  term_type
 ORDER BY
  term_type;

CREATE OR REPLACE VIEW avg_entropy_per_refg_annot_by_ont_within_refg_species AS
 SELECT 
  term_type,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=a.gene_product_id)
 WHERE 
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY
  term_type
 ORDER BY
  term_type;

CREATE OR REPLACE VIEW avg_spentropy_per_refg_annot_by_ont_within_refg_species AS
 SELECT 
  term_type,
  AVG(entropy) AS avg_entropy
 FROM
  class_node_entropy_by_species AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN gene_product ON (a.gene_product_id=gene_product.id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=a.gene_product_id)
 WHERE 
  cne.species_id=gene_product.species_id AND
  t.name NOT IN ('biological_process','molecular_function','cellular_component',
                    'biological process unknown','molecular function unknown','cellular component unknown')
 GROUP BY
  term_type
 ORDER BY
  term_type;


-- @@ max_entropy_per_gp_by_ont_and_refspecies
-- maximimum information content per gene product, broken down by ontology. refg species only, all genes
CREATE OR REPLACE VIEW max_entropy_per_gp_by_ont_and_refspecies AS
 SELECT
  a.gene_product_id,
  term_type,
  MAX(entropy) AS max_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN gene_product ON (a.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 GROUP BY
  a.gene_product_id,
  term_type;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('max_entropy_per_gp_by_ont_and_refspecies');
-- CREATE INDEX max_entropy_per_gp_by_ont_and_refspecies_idx1 ON max_entropy_per_gp_by_ont_and_refspecies(gene_product_id);
-- CREATE UNIQUE INDEX max_entropy_per_gp_by_ont_and_refspecies_idx2 ON max_entropy_per_gp_by_ont_and_refspecies(gene_product_id, term_type);
-- CREATE UNIQUE INDEX max_entropy_per_gp_by_ont_and_refspecies_idx3 ON max_entropy_per_gp_by_ont_and_refspecies(gene_product_id, term_type,max_entropy);
-- END MATERIALIZE

-- @@ max_spentropy_per_gp_by_ont_and_refspecies
-- maximimum species-local information content per gene product, broken down by ontology
CREATE OR REPLACE VIEW max_spentropy_per_gp_by_ont_and_refspecies AS
 SELECT
  a.gene_product_id,
  term_type,
  MAX(entropy) AS max_entropy
 FROM
  class_node_entropy_by_species AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN gene_product ON (a.gene_product_id=gene_product.id)
  INNER JOIN refg_species AS sp ON (sp.id=gene_product.species_id)
 WHERE
  cne.species_id=sp.id
 GROUP BY
  a.gene_product_id,
  term_type;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('max_spentropy_per_gp_by_ont_and_refspecies');
-- CREATE INDEX max_spentropy_per_gp_by_ont_and_refspecies_idx1 ON max_spentropy_per_gp_by_ont_and_refspecies(gene_product_id);
-- CREATE UNIQUE INDEX max_spentropy_per_gp_by_ont_and_refspecies_idx2 ON max_spentropy_per_gp_by_ont_and_refspecies(gene_product_id, term_type);
-- CREATE UNIQUE INDEX max_spentropy_per_gp_by_ont_and_refspecies_idx3 ON max_spentropy_per_gp_by_ont_and_refspecies(gene_product_id, term_type,max_entropy);
-- END MATERIALIZE

-- @@ avg_max_entropy_per_gp_by_ont_and_refspecies
-- this gives a measure of how specific annotations are in the database as a whole.
CREATE OR REPLACE VIEW avg_max_entropy_per_gp_by_ont_and_refspecies AS
 SELECT
  AVG(max_entropy) AS avg_max_entropy,
  term_type
 FROM
  max_entropy_per_gp_by_ont_and_refspecies
 GROUP BY
  term_type;

-- @@ avg_max_spentropy_per_gp_by_ont_and_refspecies
-- this gives a measure of how specific annotations are in the database as a whole. Uses species-local IC metric
CREATE OR REPLACE VIEW avg_max_spentropy_per_gp_by_ont_and_refspecies AS
 SELECT
  AVG(max_entropy) AS avg_max_entropy,
  term_type
 FROM
  max_spentropy_per_gp_by_ont_and_refspecies
 GROUP BY
  term_type;

-- @@ max_entropy_per_refg_gp_by_ont_and_refspecies
-- maximimum information content per gene product, broken down by ontology. refg species only, refg genes set only
CREATE OR REPLACE VIEW max_entropy_per_refg_gp_by_ont_and_refspecies AS
 SELECT
  a.gene_product_id,
  term_type,
  MAX(entropy) AS max_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=a.gene_product_id)
 GROUP BY
  a.gene_product_id,
  term_type;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('max_entropy_per_refg_gp_by_ont_and_refspecies');
-- CREATE INDEX max_entropy_per_refg_gp_by_ont_and_refspecies_idx1 ON max_entropy_per_refg_gp_by_ont_and_refspecies(gene_product_id);
-- CREATE UNIQUE INDEX max_entropy_per_refg_gp_by_ont_and_refspecies_idx2 ON max_entropy_per_refg_gp_by_ont_and_refspecies(gene_product_id, term_type);
-- CREATE UNIQUE INDEX max_entropy_per_refg_gp_by_ont_and_refspecies_idx3 ON max_entropy_per_refg_gp_by_ont_and_refspecies(gene_product_id, term_type,max_entropy);
-- END MATERIALIZE

-- @@ max_spentropy_per_refg_gp_by_ont_and_refspecies
-- maximimum information content per gene product, broken down by ontology. refg species only, refg genes set only
CREATE OR REPLACE VIEW max_spentropy_per_refg_gp_by_ont_and_refspecies AS
 SELECT
  a.gene_product_id,
  term_type,
  MAX(entropy) AS max_entropy
 FROM
  class_node_entropy AS cne
  INNER JOIN association AS a ON (a.term_id=cne.node_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
  INNER JOIN gene_product_homolset AS gph ON (gph.gene_product_id=a.gene_product_id)
 GROUP BY
  a.gene_product_id,
  term_type;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('max_spentropy_per_refg_gp_by_ont_and_refspecies');
-- CREATE INDEX max_spentropy_per_refg_gp_by_ont_and_refspecies_idx1 ON max_spentropy_per_refg_gp_by_ont_and_refspecies(gene_product_id);
-- CREATE UNIQUE INDEX max_spentropy_per_refg_gp_by_ont_and_refspecies_idx2 ON max_spentropy_per_refg_gp_by_ont_and_refspecies(gene_product_id, term_type);
-- CREATE UNIQUE INDEX max_spentropy_per_refg_gp_by_ont_and_refspecies_idx3 ON max_spentropy_per_refg_gp_by_ont_and_refspecies(gene_product_id, term_type,max_entropy);
-- END MATERIALIZE

-- @@ avg_max_entropy_per_refg_gp_by_ont_and_refspecies
-- this gives a measure of how specific annotations are in the database as a whole.
CREATE OR REPLACE VIEW avg_max_entropy_per_refg_gp_by_ont_and_refspecies AS
 SELECT
  AVG(max_entropy) AS avg_max_entropy,
  term_type
 FROM
  max_entropy_per_refg_gp_by_ont_and_refspecies
 GROUP BY
  term_type;

-- @@ avg_max_spentropy_per_refg_gp_by_ont_and_refspecies
-- this gives a measure of how specific annotations are in the database as a whole.
CREATE OR REPLACE VIEW avg_max_spentropy_per_refg_gp_by_ont_and_refspecies AS
 SELECT
  AVG(max_entropy) AS avg_max_entropy,
  term_type
 FROM
  max_spentropy_per_refg_gp_by_ont_and_refspecies
 GROUP BY
  term_type;

-- @@ gene_product_in_refg_subset
-- convenience view: all gene_products in reference_genome subset
CREATE OR REPLACE VIEW gene_product_in_refg_subset AS
 SELECT
  *
 FROM
  gene_product_with_subset
  WHERE subset_acc='reference_genome';

-- @@ refg_with_ND 
-- all reference genome gene_products and their ND annotations.
CREATE OR REPLACE VIEW refg_with_ND AS
 SELECT
  subset_acc,
  gp.symbol,
  gp.full_name,
  species.genus,
  species.species,
  species.common_name,
  xref_dbname,
  xref_key,
  term.acc,
  term.name,
  term.term_type
 FROM
  ND_evidence
  INNER JOIN association ON (ND_evidence.association_id=association.id)
  INNER JOIN gene_product_with_subset AS gp ON (association.gene_product_id=gp.id)
  INNER JOIN dbxref ON (gp.dbxref_id=dbxref.id)
  INNER JOIN species ON (species_id=species.id)
  INNER JOIN term ON (association.term_id=term.id);


-- @@ refg_total_transitive_terms
-- total number of terms "coloured" in DAG for all reference genome genes.
-- includes transitive annotations
CREATE OR REPLACE VIEW refg_total_transitive_terms AS
 SELECT
  subset_acc,
  count(DISTINCT term1_id)
 FROM
  gene_product_with_subset AS gp
  INNER JOIN association ON (gp.id=gene_product_id)
  INNER JOIN graph_path ON (association.term_id=graph_path.term2_id)
 GROUP BY 
  subset_acc;

-- @@ homolset_annotation_full
-- A convenience view joining homolset, association, term and gene_product
-- Example: SELECT * FROM homolset_annotation_full WHERE homolset_symbol='ACTC';
--   summarises all annotations to this homology set
-- * includes unknowns
-- * direct annotation only
CREATE OR REPLACE VIEW homolset_annotation_full AS
 SELECT
  homolset_id,
  homolset.symbol AS homolset_symbol,
  dbxref.xref_dbname,
  dbxref.xref_key,
  gene_product.symbol,
  gene_product.species_id,
  term.acc term_acc,
  term.name AS term_name,
  term.term_type,
  association.term_id,
  association.gene_product_id,
  association.is_not,
  association.assocdate,
  evidence.*
 FROM
  homolset
  INNER JOIN gene_product_homolset AS gph ON (homolset.id=homolset_id)
  INNER JOIN gene_product ON (gene_product.id=gph.gene_product_id)
  INNER JOIN dbxref ON (gene_product.dbxref_id=dbxref.id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN term ON (association.term_id=term.id)
  INNER JOIN evidence ON (association.id=evidence.association_id);

-- @@ homolset_transitive_annotation_full
-- A convenience view joining homolset, association, term and gene_product AND graph_path
-- Example: SELECT * FROM homolset_transitive_annotation_full WHERE term_name='hemopoiesis';
--   summarises all annotations to this homology set
-- * direct + indirect annotations
CREATE OR REPLACE VIEW homolset_transitive_annotation_full AS
 SELECT
  homolset_id,
  homolset.symbol AS homolset_symbol,
  dbxref.xref_dbname,
  dbxref.xref_key,
  gene_product.symbol,
  gene_product.species_id,
  term.acc term_acc,
  term.name AS term_name,
  term.term_type,
  association.term_id,
  association.gene_product_id,
  association.is_not,
  association.assocdate,
  evidence.*
 FROM
  homolset
  INNER JOIN gene_product_homolset AS gph ON (homolset.id=homolset_id)
  INNER JOIN gene_product ON (gene_product.id=gph.gene_product_id)
  INNER JOIN dbxref ON (gene_product.dbxref_id=dbxref.id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN graph_path ON (association.term_id=graph_path.term2_id)
  INNER JOIN term ON (graph_path.term1_id=term.id)
  INNER JOIN evidence ON (association.id=evidence.association_id)
 ORDER BY
  homolset.symbol,
  gene_product.species_id;


-- @@ homolset_annotation
CREATE OR REPLACE VIEW homolset_annotation AS
 SELECT
  homolset_id,
  association.term_id,
  association.gene_product_id,
  association.is_not,
  association.assocdate,
  evidence.*
 FROM
  gene_product_homolset
  INNER JOIN association USING (gene_product_id)
  INNER JOIN evidence ON (association.id=evidence.association_id);

-- @@ homolset_annotation_outlier_full
-- an annotation outlier is any annotation in a homolset in which the
-- the term annotated (or an ancestor/descendant) is not separately annotated 
-- using an experimental evidence code (in the same homolset)
-- you can further constrain this using code; eg WHERE code != 'ISS'
-- current: 700+ results where code!='ISS'
-- http://www.berkeleybop.org/goose?sql_query=select+*+from++homolset_annotation_outlier_full+where+code%3D%27ISS%27+order+by+term_type%2Chomolset_symbol%2Cxref_dbname%3B&limit=0&mirror=1
CREATE OR REPLACE VIEW homolset_annotation_outlier_full AS
 SELECT 
  ha.*
 FROM
  homolset_annotation_full AS ha
 WHERE
  term_id NOT IN (SELECT term1_id
                  FROM graph_path
                       INNER JOIN homolset_annotation AS ha1 ON (ha1.term_id=term2_id)
                       WHERE ha1.code  NOT IN ('IEA', 'IGC', 'NAS', 'ND', 'NR', 'RCA', 'TAS', 'ISS')
                        AND  ha1.gene_product_id != ha.gene_product_id
                        AND  ha1.is_not=0
                        AND  ha1.homolset_id = ha.homolset_id)
  AND
  term_id NOT IN (SELECT term2_id
                  FROM graph_path
                       INNER JOIN homolset_annotation AS ha1 ON (ha1.term_id=term1_id)
                       WHERE ha1.code  NOT IN ('IEA', 'IGC', 'NAS', 'ND', 'NR', 'RCA', 'TAS', 'ISS')
                        AND  ha1.gene_product_id != ha.gene_product_id
                        AND  ha1.is_not=0
                        AND  ha1.homolset_id = ha.homolset_id);

-- 100 less results. 
CREATE OR REPLACE VIEW homolset_annotation_outlier_old AS
 SELECT 
  ha.*
 FROM
  homolset_annotation_full AS ha
 WHERE
  term_id NOT IN (SELECT term1_id
                  FROM graph_path
                       INNER JOIN homolset_annotation AS ha1 ON (ha1.term_id=term2_id)
                       WHERE ha1.code  NOT IN ('IEA', 'IGC', 'NAS', 'ND', 'NR', 'RCA', 'TAS', 'ISS')
                        AND  ha1.is_not=0
                        AND  ha1.homolset_id = ha.homolset_id)
  AND
  term_id NOT IN (SELECT term2_id
                  FROM graph_path
                       INNER JOIN homolset_annotation AS ha1 ON (ha1.term_id=term1_id)
                       WHERE ha1.code  NOT IN ('IEA', 'IGC', 'NAS', 'ND', 'NR', 'RCA', 'TAS', 'ISS')
                        AND  ha1.is_not=0
                        AND  ha1.homolset_id = ha.homolset_id);
-- as full
-- http://www.berkeleybop.org/goose?sql_query=select+*+from++homolset_annotation_outlier_full_by_checking_ancestors+where+code%3D%27ISS%27+order+by+term_type%2Chomolset_symbol%2Cxref_dbname%3B&limit=0&mirror=1
CREATE OR REPLACE VIEW homolset_annotation_outlier_full_by_checking_ancestors AS
 SELECT 
  ha.*
 FROM
  homolset_annotation_full AS ha
 WHERE
  term_id NOT IN (SELECT term1_id
                  FROM graph_path
                       INNER JOIN homolset_annotation AS ha1 ON (ha1.term_id=term2_id)
                       WHERE ha1.code  NOT IN ('IEA', 'IGC', 'NAS', 'ND', 'NR', 'RCA', 'TAS', 'ISS')
                        AND  ha1.gene_product_id != ha.gene_product_id
                        AND  ha1.is_not=0
                        AND  ha1.homolset_id = ha.homolset_id);

CREATE OR REPLACE VIEW homolset_annotation_outlier_full2 AS
 SELECT
  ha.*
 FROM
  homolset_annotation_full AS ha
 WHERE
  term_id NOT IN (SELECT term1_id
                  FROM graph_path
                       INNER JOIN homolset_annotation AS ha1 ON (ha1.term_id=term2_id)
                       WHERE ha1.code  NOT IN ('IEA', 'IGC', 'NAS', 'ND', 'NR', 'RCA', 'TAS')
--                        AND  ha1.gene_product_id != ha.gene_product_id
                        AND  ha1.is_not=0
                        AND  ha1.homolset_id = ha.homolset_id)
  AND
  term_id NOT IN (SELECT term2_id
                  FROM graph_path
                       INNER JOIN homolset_annotation AS ha1 ON (ha1.term_id=term1_id)
                       WHERE ha1.code  NOT IN ('IEA', 'IGC', 'NAS', 'ND', 'NR', 'RCA', 'TAS')
--                        AND  ha1.gene_product_id != ha.gene_product_id
                        AND  ha1.is_not=0
                        AND  ha1.homolset_id = ha.homolset_id);

CREATE OR REPLACE VIEW homolset_annotation_non_outlier_with_subsumer AS
 SELECT
  ha.*,
  ha1.gene_product_id AS subsuming_gene_product_id,
  ha1.term_id         AS subsuming_term_id,
  ha1.code            AS subsuming_association_code
 FROM
  homolset_annotation_full AS ha,
  graph_path INNER JOIN homolset_annotation AS ha1 ON (ha1.term_id=term1_id)
 WHERE 
       ha1.gene_product_id != ha.gene_product_id
  AND  ha1.is_not=0
  AND  ha1.homolset_id = ha.homolset_id
  AND  ha.term_id=term2_id;

CREATE OR REPLACE VIEW homolset_annotation_non_outlier_with_subsumed AS
 SELECT
  ha.*,
  ha1.gene_product_id AS subsumed_gene_product_id,
  ha1.term_id         AS subsumed_term_id,
  ha1.code            AS subsumed_association_code
 FROM
  homolset_annotation_full AS ha,
  graph_path INNER JOIN homolset_annotation AS ha1 ON (ha1.term_id=term2_id)
 WHERE 
       ha1.gene_product_id != ha.gene_product_id
  AND  ha1.is_not=0
  AND  ha1.homolset_id = ha.homolset_id
  AND  ha.term_id=term1_id;



-- @@ subsumer_of_association
-- All associations together with all the terms that subsume the term in that association
-- intuitively, everything "above" a gene product annotation in a DAG
-- Example: if A is to actinin binding, then this view includes protein binding
--           subsumer_of(PB, ABgene)
CREATE OR REPLACE VIEW subsumer_of_association AS
 SELECT
  tc.term1_id AS subsuming_term_id,
  a.*,
  tc.distance,
  e.code,
  e.id AS evidence_id
 FROM
  association AS a
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term1_id)
  INNER JOIN evidence AS e ON (e.association_id=a.id)
 WHERE is_not=0;

-- @@ subsumer_of_nonIEA_association
-- as subsumer_of_association, excluding IEA associations.
CREATE OR REPLACE VIEW subsumer_of_nonIEA_association AS
 SELECT
  tc.term1_id AS subsuming_term_id,
  a.*,
  tc.distance,
  e.code,
  e.id AS evidence_id
 FROM
  association AS a
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term1_id)
  INNER JOIN evidence AS e ON (e.association_id=a.id)
 WHERE
  e.code!='IEA'
  AND is_not=0;

-- @@ subsumed_by_association
-- All associations together with all the terms that are subsumed by the term in that association.
-- intuitively, everything "below" a gene product annotation in a DAG
-- Example: if A is to protein binding, then this view includes actinin binding
--           subsumed_by(AB, PBgene)
CREATE OR REPLACE VIEW subsumed_by_association AS
 SELECT
  tc.term2_id AS subsumed_term_id,
  a.*,
  tc.distance,
  e.code,
  e.id AS evidence_id
 FROM
  association AS a
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term2_id)
  INNER JOIN evidence AS e ON (e.association_id=a.id)
 WHERE is_not=0;

-- @@ subsumed_by_nonIEA_association
-- as subsumed_by_association, excluding IEA associations.
CREATE OR REPLACE VIEW subsumed_by_nonIEA_association AS
 SELECT
  tc.term2_id AS subsumed_term_id,
  a.*,
  tc.distance,
  e.code,
  e.id AS evidence_id
 FROM
  association AS a
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term2_id)
  INNER JOIN evidence AS e ON (e.association_id=a.id)
 WHERE
  e.code!='IEA'
  AND is_not=0;

-- @@ gp_partial_outlier_annotation_nothing_above
-- a gene_product partial 'outlier' with no other gene_products
-- for same homolset DIRECTLY annotated  
-- above it (it may have a different gene_product below)
-- Note: not considered an outlier if a different gp in the same species is directly
-- annotated above it. Should we change this to only consider different species?
CREATE OR REPLACE VIEW gp_partial_outlier_annotation_nothing_above AS
 SELECT
  gp2h.*,
  a.id AS association_id,
  a.term_id,
  a.is_not,
  t.acc AS term_acc,
  t.name AS term_name
 FROM
  gene_product_homolset AS gp2h
  INNER JOIN association AS a USING (gene_product_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
 WHERE
  NOT EXISTS (SELECT * 
                FROM subsumer_of_nonIEA_association AS a2 
                 INNER JOIN gene_product_homolset AS gp2h2 USING (gene_product_id)
                WHERE 
                      a2.subsuming_term_id=t.id
                  AND a2.gene_product_id != a.gene_product_id
                  AND gp2h2.homolset_id=gp2h.homolset_id
                  AND a.is_not=0);

-- @@ gp_partial_outlier_annotation_nothing_below
-- a gene_product partial 'outlier' with no other gene_products DIRECTLY annotated  
-- below it (it may have a different gene_product above)
-- Note: not considered an outlier if a different gp in the same species is directly
-- annotated below it. Should we change this to only consider different species?
CREATE OR REPLACE VIEW gp_partial_outlier_annotation_nothing_below AS
 SELECT
  gp2h.*,
  a.id AS association_id,
  a.term_id,
  a.is_not,
  t.acc AS term_acc,
  t.name AS term_name
 FROM
  gene_product_homolset AS gp2h
  INNER JOIN association AS a USING (gene_product_id)
  INNER JOIN term AS t ON (a.term_id=t.id)
 WHERE
  NOT EXISTS (SELECT * 
                FROM subsumed_by_nonIEA_association AS a2 
                 INNER JOIN gene_product_homolset AS gp2h2 USING (gene_product_id)
                WHERE 
                      a2.subsumed_term_id=t.id
                  AND a2.gene_product_id != a.gene_product_id
                  AND gp2h2.homolset_id=gp2h.homolset_id
                  AND a.is_not=0);

-- @@ gp_outlier_annotation
-- a gene_product partial 'outlier' annotation with no other gene_products DIRECTLY annotated  
-- via non-IEA above OR below it.
-- Note: an annotation is NOT considered an outlier if a different gene_product in the same species is directly
-- annotated above OR below it. Should we change this and only count an annotation as outlier if there are no
-- annotations from different species are above an below it.
-- 
CREATE OR REPLACE VIEW gp_outlier_annotation AS
 SELECT
  gp2h.*,
  a.id AS association_id,
  e.code,
  a.term_id,
  a.is_not,
  t.acc AS term_acc,
  t.name AS term_name,
  t.term_type,
  t.is_obsolete AS term_is_obsolete
 FROM
  gene_product_homolset AS gp2h
   INNER JOIN association AS a USING (gene_product_id)
   INNER JOIN evidence AS e ON (e.association_id=a.id)
   INNER JOIN term AS t ON (a.term_id=t.id)
 WHERE
  NOT EXISTS (SELECT * 
                FROM subsumer_of_nonIEA_association AS a2 
                 INNER JOIN gene_product_homolset AS gp2h2 USING (gene_product_id)
                WHERE 
                      a2.subsuming_term_id=t.id
                  AND a2.gene_product_id != a.gene_product_id
                  AND gp2h2.homolset_id=gp2h.homolset_id
                  AND a.is_not=0)
   AND
  NOT EXISTS (SELECT * 
                FROM subsumed_by_nonIEA_association AS a3 
                 INNER JOIN gene_product_homolset AS gp2h3 USING (gene_product_id)
                WHERE 
                      a3.subsumed_term_id=t.id
                  AND a3.gene_product_id != a.gene_product_id
                  AND gp2h3.homolset_id=gp2h.homolset_id
                  AND a.is_not=0);

-- @@ gp_outlier_annotation_full_report
-- As gp_outlier_annotation, but also includes joins to
-- include full details from other table - gene symbol,
-- gene dbxref
CREATE OR REPLACE VIEW gp_outlier_annotation_full_report AS
 SELECT DISTINCT
  hs.symbol AS homolset_symbol,
  a.is_not,
  a.code,
  a.term_acc,
  a.term_name,
  a.term_type,
  a.term_is_obsolete,
  gp.symbol,
  x.xref_dbname,
  x.xref_key
 FROM
  gp_outlier_annotation AS a 
  INNER JOIN gene_product AS gp ON (a.gene_product_id=gp.id)
  INNER JOIN homolset AS hs ON (hs.id=a.homolset_id)
  INNER JOIN dbxref AS x ON (x.id=gp.dbxref_id);


--- @@ total_gps_by_homolset_and_term
---
--- total number of gene products annotated to a term within a homolset.
--- total(H,T) = |{g : g in H, annot*(g,T)}|
---
--- intuitively, this tells us the degree of 'agreement' for a term across
--- a set of orthologous genes.
--- the number itself may not be meaningful without knowing the total number
--- of genes in a homolset - see homolset_term_proportion_gps
CREATE OR REPLACE VIEW total_gps_by_homolset_and_term AS
 SELECT
  gp2h.homolset_id,
  tc.term2_id AS term_id,
  count(DISTINCT a.gene_product_id) AS total_gps
 FROM
  gene_product_homolset AS gp2h
  INNER JOIN association AS a ON (a.gene_product_id=gp2h.gene_product_id)
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term2_id)
 GROUP BY
  gp2h.homolset_id,
  tc.term2_id;

--- ****************************************
--- CONGRUENCE STATS BY GENE
--- ****************************************

--- @@ proportion_of_genes_in_homolset_annotated_to
--- 
--- proportion of gene products in homolset H annotated to a term T.
--- p(T,H) = |{g : g in H, annot*(g,t)| / |{g: g in H}|
---
--- For example, if a homolset H contains genes g1,g2,g3,g4, and it is
--- the case that g1, g3 and g4 are annotated to a term T, then this
--- view will contain (H,T,0.75)
CREATE OR REPLACE VIEW proportion_of_genes_in_homolset_annotated_to AS
 SELECT
  gp2h.homolset_id,
  tc.term1_id AS term_id,
  ttl.total_gps AS n_genes_in_hset,
  count(DISTINCT a.gene_product_id) AS n_genes_in_hset_with_ann,
  count(DISTINCT a.gene_product_id) / ttl.total_gps AS proportion_genes
 FROM
  gene_product_homolset AS gp2h
  INNER JOIN association AS a ON (a.gene_product_id=gp2h.gene_product_id)
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term2_id)
  INNER JOIN total_gps_by_homolset AS ttl ON (gp2h.homolset_id=ttl.homolset_id)
 GROUP BY
  gp2h.homolset_id,
  tc.term1_id;

--- @@ bg_proportion_of_genes_in_homolset_annotated_to
---
--- as proportion_of_genes_in_homolset_annotated_to, but includes
--- background stats in order to be able to calculate hypergeomtric distn.
---
--- p_value_by_hypergeometric(k,H,M,N)
--- where k = n_genes_in_hset_with_ann (i.e. |{g : g in H, annot*(g,T)}|)
---       H = n_genes_in_hset (i.e. |{g : g in H}|)
---       M = n_genes_with_ann_in_bg (i.e. |{g : g in DB, annot*(g,T)}|)
---       N = n_genes_in_bg (i.e. |{g : g in DB}|)
CREATE OR REPLACE VIEW bg_proportion_of_genes_in_homolset_annotated_to AS
 SELECT
  gp2h.homolset_id,
  tc.term1_id AS term_id,
  ttl.total_gps AS n_genes_in_hset,
  count(DISTINCT a.gene_product_id) AS n_genes_in_hset_with_ann,
  count(DISTINCT a.gene_product_id) / ttl.total_gps AS proportion_genes,
  (SELECT total FROM count_of_annotated_entity) AS n_genes_in_bg,
  bg.num_genes AS n_genes_with_ann_in_bg
 FROM
  gene_product_homolset AS gp2h
  INNER JOIN association AS a ON (a.gene_product_id=gp2h.gene_product_id)
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term2_id)
  INNER JOIN total_gps_by_homolset AS ttl ON (gp2h.homolset_id=ttl.homolset_id)
  INNER JOIN number_of_genes_annotated_to AS bg ON (bg.term_id=tc.term1_id)
 GROUP BY
  gp2h.homolset_id,
  tc.term1_id;

-- @@ stats_proportion_of_genes_in_homolset_annotated_to
--
-- as proportion_of_genes_in_homolset_annotated_to, but includes
-- the p value.
-- see the makefile for details of how this is loaded
CREATE TABLE stats_proportion_of_genes_in_homolset_annotated_to (
  homolset_id INT,
  term_id INT,
  n_genes_in_hset INT,
  n_genes_in_hset_with_ann INT,
  proportion_genes DOUBLE,
  n_genes_in_bg INT,
  n_genes_with_ann_in_bg INT,
  p_value DOUBLE,

  UNIQUE (homolset_id,term_id)
);

CREATE OR REPLACE VIEW avg_proportion_of_homologous_genes_annotated_to AS
 SELECT
  term_id,
  count(*) AS n_hsets,
  SUM(n_genes_in_hset) AS sum_genes_in_hsets,
  AVG(n_genes_in_hset) AS avg_genes_in_hsets,
  SUM(n_genes_in_hset_with_ann) AS sum_genes_in_hset_with_ann,
  IFNULL(1- exp(SUM(log(1-p_value))), 1) AS cumul_p_value,
  AVG(proportion_genes) AS avg_proportion_genes,
  AVG(p_value) AS avg_p_value,
  MIN(p_value) AS min_p_value,
  MAX(p_value) AS max_p_value
 FROM
  stats_proportion_of_genes_in_homolset_annotated_to
 GROUP BY
  term_id;  

--- ****************************************
--- CONGRUENCE STATS BY SPECIES
--- ****************************************
--- similar to the above, but only counts
--- a maximum of 1 genes per species (eg no intra-species paralogs)
--- in each homolset

--- @@ proportion_of_species_in_homolset_annotated_to
--- 
--- proportion of gene products in homolset H annotated to a term T.
--- p(T,H) = |{g : g in H, annot*(g,t)| / |{g: g in H}|
---
--- For example, if a homolset H contains species g1,g2,g3,g4, and it is
--- the case that g1, g3 and g4 are annotated to a term T, then this
--- view will contain (H,T,0.75)
CREATE OR REPLACE VIEW proportion_of_species_in_homolset_annotated_to AS
 SELECT
  gp2h.homolset_id,
  tc.term1_id AS term_id,
  ttl.total_species AS n_species_in_hset,
  count(DISTINCT species_id) AS n_species_in_hset_with_ann,
  count(DISTINCT species_id) / ttl.total_species AS proportion_species
 FROM
  gene_product_homolset AS gp2h
  INNER JOIN association AS a ON (a.gene_product_id=gp2h.gene_product_id)
  INNER JOIN gene_product AS g ON (a.gene_product_id=g.id)
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term2_id)
  INNER JOIN total_species_by_homolset AS ttl ON (gp2h.homolset_id=ttl.homolset_id)
 GROUP BY
  gp2h.homolset_id,
  tc.term1_id;

--- @@ bg_proportion_of_species_in_homolset_annotated_to
---
--- as proportion_of_species_in_homolset_annotated_to, but includes
--- background stats in order to be able to calculate hypergeomtric distn.
---
--- p_value_by_hypergeometric(k,H,M,N)
--- where k = n_species_in_hset_with_ann (i.e. |{g : g in H, annot*(g,T)}|)
---       H = n_species_in_hset (i.e. |{g : g in H}|)
---       M = n_species_with_ann_in_bg (i.e. |{g : g in DB, annot*(g,T)}|)
---       N = n_species_in_bg (i.e. |{g : g in DB}|)
CREATE OR REPLACE VIEW bg_proportion_of_species_in_homolset_annotated_to AS
 SELECT
  gp2h.homolset_id,
  tc.term1_id AS term_id,
  ttl.total_species AS n_species_in_hset,
  count(DISTINCT species_id) AS n_species_in_hset_with_ann,
  count(DISTINCT species_id) / ttl.total_species AS proportion_species,
  (SELECT total FROM count_of_annotated_entity) AS n_species_in_bg,
  bg.num_genes AS n_genes_with_ann_in_bg
 FROM
  gene_product_homolset AS gp2h
  INNER JOIN association AS a ON (a.gene_product_id=gp2h.gene_product_id)
  INNER JOIN gene_product AS g ON (a.gene_product_id=g.id)
  INNER JOIN graph_path AS tc ON (a.term_id=tc.term2_id)
  INNER JOIN total_species_by_homolset AS ttl ON (gp2h.homolset_id=ttl.homolset_id)
  INNER JOIN number_of_genes_annotated_to AS bg ON (bg.term_id=tc.term1_id)
 GROUP BY
  gp2h.homolset_id,
  tc.term1_id;

-- @@ stats_proportion_of_species_in_homolset_annotated_to
--
-- as proportion_of_species_in_homolset_annotated_to, but includes
-- the p value.
-- see the makefile for details of how this is loaded
CREATE TABLE stats_proportion_of_species_in_homolset_annotated_to (
  homolset_id INT,
  term_id INT,
  n_species_in_hset INT,
  n_species_in_hset_with_ann INT,
  proportion_species DOUBLE,
  n_species_in_bg INT,
  n_genes_with_ann_in_bg INT,
  p_value DOUBLE,

  UNIQUE (homolset_id,term_id)
);

CREATE OR REPLACE VIEW avg_proportion_of_homologous_species_annotated_to AS
 SELECT
  term_id,
  count(*) AS n_hsets,
  SUM(n_species_in_hset) AS sum_species_in_hsets,
  AVG(n_species_in_hset) AS avg_species_in_hsets,
  SUM(n_species_in_hset_with_ann) AS sum_species_in_hset_with_ann,
  IFNULL(1- exp(SUM(log(1-p_value))), 1) AS cumul_p_value,
  AVG(proportion_species) AS avg_proportion_species,
  AVG(p_value) AS avg_p_value,
  MIN(p_value) AS min_p_value,
  MAX(p_value) AS max_p_value
 FROM
  stats_proportion_of_species_in_homolset_annotated_to
 GROUP BY
  term_id;  

--- ****************************************
--- END
--- ****************************************

--- -----------------------------------------------------------------

--- @@ avg_proportion_genes_under_term
--- Average degree of congruence amongst homolsets of annotations beneath some node
--- in the DAG.
--- We might expect "molecular function" to have a high degree of congruence, as might
--- "cellular process", less so "multicellular organismal process"
CREATE OR REPLACE VIEW avg_proportion_genes_under_term AS
 SELECT
  tc.term1_id AS subsuming_term_id,
  avg(proportion_genes)
 FROM
  proportion_of_genes_in_homolset_annotated_to AS htpg
  INNER JOIN graph_path AS tc ON (tc.term2_id = htpg.term_id)
 GROUP BY
  tc.term1_id;

-- @@ avg_total_genes_by_homolset_and_ontol
-- measure of congruence, by homolset and ontology.
-- average of the total number of gene_products 
CREATE OR REPLACE VIEW avg_total_genes_by_homolset_and_ontol AS
 SELECT
  s.homolset_id,
  t.term_type,
  avg(total_gps) AS avg_total_genes
 FROM
  total_gps_by_homolset_and_term AS s
  INNER JOIN term AS t ON (s.term_id=t.id)
 GROUP BY
  s.homolset_id,
  t.term_type;

CREATE OR REPLACE VIEW avg_proportion_genes_by_homolset_and_ontol AS
 SELECT
  s.homolset_id,
  t.term_type,
  avg(proportion_genes) AS avg_proportion_genes_annotated_with_term
 FROM
  proportion_of_genes_in_homolset_annotated_to AS s
  INNER JOIN term AS t ON (s.term_id=t.id)
 GROUP BY
  s.homolset_id,
  t.term_type;

CREATE OR REPLACE VIEW homolset_congruence_report AS
 SELECT
  hp.homolset_id,
  hp.term_type,
  avg(total_genes) AS total_genes,
  avg(avg_proportion_genes_annotated_with_term) AS avg_proportion_genes_annotated_with_term
 FROM
  total_genes_by_homolset_and_term AS tgp
  INNER JOIN avg_proportion_genes_by_homolset_and_ontol AS hp USING (homolset_id)
 GROUP BY
  hp.homolset_id,
  hp.term_type;

CREATE OR REPLACE VIEW homolset_transitive_annotation AS
 SELECT
 term1_id AS inferred_term_id,
 term2_id AS asserted_term_id,
 graph_path.relationship_type_id,
 association.*,
 homolset_id
FROM graph_path
 INNER JOIN association ON (graph_path.term2_id=association.term_id)
 INNER JOIN gene_product_homolset ON (association.gene_product_id=gene_product_homolset.gene_product_id);

CREATE OR REPLACE VIEW homolset_summary_by_term AS
 SELECT
 term1_id AS inferred_term_id,
 association.gene_product_id,
 homolset_id,
 COUNT(distinct association.id)
FROM homolset
 INNER JOIN gene_product_homolset ON (homolset.id = gene_product_homolset.homolset_id)
 LEFT OUTER JOIN association ON (association.gene_product_id = gene_product_homolset.gene_product_id)
 LEFT OUTER JOIN graph_path ON (graph_path.term2_id = association.term_id)
GROUP BY
 term1_id,
 association.gene_product_id,
 homolset_id;

  

 
