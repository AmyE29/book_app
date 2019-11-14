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
const PORT = process.env.PORT || 3000;

// set up database
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));


// Routes
app.get('/', getBooks);
app.post('/searches', createSearch);
app.get('/searches/new', newSearch);
app.post('/books', createBook);
app.get('/books/:id', getBook);
app.get('*', (req, res) => res.status(404).send('This route does not exist'));


function newSearch(req, res){
  res.render('pages/searches/new');
}

function createBook(req, res){
  let {title, isbn, author, image_link, description, bookshelf} = req.body;
  let SQL = 'INSERT INTO books (title, author, isbn, image_link, description, bookshelf) VALUES($1, $2, $3, $4, $5, $6);'
  let safeValues = [title, author, isbn, image_link, description, bookshelf];

  client.query(SQL, safeValues)
    .then(() => {
      SQL = 'SELECT * FROM books WHERE isbn = $1;'
      safeValues = [req.body.isbn];

      client.query(SQL, safeValues)
        .then((result) =>{
          res.redirect(`/books/${result.rows[0].id}`)
        })
    })

  // save a book to the db, render the detail page of the book that was saved, after we save the book to the DB, SELECT * FROM books WHERE isbn = request.body.isbn, then redirect to /books/${result.rows[0].id}
}

function getBooks(req, res){
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => res.render('pages/index', { results: results.rows }))
    .catch(() => {
      res.render('pages/error');
    })
}

function createSearch(req, res){
  // using the form data search google books, make superagent call, map over the results, render the 'pages/seraches/show' page
  const booksSearched = req.body.search[0];
  const typeOfSearch = req.body.search[1];

  let url =  `https://www.googleapis.com/books/v1/volumes?q=`;
  console.log('wreckbody: '+req.body);
  console.log('i think this is the number: '+req.body.params);

  if (typeOfSearch === 'title') {
    url += `+intitle:${booksSearched}`;
  }
  if (typeOfSearch === 'author'){
    url += `inauthor:${booksSearched}`;
  }
  superagent.get(url)
    .then(results => {
      console.log(results.body);
      let resArr = results.body.items.map(value => {
        return new Book(value)
      })
      // res.status(200).send(resArr); --functional
      res.status(200).render('pages/searches/show', { results: resArr });
    })
}

app.post('/contact', (req, res) => {
  console.log(req.body);
  res.render('pages/index.ejs');
});


function Book (data){
  this.image_link= `https://books.google.com/books/content?id=${data.id}&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api`
  this.title = data.volumeInfo.title;
  this.author = data.volumeInfo.authors;
  this.description = data.volumeInfo.description;
  this.isbn = data.industryIdentifiers[0].identifier;
}

function getBook(req, res) {
  // gets book from the DB based off of id.
  const SQL = 'SELECT * FROM books WHERE id =$1;';
  let values = [req.params.book_id];

  return client.query(SQL, values)
    .then(result => {
      return res.render('pages/books/show', { book: result.rows[0] });
    })
    .catch(err => console.error(err));
}

app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
});
