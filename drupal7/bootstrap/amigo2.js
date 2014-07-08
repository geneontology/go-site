// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, bbop-js might not be extant in this namespace. Try and
// get at it. Otherwise, if we're in browser-land, it should be
// included in the global and we can proceed.
if( typeof(exports) != 'undefined' ){
    var bbop = require('bbop').bbop;
}
/* 
 * Package: version.js
 * 
 * Namespace: amigo.version
 * 
 * This package was automatically generated during the build process
 * and contains its version information--this is the release of the
 * API that you have.
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.version == "undefined" ){ amigo.version = {}; }

/*
 * Variable: revision
 *
 * Partial version for this library; revision (major/minor version numbers)
 * information.
 */
amigo.version.revision = "2.2.0";

/*
 * Variable: release
 *
 * Partial version for this library: release (date-like) information.
 */
amigo.version.release = "20140708";
/*
 * Package: api.js
 * 
 * Namespace: amigo.api
 * 
 * Core for AmiGO 2 remote functionality.
 * 
 * Provide methods for accessing AmiGO/GO-related web resources from
 * the host server. A loose analog to the perl AmiGO.pm top-level.
 * 
 * This module should contain nothing to do with the DOM, but rather
 * methods to access and make sense of resources provided by AmiGO and
 * its related services on the host.
 * 
 * WARNING: This changes very quickly as parts get spun-out into more
 * stable packages.
 */

// Module and namespace checking.
if( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Constructor: api
 * 
 * Contructor for the AmiGO API object.
 * Hooks to useful things back on AmiGO.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  AmiGO object
 */
amigo.api = function(){

    ///
    /// General AmiGO (perl server) AJAX response checking (after
    /// parsing).
    ///

    this.response = {};

    // Check to see if the server thinks we were successful.
    this.response.success = function(robj){
	var retval = false;
	if( robj && robj.success && robj.success == 1 ){
	    retval = true;
	}
	return retval;
    };

    // Check to see what the server thinks about its own condition.
    this.response.type = function(robj){
	var retval = 'unknown';
	if( robj && robj.type ){
	    retval = robj.type;
	}
	return retval;
    };

    // Check to see if the server thinks the data was successful.
    this.response.errors = function(robj){
	var retval = new Array();
	if( robj && robj.errors ){
	    retval = robj.errors;
	}
	return retval;
    };

    // Check to see if the server thinks the data was correct.
    this.response.warnings = function(robj){
	var retval = new Array();
	if( robj && robj.warnings ){
	    retval = robj.warnings;
	}
	return retval;
    };

    // Get the results chunk.
    this.response.results = function(robj){
	var retval = {};
	if( robj && robj.results ){
	    retval = robj.results;
	}
	return retval;
    };

    // Get the arguments chunk.
    this.response.arguments = function(robj){
	var retval = {};
	if( robj && robj.arguments ){
	    retval = robj.arguments;
	}
	return retval;
    };

    ///
    /// Workspaces' linking.
    ///

    function _abstract_head_template(head){
	return head + '?';
    }

    // Convert a hash (with possible arrays as arguments) into a link
    // string.
    // NOTE: Non-recursive--there are some interesting ways to create
    // cyclic graph hashes in SpiderMonkey, and I'd rather not think
    // about it right now.
    function _abstract_segment_template(segments){
	
	var maxibuf = new Array();
	for( var segkey in segments ){

	    var segval = segments[segkey];

	    // If the value looks like an array, iterate over it and
	    // collect.
	    if( segval &&
		segval != null &&
		typeof segval == 'object' &&
		segval.length ){

		for( var i = 0; i < segval.length; i++ ){
		    var minibuffer = new Array();
		    minibuffer.push(segkey);
		    minibuffer.push('=');
		    minibuffer.push(segval[i]);
		    maxibuf.push(minibuffer.join(''));
		}

	    }else{
		var minibuf = new Array();
		minibuf.push(segkey);
		minibuf.push('=');
		minibuf.push(segval);
		maxibuf.push(minibuf.join(''));
	    }
	}
	return maxibuf.join('&');
    }

    // Similar to the above, but creating a solr filter set.
    function _abstract_solr_filter_template(filters){
	
	var allbuf = new Array();
	for( var filter_key in filters ){

	    var filter_val = filters[filter_key];

	    // If the value looks like an array, iterate over it and
	    // collect.
	    if( filter_val &&
		filter_val != null &&
		typeof filter_val == 'object' &&
		filter_val.length ){

		    for( var i = 0; i < filter_val.length; i++ ){
			var minibuffer = new Array();
			var try_val = filter_val[i];
			if( typeof(try_val) != 'undefined' &&
			try_val != '' ){
			    minibuffer.push('fq=');
			    minibuffer.push(filter_key);
			    minibuffer.push(':');
			    minibuffer.push('"');
			    minibuffer.push(filter_val[i]);
			    minibuffer.push('"');
			    allbuf.push(minibuffer.join(''));
			}
		    }		    
		}else{
		    var minibuf = new Array();
		    if( typeof(filter_val) != 'undefined' &&
			filter_val != '' ){
			    minibuf.push('fq=');
			    minibuf.push(filter_key);
			    minibuf.push(':');
			    minibuf.push('"');
			    minibuf.push(filter_val);
			    minibuf.push('"');
			    allbuf.push(minibuf.join(''));
			}
		}
	}
	return allbuf.join('&');
    }

    // Construct the templates using head and segments.
    function _abstract_link_template(head, segments){	
	return _abstract_head_template(head) +
	    _abstract_segment_template(segments);
    }

    // // Construct the templates using the segments.
    // function _navi_client_template(segments){
    // 	segments['mode'] = 'layers_graph';
    // 	return _abstract_link_template('amigo_exp', segments);
    // }

    // // Construct the templates using the segments.
    // function _navi_data_template(segments){
    // 	segments['mode'] = 'navi_js_data';
    // 	return _abstract_link_template('aserve_exp', segments);
    // }

    // Construct the templates using the segments.
    function _ws_template(segments){
	segments['mode'] = 'workspace';
	return _abstract_link_template('amigo_exp', segments);
    }

    // // Construct the templates using the segments.
    // function _ls_assoc_template(segments){
    // 	segments['mode'] = 'live_search_association';
    // 	return _abstract_link_template('aserve', segments);
    // }
    // function _ls_gp_template(segments){
    // 	segments['mode'] = 'live_search_gene_product';
    // 	return _abstract_link_template('aserve', segments);
    // }
    // function _ls_term_template(segments){
    // 	segments['mode'] = 'live_search_term';
    // 	return _abstract_link_template('aserve', segments);
    // }

    // Construct the templates using the segments.
    function _completion_template(segments){
    	return _abstract_link_template('completion', segments);
    }

    // // Construct the templates using the segments.
    // function _nmatrix_template(segments){
    // 	segments['mode'] = 'nmatrix';
    // 	return _abstract_link_template('amigo_exp', segments);
    // }

    this.api = {};
    this.link = {};
    this.html = {};

    //     // Some handling for a workspace object once we get one.
    //     this.util.workspace = {};
    //     this.util.workspace.get_terms = function(ws){
    // 	var all_terms = new Array();
    // 	for( var t = 0; t < ws.length; t++ ){
    // 	    var item = ws[t];
    // 	    if( item.type == 'term' ){
    // 		all_terms.push(item.key);
    // 	    }
    // 	}
    // 	return all_terms;
    //     };

    ///
    /// JSON? JS? API functions for workspaces.
    ///

    this.workspace = {};

    this.workspace.remove = function(ws_name){
	return _ws_template({
	    action: 'remove_workspace',
	    workspace: ws_name
	});
    };
    this.workspace.add = function(ws_name){
	return _ws_template({
	    action: 'add_workspace',
	    workspace: ws_name
	});
    };
    this.workspace.copy = function(ws_from_name, ws_to_name){
	return _ws_template({
	    action: 'copy_workspace',
	    workspace: ws_from_name,
	    copy_to_workspace: ws_to_name
	});
    };
    this.workspace.clear = function(ws_name){
	return _ws_template({
	    action: 'clear_workspace',
	    workspace: ws_name
	});
    };
    this.workspace.list = function(ws_name){
	return _ws_template({
	    action: 'list_workspaces',
	    workspace: ws_name
	});
    };

    // API functions for workspace items.
    //     this.workspace.add_item = function(ws_name, key, type, name){
    this.workspace.add_item = function(ws_name, key, name){
	return _ws_template({
	    action: 'add_item',
	    workspace: ws_name,
	    key: key,
            // _t_y_p_e_: _t_y_p_e_, // prevent naturaldocs from finding this
	    name: name
	});
    };
    this.workspace.remove_item = function(ws_name, key){
	return _ws_template({
	    action: 'remove_item',
	    workspace: ws_name,
	    key: key
	});
    };
    this.workspace.list_items = function(ws_name){
	return _ws_template({
	    action: 'list_items',
	    workspace: ws_name
	});
    };

    // Just the workspace and item status. Essentially do nothing and
    // link to the current session status.
    this.workspace.status = function(){
	return _ws_template({ action: '' });
    };

    ///
    /// API function for completion/search information.
    ///

    this.completion = function(args){

	var format = 'amigo';
	var type = 'general';
	var ontology = null;
	var narrow = 'false';
	var query = '';
	if( args ){
	    if( args['format'] ){ format = args['format']; }
	    if( args['type'] ){ type = args['type']; }
	    if( args['ontology'] ){ontology = args['ontology']; }
	    if( args['narrow'] ){narrow = args['narrow']; }
	    if( args['query'] ){query = args['query']; }
	}

	return _completion_template({format: format,
				     type: type,
				     ontology: ontology,
				     narrow: narrow,
				     query: encodeURIComponent(query)});
    };

    ///
    /// API functions for live search.
    ///
    this.live_search = {};

    // General search:
    // http://accordion.lbl.gov:8080/solr/select?indent=on&version=2.2&q=annotation_class_label%3Abinding&fq=&start=0&rows=10&fl=*%2Cscore&qt=standard&wt=json&explainOther=&hl.fl=
    // Facet on date:
    // http://accordion.lbl.gov:8080/solr/select?indent=on&version=2.2&q=annotation_class_label%3Abinding&fq=&start=0&rows=10&fl=*%2Cscore&qt=standard&wt=json&explainOther=&hl.fl=&facet=true&facet.field=date    
    this.live_search.golr = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_query_args =
	    {
		// TODO/BUG? need jsonp things here?
		qt: 'standard',
		indent: 'on',
		wt: 'json',
		version: '2.2',
		rows: 10,
		//start: 1,
		start: 0, // Solr is offset indexing
		fl: '*%2Cscore',

		// Control of facets.
		facet: '',
		'facet.field': [],

		// Facet filtering.
		fq: [],

		// Query-type stuff.
		q: '',

		// Our bookkeeping.
		packet: 0
	    };
	var final_query_args = bbop.core.fold(default_query_args, in_args);
		
	var default_filter_args =
	    {
		// Filter stuff.
		document_category: [],
		type: [],
		source: [],
		taxon: [],
		evidence_type: [],
		evidence_closure: [],
		isa_partof_label_closure: [],
		annotation_extension_class_label: [],
		annotation_extension_class_label_closure: []
	    };
	var final_filter_args = bbop.core.fold(default_filter_args, in_args);

	// ...
	//return _abstract_link_template('select', segments);	
	var complete_query = _abstract_head_template('select') +
	    _abstract_segment_template(final_query_args);
	var addable_filters = _abstract_solr_filter_template(final_filter_args);
	if( addable_filters.length > 0 ){
	    complete_query = complete_query + '&' + addable_filters;
	}
	return complete_query;
    };

    ///
    /// API functions for the ontology.
    ///
    this.ontology = {};
    this.ontology.roots = function(){
	return _abstract_link_template('aserve_exp', {'mode': 'ontology'});
    };

    ///
    /// API functions for navi js data.
    ///

    this.navi_js_data = function(args){

	if( ! args ){ args = {}; }

	var final_args = {};

	// Transfer the name/value pairs in opt_args into final args
	// if extant.
	var opt_args = ['focus', 'zoom', 'lon', 'lat'];
	//var opt_args_str = '';
	for( var oa = 0; oa < opt_args.length; oa++ ){
	    var arg_name = opt_args[oa];
	    if( args[arg_name] ){
		// opt_args_str =
		// opt_args_str + '&' + arg_name + '=' + args[arg_name];
		final_args[arg_name] = args[arg_name];
	    }
	}

	//
	var terms_buf = new Array();
	if( args.terms &&
	    args.terms.length &&
	    args.terms.length > 0 ){

	    //
	    for( var at = 0; at < args.terms.length; at++ ){
		terms_buf.push(args.terms[at]);
	    } 
	}
	final_args['terms'] = terms_buf.join(' '); 

	return _navi_data_template(final_args);
    };

    ///
    /// Links for terms and gene products.
    ///

    function _term_link(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	//return 'term_details?term=' + acc;
	return 'amigo?mode=golr_term_details&term=' + acc;
    }
    this.link.term = _term_link;

    // BUG/TODO: should this actually be in widgets? How core is this
    // convenience?
    this.html.term_link = function(acc, label){
	if( ! label ){ label = acc; }
	return '<a title="Go to term details page for ' + label +
	    '." href="' + _term_link({acc: acc}) + '">' + label +'</a>';
    };

    function _gene_product_link(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	//return 'gp-details.cgi?gp=' + acc;
	return 'amigo?mode=golr_gene_product_details&gp=' + acc;
    }
    this.link.gene_product = _gene_product_link;

    // BUG/TODO: should this actually be in widgets? How core is this
    // convenience?
    this.html.gene_product_link = function(acc, label){
	if( ! label ){ label = acc; }
	return '<a title="Go to gene product details page for ' + label +
	    '." href="' + _gene_product_link({acc: acc}) + '">' + label +'</a>';
    };

    ///
    /// Links for term product associations.
    ///

    this.link.term_assoc = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: '',
		speciesdb: [],
		taxid: []
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	var acc = final_args['acc'];
	var speciesdbs = final_args['speciesdb'];
	var taxids = final_args['taxid'];

	//
	var spc_fstr = speciesdbs.join('&speciesdb');
	var tax_fstr = taxids.join('&taxid=');
	//core.kvetch('LINK SRCS: ' + spc_fstr);
	//core.kvetch('LINK TIDS: ' + tax_fstr);

	return 'term-assoc.cgi?term=' + acc +
	    '&speciesdb=' + spc_fstr +
	    '&taxid=' + tax_fstr;
    };

    ///
    /// Link function for blast.
    ///

    this.link.single_blast = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	return 'blast.cgi?action=blast&seq_id=' + acc;
    };

    ///
    /// Link function for term enrichment.
    ///

    this.link.term_enrichment = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		gp_list: [] 
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	return 'term_enrichment?' +
	    'gp_list=' + final_args['gp_list'].join(' ');
    };

    ///
    /// Link function for slimmer.
    ///

    this.link.slimmer = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		gp_list: [], 
		slim_list: []
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	return 'slimmer?' +
	    'gp_list=' + final_args['gp_list'].join(' ') +
	    '&slim_list=' + final_args['slim_list'].join(' ');
    };

    ///
    /// Link function for N-Matrix.
    ///

    this.link.nmatrix = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		term_set_1: '',
		term_set_2: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);

	//
	var terms_buf = new Array();
	if( in_args.terms &&
	    in_args.terms.length &&
	    in_args.terms.length > 0 ){

		//
	    for( var at = 0; at < in_args.terms.length; at++ ){
		terms_buf.push(in_args.terms[at]);
	    } 
	}
	final_args['term_set_1'] = terms_buf.join(' '); 
	final_args['term_set_2'] = terms_buf.join(' '); 

	return _nmatrix_template(final_args);
    };

    ///
    /// Link functions for navi client (bookmark).
    ///

    this.link.layers_graph = function(args){

	//
	var final_args = {};
	if( args['lon'] &&
	    args['lat'] &&
	    args['zoom'] &&
	    args['focus'] ){

	    //
	    final_args['lon'] = args['lon'];
	    final_args['lat'] = args['lat'];
	    final_args['zoom'] = args['zoom'];
	    final_args['focus'] = args['focus'];
	}

	if( args['terms'] &&
	    args['terms'].length &&
	    args['terms'].length > 0 ){

	    //
	    var aterms = args['terms'];
	    var terms_buf = new Array();
	    for( var at = 0; at < aterms.length; at++ ){
		terms_buf.push(aterms[at]);
	    }
	    final_args['terms'] = terms_buf.join(' '); 
	}
	
	return _navi_client_template(final_args);
    };

    // TODO:
};
/* 
 * Package: linker.js
 * 
 * Namespace: amigo.linker
 * 
 * Generic AmiGO link generator, fed by <amigo.data.server> for local
 * links and <amigo.data.xrefs> for non-local links.
 * 
 * NOTE: A lot of this is lifted from the (defunct) amigo2.js
 * package. However, the future should be here.
 */

