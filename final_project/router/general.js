const express = require('express');
const axios = require('axios');
const books = require('./booksdb');
const { isValid, validPassword, register } = require('./auth_users');

const public_users = express.Router();

public_users.post('/register', async (req, res, next) => {
  const { username, password } = req.body ?? {};
  if (!isValid(username) || !validPassword(password)) {
    return res.status(400).json({ message: 'A valid username and password are required.' });
  }

  try {
    if (!await register(username, password)) {
      return res.status(409).json({ message: 'Username already registered.' });
    }
    return res.status(201).json({ message: 'Registration successful.', username });
  } catch (error) {
    next(error);
  }
});

public_users.get('/', (req, res) => res.json(books));

public_users.get('/isbn/:isbn', (req, res) => {
  const { isbn } = req.params;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  return res.json(books[isbn]);
});

function searchBooks(field) {
  return (req, res) => {
    const search = req.params[field].trim().toLowerCase();
    if (!search) {
      return res.status(400).json({ message: 'A search term is required.' });
    }

    const matches = Object.values(books).filter((book) => book[field].toLowerCase() === search);
    if (matches.length === 0) {
      return res.status(404).json({ message: 'No matching books found.' });
    }
    return res.json(matches);
  };
}

public_users.get('/author/:author', searchBooks('author'));
public_users.get('/title/:title', searchBooks('title'));

public_users.get('/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  return res.json(books[isbn].reviews);
});

// Task 10: these Axios clients call the running API over HTTP.
const api = axios.create({
  baseURL: process.env.BOOK_API_URL || `http://127.0.0.1:${process.env.PORT ?? 5000}`,
  timeout: 5000,
});

function getAllBooks() {
  return api.get('/').then((response) => response.data);
}

async function getBookByISBN(isbn) {
  const response = await api.get(`/isbn/${encodeURIComponent(isbn)}`);
  return response.data;
}

async function getBooksByAuthor(author) {
  const response = await api.get(`/author/${encodeURIComponent(author)}`);
  return response.data;
}

async function getBooksByTitle(title) {
  const response = await api.get(`/title/${encodeURIComponent(title)}`);
  return response.data;
}

module.exports = {
  general: public_users, getAllBooks, getBookByISBN, getBooksByAuthor, getBooksByTitle,
};
