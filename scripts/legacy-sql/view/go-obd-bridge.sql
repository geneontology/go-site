CREATE OR REPLACE VIEW node AS
 SELECT
  id            AS node_id,
  acc           AS uid,
  name          AS label,
  CASE WHEN is_obsolete = 0 THEN 'f' ELSE 't' END AS is_obsolete
 FROM
  term;


CREATE OR REPLACE VIEW implied_link AS
 SELECT
  term2_id              AS node_id,
  NULL                  AS predicate_id,
  term1_id              AS object_id,
  NULL                  AS when_id
 FROM
  graph_path;

CREATE OR REPLACE VIEW asserted_link AS
 SELECT
  term2_id              AS node_id,
  NULL                  AS predicate_id,
  term1_id              AS object_id,
  NULL                  AS when_id
 FROM
  term2term;

CREATE OR REPLACE VIEW link AS
 SELECT
  *,
  CAST('t' AS CHAR(1)) AS is_inferred
 FROM
  implied_link
 UNION
 SELECT
  *,
  CAST('t' AS CHAR(1)) AS is_inferred
 FROM
  asserted_link;



CREATE OR REPLACE VIEW node_max_depth AS
 SELECT
  term2_id              AS node_id,
  NULL                  AS predicate_id,
  max(distance)         AS max_distance
 FROM
  graph_path
 GROUP BY node_id, predicate_id;
  
  