// Module and namespace checking.
if( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Constructor: linker
 * 
 * Create an object that can make URLs and/or anchors.
 * 
 * These functions have a well defined interface so that other
 * packages can use it.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
amigo.linker = function (){
    this._is_a = 'amigo.linker';

    // With the new dispatcher, relative URLs no longer work, so we
    // have to bring in server data--first let's ensure it.
    if( ! amigo.data.server ){
	throw new Error('we are missing access to amigo.data.server!');
    }
    // Easy app base.
    var sd = new amigo.data.server();
    this.app_base = sd.app_base();
    // Internal term matcher.
    this.term_regexp = null;
    var internal_regexp_str = sd.term_regexp();    
    if( internal_regexp_str ){
	this.term_regexp = new RegExp(internal_regexp_str);
    }

    // Categories for different special cases (internal links).
    this.ont_category = {
	'term': true,
	'ontology_class': true,
	'annotation_class': true,
	'annotation_class_closure': true,
	'annotation_class_list': true
    };
    this.bio_category = {
        'gp': true,
	'gene_product': true,
	'bioentity': true
    };
    this.complex_annotation_category = {
        //'complex_annotation': true,
        'annotation_group': true
        //'annotation_unit': true
    };
    this.search_category = { // not including the trivial medial_search below
        'search': true,
	'live_search': true
    };
    this.search_modifier = {
	// Possibly "dynamic".
	'gene_product': '/bioentity',
	'bioentity': '/bioentity',
	'ontology': '/ontology',
	'annotation': '/annotation',
	'complex_annotation': '/complex_annotation',
	'family': '/family',
	'lego_unit': '/lego_unit',
	'general': '/general'
    };
    this.other_interlinks = {
	'medial_search': '/amigo/medial_search',
	'landing': '/amigo/landing',
	'tools': '/amigo/software_list',
	'schema_details': '/amigo/schema_details',
	'load_details': '/amigo/load_details',
	'browse': '/amigo/browse',
	'goose': '/goose',
	'grebe': '/grebe',
	'gannet': '/gannet',
	'repl': '/repl'	
    };
};

/*
 * Function: url
 * 
 * Return a url string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id
 *  modifier - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (url); null if it couldn't create anything
 */
amigo.linker.prototype.url = function (id, xid, modifier){
    
    var retval = null;

    ///
    /// AmiGO hard-coded internal link types.
    ///

    // For us, having an xid means that we will be doing some more
    // complicated routing.
    if( xid && xid != '' ){

	// First let's do the ones that need an associated id to
	// function--either data urls or searches.
	if( id && id != '' ){
	    if( this.ont_category[xid] ){
		retval = this.app_base + '/amigo/term/' + id;
		//retval = _add_restmark_modifier(retval, modifier);
            }else if( this.bio_category[xid] ){
		retval = this.app_base + '/amigo/gene_product/' + id;
		//retval = _add_restmark_modifier(retval, modifier);
            }else if( this.complex_annotation_category[xid] ){
		retval = this.app_base + '/amigo/complex_annotation/'+ id;
            }else if( this.search_category[xid] ){

		// First, try and get the proper path out. Will
		// hardcode for now since some paths don't map
		// directly to the personality.
		var search_path = '';
		if( this.search_modifier[modifier] ){
		    search_path = this.search_modifier[modifier];
		}
		
		retval = this.app_base + '/amigo/search' + search_path;
		if( id ){
		    // Ugh...decide if the ID indicated a restmark or
		    // a full http action bookmark.
		    var http_re = new RegExp("^http");
		    if( http_re.test(id) ){
			// HTTP bookmark.
			retval = retval + '?bookmark='+ id;
		    }else{
			// minimalist RESTy restmark.
			retval = retval + '?' + id;
		    }
		}
	    }
	}

	// Things that do not need an id to function--like just
	// popping somebody over to Grebe or the medial search.
	if( ! retval ){
	    if( this.other_interlinks[xid] ){
		var extension = this.other_interlinks[xid];
		retval = this.app_base + extension;

		// Well, for medial search really, but it might be
		// general?
		if( xid == 'medial_search' ){
		    // The possibility of just tossing back an empty
		    // search for somebody downstream to fill in.
		    if( bbop.core.is_defined(id) && id != null ){
			retval = retval + '?q=' + id;
		    }
		}
	    }
	}
    }

    ///
    /// External resources. For us, if we haven't found something
    /// so far, try the data xrefs.
    ///
    
    // Since we couldn't find anything with our explicit local
    // transformation set, drop into the great abyss of the xref data.
    if( ! retval && id && id != '' ){ // not internal, but still has an id
	if( ! amigo.data.xrefs ){
	    throw new Error('amigo.data.xrefs is missing!');
	}
	
	// First, extract the probable source and break it into parts.
	var full_id_parts = bbop.core.first_split(':', id);
	if( full_id_parts && full_id_parts[0] && full_id_parts[1] ){
	    var src = full_id_parts[0];
	    var sid = full_id_parts[1];
	    
	    // Now, check to see if it is indeed in our store.
	    var lc_src = src.toLowerCase();
	    var xref = amigo.data.xrefs[lc_src];
	    if( xref && xref['url_syntax'] ){
		retval =
		    xref['url_syntax'].replace('[example_id]', sid, 'g');
	    }
	}
    }
    
    return retval;
};

/*
 * Function: anchor
 * 
 * Return a link as a chunk of HTML, all ready to consume in a
 * display.
 * 
 * Arguments:
 *  args - hash--'id' required; 'label' and 'hilite' are inferred if not extant
 *  xid - *[optional]* an internal transformation id
 *  rest - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (link); null if it couldn't create anything
 */
amigo.linker.prototype.anchor = function(args, xid, modifier){
    
    var anchor = this;
    var retval = null;

    // Don't even start if there is nothing.
    if( args ){

	// Get what fundamental arguments we can.
	var id = args['id'];
	if( id ){
	
	    // Infer label from id if not present.
	    var label = args['label'];
	    if( ! label ){ label = id; }
	
	    // Infer hilite from label if not present.
	    var hilite = args['hilite'];
	    if( ! hilite ){ hilite = label; }
	
	    // See if the URL is legit. If it is, make something for it.
	    var url = this.url(id, xid, modifier);
	    if( url ){
		
		// First, see if it is one of the internal ones we know about
		// and make something special for it.
		if( xid ){
		    if( this.ont_category[xid] ){
		    
			// Possible internal/external detection here.
			// var class_str = ' class="amigo-ui-term-internal" ';
			var class_str = '';
			var title_str = 'title="' + // internal default
			id + ' (go to the term details page for ' +
			    label + ')"';
			if( this.term_regexp ){
			    if( this.term_regexp.test(id) ){
			    }else{
				class_str = ' class="amigo-ui-term-external" ';
				title_str = ' title="' +
				    id + ' (is an external term; click ' +
				    'to view our internal information for ' +
				    label + ')" ';
			    }
			}
			
			//retval = '<a title="Go to the term details page for '+
 			retval = '<a ' + class_str + title_str +
			    ' href="' + url + '">' + hilite + '</a>';
		    }else if( this.bio_category[xid] ){
 			retval = '<a title="' + id +
			    ' (go to the details page for ' + label +
			    ')" href="' + url + '">' + hilite + '</a>';
		    }else if( this.search_category[xid] ){
			retval = '<a title="Reinstate bookmark for ' + label +
			    '." href="' + url + '">' + hilite + '</a>';
		    }
		}
		
		// If it wasn't in the special transformations, just make
		// something generic.
		if( ! retval ){
		    retval = '<a title="' + id +
			' (go to the page for ' + label +
			')" href="' + url + '">' + hilite + '</a>';
		}
	    }
	}
    }

    return retval;
};
/* 
 * Package: handler.js
 * 
 * Namespace: amigo.handler
 * 
 * Generic AmiGO handler (conforming to what /should/ be described in
 * the BBOP JS documentation), fed by <amigo.data.dispatch>.
 */

// Module and namespace checking.
if( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Constructor: handler
 * 
 * Create an object that will run functions in the namespace with a
 * specific profile.
 * 
 * These functions have a well defined interface so that other
 * packages can use them (for example, the results display in
 * LiveSearch.js).
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
amigo.handler = function (){
    this._is_a = 'amigo.handler';

    var is_def = bbop.core.is_defined;

    // Let's ensure we're sane.
    if( ! is_def(amigo) ||
	! is_def(amigo.data) ||
	! is_def(amigo.data.dispatch) ){
	throw new Error('we are missing access to amigo.data.dispatch!');
    }

    // Okay, since trying functions into existance is slow, we'll
    // create a cache of strings to functions.
    this.mangle = bbop.core.uuid();
    this.string_to_function_map = {};
    this.entries = 0; // a little extra for debugging and testing
};

/*
 * Function: dispatch
 * 
 * Return a string.
 * 
 * The fallback function is called if no match could be found in the
 * amigo.data.dispatch. It is called with the name and context
 * arguments in the same order.
 * 
 * Arguments:
 *  data - the incoming thing to be handled
 *  name - the field name to be processed
 *  context - *[optional]* a string to add extra context to the call
 *  fallback - *[optional]* a fallback function to call in case nothing is found
 * 
 * Returns:
 *  string; null if it couldn't create anything
 */
amigo.handler.prototype.dispatch = function(data, name, context, fallback){
    
    // Aliases.
    var is_def = bbop.core.is_defined;

    // First, get the specific id for this combination.
    var did = name || '';
    did += '_' + this.mangle;
    if( context ){
	did += '_' + context;
    }

    // If the combination is not already in the map, fill it in as
    // best we can.
    if( ! is_def(this.string_to_function_map[did]) ){
	
	this.entries += 1;

	// First, try and get the most specific.
	if( is_def(amigo.data.dispatch[name]) ){

	    var field_hash = amigo.data.dispatch[name];
	    var function_string = null;

	    if( is_def(field_hash['context']) &&
		is_def(field_hash['context'][context]) ){
		// The most specific.
		function_string = field_hash['context'][context];
	    }else{
		// If the most specific cannot be found, try and get
		// the more general one.
		if( is_def(field_hash['default']) ){
		    function_string = field_hash['default'];
		}
	    }

	    // At the end of this section, if we don't have a string
	    // to resolve into a function, the data format we're
	    // working from is damaged.
	    if( function_string == null ){
		throw new Error('amigo.data.dispatch appears to be damaged!');
	    }
	    
	    // We have a string. Pop it into existance with eval.
	    var evalled_thing = eval(function_string);

	    // Final test, make sure it is a function.
	    if( ! is_def(evalled_thing) ||
		evalled_thing == null ||
		bbop.core.what_is(evalled_thing) != 'function' ){
		throw new Error('"' + function_string + '" did not resolve!');
	    }else{
		this.string_to_function_map[did] = evalled_thing;		
	    }

	}else if( is_def(fallback) ){
	    // Nothing could be found, so add the fallback if it is
	    // there.
	    this.string_to_function_map[did] = fallback;
	}else{
	    // Whelp, nothing there, so stick an indicator in.
	    this.string_to_function_map[did] = null;
	}
    }

    // We are now ensured that either we have a callable function or
    // null, so let's finish it--either the return value of the called
    // function or null.
    var retval = null;
    if( this.string_to_function_map[did] != null ){
	var cfunc = this.string_to_function_map[did];
	retval = cfunc(data, name, context);
    }
    return retval;
};
/* 
 * Package: echo.js
 * 
 * Namespace: amigo.handlers.echo
 * 
 * Static function handler for echoing inputs--really used for
 * teaching and testing.
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.handlers == "undefined" ){ amigo.handlers = {}; }

/*
 * Function: echo
 * 
 * Applies bbop.core.dump to whatever comes in.
 * 
 * Parameters:
 *  thing
 * 
 * Returns:
 *  a string; it /will/ be a string
 * 
 * Also See: <bbop.handler>
 */
amigo.handlers.echo = function(thing, name, context){

    // Force a return string into existence.
    var retstr = null;
    try {
	retstr = bbop.core.dump(thing);
    } catch (x) {
	retstr = '';
    }

    // // Appaend any optional stuff.
    // var is_def = bbop.core.is_defined;
    // var what = bbop.core.what_is;
    // if( is_def(name) && what(name) == 'string' ){
    // 	retstr += ' (' + name + ')';
    // }
    // if( is_def(context) && what(context) == 'string' ){
    // 	retstr += ' (' + context + ')';
    // }

    return retstr;
};
/* 
 * Package: owl_class_expression.js
 * 
 * Namespace: amigo.handlers.owl_class_expression
 * 
 * Static function handler for displaying OWL class expression
 * results. To be used for GAF column 16 stuff.
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.handlers == "undefined" ){ amigo.handlers = {}; }

/*
 * Function: owl_class_expression
 * 
 * Example incoming data (as a string or object):
 * 
 * : { relationship: {
 * :     relation: [{id: "RO:001234", label: "regulates"},
 * :                {id:"BFO:0003456", label: "hp"}], 
 * :     id: "MGI:MGI:185963",
 * :     label: "kidney"
 * :   }
 * : }
 * 
 * Parameters:
 *  JSON object as *[string or object]*; see above
 * 
 * Returns:
 *  HTML string
 * 
 * Also See: <bbop.handler>
 */
amigo.handlers.owl_class_expression = function(in_owlo){

    var retstr = "";

    // // Add logging.
    // var logger = new bbop.logger();
    // logger.DEBUG = true;
    // //logger.DEBUG = false;
    // function ll(str){ logger.kvetch(str); }

    // Aliases.
    var is_def = bbop.core.is_defined;
    var what_is = bbop.core.what_is;
    var loop = bbop.core.each;

    var owlo = in_owlo;
    if( what_is(owlo) == 'string' ){
	// This should be an unnecessary robustness check as
	// everything /should/ be a legit JSON string...but things
	// happen in testing. We'll check to make sure that it looks
	// like what it should be as well.
	if( in_owlo.charAt(0) == '{' &&
	    in_owlo.charAt(in_owlo.length-1) == '}' ){
	    owlo = bbop.json.parse(in_owlo) || {};
	}else{
	    // Looks like a normal string string.
	    // Do nothing for now, but catch in the next section.
	}
    }

    // Check to make sure that it looks right.
    if( what_is(owlo) == 'string' ){
	// Still a string means bad happened--we want to see that.
	retstr = owlo + '?';
    }else if( ! is_def(owlo) ||
	      ! is_def(owlo['relationship']) ||
	      ! what_is(owlo['relationship']) == 'object' ||
	      ! what_is(owlo['relationship']['relation']) == 'array' ||
	      ! is_def(owlo['relationship']['id']) ||
	      ! is_def(owlo['relationship']['label']) ){
	// 'Twas an error--ignore.
	//throw new Error('sproing!');
    }else{
	
	//throw new Error('sproing!');
	var link = new amigo.linker();

	// Okay, right structure--first assemble the relationships,
	// then tag onto end.
	var rel_buff = [];
	bbop.core.each(owlo['relationship']['relation'],
		       function(rel){
			   // Check to make sure that these are
			   // structured correctly as well.
			   var rel_id = rel['id'];
			   var rel_lbl = rel['label'];
			   if( is_def(rel_id) && is_def(rel_lbl) ){
			       var an =
				   link.anchor({id: rel_id, label: rel_lbl});
			       // Final check: if we didn't get
			       // anything reasonable, just a label.
			       if( ! an ){ an = rel_lbl; }
			       rel_buff.push(an);
			       // ll('in ' + rel_id + ' + ' + rel_lbl + ': ' + an);
			   }
		       });
	var ranc = link.anchor({id: owlo['relationship']['id'],
				label: owlo['relationship']['label']});
	// Again, a final check
	if( ! ranc ){ ranc = owlo['relationship']['label']; }
	retstr = rel_buff.join(' &rarr; ') + ' ' + ranc;
    }
    
    return retstr;
};
/* 
 * Package: golr.js
 * 
 * Namespace: amigo.data.golr
 * 
 * This package was automatically created during an AmiGO 2 installation
 * from the YAML configuration files that AmiGO pulls in.
 *
 * Useful information about GOlr. See the package <golr_conf.js>
 * for the API to interact with this data file.
 *
 * NOTE: This file is generated dynamically at installation time.
 * Hard to work with unit tests--hope it's not too bad. You have to
 * occasionally copy back to keep the unit tests sane.
 *
 * NOTE: This file has a slightly different latout from the YAML
 * configurations files--in addition instead of the fields
 * being in lists (fields), they are in hashes keyed by the
 * field id (fields_hash).
 */

// All of the server/instance-specific meta-data.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: golr
 * 
 * The configuration for the data.
 * Essentially a JSONification of the OWLTools YAML files.
 * This should be consumed directly by <bbop.golr.conf>.
 */
amigo.data.golr = {
   "annotation" : {
      "fields_hash" : {
         "regulates_closure_label" : {
            "id" : "regulates_closure_label",
            "display_name" : "Inferred annotation",
            "indexed" : "true",
            "description" : "Annotations for this term or its children (over regulates).",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         },
         "taxon_closure" : {
            "searchable" : "false",
            "property" : [],
            "display_name" : "Taxon",
            "id" : "taxon_closure",
            "indexed" : "true",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         "aspect" : {
            "indexed" : "true",
            "display_name" : "Ontology (aspect)",
            "id" : "aspect",
            "description" : "Ontology aspect.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         "reference" : {
            "description" : "Database reference.",
            "indexed" : "true",
            "id" : "reference",
            "display_name" : "Reference",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         "synonym" : {
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "display_name" : "Synonym",
            "id" : "synonym",
            "indexed" : "true",
            "description" : "Gene or gene product synonyms.",
            "property" : [],
            "searchable" : "false"
         },
         "taxon" : {
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "display_name" : "Taxon",
            "id" : "taxon",
            "indexed" : "true",
            "description" : "Taxonomic group.",
            "property" : [],
            "searchable" : "false"
         },
         "secondary_taxon_closure" : {
            "indexed" : "true",
            "id" : "secondary_taxon_closure",
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon closure.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         "bioentity_label" : {
            "searchable" : "true",
            "property" : [],
            "display_name" : "Gene/product",
            "id" : "bioentity_label",
            "indexed" : "true",
            "description" : "Gene or gene product identifiers.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         },
         "assigned_by" : {
            "description" : "Annotations assigned by group.",
            "display_name" : "Assigned by",
            "id" : "assigned_by",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         "isa_partof_closure_label" : {
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "indexed" : "true",
            "id" : "isa_partof_closure_label",
            "display_name" : "Involved in",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "true",
            "property" : []
         },
         "annotation_class" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Direct annotations.",
            "indexed" : "true",
            "id" : "annotation_class",
            "display_name" : "Direct annotation",
            "property" : [],
            "searchable" : "false"
         },
         "evidence_with" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Evidence with/from.",
            "indexed" : "true",
            "id" : "evidence_with",
            "display_name" : "Evidence with",
            "property" : [],
            "searchable" : "false"
         },
         "bioentity_name" : {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "The full name of the gene or gene product.",
            "id" : "bioentity_name",
            "display_name" : "Gene/product name",
            "indexed" : "true"
         },
         "annotation_class_label" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Direct annotations.",
            "display_name" : "Direct annotation",
            "id" : "annotation_class_label",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         "annotation_extension_class_label" : {
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_extension_class_label",
            "display_name" : "Annotation extension",
            "description" : "Extension class for the annotation.",
            "property" : [],
            "searchable" : "true"
         },
         "annotation_extension_class" : {
            "searchable" : "false",
            "property" : [],
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "id" : "annotation_extension_class",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi"
         },
         "secondary_taxon_closure_label" : {
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "secondary_taxon_closure_label",
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon closure.",
            "property" : [],
            "searchable" : "true"
         },
         "isa_partof_closure" : {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "indexed" : "true",
            "id" : "isa_partof_closure",
            "display_name" : "Involved in"
         },
         "has_participant_closure" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Closure of ids/accs over has_participant.",
            "indexed" : "true",
            "id" : "has_participant_closure",
            "display_name" : "Has participant (IDs)",
            "property" : [],
            "searchable" : "false"
         },
         "annotation_extension_class_closure_label" : {
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "display_name" : "Annotation extension",
            "id" : "annotation_extension_class_closure_label",
            "indexed" : "true",
            "description" : "Extension class for the annotation."
         },
         "bioentity_internal_id" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "The bioentity ID used at the database of origin.",
            "indexed" : "false",
            "display_name" : "This should not be displayed",
            "id" : "bioentity_internal_id",
            "property" : [],
            "searchable" : "false"
         },
         "secondary_taxon_label" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Secondary taxon.",
            "indexed" : "true",
            "display_name" : "Secondary taxon",
            "id" : "secondary_taxon_label",
            "property" : [],
            "searchable" : "true"
         },
         "qualifier" : {
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "id" : "qualifier",
            "display_name" : "Qualifier",
            "description" : "Annotation qualifier.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         "annotation_extension_json" : {
            "searchable" : "false",
            "property" : [],
            "id" : "annotation_extension_json",
            "display_name" : "Annotation extension",
            "indexed" : "true",
            "description" : "Extension class for the annotation (JSON).",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         "secondary_taxon" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "id" : "secondary_taxon",
            "display_name" : "Secondary taxon",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         "type" : {
            "indexed" : "true",
            "display_name" : "Type class id",
            "id" : "type",
            "description" : "Type class.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         "date" : {
            "property" : [],
            "searchable" : "false",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Date of assignment.",
            "display_name" : "Date",
            "id" : "date",
            "indexed" : "true"
         },
         "bioentity_isoform" : {
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "bioentity_isoform",
            "display_name" : "Isoform",
            "description" : "Biological isoform.",
            "property" : [],
            "searchable" : "false"
         },
         "annotation_extension_class_closure" : {
            "description" : "Extension class for the annotation.",
            "indexed" : "true",
            "display_name" : "Annotation extension",
            "id" : "annotation_extension_class_closure",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         "is_redundant_for" : {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "id" : "is_redundant_for",
            "display_name" : "Redundant for",
            "indexed" : "true",
            "description" : "Rational for redundancy of annotation."
         },
         "panther_family" : {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family",
            "display_name" : "PANTHER family",
            "indexed" : "true"
         },
         "taxon_label" : {
            "property" : [],
            "searchable" : "true",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Taxonomic group and ancestral groups.",
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon_label"
         },
         "panther_family_label" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "id" : "panther_family_label",
            "property" : [],
            "searchable" : "true"
         },
         "bioentity" : {
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "display_name" : "Gene/product",
            "id" : "bioentity",
            "description" : "Gene or gene product identifiers.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         "source" : {
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "display_name" : "Source",
            "id" : "source",
            "indexed" : "true",
            "description" : "Database source.",
            "property" : [],
            "searchable" : "false"
         },
         "taxon_closure_label" : {
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon_closure_label",
            "description" : "Taxonomic group and ancestral groups.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         "evidence_type" : {
            "searchable" : "false",
            "property" : [],
            "description" : "Evidence type.",
            "id" : "evidence_type",
            "display_name" : "Evidence",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single"
         },
         "has_participant_closure_label" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Closure of labels over has_participant.",
            "id" : "has_participant_closure_label",
            "display_name" : "Has participant",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         "regulates_closure" : {
            "description" : "Annotations for this term or its children (over regulates).",
            "indexed" : "true",
            "id" : "regulates_closure",
            "display_name" : "Inferred annotation",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         "evidence_type_closure" : {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "All evidence (evidence closure) for this annotation",
            "indexed" : "true",
            "id" : "evidence_type_closure",
            "display_name" : "Evidence type"
         },
         "id" : {
            "id" : "id",
            "display_name" : "Acc",
            "indexed" : "true",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         }
      },
      "description" : "Associations between GO terms and genes or gene products.",
      "_strict" : 0,
      "display_name" : "Annotations",
      "id" : "annotation",
      "document_category" : "annotation",
      "result_weights" : "bioentity^7.0 bioentity_name^6.0 qualifier^5.0 annotation_class^4.7 annotation_extension_json^4.5 source^4.0 taxon^3.0 evidence_type^2.5 evidence_with^2.0 panther_family^1.5 bioentity_isoform^0.5 reference^0.25",
      "filter_weights" : "source^7.0 assigned_by^6.5 aspect^6.25 evidence_type_closure^6.0 panther_family_label^5.5 qualifier^5.25 taxon_closure_label^5.0 annotation_class_label^4.5 regulates_closure_label^3.0 annotation_extension_class_closure_label^2.0",
      "fields" : [
         {
            "id" : "id",
            "display_name" : "Acc",
            "indexed" : "true",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         {
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "display_name" : "Source",
            "id" : "source",
            "indexed" : "true",
            "description" : "Database source.",
            "property" : [],
            "searchable" : "false"
         },
         {
            "indexed" : "true",
            "display_name" : "Type class id",
            "id" : "type",
            "description" : "Type class.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         {
            "property" : [],
            "searchable" : "false",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Date of assignment.",
            "display_name" : "Date",
            "id" : "date",
            "indexed" : "true"
         },
         {
            "description" : "Annotations assigned by group.",
            "display_name" : "Assigned by",
            "id" : "assigned_by",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "id" : "is_redundant_for",
            "display_name" : "Redundant for",
            "indexed" : "true",
            "description" : "Rational for redundancy of annotation."
         },
         {
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "display_name" : "Taxon",
            "id" : "taxon",
            "indexed" : "true",
            "description" : "Taxonomic group.",
            "property" : [],
            "searchable" : "false"
         },
         {
            "property" : [],
            "searchable" : "true",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Taxonomic group and ancestral groups.",
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon_label"
         },
         {
            "searchable" : "false",
            "property" : [],
            "display_name" : "Taxon",
            "id" : "taxon_closure",
            "indexed" : "true",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         {
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon_closure_label",
            "description" : "Taxonomic group and ancestral groups.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "id" : "secondary_taxon",
            "display_name" : "Secondary taxon",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Secondary taxon.",
            "indexed" : "true",
            "display_name" : "Secondary taxon",
            "id" : "secondary_taxon_label",
            "property" : [],
            "searchable" : "true"
         },
         {
            "indexed" : "true",
            "id" : "secondary_taxon_closure",
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon closure.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         {
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "secondary_taxon_closure_label",
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon closure.",
            "property" : [],
            "searchable" : "true"
         },
         {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "indexed" : "true",
            "id" : "isa_partof_closure",
            "display_name" : "Involved in"
         },
         {
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "indexed" : "true",
            "id" : "isa_partof_closure_label",
            "display_name" : "Involved in",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "true",
            "property" : []
         },
         {
            "description" : "Annotations for this term or its children (over regulates).",
            "indexed" : "true",
            "id" : "regulates_closure",
            "display_name" : "Inferred annotation",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         {
            "id" : "regulates_closure_label",
            "display_name" : "Inferred annotation",
            "indexed" : "true",
            "description" : "Annotations for this term or its children (over regulates).",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Closure of ids/accs over has_participant.",
            "indexed" : "true",
            "id" : "has_participant_closure",
            "display_name" : "Has participant (IDs)",
            "property" : [],
            "searchable" : "false"
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Closure of labels over has_participant.",
            "id" : "has_participant_closure_label",
            "display_name" : "Has participant",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         {
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "display_name" : "Synonym",
            "id" : "synonym",
            "indexed" : "true",
            "description" : "Gene or gene product synonyms.",
            "property" : [],
            "searchable" : "false"
         },
         {
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "display_name" : "Gene/product",
            "id" : "bioentity",
            "description" : "Gene or gene product identifiers.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         {
            "searchable" : "true",
            "property" : [],
            "display_name" : "Gene/product",
            "id" : "bioentity_label",
            "indexed" : "true",
            "description" : "Gene or gene product identifiers.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         },
         {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "The full name of the gene or gene product.",
            "id" : "bioentity_name",
            "display_name" : "Gene/product name",
            "indexed" : "true"
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "The bioentity ID used at the database of origin.",
            "indexed" : "false",
            "display_name" : "This should not be displayed",
            "id" : "bioentity_internal_id",
            "property" : [],
            "searchable" : "false"
         },
         {
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "id" : "qualifier",
            "display_name" : "Qualifier",
            "description" : "Annotation qualifier.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Direct annotations.",
            "indexed" : "true",
            "id" : "annotation_class",
            "display_name" : "Direct annotation",
            "property" : [],
            "searchable" : "false"
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Direct annotations.",
            "display_name" : "Direct annotation",
            "id" : "annotation_class_label",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         {
            "indexed" : "true",
            "display_name" : "Ontology (aspect)",
            "id" : "aspect",
            "description" : "Ontology aspect.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         {
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "bioentity_isoform",
            "display_name" : "Isoform",
            "description" : "Biological isoform.",
            "property" : [],
            "searchable" : "false"
         },
         {
            "searchable" : "false",
            "property" : [],
            "description" : "Evidence type.",
            "id" : "evidence_type",
            "display_name" : "Evidence",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single"
         },
         {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "All evidence (evidence closure) for this annotation",
            "indexed" : "true",
            "id" : "evidence_type_closure",
            "display_name" : "Evidence type"
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Evidence with/from.",
            "indexed" : "true",
            "id" : "evidence_with",
            "display_name" : "Evidence with",
            "property" : [],
            "searchable" : "false"
         },
         {
            "description" : "Database reference.",
            "indexed" : "true",
            "id" : "reference",
            "display_name" : "Reference",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "id" : "annotation_extension_class",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi"
         },
         {
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_extension_class_label",
            "display_name" : "Annotation extension",
            "description" : "Extension class for the annotation.",
            "property" : [],
            "searchable" : "true"
         },
         {
            "description" : "Extension class for the annotation.",
            "indexed" : "true",
            "display_name" : "Annotation extension",
            "id" : "annotation_extension_class_closure",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         {
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "display_name" : "Annotation extension",
            "id" : "annotation_extension_class_closure_label",
            "indexed" : "true",
            "description" : "Extension class for the annotation."
         },
         {
            "searchable" : "false",
            "property" : [],
            "id" : "annotation_extension_json",
            "display_name" : "Annotation extension",
            "indexed" : "true",
            "description" : "Extension class for the annotation (JSON).",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family",
            "display_name" : "PANTHER family",
            "indexed" : "true"
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "id" : "panther_family_label",
            "property" : [],
            "searchable" : "true"
         }
      ],
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 bioentity_name^1.0 annotation_extension_class^2.0 annotation_extension_class_label^1.0 reference^1.0 panther_family^1.0 panther_family_label^1.0 bioentity_isoform^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "searchable_extension" : "_searchable",
      "schema_generating" : "true",
      "_infile" : "/usr/local/src/amigo/metadata/ann-config.yaml",
      "weight" : "20",
      "_outfile" : "/usr/local/src/amigo/metadata/ann-config.yaml"
   },
   "ontology" : {
      "weight" : "40",
      "_outfile" : "/usr/local/src/amigo/metadata/ont-config.yaml",
      "boost_weights" : "annotation_class^3.0 annotation_class_label^5.5 description^1.0 comment^0.5 synonym^1.0 alternate_id^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "searchable_extension" : "_searchable",
      "_infile" : "/usr/local/src/amigo/metadata/ont-config.yaml",
      "schema_generating" : "true",
      "filter_weights" : "source^4.0 subset^3.0 regulates_closure_label^1.0 is_obsolete^0.0",
      "result_weights" : "annotation_class^8.0 description^6.0 source^4.0 synonym^3.0 alternate_id^2.0",
      "document_category" : "ontology_class",
      "fields" : [
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Term identifier.",
            "indexed" : "true",
            "display_name" : "Acc",
            "id" : "id",
            "property" : [
               "getIdentifier"
            ],
            "searchable" : "false"
         },
         {
            "searchable" : "false",
            "property" : [
               "getIdentifier"
            ],
            "description" : "Term identifier.",
            "indexed" : "true",
            "id" : "annotation_class",
            "display_name" : "Term",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : []
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Identifier.",
            "id" : "annotation_class_label",
            "display_name" : "Term",
            "indexed" : "true",
            "property" : [
               "getLabel"
            ],
            "searchable" : "true"
         },
         {
            "indexed" : "true",
            "display_name" : "Definition",
            "id" : "description",
            "description" : "Term definition.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "true",
            "property" : [
               "getDef"
            ]
         },
         {
            "searchable" : "false",
            "property" : [
               "getNamespace"
            ],
            "indexed" : "true",
            "id" : "source",
            "display_name" : "Ontology source",
            "description" : "Term namespace.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         {
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "boolean",
            "id" : "is_obsolete",
            "display_name" : "Obsoletion",
            "indexed" : "true",
            "description" : "Is the term obsolete?"
         },
         {
            "display_name" : "Comment",
            "id" : "comment",
            "indexed" : "true",
            "description" : "Term comment.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : [
               "getComment"
            ]
         },
         {
            "description" : "Term synonyms.",
            "display_name" : "Synonyms",
            "id" : "synonym",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : [
               "getOBOSynonymStrings"
            ]
         },
         {
            "indexed" : "true",
            "display_name" : "Alt ID",
            "id" : "alternate_id",
            "description" : "Alternate term identifier.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ]
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Term that replaces this term.",
            "id" : "replaced_by",
            "display_name" : "Replaced By",
            "indexed" : "true",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "searchable" : "false"
         },
         {
            "searchable" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "id" : "consider",
            "display_name" : "Consider",
            "indexed" : "true",
            "description" : "Others terms you might want to look at.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         {
            "searchable" : "false",
            "property" : [
               "getSubsets"
            ],
            "id" : "subset",
            "display_name" : "Subset",
            "indexed" : "true",
            "description" : "Special use collections of terms.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         {
            "searchable" : "false",
            "property" : [
               "getDefXref"
            ],
            "description" : "Definition cross-reference.",
            "indexed" : "true",
            "display_name" : "Def xref",
            "id" : "definition_xref",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : []
         },
         {
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "database_xref",
            "display_name" : "DB xref",
            "description" : "Database cross-reference.",
            "property" : [
               "getXref"
            ],
            "searchable" : "false"
         },
         {
            "description" : "Ancestral terms (is_a/part_of).",
            "display_name" : "Is-a/part-of",
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "searchable" : "false",
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ]
         },
         {
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "id" : "isa_partof_closure_label",
            "display_name" : "Is-a/part-of",
            "indexed" : "true",
            "description" : "Ancestral terms (is_a/part_of).",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "searchable" : "true"
         },
         {
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "false",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "id" : "regulates_closure",
            "display_name" : "Ancestor",
            "indexed" : "true"
         },
         {
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "true",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "indexed" : "true",
            "id" : "regulates_closure_label",
            "display_name" : "Ancestor"
         },
         {
            "property" : [
               "getSegmentShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "false",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "id" : "topology_graph_json",
            "display_name" : "Topology graph (JSON)",
            "indexed" : "false"
         },
         {
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of).",
            "indexed" : "false",
            "display_name" : "Regulates transitivity graph (JSON)",
            "id" : "regulates_transitivity_graph_json",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getLineageShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ]
         },
         {
            "description" : "Only in taxon.",
            "indexed" : "true",
            "display_name" : "Only in taxon",
            "id" : "only_in_taxon",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "true",
            "property" : [
               "getIdentifier"
            ]
         },
         {
            "indexed" : "true",
            "id" : "only_in_taxon_label",
            "display_name" : "Only in taxon",
            "description" : "Only in taxon label.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "true",
            "property" : [
               "getLabel"
            ]
         },
         {
            "searchable" : "false",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "display_name" : "Only in taxon (IDs)",
            "id" : "only_in_taxon_closure",
            "indexed" : "true",
            "description" : "Only in taxon closure.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         {
            "searchable" : "true",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "indexed" : "true",
            "display_name" : "Only in taxon",
            "id" : "only_in_taxon_closure_label",
            "description" : "Only in taxon label closure.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         }
      ],
      "id" : "ontology",
      "display_name" : "Ontology",
      "fields_hash" : {
         "is_obsolete" : {
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "boolean",
            "id" : "is_obsolete",
            "display_name" : "Obsoletion",
            "indexed" : "true",
            "description" : "Is the term obsolete?"
         },
         "source" : {
            "searchable" : "false",
            "property" : [
               "getNamespace"
            ],
            "indexed" : "true",
            "id" : "source",
            "display_name" : "Ontology source",
            "description" : "Term namespace.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         "only_in_taxon" : {
            "description" : "Only in taxon.",
            "indexed" : "true",
            "display_name" : "Only in taxon",
            "id" : "only_in_taxon",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "true",
            "property" : [
               "getIdentifier"
            ]
         },
         "only_in_taxon_label" : {
            "indexed" : "true",
            "id" : "only_in_taxon_label",
            "display_name" : "Only in taxon",
            "description" : "Only in taxon label.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "true",
            "property" : [
               "getLabel"
            ]
         },
         "only_in_taxon_closure_label" : {
            "searchable" : "true",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "indexed" : "true",
            "display_name" : "Only in taxon",
            "id" : "only_in_taxon_closure_label",
            "description" : "Only in taxon label closure.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         "isa_partof_closure_label" : {
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "id" : "isa_partof_closure_label",
            "display_name" : "Is-a/part-of",
            "indexed" : "true",
            "description" : "Ancestral terms (is_a/part_of).",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "searchable" : "true"
         },
         "replaced_by" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Term that replaces this term.",
            "id" : "replaced_by",
            "display_name" : "Replaced By",
            "indexed" : "true",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "searchable" : "false"
         },
         "annotation_class" : {
            "searchable" : "false",
            "property" : [
               "getIdentifier"
            ],
            "description" : "Term identifier.",
            "indexed" : "true",
            "id" : "annotation_class",
            "display_name" : "Term",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : []
         },
         "annotation_class_label" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Identifier.",
            "id" : "annotation_class_label",
            "display_name" : "Term",
            "indexed" : "true",
            "property" : [
               "getLabel"
            ],
            "searchable" : "true"
         },
         "description" : {
            "indexed" : "true",
            "display_name" : "Definition",
            "id" : "description",
            "description" : "Term definition.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "true",
            "property" : [
               "getDef"
            ]
         },
         "id" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Term identifier.",
            "indexed" : "true",
            "display_name" : "Acc",
            "id" : "id",
            "property" : [
               "getIdentifier"
            ],
            "searchable" : "false"
         },
         "regulates_closure" : {
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "false",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "id" : "regulates_closure",
            "display_name" : "Ancestor",
            "indexed" : "true"
         },
         "only_in_taxon_closure" : {
            "searchable" : "false",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "display_name" : "Only in taxon (IDs)",
            "id" : "only_in_taxon_closure",
            "indexed" : "true",
            "description" : "Only in taxon closure.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         "regulates_closure_label" : {
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "true",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "indexed" : "true",
            "id" : "regulates_closure_label",
            "display_name" : "Ancestor"
         },
         "topology_graph_json" : {
            "property" : [
               "getSegmentShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "false",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "id" : "topology_graph_json",
            "display_name" : "Topology graph (JSON)",
            "indexed" : "false"
         },
         "comment" : {
            "display_name" : "Comment",
            "id" : "comment",
            "indexed" : "true",
            "description" : "Term comment.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : [
               "getComment"
            ]
         },
         "regulates_transitivity_graph_json" : {
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of).",
            "indexed" : "false",
            "display_name" : "Regulates transitivity graph (JSON)",
            "id" : "regulates_transitivity_graph_json",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getLineageShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ]
         },
         "alternate_id" : {
            "indexed" : "true",
            "display_name" : "Alt ID",
            "id" : "alternate_id",
            "description" : "Alternate term identifier.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ]
         },
         "subset" : {
            "searchable" : "false",
            "property" : [
               "getSubsets"
            ],
            "id" : "subset",
            "display_name" : "Subset",
            "indexed" : "true",
            "description" : "Special use collections of terms.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         "isa_partof_closure" : {
            "description" : "Ancestral terms (is_a/part_of).",
            "display_name" : "Is-a/part-of",
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "searchable" : "false",
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ]
         },
         "definition_xref" : {
            "searchable" : "false",
            "property" : [
               "getDefXref"
            ],
            "description" : "Definition cross-reference.",
            "indexed" : "true",
            "display_name" : "Def xref",
            "id" : "definition_xref",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : []
         },
         "database_xref" : {
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "database_xref",
            "display_name" : "DB xref",
            "description" : "Database cross-reference.",
            "property" : [
               "getXref"
            ],
            "searchable" : "false"
         },
         "consider" : {
            "searchable" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "id" : "consider",
            "display_name" : "Consider",
            "indexed" : "true",
            "description" : "Others terms you might want to look at.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         "synonym" : {
            "description" : "Term synonyms.",
            "display_name" : "Synonyms",
            "id" : "synonym",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : [
               "getOBOSynonymStrings"
            ]
         }
      },
      "description" : "Ontology classes for GO.",
      "_strict" : 0
   },
   "general" : {
      "schema_generating" : "true",
      "_infile" : "/usr/local/src/amigo/metadata/general-config.yaml",
      "searchable_extension" : "_searchable",
      "boost_weights" : "entity^3.0 entity_label^3.0 general_blob^3.0",
      "_outfile" : "/usr/local/src/amigo/metadata/general-config.yaml",
      "weight" : "0",
      "_strict" : 0,
      "description" : "A generic search document to get a general overview of everything.",
      "fields_hash" : {
         "entity" : {
            "description" : "The ID/label for this entity.",
            "indexed" : "true",
            "display_name" : "Entity",
            "id" : "entity",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         "entity_label" : {
            "description" : "The label for this entity.",
            "display_name" : "Enity label",
            "id" : "entity_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         "id" : {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "The mangled internal ID for this entity.",
            "indexed" : "true",
            "id" : "id",
            "display_name" : "Internal ID"
         },
         "general_blob" : {
            "searchable" : "true",
            "property" : [],
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "id" : "general_blob",
            "display_name" : "Generic blob",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single"
         },
         "category" : {
            "searchable" : "false",
            "property" : [],
            "id" : "category",
            "display_name" : "Document category",
            "indexed" : "true",
            "description" : "The document category that this enitity belongs to.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         }
      },
      "id" : "general",
      "display_name" : "General",
      "fields" : [
         {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "The mangled internal ID for this entity.",
            "indexed" : "true",
            "id" : "id",
            "display_name" : "Internal ID"
         },
         {
            "description" : "The ID/label for this entity.",
            "indexed" : "true",
            "display_name" : "Entity",
            "id" : "entity",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         {
            "description" : "The label for this entity.",
            "display_name" : "Enity label",
            "id" : "entity_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "id" : "category",
            "display_name" : "Document category",
            "indexed" : "true",
            "description" : "The document category that this enitity belongs to.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         },
         {
            "searchable" : "true",
            "property" : [],
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "id" : "general_blob",
            "display_name" : "Generic blob",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single"
         }
      ],
      "result_weights" : "entity^3.0 category^1.0",
      "filter_weights" : "category^4.0",
      "document_category" : "general"
   },
   "family" : {
      "fields" : [
         {
            "searchable" : "false",
            "property" : [],
            "id" : "id",
            "display_name" : "Acc",
            "indexed" : "true",
            "description" : "Family ID.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         },
         {
            "property" : [],
            "searchable" : "true",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "PANTHER family IDs that are associated with this entity.",
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "PANTHER family"
         },
         {
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "display_name" : "PANTHER family",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         {
            "display_name" : "This should not be displayed",
            "id" : "phylo_graph_json",
            "indexed" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "display_name" : "Gene/products",
            "id" : "bioentity_list",
            "indexed" : "true",
            "description" : "Gene/products annotated with this protein family."
         },
         {
            "searchable" : "false",
            "property" : [],
            "id" : "bioentity_list_label",
            "display_name" : "Gene/products",
            "indexed" : "true",
            "description" : "Gene/products annotated with this protein family.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         }
      ],
      "filter_weights" : "bioentity_list_label^1.0",
      "result_weights" : "panther_family^5.0 bioentity_list^4.0",
      "document_category" : "family",
      "display_name" : "Protein families",
      "id" : "family",
      "_strict" : 0,
      "description" : "Information about protein (PANTHER) families.",
      "fields_hash" : {
         "bioentity_list" : {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "display_name" : "Gene/products",
            "id" : "bioentity_list",
            "indexed" : "true",
            "description" : "Gene/products annotated with this protein family."
         },
         "panther_family_label" : {
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "display_name" : "PANTHER family",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         "id" : {
            "searchable" : "false",
            "property" : [],
            "id" : "id",
            "display_name" : "Acc",
            "indexed" : "true",
            "description" : "Family ID.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         },
         "panther_family" : {
            "property" : [],
            "searchable" : "true",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "PANTHER family IDs that are associated with this entity.",
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "PANTHER family"
         },
         "bioentity_list_label" : {
            "searchable" : "false",
            "property" : [],
            "id" : "bioentity_list_label",
            "display_name" : "Gene/products",
            "indexed" : "true",
            "description" : "Gene/products annotated with this protein family.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         "phylo_graph_json" : {
            "display_name" : "This should not be displayed",
            "id" : "phylo_graph_json",
            "indexed" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         }
      },
      "_outfile" : "/usr/local/src/amigo/metadata/protein-family-config.yaml",
      "weight" : "5",
      "_infile" : "/usr/local/src/amigo/metadata/protein-family-config.yaml",
      "schema_generating" : "true",
      "searchable_extension" : "_searchable",
      "boost_weights" : "panther_family^2.0 panther_family_label^2.0 bioentity_list^1.0 bioentity_list_label^1.0"
   },
   "bbop_term_ac" : {
      "_infile" : "/usr/local/src/amigo/metadata/term-autocomplete-config.yaml",
      "schema_generating" : "false",
      "searchable_extension" : "_searchable",
      "boost_weights" : "annotation_class^5.0 annotation_class_label^5.0 synonym^1.0 alternate_id^1.0",
      "_outfile" : "/usr/local/src/amigo/metadata/term-autocomplete-config.yaml",
      "weight" : "-20",
      "_strict" : 0,
      "fields_hash" : {
         "alternate_id" : {
            "searchable" : "false",
            "property" : [],
            "display_name" : "Alt ID",
            "id" : "alternate_id",
            "indexed" : "true",
            "description" : "Alternate term id.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         "id" : {
            "searchable" : "false",
            "property" : [],
            "display_name" : "Acc",
            "id" : "id",
            "indexed" : "true",
            "description" : "Term acc/ID.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         },
         "synonym" : {
            "description" : "Term synonyms.",
            "display_name" : "Synonyms",
            "id" : "synonym",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : []
         },
         "annotation_class" : {
            "description" : "Term acc/ID.",
            "indexed" : "true",
            "id" : "annotation_class",
            "display_name" : "Term",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         "annotation_class_label" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Common term name.",
            "indexed" : "true",
            "display_name" : "Term",
            "id" : "annotation_class_label",
            "property" : [],
            "searchable" : "true"
         }
      },
      "description" : "Easily find ontology classes in GO. For personality only - not a schema configuration.",
      "id" : "bbop_term_ac",
      "display_name" : "Term autocomplete",
      "fields" : [
         {
            "searchable" : "false",
            "property" : [],
            "display_name" : "Acc",
            "id" : "id",
            "indexed" : "true",
            "description" : "Term acc/ID.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         },
         {
            "description" : "Term acc/ID.",
            "indexed" : "true",
            "id" : "annotation_class",
            "display_name" : "Term",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Common term name.",
            "indexed" : "true",
            "display_name" : "Term",
            "id" : "annotation_class_label",
            "property" : [],
            "searchable" : "true"
         },
         {
            "description" : "Term synonyms.",
            "display_name" : "Synonyms",
            "id" : "synonym",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "display_name" : "Alt ID",
            "id" : "alternate_id",
            "indexed" : "true",
            "description" : "Alternate term id.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         }
      ],
      "document_category" : "ontology_class",
      "result_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0",
      "filter_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0"
   },
   "complex_annotation" : {
      "boost_weights" : "annotation_group_label^1.0 annotation_unit_label^1.0 enabled_by^1.0 enabled_by_label^1.0 location_list_closure^1.0 location_list_closure_label^1.0 process_class_closure_label^1.0 function_class_closure_label^1.0",
      "searchable_extension" : "_searchable",
      "schema_generating" : "true",
      "_infile" : "/usr/local/src/amigo/metadata/complex-ann-config.yaml",
      "weight" : "-5",
      "_outfile" : "/usr/local/src/amigo/metadata/complex-ann-config.yaml",
      "id" : "complex_annotation",
      "display_name" : "Complex annotations (ALPHA)",
      "description" : "An individual unit within LEGO. This is <strong>ALPHA</strong> software.",
      "fields_hash" : {
         "taxon_closure" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "indexed" : "true",
            "display_name" : "Taxon (IDs)",
            "id" : "taxon_closure",
            "property" : [],
            "searchable" : "false"
         },
         "process_class_label" : {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Common process name.",
            "id" : "process_class_label",
            "display_name" : "Process",
            "indexed" : "true"
         },
         "enabled_by_label" : {
            "id" : "enabled_by_label",
            "display_name" : "Enabled by",
            "indexed" : "true",
            "description" : "???",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         },
         "topology_graph_json" : {
            "searchable" : "false",
            "property" : [],
            "id" : "topology_graph_json",
            "display_name" : "Topology graph (JSON)",
            "indexed" : "false",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         },
         "annotation_unit" : {
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "display_name" : "Annotation unit",
            "id" : "annotation_unit",
            "description" : "???.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         "location_list_label" : {
            "description" : "",
            "indexed" : "true",
            "display_name" : "Location",
            "id" : "location_list_label",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         "owl_blob_json" : {
            "description" : "???",
            "display_name" : "???",
            "id" : "owl_blob_json",
            "indexed" : "false",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         "function_class_closure" : {
            "indexed" : "true",
            "display_name" : "Function",
            "id" : "function_class_closure",
            "description" : "???",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         "annotation_unit_label" : {
            "description" : "???.",
            "id" : "annotation_unit_label",
            "display_name" : "Annotation unit",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         "location_list_closure" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "",
            "id" : "location_list_closure",
            "display_name" : "Location",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         "taxon" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "GAF column 13 (taxon).",
            "id" : "taxon",
            "display_name" : "Taxon",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         "enabled_by" : {
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Enabled by",
            "id" : "enabled_by",
            "description" : "???"
         },
         "function_class_label" : {
            "description" : "Common function name.",
            "display_name" : "Function",
            "id" : "function_class_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         "function_class" : {
            "property" : [],
            "searchable" : "false",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Function",
            "id" : "function_class",
            "description" : "Function acc/ID."
         },
         "process_class_closure_label" : {
            "searchable" : "true",
            "property" : [],
            "description" : "???",
            "indexed" : "true",
            "display_name" : "Process",
            "id" : "process_class_closure_label",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : []
         },
         "panther_family" : {
            "searchable" : "true",
            "property" : [],
            "description" : "PANTHER family IDs that are associated with this entity.",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "id" : "panther_family",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : []
         },
         "taxon_label" : {
            "display_name" : "Taxon",
            "id" : "taxon_label",
            "indexed" : "true",
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         },
         "panther_family_label" : {
            "description" : "PANTHER families that are associated with this entity.",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "id" : "panther_family_label",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "true",
            "property" : []
         },
         "process_class" : {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Process acc/ID.",
            "indexed" : "true",
            "id" : "process_class",
            "display_name" : "Process"
         },
         "annotation_group" : {
            "description" : "???.",
            "id" : "annotation_group",
            "display_name" : "Annotation group",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         "annotation_group_label" : {
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "display_name" : "Annotation group",
            "id" : "annotation_group_label",
            "indexed" : "true",
            "description" : "???.",
            "property" : [],
            "searchable" : "true"
         },
         "location_list" : {
            "searchable" : "false",
            "property" : [],
            "description" : "",
            "indexed" : "true",
            "id" : "location_list",
            "display_name" : "Location",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : []
         },
         "taxon_closure_label" : {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "display_name" : "Taxon",
            "id" : "taxon_closure_label",
            "indexed" : "true"
         },
         "process_class_closure" : {
            "indexed" : "true",
            "id" : "process_class_closure",
            "display_name" : "Process",
            "description" : "???",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         "function_class_closure_label" : {
            "indexed" : "true",
            "display_name" : "Function",
            "id" : "function_class_closure_label",
            "description" : "???",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "true",
            "property" : []
         },
         "location_list_closure_label" : {
            "display_name" : "Location",
            "id" : "location_list_closure_label",
            "indexed" : "true",
            "description" : "",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         "id" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "A unique (and internal) thing.",
            "display_name" : "ID",
            "id" : "id",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         }
      },
      "_strict" : 0,
      "document_category" : "complex_annotation",
      "result_weights" : "function_class^5.0 enabled_by^4.0 location_list^3.0 process_class^2.0 annotation_group^1.0",
      "filter_weights" : "annotation_group_label^5.0 enabled_by_label^4.5 location_list_closure_label^4.0 process_class_closure_label^3.0 function_class_closure_label^2.0",
      "fields" : [
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "A unique (and internal) thing.",
            "display_name" : "ID",
            "id" : "id",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         {
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "display_name" : "Annotation unit",
            "id" : "annotation_unit",
            "description" : "???.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         {
            "description" : "???.",
            "id" : "annotation_unit_label",
            "display_name" : "Annotation unit",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         {
            "description" : "???.",
            "id" : "annotation_group",
            "display_name" : "Annotation group",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         {
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "display_name" : "Annotation group",
            "id" : "annotation_group_label",
            "indexed" : "true",
            "description" : "???.",
            "property" : [],
            "searchable" : "true"
         },
         {
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Enabled by",
            "id" : "enabled_by",
            "description" : "???"
         },
         {
            "id" : "enabled_by_label",
            "display_name" : "Enabled by",
            "indexed" : "true",
            "description" : "???",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         },
         {
            "searchable" : "true",
            "property" : [],
            "description" : "PANTHER family IDs that are associated with this entity.",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "id" : "panther_family",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : []
         },
         {
            "description" : "PANTHER families that are associated with this entity.",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "id" : "panther_family_label",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "true",
            "property" : []
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "GAF column 13 (taxon).",
            "id" : "taxon",
            "display_name" : "Taxon",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         {
            "display_name" : "Taxon",
            "id" : "taxon_label",
            "indexed" : "true",
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "indexed" : "true",
            "display_name" : "Taxon (IDs)",
            "id" : "taxon_closure",
            "property" : [],
            "searchable" : "false"
         },
         {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "display_name" : "Taxon",
            "id" : "taxon_closure_label",
            "indexed" : "true"
         },
         {
            "property" : [],
            "searchable" : "false",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Function",
            "id" : "function_class",
            "description" : "Function acc/ID."
         },
         {
            "description" : "Common function name.",
            "display_name" : "Function",
            "id" : "function_class_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         {
            "indexed" : "true",
            "display_name" : "Function",
            "id" : "function_class_closure",
            "description" : "???",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         {
            "indexed" : "true",
            "display_name" : "Function",
            "id" : "function_class_closure_label",
            "description" : "???",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "true",
            "property" : []
         },
         {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Process acc/ID.",
            "indexed" : "true",
            "id" : "process_class",
            "display_name" : "Process"
         },
         {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Common process name.",
            "id" : "process_class_label",
            "display_name" : "Process",
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "id" : "process_class_closure",
            "display_name" : "Process",
            "description" : "???",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         {
            "searchable" : "true",
            "property" : [],
            "description" : "???",
            "indexed" : "true",
            "display_name" : "Process",
            "id" : "process_class_closure_label",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "description" : "",
            "indexed" : "true",
            "id" : "location_list",
            "display_name" : "Location",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : []
         },
         {
            "description" : "",
            "indexed" : "true",
            "display_name" : "Location",
            "id" : "location_list_label",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "",
            "id" : "location_list_closure",
            "display_name" : "Location",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         {
            "display_name" : "Location",
            "id" : "location_list_closure_label",
            "indexed" : "true",
            "description" : "",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         {
            "description" : "???",
            "display_name" : "???",
            "id" : "owl_blob_json",
            "indexed" : "false",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "id" : "topology_graph_json",
            "display_name" : "Topology graph (JSON)",
            "indexed" : "false",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string"
         }
      ]
   },
   "bbop_ann_ev_agg" : {
      "display_name" : "Advanced",
      "id" : "bbop_ann_ev_agg",
      "description" : "A description of annotation evidence aggregate for GOlr and AmiGO.",
      "fields_hash" : {
         "bioentity" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Column 1 + columns 2.",
            "id" : "bioentity",
            "display_name" : "Gene/product ID",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         "taxon_closure" : {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "indexed" : "true",
            "id" : "taxon_closure",
            "display_name" : "Taxon (IDs)"
         },
         "panther_family_label" : {
            "display_name" : "Family",
            "id" : "panther_family_label",
            "indexed" : "true",
            "description" : "Families that are associated with this entity.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         },
         "bioentity_label" : {
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Gene/product label",
            "id" : "bioentity_label",
            "description" : "Column 3."
         },
         "panther_family" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Family IDs that are associated with this entity.",
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "Protein family",
            "property" : [],
            "searchable" : "true"
         },
         "taxon_label" : {
            "indexed" : "true",
            "id" : "taxon_label",
            "display_name" : "Taxon",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "true",
            "property" : []
         },
         "annotation_class_label" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Column 5 + ontology.",
            "id" : "annotation_class_label",
            "display_name" : "Annotation class label",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         "annotation_class" : {
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Annotation class",
            "id" : "annotation_class",
            "description" : "Column 5.",
            "property" : [],
            "searchable" : "false"
         },
         "evidence_with" : {
            "indexed" : "true",
            "display_name" : "Evidence with",
            "id" : "evidence_with",
            "description" : "All column 8s for this term/gene product pair",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         "id" : {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "id" : "id",
            "display_name" : "Acc",
            "indexed" : "true",
            "description" : "Gene/product ID."
         },
         "taxon" : {
            "description" : "Column 13: taxon.",
            "id" : "taxon",
            "display_name" : "Taxon",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         "evidence_type_closure" : {
            "searchable" : "false",
            "property" : [],
            "id" : "evidence_type_closure",
            "display_name" : "Evidence type",
            "indexed" : "true",
            "description" : "All evidence for this term/gene product pair",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         "taxon_closure_label" : {
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "id" : "taxon_closure_label",
            "display_name" : "Taxon",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : []
         }
      },
      "_strict" : 0,
      "document_category" : "annotation_evidence_aggregate",
      "result_weights" : "bioentity^4.0 annotation_class^3.0 taxon^2.0",
      "filter_weights" : "evidence_type_closure^4.0 evidence_with^3.0 taxon_closure_label^2.0",
      "fields" : [
         {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "id" : "id",
            "display_name" : "Acc",
            "indexed" : "true",
            "description" : "Gene/product ID."
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Column 1 + columns 2.",
            "id" : "bioentity",
            "display_name" : "Gene/product ID",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         {
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Gene/product label",
            "id" : "bioentity_label",
            "description" : "Column 3."
         },
         {
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Annotation class",
            "id" : "annotation_class",
            "description" : "Column 5.",
            "property" : [],
            "searchable" : "false"
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "description" : "Column 5 + ontology.",
            "id" : "annotation_class_label",
            "display_name" : "Annotation class label",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         {
            "searchable" : "false",
            "property" : [],
            "id" : "evidence_type_closure",
            "display_name" : "Evidence type",
            "indexed" : "true",
            "description" : "All evidence for this term/gene product pair",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "display_name" : "Evidence with",
            "id" : "evidence_with",
            "description" : "All column 8s for this term/gene product pair",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "false",
            "property" : []
         },
         {
            "description" : "Column 13: taxon.",
            "id" : "taxon",
            "display_name" : "Taxon",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         {
            "indexed" : "true",
            "id" : "taxon_label",
            "display_name" : "Taxon",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "searchable" : "true",
            "property" : []
         },
         {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "indexed" : "true",
            "id" : "taxon_closure",
            "display_name" : "Taxon (IDs)"
         },
         {
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "id" : "taxon_closure_label",
            "display_name" : "Taxon",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : []
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Family IDs that are associated with this entity.",
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "Protein family",
            "property" : [],
            "searchable" : "true"
         },
         {
            "display_name" : "Family",
            "id" : "panther_family_label",
            "indexed" : "true",
            "description" : "Families that are associated with this entity.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         }
      ],
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "searchable_extension" : "_searchable",
      "_infile" : "/usr/local/src/amigo/metadata/ann_ev_agg-config.yaml",
      "schema_generating" : "true",
      "weight" : "-10",
      "_outfile" : "/usr/local/src/amigo/metadata/ann_ev_agg-config.yaml"
   },
   "bioentity" : {
      "_strict" : 0,
      "fields_hash" : {
         "isa_partof_closure" : {
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "id" : "isa_partof_closure",
            "display_name" : "Involved in",
            "description" : "Closure of ids/accs over isa and partof.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         "annotation_class_list" : {
            "id" : "annotation_class_list",
            "display_name" : "Direct annotation",
            "indexed" : "true",
            "description" : "Direct annotations.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         "taxon_closure" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Taxonomic group and ancestral groups.",
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon_closure",
            "property" : [],
            "searchable" : "false"
         },
         "regulates_closure_label" : {
            "property" : [],
            "searchable" : "true",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Inferred annotation",
            "id" : "regulates_closure_label",
            "description" : "Bioentities associated with this term or its children (over regulates)."
         },
         "bioentity_internal_id" : {
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "false",
            "display_name" : "This should not be displayed",
            "id" : "bioentity_internal_id",
            "description" : "The bioentity ID used at the database of origin.",
            "property" : [],
            "searchable" : "false"
         },
         "annotation_class_list_label" : {
            "searchable" : "false",
            "property" : [],
            "id" : "annotation_class_list_label",
            "display_name" : "Direct annotation",
            "indexed" : "true",
            "description" : "Direct annotations.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         "taxon" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Taxonomic group",
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon",
            "property" : [],
            "searchable" : "false"
         },
         "synonym" : {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "id" : "synonym",
            "display_name" : "Synonyms",
            "indexed" : "true",
            "description" : "Gene product synonyms."
         },
         "type" : {
            "display_name" : "Type",
            "id" : "type",
            "indexed" : "true",
            "description" : "Type class.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         "database_xref" : {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Database cross-reference.",
            "id" : "database_xref",
            "display_name" : "DB xref",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         "phylo_graph_json" : {
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "display_name" : "This should not be displayed",
            "id" : "phylo_graph_json",
            "indexed" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "property" : [],
            "searchable" : "false"
         },
         "panther_family" : {
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity."
         },
         "taxon_label" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Taxonomic group",
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon_label",
            "property" : [],
            "searchable" : "true"
         },
         "bioentity_label" : {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Symbol or name.",
            "indexed" : "true",
            "id" : "bioentity_label",
            "display_name" : "Label",
            "property" : [],
            "searchable" : "true"
         },
         "panther_family_label" : {
            "display_name" : "PANTHER family",
            "id" : "panther_family_label",
            "indexed" : "true",
            "description" : "PANTHER families that are associated with this entity.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         },
         "bioentity" : {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "id" : "bioentity",
            "display_name" : "Acc",
            "indexed" : "true",
            "description" : "Gene or gene product ID."
         },
         "source" : {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Database source.",
            "indexed" : "true",
            "id" : "source",
            "display_name" : "Source"
         },
         "taxon_closure_label" : {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Taxonomic group and ancestral groups.",
            "display_name" : "Taxon",
            "id" : "taxon_closure_label",
            "indexed" : "true"
         },
         "id" : {
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Acc",
            "id" : "id",
            "description" : "Gene of gene product ID.",
            "property" : [],
            "searchable" : "false"
         },
         "regulates_closure" : {
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "indexed" : "true",
            "id" : "regulates_closure",
            "display_name" : "Inferred annotation",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         "isa_partof_closure_label" : {
            "searchable" : "true",
            "property" : [],
            "description" : "Closure of labels over isa and partof.",
            "indexed" : "true",
            "id" : "isa_partof_closure_label",
            "display_name" : "Involved in",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : []
         },
         "bioentity_name" : {
            "searchable" : "true",
            "property" : [],
            "description" : "The full name of the gene product.",
            "indexed" : "true",
            "id" : "bioentity_name",
            "display_name" : "Name",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : []
         }
      },
      "description" : "Genes and gene products associated with GO terms.",
      "id" : "bioentity",
      "display_name" : "Genes and gene products",
      "fields" : [
         {
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Acc",
            "id" : "id",
            "description" : "Gene of gene product ID.",
            "property" : [],
            "searchable" : "false"
         },
         {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "id" : "bioentity",
            "display_name" : "Acc",
            "indexed" : "true",
            "description" : "Gene or gene product ID."
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Symbol or name.",
            "indexed" : "true",
            "id" : "bioentity_label",
            "display_name" : "Label",
            "property" : [],
            "searchable" : "true"
         },
         {
            "searchable" : "true",
            "property" : [],
            "description" : "The full name of the gene product.",
            "indexed" : "true",
            "id" : "bioentity_name",
            "display_name" : "Name",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : []
         },
         {
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "false",
            "display_name" : "This should not be displayed",
            "id" : "bioentity_internal_id",
            "description" : "The bioentity ID used at the database of origin.",
            "property" : [],
            "searchable" : "false"
         },
         {
            "display_name" : "Type",
            "id" : "type",
            "indexed" : "true",
            "description" : "Type class.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Taxonomic group",
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon",
            "property" : [],
            "searchable" : "false"
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Taxonomic group",
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon_label",
            "property" : [],
            "searchable" : "true"
         },
         {
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "description" : "Taxonomic group and ancestral groups.",
            "indexed" : "true",
            "display_name" : "Taxon",
            "id" : "taxon_closure",
            "property" : [],
            "searchable" : "false"
         },
         {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Taxonomic group and ancestral groups.",
            "display_name" : "Taxon",
            "id" : "taxon_closure_label",
            "indexed" : "true"
         },
         {
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "id" : "isa_partof_closure",
            "display_name" : "Involved in",
            "description" : "Closure of ids/accs over isa and partof.",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false"
         },
         {
            "searchable" : "true",
            "property" : [],
            "description" : "Closure of labels over isa and partof.",
            "indexed" : "true",
            "id" : "isa_partof_closure_label",
            "display_name" : "Involved in",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : []
         },
         {
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "indexed" : "true",
            "id" : "regulates_closure",
            "display_name" : "Inferred annotation",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         {
            "property" : [],
            "searchable" : "true",
            "cardinality" : "multi",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "display_name" : "Inferred annotation",
            "id" : "regulates_closure_label",
            "description" : "Bioentities associated with this term or its children (over regulates)."
         },
         {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "description" : "Database source.",
            "indexed" : "true",
            "id" : "source",
            "display_name" : "Source"
         },
         {
            "id" : "annotation_class_list",
            "display_name" : "Direct annotation",
            "indexed" : "true",
            "description" : "Direct annotations.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "id" : "annotation_class_list_label",
            "display_name" : "Direct annotation",
            "indexed" : "true",
            "description" : "Direct annotations.",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string"
         },
         {
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "id" : "synonym",
            "display_name" : "Synonyms",
            "indexed" : "true",
            "description" : "Gene product synonyms."
         },
         {
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity."
         },
         {
            "display_name" : "PANTHER family",
            "id" : "panther_family_label",
            "indexed" : "true",
            "description" : "PANTHER families that are associated with this entity.",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "true",
            "property" : []
         },
         {
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "display_name" : "This should not be displayed",
            "id" : "phylo_graph_json",
            "indexed" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "property" : [],
            "searchable" : "false"
         },
         {
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "cardinality" : "multi",
            "description" : "Database cross-reference.",
            "id" : "database_xref",
            "display_name" : "DB xref",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         }
      ],
      "document_category" : "bioentity",
      "filter_weights" : "source^7.0 type^6.0 panther_family_label^5.0 annotation_class_list_label^3.5 taxon_closure_label^4.0 regulates_closure_label^2.0",
      "result_weights" : "bioentity^8.0 bioentity_name^7.0 taxon^6.0 panther_family^5.0 type^4.0 source^3.0 annotation_class_list^2.0 synonym^1.0",
      "schema_generating" : "true",
      "_infile" : "/usr/local/src/amigo/metadata/bio-config.yaml",
      "searchable_extension" : "_searchable",
      "boost_weights" : "bioentity^2.0 bioentity_label^2.0 bioentity_name^1.0 bioentity_internal_id^1.0 synonym^1.0 isa_partof_closure_label^1.0 regulates_closure^1.0 regulates_closure_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "_outfile" : "/usr/local/src/amigo/metadata/bio-config.yaml",
      "weight" : "30"
   }
};
/*
 * Package: server.js
 * 
 * Namespace: amigo.data.server
 * 
 * This package was automatically created during AmiGO 2 installation.
 * 
 * Purpose: Useful information about GO and the AmiGO installation.
 *          Also serves as a repository and getter for web
 *          resources such as images.
 * 
 * NOTE: This file is generated dynamically at installation time.
 *       Hard to work with unit tests--hope it's not too bad.
 *       Want to keep this real simple.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Constructor: server
 * 
 * The configuration for the server settings.
 * Essentially a JSONification of the config.pl AmiGO 2 file.
 * 
 * Arguments:
 *  n/a
 */
amigo.data.server = function(){

    // All of the server/instance-specific meta-data.
    var meta_data = {"sources":[],"species_map":{},"app_base":"http://amigo.geneontology.org","galaxy_base":"http://galaxy.berkeleybop.org/","image_base":"http://a2-static2.stanford.edu/images","gp_types":[],"species":[],"ontologies":[],"term_regexp":"all|GO:[0-9]{7}","evidence_codes":{},"bbop_img_star":"http://a2-static2.stanford.edu/images/star.png","html_base":"http://a2-static2.stanford.edu","beta":"0","golr_base":"http://a2-proxy2.stanford.edu/solr/"};

    ///
    /// Break out the data and various functions to access them...
    ///

    /*
     * Function: sources
     * 
     * Access to AmiGO variable sources.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var sources = meta_data.sources;
    this.sources = function(){ return sources; };

    /*
     * Function: species_map
     * 
     * Access to AmiGO variable species_map.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var species_map = meta_data.species_map;
    this.species_map = function(){ return species_map; };

    /*
     * Function: app_base
     * 
     * Access to AmiGO variable app_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var app_base = meta_data.app_base;
    this.app_base = function(){ return app_base; };

    /*
     * Function: galaxy_base
     * 
     * Access to AmiGO variable galaxy_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var galaxy_base = meta_data.galaxy_base;
    this.galaxy_base = function(){ return galaxy_base; };

    /*
     * Function: image_base
     * 
     * Access to AmiGO variable image_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var image_base = meta_data.image_base;
    this.image_base = function(){ return image_base; };

    /*
     * Function: gp_types
     * 
     * Access to AmiGO variable gp_types.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var gp_types = meta_data.gp_types;
    this.gp_types = function(){ return gp_types; };

    /*
     * Function: species
     * 
     * Access to AmiGO variable species.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var species = meta_data.species;
    this.species = function(){ return species; };

    /*
     * Function: ontologies
     * 
     * Access to AmiGO variable ontologies.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var ontologies = meta_data.ontologies;
    this.ontologies = function(){ return ontologies; };

    /*
     * Function: term_regexp
     * 
     * Access to AmiGO variable term_regexp.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var term_regexp = meta_data.term_regexp;
    this.term_regexp = function(){ return term_regexp; };

    /*
     * Function: evidence_codes
     * 
     * Access to AmiGO variable evidence_codes.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var evidence_codes = meta_data.evidence_codes;
    this.evidence_codes = function(){ return evidence_codes; };

    /*
     * Function: bbop_img_star
     * 
     * Access to AmiGO variable bbop_img_star.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var bbop_img_star = meta_data.bbop_img_star;
    this.bbop_img_star = function(){ return bbop_img_star; };

    /*
     * Function: html_base
     * 
     * Access to AmiGO variable html_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var html_base = meta_data.html_base;
    this.html_base = function(){ return html_base; };

    /*
     * Function: beta
     * 
     * Access to AmiGO variable beta.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var beta = meta_data.beta;
    this.beta = function(){ return beta; };

    /*
     * Function: golr_base
     * 
     * Access to AmiGO variable golr_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var golr_base = meta_data.golr_base;
    this.golr_base = function(){ return golr_base; };


    // Does it look like a term?
    var tre_str = meta_data.term_regexp;
    var tre = new RegExp(tre_str);

    /*
     * Function: term_id_p
     * 
     * True or false on whether or not a string looks like a GO term id.
     * 
     * Parameters:
     *  term_id - the string to test
     * 
     * Returns:
     *  boolean
     */
    this.term_id_p = function(term_id){
       var retval = false;
       if( tre.test(term_id) ){
          retval = true;
       }
       return retval;
    };

    /*
     * Function: get_image_resource
     * 
     * Get a named resource from the meta_data hash if possible.
     * 
     * Parameters:
     *  resource - the string id of the resource
     * 
     * Returns:
     * string (url) of resource
     */
    this.get_image_resource = function(resource){

       var retval = null;
       var mangled_res = 'bbop_img_' + resource;

       if( meta_data[mangled_res] ){
          retval = meta_data[mangled_res];
       }
       return retval;
    };
};
/*
 * Package: definitions.js
 * 
 * Namespace: amigo.data.definitions
 * 
 * Purpose: Useful information about common GO datatypes and
 * structures, as well as some constants.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Constructor: definitions
 * 
 * Encapsulate common structures and constants.
 * 
 * Arguments:
 *  n/a
 */
amigo.data.definitions = function(){

    /*
     * Function: gaf_from_golr_fields
     * 
     * A list of fields to generate a GAF from using golr fields.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  list of strings
     */
    this.gaf_from_golr_fields = function(){
	return [
	    'source', // c1
	    'bioentity_internal_id', // c2; not bioentity
	    'bioentity_label', // c3
	    'qualifier', // c4
	    'annotation_class', // c5
	    'reference', // c6
	    'evidence_type', // c7
	    'evidence_with', // c8
	    'aspect', // c9
	    'bioentity_name', // c10
	    'synonym', // c11
	    'type', // c12
	    'taxon', // c13
	    'date', // c14
	    'assigned_by', // c15
	    'annotation_extension_class', // c16
	    'bioentity_isoform' // c17
	];
    };

    /*
     * Function: download_limit
     * 
     * The maximum allowed number of items to download for out server.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  integer
     */
    this.download_limit = function(){
	//return 7500;
	return 10000;
    };

};
/* 
 * Package: xrefs.js
 * 
 * Namespace: amigo.data.xrefs
 * 
 * This package was automatically created during an AmiGO 2 installation
 * from the GO.xrf_abbs file at: "http://www.geneontology.org/doc/GO.xrf_abbs".
 *
 * NOTE: This file is generated dynamically at installation time.
 * Hard to work with unit tests--hope it's not too bad. You have to
 * occasionally copy back to keep the unit tests sane.
 */

// All of the server/instance-specific meta-data.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: xrefs
 * 
 * All the external references that we know about.
 */
amigo.data.xrefs = {
   "tair" : {
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "database" : "The Arabidopsis Information Resource",
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?accession=[example_id]",
      "name" : null,
      "object" : "Accession",
      "fullname" : null,
      "abbreviation" : "TAIR",
      "url_example" : "http://arabidopsis.org/servlets/TairObject?accession=locus:2146653",
      "generic_url" : "http://www.arabidopsis.org/",
      "local_id_syntax" : "^locus:[0-9]{7}$",
      "example_id" : "TAIR:locus:2146653",
      "uri_prefix" : null,
      "id" : null
   },
   "corum" : {
      "url_syntax" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=[example_id]",
      "object" : "Identifier",
      "database" : "CORUM - the Comprehensive Resource of Mammalian protein complexes",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "CORUM:837",
      "id" : null,
      "url_example" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=837",
      "abbreviation" : "CORUM",
      "generic_url" : "http://mips.gsf.de/genre/proj/corum/"
   },
   "sabio-rk" : {
      "url_syntax" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=[example_id]",
      "database" : "SABIO Reaction Kinetics",
      "name" : null,
      "object" : "reaction",
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "description" : "The SABIO-RK (System for the Analysis of Biochemical Pathways - Reaction Kinetics) is a web-based application based on the SABIO relational database that contains information about biochemical reactions, their kinetic equations with their parameters, and the experimental conditions under which these parameters were measured.",
      "example_id" : "SABIO-RK:1858",
      "id" : null,
      "url_example" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=1858",
      "abbreviation" : "SABIO-RK",
      "generic_url" : "http://sabio.villa-bosch.de/"
   },
   "sgdid" : {
      "database" : "Saccharomyces Genome Database",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "name" : null,
      "object" : "Identifier for SGD Loci",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "example_id" : "SGD:S000006169",
      "uri_prefix" : null,
      "local_id_syntax" : "^S[0-9]{9}$",
      "id" : null,
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=S000006169",
      "abbreviation" : "SGDID",
      "generic_url" : "http://www.yeastgenome.org/"
   },
   "sgd_ref" : {
      "abbreviation" : "SGD_REF",
      "url_example" : "http://db.yeastgenome.org/cgi-bin/reference/reference.pl?dbid=S000049602",
      "generic_url" : "http://www.yeastgenome.org/",
      "uri_prefix" : null,
      "example_id" : "SGD_REF:S000049602",
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "name" : null,
      "database" : "Saccharomyces Genome Database",
      "object" : "Literature Reference Identifier",
      "fullname" : null
   },
   "gb" : {
      "entity_type" : "PR:000000001 ! protein ",
      "datatype" : null,
      "name" : null,
      "database" : "GenBank",
      "object" : "Sequence accession",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "fullname" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "abbreviation" : "GB",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "example_id" : "GB:AA816246",
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "uri_prefix" : null,
      "local_id_syntax" : "^[A-Z]{2}[0-9]{6}$",
      "id" : null
   },
   "geneid" : {
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "database" : "NCBI Gene",
      "object" : "Identifier",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "abbreviation" : "GeneID",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "NCBI_Gene:4771",
      "local_id_syntax" : "^\\d+$"
   },
   "go" : {
      "uri_prefix" : null,
      "example_id" : "GO:0004352",
      "local_id_syntax" : "^\\d{7}$",
      "id" : null,
      "url_example" : "http://amigo.geneontology.org/cgi-bin/amigo/term-details.cgi?term=GO:0004352",
      "abbreviation" : "GO",
      "generic_url" : "http://amigo.geneontology.org/",
      "name" : null,
      "url_syntax" : "http://amigo.geneontology.org/cgi-bin/amigo/term-details.cgi?term=GO:[example_id]",
      "object" : "Identifier",
      "database" : "Gene Ontology Database",
      "fullname" : null,
      "entity_type" : "GO:0032991 ! macromolecular complex",
      "datatype" : null
   },
   "sgd" : {
      "abbreviation" : "SGD",
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=S000006169",
      "generic_url" : "http://www.yeastgenome.org/",
      "local_id_syntax" : "^S[0-9]{9}$",
      "uri_prefix" : null,
      "example_id" : "SGD:S000006169",
      "id" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "object" : "Identifier for SGD Loci",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "name" : null,
      "database" : "Saccharomyces Genome Database",
      "fullname" : null
   },
   "locusid" : {
      "local_id_syntax" : "^\\d+$",
      "example_id" : "NCBI_Gene:4771",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "LocusID",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "database" : "NCBI Gene",
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null
   },
   "pubchem_compound" : {
      "datatype" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "fullname" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=[example_id]",
      "name" : null,
      "object" : "Identifier",
      "database" : "NCBI PubChem database of chemical structures",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=2244",
      "abbreviation" : "PubChem_Compound",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "PubChem_Compound:2244",
      "local_id_syntax" : "^[0-9]+$"
   },
   "rfam" : {
      "fullname" : null,
      "object" : "accession",
      "url_syntax" : "http://rfam.sanger.ac.uk/family/[example_id]",
      "name" : null,
      "database" : "Rfam database of RNA families",
      "datatype" : null,
      "id" : null,
      "example_id" : "Rfam:RF00012",
      "uri_prefix" : null,
      "generic_url" : "http://rfam.sanger.ac.uk/",
      "abbreviation" : "Rfam",
      "url_example" : "http://rfam.sanger.ac.uk/family/RF00012"
   },
   "reac" : {
      "datatype" : null,
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "name" : null,
      "object" : "Identifier",
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "fullname" : null,
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "abbreviation" : "REAC",
      "generic_url" : "http://www.reactome.org/",
      "example_id" : "Reactome:REACT_604",
      "uri_prefix" : null,
      "local_id_syntax" : "^REACT_[0-9]+$",
      "id" : null
   },
   "swiss-prot" : {
      "abbreviation" : "Swiss-Prot",
      "replaced_by" : "UniProtKB",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "generic_url" : "http://www.uniprot.org",
      "uri_prefix" : null,
      "description" : "A curated protein sequence database which provides a high level of annotation and a minimal level of redundancy",
      "example_id" : "Swiss-Prot:P51587",
      "id" : null,
      "datatype" : null,
      "is_obsolete" : "true",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "database" : "UniProtKB/Swiss-Prot",
      "object" : "Accession",
      "name" : null,
      "fullname" : null
   },
   "ensemblplants/gramene" : {
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "name" : null,
      "object" : "Identifier",
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "generic_url" : "http://plants.ensembl.org/",
      "abbreviation" : "EnsemblPlants/Gramene",
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "id" : null,
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "uri_prefix" : null
   },
   "cgd" : {
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "abbreviation" : "CGD",
      "generic_url" : "http://www.candidagenome.org/",
      "uri_prefix" : null,
      "example_id" : "CGD:CAL0005516",
      "local_id_syntax" : "^(CAL|CAF)[0-9]{7}$",
      "id" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "object" : "Identifier for CGD Loci",
      "name" : null,
      "database" : "Candida Genome Database",
      "fullname" : null
   },
   "sgd_locus" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "database" : "Saccharomyces Genome Database",
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "datatype" : null,
      "id" : null,
      "example_id" : "SGD_LOCUS:GAL4",
      "uri_prefix" : null,
      "generic_url" : "http://www.yeastgenome.org/",
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?locus=GAL4",
      "abbreviation" : "SGD_LOCUS"
   },
   "parkinsonsuk-ucl" : {
      "abbreviation" : "ParkinsonsUK-UCL",
      "url_example" : null,
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology",
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "database" : "Parkinsons Disease Gene Ontology Initiative",
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "fullname" : null
   },
   "interpro" : {
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "abbreviation" : "INTERPRO",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "InterPro:IPR000001",
      "local_id_syntax" : "^IPR\\d{6}$",
      "datatype" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "object" : "Identifier",
      "name" : null,
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "database" : "InterPro database of protein domains and motifs"
   },
   "biocyc" : {
      "datatype" : null,
      "fullname" : null,
      "object" : "Identifier",
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "name" : null,
      "database" : "BioCyc collection of metabolic pathway databases",
      "generic_url" : "http://biocyc.org/",
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=PWY-5271",
      "abbreviation" : "BioCyc",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "BioCyc:PWY-5271"
   },
   "genedb_lmajor" : {
      "fullname" : null,
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=leish&name=[example_id]",
      "is_obsolete" : "true",
      "id" : null,
      "local_id_syntax" : "^LmjF\\.\\d+\\.\\d+$",
      "url_example" : "http://www.genedb.org/genedb/Search?organism=leish&name=LM5.32",
      "replaced_by" : "GeneDB",
      "object" : "Gene identifier",
      "database" : "Leishmania major GeneDB",
      "name" : null,
      "datatype" : null,
      "example_id" : "GeneDB_Lmajor:LM5.32",
      "uri_prefix" : null,
      "generic_url" : "http://www.genedb.org/genedb/leish/",
      "shorthand_name" : "Lmajor",
      "abbreviation" : "GeneDB_Lmajor"
   },
   "biomdid" : {
      "name" : null,
      "object" : "Accession",
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "database" : "BioModels Database",
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "BIOMD:BIOMD0000000045",
      "id" : null,
      "abbreviation" : "BIOMDID",
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "generic_url" : "http://www.ebi.ac.uk/biomodels/"
   },
   "aspgdid" : {
      "uri_prefix" : null,
      "example_id" : "AspGD:ASPL0000067538",
      "local_id_syntax" : "^ASPL[0-9]{10}$",
      "id" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "abbreviation" : "AspGDID",
      "generic_url" : "http://www.aspergillusgenome.org/",
      "name" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "database" : "Aspergillus Genome Database",
      "object" : "Identifier for AspGD Loci",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null
   },
   "jcvi_ref" : {
      "generic_url" : "http://cmr.jcvi.org/",
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "abbreviation" : "JCVI_REF",
      "id" : null,
      "example_id" : "JCVI_REF:GO_ref",
      "uri_prefix" : null,
      "datatype" : null,
      "fullname" : null,
      "object" : "Reference locator",
      "url_syntax" : null,
      "name" : null,
      "database" : "J. Craig Venter Institute"
   },
   "img" : {
      "uri_prefix" : null,
      "example_id" : "IMG:640008772",
      "id" : null,
      "abbreviation" : "IMG",
      "url_example" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=640008772",
      "generic_url" : "http://img.jgi.doe.gov",
      "url_syntax" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=[example_id]",
      "name" : null,
      "database" : "Integrated Microbial Genomes; JGI web site for genome annotation",
      "object" : "Identifier",
      "fullname" : null,
      "datatype" : null
   },
   "cazy" : {
      "abbreviation" : "CAZY",
      "url_example" : "http://www.cazy.org/PL11.html",
      "generic_url" : "http://www.cazy.org/",
      "local_id_syntax" : "^(CE|GH|GT|PL)\\d+$",
      "example_id" : "CAZY:PL11",
      "description" : "The CAZy database describes the families of structurally-related catalytic and carbohydrate-binding modules (or functional domains) of enzymes that degrade, modify, or create glycosidic bonds.",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.cazy.org/[example_id].html",
      "name" : null,
      "database" : "Carbohydrate Active EnZYmes",
      "object" : "Identifier",
      "fullname" : null
   },
   "hamap" : {
      "example_id" : "HAMAP:MF_00031",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "HAMAP",
      "url_example" : "http://hamap.expasy.org/unirule/MF_00131",
      "generic_url" : "http://hamap.expasy.org/",
      "url_syntax" : "http://hamap.expasy.org/unirule/[example_id]",
      "database" : "High-quality Automated and Manual Annotation of microbial Proteomes",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "datatype" : null
   },
   "paint_ref" : {
      "fullname" : null,
      "database" : "Phylogenetic Annotation INference Tool References",
      "url_syntax" : "http://www.geneontology.org/gene-associations/submission/paint/[example_id]/[example_id].txt",
      "object" : "Reference locator",
      "name" : null,
      "datatype" : null,
      "id" : null,
      "example_id" : "PAINT_REF:PTHR10046",
      "uri_prefix" : null,
      "generic_url" : "http://www.pantherdb.org/",
      "abbreviation" : "PAINT_REF",
      "url_example" : "http://www.geneontology.org/gene-associations/submission/paint/PTHR10046/PTHR10046.txt"
   },
   "jcvi_ath1" : {
      "generic_url" : "http://www.tigr.org/tdb/e2k1/ath1/ath1.shtml",
      "url_example" : null,
      "abbreviation" : "JCVI_Ath1",
      "id" : null,
      "example_id" : "JCVI_Ath1:At3g01440",
      "uri_prefix" : null,
      "datatype" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "Arabidopsis thaliana database at the J. Craig Venter Institute",
      "object" : "Accession"
   },
   "obo_sf_po" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "OBO_SF_PO:3184921",
      "generic_url" : "http://sourceforge.net/tracker/?func=browse&group_id=76834&atid=835555",
      "abbreviation" : "OBO_SF_PO",
      "url_example" : "https://sourceforge.net/tracker/index.php?func=detail&aid=3184921&group_id=76834&atid=835555",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "https://sourceforge.net/tracker/index.php?func=detail&aid=[example_id]&group_id=76834&atid=835555",
      "object" : "Term request",
      "database" : "Source Forge OBO Plant Ontology (PO) term request tracker",
      "datatype" : null
   },
   "gene3d" : {
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=[example_id]",
      "database" : "Domain Architecture Classification",
      "object" : "Accession",
      "generic_url" : "http://gene3d.biochem.ucl.ac.uk/Gene3D/",
      "abbreviation" : "Gene3D",
      "url_example" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=G3DSA%3A3.30.390.30",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "Gene3D:G3DSA:3.30.390.30"
   },
   "pmid" : {
      "datatype" : null,
      "fullname" : null,
      "database" : "PubMed",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "abbreviation" : "PMID",
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "id" : null,
      "local_id_syntax" : "^[0-9]+$",
      "uri_prefix" : null,
      "example_id" : "PMID:4208797"
   },
   "subtilist" : {
      "fullname" : null,
      "object" : "Accession",
      "url_syntax" : null,
      "name" : null,
      "database" : "Bacillus subtilis Genome Sequence Project",
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein",
      "id" : null,
      "example_id" : "SUBTILISTG:BG11384",
      "uri_prefix" : null,
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "abbreviation" : "SUBTILIST",
      "url_example" : null
   },
   "wbls" : {
      "datatype" : null,
      "entity_type" : "WBls:0000075 ! nematoda Life Stage",
      "fullname" : null,
      "url_syntax" : null,
      "database" : "C. elegans development",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WBls",
      "url_example" : null,
      "id" : null,
      "local_id_syntax" : "[0-9]{7}",
      "example_id" : "WBls:0000010",
      "uri_prefix" : null
   },
   "cog_function" : {
      "abbreviation" : "COG_Function",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=H",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "example_id" : "COG_Function:H",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "database" : "NCBI COG function",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=[example_id]",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null
   },
   "roslin_institute" : {
      "generic_url" : "http://www.roslin.ac.uk/",
      "abbreviation" : "Roslin_Institute",
      "url_example" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "datatype" : null,
      "fullname" : null,
      "database" : "Roslin Institute",
      "url_syntax" : null,
      "name" : null,
      "object" : null
   },
   "mi" : {
      "datatype" : null,
      "name" : null,
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "object" : "Interaction identifier",
      "url_syntax" : null,
      "fullname" : null,
      "url_example" : null,
      "abbreviation" : "MI",
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "uri_prefix" : null,
      "example_id" : "MI:0018",
      "id" : null
   },
   "mod" : {
      "fullname" : null,
      "name" : null,
      "object" : "Protein modification identifier",
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "MOD:00219",
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "abbreviation" : "MOD",
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219"
   },
   "mgi" : {
      "abbreviation" : "MGI",
      "url_example" : "http://www.informatics.jax.org/accession/MGI:80863",
      "generic_url" : "http://www.informatics.jax.org/",
      "local_id_syntax" : "^MGI:[0-9]{5,}$",
      "uri_prefix" : null,
      "example_id" : "MGI:MGI:80863",
      "id" : null,
      "entity_type" : "VariO:0001 ! variation",
      "datatype" : null,
      "url_syntax" : "http://www.informatics.jax.org/accession/[example_id]",
      "database" : "Mouse Genome Informatics",
      "name" : null,
      "object" : "Accession",
      "fullname" : null
   },
   "pfam" : {
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/",
      "url_example" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?PF00046",
      "abbreviation" : "Pfam",
      "id" : null,
      "description" : "Pfam is a collection of protein families represented by sequence alignments and hidden Markov models (HMMs)",
      "example_id" : "Pfam:PF00046",
      "uri_prefix" : null,
      "datatype" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "url_syntax" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?[example_id]",
      "name" : null,
      "object" : "Accession",
      "database" : "Pfam database of protein families"
   },
   "pro" : {
      "entity_type" : "PR:000000001 ! protein ",
      "datatype" : null,
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "database" : "Protein Ontology",
      "name" : null,
      "object" : "Identifer",
      "fullname" : null,
      "abbreviation" : "PRO",
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "local_id_syntax" : "^[0-9]{9}$",
      "example_id" : "PR:000025380",
      "uri_prefix" : null,
      "id" : null
   },
   "jcvi_egad" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "JCVI_EGAD:74462",
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "JCVI_EGAD",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "fullname" : null,
      "object" : "Accession",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]",
      "name" : null,
      "database" : "EGAD database at the J. Craig Venter Institute",
      "datatype" : null
   },
   "broad" : {
      "datatype" : null,
      "fullname" : null,
      "database" : "Broad Institute",
      "url_syntax" : null,
      "object" : null,
      "name" : null,
      "generic_url" : "http://www.broad.mit.edu/",
      "abbreviation" : "Broad",
      "url_example" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null
   },
   "genedb" : {
      "database" : "GeneDB",
      "url_syntax" : "http://www.genedb.org/gene/[example_id]",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "local_id_syntax" : "^Tb\\d+\\.[A-Za-z0-9]+\\.\\d+$",
      "example_id" : "PF3D7_1467300",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "GeneDB",
      "url_example" : "http://www.genedb.org/gene/PF3D7_1467300",
      "generic_url" : "http://www.genedb.org/gene/"
   },
   "echobase" : {
      "example_id" : "EchoBASE:EB0231",
      "uri_prefix" : null,
      "local_id_syntax" : "^EB[0-9]{4}$",
      "id" : null,
      "url_example" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=EB0231",
      "abbreviation" : "EchoBASE",
      "generic_url" : "http://www.ecoli-york.org/",
      "url_syntax" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=[example_id]",
      "database" : "EchoBASE post-genomic database for Escherichia coli",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null
   },
   "agricola_ind" : {
      "id" : null,
      "example_id" : "AGRICOLA_IND:IND23252955",
      "uri_prefix" : null,
      "generic_url" : "http://agricola.nal.usda.gov/",
      "url_example" : null,
      "abbreviation" : "AGRICOLA_IND",
      "fullname" : null,
      "url_syntax" : null,
      "database" : "AGRICultural OnLine Access",
      "name" : null,
      "object" : "AGRICOLA IND number",
      "datatype" : null
   },
   "zfin" : {
      "fullname" : null,
      "database" : "Zebrafish Information Network",
      "url_syntax" : "http://zfin.org/cgi-bin/ZFIN_jump?record=[example_id]",
      "name" : null,
      "object" : "Identifier",
      "datatype" : null,
      "entity_type" : "VariO:0001 ! variation",
      "id" : null,
      "example_id" : "ZFIN:ZDB-GENE-990415-103",
      "uri_prefix" : null,
      "local_id_syntax" : "^ZDB-(GENE|GENO|MRPHLNO)-[0-9]{6}-[0-9]+$",
      "generic_url" : "http://zfin.org/",
      "url_example" : "http://zfin.org/cgi-bin/ZFIN_jump?record=ZDB-GENE-990415-103",
      "abbreviation" : "ZFIN"
   },
   "tigr_genprop" : {
      "id" : null,
      "local_id_syntax" : "^GenProp[0-9]{4}$",
      "example_id" : "JCVI_GenProp:GenProp0120",
      "uri_prefix" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "TIGR_GenProp",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "fullname" : null,
      "object" : "Accession",
      "name" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "datatype" : null,
      "entity_type" : "GO:0008150 ! biological process"
   },
   "ddb_ref" : {
      "datatype" : null,
      "fullname" : null,
      "object" : "Literature Reference Identifier",
      "name" : null,
      "database" : "dictyBase literature references",
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "generic_url" : "http://dictybase.org",
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "abbreviation" : "DDB_REF",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "dictyBase_REF:10157"
   },
   "tigr" : {
      "id" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.jcvi.org/",
      "url_example" : null,
      "abbreviation" : "TIGR",
      "fullname" : null,
      "url_syntax" : null,
      "database" : "J. Craig Venter Institute",
      "object" : null,
      "name" : null,
      "datatype" : null
   },
   "po_ref" : {
      "abbreviation" : "PO_REF",
      "url_example" : "http://wiki.plantontology.org:8080/index.php/PO_REF:00001",
      "generic_url" : "http://wiki.plantontology.org:8080/index.php/PO_references",
      "example_id" : "PO_REF:00001",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://wiki.plantontology.org:8080/index.php/PO_REF:[example_id]",
      "name" : null,
      "database" : "Plant Ontology custom references",
      "object" : "Reference identifier",
      "fullname" : null
   },
   "ipi" : {
      "url_syntax" : null,
      "database" : "International Protein Index",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "IPI:IPI00000005.1",
      "id" : null,
      "url_example" : null,
      "abbreviation" : "IPI",
      "generic_url" : "http://www.ebi.ac.uk/IPI/IPIhelp.html"
   },
   "asap" : {
      "url_example" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=ABE-0000008",
      "abbreviation" : "ASAP",
      "generic_url" : "https://asap.ahabs.wisc.edu/annotation/php/ASAP1.htm",
      "example_id" : "ASAP:ABE-0000008",
      "uri_prefix" : null,
      "id" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "url_syntax" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=[example_id]",
      "database" : "A Systematic Annotation Package for Community Analysis of Genomes",
      "name" : null,
      "object" : "Feature identifier",
      "fullname" : null
   },
   "nif_subcellular" : {
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.neurolex.org/wiki/[example_id]",
      "name" : null,
      "database" : "Neuroscience Information Framework standard ontology, subcellular hierarchy",
      "object" : "ontology term",
      "generic_url" : "http://www.neurolex.org/wiki",
      "abbreviation" : "NIF_Subcellular",
      "url_example" : "http://www.neurolex.org/wiki/sao1770195789",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "NIF_Subcellular:sao1186862860"
   },
   "vmd" : {
      "uri_prefix" : null,
      "example_id" : "VMD:109198",
      "id" : null,
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=109198",
      "abbreviation" : "VMD",
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=[example_id]",
      "object" : "Gene identifier",
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "name" : null,
      "fullname" : null,
      "datatype" : null
   },
   "muscletrait" : {
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "uri_prefix" : null,
      "example_id" : null,
      "id" : null,
      "abbreviation" : "MuscleTRAIT",
      "url_example" : null,
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "name" : null,
      "database" : "TRAnscript Integrated Table",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "datatype" : null
   },
   "genprotec" : {
      "fullname" : null,
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "database" : "GenProtEC E. coli genome and proteome database",
      "datatype" : null,
      "id" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "generic_url" : "http://genprotec.mbl.edu/",
      "url_example" : null,
      "abbreviation" : "GenProtEC"
   },
   "sgn_ref" : {
      "database" : "Sol Genomics Network",
      "url_syntax" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=[example_id]",
      "name" : null,
      "object" : "Reference identifier",
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "SGN_ref:861",
      "id" : null,
      "abbreviation" : "SGN_ref",
      "url_example" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=861",
      "generic_url" : "http://www.sgn.cornell.edu/"
   },
   "phenoscape" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://phenoscape.org/",
      "url_example" : null,
      "abbreviation" : "PhenoScape",
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "PhenoScape Knowledgebase",
      "object" : null,
      "datatype" : null
   },
   "pirsf" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "PIRSF:SF002327",
      "generic_url" : "http://pir.georgetown.edu/pirsf/",
      "url_example" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=SF002327",
      "abbreviation" : "PIRSF",
      "fullname" : null,
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=[example_id]",
      "object" : "Identifier",
      "database" : "PIR Superfamily Classification System",
      "name" : null,
      "datatype" : null
   },
   "cas" : {
      "url_syntax" : null,
      "database" : "CAS Chemical Registry",
      "object" : "Identifier",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "description" : "CAS REGISTRY is the most authoritative collection of disclosed chemical substance information, containing more than 54 million organic and inorganic substances and 62 million sequences. CAS REGISTRY covers substances identified from the scientific literature from 1957 to the present, with additional substances going back to the early 1900s.",
      "uri_prefix" : null,
      "example_id" : "CAS:58-08-2",
      "id" : null,
      "url_example" : null,
      "abbreviation" : "CAS",
      "generic_url" : "http://www.cas.org/expertise/cascontent/registry/index.html"
   },
   "nc-iubmb" : {
      "fullname" : null,
      "url_syntax" : null,
      "name" : null,
      "database" : "Nomenclature Committee of the International Union of Biochemistry and Molecular Biology",
      "object" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://www.chem.qmw.ac.uk/iubmb/",
      "url_example" : null,
      "abbreviation" : "NC-IUBMB"
   },
   "ddb" : {
      "name" : null,
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "database" : "dictyBase",
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "dictyBase:DDB_G0277859",
      "local_id_syntax" : "^DDB_G[0-9]{7}$",
      "id" : null,
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "abbreviation" : "DDB",
      "generic_url" : "http://dictybase.org"
   },
   "pamgo" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "Plant-Associated Microbe Gene Ontology Interest Group",
      "object" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://pamgo.vbi.vt.edu/",
      "abbreviation" : "PAMGO",
      "url_example" : null
   },
   "mips_funcat" : {
      "datatype" : null,
      "url_syntax" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=[example_id]",
      "database" : "MIPS Functional Catalogue",
      "object" : "Identifier",
      "name" : null,
      "fullname" : null,
      "url_example" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=11.02",
      "abbreviation" : "MIPS_funcat",
      "generic_url" : "http://mips.gsf.de/proj/funcatDB/",
      "uri_prefix" : null,
      "example_id" : "MIPS_funcat:11.02",
      "id" : null
   },
   "ddbj" : {
      "datatype" : null,
      "url_syntax" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=[example_id]",
      "name" : null,
      "object" : "Sequence accession",
      "database" : "DNA Databank of Japan",
      "fullname" : null,
      "url_example" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=AA816246",
      "abbreviation" : "DDBJ",
      "generic_url" : "http://www.ddbj.nig.ac.jp/",
      "uri_prefix" : null,
      "example_id" : "DDBJ:AA816246",
      "id" : null
   },
   "wb" : {
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null,
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "object" : "Gene identifier",
      "database" : "WormBase database of nematode biology",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "WB",
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "generic_url" : "http://www.wormbase.org/",
      "local_id_syntax" : "^WB(Gene|Var|RNAi|Transgene)[0-9]{8}$",
      "uri_prefix" : null,
      "example_id" : "WB:WBGene00003001",
      "id" : null
   },
   "ensembl" : {
      "name" : null,
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "database" : "Ensembl database of automatically annotated genomic data",
      "object" : "Identifier (unspecified)",
      "fullname" : null,
      "entity_type" : "SO:0000673 ! transcript",
      "datatype" : null,
      "local_id_syntax" : "^ENS[A-Z0-9]{10,17}$",
      "uri_prefix" : null,
      "example_id" : "ENSEMBL:ENSP00000265949",
      "id" : null,
      "abbreviation" : "Ensembl",
      "url_example" : "http://www.ensembl.org/id/ENSP00000265949",
      "generic_url" : "http://www.ensembl.org/"
   },
   "genbank" : {
      "id" : null,
      "local_id_syntax" : "^[A-Z]{2}[0-9]{6}$",
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "uri_prefix" : null,
      "example_id" : "GB:AA816246",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "abbreviation" : "GenBank",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "fullname" : null,
      "object" : "Sequence accession",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "name" : null,
      "database" : "GenBank",
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein "
   },
   "nmpdr" : {
      "datatype" : null,
      "fullname" : null,
      "database" : "National Microbial Pathogen Data Resource",
      "url_syntax" : "http://www.nmpdr.org/linkin.cgi?id=[example_id]",
      "name" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.nmpdr.org",
      "url_example" : "http://www.nmpdr.org/linkin.cgi?id=fig|306254.1.peg.183",
      "abbreviation" : "NMPDR",
      "id" : null,
      "example_id" : "NMPDR:fig|306254.1.peg.183",
      "uri_prefix" : null
   },
   "seed" : {
      "fullname" : null,
      "url_syntax" : "http://www.theseed.org/linkin.cgi?id=[example_id]",
      "database" : "The SEED;",
      "name" : null,
      "object" : "identifier",
      "datatype" : null,
      "id" : null,
      "description" : "Project to annotate the first 1000 sequenced genomes, develop detailed metabolic reconstructions, and construct the corresponding stoichiometric matrices",
      "example_id" : "SEED:fig|83331.1.peg.1",
      "uri_prefix" : null,
      "generic_url" : "http://www.theseed.org",
      "url_example" : "http://www.theseed.org/linkin.cgi?id=fig|83331.1.peg.1",
      "abbreviation" : "SEED"
   },
   "psort" : {
      "generic_url" : "http://www.psort.org/",
      "abbreviation" : "PSORT",
      "url_example" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "PSORT protein subcellular localization databases and prediction tools for bacteria",
      "object" : null
   },
   "wikipedia" : {
      "generic_url" : "http://en.wikipedia.org/",
      "url_example" : "http://en.wikipedia.org/wiki/Endoplasmic_reticulum",
      "abbreviation" : "Wikipedia",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "Wikipedia:Endoplasmic_reticulum",
      "datatype" : null,
      "fullname" : null,
      "object" : "Page Reference Identifier",
      "url_syntax" : "http://en.wikipedia.org/wiki/[example_id]",
      "database" : "Wikipedia",
      "name" : null
   },
   "aracyc" : {
      "generic_url" : "http://www.arabidopsis.org/biocyc/index.jsp",
      "abbreviation" : "AraCyc",
      "url_example" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=PWYQT-62",
      "id" : null,
      "example_id" : "AraCyc:PWYQT-62",
      "uri_prefix" : null,
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=[example_id]",
      "database" : "AraCyc metabolic pathway database for Arabidopsis thaliana",
      "name" : null,
      "object" : "Identifier"
   },
   "mitre" : {
      "datatype" : null,
      "fullname" : null,
      "database" : "The MITRE Corporation",
      "url_syntax" : null,
      "object" : null,
      "name" : null,
      "generic_url" : "http://www.mitre.org/",
      "url_example" : null,
      "abbreviation" : "MITRE",
      "id" : null,
      "example_id" : null,
      "uri_prefix" : null
   },
   "obi" : {
      "fullname" : null,
      "url_syntax" : null,
      "object" : "Identifier",
      "database" : "Ontology for Biomedical Investigations",
      "name" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "OBI:0000038",
      "local_id_syntax" : "^\\d{7}$",
      "generic_url" : "http://obi-ontology.org/page/Main_Page",
      "url_example" : null,
      "abbreviation" : "OBI"
   },
   "mtbbase" : {
      "datatype" : null,
      "fullname" : null,
      "database" : "Collection and Refinement of Physiological Data on Mycobacterium tuberculosis",
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "generic_url" : "http://www.ark.in-berlin.de/Site/MTBbase.html",
      "abbreviation" : "MTBBASE",
      "url_example" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null
   },
   "refseq_prot" : {
      "example_id" : "RefSeq_Prot:YP_498627",
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=YP_498627",
      "abbreviation" : "RefSeq_Prot",
      "replaced_by" : "RefSeq",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "name" : null,
      "database" : "RefSeq (Protein)",
      "object" : "Identifier",
      "fullname" : null,
      "is_obsolete" : "true",
      "datatype" : null
   },
   "maizegdb" : {
      "example_id" : "MaizeGDB:881225",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "MaizeGDB",
      "url_example" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=881225",
      "generic_url" : "http://www.maizegdb.org",
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=[example_id]",
      "object" : "MaizeGDB Object ID Number",
      "name" : null,
      "database" : "MaizeGDB",
      "fullname" : null,
      "datatype" : null
   },
   "pombase" : {
      "generic_url" : "http://www.pombase.org/",
      "url_example" : "http://www.pombase.org/spombe/result/SPBC11B10.09",
      "abbreviation" : "PomBase",
      "id" : null,
      "example_id" : "PomBase:SPBC11B10.09",
      "uri_prefix" : null,
      "local_id_syntax" : "^S\\w+(\\.)?\\w+(\\.)?$",
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene ",
      "fullname" : null,
      "url_syntax" : "http://www.pombase.org/spombe/result/[example_id]",
      "database" : "PomBase",
      "name" : null,
      "object" : "Identifier"
   },
   "jcvi_tigrfams" : {
      "datatype" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "name" : null,
      "object" : "Accession",
      "generic_url" : "http://search.jcvi.org/",
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "abbreviation" : "JCVI_TIGRFAMS",
      "id" : null,
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "uri_prefix" : null
   },
   "biosis" : {
      "abbreviation" : "BIOSIS",
      "url_example" : null,
      "generic_url" : "http://www.biosis.org/",
      "uri_prefix" : null,
      "example_id" : "BIOSIS:200200247281",
      "id" : null,
      "datatype" : null,
      "database" : "BIOSIS previews",
      "url_syntax" : null,
      "name" : null,
      "object" : "Identifier",
      "fullname" : null
   },
   "psi-mi" : {
      "example_id" : "MI:0018",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "PSI-MI",
      "url_example" : null,
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "url_syntax" : null,
      "object" : "Interaction identifier",
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "name" : null,
      "fullname" : null,
      "datatype" : null
   },
   "cdd" : {
      "datatype" : null,
      "object" : "Identifier",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=[example_id]",
      "name" : null,
      "database" : "Conserved Domain Database at NCBI",
      "fullname" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=34222",
      "abbreviation" : "CDD",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=cdd",
      "uri_prefix" : null,
      "example_id" : "CDD:34222",
      "id" : null
   },
   "ncbi_gi" : {
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "object" : "Identifier",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "name" : null,
      "database" : "NCBI databases",
      "fullname" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=113194944",
      "abbreviation" : "NCBI_gi",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "example_id" : "NCBI_gi:113194944",
      "uri_prefix" : null,
      "local_id_syntax" : "^[0-9]{6,}$",
      "id" : null
   },
   "obo_rel" : {
      "name" : null,
      "url_syntax" : null,
      "object" : "Identifier",
      "database" : "OBO relation ontology",
      "fullname" : null,
      "datatype" : null,
      "example_id" : "OBO_REL:part_of",
      "uri_prefix" : null,
      "id" : null,
      "url_example" : null,
      "abbreviation" : "OBO_REL",
      "generic_url" : "http://www.obofoundry.org/ro/"
   },
   "intact" : {
      "entity_type" : "MI:0315 ! protein complex ",
      "datatype" : null,
      "url_syntax" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=[example_id]",
      "name" : null,
      "object" : "Accession",
      "database" : "IntAct protein interaction database",
      "fullname" : null,
      "abbreviation" : "IntAct",
      "url_example" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=EBI-17086",
      "generic_url" : "http://www.ebi.ac.uk/intact/",
      "local_id_syntax" : "^[0-9]+$",
      "example_id" : "IntAct:EBI-17086",
      "uri_prefix" : null,
      "id" : null
   },
   "goc" : {
      "url_example" : null,
      "abbreviation" : "GOC",
      "generic_url" : "http://www.geneontology.org/",
      "uri_prefix" : null,
      "example_id" : null,
      "id" : null,
      "datatype" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "Gene Ontology Consortium",
      "object" : null,
      "fullname" : null
   },
   "fbbt" : {
      "example_id" : "FBbt:00005177",
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:00005177",
      "abbreviation" : "FBbt",
      "generic_url" : "http://flybase.org/",
      "name" : null,
      "url_syntax" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:[example_id]",
      "database" : "Drosophila gross anatomy",
      "object" : "Identifier",
      "fullname" : null,
      "datatype" : null
   },
   "gr_gene" : {
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "datatype" : null,
      "fullname" : null,
      "object" : "Gene identifier",
      "database" : null,
      "url_syntax" : "http://www.gramene.org/db/genes/search_gene?acc=[example_id]",
      "name" : null,
      "generic_url" : "http://www.gramene.org/",
      "abbreviation" : "GR_gene",
      "url_example" : "http://www.gramene.org/db/genes/search_gene?acc=GR:0060198",
      "id" : null,
      "example_id" : "GR_GENE:GR:0060198",
      "uri_prefix" : null
   },
   "poc" : {
      "uri_prefix" : null,
      "example_id" : null,
      "id" : null,
      "abbreviation" : "POC",
      "url_example" : null,
      "generic_url" : "http://www.plantontology.org/",
      "url_syntax" : null,
      "database" : "Plant Ontology Consortium",
      "name" : null,
      "object" : null,
      "fullname" : null,
      "datatype" : null
   },
   "pamgo_vmd" : {
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=[example_id]",
      "name" : null,
      "object" : "Gene identifier",
      "fullname" : null,
      "datatype" : null,
      "description" : "Virginia Bioinformatics Institute Microbial Database; member of PAMGO Interest Group",
      "example_id" : "PAMGO_VMD:109198",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "PAMGO_VMD",
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=109198",
      "generic_url" : "http://phytophthora.vbi.vt.edu"
   },
   "refgenome" : {
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "name" : null,
      "database" : "GO Reference Genomes",
      "datatype" : null,
      "id" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "url_example" : null,
      "abbreviation" : "RefGenome"
   },
   "pubchem_substance" : {
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "abbreviation" : "PubChem_Substance",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=4594",
      "id" : null,
      "local_id_syntax" : "^[0-9]{4,}$",
      "uri_prefix" : null,
      "example_id" : "PubChem_Substance:4594",
      "datatype" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=[example_id]",
      "object" : "Identifier",
      "database" : "NCBI PubChem database of chemical substances"
   },
   "apidb_plasmodb" : {
      "datatype" : null,
      "url_syntax" : "http://www.plasmodb.org/gene/[example_id]",
      "database" : "PlasmoDB Plasmodium Genome Resource",
      "object" : "PlasmoDB Gene ID",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "ApiDB_PlasmoDB",
      "url_example" : "http://www.plasmodb.org/gene/PF11_0344",
      "generic_url" : "http://plasmodb.org/",
      "uri_prefix" : null,
      "example_id" : "ApiDB_PlasmoDB:PF11_0344",
      "id" : null
   },
   "wbphenotype" : {
      "id" : null,
      "local_id_syntax" : "^[0-9]{7}$",
      "example_id" : "WBPhenotype:0002117",
      "uri_prefix" : null,
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WBPhenotype",
      "url_example" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:0000154",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:[example_id]",
      "object" : "Gene identifier",
      "database" : "WormBase phenotype ontology",
      "datatype" : null,
      "entity_type" : "PATO:0000001 ! Quality"
   },
   "cgdid" : {
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "database" : "Candida Genome Database",
      "object" : "Identifier for CGD Loci",
      "name" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "fullname" : null,
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "abbreviation" : "CGDID",
      "generic_url" : "http://www.candidagenome.org/",
      "uri_prefix" : null,
      "example_id" : "CGD:CAL0005516",
      "local_id_syntax" : "^(CAL|CAF)[0-9]{7}$",
      "id" : null
   },
   "vida" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "Virus Database at University College London",
      "object" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://www.biochem.ucl.ac.uk/bsm/virus_database/VIDA.html",
      "url_example" : null,
      "abbreviation" : "VIDA"
   },
   "psi-mod" : {
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "abbreviation" : "PSI-MOD",
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "example_id" : "MOD:00219",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "object" : "Protein modification identifier",
      "name" : null,
      "fullname" : null
   },
   "agricola_id" : {
      "id" : null,
      "example_id" : "AGRICOLA_NAL:TP248.2 P76 v.14",
      "uri_prefix" : null,
      "generic_url" : "http://agricola.nal.usda.gov/",
      "url_example" : null,
      "abbreviation" : "AGRICOLA_ID",
      "fullname" : null,
      "object" : "AGRICOLA call number",
      "url_syntax" : null,
      "name" : null,
      "database" : "AGRICultural OnLine Access",
      "datatype" : null
   },
   "maizegdb_locus" : {
      "datatype" : null,
      "object" : "Maize gene name",
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=[example_id]",
      "database" : "MaizeGDB",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "MaizeGDB_Locus",
      "url_example" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=ZmPK1",
      "generic_url" : "http://www.maizegdb.org",
      "local_id_syntax" : "^[A-Za-z][A-Za-z0-9]*$",
      "uri_prefix" : null,
      "example_id" : "MaizeGDB_Locus:ZmPK1",
      "id" : null
   },
   "alzheimers_university_of_toronto" : {
      "url_example" : null,
      "abbreviation" : "Alzheimers_University_of_Toronto",
      "generic_url" : "http://www.ims.utoronto.ca/",
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "database" : "Alzheimers Project at University of Toronto",
      "url_syntax" : null,
      "object" : null,
      "name" : null,
      "fullname" : null
   },
   "rgd" : {
      "id" : null,
      "local_id_syntax" : "^[0-9]{4,7}$",
      "uri_prefix" : null,
      "example_id" : "RGD:2004",
      "generic_url" : "http://rgd.mcw.edu/",
      "abbreviation" : "RGD",
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "fullname" : null,
      "object" : "Accession",
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "name" : null,
      "database" : "Rat Genome Database",
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "iuphar" : {
      "generic_url" : "http://www.iuphar.org/",
      "url_example" : null,
      "abbreviation" : "IUPHAR",
      "id" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : null,
      "name" : null,
      "database" : "International Union of Pharmacology",
      "object" : null
   },
   "nasc_code" : {
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=[example_id]",
      "database" : "Nottingham Arabidopsis Stock Centre Seeds Database",
      "object" : "NASC code Identifier",
      "name" : null,
      "generic_url" : "http://arabidopsis.info",
      "url_example" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=N3371",
      "abbreviation" : "NASC_code",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "NASC_code:N3371"
   },
   "spd" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.riken.jp/SPD/[example_id].html",
      "database" : "Schizosaccharomyces pombe Postgenome Database at RIKEN; includes Orfeome Localisation data",
      "object" : "Identifier",
      "datatype" : null,
      "id" : null,
      "local_id_syntax" : "^[0-9]{2}/[0-9]{2}[A-Z][0-9]{2}$",
      "example_id" : "SPD:05/05F01",
      "uri_prefix" : null,
      "generic_url" : "http://www.riken.jp/SPD/",
      "abbreviation" : "SPD",
      "url_example" : "http://www.riken.jp/SPD/05/05F01.html"
   },
   "uniparc" : {
      "url_syntax" : "http://www.uniprot.org/uniparc/[example_id]",
      "name" : null,
      "database" : "UniProt Archive",
      "object" : "Accession",
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "description" : "A non-redundant archive of protein sequences extracted from Swiss-Prot, TrEMBL, PIR-PSD, EMBL, Ensembl, IPI, PDB, RefSeq, FlyBase, WormBase, European Patent Office, United States Patent and Trademark Office, and Japanese Patent Office",
      "example_id" : "UniParc:UPI000000000A",
      "id" : null,
      "abbreviation" : "UniParc",
      "url_example" : "http://www.uniprot.org/uniparc/UPI000000000A",
      "generic_url" : "http://www.uniprot.org/uniparc/"
   },
   "geo" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=[example_id]",
      "database" : "NCBI Gene Expression Omnibus",
      "object" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "GEO:GDS2223",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/geo/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=GDS2223",
      "abbreviation" : "GEO"
   },
   "reactome" : {
      "generic_url" : "http://www.reactome.org/",
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "abbreviation" : "Reactome",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "Reactome:REACT_604",
      "local_id_syntax" : "^REACT_[0-9]+$",
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "object" : "Identifier",
      "name" : null
   },
   "enzyme" : {
      "url_syntax" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?[example_id]",
      "name" : null,
      "object" : "Identifier",
      "database" : "Swiss Institute of Bioinformatics enzyme database",
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "ENZYME:EC 1.1.1.1",
      "id" : null,
      "url_example" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?1.1.1.1",
      "abbreviation" : "ENZYME",
      "generic_url" : "http://www.expasy.ch/"
   },
   "embl" : {
      "fullname" : null,
      "database" : "EMBL Nucleotide Sequence Database",
      "url_syntax" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=[example_id]",
      "object" : "Sequence accession",
      "name" : null,
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "local_id_syntax" : "^([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})$",
      "example_id" : "EMBL:AA816246",
      "description" : "International nucleotide sequence database collaboration, comprising EMBL-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "uri_prefix" : null,
      "generic_url" : "http://www.ebi.ac.uk/embl/",
      "abbreviation" : "EMBL",
      "url_example" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=AA816246"
   },
   "dbsnp" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=[example_id]",
      "database" : "NCBI dbSNP",
      "object" : "Identifier",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "local_id_syntax" : "^\\d+$",
      "uri_prefix" : null,
      "example_id" : "dbSNP:rs3131969",
      "id" : null,
      "abbreviation" : "dbSNP",
      "url_example" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=rs3131969",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/projects/SNP"
   },
   "rnamdb" : {
      "datatype" : null,
      "object" : "Identifier",
      "database" : "RNA Modification Database",
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]",
      "name" : null,
      "fullname" : null,
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "abbreviation" : "RNAMDB",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "example_id" : "RNAmods:037",
      "uri_prefix" : null,
      "id" : null
   },
   "genedb_pfalciparum" : {
      "is_obsolete" : "true",
      "fullname" : null,
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=malaria&name=[example_id]",
      "replaced_by" : "GeneDB",
      "url_example" : "http://www.genedb.org/genedb/Search?organism=malaria&name=PFD0755c",
      "id" : null,
      "local_id_syntax" : "^SP[A-Z0-9]+\\.[A-Za-z0-9]+$",
      "datatype" : null,
      "database" : "Plasmodium falciparum GeneDB",
      "object" : "Gene identifier",
      "name" : null,
      "shorthand_name" : "Pfalciparum",
      "generic_url" : "http://www.genedb.org/genedb/malaria/",
      "abbreviation" : "GeneDB_Pfalciparum",
      "example_id" : "GeneDB_Pfalciparum:PFD0755c",
      "uri_prefix" : null
   },
   "tgd_ref" : {
      "fullname" : null,
      "database" : "Tetrahymena Genome Database",
      "url_syntax" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "object" : "Literature Reference Identifier",
      "name" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "TGD_REF:T000005818",
      "generic_url" : "http://www.ciliate.org/",
      "url_example" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=T000005818",
      "abbreviation" : "TGD_REF"
   },
   "pdb" : {
      "fullname" : null,
      "url_syntax" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=[example_id]",
      "name" : null,
      "database" : "Protein Data Bank",
      "object" : "Identifier",
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein",
      "id" : null,
      "example_id" : "PDB:1A4U",
      "uri_prefix" : null,
      "local_id_syntax" : "^[A-Za-z0-9]{4}$",
      "generic_url" : "http://www.rcsb.org/pdb/",
      "url_example" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=1A4U",
      "abbreviation" : "PDB"
   },
   "hugo" : {
      "abbreviation" : "HUGO",
      "url_example" : null,
      "generic_url" : "http://www.hugo-international.org/",
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "database" : "Human Genome Organisation",
      "object" : null,
      "name" : null,
      "fullname" : null
   },
   "po" : {
      "abbreviation" : "PO",
      "url_example" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:0009004",
      "generic_url" : "http://www.plantontology.org/",
      "local_id_syntax" : "^[0-9]{7}$",
      "example_id" : "PO:0009004",
      "uri_prefix" : null,
      "id" : null,
      "entity_type" : "PO:0009012 ! plant structure development stage ",
      "datatype" : null,
      "url_syntax" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:[example_id]",
      "name" : null,
      "database" : "Plant Ontology Consortium Database",
      "object" : "Identifier",
      "fullname" : null
   },
   "genedb_spombe" : {
      "url_syntax" : "http://old.genedb.org/genedb/Search?organism=pombe&name=[example_id]",
      "fullname" : null,
      "is_obsolete" : "true",
      "local_id_syntax" : "^SP[A-Z0-9]+\\.[A-Za-z0-9]+$",
      "id" : null,
      "url_example" : "http://old.genedb.org/genedb/Search?organism=pombe&name=SPAC890.04C",
      "replaced_by" : "PomBase",
      "object" : "Gene identifier",
      "database" : "Schizosaccharomyces pombe GeneDB",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene ",
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "GeneDB_Spombe:SPAC890.04C",
      "abbreviation" : "GeneDB_Spombe",
      "generic_url" : "http://old.genedb.org/genedb/pombe/index.jsp",
      "shorthand_name" : "Spombe"
   },
   "tigr_egad" : {
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "abbreviation" : "TIGR_EGAD",
      "generic_url" : "http://cmr.jcvi.org/",
      "example_id" : "JCVI_EGAD:74462",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "database" : "EGAD database at the J. Craig Venter Institute",
      "name" : null,
      "object" : "Accession",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]",
      "fullname" : null
   },
   "multifun" : {
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : null,
      "abbreviation" : "MultiFun",
      "generic_url" : "http://genprotec.mbl.edu/files/MultiFun.html",
      "name" : null,
      "url_syntax" : null,
      "object" : null,
      "database" : "MultiFun cell function assignment schema",
      "fullname" : null,
      "datatype" : null
   },
   "wbbt" : {
      "id" : null,
      "example_id" : "WBbt:0005733",
      "uri_prefix" : null,
      "local_id_syntax" : "[0-9]{7}",
      "generic_url" : "http://www.wormbase.org/",
      "url_example" : null,
      "abbreviation" : "WBbt",
      "fullname" : null,
      "url_syntax" : null,
      "name" : null,
      "database" : "C. elegans gross anatomy",
      "object" : "Identifier",
      "datatype" : null,
      "entity_type" : "WBbt:0005766 ! anatomy"
   },
   "ena" : {
      "id" : null,
      "local_id_syntax" : "^([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})$",
      "example_id" : "ENA:AA816246",
      "description" : "ENA is made up of a number of distinct databases that includes EMBL-Bank, the newly established Sequence Read Archive (SRA) and the Trace Archive. International nucleotide sequence database collaboration, comprising ENA-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "uri_prefix" : null,
      "generic_url" : "http://www.ebi.ac.uk/ena/",
      "abbreviation" : "ENA",
      "url_example" : "http://www.ebi.ac.uk/ena/data/view/AA816246",
      "fullname" : null,
      "url_syntax" : "http://www.ebi.ac.uk/ena/data/view/[example_id]",
      "database" : "European Nucleotide Archive",
      "name" : null,
      "object" : "Sequence accession",
      "datatype" : null
   },
   "trait" : {
      "datatype" : null,
      "fullname" : null,
      "database" : "TRAnscript Integrated Table",
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "abbreviation" : "TRAIT",
      "url_example" : null,
      "id" : null,
      "example_id" : null,
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "uri_prefix" : null
   },
   "gorel" : {
      "description" : "Additional relations pending addition into RO",
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : null,
      "abbreviation" : "GOREL",
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "database" : "GO Extensions to OBO Relation Ontology Ontology",
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "fullname" : null,
      "datatype" : null
   },
   "um-bbd" : {
      "url_syntax" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "name" : null,
      "object" : "Prefix",
      "fullname" : null,
      "datatype" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "UM-BBD",
      "url_example" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/"
   },
   "biomd" : {
      "example_id" : "BIOMD:BIOMD0000000045",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "BIOMD",
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "database" : "BioModels Database",
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "name" : null,
      "object" : "Accession",
      "fullname" : null,
      "datatype" : null
   },
   "cas_spc" : {
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "object" : "Identifier",
      "database" : "Catalog of Fishes species database",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "abbreviation" : "CAS_SPC",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null
   },
   "rnamods" : {
      "uri_prefix" : null,
      "example_id" : "RNAmods:037",
      "id" : null,
      "abbreviation" : "RNAmods",
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]",
      "name" : null,
      "database" : "RNA Modification Database",
      "object" : "Identifier",
      "fullname" : null,
      "datatype" : null
   },
   "cgsc" : {
      "database: CGSC" : "E.coli Genetic Stock Center",
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "object" : "Gene symbol",
      "database" : null,
      "generic_url" : "http://cgsc.biology.yale.edu/",
      "abbreviation" : "CGSC",
      "url_example" : "http://cgsc.biology.yale.edu/Site.php?ID=315",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "CGSC:rbsK"
   },
   "modbase" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "ModBase:P10815",
      "generic_url" : "http://modbase.compbio.ucsf.edu/ ",
      "url_example" : "http://salilab.org/modbase/searchbyid?databaseID=P04848",
      "abbreviation" : "ModBase",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://salilab.org/modbase/searchbyid?databaseID=[example_id]",
      "database" : "ModBase comprehensive Database of Comparative Protein Structure Models",
      "object" : "Accession",
      "datatype" : null
   },
   "kegg_ligand" : {
      "generic_url" : "http://www.genome.ad.jp/kegg/docs/upd_ligand.html",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?cpd:C00577",
      "abbreviation" : "KEGG_LIGAND",
      "id" : null,
      "example_id" : "KEGG_LIGAND:C00577",
      "uri_prefix" : null,
      "local_id_syntax" : "^C\\d{5}$",
      "datatype" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "fullname" : null,
      "database" : "KEGG LIGAND Database",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?cpd:[example_id]",
      "name" : null,
      "object" : "Compound"
   },
   "mengo" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "Microbial ENergy processes Gene Ontology Project",
      "object" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://mengo.vbi.vt.edu/",
      "url_example" : null,
      "abbreviation" : "MENGO"
   },
   "merops_fam" : {
      "abbreviation" : "MEROPS_fam",
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=m18",
      "generic_url" : "http://merops.sanger.ac.uk/",
      "example_id" : "MEROPS_fam:M18",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "object" : "Peptidase family identifier",
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=[example_id]",
      "database" : "MEROPS peptidase database",
      "name" : null,
      "fullname" : null
   },
   "ensemblfungi" : {
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "database" : "Ensembl Fungi, the Ensembl Genomes database for accessing fungal genome data",
      "object" : "Identifier",
      "generic_url" : "http://fungi.ensembl.org/",
      "abbreviation" : "EnsemblFungi",
      "url_example" : "http://www.ensemblgenomes.org/id/YOR197W",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "EnsemblFungi:YOR197W"
   },
   "ncbi_gp" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=[example_id]",
      "name" : null,
      "object" : "Protein identifier",
      "database" : "NCBI GenPept",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null,
      "local_id_syntax" : "^[A-Z]{3}[0-9]{5}(\\.[0-9]+)?$",
      "uri_prefix" : null,
      "example_id" : "NCBI_GP:EAL72968",
      "id" : null,
      "abbreviation" : "NCBI_GP",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=EAL72968",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/"
   },
   "pr" : {
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "database" : "Protein Ontology",
      "object" : "Identifer",
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "abbreviation" : "PR",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "PR:000025380",
      "local_id_syntax" : "^[0-9]{9}$"
   },
   "superfamily" : {
      "datatype" : null,
      "fullname" : null,
      "object" : "Accession",
      "url_syntax" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF[example_id]",
      "name" : null,
      "database" : "SUPERFAMILY protein annotation database",
      "generic_url" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/index.html",
      "url_example" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF51905",
      "abbreviation" : "SUPERFAMILY",
      "id" : null,
      "example_id" : "SUPERFAMILY:51905",
      "description" : "A database of structural and functional protein annotations for completely sequenced genomes",
      "uri_prefix" : null
   },
   "kegg_enzyme" : {
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?ec:[example_id]",
      "name" : null,
      "database" : "KEGG Enzyme Database",
      "object" : "Enzyme Commission ID, as stored in KEGG",
      "generic_url" : "http://www.genome.jp/dbget-bin/www_bfind?enzyme",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?ec:2.1.1.4",
      "abbreviation" : "KEGG_ENZYME",
      "id" : null,
      "example_id" : "KEGG_ENZYME:2.1.1.4",
      "uri_prefix" : null,
      "local_id_syntax" : "^\\d(\\.\\d{1,2}){2}\\.\\d{1,3}$"
   },
   "um-bbd_enzymeid" : {
      "id" : null,
      "example_id" : "UM-BBD_enzymeID:e0413",
      "uri_prefix" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "abbreviation" : "UM-BBD_enzymeID",
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=e0230",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=[example_id]",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "object" : "Enzyme identifier",
      "datatype" : null
   },
   "lifedb" : {
      "name" : null,
      "url_syntax" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=[example_id]",
      "object" : "cDNA clone identifier",
      "database" : "LifeDB",
      "fullname" : null,
      "datatype" : null,
      "example_id" : "LIFEdb:DKFZp564O1716",
      "description" : "LifeDB is a database for information on protein localization, interaction, functional assays and expression.",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "LIFEdb",
      "url_example" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=DKFZp564O1716",
      "generic_url" : "http://www.lifedb.de/"
   },
   "issn" : {
      "url_syntax" : null,
      "database" : "International Standard Serial Number",
      "object" : "Identifier",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : "ISSN:1234-1231",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "ISSN",
      "url_example" : null,
      "generic_url" : "http://www.issn.org/"
   },
   "ncbi_gene" : {
      "id" : null,
      "local_id_syntax" : "^\\d+$",
      "example_id" : "NCBI_Gene:4771",
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI_Gene",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "fullname" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "object" : "Identifier",
      "database" : "NCBI Gene",
      "name" : null,
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "ncbi_locus_tag" : {
      "datatype" : null,
      "url_syntax" : null,
      "object" : "Identifier",
      "name" : null,
      "database" : "NCBI locus tag",
      "fullname" : null,
      "abbreviation" : "NCBI_locus_tag",
      "url_example" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "example_id" : "NCBI_locus_tag:CTN_0547",
      "uri_prefix" : null,
      "id" : null
   },
   "casspc" : {
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "abbreviation" : "CASSPC",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "database" : "Catalog of Fishes species database",
      "object" : "Identifier",
      "name" : null,
      "fullname" : null,
      "datatype" : null
   },
   "imgt_hla" : {
      "name" : null,
      "url_syntax" : null,
      "database" : "IMGT/HLA human major histocompatibility complex sequence database",
      "object" : null,
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "IMGT_HLA:HLA00031",
      "id" : null,
      "abbreviation" : "IMGT_HLA",
      "url_example" : null,
      "generic_url" : "http://www.ebi.ac.uk/imgt/hla"
   },
   "ecogene" : {
      "id" : null,
      "local_id_syntax" : "^EG[0-9]{5}$",
      "uri_prefix" : null,
      "example_id" : "ECOGENE:EG10818",
      "generic_url" : "http://www.ecogene.org/",
      "abbreviation" : "ECOGENE",
      "url_example" : "http://www.ecogene.org/geneInfo.php?eg_id=EG10818",
      "fullname" : null,
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eg_id=[example_id]",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "object" : "EcoGene accession",
      "name" : null,
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "trembl" : {
      "is_obsolete" : "true",
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "name" : null,
      "database" : "UniProtKB-TrEMBL protein sequence database",
      "object" : "Accession",
      "generic_url" : "http://www.uniprot.org",
      "url_example" : "http://www.uniprot.org/uniprot/O31124",
      "replaced_by" : "UniProtKB",
      "abbreviation" : "TrEMBL",
      "id" : null,
      "example_id" : "TrEMBL:O31124",
      "description" : "UniProtKB-TrEMBL, a computer-annotated protein sequence database supplementing UniProtKB and containing the translations of all coding sequences (CDS) present in the EMBL Nucleotide Sequence Database but not yet integrated in UniProtKB/Swiss-Prot",
      "uri_prefix" : null
   },
   "uniprotkb/swiss-prot" : {
      "fullname" : null,
      "database" : "UniProtKB/Swiss-Prot",
      "name" : null,
      "object" : "Accession",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "datatype" : null,
      "is_obsolete" : "true",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "Swiss-Prot:P51587",
      "description" : "A curated protein sequence database which provides a high level of annotation and a minimal level of redundancy",
      "generic_url" : "http://www.uniprot.org",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "replaced_by" : "UniProtKB",
      "abbreviation" : "UniProtKB/Swiss-Prot"
   },
   "ma" : {
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:[example_id]",
      "database" : "Adult Mouse Anatomical Dictionary",
      "object" : "Identifier",
      "fullname" : null,
      "url_example" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:0000003",
      "abbreviation" : "MA",
      "generic_url" : "http://www.informatics.jax.org/",
      "description" : "Adult Mouse Anatomical Dictionary; part of Gene Expression Database",
      "example_id" : "MA:0000003",
      "uri_prefix" : null,
      "id" : null
   },
   "pfamb" : {
      "abbreviation" : "PfamB",
      "url_example" : null,
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/",
      "example_id" : "PfamB:PB014624",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "Pfam-B supplement to Pfam",
      "object" : "Accession",
      "fullname" : null
   },
   "h-invdb" : {
      "datatype" : null,
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "database" : "H-invitational Database",
      "name" : null,
      "generic_url" : "http://www.h-invitational.jp/",
      "abbreviation" : "H-invDB",
      "url_example" : null,
      "id" : null,
      "example_id" : null,
      "uri_prefix" : null
   },
   "sp_kw" : {
      "datatype" : null,
      "name" : null,
      "object" : "Identifier",
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "database" : "UniProt Knowledgebase keywords",
      "fullname" : null,
      "abbreviation" : "SP_KW",
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "generic_url" : "http://www.uniprot.org/keywords/",
      "uri_prefix" : null,
      "example_id" : "UniProtKB-KW:KW-0812",
      "id" : null
   },
   "ec" : {
      "generic_url" : "http://www.chem.qmul.ac.uk/iubmb/enzyme/",
      "url_example" : "http://www.expasy.org/enzyme/1.4.3.6",
      "abbreviation" : "EC",
      "id" : null,
      "example_id" : "EC:1.4.3.6",
      "uri_prefix" : null,
      "datatype" : null,
      "entity_type" : "GO:0003824 ! catalytic activity",
      "fullname" : null,
      "! url_example" : "http://www.chem.qmw.ac.uk/iubmb/enzyme/EC1/4/3/6.html",
      "url_syntax" : "http://www.expasy.org/enzyme/[example_id]",
      "database" : "Enzyme Commission",
      "name" : null,
      "object" : null
   },
   "so" : {
      "url_example" : "http://song.sourceforge.net/SOterm_tables.html#SO:0000195",
      "abbreviation" : "SO",
      "generic_url" : "http://sequenceontology.org/",
      "example_id" : "SO:0000195",
      "uri_prefix" : null,
      "local_id_syntax" : "^\\d{7}$",
      "id" : null,
      "entity_type" : "SO:0000110 ! sequence feature",
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://song.sourceforge.net/SOterm_tables.html#SO:[example_id]",
      "database" : "Sequence Ontology",
      "object" : "Identifier",
      "fullname" : null
   },
   "germonline" : {
      "datatype" : null,
      "url_syntax" : null,
      "database" : "GermOnline",
      "object" : null,
      "name" : null,
      "fullname" : null,
      "abbreviation" : "GermOnline",
      "url_example" : null,
      "generic_url" : "http://www.germonline.org/",
      "uri_prefix" : null,
      "example_id" : null,
      "id" : null
   },
   "gdb" : {
      "abbreviation" : "GDB",
      "url_example" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:306600",
      "generic_url" : "http://www.gdb.org/",
      "example_id" : "GDB:306600",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:[example_id]",
      "object" : "Accession",
      "database" : "Human Genome Database",
      "name" : null,
      "fullname" : null
   },
   "resid" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "RESID Database of Protein Modifications",
      "object" : "Identifier",
      "datatype" : null,
      "id" : null,
      "example_id" : "RESID:AA0062",
      "uri_prefix" : null,
      "generic_url" : "ftp://ftp.ncifcrf.gov/pub/users/residues/",
      "url_example" : null,
      "abbreviation" : "RESID"
   },
   "wormbase" : {
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WormBase",
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "id" : null,
      "local_id_syntax" : "^WB(Gene|Var|RNAi|Transgene)[0-9]{8}$",
      "example_id" : "WB:WBGene00003001",
      "uri_prefix" : null,
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "database" : "WormBase database of nematode biology",
      "object" : "Gene identifier",
      "name" : null,
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]"
   },
   "sgn" : {
      "url_example" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=4476",
      "abbreviation" : "SGN",
      "generic_url" : "http://www.sgn.cornell.edu/",
      "uri_prefix" : null,
      "example_id" : "SGN:4476",
      "id" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "url_syntax" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=[example_id]",
      "database" : "Sol Genomics Network",
      "object" : "Gene identifier",
      "name" : null,
      "fullname" : null
   },
   "aspgd" : {
      "database" : "Aspergillus Genome Database",
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "name" : null,
      "object" : "Identifier for AspGD Loci",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "local_id_syntax" : "^ASPL[0-9]{10}$",
      "example_id" : "AspGD:ASPL0000067538",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "AspGD",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "generic_url" : "http://www.aspergillusgenome.org/"
   },
   "hpa" : {
      "example_id" : "HPA:HPA000237",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "HPA",
      "url_example" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=HPA000237",
      "generic_url" : "http://www.proteinatlas.org/",
      "name" : null,
      "url_syntax" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=[example_id]",
      "object" : "Identifier",
      "database" : "Human Protein Atlas tissue profile information",
      "fullname" : null,
      "datatype" : null
   },
   "tgd" : {
      "datatype" : null,
      "fullname" : null,
      "database" : "Tetrahymena Genome Database",
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "generic_url" : "http://www.ciliate.org/",
      "url_example" : null,
      "abbreviation" : "TGD",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null
   },
   "dictybase_ref" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "dictyBase_REF:10157",
      "generic_url" : "http://dictybase.org",
      "abbreviation" : "dictyBase_REF",
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "fullname" : null,
      "database" : "dictyBase literature references",
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "name" : null,
      "object" : "Literature Reference Identifier",
      "datatype" : null
   },
   "ri" : {
      "datatype" : null,
      "object" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "Roslin Institute",
      "fullname" : null,
      "url_example" : null,
      "abbreviation" : "RI",
      "generic_url" : "http://www.roslin.ac.uk/",
      "uri_prefix" : null,
      "example_id" : null,
      "id" : null
   },
   "eck" : {
      "generic_url" : "http://www.ecogene.org/",
      "url_example" : "http://www.ecogene.org/geneInfo.php?eck_id=ECK3746",
      "abbreviation" : "ECK",
      "id" : null,
      "example_id" : "ECK:ECK3746",
      "uri_prefix" : null,
      "local_id_syntax" : "^ECK[0-9]{4}$",
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eck_id=[example_id]",
      "object" : "ECK accession (E. coli K-12 gene identifier)",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function"
   },
   "pato" : {
      "datatype" : null,
      "url_syntax" : null,
      "database" : "Phenotypic quality ontology",
      "object" : "Identifier",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "PATO",
      "url_example" : null,
      "generic_url" : "http://www.bioontology.org/wiki/index.php/PATO:Main_Page",
      "uri_prefix" : null,
      "example_id" : "PATO:0001420",
      "id" : null
   },
   "cbs" : {
      "uri_prefix" : null,
      "example_id" : "CBS:TMHMM",
      "id" : null,
      "abbreviation" : "CBS",
      "url_example" : "http://www.cbs.dtu.dk/services/[example_id]/",
      "generic_url" : "http://www.cbs.dtu.dk/",
      "url_syntax" : null,
      "database" : "Center for Biological Sequence Analysis",
      "name" : null,
      "object" : "prediction tool",
      "fullname" : null,
      "datatype" : null
   },
   "kegg_pathway" : {
      "abbreviation" : "KEGG_PATHWAY",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?path:ot00020",
      "generic_url" : "http://www.genome.jp/kegg/pathway.html",
      "uri_prefix" : null,
      "example_id" : "KEGG_PATHWAY:ot00020",
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?path:[example_id]",
      "object" : "Pathway",
      "name" : null,
      "database" : "KEGG Pathways Database",
      "fullname" : null
   },
   "h-invdb_cdna" : {
      "database" : "H-invitational Database",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=[example_id]",
      "object" : "Accession",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : "H-invDB_cDNA:AK093148",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "H-invDB_cDNA",
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=AK093149",
      "generic_url" : "http://www.h-invitational.jp/"
   },
   "um-bbd_reactionid" : {
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=[example_id]",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "object" : "Reaction identifier",
      "fullname" : null,
      "abbreviation" : "UM-BBD_reactionID",
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=r0129",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "uri_prefix" : null,
      "example_id" : "UM-BBD_reactionID:r0129",
      "id" : null
   },
   "prodom" : {
      "datatype" : null,
      "url_syntax" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=[example_id]",
      "database" : "ProDom protein domain families",
      "object" : "Accession",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "ProDom",
      "url_example" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=PD000001",
      "generic_url" : "http://prodom.prabi.fr/prodom/current/html/home.php",
      "description" : "ProDom protein domain families automatically generated from UniProtKB",
      "example_id" : "ProDom:PD000001",
      "uri_prefix" : null,
      "id" : null
   },
   "tigr_tigrfams" : {
      "fullname" : null,
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "name" : null,
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "object" : "Accession",
      "datatype" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "id" : null,
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "uri_prefix" : null,
      "generic_url" : "http://search.jcvi.org/",
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "abbreviation" : "TIGR_TIGRFAMS"
   },
   "mgd" : {
      "! url_syntax" : "http://www.informatics.jax.org/searches/marker.cgi?",
      "datatype" : null,
      "url_syntax" : null,
      "database" : "Mouse Genome Database",
      "object" : "Gene symbol",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "MGD",
      "url_example" : null,
      "generic_url" : "http://www.informatics.jax.org/",
      "example_id" : "MGD:Adcy9",
      "uri_prefix" : null,
      "id" : null
   },
   "ncbi_taxid" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "abbreviation" : "ncbi_taxid",
      "id" : null,
      "example_id" : "taxon:7227",
      "uri_prefix" : null,
      "datatype" : null,
      "fullname" : null,
      "object" : "Identifier",
      "name" : null,
      "database" : "NCBI Taxonomy",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]"
   },
   "wormpep" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "WP:CE25104",
      "generic_url" : "http://www.wormbase.org/",
      "url_example" : "http://www.wormbase.org/db/get?class=Protein;name=WP:CE15104",
      "abbreviation" : "Wormpep",
      "fullname" : null,
      "url_syntax" : "http://www.wormbase.org/db/get?class=Protein;name=WP:[example_id]",
      "name" : null,
      "database" : "Wormpep database of proteins of C. elegans",
      "object" : "Identifier",
      "datatype" : null,
      "is_obsolete" : "true"
   },
   "refseq" : {
      "id" : null,
      "local_id_syntax" : "^(NC|AC|NG|NT|NW|NZ|NM|NR|XM|XR|NP|AP|XP|ZP)_\\d+$",
      "uri_prefix" : null,
      "example_id" : "RefSeq:XP_001068954",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "abbreviation" : "RefSeq",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=XP_001068954",
      "fullname" : null,
      "database" : "RefSeq",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "object" : "Identifier",
      "name" : null,
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein"
   },
   "smart" : {
      "id" : null,
      "example_id" : "SMART:SM00005",
      "uri_prefix" : null,
      "generic_url" : "http://smart.embl-heidelberg.de/",
      "url_example" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=SM00005",
      "abbreviation" : "SMART",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=[example_id]",
      "object" : "Accession",
      "database" : "Simple Modular Architecture Research Tool",
      "datatype" : null,
      "entity_type" : "SO:0000839 ! polypeptide region"
   },
   "pmcid" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "PMCID:PMC201377",
      "generic_url" : "http://www.pubmedcentral.nih.gov/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=PMC201377",
      "abbreviation" : "PMCID",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=[example_id]",
      "database" : "Pubmed Central",
      "object" : "Identifier",
      "datatype" : null,
      "!url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Search&db=PMC&term=[example_id]",
      "!url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Search&db=PMC&term=PMC201377"
   },
   "transfac" : {
      "id" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.gene-regulation.com/pub/databases.html#transfac",
      "abbreviation" : "TRANSFAC",
      "url_example" : null,
      "fullname" : null,
      "url_syntax" : null,
      "database" : "TRANSFAC database of eukaryotic transcription factors",
      "object" : null,
      "name" : null,
      "datatype" : null
   },
   "pir" : {
      "object" : "Accession",
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=[example_id]",
      "name" : null,
      "database" : "Protein Information Resource",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null,
      "local_id_syntax" : "^[A-Z]{1}[0-9]{5}$",
      "example_id" : "PIR:I49499",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "PIR",
      "url_example" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=I49499",
      "generic_url" : "http://pir.georgetown.edu/"
   },
   "gr_ref" : {
      "fullname" : null,
      "url_syntax" : "http://www.gramene.org/db/literature/pub_search?ref_id=[example_id]",
      "object" : "Reference",
      "name" : null,
      "database" : null,
      "datatype" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "id" : null,
      "example_id" : "GR_REF:659",
      "uri_prefix" : null,
      "generic_url" : "http://www.gramene.org/",
      "url_example" : "http://www.gramene.org/db/literature/pub_search?ref_id=659",
      "abbreviation" : "GR_REF"
   },
   "aspgd_ref" : {
      "fullname" : null,
      "object" : "Literature Reference Identifier",
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "database" : "Aspergillus Genome Database",
      "name" : null,
      "datatype" : null,
      "id" : null,
      "example_id" : "AspGD_REF:90",
      "uri_prefix" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=90",
      "abbreviation" : "AspGD_REF"
   },
   "kegg_reaction" : {
      "id" : null,
      "example_id" : "KEGG:R02328",
      "uri_prefix" : null,
      "local_id_syntax" : "^R\\d+$",
      "generic_url" : "http://www.genome.jp/kegg/reaction/",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?rn:R02328",
      "abbreviation" : "KEGG_REACTION",
      "fullname" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?rn:[example_id]",
      "name" : null,
      "database" : "KEGG Reaction Database",
      "object" : "Reaction",
      "datatype" : null
   },
   "jstor" : {
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.jstor.org/stable/[example_id]",
      "name" : null,
      "database" : "Digital archive of scholarly articles",
      "object" : "journal article",
      "generic_url" : "http://www.jstor.org/",
      "abbreviation" : "JSTOR",
      "url_example" : "http://www.jstor.org/stable/3093870",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "JSTOR:3093870"
   },
   "tgd_locus" : {
      "generic_url" : "http://www.ciliate.org/",
      "url_example" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=PDD1",
      "abbreviation" : "TGD_LOCUS",
      "id" : null,
      "example_id" : "TGD_LOCUS:PDD1",
      "uri_prefix" : null,
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=[example_id]",
      "database" : "Tetrahymena Genome Database",
      "object" : "Gene name (gene symbol in mammalian nomenclature)"
   },
   "cog_pathway" : {
      "fullname" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=[example_id]",
      "object" : "Identifier",
      "database" : "NCBI COG pathway",
      "name" : null,
      "datatype" : null,
      "id" : null,
      "example_id" : "COG_Pathway:14",
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=14",
      "abbreviation" : "COG_Pathway"
   },
   "cog" : {
      "datatype" : null,
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "name" : null,
      "database" : "NCBI Clusters of Orthologous Groups",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "url_example" : null,
      "abbreviation" : "COG",
      "id" : null,
      "example_id" : null,
      "uri_prefix" : null
   },
   "taxon" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "database" : "NCBI Taxonomy",
      "object" : "Identifier",
      "datatype" : null,
      "id" : null,
      "example_id" : "taxon:7227",
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "abbreviation" : "taxon"
   },
   "pseudocap" : {
      "example_id" : "PseudoCAP:PA4756",
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=PA4756",
      "abbreviation" : "PseudoCAP",
      "generic_url" : "http://v2.pseudomonas.com/",
      "database" : "Pseudomonas Genome Project",
      "url_syntax" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=[example_id]",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "datatype" : null
   },
   "cgd_locus" : {
      "datatype" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "name" : null,
      "database" : "Candida Genome Database",
      "fullname" : null,
      "abbreviation" : "CGD_LOCUS",
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=HWP1",
      "generic_url" : "http://www.candidagenome.org/",
      "example_id" : "CGD_LOCUS:HWP1",
      "uri_prefix" : null,
      "id" : null
   },
   "genedb_gmorsitans" : {
      "is_obsolete" : "true",
      "datatype" : null,
      "fullname" : null,
      "database" : "Glossina morsitans GeneDB",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=glossina&name=[example_id]",
      "name" : null,
      "object" : "Gene identifier",
      "shorthand_name" : "Tsetse",
      "generic_url" : "http://www.genedb.org/genedb/glossina/",
      "abbreviation" : "GeneDB_Gmorsitans",
      "replaced_by" : "GeneDB",
      "url_example" : "http://www.genedb.org/genedb/Search?organism=glossina&name=Gmm-0142",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "GeneDB_Gmorsitans:Gmm-0142"
   },
   "sp_sl" : {
      "datatype" : null,
      "fullname" : null,
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "object" : "Identifier",
      "name" : null,
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "generic_url" : "http://www.uniprot.org/locations/",
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "abbreviation" : "SP_SL",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "UniProtKB-SubCell:SL-0012"
   },
   "hpa_antibody" : {
      "uri_prefix" : null,
      "example_id" : "HPA_antibody:HPA000237",
      "id" : null,
      "url_example" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=HPA000237",
      "abbreviation" : "HPA_antibody",
      "generic_url" : "http://www.proteinatlas.org/",
      "url_syntax" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=[example_id]",
      "object" : "Identifier",
      "database" : "Human Protein Atlas antibody information",
      "name" : null,
      "fullname" : null,
      "datatype" : null
   },
   "gr" : {
      "id" : null,
      "example_id" : "GR:sd1",
      "uri_prefix" : null,
      "local_id_syntax" : "^[A-Z][0-9][A-Z0-9]{3}[0-9]$",
      "generic_url" : "http://www.gramene.org/",
      "url_example" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=sd1",
      "abbreviation" : "GR",
      "fullname" : null,
      "database" : null,
      "url_syntax" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=[example_id]",
      "name" : null,
      "object" : "Identifier (any)",
      "datatype" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "entity_type" : "PR:000000001 ! protein"
   },
   "cgen" : {
      "datatype" : null,
      "url_syntax" : null,
      "name" : null,
      "database" : "Compugen Gene Ontology Gene Association Data",
      "object" : "Identifier",
      "fullname" : null,
      "abbreviation" : "CGEN",
      "url_example" : null,
      "generic_url" : "http://www.cgen.com/",
      "uri_prefix" : null,
      "example_id" : "CGEN:PrID131022",
      "id" : null
   },
   "bhf-ucl" : {
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : null,
      "name" : null,
      "database" : "Cardiovascular Gene Ontology Annotation Initiative",
      "object" : null,
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology/",
      "abbreviation" : "BHF-UCL",
      "url_example" : null,
      "id" : null,
      "description" : "The Cardiovascular Gene Ontology Annotation Initiative is supported by the British Heart Foundation (BHF) and located at University College London (UCL).",
      "example_id" : null,
      "uri_prefix" : null
   },
   "dictybase" : {
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "database" : "dictyBase",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "name" : null,
      "object" : "Identifier",
      "generic_url" : "http://dictybase.org",
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "abbreviation" : "DictyBase",
      "id" : null,
      "example_id" : "dictyBase:DDB_G0277859",
      "uri_prefix" : null,
      "local_id_syntax" : "^DDB_G[0-9]{7}$"
   },
   "tc" : {
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null,
      "url_syntax" : "http://www.tcdb.org/tcdb/index.php?tc=[example_id]",
      "name" : null,
      "database" : "Transport Protein Database",
      "object" : "Identifier",
      "fullname" : null,
      "abbreviation" : "TC",
      "url_example" : "http://www.tcdb.org/tcdb/index.php?tc=9.A.4.1.1",
      "generic_url" : "http://www.tcdb.org/",
      "example_id" : "TC:9.A.4.1.1",
      "uri_prefix" : null,
      "id" : null
   },
   "vz" : {
      "example_id" : "VZ:957",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "VZ",
      "url_example" : "http://viralzone.expasy.org/all_by_protein/957.html",
      "generic_url" : "http://viralzone.expasy.org/",
      "object" : "Page Reference Identifier",
      "url_syntax" : "http://viralzone.expasy.org/all_by_protein/[example_id].html",
      "database" : "ViralZone",
      "name" : null,
      "fullname" : null,
      "datatype" : null
   },
   "isbn" : {
      "datatype" : null,
      "database" : "International Standard Book Number",
      "url_syntax" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=[example_id]",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "abbreviation" : "ISBN",
      "url_example" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=0123456789",
      "generic_url" : "http://isbntools.com/",
      "example_id" : "ISBN:0781702534",
      "uri_prefix" : null,
      "id" : null
   },
   "yeastfunc" : {
      "url_example" : null,
      "abbreviation" : "YeastFunc",
      "generic_url" : "http://func.med.harvard.edu/yeast/",
      "uri_prefix" : null,
      "example_id" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "database" : "Yeast Function",
      "fullname" : null
   },
   "ncbitaxon" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "abbreviation" : "NCBITaxon",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "taxon:7227",
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "database" : "NCBI Taxonomy",
      "name" : null,
      "object" : "Identifier"
   },
   "unigene" : {
      "fullname" : null,
      "database" : "UniGene",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=[organism_abbreviation]&CID=[cluster_id]",
      "name" : null,
      "object" : "Identifier (for transcript cluster)",
      "datatype" : null,
      "id" : null,
      "description" : "NCBI transcript cluster database, organized by transcriptome. Each UniGene entry is a set of transcript sequences that appear to come from the same transcription locus (gene or expressed pseudogene).",
      "uri_prefix" : null,
      "example_id" : "UniGene:Hs.212293",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/UniGene",
      "abbreviation" : "UniGene",
      "url_example" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=Hs&CID=212293"
   },
   "omssa" : {
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : null,
      "name" : null,
      "database" : "Open Mass Spectrometry Search Algorithm",
      "object" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/omssa/",
      "url_example" : null,
      "abbreviation" : "OMSSA",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null
   },
   "dictybase_gene_name" : {
      "fullname" : null,
      "object" : "Gene name",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "name" : null,
      "database" : "dictyBase",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "dictyBase_gene_name:mlcE",
      "generic_url" : "http://dictybase.org",
      "url_example" : "http://dictybase.org/gene/mlcE",
      "abbreviation" : "dictyBase_gene_name"
   },
   "ncbi" : {
      "datatype" : null,
      "! url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "fullname" : null,
      "! url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=",
      "database" : "National Center for Biotechnology Information",
      "url_syntax" : null,
      "name" : null,
      "object" : "Prefix",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "url_example" : null,
      "abbreviation" : "NCBI",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null
   },
   "kegg" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://www.genome.ad.jp/kegg/",
      "url_example" : null,
      "abbreviation" : "KEGG",
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "Kyoto Encyclopedia of Genes and Genomes",
      "object" : "identifier",
      "datatype" : null
   },
   "jcvi_medtr" : {
      "generic_url" : "http://medicago.jcvi.org/cgi-bin/medicago/overview.cgi",
      "url_example" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=Medtr5g024510",
      "abbreviation" : "JCVI_Medtr",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "JCVI_Medtr:Medtr5g024510",
      "datatype" : null,
      "fullname" : null,
      "database" : "Medicago truncatula genome database at the J. Craig Venter Institute ",
      "url_syntax" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=[example_id]",
      "name" : null,
      "object" : "Accession"
   },
   "doi" : {
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://dx.doi.org/DOI:[example_id]",
      "database" : "Digital Object Identifier",
      "object" : "Identifier",
      "fullname" : null,
      "url_example" : "http://dx.doi.org/DOI:10.1016/S0963-9969(99)00021-6",
      "abbreviation" : "DOI",
      "generic_url" : "http://dx.doi.org/",
      "uri_prefix" : null,
      "example_id" : "DOI:10.1016/S0963-9969(99)00021-6",
      "local_id_syntax" : "^10\\.[0-9]+\\/.*$",
      "id" : null
   },
   "rgdid" : {
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "database" : "Rat Genome Database",
      "name" : null,
      "object" : "Accession",
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "fullname" : null,
      "abbreviation" : "RGDID",
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "generic_url" : "http://rgd.mcw.edu/",
      "local_id_syntax" : "^[0-9]{4,7}$",
      "uri_prefix" : null,
      "example_id" : "RGD:2004",
      "id" : null
   },
   "protein_id" : {
      "id" : null,
      "description" : "protein identifier shared by DDBJ/EMBL-bank/GenBank nucleotide sequence databases",
      "uri_prefix" : null,
      "example_id" : "protein_id:CAA71991",
      "local_id_syntax" : "^[A-Z]{3}[0-9]{5}(\\.[0-9]+)?$",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "url_example" : null,
      "abbreviation" : "protein_id",
      "fullname" : null,
      "url_syntax" : null,
      "name" : null,
      "object" : "Identifier",
      "database" : "DDBJ / ENA / GenBank",
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein"
   },
   "cas_gen" : {
      "example_id" : "CASGEN:1040",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "CAS_GEN",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "name" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "database" : "Catalog of Fishes genus database",
      "object" : "Identifier",
      "fullname" : null,
      "datatype" : null
   },
   "tigr_pfa1" : {
      "id" : null,
      "example_id" : "JCVI_Pfa1:PFB0010w",
      "uri_prefix" : null,
      "generic_url" : "http://www.tigr.org/tdb/e2k1/pfa1/pfa1.shtml",
      "url_example" : null,
      "abbreviation" : "TIGR_Pfa1",
      "fullname" : null,
      "database" : "Plasmodium falciparum database at the J. Craig Venter Institute",
      "object" : "Accession",
      "name" : null,
      "url_syntax" : null,
      "datatype" : null,
      "is_obsolete" : "true"
   },
   "prints" : {
      "abbreviation" : "PRINTS",
      "url_example" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=PR00025",
      "generic_url" : "http://www.bioinf.manchester.ac.uk/dbbrowser/PRINTS/",
      "uri_prefix" : null,
      "example_id" : "PRINTS:PR00025",
      "id" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=[example_id]",
      "database" : "PRINTS compendium of protein fingerprints",
      "object" : "Accession",
      "fullname" : null
   },
   "pubmed" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "abbreviation" : "PubMed",
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "id" : null,
      "local_id_syntax" : "^[0-9]+$",
      "example_id" : "PMID:4208797",
      "uri_prefix" : null,
      "datatype" : null,
      "fullname" : null,
      "database" : "PubMed",
      "object" : "Identifier",
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]"
   },
   "jcvi_pfa1" : {
      "generic_url" : "http://www.tigr.org/tdb/e2k1/pfa1/pfa1.shtml",
      "abbreviation" : "JCVI_Pfa1",
      "url_example" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "JCVI_Pfa1:PFB0010w",
      "datatype" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "url_syntax" : null,
      "object" : "Accession",
      "name" : null,
      "database" : "Plasmodium falciparum database at the J. Craig Venter Institute"
   },
   "gonuts" : {
      "generic_url" : "http://gowiki.tamu.edu",
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MOUSE:CD28",
      "abbreviation" : "GONUTS",
      "id" : null,
      "description" : "Third party documentation for GO and community annotation system.",
      "example_id" : "GONUTS:MOUSE:CD28",
      "uri_prefix" : null,
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "object" : "Identifier (for gene or gene product)",
      "database" : "Gene Ontology Normal Usage Tracking System (GONUTS)"
   },
   "ensembl_proteinid" : {
      "local_id_syntax" : "^ENSP[0-9]{9,16}$",
      "uri_prefix" : null,
      "example_id" : "ENSEMBL_ProteinID:ENSP00000361027",
      "id" : null,
      "abbreviation" : "ENSEMBL_ProteinID",
      "url_example" : "http://www.ensembl.org/id/ENSP00000361027",
      "generic_url" : "http://www.ensembl.org/",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "database" : "Ensembl database of automatically annotated genomic data",
      "object" : "Protein identifier",
      "name" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null
   },
   "smd" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://genome-www.stanford.edu/microarray",
      "abbreviation" : "SMD",
      "url_example" : null,
      "fullname" : null,
      "database" : "Stanford Microarray Database",
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "datatype" : null
   },
   "eco" : {
      "id" : null,
      "local_id_syntax" : "^\\d{7}$",
      "uri_prefix" : null,
      "example_id" : "ECO:0000002",
      "generic_url" : "http://www.geneontology.org/",
      "abbreviation" : "ECO",
      "url_example" : null,
      "fullname" : null,
      "object" : "Identifier",
      "url_syntax" : null,
      "name" : null,
      "database" : "Evidence Code ontology",
      "datatype" : null
   },
   "pamgo_mgg" : {
      "abbreviation" : "PAMGO_MGG",
      "url_example" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=MGG_05132",
      "generic_url" : "http://scotland.fgl.ncsu.edu/smeng/GoAnnotationMagnaporthegrisea.html",
      "description" : "Magnaporthe grisea database at North Carolina State University; member of PAMGO Interest Group",
      "example_id" : "PAMGO_MGG:MGG_05132",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=[example_id]",
      "name" : null,
      "database" : "Magnaporthe grisea database",
      "object" : "Locus",
      "fullname" : null
   },
   "iuphar_gpcr" : {
      "datatype" : null,
      "object" : "G-protein-coupled receptor family identifier",
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=[example_id]",
      "database" : "International Union of Pharmacology",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "IUPHAR_GPCR",
      "url_example" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=13",
      "generic_url" : "http://www.iuphar.org/",
      "example_id" : "IUPHAR_GPCR:1279",
      "uri_prefix" : null,
      "id" : null
   },
   "tigr_cmr" : {
      "example_id" : "JCVI_CMR:VCA0557",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "TIGR_CMR",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "generic_url" : "http://cmr.jcvi.org/",
      "database" : "Comprehensive Microbial Resource at the J. Craig Venter Institute",
      "name" : null,
      "object" : "Locus",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null
   },
   "patric" : {
      "fullname" : null,
      "url_syntax" : "http://patric.vbi.vt.edu/gene/overview.php?fid=[example_id]",
      "database" : "PathoSystems Resource Integration Center",
      "name" : null,
      "object" : "Feature identifier",
      "datatype" : null,
      "id" : null,
      "description" : "PathoSystems Resource Integration Center at the Virginia Bioinformatics Institute",
      "example_id" : "PATRIC:cds.000002.436951",
      "uri_prefix" : null,
      "generic_url" : "http://patric.vbi.vt.edu",
      "abbreviation" : "PATRIC",
      "url_example" : "http://patric.vbi.vt.edu/gene/overview.php?fid=cds.000002.436951"
   },
   "uniprotkb/trembl" : {
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "name" : null,
      "database" : "UniProtKB-TrEMBL protein sequence database",
      "object" : "Accession",
      "fullname" : null,
      "is_obsolete" : "true",
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "TrEMBL:O31124",
      "description" : "UniProtKB-TrEMBL, a computer-annotated protein sequence database supplementing UniProtKB and containing the translations of all coding sequences (CDS) present in the EMBL Nucleotide Sequence Database but not yet integrated in UniProtKB/Swiss-Prot",
      "id" : null,
      "url_example" : "http://www.uniprot.org/uniprot/O31124",
      "abbreviation" : "UniProtKB/TrEMBL",
      "replaced_by" : "UniProtKB",
      "generic_url" : "http://www.uniprot.org"
   },
   "coriell" : {
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=[example_id]",
      "database" : "Coriell Institute for Medical Research",
      "object" : "Identifier",
      "generic_url" : "http://ccr.coriell.org/",
      "url_example" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=GM07892",
      "abbreviation" : "CORIELL",
      "id" : null,
      "description" : "The Coriell Cell Repositories provide essential research reagents to the scientific community by establishing, verifying, maintaining, and distributing cell cultures and DNA derived from cell cultures. These collections, supported by funds from the National Institutes of Health (NIH) and several foundations, are extensively utilized by research scientists around the world. ",
      "example_id" : "GM07892",
      "uri_prefix" : null
   },
   "imgt_ligm" : {
      "generic_url" : "http://imgt.cines.fr",
      "url_example" : null,
      "abbreviation" : "IMGT_LIGM",
      "id" : null,
      "description" : "Database of immunoglobulins and T cell receptors from human and other vertebrates, with translation for fully annotated sequences.",
      "uri_prefix" : null,
      "example_id" : "IMGT_LIGM:U03895",
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : null,
      "database" : "ImMunoGeneTics database covering immunoglobulins and T-cell receptors",
      "name" : null,
      "object" : null
   },
   "ecogene_g" : {
      "uri_prefix" : null,
      "example_id" : "ECOGENE_G:deoC",
      "id" : null,
      "abbreviation" : "ECOGENE_G",
      "url_example" : null,
      "generic_url" : "http://www.ecogene.org/",
      "url_syntax" : null,
      "object" : "EcoGene Primary Gene Name",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "name" : null,
      "fullname" : null,
      "datatype" : null
   },
   "cgd_ref" : {
      "example_id" : "CGD_REF:1490",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "CGD_REF",
      "url_example" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=1490",
      "generic_url" : "http://www.candidagenome.org/",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "database" : "Candida Genome Database",
      "name" : null,
      "object" : "Literature Reference Identifier",
      "fullname" : null,
      "datatype" : null
   },
   "uberon" : {
      "abbreviation" : "UBERON",
      "url_example" : "http://purl.obolibrary.org/obo/UBERON_0002398",
      "generic_url" : "http://uberon.org",
      "local_id_syntax" : "^[0-9]{7}$",
      "description" : "A multi-species anatomy ontology",
      "uri_prefix" : null,
      "example_id" : "URBERON:0002398",
      "id" : null,
      "entity_type" : "UBERON:0001062 ! anatomical entity",
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/UBERON_[example_id]",
      "database" : "Uber-anatomy ontology",
      "object" : "Identifier",
      "fullname" : null
   },
   "iuphar_receptor" : {
      "generic_url" : "http://www.iuphar.org/",
      "abbreviation" : "IUPHAR_RECEPTOR",
      "url_example" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=56",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "IUPHAR_RECEPTOR:2205",
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=[example_id]",
      "database" : "International Union of Pharmacology",
      "name" : null,
      "object" : "Receptor identifier"
   },
   "fb" : {
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "object" : "Identifier",
      "database" : "FlyBase",
      "generic_url" : "http://flybase.org/",
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "abbreviation" : "FB",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "FB:FBgn0000024",
      "local_id_syntax" : "^FBgn[0-9]{7}$"
   },
   "ensembl_transcriptid" : {
      "url_example" : "http://www.ensembl.org/id/ENST00000371959",
      "abbreviation" : "ENSEMBL_TranscriptID",
      "generic_url" : "http://www.ensembl.org/",
      "uri_prefix" : null,
      "example_id" : "ENSEMBL_TranscriptID:ENST00000371959",
      "local_id_syntax" : "^ENST[0-9]{9,16}$",
      "id" : null,
      "entity_type" : "SO:0000673 ! transcript",
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "database" : "Ensembl database of automatically annotated genomic data",
      "object" : "Transcript identifier",
      "fullname" : null
   },
   "pamgo_gat" : {
      "id" : null,
      "example_id" : "PAMGO_GAT:Atu0001",
      "uri_prefix" : null,
      "generic_url" : "http://agro.vbi.vt.edu/public/",
      "abbreviation" : "PAMGO_GAT",
      "url_example" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=atu0001",
      "fullname" : null,
      "object" : "Gene",
      "url_syntax" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=[example_id]",
      "name" : null,
      "database" : "Genome Annotation Tool (Agrobacterium tumefaciens C58); PAMGO Interest Group",
      "datatype" : null
   },
   "uniprot" : {
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "abbreviation" : "UniProt",
      "generic_url" : "http://www.uniprot.org",
      "example_id" : "UniProtKB:P51587",
      "uri_prefix" : null,
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "local_id_syntax" : "^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}$",
      "id" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "datatype" : null,
      "database" : "Universal Protein Knowledgebase",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "object" : "Accession",
      "name" : null,
      "fullname" : null
   },
   "rebase" : {
      "datatype" : null,
      "url_syntax" : "http://rebase.neb.com/rebase/enz/[example_id].html",
      "object" : "Restriction enzyme name",
      "name" : null,
      "database" : "REBASE restriction enzyme database",
      "fullname" : null,
      "abbreviation" : "REBASE",
      "url_example" : "http://rebase.neb.com/rebase/enz/EcoRI.html",
      "generic_url" : "http://rebase.neb.com/rebase/rebase.html",
      "example_id" : "REBASE:EcoRI",
      "uri_prefix" : null,
      "id" : null
   },
   "ecoliwiki" : {
      "generic_url" : "http://ecoliwiki.net/",
      "url_example" : null,
      "abbreviation" : "EcoliWiki",
      "id" : null,
      "description" : "EcoliHub's subsystem for community annotation of E. coli K-12",
      "example_id" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "^[A-Za-z]{3,4}$",
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "EcoliWiki from EcoliHub",
      "object" : null
   },
   "brenda" : {
      "url_example" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=4.2.1.3",
      "abbreviation" : "BRENDA",
      "generic_url" : "http://www.brenda-enzymes.info",
      "example_id" : "BRENDA:4.2.1.3",
      "uri_prefix" : null,
      "id" : null,
      "entity_type" : "GO:0003824 ! catalytic activity",
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=[example_id]",
      "object" : "EC enzyme identifier",
      "database" : "BRENDA, The Comprehensive Enzyme Information System",
      "fullname" : null
   },
   "um-bbd_ruleid" : {
      "abbreviation" : "UM-BBD_ruleID",
      "url_example" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=bt0330",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "uri_prefix" : null,
      "example_id" : "UM-BBD_ruleID:bt0330",
      "id" : null,
      "datatype" : null,
      "object" : "Rule identifier",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=[example_id]",
      "name" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "fullname" : null
   },
   "unimod" : {
      "fullname" : null,
      "url_syntax" : "http://www.unimod.org/modifications_view.php?editid1=[example_id]",
      "database" : "UniMod",
      "name" : null,
      "object" : "Identifier",
      "datatype" : null,
      "id" : null,
      "example_id" : "UniMod:1287",
      "description" : "protein modifications for mass spectrometry",
      "uri_prefix" : null,
      "generic_url" : "http://www.unimod.org/",
      "abbreviation" : "UniMod",
      "url_example" : "http://www.unimod.org/modifications_view.php?editid1=1287"
   },
   "flybase" : {
      "fullname" : null,
      "name" : null,
      "object" : "Identifier",
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "database" : "FlyBase",
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene",
      "id" : null,
      "local_id_syntax" : "^FBgn[0-9]{7}$",
      "example_id" : "FB:FBgn0000024",
      "uri_prefix" : null,
      "generic_url" : "http://flybase.org/",
      "abbreviation" : "FLYBASE",
      "url_example" : "http://flybase.org/reports/FBgn0000024.html"
   },
   "eurofung" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://www.eurofung.net/option=com_content&task=section&id=3&Itemid=4",
      "url_example" : null,
      "abbreviation" : "Eurofung",
      "fullname" : null,
      "url_syntax" : null,
      "object" : null,
      "name" : null,
      "database" : "Eurofungbase community annotation",
      "datatype" : null
   },
   "cog_cluster" : {
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=[example_id]",
      "name" : null,
      "database" : "NCBI COG cluster",
      "object" : "Identifier",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=COG0001",
      "abbreviation" : "COG_Cluster",
      "id" : null,
      "example_id" : "COG_Cluster:COG0001",
      "uri_prefix" : null
   },
   "go_ref" : {
      "local_id_syntax" : "^\\d{7}$",
      "example_id" : "GO_REF:0000001",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "GO_REF",
      "url_example" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000001",
      "generic_url" : "http://www.geneontology.org/",
      "object" : "Accession (for reference)",
      "url_syntax" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:[example_id]",
      "database" : "Gene Ontology Database references",
      "name" : null,
      "fullname" : null,
      "datatype" : null
   },
   "wb_ref" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "WB_REF:WBPaper00004823",
      "generic_url" : "http://www.wormbase.org/",
      "url_example" : "http://www.wormbase.org/db/misc/paper?name=WBPaper00004823",
      "abbreviation" : "WB_REF",
      "fullname" : null,
      "database" : "WormBase database of nematode biology",
      "url_syntax" : "http://www.wormbase.org/db/misc/paper?name=[example_id]",
      "name" : null,
      "object" : "Literature Reference Identifier",
      "datatype" : null
   },
   "sanger" : {
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "Sanger",
      "url_example" : null,
      "generic_url" : "http://www.sanger.ac.uk/",
      "url_syntax" : null,
      "database" : "Wellcome Trust Sanger Institute",
      "name" : null,
      "object" : null,
      "fullname" : null,
      "datatype" : null
   },
   "phi" : {
      "object" : null,
      "url_syntax" : null,
      "database" : "MeGO (Phage and Mobile Element Ontology)",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : "PHI:0000055",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "PHI",
      "url_example" : null,
      "generic_url" : "http://aclame.ulb.ac.be/Classification/mego.html"
   },
   "jcvi" : {
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "JCVI",
      "url_example" : null,
      "generic_url" : "http://www.jcvi.org/",
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "database" : "J. Craig Venter Institute",
      "fullname" : null,
      "datatype" : null
   },
   "metacyc" : {
      "generic_url" : "http://metacyc.org/",
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=GLUTDEG-PWY",
      "abbreviation" : "MetaCyc",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "MetaCyc:GLUTDEG-PWY",
      "datatype" : null,
      "fullname" : null,
      "database" : "Metabolic Encyclopedia of metabolic and other pathways",
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=[example_id]",
      "name" : null,
      "object" : "Identifier (pathway or reaction)"
   },
   "vega" : {
      "fullname" : null,
      "url_syntax" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=[example_id]",
      "name" : null,
      "database" : "Vertebrate Genome Annotation database",
      "object" : "Identifier",
      "datatype" : null,
      "id" : null,
      "example_id" : "VEGA:OTTHUMP00000000661",
      "uri_prefix" : null,
      "generic_url" : "http://vega.sanger.ac.uk/index.html",
      "abbreviation" : "VEGA",
      "url_example" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=OTTHUMP00000000661"
   },
   "gr_protein" : {
      "example_id" : "GR_PROTEIN:Q6VSV0",
      "uri_prefix" : null,
      "local_id_syntax" : "^[A-Z][0-9][A-Z0-9]{3}[0-9]$",
      "id" : null,
      "url_example" : "http://www.gramene.org/db/protein/protein_search?acc=Q6VSV0",
      "abbreviation" : "GR_protein",
      "generic_url" : "http://www.gramene.org/",
      "url_syntax" : "http://www.gramene.org/db/protein/protein_search?acc=[example_id]",
      "database" : null,
      "object" : "Protein identifier",
      "name" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains"
   },
   "gr_qtl" : {
      "fullname" : null,
      "url_syntax" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=[example_id]",
      "name" : null,
      "database" : null,
      "object" : "QTL identifier",
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "GR_QTL:CQU7",
      "generic_url" : "http://www.gramene.org/",
      "abbreviation" : "GR_QTL",
      "url_example" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=CQU7"
   },
   "prosite" : {
      "entity_type" : "SO:0000839 ! polypeptide region",
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?[example_id]",
      "database" : "Prosite database of protein families and domains",
      "object" : "Accession",
      "fullname" : null,
      "url_example" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?PS00365",
      "abbreviation" : "Prosite",
      "generic_url" : "http://www.expasy.ch/prosite/",
      "example_id" : "Prosite:PS00365",
      "uri_prefix" : null,
      "id" : null
   },
   "medline" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "object" : "Identifier",
      "database" : "Medline literature database",
      "datatype" : null,
      "id" : null,
      "example_id" : "MEDLINE:20572430",
      "uri_prefix" : null,
      "generic_url" : "http://www.nlm.nih.gov/databases/databases_medline.html",
      "abbreviation" : "MEDLINE",
      "url_example" : null
   },
   "omim" : {
      "database" : "Mendelian Inheritance in Man",
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "OMIM:190198",
      "id" : null,
      "abbreviation" : "OMIM",
      "url_example" : "http://omim.org/entry/190198",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM"
   },
   "aspgd_locus" : {
      "example_id" : "AspGD_LOCUS:AN10942",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "AspGD_LOCUS",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=AN10942",
      "generic_url" : "http://www.aspergillusgenome.org/",
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "database" : "Aspergillus Genome Database",
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "name" : null,
      "fullname" : null,
      "datatype" : null
   },
   "wp" : {
      "is_obsolete" : "true",
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.wormbase.org/db/get?class=Protein;name=WP:[example_id]",
      "database" : "Wormpep database of proteins of C. elegans",
      "name" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.wormbase.org/",
      "url_example" : "http://www.wormbase.org/db/get?class=Protein;name=WP:CE15104",
      "abbreviation" : "WP",
      "id" : null,
      "example_id" : "WP:CE25104",
      "uri_prefix" : null
   },
   "h-invdb_locus" : {
      "example_id" : "H-invDB_locus:HIX0014446",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "H-invDB_locus",
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=HIX0014446",
      "generic_url" : "http://www.h-invitational.jp/",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=[example_id]",
      "object" : "Cluster identifier",
      "name" : null,
      "database" : "H-invitational Database",
      "fullname" : null,
      "datatype" : null
   },
   "pinc" : {
      "abbreviation" : "PINC",
      "url_example" : null,
      "generic_url" : "http://www.proteome.com/",
      "description" : "represents GO annotations created in 2001 for NCBI and extracted into UniProtKB-GOA from EntrezGene",
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "database" : "Proteome Inc.",
      "url_syntax" : null,
      "object" : null,
      "name" : null,
      "fullname" : null
   },
   "ncbi_np" : {
      "example_id" : "NCBI_NP:123456",
      "uri_prefix" : null,
      "id" : null,
      "replaced_by" : "RefSeq",
      "abbreviation" : "NCBI_NP",
      "url_example" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "url_syntax" : null,
      "database" : "NCBI RefSeq",
      "name" : null,
      "object" : "Protein identifier",
      "fullname" : null,
      "datatype" : null,
      "is_obsolete" : "true"
   },
   "fypo" : {
      "example_id" : "FYPO:0000001",
      "uri_prefix" : null,
      "local_id_syntax" : "^\\d{7}$",
      "id" : null,
      "url_example" : null,
      "abbreviation" : "FYPO",
      "generic_url" : "http://www.pombase.org/",
      "url_syntax" : null,
      "name" : null,
      "object" : "Identifier",
      "database" : "Fission Yeast Phenotype Ontology",
      "fullname" : null,
      "datatype" : null
   },
   "go_central" : {
      "datatype" : null,
      "fullname" : null,
      "database" : "GO Central",
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "url_example" : null,
      "abbreviation" : "GO_Central",
      "id" : null,
      "description" : "Manual annotation from PAINT curators into the UniProt Protein2GO curation tool.",
      "uri_prefix" : null,
      "example_id" : null
   },
   "um-bbd_pathwayid" : {
      "url_syntax" : "http://umbbd.msi.umn.edu/[example_id]/[example_id]_map.html",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "object" : "Pathway identifier",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : "UM-BBD_pathwayID:acr",
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://umbbd.msi.umn.edu/acr/acr_map.html",
      "abbreviation" : "UM-BBD_pathwayID",
      "generic_url" : "http://umbbd.msi.umn.edu/"
   },
   "hgnc" : {
      "generic_url" : "http://www.genenames.org/",
      "abbreviation" : "HGNC",
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:29",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "HGNC:29",
      "datatype" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "object" : "Identifier",
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:[example_id]",
      "name" : null,
      "database" : "HUGO Gene Nomenclature Committee"
   },
   "mesh" : {
      "example_id" : "MeSH:mitosis",
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=mitosis",
      "abbreviation" : "MeSH",
      "generic_url" : "http://www.nlm.nih.gov/mesh/2005/MBrowser.html",
      "database" : "Medical Subject Headings",
      "url_syntax" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=[example_id]",
      "object" : "MeSH heading",
      "name" : null,
      "fullname" : null,
      "datatype" : null
   },
   "tigr_ref" : {
      "id" : null,
      "example_id" : "JCVI_REF:GO_ref",
      "uri_prefix" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "abbreviation" : "TIGR_REF",
      "fullname" : null,
      "database" : "J. Craig Venter Institute",
      "name" : null,
      "url_syntax" : null,
      "object" : "Reference locator",
      "datatype" : null
   },
   "pubchem_bioassay" : {
      "url_syntax" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=[example_id]",
      "database" : "NCBI PubChem database of bioassay records",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "PubChem_BioAssay:177",
      "id" : null,
      "url_example" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=177",
      "abbreviation" : "PubChem_BioAssay",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/"
   },
   "genedb_tbrucei" : {
      "id" : null,
      "local_id_syntax" : "^Tb\\d+\\.\\d+\\.\\d+$",
      "url_example" : "http://www.genedb.org/genedb/Search?organism=tryp&name=Tb927.1.5250",
      "replaced_by" : "GeneDB",
      "fullname" : null,
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=tryp&name=[example_id]",
      "is_obsolete" : "true",
      "example_id" : "GeneDB_Tbrucei:Tb927.1.5250",
      "uri_prefix" : null,
      "generic_url" : "http://www.genedb.org/genedb/tryp/",
      "shorthand_name" : "Tbrucei",
      "abbreviation" : "GeneDB_Tbrucei",
      "database" : "Trypanosoma brucei GeneDB",
      "object" : "Gene identifier",
      "name" : null,
      "datatype" : null
   },
   "bfo" : {
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/BFO_[example_id]",
      "database" : "Basic Formal Ontology",
      "name" : null,
      "object" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/bfo",
      "abbreviation" : "BFO",
      "url_example" : "http://purl.obolibrary.org/obo/BFO_0000066",
      "id" : null,
      "description" : "An upper ontology used by Open Bio Ontologies (OBO) Foundry. BFO contains upper-level classes as well as core relations such as part_of (BFO_0000050)",
      "uri_prefix" : null,
      "example_id" : "BFO:0000066"
   },
   "broad_mgg" : {
      "fullname" : null,
      "database" : "Magnaporthe grisea Database",
      "url_syntax" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=S[example_id]",
      "object" : "Locus",
      "name" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "description" : "Magnaporthe grisea Database at the Broad Institute",
      "example_id" : "Broad_MGG:MGG_05132.5",
      "generic_url" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/Home.html",
      "url_example" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=SMGG_05132",
      "abbreviation" : "Broad_MGG"
   },
   "ppi" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://genome.pseudomonas-syringae.org/",
      "abbreviation" : "PPI",
      "url_example" : null,
      "fullname" : null,
      "url_syntax" : null,
      "object" : null,
      "database" : "Pseudomonas syringae community annotation project",
      "name" : null,
      "datatype" : null
   },
   "locsvmpsi" : {
      "url_example" : null,
      "abbreviation" : "LOCSVMpsi",
      "generic_url" : "http://bioinformatics.ustc.edu.cn/locsvmpsi/locsvmpsi.php",
      "uri_prefix" : null,
      "description" : "Subcellular localization for eukayotic proteins based on SVM and PSI-BLAST",
      "example_id" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "object" : null,
      "database" : "LOCSVMPSI",
      "name" : null,
      "fullname" : null
   },
   "ipr" : {
      "database" : "InterPro database of protein domains and motifs",
      "name" : null,
      "object" : "Identifier",
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "InterPro:IPR000001",
      "local_id_syntax" : "^IPR\\d{6}$",
      "id" : null,
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "abbreviation" : "IPR",
      "generic_url" : "http://www.ebi.ac.uk/interpro/"
   },
   "ensembl_geneid" : {
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "name" : null,
      "database" : "Ensembl database of automatically annotated genomic data",
      "object" : "Gene identifier",
      "fullname" : null,
      "url_example" : "http://www.ensembl.org/id/ENSG00000126016",
      "abbreviation" : "ENSEMBL_GeneID",
      "generic_url" : "http://www.ensembl.org/",
      "uri_prefix" : null,
      "example_id" : "ENSEMBL_GeneID:ENSG00000126016",
      "local_id_syntax" : "^ENSG[0-9]{9,16}$",
      "id" : null
   },
   "pharmgkb" : {
      "id" : null,
      "example_id" : "PharmGKB:PA267",
      "uri_prefix" : null,
      "generic_url" : "http://www.pharmgkb.org",
      "abbreviation" : "PharmGKB",
      "url_example" : "http://www.pharmgkb.org/do/serve?objId=PA267",
      "fullname" : null,
      "database" : "Pharmacogenetics and Pharmacogenomics Knowledge Base",
      "url_syntax" : "http://www.pharmgkb.org/do/serve?objId=[example_id]",
      "object" : null,
      "name" : null,
      "datatype" : null
   },
   "broad_neurospora" : {
      "datatype" : null,
      "database" : "Neurospora crassa Database",
      "url_syntax" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S[example_id]",
      "name" : null,
      "object" : "Identifier for Broad_Ncrassa Loci",
      "fullname" : null,
      "url_example" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S7000007580576824",
      "abbreviation" : "Broad_NEUROSPORA",
      "generic_url" : "http://www.broadinstitute.org/annotation/genome/neurospora/MultiHome.html",
      "uri_prefix" : null,
      "description" : "Neurospora crassa database at the Broad Institute",
      "example_id" : "BROAD_NEUROSPORA:7000007580576824",
      "id" : null
   },
   "biopixie_mefit" : {
      "datatype" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "biological Process Inference from eXperimental Interaction Evidence/Microarray Experiment Functional Integration Technology",
      "object" : null,
      "fullname" : null,
      "url_example" : null,
      "abbreviation" : "bioPIXIE_MEFIT",
      "generic_url" : "http://pixie.princeton.edu/pixie/",
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "casref" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=[example_id]",
      "database" : "Catalog of Fishes publications database",
      "object" : "Identifier",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "CASREF:2031",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "abbreviation" : "CASREF",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=2031"
   },
   "jcvi_tba1" : {
      "datatype" : null,
      "is_obsolete" : "true",
      "name" : null,
      "url_syntax" : null,
      "database" : "Trypanosoma brucei database at the J. Craig Venter Institute",
      "object" : "Accession",
      "fullname" : null,
      "url_example" : null,
      "abbreviation" : "JCVI_Tba1",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/tba1/",
      "example_id" : "JCVI_Tba1:25N14.10",
      "uri_prefix" : null,
      "id" : null
   },
   "agi_locuscode" : {
      "entity_type" : "SO:0000704 ! gene",
      "!url_syntax" : "http://www.tigr.org/tigr-scripts/euk_manatee/shared/ORF_infopage.cgi?db=ath1&orf=[example_id]",
      "!url_example" : "http://www.tigr.org/tigr-scripts/euk_manatee/shared/ORF_infopage.cgi?db=ath1&orf=At2g17950",
      "datatype" : null,
      "object" : "Locus identifier",
      "name" : null,
      "database" : "Arabidopsis Genome Initiative",
      "abbreviation" : "AGI_LocusCode",
      "generic_url" : "http://www.arabidopsis.org",
      "uri_prefix" : null,
      "example_id" : "AGI_LocusCode:At2g17950",
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=[example_id]",
      "fullname" : null,
      "url_example" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=At2g17950",
      "local_id_syntax" : "^AT[MC0-5]G[0-9]{5}(\\.[0-9]{1})?$",
      "description" : "Comprises TAIR, TIGR and MIPS",
      "id" : null
   },
   "uniprotkb-kw" : {
      "id" : null,
      "example_id" : "UniProtKB-KW:KW-0812",
      "uri_prefix" : null,
      "generic_url" : "http://www.uniprot.org/keywords/",
      "abbreviation" : "UniProtKB-KW",
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "fullname" : null,
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "database" : "UniProt Knowledgebase keywords",
      "name" : null,
      "object" : "Identifier",
      "datatype" : null
   },
   "unipathway" : {
      "entity_type" : "GO:0008150 ! biological process",
      "datatype" : null,
      "name" : null,
      "url_syntax" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=[example_id]",
      "database" : "UniPathway",
      "object" : "Identifier",
      "fullname" : null,
      "url_example" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=UPA00155",
      "abbreviation" : "UniPathway",
      "generic_url" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway",
      "uri_prefix" : null,
      "description" : "UniPathway is a a metabolic door to UniProtKB/Swiss-Prot, a curated resource of metabolic pathways for the UniProtKB/Swiss-Prot knowledgebase.",
      "example_id" : "UniPathway:UPA00155",
      "id" : null
   },
   "uniprotkb" : {
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "fullname" : null,
      "object" : "Accession",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "name" : null,
      "database" : "Universal Protein Knowledgebase",
      "generic_url" : "http://www.uniprot.org",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "abbreviation" : "UniProtKB",
      "id" : null,
      "uri_prefix" : null,
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "example_id" : "UniProtKB:P51587",
      "local_id_syntax" : "^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}$"
   },
   "fma" : {
      "id" : null,
      "example_id" : "FMA:61905",
      "uri_prefix" : null,
      "generic_url" : "http://sig.biostr.washington.edu/projects/fm/index.html",
      "abbreviation" : "FMA",
      "url_example" : null,
      "fullname" : null,
      "database" : "Foundational Model of Anatomy",
      "url_syntax" : null,
      "name" : null,
      "object" : "Identifier",
      "datatype" : null
   },
   "jcvi_cmr" : {
      "abbreviation" : "JCVI_CMR",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "generic_url" : "http://cmr.jcvi.org/",
      "uri_prefix" : null,
      "example_id" : "JCVI_CMR:VCA0557",
      "id" : null,
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "object" : "Locus",
      "name" : null,
      "database" : "Comprehensive Microbial Resource at the J. Craig Venter Institute",
      "fullname" : null
   },
   "ensemblplants" : {
      "entity_type" : "SO:0000704 ! gene",
      "datatype" : null,
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "name" : null,
      "object" : "Identifier",
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "fullname" : null,
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "abbreviation" : "EnsemblPlants",
      "generic_url" : "http://plants.ensembl.org/",
      "uri_prefix" : null,
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "id" : null
   },
   "subtilistg" : {
      "object" : "Gene symbol",
      "url_syntax" : null,
      "database" : "Bacillus subtilis Genome Sequence Project",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "example_id" : "SUBTILISTG:accC",
      "uri_prefix" : null,
      "id" : null,
      "url_example" : null,
      "abbreviation" : "SUBTILISTG",
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/"
   },
   "tigr_ath1" : {
      "is_obsolete" : "true",
      "datatype" : null,
      "object" : "Accession",
      "url_syntax" : null,
      "database" : "Arabidopsis thaliana database at the J. Craig Venter Institute",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "TIGR_Ath1",
      "url_example" : null,
      "generic_url" : "http://www.tigr.org/tdb/e2k1/ath1/ath1.shtml",
      "example_id" : "JCVI_Ath1:At3g01440",
      "uri_prefix" : null,
      "id" : null
   },
   "rhea" : {
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=[example_id]",
      "object" : "Accession",
      "database" : "Rhea, the Annotated Reactions Database",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "description" : "Rhea is a freely available, manually annotated database of chemical reactions created in collaboration with the Swiss Institute of Bioinformatics (SIB).",
      "example_id" : "RHEA:25811",
      "generic_url" : "http://www.ebi.ac.uk/rhea/",
      "abbreviation" : "RHEA",
      "url_example" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=25811"
   },
   "casgen" : {
      "datatype" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "name" : null,
      "database" : "Catalog of Fishes genus database",
      "object" : "Identifier",
      "fullname" : null,
      "abbreviation" : "CASGEN",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "uri_prefix" : null,
      "example_id" : "CASGEN:1040",
      "id" : null
   },
   "ncbi_nm" : {
      "datatype" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "database" : "NCBI RefSeq",
      "url_syntax" : null,
      "name" : null,
      "object" : "mRNA identifier",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "replaced_by" : "RefSeq",
      "abbreviation" : "NCBI_NM",
      "url_example" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "NCBI_NM:123456"
   },
   "chebi" : {
      "fullname" : null,
      "url_syntax" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:[example_id]",
      "object" : "Identifier",
      "database" : "Chemical Entities of Biological Interest",
      "name" : null,
      "datatype" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity ",
      "id" : null,
      "local_id_syntax" : "^[0-9]{1,6}$",
      "uri_prefix" : null,
      "example_id" : "CHEBI:17234",
      "generic_url" : "http://www.ebi.ac.uk/chebi/",
      "abbreviation" : "ChEBI",
      "url_example" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:17234"
   },
   "mo" : {
      "generic_url" : "http://mged.sourceforge.net/ontologies/MGEDontology.php",
      "abbreviation" : "MO",
      "url_example" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#Action",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "MO:Action",
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#[example_id]",
      "object" : "ontology term",
      "database" : "MGED Ontology"
   },
   "ecocyc_ref" : {
      "fullname" : null,
      "database" : "Encyclopedia of E. coli metabolism",
      "name" : null,
      "url_syntax" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=[example_id]",
      "object" : "Reference identifier",
      "datatype" : null,
      "id" : null,
      "example_id" : "EcoCyc_REF:COLISALII",
      "uri_prefix" : null,
      "generic_url" : "http://ecocyc.org/",
      "abbreviation" : "ECOCYC_REF",
      "url_example" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=COLISALII"
   },
   "tigr_tba1" : {
      "url_example" : null,
      "abbreviation" : "TIGR_Tba1",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/tba1/",
      "uri_prefix" : null,
      "example_id" : "JCVI_Tba1:25N14.10",
      "id" : null,
      "is_obsolete" : "true",
      "datatype" : null,
      "name" : null,
      "url_syntax" : null,
      "object" : "Accession",
      "database" : "Trypanosoma brucei database at the J. Craig Venter Institute",
      "fullname" : null
   },
   "cl" : {
      "generic_url" : "http://cellontology.org",
      "abbreviation" : "CL",
      "url_example" : "http://purl.obolibrary.org/obo/CL_0000041",
      "id" : null,
      "local_id_syntax" : "^[0-9]{7}$",
      "uri_prefix" : null,
      "example_id" : "CL:0000041",
      "datatype" : null,
      "entity_type" : "CL:0000000 ! cell ",
      "fullname" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/CL_[example_id]",
      "name" : null,
      "database" : "Cell Type Ontology",
      "object" : "Identifier"
   },
   "dflat" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "generic_url" : "http://bcb.cs.tufts.edu/dflat/",
      "abbreviation" : "DFLAT",
      "url_example" : null,
      "fullname" : null,
      "database" : "Developmental FunctionaL Annotation at Tufts",
      "url_syntax" : null,
      "name" : null,
      "object" : null,
      "datatype" : null
   },
   "ptarget" : {
      "uri_prefix" : null,
      "example_id" : null,
      "id" : null,
      "abbreviation" : "pTARGET",
      "url_example" : null,
      "generic_url" : "http://bioinformatics.albany.edu/~ptarget/",
      "name" : null,
      "url_syntax" : null,
      "object" : null,
      "database" : "pTARGET Prediction server for protein subcellular localization",
      "fullname" : null,
      "datatype" : null
   },
   "merops" : {
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=[example_id]",
      "database" : "MEROPS peptidase database",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null,
      "example_id" : "MEROPS:A08.001",
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=A08.001",
      "abbreviation" : "MEROPS",
      "generic_url" : "http://merops.sanger.ac.uk/"
   },
   "vbrc" : {
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "VBRC:F35742",
      "generic_url" : "http://vbrc.org",
      "abbreviation" : "VBRC",
      "url_example" : "http://vbrc.org/query.asp?web_id=VBRC:F35742",
      "fullname" : null,
      "database" : "Viral Bioinformatics Resource Center",
      "url_syntax" : "http://vbrc.org/query.asp?web_id=VBRC:[example_id]",
      "name" : null,
      "object" : "Identifier",
      "datatype" : null
   },
   "ro" : {
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "url_example" : "http://purl.obolibrary.org/obo/RO_0002211",
      "abbreviation" : "RO",
      "id" : null,
      "description" : "A collection of relations used across OBO ontologies",
      "uri_prefix" : null,
      "example_id" : "RO:0002211",
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/RO_[example_id]",
      "database" : "OBO Relation Ontology Ontology",
      "name" : null,
      "object" : null
   },
   "mim" : {
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "name" : null,
      "object" : "Identifier",
      "database" : "Mendelian Inheritance in Man",
      "fullname" : null,
      "datatype" : null,
      "example_id" : "OMIM:190198",
      "uri_prefix" : null,
      "id" : null,
      "abbreviation" : "MIM",
      "url_example" : "http://omim.org/entry/190198",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM"
   },
   "cacao" : {
      "fullname" : null,
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "database" : "Community Assessment of Community Annotation with Ontologies",
      "object" : "accession",
      "name" : null,
      "datatype" : null,
      "id" : null,
      "description" : "The Community Assessment of Community Annotation with Ontologies (CACAO) is a project to do large-scale manual community annotation of gene function using the Gene Ontology as a multi-institution student competition. ",
      "example_id" : "MYCS2:A0QNF5",
      "uri_prefix" : null,
      "generic_url" : "http://gowiki.tamu.edu/wiki/index.php/Category:CACAO",
      "abbreviation" : "CACAO",
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MYCS2:A0QNF5"
   },
   "syscilia_ccnet" : {
      "id" : null,
      "description" : "A systems biology approach to dissect cilia function and its disruption in human genetic disease",
      "example_id" : null,
      "uri_prefix" : null,
      "generic_url" : "http://syscilia.org/",
      "url_example" : null,
      "abbreviation" : "SYSCILIA_CCNET",
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "database" : "Syscilia",
      "name" : null,
      "datatype" : null
   },
   "prow" : {
      "datatype" : null,
      "name" : null,
      "url_syntax" : null,
      "database" : "Protein Reviews on the Web",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PROW",
      "url_example" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/prow/",
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "hgnc_gene" : {
      "id" : null,
      "example_id" : "HGNC_gene:ABCA1",
      "uri_prefix" : null,
      "generic_url" : "http://www.genenames.org/",
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?app_sym=ABCA1",
      "abbreviation" : "HGNC_gene",
      "fullname" : null,
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?app_sym=[example_id]",
      "name" : null,
      "database" : "HUGO Gene Nomenclature Committee",
      "object" : "Gene symbol",
      "datatype" : null
   },
   "panther" : {
      "generic_url" : "http://www.pantherdb.org/",
      "url_example" : "http://www.pantherdb.org/panther/lookupId.jsp?id=PTHR10000",
      "abbreviation" : "PANTHER",
      "id" : null,
      "example_id" : "PANTHER:PTHR11455",
      "uri_prefix" : null,
      "datatype" : null,
      "fullname" : null,
      "url_syntax" : "http://www.pantherdb.org/panther/lookupId.jsp?id=[example_id]",
      "object" : "Protein family tree identifier",
      "database" : "Protein ANalysis THrough Evolutionary Relationships Classification System",
      "name" : null
   },
   "jcvi_genprop" : {
      "abbreviation" : "JCVI_GenProp",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "generic_url" : "http://cmr.jcvi.org/",
      "local_id_syntax" : "^GenProp[0-9]{4}$",
      "uri_prefix" : null,
      "example_id" : "JCVI_GenProp:GenProp0120",
      "id" : null,
      "entity_type" : "GO:0008150 ! biological process",
      "datatype" : null,
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "name" : null,
      "object" : "Accession",
      "fullname" : null
   },
   "ddanat" : {
      "entity_type" : "UBERON:0001062 ! anatomical entity",
      "datatype" : null,
      "url_syntax" : null,
      "database" : "Dictyostelium discoideum anatomy",
      "name" : null,
      "object" : "Identifier",
      "fullname" : null,
      "abbreviation" : "DDANAT",
      "url_example" : null,
      "generic_url" : "http://dictybase.org/Dicty_Info/dicty_anatomy_ontology.html",
      "local_id_syntax" : "[0-9]{7}",
      "example_id" : "DDANAT:0000068",
      "uri_prefix" : null,
      "id" : null
   },
   "agbase" : {
      "url_example" : null,
      "abbreviation" : "AgBase",
      "generic_url" : "http://www.agbase.msstate.edu/",
      "uri_prefix" : null,
      "example_id" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.agbase.msstate.edu/cgi-bin/getEntry.pl?db_pick=[ChickGO/MaizeGO]&uid=[example_id]",
      "object" : null,
      "database" : "AgBase resource for functional analysis of agricultural plant and animal gene products",
      "name" : null,
      "fullname" : null
   },
   "refseq_na" : {
      "datatype" : null,
      "is_obsolete" : "true",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "database" : "RefSeq (Nucleic Acid)",
      "object" : "Identifier",
      "name" : null,
      "fullname" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=NC_000913",
      "abbreviation" : "RefSeq_NA",
      "replaced_by" : "RefSeq",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "example_id" : "RefSeq_NA:NC_000913",
      "uri_prefix" : null,
      "id" : null
   },
   "ntnu_sb" : {
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : null,
      "object" : null,
      "database" : "Norwegian University of Science and Technology, Systems Biology team",
      "generic_url" : "http://www.ntnu.edu/nt/systemsbiology",
      "url_example" : null,
      "abbreviation" : "NTNU_SB",
      "id" : null,
      "example_id" : null,
      "uri_prefix" : null
   },
   "pompep" : {
      "datatype" : null,
      "fullname" : null,
      "object" : "Gene/protein identifier",
      "url_syntax" : null,
      "database" : "Schizosaccharomyces pombe protein data",
      "name" : null,
      "generic_url" : "ftp://ftp.sanger.ac.uk/pub/yeast/pombe/Protein_data/",
      "url_example" : null,
      "abbreviation" : "Pompep",
      "id" : null,
      "example_id" : "Pompep:SPAC890.04C",
      "uri_prefix" : null
   },
   "ecocyc" : {
      "abbreviation" : "EcoCyc",
      "url_example" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=P2-PWY",
      "generic_url" : "http://ecocyc.org/",
      "local_id_syntax" : "^EG[0-9]{5}$",
      "example_id" : "EcoCyc:P2-PWY",
      "uri_prefix" : null,
      "id" : null,
      "entity_type" : "GO:0008150 ! biological process",
      "datatype" : null,
      "url_syntax" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "database" : "Encyclopedia of E. coli metabolism",
      "name" : null,
      "object" : "Pathway identifier",
      "fullname" : null
   },
   "uniprotkb-subcell" : {
      "generic_url" : "http://www.uniprot.org/locations/",
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "abbreviation" : "UniProtKB-SubCell",
      "id" : null,
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "uri_prefix" : null,
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "object" : "Identifier"
   }
};
/* 
 * Package: dispatch.js
 * 
 * Namespace: amigo.data.dispatch
 * 
 * This package was automatically created during an AmiGO 2 installation
 * from the YAML configuration files that AmiGO pulls in.
 *
 * The mapping file for data fields and contexts to functions, often
 * used for displays. See the package <handler.js> for the API to interact
 * with this data file.
 *
 * NOTE: This file is generated dynamically at installation time.
 * Hard to work with unit tests--hope it's not too bad. You have to
 * occasionally copy back to keep the unit tests sane.
 *
 * NOTE: This file has a slightly different latout from the YAML
 * configuration file.
 */

// All of the server/instance-specific meta-data.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: dispatch
 * 
 * The configuration for the data.
 * Essentially a JSONification of the YAML file.
 * This should be consumed directly by <amigo.handler>.
 */
amigo.data.dispatch = {
   "annotation_extension_json" : {
      "context" : {
         "bbop.widgets.search_pane" : "amigo.handlers.owl_class_expression"
      }
   }
};
/*
 * Package: context.js
 * 
 * Namespace: amigo.data.context
 * 
 * Another context.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: context
 * 
 * Colors are X11: http://cng.seas.rochester.edu/CNG/docs/x11color.html
 */
amigo.data.context = {
    'instance_of':
    {
	readable: 'activity',
	priority: 8,
	aliases: [
	    'activity'
	],
	color: '#FFFAFA' // snow
    },
    'BFO:0000050':
    {
	readable: 'part of',
	priority: 15,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000050',
		//'http://purl.obolibrary.org/obo/part_of',
	    'BFO_0000050',
	    'part:of',
	    'part of',
	    'part_of'
	],
	color: '#add8e6' // light blue
    },
    'BFO:0000051':
    {
	readable: 'has part',
	priority: 4,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
	    'has:part',
	    'has part',
	    'has_part'
	],
	color: '#6495ED' // cornflower blue
    },
    'BFO:0000066':
    {
	readable: 'occurs in',
	priority: 12,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000066',
		//'BFO_0000066',
	    'occurs:in',
	    'occurs in',
	    'occurs_in'
	],
	color: '#66CDAA' // medium aquamarine
    },
    'RO:0002202':
    {
	readable: 'develops from',
	priority: 0,
	aliases: [
	    'develops:from',
	    'develops from',
	    'develops_from'
	],
	color: '#A52A2A' // brown
    },
    'RO:0002211':
    {
	readable: 'regulates',
	priority: 16,
	aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002211'
	    'regulates'
	],
	color: '#2F4F4F' // dark slate grey
    },
    'RO:0002212':
    {
	readable: 'negatively regulates',
	priority: 17,
	aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002212'
	    'negatively:regulates',
	    'negatively regulates',
	    'negatively_regulates'
	],
	glyph: 'bar',
	color: '#FF0000' // red
    },
    'RO:0002213':
    {
	readable: 'positively regulates',
	priority: 18,
	aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002213'
	    'positively:regulates',
	    'positively regulates',
	    'positively_regulates'
	],
	glyph: 'arrow',
	color: '#008000' //green
    },
    'RO:0002233':
    {
	readable: 'has input',
	priority: 14,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
	    'has:input',
	    'has input',
	    'has_input'
	],
	color: '#6495ED' // cornflower blue
    },
    'RO:0002234':
    {
	readable: 'has output',
	priority: 0,
	aliases: [
	    'has:output',
	    'has output',
	    'has_output'
	],
	color: '#ED6495' // ??? - random
    },
    'RO:0002330':
    {
	readable: 'genomically related to',
	priority: 0,
	aliases: [
	    'genomically related to',
	    'genomically_related_to'
	],
	color: '#9932CC' // darkorchid
    },
    'RO:0002331':
    {
	readable: 'involved in',
	priority: 3,
	aliases: [
	    'involved:in',
	    'involved in',
	    'involved_in'
	],
	color: '#E9967A' // darksalmon
    },
    'RO:0002332':
    {
	readable: 'regulates level of',
	priority: 0,
	aliases: [
	    'regulates level of',
	    'regulates_level_of'
	],
	color: '#556B2F' // darkolivegreen
    },
    'RO:0002333':
    {
	readable: 'enabled by',
	priority: 13,
	aliases: [
	    'RO_0002333',
	    'enabled:by',
	    'enabled by',
	    'enabled_by'
	],
	color: '#B8860B' // darkgoldenrod
    },
    'RO:0002334':
    {
	readable: 'regulated by',
	priority: 0,
	aliases: [
	    'RO_0002334',
	    'regulated by',
	    'regulated_by'
	],
	color: '#86B80B' // ??? - random
    },
    'RO:0002335':
    {
	readable: 'negatively regulated by',
	priority: 0,
	aliases: [
	    'RO_0002335',
	    'negatively regulated by',
	    'negatively_regulated_by'
	],
	color: '#0B86BB' // ??? - random
    },
    'RO:0002336':
    {
	readable: 'positively regulated by',
	priority: 0,
	aliases: [
	    'RO_0002336',
	    'positively regulated by',
	    'positively_regulated_by'
	],
	color: '#BB0B86' // ??? - random
    },
    'activates':
    {
	readable: 'activates',
	priority: 0,
	aliases: [
	    'http://purl.obolibrary.org/obo/activates'
	],
	//glyph: 'arrow',
	//glyph: 'diamond',
	//glyph: 'wedge',
	//glyph: 'bar',
	color: '#8FBC8F' // darkseagreen
    },
    'RO:0002404':
    {
	readable: 'causally downstream of',
	priority: 2,
	aliases: [
	    'causally_downstream_of'
	],
	color: '#FF1493' // deeppink
    },
    'RO:0002406':
    {
	readable: 'directly activates',
	priority: 20,
	aliases: [
		//'http://purl.obolibrary.org/obo/directly_activates',
	    'directly:activates',
	    'directly activates',
	    'directly_activates'
	],
	glyph: 'arrow',
	color: '#2F4F4F' // darkslategray
    },
    'upstream_of':
    {
	readable: 'upstream of',
	priority: 2,
	aliases: [
		//'http://purl.obolibrary.org/obo/upstream_of'
	    'upstream:of',
	    'upstream of',
	    'upstream_of'
	],
	color: '#FF1493' // deeppink
    },
    'RO:0002408':
    {
	readable: 'directly inhibits',
	priority: 19,
	aliases: [
		//'http://purl.obolibrary.org/obo/directly_inhibits'
	    'directly:inhibits',
	    'directly inhibits',
	    'directly_inhibits'
	],
	glyph: 'bar',
	color: '#7FFF00' // chartreuse
    },
    'RO:0002411':
    {
	readable: 'causally upstream of',
	priority: 2,
	aliases: [
	    'causally_upstream_of'
	],
	color: '#483D8B' // darkslateblue
    },
    'indirectly_disables_action_of':
    {
	readable: 'indirectly disables action of',
	priority: 0,
	aliases: [
		//'http://purl.obolibrary.org/obo/indirectly_disables_action_of'
	    'indirectly disables action of',
	    'indirectly_disables_action_of'
	],
	color: '#483D8B' // darkslateblue
    },
    'provides_input_for':
    {
	readable: 'provides input for',
	priority: 0,
	aliases: [
	    'GOREL_provides_input_for',
	    'http://purl.obolibrary.org/obo/GOREL_provides_input_for'
	],
	color: '#483D8B' // darkslateblue
    },
    'RO:0002413':
    {
	readable: 'directly provides input for',
	priority: 1,
	aliases: [
	    'directly_provides_input_for',
	    'GOREL_directly_provides_input_for',
	    'http://purl.obolibrary.org/obo/GOREL_directly_provides_input_for'
	],
	glyph: 'diamond',
	color: '#483D8B' // darkslateblue
    },
    // New ones for monarch.
    'subclass_of':
    {
	readable: 'subclass of',
	priority: 100,
	aliases: [
	    'SUBCLASS_OF'
	],
	glyph: 'diamond',
	color: '#E9967A' // darksalmon
    },
    'superclass_of':
    {
	readable: 'superclass of',
	priority: 100,
	aliases: [
	    'SUPERCLASS_OF'
	],
	glyph: 'diamond',
	color: '#556B2F' // darkolivegreen
    },
    'annotation':
    {
	readable: 'annotation',
	priority: 100,
	aliases: [
	    'ANNOTATION'
	],
	glyph: 'diamond',
	color: '#483D8B' // darkslateblue
    }
};
/*
 * Package: statistics.js
 * 
 * Namespace: amigo.data.statistics
 * 
 * This package was automatically created during an AmiGO 2 installation.
 * 
 * Purpose: Useful numbers about the current data in the store.
 * 
 * Requirements: amigo2.js for bbop.amigo namespace.
 * 
 * NOTE: This file is generated dynamically at installation time.
 *       Hard to work with unit tests--hope it's not too bad.
 *       Want to keep this real simple.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }
if ( typeof amigo.data.statistics == "undefined" ){ amigo.data.statistics = {}; }

/*
 * Variable: annotation_evidence
 * 
 * TBD
 */
