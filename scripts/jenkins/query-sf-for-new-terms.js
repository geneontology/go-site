////
//// TODO.
////

var us = require('underscore');
var argv = require('minimist')(process.argv.slice(2));
var sync_request = require('sync-request');

///
/// Helpers.
///

var each = us.each;

function _die(message){
    console.error('['+ (new Date()).toJSON() +']: '+ message);
    process.exit(-1);
}

function getUrl(url){
    
    var ret = null;
    
    try {
        ret = sync_request('GET', url, {
	    'headers': {
		'user-agent': 'query-sf-for-new-tickets.js; sync-request'
	    }});
    }catch(e){
        _die('ERROR in sync_request call, buh-bye!');
    }
    
    return ret;
}

///
/// Process CLI options.
///

// ontology name (or sf project), defaults to "geneontology"
var oname = argv['o'] || argv['ontologyname'] || 'geneontology';
if( ! oname || ! us.isString(oname) ){
    _die('Option (o|ontologyname) is required to be well defined.');
}

// tracker name, defaults to "ontology-requests"
var trackername = argv['t'] || argv['trackername'] || 'ontology-requests';
if( ! trackername || ! us.isString(trackername) ){
    _die('Option (t|trackername) is required to be well defined.');
}
    
// defaults to one day
var durationInDays = argv['r'] || argv['range'] || 1;
durationInDays = parseInt(durationInDays);
if( ! durationInDays || ! us.isNumber(durationInDays) ){
    _die('Option (r|range) is required to be well defined.');
}

// TODO add option to print to a separate file.
function main(){
    
    var today = new Date();
    var yesterday =
	    new Date(new Date().setDate(new Date().getDate()-durationInDays));
    var range = yesterday.toISOString()+"+TO+"+today.toISOString();
    //console.log(range);
    
    var newTickets = getNewTickets(oname, trackername, range);
    var modTickets = getUpdatedTickets(oname, trackername, range);
    
    console.log("<h2>Summary for tickets from " +
		yesterday.toISOString()+" to "+today.toISOString()+"</h2>");
    printNewTickets(newTickets, oname, trackername);
    //printUpdatedTickets(modTickets, oname, trackername);
    
}

function printNewTickets(tickets, oname, trackername) {
    printTickets(tickets, oname, 'new', 'New', trackername);
}

function printUpdatedTickets(tickets, oname, trackername) {
    printTickets(tickets, oname, 'updated', 'Updated', trackername);
}

function printTickets(tickets, oname, type, typeUpperCase, trackername) {
    console.log("<h3>"+typeUpperCase+" Tickets</h3>");
    if (tickets !== undefined && tickets.length > 0) {
	
	if (tickets.length === 1) {
	    console.log("There is one "+type+" ticket.");
	}
	else {
	    console.log("There are "+tickets.length+" "+type+" tickets.");
	}
	var body = "<ul>\n";
	for (var k=0; k<tickets.length; k++) {
	    var ticket = tickets[k];
	    
	    // Example: http://sourceforge.net/p/geneontology/ontology-requests/10193/ cilium/flagellum 
	    body += '<li>';
	    body += '<a href="http://sourceforge.net/p/'+oname+'/'+trackername+'/'+ticket.ticket_num+'/">' + ticket.ticket_num + '</a>';
	    body += " ";
	    body += makeHtmlSave(ticket.summary);
	    body += '</li>\n';
	}
	body += "</ul>";
	console.log(body);
    }else {
	console.log("<p>There have been no "+type+" tickets.</p>");
    }
}

/**
 * Save guard against problematic text.<br>
 * Escape HTML reserved characters and remove non-ASCII symbols.
 */
function makeHtmlSave(s) {
    // rempve all non-ascii symbols with a '?'
    s = s.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '') ;
    // escape html specific characters 
    return s.replace(/&/g, '&amp;')
    	.replace(/"/g, '&quot;')
    	.replace(/>/g, '&gt;')
    	.replace(/</g, '&lt;');
}

function getNewTickets(oname, trackername, range) {
    //EXAMPLE = "http://sourceforge.net/rest/p/geneontology/ontology-requests/search?q=created_date_dt:[2013-07-30T00:00:00Z%20TO%202013-07-30T23:59:59Z]";
    return getTickets(oname, trackername, range, 'created_date_dt');
}

function getUpdatedTickets(oname, trackername, range) {
    //EXAMPLE = "http://sourceforge.net/rest/p/geneontology/ontology-requests/search?q=mod_date_dt:[2013-07-30T00:00:00Z%20TO%202013-07-30T23:59:59Z]";
    return getTickets(oname, trackername, range, 'mod_date_dt');
}

/**
 * Get the tickets. Warning: This method uses system.exit(-1) to exit the
 * program in case of an error.
 * 
 * TODO: handle pagination, maybe add a retry count
 */
function getTickets(oname, trackername, range, type) {
    var url = 'http://sourceforge.net/rest/p/'+oname+'/'+trackername+'/search?q='+type+':['+range+']';
    //console.log(url);
    var res = getUrl(url);
    //console.log(res);
    var payload = res.getBody();
    if (res.statusCode === 200) {
	//console.log(payload);
	var resultObj = JSON.parse(payload);
	return resultObj.tickets;
    }
    else {
	console.log('HTTP error status code: ' +
		    res.statusCode+' for request url: '+url);
	process.exit(-1);
    }
}

main();
