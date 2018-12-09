'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser')
var cors = require('cors');
const dns = require('dns')

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

const counterSchema = new mongoose.Schema({
  name: String,
  index: {type: Number, default: 1},
})

const Counter = mongoose.model("counter", counterSchema)

const done = (data) => {console.log(data.index)}

const findAndUpdateCounter = function(done) {
  Counter.findOneAndUpdate(
    {name: "miniCounter"},
    {$inc: {index: 1}},
    {upsert: true, setDefaultsOnInsert: true},
    function(err, data) {
      err
      ? console.log(err)
      : done(data)
    })
}

const miniSchema = new mongoose.Schema({
  url: String,
  miniId: Number
})

const Mini = mongoose.model("mini", miniSchema)

const createAndSaveMini = function(url) {
  let counter = findAndUpdateCounter()
  
  const entry = new Mini({
    url: url
  })
  return entry.save(function(err, data) {
    err
    ? console.log(err)
    : data
  })
}

const validateUrl = (url) => {

  const trimmed = url.replace(/http[s]?:\/\//, "");
  
  return new Promise((resolve) => {
    dns.lookup(trimmed, (err) => {
      err
      ? resolve(false)
      : resolve(true)
    })
  })
}


//------------------------------------------------------------
app.post('/api/shorturl/new', function(req, res) {
  const { url } = req.body
  validateUrl(url)
    .then(result => {
      result 
      ? res.json({url: "valid"})
      : res.json({error: "invalid URL"})
    })
  
})

app.listen(port, function () {
  console.log(`Node.js listening on port:${port}`);
});