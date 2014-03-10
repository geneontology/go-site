////
//// A general set to get the search box at the top of most pages
//// going.
////

function GOOverlayInit(){

    // For debugging.
    var logger = new bbop.logger('GO: ');
    logger.DEBUG = false;
    //logger.DEBUG = true;
    function ll(str){
	logger.kvetch(str);
    }

    if( jQuery('#gsf-query').length ){

      // Use jQuery UI to tooltip-ify doc.
      var tt_args = {
	'position': {'my': 'left+5 top', 'at': 'right top'},
	'tooltipClass': 'amigo-searchbar-tooltip-style'
      };
      jQuery('.bbop-js-tooltip').tooltip(tt_args);

      // Setup the annotation profile and make the annotation document
      // category and the current acc sticky in the filters.
      var sd = new amigo.data.server(); // resource locations
      var gconf = new bbop.golr.conf(amigo.data.golr);
      var a_widget = bbop.widget.search_box; // nick
      var linker = new amigo.linker();

      //
      jQuery('input:submit').prop('disabled', false);

      // Widget, default personality and filter.
      function forward(doc){
	if( doc && doc['entity'] && doc['category'] ){
	    if( doc['category'] == 'ontology_class' ){
		window.location.href =
		    linker.url(doc['entity'], 'term');
	    }else if( doc['category'] == 'bioentity' ){
		window.location.href =
		    linker.url(doc['entity'], 'gp');
	    }
	}
    }

    // Set for the initial search box autocompleter.
    var general_args = {
	'label_template':
	'{{entity_label}} ({{entity}})',
	'value_template': '{{entity}}',
	'list_select_callback': forward
    };
    var auto = new a_widget(sd.golr_base(), gconf, 'gsf-query', general_args);
    auto.set_personality('general'); // profile in gconf
    auto.add_query_filter('document_category', 'general');
    auto.add_query_filter('category', 'family', ['-']);
    }
  }

// Attempt overlay on ready.
jQuery(document).ready(function(){
	GOOverlayInit();
});