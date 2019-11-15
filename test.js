'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.use(methodOverride((request, response) => {
  if (request.body && typeof request.body === 'object' && '_method' in request.body) {
    // look in urlencoded POST bodies and delete it
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}));

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.set('view engine', 'ejs');

app.get('/', getBooks);
app.get('/books/:book_id', getOneBook);
app.post('/books', addBook);
app.post('/searches', searchHandler);
app.get('/searches/new', newSearch);
app.put('/update/:book_id', updateBook);
// app.get('/add', showForm); // show form to add a task
// app.post('/add', addBook); // create a new task


// // Middleware to handle PUT and DELETE

function getBooks(req, res) {
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => {
      console.log(results);
      return res.render('pages/index', { results: results.rows })
    })
    .catch(() => {
      res.render('pages/error');
    })
  // res.render('pages/index');
}

function getOneBook(req, res) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [req.params.book_id];

  return client.query(SQL, values)
    .then(result => {
      return res.render('pages/books/show', { book: result.rows[0] });
    })
    .catch(err => console.error(err));
}


function addBook(request, response) {

  let { title, author, etag, image_url, description, bookshelf } = request.body;

  // save book to database
  let sql = 'INSERT INTO books (title, author, etag, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);';

  let safeValues = [title, author, etag, image_url, description, bookshelf];

  // select that book back from the DB with the id
  client.query(sql, safeValues)
    .then(() => {
      sql = 'SELECT * FROM books WHERE etag = $1;'
      safeValues = [request.body.etag]; 

      client.query(sql, safeValues)
        .then((result) => {
          response.redirect(`/books/${result.rows[0].id}`)
        })
    })
  // render the detail page of the book that was saved
    // after we save the book to the DB
    // select * from books where isbn = request.body.isbn
      // then redirect to /books/${result.rows[0].id}
}


function updateBook(request, response) {
  // destructure variables
  let { title, author, etag, image_url, description, bookshelf } = request.body;
  // need SQL to update the specific task that we were on
  let SQL = `UPDATE books SET title=$1, author=$2, etag=$3, image_url=$4, description=$5, bookshelf=$6 WHERE id=$7;`;
  // use request.params.task_id === whatever task we were on
  let values = [title, author, etag, image_url, description, bookshelf, request.params.book_id];
  console.log(values);
  client.query(SQL, values)
    .then(response.redirect(`/books/${request.params.book_id}`))
    .catch(err => console.error(err));
}

let bookArr = [];

function Book(info) {
  // const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  let id = info.id;
  this.title = info.volumeInfo.title || 'No title available';
  this.author = info.volumeInfo.authors || 'No author available';
  this.description = info.volumeInfo.description || 'No description available';
  this.etag = info.etag;
  // this.image = volumeInfo.imageLinks.thumbnail;
  this.image = `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`;
  // link grabbed from items.volumeInfo.imageLinks.thumbnail property.
  bookArr.push(this);
  // console.log(bookArr);
}

function newSearch(req, res) {
  // renders the search form 'pages/searches/new'
  res.render('pages/searches/new');
}

function searchHandler(req, res) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  // console.log(req.body);
  // console.log(req.body.search);

  if (req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}`; }
  if (req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult)))
    .then(bookArr => res.render('pages/searches/show', { arrItems: bookArr }))
    .catch(() => {
      res.render('pages/error');
    })
  // how will we handle errors?
}

app.listen(PORT, () => console.log(`Listening on ${PORT}`));


// process
/*

*/