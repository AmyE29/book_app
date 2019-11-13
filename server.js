'use strict';

require('dotenv').config();
require('ejs');
const express = require('express');
const cors=require('cors');
const superagent=require('superagent');
const pg = require('pg');



const app = express();
app.use(cors());
const PORT = process.env.PORT;


app.use(express.urlencoded({ extended: true }));
app.use( express.static('./public') );

app.set('view engine', 'ejs');


const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.get('/', newSearch);
app.post('/searches', createSearch);


app.get('*', (request, response) => response.status(404).send('This route does not exist'));

function newSearch(request, response) {
  response.render('pages/index');
  response.status(200).send('klasdlkfhjsaldkj')
}
function createSearch(request, response) {
  const searchedThings = request.body.search[0];
  const searchType = request.body.search[1];

  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  console.log(request.body);
  console.log(request.body.search);

  if (searchType === 'title') { url += `+intitle:${searchedThings}`; }
  if (searchType === 'author') { url += `+inauthor:${searchedThings}`; }

  superagent.get(url)
    .then(results => {

      console.log('results retuned', results);

    })
    .catch(error => errorHandler(error, req, res));
}

app.post('/contact', (request, response) => {
  console.log(request.body);
  response.render('pages/index.ejs');
});

function Book(bookObj) {

  const bookImg = 'http://placeholder.it/300x300';
  this.title =bookObj.volumeInfo.title || 'No book available';
  this.authors =bookObj.volumeInfo.authors || 'No Author Listed';
  this.publisher =bookObj.publisher || 'No book available';
  this.publishedDate =bookObj.publishedDate || 'No book available';
  this.description =bookObj.description || 'No book available';
  this.etag =bookObj.etag;
  console.log(bookObj);

}

app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
});
