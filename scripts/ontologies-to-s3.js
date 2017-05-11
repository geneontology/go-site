////
//// DO NOT USE!!!!
//// SERIOUSLY. BUG.
////
//// smaug died trying this script. A nice example nonetheless.
//// The reason for failure, I believe, is actually the async nature of
//// the upload, the scan was still happening while it slowly tried to upload
//// files, also async. That probably meant that it was trying to do hundreds
//// of uploads at the same time. It quickly fell behind and some internal
//// buffer was overflowed before it managed to even get one file uploaded.
//// Anyways, after the overflow error, it hung on for a few minutes and then
//// the machine went down; I'm guessing that it some spawned some rogue
//// processes and did not cleanly die.
////
//// TODO: If a script like this is to be used, it must force doing things
//// absolutely serially.
////
//// Recursively upload the ontologies in a directory to a given S3
//// bucket.
////
//// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjects-property
////
//// A JSON file of credentials is required like:
////
//// { "accessKeyId": "XXX", "secretAccessKey": "YYY", "region": "us-west-1" }
////
//// Example usage:
////  node ./scripts/ontologies-to-s3.js -f ~/local/share/secrets/bbop/aws/s3/aws-go-push.json -d ~/all-my-ontologies -b bbop-ontologies/
////
//// Or more on point:
////  @smaug:~/go-site# node ./scripts/ontologies-to-s3.js -f ~/aws-go-push.json -d /srv/nfs/ontologies -b bbop-ontologies/
////

var AWS = require('aws-sdk');
var us = require('underscore');
var dns = require('dns');
var fs = require('fs-extra');
var path = require('path');

///
/// Helpers.
///

// Aliases.
var each = us.each;

function _ll(arg1){
    console.log(arg1); 
}

// Two or one args.
function _die(m1, m2){
    if( typeof(m2) !== 'undefined' ){
	console.error('ERROR:', m1, m2);
    }else{
	console.error('ERROR:', m1);
    }
    process.exit(-1);
}

///
/// Opts.
///

var argv = require('minimist')(process.argv.slice(2));

// AWS credentials from CLI.
var credential_file = argv['f'] || argv['file'];
if( ! credential_file ){
    _die('Option (f|file) is required.');
}else{
    _ll('Will use credentials: ' + credential_file);
}
AWS.config.loadFromPath(credential_file);

// Bucket/prefix to use.
var bucket = null;
var prefix = null;
var bucket_raw = argv['b'] || argv['bucket'];
if( ! bucket_raw ){
    _die('Option (b|bucket) is required.');
}else{
    var parts = bucket_raw.split('/');
    if( ! parts || parts.length !== 2 ){
	_die('Not a good bucket descriptor: ' + bucket_raw);
    }else{
	bucket = parts[0];
	prefix = parts[1];
    }
    
    _ll('Will use bucket: ' + bucket + ', with prefix: ' + prefix);
}

// Ontology directory to scan.
var directory = argv['d'] || argv['directory'];
if( ! directory ){
    _die('Option (d|directory) is required.');
}else{
    var dstats = fs.statSync(directory);
    if( ! dstats.isDirectory() ){
	_die('Option (d|directory) is not a directory: ' + directory);
    }
    _ll('Will scan directory: ' + directory);
}

///
/// Main.
///

// Get a list of all files.
var all_files = fs.walkSync(directory);

// Just get and separate out the files we want.
var target_files = [];
us.each(all_files, function(afile){

    var cmpct = path.relative(directory, afile);
    //console.log(cmpct);

    var ext = path.extname(afile);
    if( ext === '.obo' ){
	target_files.push({
	    'mime': 'text/obo',
	    'full': afile,
	    'rel': cmpct
	});
    }else if( ext === '.owl'){
	target_files.push({
	    'mime': 'application/rdf+xml',
	    'full': afile,
	    'rel': cmpct
	});
    }
});

// Get setup.
var s3 = null;
if( ! prefix || prefix === '' ){
    s3 = new AWS.S3({params: {Bucket: bucket}});
}else{
    s3 = new AWS.S3({params: {Bucket: bucket, Prefix: prefix}});
}

// Upload files.
us.each(target_files, function(tfile){
    
    var fbuffer = fs.readFileSync(tfile['full']);
    // var fstream = fs.createReadStream(tfile['full']);
    // fstream.on('error', function(err) {
    // 	console.log('File Error', err);
    // });
    
    _ll('PUTting: ' + tfile['rel']);
    
    s3.putObject({
	'ACL': 'public-read',
	'ContentType': tfile['mime'],
	'Key': tfile['rel'],
	'Body': fbuffer
	//'Body': fstream
    }, function(error, data){
	if( error ){
	    _die('PUT fail on ' + tfile['rel'] + '; ' + error);
	}else{
	    _ll('Upload success: ' + tfile['rel']);
	    //process.exit(0);
	}
    });
});

_ll('Directory push complete.');
