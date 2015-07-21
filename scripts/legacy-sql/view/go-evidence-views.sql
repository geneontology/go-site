-- inferred by curator
CREATE OR REPLACE VIEW IC_evidence AS
 SELECT * FROM evidence WHERE code='IC';

CREATE OR REPLACE VIEW ND_evidence AS
 SELECT * FROM evidence WHERE code='ND';

CREATE OR REPLACE VIEW stale_IC AS
 SELECT DISTINCT
        src_term.acc,
        src_term.name,
        src_term.term_type,
        a.*
 FROM IC_evidence AS ic 
        INNER JOIN evidence_dbxref AS ex ON (ic.id=evidence_id)
        INNER JOIN dbxref ON (ex.dbxref_id=dbxref.id)
        INNER JOIN association AS a ON (a.id=ic.association_id)
        INNER JOIN term AS src_term ON (concat(xref_dbname,':',xref_key) = src_term.acc)
 WHERE
  NOT EXISTS (SELECT * FROM association AS a2 INNER JOIN graph_path AS tc ON (tc.term2_id=a2.term_id)
              WHERE a2.gene_product_id=a.gene_product_id AND tc.term1_id=src_term.id); 

CREATE OR REPLACE VIEW stale_IC_ipr AS
 SELECT DISTINCT
        ex.*,
        a.*
 FROM IC_evidence AS ic 
        INNER JOIN evidence_dbxref AS ex ON (ic.id=evidence_id)
        INNER JOIN association AS a ON (a.id=ic.association_id)
        INNER JOIN dbxref ON (ex.dbxref_id=dbxref.id)
 WHERE
  dbxref.xref_dbname='UniProt' AND
  NOT EXISTS (SELECT * FROM association AS a2 INNER JOIN graph_path AS tc ON (tc.term2_id=a2.term_id)
              INNER JOIN term_dbxref AS tx ON (tx.term_id =tc.term1_id)
              WHERE a2.gene_product_id=a.gene_product_id AND tx.dbxref_id=ex.dbxref_id);



-- see http://wiki.geneontology.org/index.php/Example_Queries#Pairs_of_GO_terms_associated_via_IC_evidence
CREATE OR REPLACE VIEW term_pair_by_IC AS
 SELECT DISTINCT
        term.*,
        src_term.name AS src_name,
        src_term.term_type AS src_term_type,
        src_term.acc AS src_acc
 FROM IC_evidence AS ic 
        INNER JOIN evidence_dbxref AS ex ON (ic.id=evidence_id)
        INNER JOIN dbxref ON (ex.dbxref_id=dbxref.id)
        INNER JOIN association AS a ON (a.id=ic.association_id)
        INNER JOIN term ON (a.term_id=term.id) 
        INNER JOIN term AS src_term ON (concat(xref_dbname,':',xref_key) = src_term.acc);

CREATE OR REPLACE VIEW term_pair_by_IC_with_gp AS
 SELECT DISTINCT
        gp.symbol,
        gp.full_name,
        gpx.xref_dbname,
        gpx.xref_key,        
        term.*,
        src_term.name AS src_name,
        src_term.term_type AS src_term_type,
        src_term.acc AS src_acc
 FROM IC_evidence AS ic 
        INNER JOIN evidence_dbxref AS ex ON (ic.id=evidence_id)
        INNER JOIN dbxref ON (ex.dbxref_id=dbxref.id)
        INNER JOIN association AS a ON (a.id=ic.association_id)
        INNER JOIN term ON (a.term_id=term.id) 
        INNER JOIN term AS src_term ON (concat(dbxref.xref_dbname,':',dbxref.xref_key) = src_term.acc)
        INNER JOIN gene_product AS gp ON (gp.id=a.gene_product_id)
        INNER JOIN dbxref AS gpx ON (gp.dbxref_id=gpx.id);

CREATE OR REPLACE VIEW term_pair_by_IC_summary AS
 SELECT 
  src_term_type,
  term_type,
  count(*) AS total_annotations
 FROM
  term_pair_by_IC
 GROUP BY
  src_term_type,
  term_type;


