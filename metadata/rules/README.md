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



<p>The following basic checks ensure that submitted gene association files conform to the GAF spec, and come from the original GAF check script.</p>
<ul><li>Each line of the GAF file is checked for the correct number of columns, the cardinality of the columns, leading or trailing whitespace</li>
<li>Col 1 and all DB abbreviations must be in <a href="http://www.geneontology.org/cgi-bin/xrefs.cgi">GO.xrf_abbs</a> (case may be incorrect)</li>
<li>All GO IDs must be extant in current ontology</li>
<li>Qualifier, evidence, aspect and DB object columns must be within the list of allowed values</li>
<li>DB:Reference, Taxon and GO ID columns are checked for minimal form</li>
<li>Date must be in YYYYMMDD format</li>
<li>All IEAs over a year old are removed</li>
<li>Taxa with a 'representative' group (e.g. MGI for Mus musculus, FlyBase for Drosophila) must be submitted by that group only</li>
</ul>

<a name="gorule0000002"/>
## No 'NOT' annotations to 'protein binding ; GO:0005515'

 * id: [GORULE:0000002](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000002.md)
 * status: Implemented



<p>Even if an identifier is available in the 'with' column, a qualifier only informs on the GO term, it cannot instruct users to restrict the annotation to just the protein identified in the 'with', therefore an annotation applying <span class="term">protein binding ; GO:0005515</span> with the <span class="not">not</span> qualifier implies that the annotated protein cannot bind anything.</p>
<p>This is such a wide-reaching statement that few curators would want to make.</p>
<p>This rule <em>only</em> applies to GO:0005515; children of this term can be qualified with <span class="not">not</span>, as further information on the type of binding is then supplied in the GO term; e.g. <span class="not">not</span> + <span class="term">NFAT4 protein binding ; GO:0051529</span> would be fine, as the negative binding statement only applies to the NFAT4 protein.</p>
<p>For more information, see the <a href="http://wiki.geneontology.org/index.php/Binding_Guidelines">binding guidelines</a> on the GO wiki.</p>

<a name="gorule0000003"/>
## Annotations to 'binding ; GO:0005488' and 'protein binding ; GO:0005515' should be made with IPI and an interactor in the 'with' field

 * id: [GORULE:0000003](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000003.md)
 * status: Implemented



<p>Annotations to <span class="term">binding : GO:0005488</span> or <span class="term">protein binding ; GO:0005515</span> with the <acronym title="Traceable Author Statement" class="evCode">TAS</acronym>, <acronym title="Non-traceable Author Statement" class="evCode">NAS</acronym>, <acronym title="Inferred by Curator" class="evCode">IC</acronym>, <acronym title="Inferred from Mutant Phenotype" class="evCode">IMP</acronym>, <acronym title="Inferred from Genetic Interaction" class="evCode">IGI</acronym> and <acronym title="Inferred by Direct Assay" class="evCode">IDA</acronym> evidence codes are not informative as they do not allow the interacting  partner to be specified. If the nature of the binding partner is known (protein or DNA for example), an appropriate child term of <span class="term">binding ; GO:0005488</span> should be chosen for the annotation. In the case of chemicals, ChEBI IDs can go in the 'with' column. Children of <span class="term">protein binding ; GO:0005515</span> where the type of protein is identified in the GO term name do not need further specification.
</p>
<p>For more information, see the <a href="http://wiki.geneontology.org/index.php/Binding_Guidelines">binding guidelines</a> on the GO wiki.</p>

<a name="gorule0000004"/>
## Reciprocal annotations for 'protein binding ; GO:0005515'

 * id: [GORULE:0000004](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000004.md)
 * status: Approved



<p>When annotating to terms that are descendants of protein binding, and when the curator can supply the accession of the interacting protein accession, it is essential that reciprocal annotations are available - i.e. if you say protein A binds protein B, then you need to also have the second annotation that states that protein B binds protein A.</p>
<p>This will be a soft QC; a script will make these inferences and it is up to each MOD to evaluate and include the inferences in their GAF/DB.</p>
<p>For more information, see the <a href="http://wiki.geneontology.org/index.php/Binding_Guidelines">binding guidelines</a> on the GO wiki.</p>

<a name="gorule0000005"/>
## No ISS or ISS-related annotations to 'protein binding ; GO:0005515'

 * id: [GORULE:0000005](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000005.md)
 * status: Approved



