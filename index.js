const express = require('express');
const feed2json = require('feed2json');
const request = require('request');
const nodemailer = require('nodemailer');
var words = require("naughty-words");
var striptags = require('striptags');
/*\
============================================================================
config
============================================================================
\*/
const app = express();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.smb_user,
    pass: process.env.smb_pass
  }
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
/*\
============================================================================
request
============================================================================
\*/
/* rss feed to json */
app.get('/', (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
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
/* add new post */
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
/*
664fbff227b1b93d24b41d0321f2166c7dbaa60e
DBauth
*/
/*\
============================================================================
start server
============================================================================
\*/
app.listen(process.env.PORT || 3000);
module.exports = app

/*
var settings = {
  "url": "https://cloud.seatable.io/api/v2.1/dtable/app-access-token/",
  "method": "GET",
  "timeout": 0,
  "headers": {
    "Accept": "application/json; charset=utf-8; indent=4",
    "Authorization": "Token d4c25e8b1af188eufh3741a3404f635349cebb46"
  },
};

$.ajax(settings).done(function (response) {
  console.log(response);
});





{
    "app_name": "DBauth",
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2NzQ2MDA5MTYsImR0YWJsZV91dWlkIjoiNWMyNjUzNDMtOGIyNC00NmY2LWEyYTYtY2QwODNkNjU2ZTY4IiwidXNlcm5hbWUiOiIiLCJwZXJtaXNzaW9uIjoicnciLCJhcHBfbmFtZSI6IkRCYXV0aCJ9.HrpmeXIw3LHBrJKkWFQISxTuCIMLPp60086LKPdakfw",
    "dtable_uuid": "5c265343-8b24-46f6-a2a6-cd083d656e68",
    "dtable_server": "https://cloud.seatable.io/dtable-server/",
    "dtable_socket": "https://cloud.seatable.io/",
    "dtable_db": "https://cloud.seatable.io/dtable-db/",
    "workspace_id": 30283,
    "dtable_name": "databass"
}



{
    "app_name": "DBauth",
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2NzQ2MDEwMDEsImR0YWJsZV91dWlkIjoiNWMyNjUzNDMtOGIyNC00NmY2LWEyYTYtY2QwODNkNjU2ZTY4IiwidXNlcm5hbWUiOiIiLCJwZXJtaXNzaW9uIjoicnciLCJhcHBfbmFtZSI6IkRCYXV0aCJ9.zZXznCvIeVnRRyy3YeIe-gkRJCyGWVoSDmo0eZrd5mg",
    "dtable_uuid": "5c265343-8b24-46f6-a2a6-cd083d656e68",
    "dtable_server": "https://cloud.seatable.io/dtable-server/",
    "dtable_socket": "https://cloud.seatable.io/",
    "dtable_db": "https://cloud.seatable.io/dtable-db/",
    "workspace_id": 30283,
    "dtable_name": "databass"
}





*/