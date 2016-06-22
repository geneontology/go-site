////
//// TODO.
////
//// Usage:
////  node ./create-annotation-summary-statistics.js -i /foo/bar/go_annotation_metadata.json -o /tmp/go_annotation_metadata.all.json
////

var us = require('underscore');
var argv = require('minimist')(process.argv.slice(2));
var sync_request = require('sync-request');
var fs = require('fs');
var path = require('path');

///
/// Helpers.
///

var each = us.each;

function _die(message){
    console.error('['+ (new Date()).toJSON() +']: '+ message);
    process.exit(-1);
}

// ...
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

///
/// Process CLI options.
///

// json input file with all the declared GAFs
var inputFile = argv['i'] || argv['input'];
if( ! inputFile || ! us.isString(inputFile) ){
    _die('Option (i|input) directory is required to be well defined.');
}

// output file
var outputFile = argv['o'] || argv['output'];
if( ! outputFile || ! us.isString(outputFile) ){
    _die('Option (o|output) directory is required to be well defined.');
}

// folder for the location of the json input file for each GAF
var sourceFolder = argv['s'] || argv['source'];
if( ! sourceFolder || ! us.isString(sourceFolder) ){
    //Default to using the directory of the input file.
    //sourceFolder = fs.readdirSync(inputFile);
    sourceFolder = path.dirname(inputFile);
}

///
/// Main.
///

function main(){
    
    var outputFileJS = outputFile.substr(0, outputFile.lastIndexOf('.')) + ".js";
    var inputFileContent = fs.readFileSync(inputFile, {'encoding': 'utf8'});
    var inputJSON = JSON.parse(inputFileContent);

    console.log(inputFile);
    console.log(outputFile);
    console.log(outputFileJS);
    
    // init global counts
    inputJSON['annotatedEntityCount'] = 0;
    inputJSON['annotationCount'] = 0;
    inputJSON['annotationCountExcludingIEA'] = 0;
    
    each(inputJSON.resources, function(elem) {
	var gafFilename = elem['gaf_filename'];
	var id = elem['id'];
	// load content from individual JSON file
	var jsonFilename = null;
	if( endsWith(gafFilename, '.gz') ){
	    jsonFilename = gafFilename.replace('.gz', '.json');
	}else{
	    jsonFilename = gafFilename + '.json';
	}
	var gafJSONContent =
		fs.readFileSync(path.join(sourceFolder, jsonFilename),
				{'encoding': 'utf8'});
	var gafJSON = JSON.parse(gafJSONContent);

	// enrich the existing elem with the data from the JSON
	elem['submissionDate'] = gafJSON['submissionDate'];
	elem['annotatedEntityCount'] = gafJSON['annotatedEntityCount'];
	elem['annotationCount'] = gafJSON['annotationCount'];
	elem['annotationCountExcludingIEA'] =
	    gafJSON['annotationCountExcludingIEA'];
	elem['gafDocumentSizeInBytes'] = gafJSON['gafDocumentSizeInBytes'];
	
	// update the global counts
	inputJSON['annotatedEntityCount'] +=
	    gafJSON['annotatedEntityCount'];
	inputJSON['annotationCount'] += gafJSON['annotationCount'];
	inputJSON['annotationCountExcludingIEA'] +=
	    gafJSON['annotationCountExcludingIEA'];
    });
    
    // pretty print to JSON
    var outputJson = JSON.stringify(inputJSON, null, ' ');
    
    // Write JSON string to file.
    fs.writeFileSync(outputFile, outputJson);
    // And make a JS version of it.
    fs.writeFileSync(outputFileJS,
		     'var global_go_annotation_metadata = ' + outputJson + ';');
}
main();
