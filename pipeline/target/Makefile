## --------------------
## goa_dog
## --------------------
all_goa_dog: target/goa_dog-filtered.gaf.gz
	echo done

target/goa_dog-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/DOG/goa_dog.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_dog-filtered.gaf.gz: target/goa_dog-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_ecocyc
## --------------------
all_paint_ecocyc: target/paint_ecocyc-filtered.gaf.gz
	echo done

target/paint_ecocyc-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_ecocyc.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_ecocyc-filtered.gaf.gz: target/paint_ecocyc-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_pig_rna
## --------------------
all_goa_pig_rna: target/goa_pig_rna-filtered.gaf.gz
	echo done

target/goa_pig_rna-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/PIG/goa_pig_rna.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_pig_rna-filtered.gaf.gz: target/goa_pig_rna-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_cow_isoform
## --------------------
all_goa_cow_isoform: target/goa_cow_isoform-filtered.gaf.gz
	echo done

target/goa_cow_isoform-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/COW/goa_cow_isoform.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_cow_isoform-filtered.gaf.gz: target/goa_cow_isoform-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## ecocyc
## --------------------
all_ecocyc: target/ecocyc-filtered.gaf.gz
	echo done

target/ecocyc-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.ecocyc.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/ecocyc-filtered.gaf.gz: target/ecocyc-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## reactome
## --------------------
all_reactome: target/reactome-filtered.gaf.gz
	echo done

target/reactome-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.reactome.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/reactome-filtered.gaf.gz: target/reactome-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## pamgo_oomycetes
## --------------------
all_pamgo_oomycetes: target/pamgo_oomycetes-filtered.gaf.gz
	echo done

target/pamgo_oomycetes-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.PAMGO_Oomycetes.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/pamgo_oomycetes-filtered.gaf.gz: target/pamgo_oomycetes-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## pamgo_atumefaciens
## --------------------
all_pamgo_atumefaciens: target/pamgo_atumefaciens-filtered.gaf.gz
	echo done

target/pamgo_atumefaciens-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.PAMGO_Atumefaciens.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/pamgo_atumefaciens-filtered.gaf.gz: target/pamgo_atumefaciens-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## jcvi
## --------------------
all_jcvi: target/jcvi-filtered.gaf.gz
	echo done

target/jcvi-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.jcvi.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/jcvi-filtered.gaf.gz: target/jcvi-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## mgi.gpad
## --------------------
all_mgi.gpad: target/mgi.gpad-filtered.gaf.gz
	echo done

target/mgi.gpad-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.mgi.gpad.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/mgi.gpad-filtered.gaf.gz: target/mgi.gpad-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## zfin
## --------------------
all_zfin: target/zfin-filtered.gaf.gz
	echo done

target/zfin-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.zfin.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/zfin-filtered.gaf.gz: target/zfin-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## aspgd
## --------------------
all_aspgd: target/aspgd-filtered.gaf.gz
	echo done

target/aspgd-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.aspgd.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/aspgd-filtered.gaf.gz: target/aspgd-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## wb
## --------------------
all_wb: target/wb-filtered.gaf.gz
	echo done

target/wb-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.wb.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/wb-filtered.gaf.gz: target/wb-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_human_isoform
## --------------------
all_goa_human_isoform: target/goa_human_isoform-filtered.gaf.gz
	echo done

target/goa_human_isoform-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/HUMAN/goa_human_isoform.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_human_isoform-filtered.gaf.gz: target/goa_human_isoform-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## pombase
## --------------------
all_pombase: target/pombase-filtered.gaf.gz
	echo done

target/pombase-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.pombase.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/pombase-filtered.gaf.gz: target/pombase-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## genedb_tsetse
## --------------------
all_genedb_tsetse: target/genedb_tsetse-filtered.gaf.gz
	echo done

target/genedb_tsetse-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.GeneDB_tsetse.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/genedb_tsetse-filtered.gaf.gz: target/genedb_tsetse-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## pamgo_mgrisea
## --------------------
all_pamgo_mgrisea: target/pamgo_mgrisea-filtered.gaf.gz
	echo done