<p>
If we take an example annotation:
</p>
<div class="annot">
<p>
gene product: protein A<br>GO term: protein binding ; GO:0005515<br>evidence: IPI<br>reference: PMID:123456<br>with/from: <b>with</b> protein A
</p>
</div>
<p>
this annotation line can be interpreted as: protein A was found to carry out the 'protein binding' activity in PMID:12345, and that this function was <span class="evCode">Inferred from the results of a Physicial Interaction (IPI)</span> assay, which involved protein X
</p>
<p>
However if we would like to transfer this annotation to protein A's ortholog 'protein B', the <acronym title="Inferred from Sequence Similarity" class="evCode">ISS</acronym> annotation that would be created would be:
</p>
<div class="annot">
<p>
gene product: protein B<br>GO term: protein binding ; GO:0005515<br>evidence: ISS<br>reference: GO_REF:curator_judgement<br>with/from: <b>with</b> protein A
</p>
</div>
<p>
This is interpreted as 'it is inferred that protein B carries out protein binding activity due to its sequence similarity (curator determined) with protein A, which was experimentally shown to carry out 'protein binding'.
</p>
<p>
Therefore the <span class="evCode">ISS</span> annotation will not display the the interacting protein X accession. Such an annotation display can be confusing, as the value in the 'with' column just provides further information on why the <span class="evCode">ISS</span>/<span class="evCode">IPI</span> or <acronym title="Inferred from Genetic Interaction" class="evCode">IGI</acronym> annotation was created. This means that an <span class="evCode">ISS</span> projection from <span class="term">protein binding</span> is not particularly useful as you are only really telling the user that you think an homologous protein binds a protein, based on overall sequence similarity.
</p>
<p>
This rule only applies to GO:0005515, as descendant terms such as <span class="term">mitogen-activated protein kinase p38 binding ; GO:0048273</span> used as <span class="evCode">ISS</span> annotations are informative as the GO term name contains far more specific information as to the identity of the interactor.
</p>
<p>For more information, see the <a href="http://wiki.geneontology.org/index.php/Binding_Guidelines">binding guidelines</a> on the GO wiki.</p>

<a name="gorule0000006"/>
## IEP usage is restricted to terms from the Biological Process ontology

 * id: [GORULE:0000006](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000006.md)
 * status: Implemented



<p>The <span class="evCode">IEP evidence code</span> is used where process involvement is inferred from the timing or location of expression of a gene, particularly when comparing a gene that is not yet characterized with the timing or location of expression of genes known to be involved in a particular process. This type of annotation is only suitable with terms from the Biological Process ontology.</p>
<p>For more information, see the <a href="http://wiki.geneontology.org/index.php/Binding_Guidelines">binding guidelines</a> on the GO wiki.</p>

<a name="gorule0000007"/>
## IPI should not be used with catalytic activity molecular function terms

 * id: [GORULE:0000007](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000007.md)
 * status: Proposed



<p>The <a href="http://www.geneontology.org/GO.evidence.shtml#ipi" class="evCode">IPI (Inferred from Physical Interaction) evidence code</a> is used where an annotation can be supported from interaction evidence between the gene product of interest and another molecule (see the <a href="http://www.geneontology.org/GO.evidence.shtml#ipi">evidence code documentation</a>). While the <span class="evCode">IPI evidence code</span> is frequently used to support annotations to terms that are children of <span class="term">binding ; GO:0005488</span>, it is thought unlikely by the Binding working group that enough information can be obtained from a binding interaction to support an annotation to a term that is a chid of <span class="term">catalytic activity ; GO:0003824</span>. Such <span class="evCode">IPI</span> annotations to child terms of <span class="term">catalytic activity ; GO:0003824</span> may need to be revisited and corrected.</p>
<p>For more information, see the <a href="http://wiki.geneontology.org/index.php/Annotations_to_Catalytic_activity_with_IPI">catalytic activity annotation guide</a> on the GO wiki.</p>

<a name="gorule0000008"/>
## No annotations should be made to uninformative high level terms

 * id: [GORULE:0000008](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000008.md)
 * status: Proposed



<p>Some terms are too high-level to provide useful information when used for annotation, regardless of the evidence code used.</p>
<p>We provide and maintain the list of too high-level terms as two subsets in the ontology:</p>
<ul>
<li>gocheck_do_not_annotate "Term not to be used for direct annotation"</li>
<li>gocheck_do_not_manually_annotate "Term not to be used for direct manual annotation"</li>
</ul>
<p>Both subsets denote high level terms, not to be used for any manual annotation.</p>
<p>For inferred electronic annotations (IEAs), we allow the use of terms from the 
gocheck_do_not_manually_annotate subset. These terms may still offer some general information, 
but a human curator should always be able to find a more specific annotation.</p>

<a name="gorule0000009"/>
## Annotation Intersection Alerts

 * id: [GORULE:0000009](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000009.md)
 * status: Proposed



To be added

<a name="gorule0000010"/>
## PubMed reference formatting must be correct

 * id: [GORULE:0000010](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000010.md)
 * status: Proposed



<p>References in the GAF (Column 6) should be of the format <span class="fmt">db_name:db_key|PMID:12345678</span>, e.g. <span class="fmt">SGD_REF:S000047763|PMID:2676709</span>. No other format is acceptable for PubMed references; the following examples are invalid:
</p>
<ul><li>PMID:PMID:14561399</li>
<li>PMID:unpublished</li>
<li>PMID:.</li>
<li>PMID:0</li>
</ul>
<p>This is proposed as a HARD QC check: incorrectly formatted references will be removed.</p>

<a name="gorule0000011"/>
## ND annotations to root nodes only

 * id: [GORULE:0000011](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000011.md)
 * status: Proposed



