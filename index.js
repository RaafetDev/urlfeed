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
app.disable('x-powered-by');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.smb_user,
    pass: process.env.smb_pass
  }
	/*host: process.env.smtp_server,
	port: 587,
	secure: false, // upgrade later with STARTTLS
	auth: {
	    user: process.env.smtp_user,
	    pass: process.env.smtp_pass,
	},*/
});

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
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
			const mailOptions = {
			  from: process.env.smb_user,
			  to: process.env.blogger_email,
			  subject: titel,
			  html: post+'<hidden style="display:none;">UID:'+UID+':</hidden>'
			};
			transporter.sendMail(mailOptions, function(error, info){
			  if (error) {
			 	res.json({status: false, error: error});
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
		    text: req.body.text || false
		};
		var post = JSON.stringify(data);
		transporter.sendMail({
		  from: process.env.smb_user,
		  to: process.env.storie_url,
		  subject: req.body.UID,
		  html: '<data>'+post+'</data>'
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
/*========================================================================*/
/* users api server */
/*========================================================================*/
var  options = function(req) {
	var opt = {
		url: 'http://api-server.rf.gd'+req.originalUrl.replace('db','api'),
	  	headers: {
	    	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
	    	'Cookie': '__test=e2abfad999ce4497558aedc883019453'
		}
	};
	if (req.method != 'GET' && req.body) {
		opt.form = req.body;
	}
	return opt;
};
app.all('/db/*', (req, res) => {
	var method = (req.method.toLowerCase()).replace('delete','del');
	request[method](options(req), function(err,httpResponse,body){
		if (err) {
			res.status(404).json({error: true,data: err,status: 404}); return;
		} else {
			res.status(200).set(httpResponse.headers).send(body); return;
		}
	});
});
/*
req.pipe(
).pipe(res);
request.post({ url: 'http://www.example.com', form: { foo: 'bar' }})
request.post({ url: 'http://www.example.com', form: { foo: 'bar' }}).pipe(res);
*/
/*
@UID:987654ad3f21ef5dsf5:@PID:1234:
*/
/*\
============================================================================
start server
============================================================================
\*/
app.listen(process.env.PORT || 3000);
module.exports = app
