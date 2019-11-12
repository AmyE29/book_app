'use strict';

require('dotenv').config();

const express = require('express');
// const bodyParser=require('body-parser');
// const cors=require('cors');

const app = express();
// app.use(bodyParser());
// app.use(cors());
const PORT = process.env.PORT;

app.use(express.static('./public'));
app.set('view engine', 'ejs');

app.get('/', (request, response) => {
  response.render('pages/index');
})



app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
})