target/pamgo_mgrisea-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.PAMGO_Mgrisea.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/pamgo_mgrisea-filtered.gaf.gz: target/pamgo_mgrisea-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_goa_chicken
## --------------------
all_paint_goa_chicken: target/paint_goa_chicken-filtered.gaf.gz
	echo done

target/paint_goa_chicken-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_goa_chicken.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_goa_chicken-filtered.gaf.gz: target/paint_goa_chicken-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## cgd
## --------------------
all_cgd: target/cgd-filtered.gaf.gz
	echo done

target/cgd-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.cgd.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/cgd-filtered.gaf.gz: target/cgd-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## pamgo_ddadantii
## --------------------
all_pamgo_ddadantii: target/pamgo_ddadantii-filtered.gaf.gz
	echo done

target/pamgo_ddadantii-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.PAMGO_Ddadantii.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/pamgo_ddadantii-filtered.gaf.gz: target/pamgo_ddadantii-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## sgd
## --------------------
all_sgd: target/sgd-filtered.gaf.gz
	echo done

target/sgd-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.sgd.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/sgd-filtered.gaf.gz: target/sgd-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_dictybase
## --------------------
all_paint_dictybase: target/paint_dictybase-filtered.gaf.gz
	echo done

target/paint_dictybase-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_dictyBase.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_dictybase-filtered.gaf.gz: target/paint_dictybase-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## gramene_oryza
## --------------------
all_gramene_oryza: target/gramene_oryza-filtered.gaf.gz
	echo done

target/gramene_oryza-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.gramene_oryza.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/gramene_oryza-filtered.gaf.gz: target/gramene_oryza-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_sgd
## --------------------
all_paint_sgd: target/paint_sgd-filtered.gaf.gz
	echo done

target/paint_sgd-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_sgd.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_sgd-filtered.gaf.gz: target/paint_sgd-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_goa_human
## --------------------
all_paint_goa_human: target/paint_goa_human-filtered.gaf.gz
	echo done

target/paint_goa_human-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_goa_human.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_goa_human-filtered.gaf.gz: target/paint_goa_human-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_pig_isoform
## --------------------
all_goa_pig_isoform: target/goa_pig_isoform-filtered.gaf.gz
	echo done

target/goa_pig_isoform-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/PIG/goa_pig_isoform.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_pig_isoform-filtered.gaf.gz: target/goa_pig_isoform-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_chicken_complex
## --------------------
all_goa_chicken_complex: target/goa_chicken_complex-filtered.gaf.gz
	echo done

target/goa_chicken_complex-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/CHICKEN/goa_chicken_complex.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_chicken_complex-filtered.gaf.gz: target/goa_chicken_complex-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## xenbase
## --------------------
all_xenbase: target/xenbase-filtered.gaf.gz
	echo done

target/xenbase-filtered.gaf.gz: target/xenbase-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_cow
## --------------------
all_goa_cow: target/goa_cow-filtered.gaf.gz
	echo done

target/goa_cow-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/COW/goa_cow.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_cow-filtered.gaf.gz: target/goa_cow-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_chicken_isoform
## --------------------
all_goa_chicken_isoform: target/goa_chicken_isoform-filtered.gaf.gz
	echo done

target/goa_chicken_isoform-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/CHICKEN/goa_chicken_isoform.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_chicken_isoform-filtered.gaf.gz: target/goa_chicken_isoform-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_chicken_rna
## --------------------
all_goa_chicken_rna: target/goa_chicken_rna-filtered.gaf.gz
	echo done

target/goa_chicken_rna-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/CHICKEN/goa_chicken_rna.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_chicken_rna-filtered.gaf.gz: target/goa_chicken_rna-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_human
## --------------------
all_goa_human: target/goa_human-filtered.gaf.gz
	echo done

target/goa_human-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/HUMAN/goa_human.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_human-filtered.gaf.gz: target/goa_human-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_dog_isoform
## --------------------
all_goa_dog_isoform: target/goa_dog_isoform-filtered.gaf.gz
	echo done

target/goa_dog_isoform-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/DOG/goa_dog_isoform.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_dog_isoform-filtered.gaf.gz: target/goa_dog_isoform-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_pdb
## --------------------
all_goa_pdb: target/goa_pdb-filtered.gaf.gz
	echo done

