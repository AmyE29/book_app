'use strict';









app.get('/', getBooks);
app.get('/books/:book_id', getBook);
app.post('/books', createBook);
app.post('/searches', createSearch);
app.get('/searches/new', newSearch);
// app.get('/add', showForm); // show form to add a task
// app.post('/add', createBook); // create a new task


function getBooks(req, res) {
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => res.render('pages/index', { results: results.rows }))
    .catch(() => {
      res.render('pages/error');
    })
  // res.render('pages/index');
}

function getBook(req, res) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [req.params.book_id];

  return client.query(SQL, values)
    .then(result => {
      return res.render('pages/books/show', { book: result.rows[0] });
    })
    .catch(err => console.error(err));
}

// function createBook(req, res) {
//   // console.log('createBook()', req.body);
//   let { author, title, description, isbn, image_url, bookshelf  } = req.body;
//   let SQL = 'INSERT into books(author, title, description, isbn, image_url, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);';
//   let values = [author, title, description, isbn, image_url, bookshelf ];

//   return client.query(SQL, values)
//     .then(res.redirect('/'))
//     .catch(err => console.error(err));
// }

function createBook(request, response) {
  console.log('this is the one ', request.body);
  let { title, author, isbn, image_url, description, bookshelf } = request.body;

  // save book to database
  let sql = 'INSERT INTO books (title, author, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);';

  let safeValues = [title, author, isbn, image_url, description, bookshelf];

  // select that book back from the DB with the id
  client.query(sql, safeValues)
    .then(() => {
      sql = 'SELECT * FROM books WHERE isbn = $1;'
      safeValues = [request.body.isbn];

      client.query(sql, safeValues)
        .then((result) => {
          console.log('new thing ', result.rows);
          response.redirect(`/books/${result.rows[0].id}`)
        })
    })
  // render the detail page of the book that was saved
    // after we save the book to the DB
    // select * from books where isbn = request.body.isbn
      // then redirect to /books/${result.rows[0].id}
}

let bookArr = [];

function Book(info) {
  // const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  let id = info.id;
  this.title = info.volumeInfo.title || 'No title available';
  this.author = info.volumeInfo.authors || 'No author available';
  this.description = info.volumeInfo.description || 'No description available';
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

function createSearch(req, res) {
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