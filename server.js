'use strict';

require('dotenv').config();
require('ejs');

const express = require('express');
const cors=require('cors');
const superagent=require('superagent');
const pg = require('pg');

const app = express();
app.use(cors());

app.use(express.urlencoded({extended:true}));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const PORT = process.env.PORT;

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));


// Routes
app.get('/', newSearch);

app.post('/search', createSearch);
app.get('*', (req, res) => res.status(404).send('This route does not exist'));

function newSearch(req, res){
  res.render('pages/index');
}

function createSearch(req, res){
  const searchedBooks = req.body.search[0];
  const searchType = req.body.search[1];
  let url =  `https://www.googleapis.com/books/v1/volumes?q=`;

  console.log(req.body);
  console.log(req.body.search);

  if (searchType === 'title') {
    url += `+intitle:${searchedBooks}`;
  }
  if (searchType === 'author'){
    url += `inauthor:${searchedBooks}`;
  }
  superagent.get(url)
    .then(results => {
      let resArr = results.body.items.map(value => {
        return new Book(value)
      })
      res.status(200).render('pages/searches/show', { results: resArr });
    }).catch(err => console.error(err));
}

app.post('/show', (req, res) => {
  console.log(req.body);
  res.render('pages/index.ejs');
});

function Book (data){
  this.bookImg = `https://books.google.com/books/content?id=${data.id}&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api`
  this.title = data.volumeInfo.title;
  this.author = data.volumeInfo.authors;
  this.description = data.volumeInfo.description;
  this.ISBN = data.industryIdentifiers[0].identifiers;
}
function getBook(searchString) {
  const SQL = 'SELECT * FROM books WHERE searchfield = ($1)';
  const safeVals = [searchString.toUpperCase()];
  return client.query(SQL, safeVals);
}
function addBook(book) {
  const SQL = 'INSERT INTO books (title, etag, description, bookImg, searchfield) VALUES (($1), ($2), ($3), ($4), ($5))';
  const safeVals = [book.title, book.etag, book.description, book.bookImg, book.searchField];
  return client.query(SQL, safeVals);
}
exports.addBook = addBook;
exports.getBook = getBook;

app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
});
