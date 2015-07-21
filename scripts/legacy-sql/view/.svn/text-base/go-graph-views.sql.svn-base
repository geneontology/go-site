CREATE OR REPLACE VIEW root_term AS
  SELECT *
  FROM term
  WHERE 
   term.name IN ('biological_process','molecular_function','cellular_component',
                 'biological process unknown','molecular function unknown','cellular component unknown','all');

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('root_term');
-- CREATE UNIQUE INDEX root_term_idx1 ON root_term(id);
-- CREATE UNIQUE INDEX root_term_idx2 ON root_term(id,term_type);
-- END MATERIALIZE


CREATE OR REPLACE VIEW non_root_term AS
  SELECT *
  FROM term
  WHERE
   term.name NOT IN ('biological_process','molecular_function','cellular_component',
                     'biological process unknown','molecular function unknown','cellular component unknown','all');

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('non_root_term');
-- CREATE UNIQUE INDEX non_root_term_idx1 ON non_root_term(id);
-- CREATE UNIQUE INDEX non_root_term_idx2 ON non_root_term(id,term_type);
-- END MATERIALIZE


-- @@ term_ancestor
-- term * graph_path
-- ancestor_id is an ancestor of term
CREATE OR REPLACE VIEW term_ancestor AS
SELECT term.*, 
       graph_path.distance,
       graph_path.term1_id AS ancestor_id
FROM 
 term
 INNER JOIN graph_path ON (term.id=graph_path.term2_id);

-- @@ term_descendent
-- term * graph_path
-- descendent_id is a descendent of term
CREATE OR REPLACE VIEW term_descendent AS
SELECT term.*, 
       graph_path.distance,
       graph_path.term2_id AS descendent_id
FROM 
 term
 INNER JOIN graph_path ON (term.id=graph_path.term1_id);

-- @@ transitive_association
-- association * graph_path
CREATE OR REPLACE VIEW transitive_association AS
SELECT association.*,
       graph_path.term1_id AS ancestor_id
FROM
 association
 INNER JOIN graph_path ON (association.term_id=graph_path.term2_id);


-- @@ leaf_node
-- A term that has no children
CREATE OR REPLACE VIEW leaf_node AS
    select distinct t.*
    FROM term t
    INNER JOIN term2term t2t1 ON (t.id=term2_id)
    LEFT JOIN term2term t2t2 ON (t2t1.term2_id=t2t2.term1_id)
    WHERE t2t2.term1_id IS NULL;

-- @@ path_to_leaf
-- graph_path from a term to a leaf node
CREATE OR REPLACE VIEW path_to_leaf AS
    select distinct p.*
    FROM graph_path p
    INNER JOIN leaf_node t ON (p.term2_id=t.id);

-- @@ path_to_root
-- graph_path from a term to a root node
CREATE OR REPLACE VIEW path_to_root AS
    select distinct p.*
    FROM graph_path p
    INNER JOIN term t ON (p.term1_id=t.id)
    WHERE t.is_root = 1;

-- @@ num_ancestors
-- 
CREATE OR REPLACE VIEW term_num_ancestors AS
    SELECT 
     distinct p.term2_id AS term_id, 
     COUNT(DISTINCT p.term1_id) AS num_ancestors
    FROM graph_path p
    GROUP BY p.term2_id;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('term_num_ancestors');
-- CREATE UNIQUE INDEX term_num_ancestors_idx1 ON term_num_ancestors(term_id);
-- CREATE INDEX term_num_ancestors_idx2 ON term_num_ancestors(num_ancestors);
-- CREATE UNIQUE INDEX term_num_ancestors_idx3 ON term_num_ancestors(term_id,num_ancestors);
-- END MATERIALIZE


-- @@ distance_to_root_stats_by_term
-- each term can have multiple paths to the root(s); this finds the min, max and avg distance - grouped by term
-- (note: see max_distance_to_root_by_term for a more efficient query)
CREATE OR REPLACE VIEW distance_to_root_stats_by_term AS
    SELECT 
        p.term2_id AS term_id,
        max(distance) AS max_distance,
        min(distance) AS min_distance,
        avg(distance) AS avg_distance,
        max(distance)-min(distance) AS delta_distance
    FROM path_to_root AS p
    GROUP BY term_id;

-- @@ max_distance_to_root_by_term
-- each term can have multiple paths to the root(s); this finds the maximum distance - grouped by term
-- note: this view is redundant with distance_to_root_stats_by_term, but it is faster
-- we do not need to check if a path leads to the root node, since any path that does NOT lead to the root will have 
-- a longer path that DOES. This assumptions holds so long as we have a basic treatment of root and path that
-- ignores relationship_type
CREATE OR REPLACE VIEW max_distance_to_root_by_term AS
    SELECT 
        p.term2_id AS term_id,
        max(distance) AS max_distance
    FROM graph_path AS p
    GROUP BY term_id;