-- @@
-- potential inference pair an annotation (der) and the gene_product the annotation
-- is derived from, via ISS (src)
-- 
-- 
CREATE OR REPLACE VIEW association_inference_candidate_pair AS
 SELECT
   gpx_src.xref_dbname   AS gp_src_dbname,
   gpx_src.xref_key      AS gp_src_key,
   gp_src.id             AS gp_src_id,
   gp_src.symbol         AS gp_src_symbol,
   gpx_der.xref_dbname   AS gp_der_dbname,
   gpx_der.xref_key      AS gp_der_key,
   gp_der.id             AS gp_der_id,
   gp_der.symbol         AS gp_der_symbol,
   t_der.id              AS term_der_id,
   t_der.acc             AS term_der_acc,
   t_der.name            AS term_der_name,
   t_der.is_obsolete     AS term_der_is_obsolete,
   a_der.is_not          AS assoc_der_is_not,
   aqt_der.name          AS assoc_der_qual
 FROM
   gene_product AS gp_src
   INNER JOIN dbxref AS gpx_src ON (gp_src.dbxref_id=gpx_src.id)
   INNER JOIN evidence_dbxref AS ex_der ON (ex_der.dbxref_id=gp_src.dbxref_id)
   INNER JOIN evidence AS e_der ON (e_der.id=ex_der.evidence_id)
   INNER JOIN association AS a_der ON (a_der.id=e_der.association_id)
   INNER JOIN term AS t_der ON (a_der.term_id=t_der.id)
   INNER JOIN gene_product AS gp_der ON (a_der.gene_product_id=gp_der.id)
   INNER JOIN dbxref AS gpx_der ON (gp_der.dbxref_id=gpx_der.id)
   LEFT OUTER JOIN association_qualifier AS aq_der ON (a_der.id=aq_der.association_id)
   LEFT OUTER JOIN term AS aqt_der ON (aqt_der.id=aq_der.term_id)
 WHERE
   e_der.code = 'ISS';


CREATE OR REPLACE VIEW stale_ISS_annotation AS
 SELECT
  *
 FROM
  association_inference_candidate_pair
 WHERE
   NOT EXISTS (SELECT a_src.id
               FROM 
                    association AS a_src
                    INNER JOIN graph_path AS pth ON (pth.term2_id=a_src.term_id)
               WHERE 
                     pth.term1_id=term_der_id
                     AND a_src.gene_product_id=gp_src_id);


CREATE OR REPLACE VIEW ISS_annotation_to_NAS_direct AS
 SELECT
  aicp.*,
  a_src.*,
  e_src.id AS e_src_id,
  e_src.dbxref_id AS e_src_dbxref_id
 FROM
  association_inference_candidate_pair AS aicp
  INNER JOIN association AS a_src ON (aicp.term_der_id = a_src.term_id)
  INNER JOIN evidence AS e_src ON (a_src.id=e_src.association_id)
 WHERE
  e_src.code='NAS';

CREATE OR REPLACE VIEW ISS_annotation_to_NAS_direct_without AS
 SELECT
  *
 FROM
  ISS_annotation_to_NAS_direct
 WHERE
   NOT EXISTS (SELECT a_src.id
               FROM 
                    association AS a_src
               WHERE 
                     a_src.term_id=term_der_id);


CREATE OR REPLACE VIEW association_evidence_with AS
 SELECT DISTINCT
  association_id,
  evidence.code,
  ex.xref_dbname AS with_dbname,
  ex.xref_key    AS with_acc,
  px.xref_dbname AS pub_dbname,
  px.xref_key    AS pub_acc
FROM   
 evidence
 INNER JOIN evidence_dbxref ON (evidence.id=evidence_dbxref.evidence_id)
 INNER JOIN dbxref AS ex ON (evidence_dbxref.dbxref_id=ex.id)
 INNER JOIN dbxref AS px ON (evidence.dbxref_id=px.id);

CREATE OR REPLACE VIEW db_evidence_summary AS
 SELECT DISTINCT
  dbxref.xref_dbname,
  aew.code,
  aew.with_dbname,
  aew.pub_dbname,
  aew.pub_acc,
  count(association_id) AS total_associations
 FROM   gene_product
  INNER JOIN dbxref ON (gene_product.dbxref_id=dbxref.id)
  INNER JOIN association ON (gene_product.id=association.gene_product_id)
  INNER JOIN association_evidence_with AS aew ON (aew.association_id=association.id)
 GROUP BY
  dbxref.xref_dbname,
  aew.code,
  aew.with_dbname,
  aew.pub_dbname,
  aew.pub_acc;


-- BEGIN MATERIALIZE
-- CALL create_mview_in_place('association_evidence_with');
-- END MATERIALIZE

