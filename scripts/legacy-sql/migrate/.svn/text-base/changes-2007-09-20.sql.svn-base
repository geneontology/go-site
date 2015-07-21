--- @@ gene_product_subset
--- (aka goslims). Each subsetdef (slim) is stored as a gene_product in the database (with term_type = 'subset')
--- The subset_id links to this term
--- (OBO-Format: *subset* tag. term_id references a term housing the *subsetdef*)
CREATE TABLE gene_product_subset (

	gene_product_id	integer not null,
	foreign key (gene_product_id) references gene_product(id),
	subset_id	integer not null,
	foreign key (subset_id) references term(id)
);