<p>The <a class="evCode" href="http://www.geneontology.org/GO.evidence.shtml#nd">No Data (ND) evidence code</a> should be used for annotations to the root nodes only and should be accompanied with <a href="http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000015">GO_REF:0000015</a> or an internal reference. PMIDs <strong>cannot</strong> be used for annotations made with <span class="evCode">ND</span>.
</p>
<ul>
<li>
if you are using an internal reference, that reference ID should be listed as an external accession for <a href="http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000015">GO_REF:0000015</a>. Please add (or email) your internal reference ID for GO_REF:0000015.
</li>
<li>
All <span class="evCode">ND</span> annotations made with a reference other than GO_REF:0000015 (or an equivalent internal reference that is listed as external accession for GO_REF:0000015) should be filtered out of the GAF.
</li>
</ul>
<p>
The SQL code identifies all <span class="evCode">ND</span> annotations that do not use GO_REF:0000015 or one of the alternative internal references listed for it in the <a href="http://www.geneontology.org/cgi-bin/references.cgi">GO references file</a>.
</p>

<a name="gorule0000013"/>
## Taxon-appropriate annotation check

 * id: [GORULE:0000013](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000013.md)
 * status: Proposed



<p>GO taxon constraints ensure that annotations are not made to inappropriate species or sets of species. See <a rel="external" href="http://www.biomedcentral.com/1471-2105/11/530">http://www.biomedcentral.com/1471-2105/11/530</a> for more details.
</p>

<a name="gorule0000014"/>
## Valid GO term ID

 * id: [GORULE:0000014](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000014.md)
 * status: Proposed



This check ensures that the GO IDs used for annotations are valid IDs and are not obsolete.

<a name="gorule0000015"/>
## Dual species taxon check

 * id: [GORULE:0000015](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000015.md)
 * status: Proposed



Dual species annotations are used to capture information about multi-organism interactions. The first taxon ID should be that of the species encoding the gene product, and the second should be the taxon of the other species in the interaction. Where the interaction is between organisms of the same species, both taxon IDs should be the same. These annotations should be used only in conjunction with terms that have the biological process term 'GO:0051704 : multi-organism process' or the cellular component term 'GO:0044215 : other organism' as an ancestor.

<a name="gorule0000016"/>
## IC annotations require a With/From GO ID

 * id: [GORULE:0000016](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000016.md)
 * status: Approved



<p>All IC annotations should include a GO ID in the "With/From" column; for more information, see the <a href="http://www.geneontology.org/GO.evidence.shtml#ic">IC evidence code guidelines</a>.</p>

<a name="gorule0000017"/>
## IDA annotations must not have a With/From entry

 * id: [GORULE:0000017](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000017.md)
 * status: Approved



Use IDA only when no identifier can be placed in the "With/From" column. When there is an appropriate ID for the "With/From" column, use IPI.

<a name="gorule0000018"/>
## IPI annotations require a With/From entry

 * id: [GORULE:0000018](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000018.md)
 * status: Approved



<p>All IPI annotations should include a nucleotide/protein/chemical identifier in the "With/From" column (column 8). From the <a href="http://www.geneontology.org/GO.evidence.shtml#ipi">description of IPI in the GO evidence code guide</a>: "We strongly recommend making an entry in the with/from column when using this evidence code to include an identifier for the other protein or other macromolecule or other chemical involved in the interaction. When multiple entries are placed in the with/from field, they are separated by pipes. Consider using IDA when no identifier can be entered in the with/from column." All annotations made after January 1 2012 that break this rule will be removed.</p>

<a name="gorule0000019"/>
## Generic Reasoner Validation Check

 * id: [GORULE:0000019](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000019.md)
 * status: Implemented



<p>The entire GAF is converted to OWL, combined with
the main GO ontology and auxhiliary constraint
ontologies. The resulting ontology is checked for
consistency and unsatisfiable classes over using a
complete DL reasoner such as HermiT. </p>

<a name="gorule0000020"/>
## Automatic repair of annotations to merged or obsoleted terms

 * id: [GORULE:0000020](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000020.md)
 * status: Approved



<p>
Ontology operations such as term merges and
obsoletions may be out of sync with annotation
releases. Each GO entry T in the GAF is checked to
see if it corresponds to a valid (non-obsolete) term
in the ontology. If not, metadata for other terms is
checked. If the term has been merged into a term S
(i.e. S has alt_id of T) then T is replaced by S in
the GAF line. 
</p>

<a name="gorule0000021"/>
## Check with/from for sequence similarity evidence for valid database ID

 * id: [GORULE:0000021](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000021.md)
 * status: Approved



For ISS and related evidence types, the With/From field should point to a valid gene or gene product identifier that is annotated with a GO term
that is either identical to or a descendant of the main annotation.

<a name="gorule0000022"/>
## Check for, and filter, annotations made to retracted publications

 * id: [GORULE:0000022](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-0000022.md)
 * status: Pending



GO should not include annotations to retracted publications.  PubMed keeps record of retracted publications in the PublicationTypeList
of each paper's XML entry.
For additional details on this proposed rule, please see: https://github.com/geneontology/go-annotation/issues/1479
