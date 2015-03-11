
Feature: PANTHER term enrichment service responds sanely
 Upstream TE engine behaves as expected in three^D^D^D^Dwo modes.
 
 ## No Background necessary.

 @panther
 Scenario: User attempts to use the PANTHER service in HTML mode
    Given I collect data at URL "http://pantherdb.org/webservices/go/overrep.jsp?ontology=biological_process&input=P31946%0AP62258%0AQ04917%0AP61981%0AP31947%0Abaxter%0AP27348%0AP63104%0AQ96QU6%0AQ8NCW5&species=HUMAN&correction=bonferroni&format=html"
     then the content type should be "text/html"
     and the content should contain "html"

 # @panther
 # Scenario: User attempts to use the PANTHER service in XML mode
 #    Given I collect data at URL "http://pantherdb.org/webservices/go/overrep.jsp?ontology=biological_process&input=P31946%0AP62258%0AQ04917%0AP61981%0AP31947%0Abaxter%0AP27348%0AP63104%0AQ96QU6%0AQ8NCW5&species=HUMAN&correction=bonferroni&format=xml"
 #     then the content type should be "text/xml"
 #     and the content should contain "number_in_reference"

 ## A little extra testing here since it's so easy.
 @panther
 Scenario: User attempts to use the PANTHER service in JSON mode
    Given I collect data at URL "http://pantherdb.org/webservices/go/overrep.jsp?ontology=biological_process&input=P31946%0AP62258%0AQ04917%0AP61981%0AP31947%0Abaxter%0AP27348%0AP63104%0AQ96QU6%0AQ8NCW5&species=HUMAN&correction=bonferroni&format=json"
     then the content type should be "application/json"
     and the content should contain "number_in_reference"
    when the content is converted to JSON
     then the JSON should have the top-level property "results"
