'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI,{ useNewUrlParser: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended:false}));

app.use('/public', express.static(process.cwd() + '/public'));

//making the url model
var Schema = mongoose.Schema;
var urlSchema = new Schema({
  original_url:String,
  short_url:Number
});
var URL = mongoose.model('Shorten', urlSchema);

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/shorturl/new', function(req, res){
  dns.lookup(req.body.url.split('//')[1], function(err, address){
    if(err){
      console.log(err);
      res.json({error:'invalid URL'})
    } else {
      URL.findOne().sort({ field:'asc', _id:-1 }).exec(function(err, last){
        if(err){
          res.json({error:'Something broke'});
          console.log(err);
        }else if(!last){
          URL.create({original_url:req.body.url, short_url:1}, function(err,data){
            if(err){
              console.log(err)
              res.json({error:'this is not good'});
            }
            else {
              console.log(data);
            }
          })
        } else {
          var lastPlus = last.short_url+1;
          URL.create({original_url:req.body.url, short_url:lastPlus}, function(err,data){
            if(err){
              console.log(err);
              res.json({error:'this is not good'});
            }
            else {
              console.log(data);
              res.json({original_url:data.original_url, short_url:data.short_url});
            }
          })
        }
      })
    }
  })
})

app.get('/api/shorturl/:short', function(req, res){
  URL.find({short_url:req.params.short}, function(err, data){
    if(err){
      res.json({error: "No short url found for given input"})
    }else if(Object.keys(data).length == 0){
      res.json({error: "No short url found for given input"});
    } else{
      res.redirect(data[0].original_url);
    }
  });
})


app.listen(port, function () {
  console.log('Node.js listening ...');
});