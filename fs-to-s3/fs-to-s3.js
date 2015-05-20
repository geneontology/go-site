////
//// Take a filesystem path and convert it to a website in S3.
////
//// TODO: S3 parts.
////
//// Example usage:
////  node ./fs-to-s3.js -b foo -d /tmp/node_modules/
////

var opts = require('minimist');
var fs = require("fs");
var us = require('underscore');
var find = require('findit');
var path = require('path');

// Aliases.
var each = us.each;

///
/// Incoming args.
///

// Args from CLI.
var argv = opts(process.argv.slice(2));
var bucket = null;
var scan_dir = null;
if( argv['b'] ){ bucket = argv['b']; }
console.log('S3 bucket: ' + bucket);
if( argv['d'] ){ scan_dir = argv['d']; }
console.log('scan dir: ' + scan_dir);

// Need args or die.
if( ! bucket || ! scan_dir ){
    process.exit(1);
}

///
/// Scanning events.
///

var directories = [];
var files = [];
var directory_files = {}; // map of directorys to files

var finder = find(scan_dir);

finder.on('directory', function(dir, stat, stop){
    //var base = path.basename(dir);
    
    // Just dirs.
    directories.push(dir);
    
    // Keep hash made.
    if( ! directory_files[dir] ){
	directory_files[dir] = [];
    }

    // console.log('dir: ' + dir + '/');
});
 
finder.on('file', function(file, stat){
    var dir = path.dirname(file);
    var base = path.basename(file);

    // console.log('file: ' + dir + ' ' + file);

    files.push(file);

    // 
    if( ! directory_files[dir] ){
	directory_files[dir] = [];
    }
    directory_files[dir].push(file);

});
 
finder.on('link', function(link, stat){
    console.log('skipping link: ' + link);
});

// 
finder.on('end', function(){

    // 
    each(directory_files, function(files, dir){

	console.log('TODO: makedir: ' + dir);
	
	// Order files.
	files = files.sort();

	// Send the files.
	each(files, function(file){
    	    console.log('TODO: send file: ' + file);
	});
    });

    // // 
    // each(directories, function(dir){
    // 	console.log('TODO: makedir: ' + dir);
    // });

    // // 
    // each(files, function(file){
    // 	console.log('TODO: send file: ' + file);
    // });

});
