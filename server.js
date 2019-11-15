'use strict';

require('dotenv').config();
require('ejs');

const express = require('express');
const superagent=require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({extended:true}));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}));


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
app.put('/update/:book_id', updateBook);
app.get('*', (req, res) => res.status(404).send('This route does not exist'));

function getBooks(req, res){
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => res.render('pages/index', { results: results.rows }))
    .catch(() => {
      res.render('pages/error');
    })
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
function createBook(req, res){
  let {title, author, isbn,image_url, description, bookshelf} = req.body;
  let SQL = 'INSERT INTO books (title, author, isbn, image_url description, bookshelf) VALUES($1, $2, $3, $4, $5, $6);'
  let safeValues = [title, author, isbn, image_url, description, bookshelf];

  client.query(SQL, safeValues)
    .then(() => {
      SQL = 'SELECT * FROM books WHERE isbn = $1;'
      safeValues = [req.body.isbn];

      client.query(SQL, safeValues)
        .then((result) =>{
          res.redirect(`/books/${result.rows[0].id}`)
        })
    })

}
function updateBook(req, res) {
  let { title, author, isbn, image_url, description, bookshelf } = req.body;
 
  let SQL = `UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5, bookshelf=$6 WHERE id=$7;`;

  let values = [title, author, isbn, image_url, description, bookshelf, req.params.book_id];
  console.log(values);
  client.query(SQL, values)
    .then(res.redirect(`/books/${req.params.book_id}`))
    .catch(err => console.error(err));
}
function Book (data){
  this.image_url= `https://books.google.com/books/content?id=${data.id}&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api`
  this.title = data.volumeInfo.title;
  this.author = data.volumeInfo.authors;
  this.description = data.volumeInfo.description;
  this.isbn = data.industryIdentifiers[0].identifier;
}
function newSearch(req, res){
  res.render('pages/searches/new');
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
      let resArr = results.body.items.map(value => {
        return new Book(value)
      })
      res.status(200).render('pages/searches/show', { results: resArr });
    })
}
app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
});
