const express = require('express');
const feed2json = require('feed2json');
const request = require('request');
const nodemailer = require("nodemailer");
var words = require("naughty-words");
var striptags = require('striptags');
/*\
============================================================================
config
============================================================================
\*/
const app = express();
let transporter = nodemailer.createTransport('direct',{});

function validate_text(compare) {
    var swear_words_arr = words.ar;
    var swear_alert_arr = new Array;
    var swear_alert_count = 0;
    var compare_text = compare;
    for (var i = 0; i < swear_words_arr.length; i++) {
        for (var j = 0; j < (compare_text.length); j++) {
            if (swear_words_arr[i] == compare_text.substring(j, (j + swear_words_arr[i].length)).toLowerCase()) {
                swear_alert_arr[swear_alert_count] = compare_text.substring(j, (j + swear_words_arr[i].length));
                swear_alert_count++;
            }
        }
    }
    var alert_text = "";
    for (var k = 1; k <= swear_alert_count; k++) {
        alert_text += "(" + k + ")  " + swear_alert_arr[k - 1];
        if (k < swear_alert_count) {
            alert_text += ", ";
        }
    }
    if (swear_alert_count > 0) {
        return {valid:false,err:alert_text};
    } else {
        return {valid:true};
    }
}
/*\
============================================================================
middleware
============================================================================
\*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	next();
});
/*\
============================================================================
request
============================================================================
\*/
/*========================================================================*/
/* rss feed to json */
/*========================================================================*/
app.get('/', (req, res) => {
	if (req.query.url) {
		var url = req.query.url;
		request(url, { encoding: null }, (error, response, body) => {
	        if (error) {
	          res.json({status: false, error: error.toString()}); return;
	        }

	        if (response.headers['content-type'].toLowerCase().includes('iso-8859-1')) {
	          body = iconv.decode(new Buffer.from(body), 'iso-8859-1');
	        }

	        feed2json.fromString(body, url, { log: false }, (err, json) => {
	          if (err) {
	            res.json({status: false, error: err}); return;
	          }

	          json.status = true;
	          json._feed_url = url;
	          delete json.version;
	          res.json(json);
	        });
	    });
	} else {
		res.json({status: false, error: 'The supplied url does not appear to be a valid rss feed.'});
	}
});
/*========================================================================*/
/* add new post */
/*========================================================================*/
app.post('/addPost', (req, res) => {
	if (req.body.id && req.body.titel && req.body.post) {
		var UID = req.body.id;
		var titel = striptags(req.body.titel);
		var post = req.body.post;
		var check = validate_text(titel+" "+post);
		if (check.valid) {
			transporter.sendMail({
			    from: "dzgo.email@gmail.com",
			    to: process.env.blogger_email,
			  	subject: titel,
			  	html: post+'<hidden style="display:none;">UID:'+UID+':</hidden>'
			}, (err, info) => {
				if (err) {
			    	res.json({status: false, valid: false, error: err});
			  	} else {
			    	res.json({status: true, msg: 'New Post add successful'});
			  	}
			    
			});
		} else {
			res.json({status: false, valid: false, error: check.err});
		}
	} else {
		res.json({status: false, error: 'required parameter not found'});
	}
});
/*========================================================================*/
/* add new storie */
/*========================================================================*/
app.post('/addStorie', (req, res) => {
	if (req.body.UID && req.body.type && req.body.url) {
		var data = {
		    UID: req.body.UID,
		    type: req.body.type,
		    url: req.body.url,
		    text: req.body.type || false
		};
		var post = JSON.stringify(data);
		transporter.sendMail({
		  from: 'dzgo.email@gmail.com',
		  to: process.env.storie_url,
		  subject: req.body.UID,
		  html: post
		}, function (err, reply) {
		  if (err) {
		    res.json({status: false, valid: false, error: err});
		  } else {
		    res.json({status: true, msg: 'New Storie add successful'});
		  }
		});
	} else {
		res.json({status: false, error: 'required parameter not found'});
	}
});

/*\
============================================================================
start server
============================================================================
\*/
app.listen(process.env.PORT || 3000);
module.exports = app