CREATE OR REPLACE VIEW max_max_distance_to_root_by_term AS
 SELECT max(max_distance) FROM max_distance_to_root_by_term;

-- @@ term_having_max_max_distance_to_root
-- what are the deepest terms in the DAG?
CREATE OR REPLACE VIEW term_having_max_max_distance_to_root AS
    SELECT 
        term.acc,
        term.name,
        max_distance
    FROM max_distance_to_root_by_term AS md INNER JOIN term ON (term.id=md.term_id)
    WHERE max_distance IN (SELECT max(max_distance) FROM max_distance_to_root_by_term);

-- @@ term_having_max_delta_distance_to_root
-- what are the most unbalanced terms in the DAG?
CREATE OR REPLACE VIEW term_having_max_delta_distance_to_root AS
    SELECT 
        *        
    FROM distance_to_root_stats_by_term
    WHERE delta_distance IN (SELECT max(delta_distance) FROM distance_to_root_stats_by_term);

-- @@ total_paths_to_root_by_term
CREATE OR REPLACE VIEW total_paths_to_root_by_term AS
    SELECT 
        p.term2_id AS term_id,
        count(p.id) AS total_paths
    FROM graph_path AS p
    GROUP BY term_id;

-- @@ term_having_most_paths_to_root
CREATE OR REPLACE VIEW term_having_most_paths_to_root AS
    SELECT 
        *        
    FROM total_paths_to_root_by_term
    WHERE total_paths IN (SELECT max(total_paths) FROM total_paths_to_root_by_term);

-- @@ distance_to_leaf_stats_by_term
-- each term can have multiple paths to the leaves of the DAG; this finds the min, max and avg distance - grouped by term
-- (note: see max_distance_to_leaf_by_term for a more efficient query)
CREATE OR REPLACE VIEW distance_to_leaf_stats_by_term AS
    SELECT 
        p.term1_id AS term_id,
        max(distance) AS max_distance,
        min(distance) AS min_distance,
        avg(distance) AS avg_distance,
        max(distance)-min(distance) AS delta_distance
    FROM path_to_leaf AS p
    GROUP BY term_id;

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('distance_to_leaf_stats_by_term');
-- CREATE UNIQUE INDEX distance_to_leaf_stats_by_term_idx1 ON distance_to_leaf_stats_by_term(term_id);
-- CREATE UNIQUE INDEX distance_to_leaf_stats_by_term_idx2 ON distance_to_leaf_stats_by_term(term_id,min_distance);
-- END MATERIALIZE

-- @@ max_distance_to_leaf_by_term
-- each term can have multiple paths to multiples leaves; this finds the maximum distance - grouped by term
-- (note: this is redundant with distance_to_leaf_stats_by_term -- however, it is MUCH more efficient)
DROP TABLE IF EXISTS max_distance_to_leaf_by_term;
CREATE OR REPLACE VIEW max_distance_to_leaf_by_term AS
    SELECT 
        p.term1_id AS term_id,
        max(distance) AS max_distance
    FROM graph_path AS p
    GROUP BY term_id;

-- @@ max_distance_to_leaf_over_relation_by_term
-- each term can have multiple paths to multiples leaves; this finds the maximum distance - grouped by term
-- (note: this is redundant with distance_to_leaf_over_relation_stats_by_term -- however, it is MUCH more efficient)
DROP TABLE IF EXISTS max_distance_to_leaf_over_relation_by_term;
CREATE OR REPLACE VIEW max_distance_to_leaf_over_relation_by_term AS
    SELECT 
        p.term1_id AS term_id,
        p.relationship_type_id,
        max(relation_distance) AS max_distance
    FROM graph_path AS p
    GROUP BY term_id
    UNION
    SELECT
     term.id AS term_id, 
     r.id AS relationship_type_id,
     0 AS max_distance
    FROM term AS r JOIN
      term LEFT JOIN graph_path AS p ON (p.term1_id=term.id AND p.relationship_type_id=r.id)
    WHERE term.id 
     AND r.is_relation=1
     AND term.is_obsolete=0
     AND p.term2_id IS NULL;

CREATE OR REPLACE VIEW BROKEN__max_distance_to_leaf_over_relation_by_term AS
    SELECT 
        term.id AS term_id,
        r.id AS relationship_type_id,
        max(IFNULL(relation_distance,0)) AS max_distance
    FROM term
     LEFT OUTER JOIN graph_path AS p ON (term.id=p.term1_id)
     LEFT OUTER JOIN term AS r ON (p.relationship_type_id=r.id)
    GROUP BY term.id;

-- @@ max_distance_to_root_by_term
-- each term can have multiple paths to root; this finds the maximum distance - grouped by term
-- (note: this is redundant with distance_to_root_stats_by_term -- however, it is MUCH more efficient)
DROP TABLE IF EXISTS max_distance_to_root_by_term;
CREATE OR REPLACE VIEW max_distance_to_root_by_term AS
    SELECT 
        p.term2_id AS term_id,
        max(distance) AS max_distance
    FROM graph_path AS p
    GROUP BY term_id;

