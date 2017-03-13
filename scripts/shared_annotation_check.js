////
//// Determine if the rules in the rules file are true. Complain if not.
//// Usage like:
//// : node ./scripts/shared_annotation_check.js -i ./scripts/shared_annotation_check.rules-new
////

// General.
var us = require('underscore');
var string = require('underscore.string');
var fs = require("fs");

// Setup public AmiGO API environment.
//var node_engine = require('bbop-rest-manager').node;
var node_engine = require('bbop-rest-manager').sync_request;
var amigo = require('amigo2');
var golr_conf = require('golr-conf');
var golr_manager = require('bbop-manager-golr');
var golr_response = require('bbop-response-golr');
//
var gconf = new golr_conf.conf(amigo.data.golr);
var engine = new node_engine(golr_response);
var sd = new amigo.data.server();
//_ll(us.keys(sd));
//var golr_url = sd.golr_base();
var golr_url = 'http://golr.geneontology.org/';
var go = new golr_manager(golr_url, gconf, engine, 'sync');
var linker = new amigo.linker();
// For getting term info later.
var rest_engine = require('bbop-rest-manager').sync_request;
var response_json = require('bbop-rest-response').json;
var resty = new rest_engine(response_json);

///
/// Helpers.
///

// Aliases.
var each = us.each;

function _ll(arg1){
    console.log(arg1); 
}

var debug = false;
function _debug(arg1){
    if( debug ){
	console.log(arg1);
    }
}

// Two or one  args.
function _die(m1, m2){
    if( typeof(m2) !== 'undefined' ){
	console.error('ERROR:', m1, m2);
    }else{
	console.error('ERROR:', m1);
    }
    process.exit(-1);
}

function term_info_url(tid){
    return 'http://amigo.geneontology.org/amigo/term/'+tid+'/json';
}

var memo = {};
function get_term_name(tid){
    var ret = tid;

    if( memo[tid] ){
	ret = memo[tid];
    }else{	
	try {
	    
	    resty.resource(term_info_url(tid));
	    var r = resty.fetch();
	    if( r && r.okay() ){
		var res = r.raw();
		if( res['results'] && res['results']['name'] && us.isString(res['results']['name']) ){
		    ret = res['results']['name'];
		    memo[tid] = ret;
		}
	    }
	    
	}catch(e){
            ret = tid;
	}
    }

    return ret;
}

///
/// Opts.
///

var argv = require('minimist')(process.argv.slice(2));

// Add extra "debugging" messages.
debug = argv['d'] || argv['debug'];
if( debug ){
    _debug('Debugging is on.');
}else{
}

//
var in_file = argv['i'] || argv['in'];
if( ! in_file ){
    _die('Option (i|in) is required.');
}else{
    _debug('Will use input rule file: ' + in_file);
}

///
/// Main.
///

_debug('Target: ' + golr_url);
// delete amigo.data.golr;
// delete amigo.data.xrefs;
// delete amigo.data.context;
// delete amigo.data.xrefs;
// delete amigo.data.statistics;
// _debug(JSON.stringify(us.keys(amigo.data), null, 4));
// _debug(JSON.stringify(amigo.data, null, 4));
// _die();

// Read in the rules files.
var raw_file = fs.readFileSync(in_file, 'utf-8');
if( typeof(raw_file) !== 'string' ){
    _die('File could not be opened: ' + in_file);
}else{
    _debug('Read: ' + in_file);
}

// Our rules variables.
// Looks like {idA : {term1: arg1A, term2: arg2A}, intersection_exceptions: [], ...}
var intersection_checks = {};
var check_errors = 0;