target/goa_pdb-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/PDB/goa_pdb.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_pdb-filtered.gaf.gz: target/goa_pdb-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_cow_rna
## --------------------
all_goa_cow_rna: target/goa_cow_rna-filtered.gaf.gz
	echo done

target/goa_cow_rna-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/COW/goa_cow_rna.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_cow_rna-filtered.gaf.gz: target/goa_cow_rna-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## rgd
## --------------------
all_rgd: target/rgd-filtered.gaf.gz
	echo done

target/rgd-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.rgd.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/rgd-filtered.gaf.gz: target/rgd-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## tair
## --------------------
all_tair: target/tair-filtered.gaf.gz
	echo done

target/tair-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.tair.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/tair-filtered.gaf.gz: target/tair-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## dictybase
## --------------------
all_dictybase: target/dictybase-filtered.gaf.gz
	echo done

target/dictybase-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.dictyBase.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/dictybase-filtered.gaf.gz: target/dictybase-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## pseudocap
## --------------------
all_pseudocap: target/pseudocap-filtered.gaf.gz
	echo done

target/pseudocap-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.pseudocap.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/pseudocap-filtered.gaf.gz: target/pseudocap-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_tair
## --------------------
all_paint_tair: target/paint_tair-filtered.gaf.gz
	echo done

target/paint_tair-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_tair.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_tair-filtered.gaf.gz: target/paint_tair-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_cow_complex
## --------------------
all_goa_cow_complex: target/goa_cow_complex-filtered.gaf.gz
	echo done

target/goa_cow_complex-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/COW/goa_cow_complex.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_cow_complex-filtered.gaf.gz: target/goa_cow_complex-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## sgn
## --------------------
all_sgn: target/sgn-filtered.gaf.gz
	echo done

target/sgn-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.sgn.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/sgn-filtered.gaf.gz: target/sgn-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## genedb_lmajor
## --------------------
all_genedb_lmajor: target/genedb_lmajor-filtered.gaf.gz
	echo done

target/genedb_lmajor-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.GeneDB_Lmajor.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/genedb_lmajor-filtered.gaf.gz: target/genedb_lmajor-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## fb
## --------------------
all_fb: target/fb-filtered.gaf.gz
	echo done

target/fb-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.fb.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/fb-filtered.gaf.gz: target/fb-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## genedb_pfalciparum
## --------------------
all_genedb_pfalciparum: target/genedb_pfalciparum-filtered.gaf.gz
	echo done

target/genedb_pfalciparum-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.GeneDB_Pfalciparum.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/genedb_pfalciparum-filtered.gaf.gz: target/genedb_pfalciparum-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_mgi
## --------------------
all_paint_mgi: target/paint_mgi-filtered.gaf.gz
	echo done

target/paint_mgi-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_mgi.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_mgi-filtered.gaf.gz: target/paint_mgi-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## gonuts
## --------------------
all_gonuts: target/gonuts-filtered.gaf.gz
	echo done

target/gonuts-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.gonuts.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/gonuts-filtered.gaf.gz: target/gonuts-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_human_rna
## --------------------
all_goa_human_rna: target/goa_human_rna-filtered.gaf.gz
	echo done

target/goa_human_rna-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/HUMAN/goa_human_rna.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_human_rna-filtered.gaf.gz: target/goa_human_rna-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_other
## --------------------
all_paint_other: target/paint_other-filtered.gaf.gz
	echo done

target/paint_other-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_other.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_other-filtered.gaf.gz: target/paint_other-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_rgd
## --------------------
all_paint_rgd: target/paint_rgd-filtered.gaf.gz
	echo done

target/paint_rgd-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_rgd.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_rgd-filtered.gaf.gz: target/paint_rgd-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_fb
## --------------------
all_paint_fb: target/paint_fb-filtered.gaf.gz
	echo done

target/paint_fb-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_fb.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_fb-filtered.gaf.gz: target/paint_fb-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_pombase
## --------------------
all_paint_pombase: target/paint_pombase-filtered.gaf.gz
	echo done

target/paint_pombase-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_pombase.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_pombase-filtered.gaf.gz: target/paint_pombase-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_zfin
## --------------------
all_paint_zfin: target/paint_zfin-filtered.gaf.gz
	echo done

