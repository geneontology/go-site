# GO Rules

This folder contains the metadata for all annotation and ontology QC
rules in GO. Each rule has an identifier, metadata and
descriptions. Some rules are automatable, in which case the metadata
contains the information required to execute it.

For more details for GOC members on how to create rules, see [SOP.md](SOP.md)


 * <a href="#gorule0000001">GORULE:0000001 GAF lines are parsed according to GAF 2.2 specifications</a>
 * <a href="#gorule0000002">GORULE:0000002 No 'NOT' annotations to binding ; GO:0005488 or 'protein binding ; GO:0005515'</a>
 * <a href="#gorule0000003">GORULE:0000003 DEPRECATED Annotations to 'binding ; GO:0005488' and 'protein binding ; GO:0005515' should be made with IPI and an interactor in the 'with' field</a>
 * <a href="#gorule0000004">GORULE:0000004 Reciprocal annotations for 'protein binding ; GO:0005515'</a>
 * <a href="#gorule0000005">GORULE:0000005 IEA, ISS, ISO, ISM, ISA, IBA, RCA annotations are not allowed for direct annotations to to 'protein binding ; GO:0005515 or GO:0005488 binding''</a>
 * <a href="#gorule0000006">GORULE:0000006 IEP and HEP usage is restricted to terms from the Biological Process ontology</a>
 * <a href="#gorule0000007">GORULE:0000007 IPI should not be used with GO:0003824 catalytic activity or descendents</a>
 * <a href="#gorule0000008">GORULE:0000008 No annotations should be made to uninformative high level terms</a>
 * <a href="#gorule0000009">GORULE:0000009 Annotation Intersection Alerts</a>
 * <a href="#gorule0000010">GORULE:0000010 DEPRECATED - PubMed reference formatting must be correct</a>
 * <a href="#gorule0000011">GORULE:0000011 ND evidence code should be to root nodes only, and no terms other than root nodes can have the evidence code ND</a>
 * <a href="#gorule0000013">GORULE:0000013 Taxon-appropriate annotation check</a>
 * <a href="#gorule0000014">GORULE:0000014 DEPRECATED. GO terms in annotations should not be obsolete.</a>
 * <a href="#gorule0000015">GORULE:0000015 Dual species taxon check</a>
 * <a href="#gorule0000016">GORULE:0000016 With/From: IC annotations require a With/From GO ID</a>
 * <a href="#gorule0000017">GORULE:0000017 IDA annotations must not have a With/From entry</a>
 * <a href="#gorule0000018">GORULE:0000018 IPI annotations require a With/From entry</a>
 * <a href="#gorule0000019">GORULE:0000019 Generic Reasoner Validation Check</a>
 * <a href="#gorule0000020">GORULE:0000020 Automatic repair of annotations to merged or obsoleted terms</a>
 * <a href="#gorule0000021">GORULE:0000021 DEPRECATED Check with/from for sequence similarity evidence for valid database ID</a>
 * <a href="#gorule0000022">GORULE:0000022 Check for, and filter, annotations made to retracted publications</a>
 * <a href="#gorule0000023">GORULE:0000023 Materialize annotations for inter-branch links in the GO</a>
 * <a href="#gorule0000024">GORULE:0000024 Prevent propagation of certain terms by orthology</a>
 * <a href="#gorule0000025">GORULE:0000025 Creating more specific annotations by reasoning over extensions</a>
 * <a href="#gorule0000026">GORULE:0000026 IBA annotations must have been sourced from the PAINT inference pipeline</a>
 * <a href="#gorule0000027">GORULE:0000027 Each identifier in GAF is valid</a>
 * <a href="#gorule0000028">GORULE:0000028 GO aspect should match the term's namespace; otherwise it is repaired to the appropriate aspect</a>
 * <a href="#gorule0000029">GORULE:0000029 IEAs should be less than one year old.</a>
 * <a href="#gorule0000030">GORULE:0000030 Obsolete GO_REFs are not allowed</a>
 * <a href="#gorule0000031">GORULE:0000031 DEPRECATED. Annotation relations are replaced when not provided by source</a>
 * <a href="#gorule0000032">GORULE:0000032 DEPRECATED Allowed References for each ECO.</a>
 * <a href="#gorule0000033">GORULE:0000033 DEPRECATED. Public Reference IDs (PMID, PMC, doi, or GO_REF) should be preferred over group specific Reference IDs</a>
 * <a href="#gorule0000035">GORULE:0000035 DEPRECATED - Colocalizes_with' qualifier not allowed with protein-containing complex (GO:0032991)' and children.</a>
 * <a href="#gorule0000036">GORULE:0000036 Report annotations that involve gene products where the gene product is annotated to a term 'x' and 'regulation of X' (multiple annotations involved)</a>
 * <a href="#gorule0000037">GORULE:0000037 IBA annotations should ONLY be assigned_by GO_Central and have GO_REF:0000033 as a reference</a>
 * <a href="#gorule0000038">GORULE:0000038 Annotations using ISS/ISA/ISO evidence should refer to a gene product (in the 'with' column) where there exists another annotation with the same or a more granular term using experimental evidence</a>
 * <a href="#gorule0000039">GORULE:0000039 Protein complexes can not be annotated to GO:0032991 (protein-containing complex) or its descendants</a>
 * <a href="#gorule0000042">GORULE:0000042 Qualifier: IKR evidence code requires a NOT qualifier</a>
 * <a href="#gorule0000043">GORULE:0000043 Check for valid combination of evidence code and GO_REF</a>
 * <a href="#gorule0000044">GORULE:0000044 DEPRECATED - Reference: check for invalid use of GO_REF:0000057 can only be used with terms that are descendants of GO:0006915 (apoptotic process)</a>
 * <a href="#gorule0000045">GORULE:0000045 With/from: Verify that the combination of evidence (ECO) codes conform to the rules in eco-usage-constraints.yaml</a>
 * <a href="#gorule0000046">GORULE:0000046 The ‘with’ field (GAF column 8) must be the same as the gene product (GAF column 2) when annotating to ‘self-binding’ terms.</a>
 * <a href="#gorule0000047">GORULE:0000047 With/from: ChEBI IDs in With/from can only be used with terms that are descendants of GO:0005488 (binding)</a>
 * <a href="#gorule0000048">GORULE:0000048 DEPRECATED Gene products having ND annotations and other annotations in the same aspect should be reviewed</a>
 * <a href="#gorule0000049">GORULE:0000049 If the annotation has 'contributes_to' as its qualifier, verify that at least one annotation to GO:0043234 (protein complex), or one of its child terms exists</a>
 * <a href="#gorule0000050">GORULE:0000050 Annotations to ISS, ISA and ISO should not be self-referential</a>
 * <a href="#gorule0000051">GORULE:0000051 Some GO terms require a value in the Annotation Extension field</a>
 * <a href="#gorule0000053">GORULE:0000053 'NOT' annotation should not have extension</a>
 * <a href="#gorule0000054">GORULE:0000054 Genes annotated with ND should have no other annotations for that aspect</a>
 * <a href="#gorule0000055">GORULE:0000055 References should have only one ID per ID space</a>
 * <a href="#gorule0000056">GORULE:0000056 Annotations should validate against GO shape expressions</a>
 * <a href="#gorule0000057">GORULE:0000057 Group specific filter rules should be applied to annotations</a>
 * <a href="#gorule0000058">GORULE:0000058 Object extensions should conform to the extensions-patterns.yaml file in metadata</a>
 * <a href="#gorule0000059">GORULE:0000059 GAF Version 2.0 and 2.1 are converted into GAF Version 2.2</a>
 * <a href="#gorule0000061">GORULE:0000061 Allowed gene product to term relations (gp2term)</a>
 * <a href="#gorule0000062">GORULE:0000062 Infer annotations on molecular function via has_part</a>
 * <a href="#gorule0000063">GORULE:0000063 Annotations using ISS/ISA/ISO evidence should refer to a gene product (in the 'with' column)</a>
 * <a href="#gorule0000064">GORULE:0000064 TreeGrafter IEAs should be filtered for GO reference species</a>
 * <a href="#gorule0000065">GORULE:0000065 Annotations to term that are candidates for obsoletion should be produce a warning</a>



