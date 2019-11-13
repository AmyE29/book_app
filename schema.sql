  
DROP TABLE IF EXISTS books;

CREATE TABLE books (
  title VARCHAR(255),
  etag VARCHAR(255) PRIMARY KEY,
  description TEXT,
  image_link VARCHAR(255),
  searchfield VARCHAR(255)
);