target/paint_zfin-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_zfin.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_zfin-filtered.gaf.gz: target/paint_zfin-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_pig
## --------------------
all_goa_pig: target/goa_pig-filtered.gaf.gz
	echo done

target/goa_pig-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/PIG/goa_pig.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_pig-filtered.gaf.gz: target/goa_pig-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## mgi
## --------------------
all_mgi: target/mgi-filtered.gaf.gz
	echo done

target/mgi-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.mgi.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/mgi-filtered.gaf.gz: target/mgi-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_human_complex
## --------------------
all_goa_human_complex: target/goa_human_complex-filtered.gaf.gz
	echo done

target/goa_human_complex-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/HUMAN/goa_human_complex.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_human_complex-filtered.gaf.gz: target/goa_human_complex-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## genedb_tbrucei
## --------------------
all_genedb_tbrucei: target/genedb_tbrucei-filtered.gaf.gz
	echo done

target/genedb_tbrucei-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/gene_association.GeneDB_Tbrucei.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/genedb_tbrucei-filtered.gaf.gz: target/genedb_tbrucei-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_dog_complex
## --------------------
all_goa_dog_complex: target/goa_dog_complex-filtered.gaf.gz
	echo done

target/goa_dog_complex-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/DOG/goa_dog_complex.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_dog_complex-filtered.gaf.gz: target/goa_dog_complex-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_pig_complex
## --------------------
all_goa_pig_complex: target/goa_pig_complex-filtered.gaf.gz
	echo done

target/goa_pig_complex-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/PIG/goa_pig_complex.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_pig_complex-filtered.gaf.gz: target/goa_pig_complex-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_chicken
## --------------------
all_goa_chicken: target/goa_chicken-filtered.gaf.gz
	echo done

target/goa_chicken-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/CHICKEN/goa_chicken.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_chicken-filtered.gaf.gz: target/goa_chicken-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_wb
## --------------------
all_paint_wb: target/paint_wb-filtered.gaf.gz
	echo done

target/paint_wb-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_wb.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_wb-filtered.gaf.gz: target/paint_wb-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## paint_cgd
## --------------------
all_paint_cgd: target/paint_cgd-filtered.gaf.gz
	echo done

target/paint_cgd-src.gaf.gz: 
	wget --no-check-certificate http://geneontology.org/gene-associations/submission/paint/pre-submission/gene_association.paint_cgd.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/paint_cgd-filtered.gaf.gz: target/paint_cgd-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

## --------------------
## goa_dog_rna
## --------------------
all_goa_dog_rna: target/goa_dog_rna-filtered.gaf.gz
	echo done

target/goa_dog_rna-src.gaf.gz: 
	wget --no-check-certificate ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/DOG/goa_dog_rna.gaf.gz -O $@.tmp && mv $@.tmp $@ && touch $@

target/goa_dog_rna-filtered.gaf.gz: target/goa_dog_rna-src.gaf.gz
	./util/filter-gaf.pl -i $< -w > $@.tmp && mv $@.tmp $@

all_gafs: all_goa_dog all_paint_ecocyc all_goa_pig_rna all_goa_cow_isoform all_ecocyc all_reactome all_pamgo_oomycetes all_pamgo_atumefaciens all_jcvi all_mgi.gpad all_zfin all_aspgd all_wb all_goa_human_isoform all_pombase all_genedb_tsetse all_pamgo_mgrisea all_paint_goa_chicken all_cgd all_pamgo_ddadantii all_sgd all_paint_dictybase all_gramene_oryza all_paint_sgd all_paint_goa_human all_goa_pig_isoform all_goa_chicken_complex all_xenbase all_goa_cow all_goa_chicken_isoform all_goa_chicken_rna all_goa_human all_goa_dog_isoform all_goa_pdb all_goa_cow_rna all_rgd all_tair all_dictybase all_pseudocap all_paint_tair all_goa_cow_complex all_sgn all_genedb_lmajor all_fb all_genedb_pfalciparum all_paint_mgi all_gonuts all_goa_human_rna all_paint_other all_paint_rgd all_paint_fb all_paint_pombase all_paint_zfin all_goa_pig all_mgi all_goa_human_complex all_genedb_tbrucei all_goa_dog_complex all_goa_pig_complex all_goa_chicken all_paint_wb all_paint_cgd all_goa_dog_rna
	echo done

