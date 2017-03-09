 * <a href="#gorule0000001">GORULE:0000001 Basic GAF checks</a>
 * <a href="#gorule0000002">GORULE:0000002 No 'NOT' annotations to 'protein binding ; GO:0005515'</a>
 * <a href="#gorule0000003">GORULE:0000003 Annotations to 'binding ; GO:0005488' and 'protein binding ; GO:0005515' should be made with IPI and an interactor in the 'with' field</a>
 * <a href="#gorule0000004">GORULE:0000004 Reciprocal annotations for 'protein binding ; GO:0005515'</a>
 * <a href="#gorule0000005">GORULE:0000005 No ISS or ISS-related annotations to 'protein binding ; GO:0005515'</a>
 * <a href="#gorule0000006">GORULE:0000006 IEP usage is restricted to terms from the Biological Process ontology</a>
 * <a href="#gorule0000007">GORULE:0000007 IPI should not be used with catalytic activity molecular function terms</a>
 * <a href="#gorule0000008">GORULE:0000008 No annotations should be made to uninformative high level terms</a>
 * <a href="#gorule0000009">GORULE:0000009 Annotation Intersection Alerts</a>
 * <a href="#gorule0000010">GORULE:0000010 PubMed reference formatting must be correct</a>
 * <a href="#gorule0000011">GORULE:0000011 ND annotations to root nodes only</a>
 * <a href="#gorule0000013">GORULE:0000013 Taxon-appropriate annotation check</a>
 * <a href="#gorule0000014">GORULE:0000014 Valid GO term ID</a>
 * <a href="#gorule0000015">GORULE:0000015 Dual species taxon check</a>
 * <a href="#gorule0000016">GORULE:0000016 IC annotations require a With/From GO ID</a>
 * <a href="#gorule0000017">GORULE:0000017 IDA annotations must not have a With/From entry</a>
 * <a href="#gorule0000018">GORULE:0000018 IPI annotations require a With/From entry</a>
 * <a href="#gorule0000019">GORULE:0000019 Generic Reasoner Validation Check</a>
 * <a href="#gorule0000020">GORULE:0000020 Automatic repair of annotations to merged or obsoleted terms</a>
 * <a href="#gorule0000021">GORULE:0000021 Check with/from for sequence similarity evidence for valid database ID</a>
 * <a href="#gorule0000022">GORULE:0000022 Check for, and filter, annotations made to retracted publications</a>



<a name="gorule0000001"/>
## Basic GAF checks

 * id: [GORULE:0000001](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000001.md)
 * status: Implemented


The following basic checks ensure that submitted gene association files
conform to the GAF spec, and come from the original GAF check script.

-   Each line of the GAF file is checked for the correct number of
    columns, the cardinality of the columns, leading or trailing
    whitespace
-   Col 1 and all DB abbreviations must be in
    [GO.xrf\_abbs](http://www.geneontology.org/cgi-bin/xrefs.cgi) (case
    may be incorrect)
-   All GO IDs must be extant in current ontology
-   Qualifier, evidence, aspect and DB object columns must be within the
    list of allowed values
-   DB:Reference, Taxon and GO ID columns are checked for minimal form
-   Date must be in YYYYMMDD format
-   All IEAs over a year old are removed
-   Taxa with a 'representative' group (e.g. MGI for Mus musculus,
    FlyBase for Drosophila) must be submitted by that group only


<a name="gorule0000002"/>
## No 'NOT' annotations to 'protein binding ; GO:0005515'

 * id: [GORULE:0000002](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000002.md)
 * status: Implemented


Even if an identifier is available in the 'with' column, a qualifier
only informs on the GO term, it cannot instruct users to restrict the
annotation to just the protein identified in the 'with', therefore an
annotation applying protein binding ; GO:0005515 with the not qualifier
implies that the annotated protein cannot bind anything.

This is such a wide-reaching statement that few curators would want to
make.

This rule *only* applies to GO:0005515; children of this term can be
qualified with not, as further information on the type of binding is
then supplied in the GO term; e.g. not + NFAT4 protein binding ;
GO:0051529 would be fine, as the negative binding statement only applies
to the NFAT4 protein.