// Parse the rules file.
var clean_file = string.trim(raw_file);
//_debug('clean_file');
//_debug(clean_file);
var rule_lines = string.lines(clean_file);
//_debug('rule_lines');
//_debug(rule_lines);
each(rule_lines, function(raw_line, index){

    var line = string.trim(raw_line);
    //_debug('line');
    //_debug(line);
    var columns = line.split(/\t/);
    //_debug('columns');
    //_debug(columns);
    
    // Switch between NO_OVERLAP and logic modes.
    var term1 = columns[0];
    var term2 = columns[1];
    var intersection_exceptions_raw = columns[2];
    var gp_exceptions_raw = columns[3];

    // Make sure that it is at least grossly a rule.
    if( ! term1 || ! term2 ){ _die('Bad rule: ' + raw_line); }

    // Parse logic.
    var intersection_exceptions = [];
    if( intersection_exceptions_raw ){
	intersection_exceptions =
	    intersection_exceptions_raw.split(/\s*\|\s*/);
    }
    var gp_exceptions = [];
    if( gp_exceptions_raw ){
	gp_exceptions =
	    gp_exceptions_raw.split(/\s*\|\s*/);
    }

    var ln = index + 1;
    intersection_checks[ln] = {
	'line_number': ln,
	'raw': raw_line,
	'term1': term1,
	'term2': term2,
	'intersection_exceptions': intersection_exceptions,
	'gp_exceptions': gp_exceptions
    };

});

//_debug(intersection_checks);
//_die('done');

// Now try the !AND logic tests.
_debug('Running intersection checks...');
each(intersection_checks, function(args){    
	
    // Next, setup the manager environment.
    _debug('Parsed rules, setting up manager...');
    var go = new golr_manager(golr_url, gconf, engine, 'sync');
    //go.add_query_filter('document_category', 'annotation', ['*']);
    go.add_query_filter('document_category', 'bioentity', ['*']);
    //go.add_query_filter('taxon', 'NCBITaxon:4896', ['*']);
    //go.set_personality('annotation');
    go.set_personality('bioentity');
    go.debug(false); // I think the default is still on?

    // Add the first part of the base intersections.
    go.add_query_filter('isa_partof_closure', args['term1']);
    go.add_query_filter('isa_partof_closure', args['term2']);
    
    // Add all of the items in term exceptions part.
    each(args['intersection_exceptions'], function(exarg){
	go.add_query_filter('isa_partof_closure', exarg, ['-']);
    });

    // Add all of the items in gp exceptions part.
    each(args['gp_exceptions'], function(exarg){
	go.add_query_filter('bioentity', exarg, ['-']);
    });
    
    // Fetch the data and grab the info we want.
    //var resp = go.fetch();
    var resp = go.search();
    var count = resp.total_documents();
    //var bookmark = go.get_state_url();
    var bookmark = 'http://amigo.geneontology.org/amigo/search/bioentity?' +
	    go.get_filter_query_string();

    // Report.
    var report_string = 'Check intersection: ' +
	    args['term1'] + ' && ' + args['term2'];
    if( args['intersection_exceptions'].length !== 0 ){
	report_string +=
	    ' && !(' + args['intersection_exceptions'].join(' || ') + ')';
    }
    if( args['gp_exceptions'].length !== 0 ){
	report_string +=
	    ' && !(' + args['gp_exceptions'].join(' || ') + ')';
    }
    report_string += ' (' + count + ')';
    _ll(report_string);
    
    // Human readable names.
    var readable_str = '................... "' +
	    get_term_name(args['term1']) + '", "' +
	    get_term_name(args['term2']) + '"';
    if( args['intersection_exceptions'].length !== 0 ){
	readable_str += '; with term exceptions: "' +
	    us.map(args['intersection_exceptions'],
		   function(e){ return get_term_name(e); }).join('", "') + '"';
    }
    if( args['gp_exceptions'].length !== 0 ){
	readable_str += '; with GP exceptions: "' +
	    us.map(args['gp_exceptions'],
		   function(e){ return e; }).join('", "') + '"';
    }
    _ll(readable_str);

    // Liost error or not.
    if( count !== 0 ){
	check_errors++;
	_ll('ERROR: found intersection annotations: ' + bookmark);
    }else{
	_ll('PASS: ' + bookmark);
    }

    _ll('');

});

// Summary report.
// I removed the bad exits here because reporting and jenkins-style
// build success need to be different things.
// Maybe reconsider once the ontology is fixed.
_ll('Looked at ' + rule_lines.length + ' rules.');
if( check_errors > 0 ){
    _die('Completed with ' + check_errors + ' broken rule(s).');
}else{
    _ll('Done--completed with no broken rules.');
}
