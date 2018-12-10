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
app.use(bodyParser.urlencoded({extended: false}))
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const counterSchema = new mongoose.Schema({
  name: String,
  index: {type: Number, default: 1},
})

const miniSchema = new mongoose.Schema({
  url: String,
  miniId: Number
})

const Mini = mongoose.model("mini", miniSchema)
const Counter = mongoose.model("counter", counterSchema)

const createAndSaveMini = async (url) => {

  const findAndUpdateCounter = new Promise((resolve, reject) => {
    Counter.findOneAndUpdate(
      {name: "miniCounter"},
      {$inc: {index: 1}},
      {upsert: true, setDefaultsOnInsert: true},
      function(err, data) {
        if (!data) {
          Counter.findOneAndUpdate(
            {name: "miniCounter"},
            {$inc: {index: 1}},
            function(err, data) {
              err
              ? reject(err)
              : resolve(data)
            }
          )
        } else {
          err
          ? reject(err)
          : resolve(data)
        }
      })
  })

  const createEntry = (index) => new Promise ((resolve, reject) => {

    const entry = new Mini({
      url: url,
      miniId: index
    })

    entry.save(function(err, data) {
      err
      ? reject(err)
      : resolve(data)
    })
  })

  let index = await findAndUpdateCounter.then(result => result.index)
  let savedEntry = await createEntry(index)
  return savedEntry
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

const checkDB = (url) => {

  return new Promise((resolve, reject) => {
    Mini.findOne({url: url}, (err, doc) => {
      if (err) {
        reject("error")
      } else
      if (!doc) {
        createAndSaveMini(url)
          .then(newDoc => resolve(newDoc))
      } else {
        resolve(doc)
      }
    })
  })
}

//------------------------------------------------------------
app.post('/api/shorturl/new', function(req, res) {
  const { url } = req.body
  validateUrl(url)
    .then(result => {
      result 
      ? checkDB(url)
        .then(doc => res.json({
          "original_url": doc.url,
          "short_url": doc.miniId
        }))
        .catch(() => console.log("alert error!"))
      : res.json({error: "invalid URL"})
    })
  
})

app.get('/api/shorturl/:index', function(req, res) {
  const { index } = req.params
  Mini.findOne({miniId: index}, (err, data) => {
    
    if(!data) {
      res.json({error: "short url does not exist"})
    } else {
      res.redirect(data._doc.url)
    }
  })
})

app.listen(port, function () {
  console.log(`Node.js listening on port:${port}`);
});