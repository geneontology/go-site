
Feature: Gene Ontology's public GOlr service is not a silly rabbit
 Upstream GOlr engine behaves as expected for various data.
 
 ## No Background necessary.

 @golr-production
 Scenario: User attempts to use the GOlr service in JSON mode for simple query
    Given I collect data at URL "http://golr.geneontology.org/solr/select?defType=edismax&qt=standard&indent=on&wt=json&rows=10&start=0&fl=*,score&facet=true&facet.mincount=1&facet.sort=count&json.nl=arrarr&facet.limit=25&fq=document_category:%22general%22&fq=-category:%22family%22&facet.field=category&q=pro*&qf=entity%5E3&qf=entity_label_searchable%5E3&qf=general_blob_searchable%5E3"
     then the content type should be "text/plain"
      and the content should contain "maxScore"
    when the content is converted to JSON
     then the JSON should have the top-level property "responseHeader"
      and the JSON should have the top-level property "response"
      and the JSON should have the top-level property "facet_counts"
      and the JSON should have the JSONPath "response.docs[*].score"
      and the JSON should have JSONPath "responseHeader.params.rows" equal to string "10"
      and the JSON should have JSONPath "response.docs[0].score" equal to float "1.0"
