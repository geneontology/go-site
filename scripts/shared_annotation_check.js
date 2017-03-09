////
//// Determine if the rules in the rules file are true. Complain if not.
//// Usage like:
//// : node ./scripts/shared_annotation_check.js -i ./scripts/shared_annotation_check.rules
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
 // Looks like {idA : [arg1A, arg2A], ...}
var no_overlap_checks = {};
// Looks like {idA : [arg1A, arg2A, [or1A, or2A, ...]], ...}
var logic_checks = {};
var check_errors = 0;

// Parse the rules file.
var clean_file = string.trim(raw_file);
//_debug('clean_file');
//_debug(clean_file);
var rule_lines = string.lines(clean_file);
//_debug('rule_lines');
//_debug(rule_lines);
each(rule_lines, function(raw_line){

    var line = string.trim(raw_line);
    //_debug('line');
    //_debug(line);
    var columns = line.split(/\s*,\s*/);
    //_debug('columns');
    _debug(columns);
    
    // Make sure that it is at least grossly a rule.
    if( columns.length !== 3 ){ _die('Bad rule: ' + raw_line); }

    // Switch between NO_OVERLAP and logic modes.
    var arg1 = columns[0];
    var arg2 = columns[1];
    var logic = columns[2];
    if( logic === 'NO_OVERLAP' ){
	// Simple check.
	//_ll('Simple check: ' + arg1 + ', ' + arg2);
	no_overlap_checks[arg1 + ';' + arg2] = [arg1, arg2];
    }else{
	// Parse logic.
	var parsed_logic = logic.split(/\s*OR\s*/);
	var or_log_bun = [arg1, arg2, parsed_logic];
	//_ll('TODO: Logic check: ' + bbop.core.dump(or_log_bun));
	logic_checks[arg1 + ';' + arg2 + ';' + logic] = or_log_bun;
    }
});

// Next, setup the manager environment.
_debug('Parsed rules, setting up manager...');
//go.add_query_filter('document_category', 'annotation', ['*']);
go.add_query_filter('document_category', 'bioentity', ['*']);
//go.add_query_filter('taxon', 'NCBITaxon:4896', ['*']);
//go.set_personality('annotation');
go.set_personality('bioentity');
go.debug(false); // I think the default is still on?

// Runs an n-way AND in the closure and returns the count and a
// bookmark to the data in question.
function run_n_way_and(arg_list){
    
    // Add all of the items in the simple 
    each(arg_list, function(arg){
	go.add_query_filter('isa_partof_closure', arg);
    });

    // Fetch the data and grab the number we want.
    //var resp = go.fetch();
    var resp = go.search();
    var count = resp.total_documents();
    //var bookmark = go.get_state_url();
    var bookmark = 'http://amigo.geneontology.org/amigo/search/bioentity?' +
	    go.get_filter_query_string();
    
    // Reset from the last iteration.
    go.reset_query_filters();

    return [count, bookmark];
}

// First, we cycle though all the simple exclusivity tests.
_debug('Running simple exclusivity checks...');
each(no_overlap_checks, function(arg_list, key){
    var run_results = run_n_way_and(arg_list);
    var count = run_results[0];
    var bookmark = run_results[1];
    _ll('Checked exclusive: '+ arg_list.join(' && ') +' ('+ count +')');
    _ll('.................. ' +
	us.map(arg_list, function(e){ return get_term_name(e); }).join(', ')
       );
    if( count !== 0 ){
	check_errors++;
	_ll('ERROR : exclusive count of ' +
	    count + ' on: ' +
	    key + "\t" +
	    bookmark);
    }
    _ll('');
});

// Now try the !AND logic tests.
_debug('Running AND series logic checks...');
each(logic_checks, function(arg_list, key){
    
    var arg1 = arg_list[0];
    var arg2 = arg_list[1];
    var exclusion_list = arg_list[2];
    
    // print('To check (inclusive): ' + arg1 + ', ' + arg2  + '; ' +  
    //       exclusion_list.join(' && '));
    
    // First, see if there is any point in proceeding.
    var run_results = run_n_way_and([arg1, arg2]);
    var check_cnt = run_results[0];
    if( check_cnt === 0 ){
	
	_ll('Checked exclusion; trivially passed with no base overlap: ' +
	    arg1 + ' && ' + arg2 + ' (0)');
	
    }else{

	//print('Logic parse...');
	
	// Reset from last iteration.
	go.reset_query_filters();
	
	// Add the first part of the base intersections.
	go.add_query_filter('isa_partof_closure', arg1);
	go.add_query_filter('isa_partof_closure', arg2);
	
	// Add all of the items in the simple 
	each(exclusion_list, function(exarg){
	    go.add_query_filter('isa_partof_closure', exarg, ['-']);
	});
	
	// Fetch the data and grab the info we want.
	//var resp = go.fetch();
	var resp = go.search();
	var count = resp.total_documents();
	//var bookmark = go.get_state_url();
	var bookmark = 'http://amigo.geneontology.org/amigo/search/bioentity?' +
		go.get_filter_query_string();

	// Test the count to make sure that there were annotations
	// for at least one of the choices.
	_ll('Checked exclusion: ' + arg1 + ' && ' + arg2  + ' && !(' +  
	    exclusion_list.join(' || ') + ') (' + count + ')');
	_ll('.................. ' + get_term_name(arg1) + ', ' + get_term_name(arg2) + ', ' +
	    us.map(exclusion_list,
		   function(e){ return get_term_name(e); }).join(', ')
	   );
	if( count !== 0 ){
	    check_errors++;
	    _ll('ERROR : bad co-annotations for: ' +
		key + "\t" +
		bookmark);
	    // }else{
	    //     check_errors.push('PASS: co-annotation for: ' + key);
	    // }
	}
	_ll('');
    }
});

// Report.
// I removed the bad exits here because reporting and jenkins-style
// build success need to be different things.
// Maybe reconsider once the ontology is fixed.
_ll('Looked at ' + rule_lines.length + ' rules.');
if( check_errors > 0 ){
    _die('Completed with ' + check_errors + ' broken rule(s).');
}else{
    _ll('Done--completed with no broken rules.');
}