-- ========================================
-- ANNOTATION REPORTS
-- ========================================

-- @@ avg_max_distance_to_leaf_term_by_db
-- average maximum-distance-to-leaf per annotation, partitioned by annotation source (eg FlyBase, UniProt, ...)
-- excludes annotations to root nodes (aka "unknowns")
DROP TABLE IF EXISTS avg_max_distance_to_leaf_term_by_db;
CREATE OR REPLACE VIEW avg_max_distance_to_leaf_term_by_db AS
 SELECT
  dbxref.xref_dbname,avg(max_distance) AS avg_max_distance
 FROM
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN max_distance_to_leaf_by_term ON (max_distance_to_leaf_by_term.term_id=association.term_id)
 WHERE
  association.term_id NOT IN (SELECT id FROM root_term)
 GROUP BY
  dbxref.xref_dbname;

-- @@ avg_max_distance_to_leaf_term_by_db_and_species
-- average maximum-distance-to-leaf per annotation, partitioned by annotation source (eg FlyBase, UniProt, ...) and species (fruitfly, human, ..)
-- excludes annotations to root nodes (aka "unknowns")
DROP TABLE IF EXISTS avg_max_distance_to_leaf_term_by_db_and_species;
CREATE OR REPLACE VIEW avg_max_distance_to_leaf_term_by_db_and_species AS
 SELECT
  dbxref.xref_dbname,species.common_name,avg(max_distance) AS avg_max_distance
 FROM
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN max_distance_to_leaf_by_term ON (max_distance_to_leaf_by_term.term_id=association.term_id)
  INNER JOIN species ON (gene_product.species_id=species.id)
 WHERE
  association.term_id NOT IN (SELECT id FROM root_term)
 GROUP BY
  dbxref.xref_dbname,species.common_name;

-- @@ avg_max_distance_to_leaf_term_by_db_and_species
-- average maximum-distance-to-leaf per annotation, partitioned by annotation source (eg FlyBase, UniProt, ...) and ontology (MF, BP, CC)
-- excludes annotations to root nodes (aka "unknowns")
DROP TABLE IF EXISTS avg_max_distance_to_leaf_term_by_db_and_ontology;
CREATE OR REPLACE VIEW avg_max_distance_to_leaf_term_by_db_and_ontology AS
 SELECT
  dbxref.xref_dbname,
  term.term_type,
  avg(max_distance) AS avg_max_distance
 FROM
  dbxref
  INNER JOIN gene_product ON (dbxref.id=gene_product.dbxref_id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN max_distance_to_leaf_by_term ON (max_distance_to_leaf_by_term.term_id=association.term_id)
  INNER JOIN term ON (association.term_id = term.id)
 WHERE
  association.term_id NOT IN (SELECT id FROM root_term)
 GROUP BY
  dbxref.xref_dbname,
  term.term_type;

-- @@ avg_max_distance_to_leaf_term_by_db_and_species_uniprot_filtered
-- As avg_max_distance_to_leaf_term_by_db_and_species, but filters out non-human UniProt annotations
-- this is a convenience view that groups Human with the MODs
CREATE OR REPLACE VIEW avg_max_distance_to_leaf_term_by_db_and_species_uniprot_filtered AS
 SELECT * FROM avg_max_distance_to_leaf_term_by_db_and_species
  WHERE (xref_dbname!='UniProt' && xref_dbname!='PDB')
   OR common_name='human';


-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('max_distance_to_leaf_by_term');
-- CREATE UNIQUE INDEX max_distance_to_leaf_by_term_idx1 ON max_distance_to_leaf_by_term(term_id);
-- CREATE INDEX max_distance_to_leaf_by_term_idx2 ON max_distance_to_leaf_by_term(max_distance);
-- CREATE INDEX max_distance_to_leaf_by_term_idx3 ON max_distance_to_leaf_by_term(term_id,max_distance);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('avg_max_distance_to_leaf_term_by_db');
-- CREATE UNIQUE INDEX avg_max_distance_to_leaf_term_by_db_idx3 ON avg_max_distance_to_leaf_term_by_db(xref_dbname);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('avg_max_distance_to_leaf_term_by_db_and_ontology');
-- CREATE UNIQUE INDEX avg_max_distance_to_leaf_term_by_db_and_ontology_idx1 ON avg_max_distance_to_leaf_term_by_db_and_ontology(xref_dbname,term_type);
-- END MATERIALIZE

-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('avg_max_distance_to_leaf_term_by_db_and_species');
-- CREATE UNIQUE INDEX avg_max_distance_to_leaf_term_by_db_and_species_idx1 ON avg_max_distance_to_leaf_term_by_db_and_species(xref_dbname,common_name);
-- END MATERIALIZE