For more information, see the [binding
guidelines](http://wiki.geneontology.org/index.php/Binding_Guidelines)
on the GO wiki.

<a name="gorule0000003"/>
## Annotations to 'binding ; GO:0005488' and 'protein binding ; GO:0005515' should be made with IPI and an interactor in the 'with' field

 * id: [GORULE:0000003](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000003.md)
 * status: Implemented


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
 * status: Approved


When annotating to terms that are descendants of protein binding, and
when the curator can supply the accession of the interacting protein
accession, it is essential that reciprocal annotations are available -
i.e. if you say protein A binds protein B, then you need to also have
the second annotation that states that protein B binds protein A.

This will be a soft QC; a script will make these inferences and it is up
to each MOD to evaluate and include the inferences in their GAF/DB.

For more information, see the [binding
guidelines](http://wiki.geneontology.org/index.php/Binding_Guidelines)
on the GO wiki.

<a name="gorule0000005"/>
## No ISS or ISS-related annotations to 'protein binding ; GO:0005515'

 * id: [GORULE:0000005](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000005.md)
 * status: Approved


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

This rule only applies to GO:0005515, as descendant terms such as
mitogen-activated protein kinase p38 binding ; GO:0048273 used as ISS
annotations are informative as the GO term name contains far more
specific information as to the identity of the interactor.

For more information, see the [binding
guidelines](http://wiki.geneontology.org/index.php/Binding_Guidelines)
on the GO wiki.

<a name="gorule0000006"/>
## IEP usage is restricted to terms from the Biological Process ontology

 * id: [GORULE:0000006](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000006.md)
 * status: Implemented


The IEP evidence code is used where process involvement is inferred from
the timing or location of expression of a gene, particularly when
comparing a gene that is not yet characterized with the timing or
location of expression of genes known to be involved in a particular
process. This type of annotation is only suitable with terms from the
Biological Process ontology.

For more information, see the [binding
guidelines](http://wiki.geneontology.org/index.php/Binding_Guidelines)
on the GO wiki.

<a name="gorule0000007"/>
## IPI should not be used with catalytic activity molecular function terms

 * id: [GORULE:0000007](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000007.md)
 * status: Proposed


The [IPI (Inferred from Physical Interaction) evidence
code](http://www.geneontology.org/GO.evidence.shtml#ipi) is used where
an annotation can be supported from interaction evidence between the
gene product of interest and another molecule (see the [evidence code
documentation](http://www.geneontology.org/GO.evidence.shtml#ipi)).
While the IPI evidence code is frequently used to support annotations to
terms that are children of binding ; GO:0005488, it is thought unlikely
by the Binding working group that enough information can be obtained
from a binding interaction to support an annotation to a term that is a
chid of catalytic activity ; GO:0003824. Such IPI annotations to child
terms of catalytic activity ; GO:0003824 may need to be revisited and
corrected.

For more information, see the [catalytic activity annotation
guide](http://wiki.geneontology.org/index.php/Annotations_to_Catalytic_activity_with_IPI)
on the GO wiki.

<a name="gorule0000008"/>
## No annotations should be made to uninformative high level terms

 * id: [GORULE:0000008](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000008.md)
 * status: Proposed


Some terms are too high-level to provide useful information when used
for annotation, regardless of the evidence code used.

We provide and maintain the list of too high-level terms as two subsets
in the ontology:

-   gocheck\_do\_not\_annotate "Term not to be used for direct
    annotation"
-   gocheck\_do\_not\_manually\_annotate "Term not to be used for direct
    manual annotation"

Both subsets denote high level terms, not to be used for any manual
annotation.

For inferred electronic annotations (IEAs), we allow the use of terms
from the gocheck\_do\_not\_manually\_annotate subset. These terms may
still offer some general information, but a human curator should always
be able to find a more specific annotation.

<a name="gorule0000009"/>
## Annotation Intersection Alerts

 * id: [GORULE:0000009](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000009.md)
 * status: Proposed


To be added

<a name="gorule0000010"/>
## PubMed reference formatting must be correct

 * id: [GORULE:0000010](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000010.md)
 * status: Proposed


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
## ND annotations to root nodes only

 * id: [GORULE:0000011](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000011.md)
 * status: Proposed


The [No Data (ND) evidence
code](http://www.geneontology.org/GO.evidence.shtml#nd) should be used
for annotations to the root nodes only and should be accompanied with
[GO\_REF:0000015](http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000015)
or an internal reference. PMIDs **cannot** be used for annotations made
with ND.

-   if you are using an internal reference, that reference ID should be
    listed as an external accession for
    [GO\_REF:0000015](http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000015).
    Please add (or email) your internal reference ID for
    GO\_REF:0000015.
-   All ND annotations made with a reference other than GO\_REF:0000015
    (or an equivalent internal reference that is listed as external
    accession for GO\_REF:0000015) should be filtered out of the GAF.

The SQL code identifies all ND annotations that do not use
GO\_REF:0000015 or one of the alternative internal references listed for
it in the [GO references
file](http://www.geneontology.org/cgi-bin/references.cgi).

<a name="gorule0000013"/>
## Taxon-appropriate annotation check

 * id: [GORULE:0000013](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000013.md)
 * status: Proposed


GO taxon constraints ensure that annotations are not made to
inappropriate species or sets of species. See
[http://www.biomedcentral.com/1471-2105/11/530](http://www.biomedcentral.com/1471-2105/11/530)
for more details.

<a name="gorule0000014"/>
## Valid GO term ID

 * id: [GORULE:0000014](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000014.md)
 * status: Proposed


This check ensures that the GO IDs used for annotations are valid IDs
and are not obsolete.

<a name="gorule0000015"/>
## Dual species taxon check

 * id: [GORULE:0000015](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000015.md)
 * status: Proposed


Dual species annotations are used to capture information about
multi-organism interactions. The first taxon ID should be that of the
species encoding the gene product, and the second should be the taxon of
the other species in the interaction. Where the interaction is between
organisms of the same species, both taxon IDs should be the same. These
annotations should be used only in conjunction with terms that have the
biological process term 'GO:0051704 : multi-organism process' or the
cellular component term 'GO:0044215 : other organism' as an ancestor.

<a name="gorule0000016"/>
## IC annotations require a With/From GO ID

 * id: [GORULE:0000016](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000016.md)
 * status: Approved


All IC annotations should include a GO ID in the "With/From" column; for
more information, see the [IC evidence code
guidelines](http://www.geneontology.org/GO.evidence.shtml#ic).

<a name="gorule0000017"/>
## IDA annotations must not have a With/From entry

 * id: [GORULE:0000017](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000017.md)
 * status: Approved


Use IDA only when no identifier can be placed in the "With/From" column.
When there is an appropriate ID for the "With/From" column, use IPI.

<a name="gorule0000018"/>
## IPI annotations require a With/From entry

 * id: [GORULE:0000018](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000018.md)
 * status: Approved


All IPI annotations should include a nucleotide/protein/chemical
identifier in the "With/From" column (column 8). From the [description
of IPI in the GO evidence code
guide](http://www.geneontology.org/GO.evidence.shtml#ipi): "We strongly
recommend making an entry in the with/from column when using this
evidence code to include an identifier for the other protein or other
macromolecule or other chemical involved in the interaction. When
multiple entries are placed in the with/from field, they are separated
by pipes. Consider using IDA when no identifier can be entered in the
with/from column." All annotations made after January 1 2012 that break
this rule will be removed.

<a name="gorule0000019"/>
## Generic Reasoner Validation Check

 * id: [GORULE:0000019](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000019.md)
 * status: Implemented


The entire GAF is converted to OWL, combined with the main GO ontology
and auxhiliary constraint ontologies. The resulting ontology is checked
for consistency and unsatisfiable classes over using a complete DL
reasoner such as HermiT.

<a name="gorule0000020"/>
## Automatic repair of annotations to merged or obsoleted terms

 * id: [GORULE:0000020](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000020.md)
 * status: Approved


Ontology operations such as term merges and obsoletions may be out of
sync with annotation releases. Each GO entry T in the GAF is checked to
see if it corresponds to a valid (non-obsolete) term in the ontology. If
not, metadata for other terms is checked. If the term has been merged
into a term S (i.e. S has alt\_id of T) then T is replaced by S in the
GAF line.

<a name="gorule0000021"/>
## Check with/from for sequence similarity evidence for valid database ID

 * id: [GORULE:0000021](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000021.md)
 * status: Approved


For ISS and related evidence types, the With/From field should point to
a valid gene or gene product identifier that is annotated with a GO term
that is either identical to or a descendant of the main annotation.

<a name="gorule0000022"/>
## Check for, and filter, annotations made to retracted publications

 * id: [GORULE:0000022](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000022.md)
 * status: Pending


GO should not include annotations to retracted publications. PubMed
keeps record of retracted publications in the PublicationTypeList of
each paper's XML entry. For additional details on this proposed rule,
please see: https://github.com/geneontology/go-annotation/issues/1479
