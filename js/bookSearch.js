'use strict';

///////////////////////////////////////////////////////
// Dependencies
///////////////////////////////////////////////////////
const superagent = require('superagent');

///////////////////////////////////////////////////////
// Declarations
///////////////////////////////////////////////////////
function Book(book) {
  this.title = book.items.volumeInfo.title;
  this.etag = book.items.etag;
  this.description = book.items.volumeInfo.description;
  this.imageLink = book.items.volumeInfo.imageLinks.thumbnail;
}

function newSearch(req, res) {
  res.render('pages/index');
}

function volumeSearch(req, res) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}`; }
  if (req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}`; }

  superagent.get(url)
    .then(searchResults => searchResults.body.items.map(book => new Book(book)))
    .then(results => {
      res.render('pages/searches/show', {searchResults: results});
    });
}


///////////////////////////////////////////////////////
// Exports
///////////////////////////////////////////////////////
exports.newSearch = newSearch;
exports.volumeSearch = volumeSearch;