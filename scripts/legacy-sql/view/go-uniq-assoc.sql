drop table if exists unique_association;
create table unique_association select distinct term_id, gene_product_id, source_db_id from association;
create index ua_term_id on unique_association (term_id);
create index ua_gp_id on unique_association(gene_product_id);
create index ua_term_src_id on unique_association (term_id,source_db_id);
create index ua_gp_src_id on unique_association(gene_product_id,source_db_id);
create index ua_term_gp_src_id on unique_association (term_id,gene_product_id, source_db_id);
