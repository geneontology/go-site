////
//// Convert the core YAML xrefs into the legacy GO.xrf_abbs style.
////
//// Example usage:
////  kwalify -E -f metadata/db-xrefs.schema.yaml metadata/db-xrefs.yaml
////  node ./scripts/db-xrefs-yaml2legacy.js -i metadata/db-xrefs.yaml
////

//var bbop = require('bbop').bbop;
var opts = require('minimist');
var fs = require("fs");
var YAML = require('yamljs');
var us = require('underscore')

// Aliases.
var each = us.each;

///
/// Variables.
///

var single_value_maps = [
    ['database', 'abbreviation'],
    ['name', 'database'],
    ['description', 'description']
];

var single_value_list_maps = [
    ['synonyms', 'synonym'],
    ['generic_urls', 'generic_url']
];

// Does *not* contain: entity_type and is_syntax (regexps)--they
// require special handling, see below.
var entity_type_simple_value_maps = [
    ['url_syntax', 'url_syntax'],
    ['example_id', 'example_id'],
    ['example_url', 'url_example']
];

///
/// Helpers.
///

function out(str){
    console.log(str);
}

function newline(){
    console.log('');
}

// Output header.
function output_static_header(){
    out('!version: $Revision: 2.302 $');
    out('!date: $Date: 2012/09/20 21:04:35 $');
    out('!');
    out('!Gene Ontology');
    out('!Abbreviations for cross-referenced databases.');
    out('!');
    out('!Note that URLs are not necessarily stable entities and that some');
    out('!databases may have many other access routes or mirror sites.');
    out('!');
    out('!This data is available as a web page at');
    out('!http://www.geneontology.org/cgi-bin/xrefs.cgi');
}

// Write out an enity_type into a stanza.
function output_entity_type(entity_type){
    
    // Do the difficult regexp disassembly and cleaning.
    var regexp = entity_type['id_syntax'] || null;
    if( regexp ){
    // 	// Split on '|'.
    // 	var rsplit = regexp.split('|');
    // 	if( rsplit ){
    // 	    // Remove any unecessary cruft (i.e. matching parens).
    // 	    each(rsplit, function(thing){
    // 		// Clobber input if unecessary cruft.
    // 		if( thing.charAt(0) && thing.charAt(thing.length-1) ){
    // 		    thing = thing.substring(1, thing.length-1);
    // 		}
    // 		out('local_id_syntax: ' + thing);
    // 	    });
    // 	}
	// Nevermind: logically equivalent.
	out('local_id_syntax: ' + regexp);
    }

    // Most things map easily.
    each(entity_type_simple_value_maps, function(smap){
	var input = smap[0];
	var output = smap[1];
	var val = entity_type[input] || null;
	if( val ){
	    out(output +': '+ val);
	}
    });

    // Finally, the entity_type.
    var tid = entity_type['type_id'] || null;
    var tn = entity_type['type_name'] || null;
    if( tid && tn ){
	out('entity_type: ' + tid + ' ! ' + tn);
    }
}

// Write out a stanza.
function output_stanza(stanza){
    newline();

    // Try the most critical enty.
    // Only continue if abbr is extant.
    var abbr = stanza['database'] || null;
    if( abbr ){

	// Try each single section separately.
	each(single_value_maps, function(smap){
	    var input = smap[0];
	    var output = smap[1];
	    var val = stanza[input] || null;
	    if( val ){
		out(output +': '+ val);
	    }
	});

	// Unroll simple lists.
	each(single_value_list_maps, function(lmap){
	    var input = lmap[0];
	    var output = lmap[1];
	    var vals = stanza[input] || [];
	    each(vals, function(val){
		if( val ){
		    out(output +': '+ val);
		}
	    });
	});

	// Finally, output the entity types.
	var entity_types = stanza['entity_types'] || [];
	each(entity_types, function(entity_type){
	    output_entity_type(entity_type);
	});
    }
}

///
/// Incoming files.
///

// Args from CLI.
var argv = opts(process.argv.slice(2));

// User information file.
var perm_file = null;
if( argv['i'] ){ perm_file = argv['i']; }
var xrf_abbs = YAML.parse(fs.readFileSync(perm_file, 'utf-8'));

///
/// ...
///

output_static_header();

each(xrf_abbs, function(stanza){
    output_stanza(stanza);
});
