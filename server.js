'use strict';

require('dotenv').config();

const express = require('express');
const cors=require('cors');
const superagent=require('superagent');

const app = express();
app.use(cors());
const PORT = process.env.PORT;

app.use(express.urlencoded({extended:true}));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

app.get('/', newSearch);
app.post('/searches', createSearch);

app.get('*', (request, response) => response.status(404).send('This route does not exist'));

function newSearch(request, response) {
  response.render('pages/index');
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
    .then( results => {
      const bookList = results.body.times.map(book =>{
        return new Book (book.volumeInfo);
      });
      console.log('google:', bookList);
      response.status(200).render('pages/serches/show');
    })
}

function Book(bookObj) {
    const noBookFound = 'http://placeholder.it/300x300';
    this.title = bookObj.title || 'no book title found';
}
app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
})

