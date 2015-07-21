-- 

DROP PROCEDURE IF EXISTS create_mview;
DELIMITER //
CREATE PROCEDURE create_mview (IN source_table VARCHAR(150), IN target_table  VARCHAR(150))
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
MODIFIES SQL DATA
BEGIN
-- declare some variables ...
DECLARE m_view_name VARCHAR(150);
DECLARE create_m_view_sql TEXT;
DECLARE drop_m_view_sql TEXT;
-- 
-- create the sql queries to drop the materialized view, create the tmaterialized view
SET m_view_name:=concat('view_m_', source_table);
SET @drop_m_view_sql:=concat('DROP TABLE IF EXISTS ',target_table);
SET @create_m_view_sql:=concat('CREATE TABLE ', target_table , ' SELECT * FROM ', source_table);
-- 
-- drop the materialized view if it exists
PREPARE stmt1 FROM @drop_m_view_sql;
EXECUTE stmt1;
-- 
-- create the table
PREPARE stmt2 FROM @create_m_view_sql;
EXECUTE stmt2;
-- 
DEALLOCATE PREPARE stmt1;
DEALLOCATE PREPARE stmt2;
-- 
END; //
DELIMITER ;

DROP PROCEDURE IF EXISTS create_mview_in_place;
DELIMITER //
CREATE PROCEDURE create_mview_in_place (IN source_view VARCHAR(150))
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
MODIFIES SQL DATA
BEGIN
-- declare some variables ...
DECLARE tmp_table VARCHAR(150);
DECLARE m_view_name VARCHAR(150);
DECLARE create_m_view_sql TEXT;
DECLARE drop_m_view_sql TEXT;
-- 
-- create the sql queries to drop the materialized view, create the tmaterialized view
SET tmp_table:=concat('tmp_', source_view);
SET @drop_m_view_sql:=concat('DROP TABLE IF EXISTS ',tmp_table);
SET @create_tmp_sql:=concat('CREATE TABLE ', tmp_table , ' SELECT * FROM ', source_view);
SET @drop_orig_sql1:=concat('DROP VIEW IF EXISTS ',source_view);
SET @drop_orig_sql2:=concat('DROP TABLE IF EXISTS ',source_view);
SET @create_mview_sql:=concat('CREATE TABLE ', source_view , ' SELECT * FROM ', tmp_table);
SET @drop_tmp_sql:=concat('DROP TABLE IF EXISTS ',tmp_table);
 
-- drop the materialized view if it exists
PREPARE stmt1 FROM @drop_m_view_sql;
EXECUTE stmt1;
-- 
-- create the tmp table
PREPARE stmt2 FROM @create_tmp_sql;
EXECUTE stmt2;
-- 
PREPARE stmt3a FROM @drop_orig_sql1;
EXECUTE stmt3a;
-- 
PREPARE stmt3b FROM @drop_orig_sql2;
EXECUTE stmt3b;
-- 
PREPARE stmt4 FROM @create_mview_sql;
EXECUTE stmt4;
-- 
-- 
PREPARE stmt5 FROM @drop_tmp_sql;
EXECUTE stmt5;


DEALLOCATE PREPARE stmt1;
DEALLOCATE PREPARE stmt2;
-- 
END; //
DELIMITER ;

DROP PROCEDURE IF EXISTS create_mview_with_pkey;
DELIMITER //
CREATE PROCEDURE create_mview_with_pkey (IN source_table VARCHAR(150), IN target_table  VARCHAR(150), IN primary_key VARCHAR(150))
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
MODIFIES SQL DATA
BEGIN
-- declare some variables ...
DECLARE m_view_name VARCHAR(150);
DECLARE create_m_view_sql TEXT;
DECLARE drop_m_view_sql TEXT;
DECLARE add_primary_key_sql TEXT;
-- 
-- create the sql queries to drop the materialized view, create the tmaterialized view
-- and add a primary key to the materialized view.
SET m_view_name:=concat('view_m_', source_table);
SET @drop_m_view_sql:=concat('DROP TABLE IF EXISTS ',target_table);
SET @create_m_view_sql:=concat('CREATE TABLE ', target_table , ' SELECT * FROM ', source_table);
SET @add_primary_key_sql:=concat('ALTER TABLE ', target_table , ' ADD PRIMARY KEY (', primary_key ,')');
-- 
-- drop the materialized view if it exists
PREPARE stmt1 FROM @drop_m_view_sql;
EXECUTE stmt1;
-- 
-- create the table
PREPARE stmt2 FROM @create_m_view_sql;
EXECUTE stmt2;
-- 
-- add the primary key
PREPARE stmt3 FROM @add_primary_key_sql;
EXECUTE stmt3;
-- 
DEALLOCATE PREPARE stmt1;
DEALLOCATE PREPARE stmt2;
DEALLOCATE PREPARE stmt3;
-- 
END; //
DELIMITER ;
