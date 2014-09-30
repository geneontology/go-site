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

    // General aliases.
    var each = bbop.core.each;

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

    // Build the annotation download table if possible.
    var gamt = '#go_annotations_metadata_table';
    if( jQuery(gamt).length ){
	if( typeof(global_go_annotation_metadata) !== 'undefined' ){
	    var meta = global_go_annotation_metadata;

	    //var url = 'http://viewvc.geneontology.org/viewvc/GO-SVN/trunk/gene-associations/';
	    var url = 'http://geneontology.org/gene-associations/';
	    var readme_url = 'http://geneontology.org/gene-associations/readme/';

	    // ...
	    var rows = [];
	    each(meta['resources'], function(item){
		var id = item["id"];
		var label = item["label"];
		var fname = item["gaf_filename"];
		var external = item["external"];
		var db = item["db"] || '';
		var db_additional = item["db_additional"] || '';
		var dbname = item["dbname"] || '';
		var date = item["submissionDate"] || '-';
		var ecount = item["annotatedEntityCount"] || '-';
		var acount = item["annotationCount"] || '-';
		var ncount = item["annotationCountExcludingIEA"] || '-';
		var size = item["gafDocumentSizeInBytes"] || '-';

		// From: https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
		function bytes2(bytes){
		    var sizes = ['b', 'kb', 'mb', 'gb', 'tb'];
		    if (bytes == 0) return '0 bytes';
		    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		    return Math.round(bytes / Math.pow(1024, i), 2) +
			'&nbsp;' + sizes[i];
		}

		// Get the link to the README.
		var readme_link = readme_url + id;

		// Only show one link, external get top.
		var link = external;
		if( ! link ){
		    link = url + fname;
		}

		var rcache = [
		    '<tr>',
		    '<td>',
		    '<ul class="list-unstyled">',
		    '<li><strong>', label, '</strong></li>',
		    '<li>', db, '</li>',
		    '<li>', db_additional, '</li>',
		    '</ul>',
		    '</td>',
		    '<td>',
		    ecount,
		    '</td>',
		    '<td>',
		    acount, ' (', ncount, '&nbsp;non-IEA)',
		    '</td>',
		    '<td>',
		    date,
		    '</td>',
		    '<td>',
		    readme_link,
		    '</td>',
		    '<td>',
		    '<a href="' + link + '">' + fname + '</a>',
		    ' (', bytes2(size), ')',
		    '</td>',
		    '</tr>'
		];
		rows.push(rcache.join(''));
	    });

	    var tcache = [
		//'<table class="table table-striped table-bordered table-hover table-condensed">',
		'<table id="sortable-download-table" class="table table-striped table-bordered table-hover">',
		'<thead>',
		'<tr>',
		'<th>Species/Database<img style="border: 0px;" src="http://a2-static1.stanford.edu/images/reorder.gif" title="Reorder" alt="[Reorder]" /></th>',
		'<th>Gene&nbsp;products annotated<img style="border: 0px;" src="http://a2-static1.stanford.edu/images/reorder.gif" title="Reorder" alt="[Reorder]" /></th>',
		'<th>Annotations</th>',
		'<th>Submission date<img style="border: 0px;" src="http://a2-static1.stanford.edu/images/reorder.gif" title="Reorder" alt="[Reorder]" /></th>',
		'<th>README</th>',
		'<th>File</th>',
		'</tr>',
		'</thead>',
		'<tbody>',
		rows.join(''),
		'</tbody>',
		'</table>'
	    ];

	    jQuery(gamt).empty();
	    jQuery(gamt).append(tcache.join(''));
	    jQuery('#sortable-download-table').tablesorter();
	}
    }
}

// Attempt overlay on ready.
jQuery(document).ready(function(){
    GOOverlayInit();
});