amigo.data.statistics.annotation_source = [];

/*
 * Variable: annotation_source
 * 
 * TBD
 */
amigo.data.statistics.annotation_evidence = [];

/*
 * Variable: annotation_overview
 * 
 * TBD
 */
amigo.data.statistics.annotation_overview = [[]];
/*
 * Package: rollup.js
 * 
 * Namespace: amigo.ui.rollup
 * 
 * BBOP method to roll an information are up to save real estate.
 * This requires jQuery and an HTML format like:
 * 
 * : <div id="ID_TEXT" class="SOME_CLASS_FOR_YOUR_STYLING">
 * :  <span class="ANOTHERONE">ANCHOR_TEXT<a href="#"><img src="?" /></span></a>
 * :  <div>
 * :   ABC
 * :  </div>
 * : </div>
 * 
 * Usage would then simply be:
 * 
 * : amigo.ui.rollup(['ID_TEXT']);
 * 
 * As a note, for AmiGO 2, his is handled by the common templates
 * info_rollup_start.tmpl and info_rollup_end.tmpl in the amigo git
 * repo. Usage would be like:
 * 
 * : [% rollup_id = "ID_TEXT" %]
 * : [% rollup_anchor = "ANCHOR_TEXT" %]
 * : [% INCLUDE "common/info_rollup_start.tmpl" %]
 * : ABC
 * : [% INCLUDE "common/info_rollup_end.tmpl" %]
 * 
 * Again, this is a method, not an object constructor.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.ui == "undefined" ){ amigo.ui = {}; }

/*
 * Method: rollup
 * 
 * See top-level for details.
 * 
 * Arguments:
 *  elt_ids - a list if element ids of the areas to roll up
 * 
 * Returns:
 *  n/a
 */
amigo.ui.rollup = function(elt_ids){

    var each = bbop.core.each;
    each(elt_ids,
    	 function(eltid){
	     var eheader = '#' + eltid + ' > div';
	     var earea = '#' + eltid + ' > span > a';
	     jQuery(eheader).hide();
    	     var click_elt =
		 jQuery(earea).click(function(){
					 jQuery(eheader).toggle("blind",{},250);
					 return false;
				     });
	 });
};

// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, take the amigo namespace whole and export it. Otherwise
// (browser environment, etc.), take no action and depend on the
// global namespace.
if( typeof(exports) != 'undefined' ){
    exports.amigo = amigo;
}