<a name="gorule0000001"/>

## GAF lines are parsed according to GAF 2.2 specifications

 * id: [GORULE:0000001](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000001.md)
 * status: implemented


Each line of a GAF file is checked that it generally conforms to the GAF 2.2 spec and some
GO specific specifications. The GAF 2.2 spec is here: http://geneontology.org/docs/go-annotation-file-gaf-format-2.2/.

Qualifier, evidence, aspect and DB object columns must be within the list of allowed values
(as per the spec).

Error report (number of errors) in [db_species]-summary.txt & owltools-check.txt (details).

<a name="gorule0000002"/>

## No 'NOT' annotations to binding ; GO:0005488 or 'protein binding ; GO:0005515'

 * id: [GORULE:0000002](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000002.md)
 * status: implemented



An annotation to binding ; GO:0005488 or protein binding ; GO:0005515 with the 'not' qualifier implies that the annotated protein cannot bind anything. There are no characterized examples of a protein with no interactions.

The presence of an identifier in the 'with' column or in an annotation extension would not justify a 'not' annotation either, since a qualifier 
add precision to the GO term; it does not imply that a protein does not have the activity designated by the GO term under the specific context specified by the annotation extension. 

This rule *only* applies to direct annotations to GO:0005488  and GO:0005515; children of these terms can be
qualified with 'not', as further information on the type of binding is
then supplied in the GO term. For more information, see the [binding
guidelines](http://wiki.geneontology.org/index.php/Binding_Guidelines) on the GO wiki.

<a name="gorule0000003"/>

## DEPRECATED Annotations to 'binding ; GO:0005488' and 'protein binding ; GO:0005515' should be made with IPI and an interactor in the 'with' field

 * id: [GORULE:0000003](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000003.md)
 * status: deprecated


Replaced by GORULE:0000018 and GORULE:0000051.

Annotations to binding : GO:0005488 or protein binding ; GO:0005515 with
the TAS, NAS, IC, IMP, IGI and IDA evidence codes are not informative as
they do not allow the interacting partner to be specified. If the nature
of the binding partner is known (protein or DNA for example), an
appropriate child term of binding ; GO:0005488 should be chosen for the
annotation. In the case of chemicals, ChEBI IDs can go in the 'with'
column. Children of protein binding ; GO:0005515 where the type of
protein is identified in the GO term name do not need further
specification.

For more information, see the [binding
guidelines](http://wiki.geneontology.org/index.php/Binding_Guidelines)
on the GO wiki.

<a name="gorule0000004"/>

## Reciprocal annotations for 'protein binding ; GO:0005515'

 * id: [GORULE:0000004](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000004.md)
 * status: approved


When annotating to terms that are descendants of protein binding, and
when the curator can supply the accession of the interacting protein
accession, it is essential that reciprocal annotations are available -
i.e. if you say protein A binds protein B, then you need to also have
the second annotation that states that protein B binds protein A.

This will be a soft QC; a script will make these inferences and it is up
to each MOD to evaluate and include the inferences in their GAF/DB.

## Representation of binding in the GO

We use the term GO:0005515 and its children to represent instances of protein binding. If a gene G is annotated to this term, its function involves binding another protein. The partner protein is represented in the with/from field of the association, i.e. the 'evidence' is the partner protein. Annotation of gene G to a protein binding term requires that the partner protein also be annotated to a protein binding term, resulting in reciprocal protein binding annotations. Note that the specific protein binding term used for annotation does not have to be the same for each partner.

Note that this annotation rule predates the existence of annotation extensions (c16 in the GAF). It is more logical to specify the binding partner in c16, this would also allow cleaner separation of evidence from in-vivo activity, but for historic reasons the with/from field continues to be used.

This excludes 
GO:0042803 protein homodimerization activity
GO:0051260 protein homooligomerization
GO:0043621 protein self-association


## Application to Noctua models

Discussion is ongoing, refer to: https://github.com/geneontology/molecular_function_refactoring/issues/29

## See Also

For more information, see the [binding
guidelines](http://wiki.geneontology.org/index.php/Binding_Guidelines)
on the GO wiki.

<a name="gorule0000005"/>

## IEA, ISS, ISO, ISM, ISA, IBA, RCA annotations are not allowed for direct annotations to to 'protein binding ; GO:0005515 or GO:0005488 binding''

 * id: [GORULE:0000005](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000005.md)
 * status: implemented



This rule only applies to direct annotations to GO:0005515 and GO:0005488 (GAF column 5, GAPD column 4), 
Annotations to descendant terms such as mitogen-activated protein kinase p38 binding ; GO:0048273 are allowed, since the GO term name contains 
specific information describing the identity of the interactor.

The following evidence codes (GAF column 7, GPAD column 6) are not allowed: IEA, ISS, ISM, ISO, ISA, IBA.

If we take an example annotation:

gene product: protein A\
GO term: protein binding ; GO:0005515\
evidence: IPI\
reference: PMID:123456\
with/from: **with** protein A

this annotation line can be interpreted as: protein A was found to carry
out the 'protein binding' activity in PMID:12345, and that this function
was Inferred from the results of a Physicial Interaction (IPI) assay,
which involved protein X

However if we would like to transfer this annotation to protein A's
ortholog 'protein B', the ISS annotation that would be created would be:

gene product: protein B\
GO term: protein binding ; GO:0005515\
evidence: ISS\
reference: GO\_REF:curator\_judgement\
with/from: **with** protein A

This is interpreted as 'it is inferred that protein B carries out
protein binding activity due to its sequence similarity (curator
determined) with protein A, which was experimentally shown to carry out
'protein binding'.

Therefore the ISS annotation will not display the the interacting
protein X accession. Such an annotation display can be confusing, as the
value in the 'with' column just provides further information on why the
ISS/IPI or IGI annotation was created. This means that an ISS projection
from protein binding is not particularly useful as you are only really
telling the user that you think an homologous protein binds a protein,
based on overall sequence similarity.



For more information, see the [binding
guidelines](http://wiki.geneontology.org/index.php/Binding_Guidelines)
on the GO wiki.


<a name="gorule0000006"/>

## IEP and HEP usage is restricted to terms from the Biological Process ontology

 * id: [GORULE:0000006](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000006.md)
 * status: implemented


Annotations using the IEA evidence code (GAF column 7; GPAD column 6) must also have Aspect = P (GAF column 9; GPAD does not contain this information directly). 
The reason for this is that IEP and its high throughput equivalent, HEP, evidence codes are used where process involvement is inferred from
the timing or location of expression of a gene, particularly when comparing a gene that is not yet characterized with the timing or
location of expression of genes known to be involved in a particular process. This type of annotation is only suitable with terms from the
Biological Process ontology. For CC annotations that assess the localization of a gene product, IDA should be used. 


<a name="gorule0000007"/>

## IPI should not be used with GO:0003824 catalytic activity or descendents

 * id: [GORULE:0000007](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000007.md)
 * status: implemented


Evidence from a binary interaction ([IPI - Inferred from Physical Interaction evidence
code](http://www.geneontology.org/GO.evidence.shtml#ipi)) is considered too weak to support an annotation to catalytic activity ; GO:0003824 or children. 
These annotations are flagged and should be reviewed. 

<a name="gorule0000008"/>

## No annotations should be made to uninformative high level terms

 * id: [GORULE:0000008](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000008.md)
 * status: implemented


Some terms are too high-level to provide useful information when used
for annotation, regardless of the evidence code used.

We provide and maintain the list of too high-level terms as a subsets
in the ontology:

-   gocheck\_do\_not\_annotate "Term not to be used for direct
    annotation"

This subset denotes high level terms, not to be used for any manual
annotation.


Error report: <group>.report.md

<a name="gorule0000009"/>

## Annotation Intersection Alerts

 * id: [GORULE:0000009](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000009.md)
 * status: implemented


[Tools](http://github.com/geneontology/shared-annotation-check) and [rules](https://github.com/geneontology/shared-annotation-check/blob/master/rules.txt) for intersections/co-annotation checks in the Gene Ontology.

The report lives here http://snapshot.geneontology.org/reports/shared-annotation-check.html and is updated with each pipeline run.

<a name="gorule0000010"/>

## DEPRECATED - PubMed reference formatting must be correct

 * id: [GORULE:0000010](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000010.md)
 * status: deprecated


DEPRECATED: This has been subsumed by GORULE:0000027

References in the GAF (Column 6) should be of the format
db\_name:db\_key|PMID:12345678, e.g. SGD\_REF:S000047763|PMID:2676709.
No other format is acceptable for PubMed references; the following
examples are invalid:

-   PMID:PMID:14561399
-   PMID:unpublished
-   PMID:.
-   PMID:0

This is proposed as a HARD QC check: incorrectly formatted references
will be removed.

<a name="gorule0000011"/>

## ND evidence code should be to root nodes only, and no terms other than root nodes can have the evidence code ND

 * id: [GORULE:0000011](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000011.md)
 * status: implemented


The [No Data (ND) evidence code](http://www.geneontology.org/GO.evidence.shtml#nd) should be only used
for annotations to the root nodes: GO:0008150 biological_process, GO:0003674 molecular_function and GO:0005575 cellular_component. 

The root nodes: GO:0008150 biological_process, GO:0003674 molecular_function and GO:0005575 cellular_component can only be annotated with the [No Data (ND) evidence code](http://www.geneontology.org/GO.evidence.shtml#nd).  

Error report (number of errors) in [db_species]-report.html & owltools-check.txt (details).

<a name="gorule0000013"/>

## Taxon-appropriate annotation check

 * id: [GORULE:0000013](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000013.md)
 * status: implemented


- GO taxon constraints ensure that annotations are not made to inappropriate species or sets of species. 
This information is obtained from the only_in_taxon and never_in_taxon tags in the ontology (maintained in go-ontology/tree/master/src/taxon_constraints). 
- Experimental annotations (1) failing the taxon constraints are reported in the error reports but unchanged; non-experimental annotations (2) are filtered out of the pipeline products.
(1) EXP evidence codes: EXP, IDA, IEP, IGC, IGI, IMP, IPI, HDA, HEP, HGI, HMP, HTP.
(2) non EXP annotations: IBA, IKR, IRD, IC, ISA, ISM, ISO, ISS, NAS, RCA, TAS, IEA.
- Taxon constraints DO NOT apply to negated (`NOT` qualifier in GPAD/GAF) annotations.


### Implementation Notes

The current implementation of this in GO makes use of the Elk reasoner, wrapped by the [gaferencer](https://github.com/geneontology/gaferencer) tool. This tool produces a gaferences.json file (see [this example file](http://release.geneontology.org/2021-02-01/reports/mgi.gaferences.json)), which includes all OWL inferences over the GAF. A subset of these are taxon violations. 

An example:

```json
{
    "annotation":{
        "annotation":{
            "relation":"http://purl.obolibrary.org/obo/RO_0002331",
            "term":"http://purl.obolibrary.org/obo/GO_0098706"
        },
        "taxon":"http://purl.obolibrary.org/obo/NCBITaxon_10090",
        "extension":[
            
        ]
    },
    "inferences":[
        
    ],
    "satisfiable":false,
    "taxonProblem":true
}
```

This particular class is not valid for Mouse (NCBITaxon:10090)

The gaferences files is processed in the pipeline via ontobio and includes alongside other GO rules reports.

### Publications

See [http://www.biomedcentral.com/1471-2105/11/530](http://www.biomedcentral.com/1471-2105/11/530)
for more details.

<a name="gorule0000014"/>

## DEPRECATED. GO terms in annotations should not be obsolete.

 * id: [GORULE:0000014](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000014.md)
 * status: deprecated


DEPRECATED Replaced by GORULE:0000020.

<a name="gorule0000015"/>

## Dual species taxon check

 * id: [GORULE:0000015](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000015.md)
 * status: implemented


For background: dual (or multiple) species annotations are used to capture information about multi-species interactions. The first taxon ID should be that of the species encoding the gene product annotated, and the second (and further) IDs should be the taxon of the other species in the interaction. 

* Each value in the Taxon column (GAF column 13) should be unique. 

This rule applies to annotations to either these terms of their is_a descendants: 
* GO:0044419 biological process involved in interspecies interaction between organisms
* GO:0043903 regulation of interspecies interactions between organisms, or
* GO:0018995 host cellular component

* Annotations to other terms should have a single value in the Taxon column (GAF column 13).

<a name="gorule0000016"/>

## With/From: IC annotations require a With/From GO ID

 * id: [GORULE:0000016](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000016.md)
 * status: implemented


All IC annotations (GAF column 7; GPAD1.1 Column 6) should include a GO ID in the "With/From" column (GAF column 8; GPAD1.2 Column 7); that ID cannot be the same as the GO term annotated in GAF column 5 (GPAD1.2 column 4). For more information, see the [IC evidence code
guidelines](http://wiki.geneontology.org/index.php/Inferred_by_Curator_(IC)).

<a name="gorule0000017"/>

## IDA annotations must not have a With/From entry

 * id: [GORULE:0000017](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000017.md)
 * status: implemented


IDA annotations should not have data in the "With/From" column.
For binding annotations, when there is an appropriate ID for the "With/From" column, use IPI.

<a name="gorule0000018"/>

## IPI annotations require a With/From entry

 * id: [GORULE:0000018](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000018.md)
 * status: implemented


All IPI annotations should include a nucleotide/protein/chemical
identifier in the "With/From" column (column 8). From the [description
of IPI in the GO evidence code guide](http://wiki.geneontology.org/index.php/Inferred_from_Physical_Interaction_(IPI)):

Error report (number of errors) in [db_species]-report.html & owltools-check.txt (details).

<a name="gorule0000019"/>

## Generic Reasoner Validation Check

 * id: [GORULE:0000019](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000019.md)
 * status: implemented



The entire GAF is converted to OWL, combined with the main GO ontology
and auxhiliary constraint ontologies. The resulting ontology is checked
for consistency and unsatisfiable classes over using a complete DL
reasoner such as HermiT.

<a name="gorule0000020"/>

## Automatic repair of annotations to merged or obsoleted terms

 * id: [GORULE:0000020](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000020.md)
 * status: implemented


There should be no annotations to obsolete terms or to an alternate ID (Column 5 of GAF, Column 4 of GPAD). As well, GO terms present in annotations also should be repaired if possible: 
* with/from: Column 8 of GAF, Column 7 of GPAD
* extensions, Column 16 of GAF, Column 11 of GPAD 

Obsolete terms that have a `replaced_by` tag and terms annotated to one of their alternative IDs (merged terms; `alt_id` in the .obo files) will automatically be repaired to the valid term id.
If no replacement is found, the annotation will be filtered.



<a name="gorule0000021"/>

## DEPRECATED Check with/from for sequence similarity evidence for valid database ID

 * id: [GORULE:0000021](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000021.md)
 * status: deprecated


DEPRECATED For ISS and related evidence types, the With/From field should point to
a valid gene or gene product identifier that is annotated with a GO term
that is either identical to or a descendant of the main annotation.

Duplicate of GORULE:0000038

<a name="gorule0000022"/>

## Check for, and filter, annotations made to retracted publications

 * id: [GORULE:0000022](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000022.md)
 * status: implemented


GO should not include annotations to retracted publications (GAF column 6, GPAD column 5). 

PubMed keeps record of retracted publications in the PublicationTypeList of
each paper's XML entry. GOC manually download the data from [Europe PMC](https://europepmc.org/betaSearch?query=%28PUB_TYPE%3A%22Retracted%20Publication%22%29&page=1)
and save it on the [go-site/metadata folder](https://github.com/geneontology/go-site/blob/master/metadata/retracted-publications.txt).


<a name="gorule0000023"/>

## Materialize annotations for inter-branch links in the GO

 * id: [GORULE:0000023](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000023.md)
 * status: proposed



Annotations will be propagated from MF to BP over part_of, or from BP to CC over occurs_in.

## Background

Historically GO treated MF, BP and CC as distinct ontologies. They are now better regarded as branchers or sub-hierarchies within a single ontology, cross-linked via a variety of relations. Annotators used to make manual duplicate annotations.

## Procedure

 * Any asserted or inferred annotation to MF (excluding annotations with a NOT qualifier), where MF part-of BP, will generate an involved-in to that BP
 * Any asserted or inferred annotation to BP (excluding annotations with a NOT qualifier), where BP occurs-in CC, will generate a part-of annotation to that CC

### Evidence and provenance

 * Evidence, references, publications, date are retained
 * Assigned_by is GOC

## TBD

Should this pipeline filter annotations based on some redundancy criteria?

<a name="gorule0000024"/>

## Prevent propagation of certain terms by orthology

 * id: [GORULE:0000024](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000024.md)
 * status: proposed


Prevent propagation of certain terms by orthology/similarity. This rule is under discussion

<a name="gorule0000025"/>

## Creating more specific annotations by reasoning over extensions

 * id: [GORULE:0000025](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000025.md)
 * status: proposed



Given an annotation to a general term plus annotation extensions we can infer a more specific annotation.

For example, given a source annotation:

```
Gene = geneA
Annotation_class = GO:0006260 ! DNA replication
Annotation_extension = {occurs_in GO:0000262 ! mitochondrial chromosome}
```

This will be inferred:

```
Gene = geneA
Annotation_class = GO:0006264 ! mitochondrial DNA replication
Annotation_extension = {occurs_in GO:0000262 ! mitochondrial chromosome}
Evidence: IC
With: GO:0006260
```

Approach is described in more detail here: https://github.com/owlcollab/owltools/wiki/Annotation-Extension-Folding

Fields:

 * GO ID: new inferred, more specific GO ID
 * Evidence: IC
 * With: original GO ID
 * Assigned-by: GOC-OWL
 
Other fields remain the same

<a name="gorule0000026"/>

## IBA annotations must have been sourced from the PAINT inference pipeline

 * id: [GORULE:0000026](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000026.md)
 * status: implemented


This seeks to filter out paint annotations that have leaked into the main mod GAF
sources. In this way, we only have these paint annotations coming directly from
paint.

If the GAF file being validated is not paint, and the line has evidence IBA,
then throw out that line.

See also GORULE:0000037

<a name="gorule0000027"/>

## Each identifier in GAF is valid

 * id: [GORULE:0000027](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000027.md)
 * status: implemented


-   DB (GAF and GPAD column 1); and all DB abbreviations in 'with' field (GAF column 8; GPAD column 7) and in the annotation extensions (GAF column 16; GPAD column 11) must be in [db-xrefs.yaml](https://github.com/geneontology/go-site/blob/master/metadata/db-xrefs.yaml) (see below)
-   id_syntax information in the [db-xrefs.yaml](https://github.com/geneontology/go-site/blob/master/metadata/db-xrefs.yaml) file can be used to validate local identifiers.
-   The 'with' field can either contain GO terms, when the Evidence code is IC. GO terms are checked in GORULE:0000001, or DB:ID, which are checked as Columns 1 & 2.
-   The `assigned_by` field (GAF column 15; GPAD column 10) is checked against [groups.yaml](https://github.com/geneontology/go-site/blob/master/metadata/groups.yaml)
-   The 'extension' field (GAF column 16; GPAD column 11) can either contain GO terms, or DB:ID, which are checked as Columns 1 & 2.
-   TBC (this may be GORULE:0000001) All GO IDs must be extant in current ontology: GO IDs can be present in Columns 5, 8, and 16 of GAF (4, 7, 11 in GPAD).
  
### Additional notes on identifiers

In GAF and GPAD, the identifier is represented using two fields, column 1 is the prefex (DB), and column 2 is the local identifier. 
The global id is formed by concatenating these with `:`.
In all other fields, such as the "With/from" field, the reference, the extensions, a global ID is specified, which MUST always be prefixed; 
i. e. contain a namespace and an identifier, separated by a colon.

In all cases, the prefix MUST be in [db-xrefs.yaml](https://github.com/geneontology/go-site/blob/master/metadata/db-xrefs.yaml).
The prefix SHOULD be identical (case-sensitive match) to the `database` field.

When consuming GAF files, programs SHOULD *repair* by replacing prefix synonyms with the canonical form, in addition to reporting on the mismatch. For example, as part of the association file release the submitted files should swap out legacy uses of 'UniProt' with 'UniProtKB'.

### Reference formatting must be correct
References in the GAF (Column 6) should be of the format db_name:db_key. Multiple values can be pipe-separated, 
e.g. SGD_REF:S000047763|PMID:2676709. PMID, DOIs, Agricola, GO_REF and internal MOD references are allowed. 

<a name="gorule0000028"/>

## GO aspect should match the term's namespace; otherwise it is repaired to the appropriate aspect

 * id: [GORULE:0000028](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000028.md)
 * status: implemented


The GO aspect (GAF column 9) should correspond to the namespace of the GO term (GAF column 5). 
The value in this column must be on of: C, P, or F, corresponding to the three GO aspects, 
Cellular Component (C), Biological Process (P), and Molecular Function (F). 
If the Aspect is incorrect, the value is repaired. 
Note that this rule does not apply to GPAD files, since the GO aspect is not part of the GPAD file.

<a name="gorule0000029"/>

## IEAs should be less than one year old.

 * id: [GORULE:0000029](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000029.md)
 * status: implemented


All IEA annotations with a date more than three years old should be filered.
IEAs between 1 and 3 years old trigger a WARNING.
IEAs less than one year old are valid. 


<a name="gorule0000030"/>

## Obsolete GO_REFs are not allowed

 * id: [GORULE:0000030](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000030.md)
 * status: implemented


GO_REFs are here: https://github.com/geneontology/go-site/tree/master/metadata/gorefs.yaml
References for which is_obsolete: `true` should not be allowed as a reference (GAF column 6; GPAD column 5).

<a name="gorule0000031"/>

## DEPRECATED. Annotation relations are replaced when not provided by source

 * id: [GORULE:0000031](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000031.md)
 * status: deprecated


In GAFs, relation is overloaded into qualifier.
If no explicit non-NOT qualifier is specified, use a default based on GPI specifications:
For Cellular Component: relation = 'part_of'
For Biological Process: relation = 'involved_in'
For Molecular Function: relation = 'enables'

##This seems to be only exported in GPAD for now.

##Now covered by GORULE-0000059 and GORULE-0000061. This was not being reported in rule reports as og 2024-07.

<a name="gorule0000032"/>

## DEPRECATED Allowed References for each ECO.

 * id: [GORULE:0000032](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000032.md)
 * status: deprecated


DEPRECATED. See GORULE:0000043

<a name="gorule0000033"/>

## DEPRECATED. Public Reference IDs (PMID, PMC, doi, or GO_REF) should be preferred over group specific Reference IDs

 * id: [GORULE:0000033](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000033.md)
 * status: deprecated



# DEPRECATED

References for an annotation should prefer sources from PMID, PMC, doi, or GO_REF over group specific references. 

Group references that are part of an "external accession" in a GO_REF will be replaced by the GO_REF. 

For example, `FB:FBrf0159398` is an external accession for `GO_REF:0000015`, so the FB ID will be repaired to the GO_REF.
If the group reference is the only one present, it will be reported as a warning, but not removed. 

Already existing References from PMID, PMC, doi, or GO_REF will not be reported on as these are all correct.

The list of GO_REFs are here: https://github.com/geneontology/go-site/tree/master/metadata/gorefs.yaml.

<a name="gorule0000035"/>

## DEPRECATED - Colocalizes_with' qualifier not allowed with protein-containing complex (GO:0032991)' and children.

 * id: [GORULE:0000035](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000035.md)
 * status: deprecated


Replaced by GORULE:0000059 and GORULE:0000061.

<a name="gorule0000036"/>

## Report annotations that involve gene products where the gene product is annotated to a term 'x' and 'regulation of X' (multiple annotations involved)

 * id: [GORULE:0000036](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000036.md)
 * status: proposed



Few proteins are part of a process as well as regulate that process. We need to review the list of proteins having annotations to a term x and to regulation of that term. This report would look globally at all annotations from any source and look for co-annotation of a term 'x' and its regulation ('regulation of X').
As a second step we may create exception lists for cases known to be correct. 

<a name="gorule0000037"/>

## IBA annotations should ONLY be assigned_by GO_Central and have GO_REF:0000033 as a reference

 * id: [GORULE:0000037](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000037.md)
 * status: implemented



For annotations with the IBA evidence code, (1) the 'assigned_by' field (GAF column 15; GPAD column 10) must be GO_Central and (2) the 'reference' field (GAF column 6; GPAD column 5) must be GO_REF:0000033.

Implementation: the GO Central pipeline filters out IBAs from any submission source that is not in the PAINT submission source, i.e. one registered in [paint.yaml](https://github.com/geneontology/go-site/blob/master/metadata/datasets/paint.yaml). IBAs from PAINT are injected in to the final release files as part of the release process.

See also GORULE:0000026.

<a name="gorule0000038"/>

## Annotations using ISS/ISA/ISO evidence should refer to a gene product (in the 'with' column) where there exists another annotation with the same or a more granular term using experimental evidence

 * id: [GORULE:0000038](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000038.md)
 * status: proposed


For annotations by ISO, ISA or ISS, the annotations of the gene product (col 8 info in the GAF) should be checked to ensure that an annotation exists to the same or a more granular term. For instance:

Gene Product 1 | GO:1233456 |  ISS/ISO/ISA | with: Gene Product 2
Gene Product 2 | GO:1233456 (or a descendant) | EXP (or a descendant)

Allowed evidence codes for the primary annotations: EXP, IMP, IDA, IPI, IEP, IGI, HTP, HMP, HDA, HEP, HGI.

<a name="gorule0000039"/>

## Protein complexes can not be annotated to GO:0032991 (protein-containing complex) or its descendants

 * id: [GORULE:0000039](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000039.md)
 * status: implemented



Annotations to GO:0032991 (protein-containing complex) or its descendants cannot refer to an identifer from ComplexPortal (Column 1). Example identifier:ComplexPortal:CPX-2158. 

<a name="gorule0000042"/>

## Qualifier: IKR evidence code requires a NOT qualifier

 * id: [GORULE:0000042](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000042.md)
 * status: implemented


IKR evidence code requires a NOT qualifier. 

<a name="gorule0000043"/>

## Check for valid combination of evidence code and GO_REF

 * id: [GORULE:0000043](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000043.md)
 * status: approved



Specific allowed combinations: 
- ND (ECO:0000307): GO_REF:0000015
- ISS (ECO:0000250): GO_REF:0000024
- ISA (ECO:0000247): GO_REF:0000030, GO_REF:0000113
- ISM (ECO:0000255): GO_REF:0000030, GO_REF:0000050
- ISO (ECO:0000266): GO_REF:0000024
- IC (ECO:0000305): GO_REF:0000036, GO_REF:0000057, GO_REF:0000111
- IKR (ECO:0000320): GO_REF:0000047
- IDA (ECO:0000314): GO_REF:0000052, GO_REF:0000054
This list may not be exhaustive.

Implemented by GOA, check occurs in the GOA phase of the GOC-GOA pipeline. 
TODO: include above list in appropriate metadata file.
see http://wiki.geneontology.org/index.php/Evidence_Code_Ontology_(ECO)

See also http://wiki.geneontology.org/index.php/Mappings_of_GO_Evidence_Code_%2B_GOREF_combinations_to_ECO


<a name="gorule0000044"/>

## DEPRECATED - Reference: check for invalid use of GO_REF:0000057 can only be used with terms that are descendants of GO:0006915 (apoptotic process)

 * id: [GORULE:0000044](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000044.md)
 * status: deprecated



Reference: check for invalid use of GO_REF:0000057 can only be used with terms that are descendants of GO:0006915 (apoptotic process).

<a name="gorule0000045"/>

## With/from: Verify that the combination of evidence (ECO) codes conform to the rules in eco-usage-constraints.yaml

 * id: [GORULE:0000045](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000045.md)
 * status: deprecated


With/from: Verify that the combination of evidence (ECO) codes conform to the rules in eco-usage-constraints.yaml
Redundant with GORULE-0000043.

<a name="gorule0000046"/>

## The ‘with’ field (GAF column 8) must be the same as the gene product (GAF column 2) when annotating to ‘self-binding’ terms.

 * id: [GORULE:0000046](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000046.md)
 * status: implemented



Annotations representing self-binding mean that the gene product annotated interacts with itself. Therefore, the entity in the 'with/from' column (colomn 8) should be the same as the gene product (column 2). 

Self-binding terms include GO:0042803 protein homodimerization activity, GO:0051260 protein homooligomerization, 
GO:0051289 protein homotetramerization, GO:0070207 protein homotrimerization, GO:0043621 protein self-association, and GO:0032840 intramolecular proline-rich ligand binding (and their 'is_a' descendants). 




<a name="gorule0000047"/>

## With/from: ChEBI IDs in With/from can only be used with terms that are descendants of GO:0005488 (binding)

 * id: [GORULE:0000047](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000047.md)
 * status: proposed



Annotations using a ChEBI ID in the with/from (col 8 of GAF) column should only be annotated with GO terms that are descendants of GO:0005488 (binding) (Col 5 of GAF)"

<a name="gorule0000048"/>

## DEPRECATED Gene products having ND annotations and other annotations in the same aspect should be reviewed

 * id: [GORULE:0000048](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000048.md)
 * status: deprecated



DEPRECATED; redundant with GORULE:0000054
If a gene product has an annotation by the ND evidence code, this rule checks whether any manual annotations in the same GO aspect exists for this gene product.

<a name="gorule0000049"/>

## If the annotation has 'contributes_to' as its qualifier, verify that at least one annotation to GO:0043234 (protein complex), or one of its child terms exists

 * id: [GORULE:0000049](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000049.md)
 * status: approved


Implemented in P2GO.
The 'contributes to' qualifier can only be applied to proteins belonging to complexes, so any gene product with a MF annotation using the 'contributes to' should also be annotated to a child of protein complex. 

<a name="gorule0000050"/>

## Annotations to ISS, ISA and ISO should not be self-referential

 * id: [GORULE:0000050](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000050.md)
 * status: implemented



Annotations to ISS, ISA and ISO should not have the same identifier in the 'gene product column' (column 2) and in the 'with/from' column (column 8).

<a name="gorule0000051"/>

## Some GO terms require a value in the Annotation Extension field

 * id: [GORULE:0000051](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000051.md)
 * status: proposed


Direct annotations to these terms require a value in the Annotation Extension field: 

 * 'GO:0005515 protein binding' 
 * 'GO:0005488 binding'

For more information, see the [binding guidelines](http://wiki.geneontology.org/index.php/Binding_Guidelines)
on the GO wiki.

This rule may be expanded in the future to include other terms such as 'GO:0008283 cell population proliferation'.

<a name="gorule0000053"/>

## 'NOT' annotation should not have extension

 * id: [GORULE:0000053](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000053.md)
 * status: approved


Implemented in P2GO.

<a name="gorule0000054"/>

## Genes annotated with ND should have no other annotations for that aspect

 * id: [GORULE:0000054](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000054.md)
 * status: approved


Use of the ND evidence code specifically indicates that a curator has looked but not been able to find information that supports making an annotation to any term from the Molecular Function, Biological Process, or Cellular Component as of the annotation date indicated.

Note that use of the ND evidence code with an annotation to one of the root nodes to indicate lack of knowledge in that aspect makes a statement about the lack of knowledge only with respect to that particular aspect of the ontology. Use of the ND evidence code to indicate lack of knowledge in one particular aspect does not make any statement about the availability of knowledge or evidence in the other GO aspects.

<a name="gorule0000055"/>

## References should have only one ID per ID space

 * id: [GORULE:0000055](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000055.md)
 * status: implemented


Since references should only refer to single publications, multiple IDs indicate
alternate IDs for the same publication. So different reference IDs should be in
different ID spaces. More than one ID in the same space implies distinct publications
are being referenced, which is not allowed.

<a name="gorule0000056"/>

## Annotations should validate against GO shape expressions

 * id: [GORULE:0000056](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000056.md)
 * status: proposed


Annotation data can be checked using Shex Shapes as GO-CAM models. GO has a collection of shape
expressions that are used for this purpose at https://github.com/geneontology/go-shapes/tree/master/shapes.

Annotations as GO-CAMs should successfully validate against this set of Shex Shapes.

<a name="gorule0000057"/>

## Group specific filter rules should be applied to annotations

 * id: [GORULE:0000057](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000057.md)
 * status: deprecated


For the MOD Imports Project into Noctua, it was proposed that group-specific annotation filter rules would be expressed in the datasets group YAML files in go-site/metadata/datasets/. This was done differently, so this rule was not needed.

<a name="gorule0000058"/>

## Object extensions should conform to the extensions-patterns.yaml file in metadata

 * id: [GORULE:0000058](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000058.md)
 * status: implemented


Rules are in the `extensions-constraints.yaml` file (https://github.com/geneontology/go-site/blob/master/metadata/extensions-constraints.yaml). This is
a list of allowed extension Relation, Filler (the ID inside the parentheses), and
the acceptable GO Term roots used with this relation. A cardinality constraint may also be
applied.

Extensions in annotations should conform to these constraints. If an element of a 
disjunction in the extensions does not follow one of the constraints as listed in
the above file, that element is dropped from the extensions with a warning, and the remaining annotation is kept.

Note that in the GO Central pipeline, this is only implmented upon imports of external annotations into Noctua.

<a name="gorule0000059"/>

## GAF Version 2.0 and 2.1 are converted into GAF Version 2.2

 * id: [GORULE:0000059](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000059.md)
 * status: implemented


In GAF2.2, a gp2term relation (column 4; see https://wiki.geneontology.org/Annotation_Relations#Gene_Product_to_GO_term_Relations_(%22qualifiers%22)) is mandatory for every annotation.
This rule processes older versions of GAF files to provide basic compatibility with the current GAF2.2 format. To convert a GAF Version 2.0 or 2.1 file to a GAF Version 2.2, gp2term relations are assigned as follows: 

For annotations that already have a gp2term relation: 
* If an annotation has a `RO_0002326 "contributes_to"` or `RO_0002325 "colocalizes_with"` gp2term relation, it is kept. 
* If both a negation (`NOT`) and a gp2term relation (`contributes_to` or `colocalizes_with`) are present, both are kept, pipe-separated. 
* If an annotation only has a negation (`NOT`), it is kept as a pipe-separated value with the gp2term relation. 

For annotations that don't have a gp2term relation: 
* For `GO:0005554 molecular function` and is_a subclass descendants: 
    * The relation is `RO:0002327 "enables"`. 
* For `GO:0008150 biological process`:
    * If the annotation is to the root term `biological process`, then the relation is `RO:0002331 "involved_in"`.
    * If the annotation is to is a is_a subclass descendant of `GO:0008150 biological process` then the relation is `RO:0002264 "acts upstream or within"`.
* For `GO:0008372 cellular component` 
    * If the annotation is to the root term `cellular_component`, then the relation is `RO:0002432 "is_active_in"`.
    * If the annotation is to `"GO:0032991 "protein-containing complex"` or a is_a subclass descendant of, then the relation is `"BFO:0000050 "part of"`
    * Else, the relation is `RO:0001025 "located in"`.

<a name="gorule0000061"/>

## Allowed gene product to term relations (gp2term)

 * id: [GORULE:0000061](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000061.md)
 * status: implemented



GAF2.2 files require a gene product to term (gp2term) relation in Column 4. Allowed gp2term relations:  
* For `GO:0003674 "molecular_function"` and subclass descendants:
    * If the annotation is to the root term `"molecular_function"`, then the gp2term relation should `RO:0002327 "enables"`; else, it is repaired to `RO:0002327 "enables"`.
    * If the annotation is to is a subclass descendant of `"molecular_function"`, then the allowed gp2term relations are `RO:0002327 "enables"` and `RO_0002326 "contributes_to"`; else, it is updated to `RO:0002327 "enables"`.
* For `GO:0008150 "biological process"`: 
    * If the annotation is to the root term `"biological_process"`, then the gp2term relation should be `RO:0002331 "involved_in"`. If the gp2term relation is different, it is repaired to `RO:0002331 "involved_in"`.
    * If the annotation is to is a subclass descendant of `"biological_process"` then the allowed gp2term relations are `RO:0002331 "involved_in"`, `RO:0002264 "acts_upstream_or_within"`, `RO:0004032 "acts_upstream_of_or_within_positive_effect"`, `RO:0004033 "acts upstream of or within_negative_effect"`, `RO:0002263 "acts_upstream_of"`, `RO:0004034 "acts_upstream_of_positive_effect"`, `RO:0004035 "acts upstream of, negative effect"`; else, the relation is repaired to `RO:0002264 "acts upstream of or within"`.
* For `GO:0005575 "cellular component"`
    * If the annotation is to the root term `"cellular_component"`, then the gp2term relation should be `RO:0002432 "is_active_in"`; else, it is repaired to `RO:0002432 "is_active_in"`.
    * If the annotation is to `"GO:0032991 "protein-containing complex"` or a subclass descendant of, then the gp2term relation should be `"BFO:0000050 "part_of"`; else, it is repaired to `"BFO:0000050 "part of"`.
    * If the annotation is to `GO:0110165 "cellular anatomical entity"` or to `GO:0044423 "virion component"` or a descendant of either of these terms, then the allowed gp2term relations are `RO:0001025 "located_in"` and `RO:0002432 "is_active_in"`, and `RO_0002325 "colocalizes_with"`; else it is repaired to `RO:0001025 "located_in"`.
    
* If an annotation has a negation (`NOT`), is is kept as a pipe-separated value with the gp2term relation.
* Note that RO does not have underscores in the term labels, but the userscores are used in the GP2Term relations in GAF 2.2.

<a name="gorule0000062"/>

## Infer annotations on molecular function via has_part

 * id: [GORULE:0000062](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000062.md)
 * status: approved


For any annotation to a molecular function MF-X, infer annotation to all MFs that stand in a has_part relationship to MF-X, except if the annotation uses the 'contributes_to' qualifier, then do not infer annotations from the has_part relationship to MF-X.

<a name="gorule0000063"/>

## Annotations using ISS/ISA/ISO evidence should refer to a gene product (in the 'with' column)

 * id: [GORULE:0000063](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000063.md)
 * status: implemented


If evidence (GAF column 7; GPAD column 6) is one of ISS, ISA, ISO, then there must be a value in the 'with/from' field (GAF column 8; GPAD column 7). 
See also GO-RULE:0000038 (proposed) for a check of the values in the 'with' field. 
Noting that ISM is not covered by this rule yet.

Exception: (not yet implemented at GO Central): objects of type 'ncRNA' (SO:0001263 and children) using ISM as evidence do not need data in the 'with' field.

<a name="gorule0000064"/>

## TreeGrafter IEAs should be filtered for GO reference species

 * id: [GORULE:0000064](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000064.md)
 * status: implemented



If an annotation has GO_REF:0000118 (GAF column 6, GPAD column 5) and the taxon (GAF column 13, GPI column 7) is present in the GO reference species list (i.e 143 Panther species; [go-reference-species.yaml](https://github.com/geneontology/go-site/blob/master/metadata/go-reference-species.yaml)), then the annotation should be filter out. Note that this is not a line-by-line check in GPAD since it required both the GPAD and the GPI files.

<a name="gorule0000065"/>

## Annotations to term that are candidates for obsoletion should be produce a warning

 * id: [GORULE:0000065](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000065.md)
 * status: implemented


Terms scheduled for obsoletion are identified by the subset gocheck_obsoletion_candidate. 
New annotations should not be made to these terms, and existing annotations should be removed or replaced.

Error report: <group>.report.md
