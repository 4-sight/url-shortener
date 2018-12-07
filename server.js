'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser')
var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3300;

/** this project needs a db !! **/ 
mongoose.connect(process.env.URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, 'database connection error'));
db.once("open", function() {
  console.log("We're connected");
})

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({extended: false}))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log(`Node.js listening on port:${port}`);
});