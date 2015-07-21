ALTER TABLE term ADD COLUMN        is_relation	        integer  not null default 0;

CREATE TABLE relation_properties (

--- @@ relation_properties.relationship_type_id
--- The first relation in the pairwise composition.
--- References an entry in the term table.
--- (recall that the term table housed both the terms themselves,
---  and the relations)
        relationship_type_id integer NOT NULL,
	foreign key (relationship_type_id) references term(id),

--- @@ relation_properties.is_transitive        
--- equals 1 if this relation is transitive.
--- IF [X R Y] AND [Y R Z] AND [R is_transitive] THEN [X R Z]
--- (OBO-Format: *is_transitive* tag)
--- valid values: 0 or 1
	is_transitive	integer,

--- @@ relation_properties.is_symmetric        
--- equals 1 if this relation is symmetric.
--- IF [X R Y] AND [R is_symmetric] THEN [Y R X]
--- (OBO-Format: *is_symmetric* tag)
--- valid values: 0 or 1
	is_symmetric	integer,

--- @@ relation_properties.is_anti_symmetric        
--- equals 1 if this relation is anti_symmetric.
--- IF [X R Y] AND [Y R X] AND [R is_anti_symmetric] THEN [X=Y]
--- (OBO-Format: *is_anti_symmetric* tag)
--- valid values: 0 or 1
	is_anti_symmetric	integer,

--- @@ relation_properties.is_cyclic        
--- equals 1 if this relation is cyclic.
--- (OBO-Format: *is_cyclic* tag)
--- valid values: 0 or 1
	is_cyclic	integer,

--- @@ relation_properties.is_reflexive        
--- equals 1 if this relation is reflexive.
--- IF [R is_reflexive] THEN [X R X]
--- (OBO-Format: *is_reflexive* tag)
--- valid values: 0 or 1
	is_reflexive	integer,

--- @@ relation_properties.is_metadata_tag        
--- equals 1 if this relation is metadata_tag.
--- IF [X R Y] AND [R is_metadata_tag] THEN [Y R X]
--- (OBO-Format: *is_metadata_tag* tag)
--- valid values: 0 or 1
	is_metadata_tag	integer,

	UNIQUE (relationship_type_id)

);

--- @@ relation_composition
--- (See http://wiki.geneontology.org/index.php/Relation_composition)
--- Stores rules of the form: r1 . r2 -> r
--- i.e. IF [ X r1 Y ] AND [ Y r2 Z ] THEN [ X r Z ]
--- Corresponds to "transitive_over" and "holds_over_chain" tags in obo-format.
CREATE TABLE relation_composition (

	id	serial PRIMARY KEY,

--- @@ relation_composition.relation1_id
--- The first relation in the pairwise composition.
--- References an entry in the term table.
--- (recall that the term table housed both the terms themselves,
---  and the relations)
        relation1_id integer NOT NULL,
	foreign key (relation1_id) references term(id),

--- @@ relation_composition.relation2_id
--- The second relation in the pairwise composition.
--- References an entry in the term table.
--- (recall that the term table housed both the terms themselves,
---  and the relations)
        relation2_id integer NOT NULL,
	foreign key (relation2_id) references term(id),

--- @@ relation_composition.inferred_relation_id
--- The inferred relation in the pairwise composition.
--- References an entry in the term table.
--- (recall that the term table housed both the terms themselves,
---  and the relations)
        inferred_relation_id integer NOT NULL,
	foreign key (inferred_relation_id) references term(id),

	UNIQUE (relation1_id, relation2_id, inferred_relation_id)
       
);
