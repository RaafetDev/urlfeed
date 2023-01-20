const express = require('express');
const feed2json = require('feed2json');
const request = require('request')
const app = express();

const getFeed = (url) => {
    return new Promise((resolve, reject) => {
      
    })
};
async function mkFeed(arg) {
	return await getFeed(arg.query.url);
}
app.get('/', (req, res) => {
	if (req.query.url) {
		var url = req.query.url;
		request(url, { encoding: null }, (error, response, body) => {
	        if (error) {
	          res.json({status: false, error: err}); return;
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


app.listen(process.env.PORT || 3000);
module.exports = app