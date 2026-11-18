const express = require('express');
const jwt = require('jsonwebtoken');
const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const books = require('./booksdb');

const regd_users = express.Router();
const users = new Map();
const deriveKey = promisify(scrypt);

function isValid(username) {
  return typeof username === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(username);
}

function validPassword(password) {
  return typeof password === 'string' && password.trim().length > 0 && password.length <= 128;
}

async function register(username, password) {
  if (users.has(username)) return false;
  const salt = randomBytes(16);
  const hash = await deriveKey(password, salt, 64);
  // A concurrent registration might have finished while scrypt was running.
  if (users.has(username)) return false;
  users.set(username, { salt, hash });
  return true;
}

async function authenticatedUser(username, password) {
  const user = users.get(username);
  if (!user) return false;
  const hash = await deriveKey(password, user.salt, user.hash.length);
  return timingSafeEqual(user.hash, hash);
}

regd_users.post('/login', async (req, res, next) => {
  const { username, password } = req.body ?? {};
  if (!isValid(username) || !validPassword(password)) {
    return res.status(400).json({ message: 'A valid username and password are required.' });
  }

  try {
    if (!await authenticatedUser(username, password)) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign({}, req.app.locals.jwtSecret, {
      algorithm: 'HS256',
      subject: username,
      expiresIn: '1h',
    });

    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.token = token;
      req.session.save((error) => {
        if (error) return next(error);
        return res.json({ message: 'Login successful.' });
      });
    });
  } catch (error) {
    next(error);
  }
});

regd_users.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  const review = req.body?.review ?? req.query.review;
  if (typeof review !== 'string' || !review.trim() || review.length > 2000) {
    return res.status(400).json({ message: 'A review of 1 to 2000 characters is required.' });
  }

  const { reviews } = books[isbn];
  const username = req.username;
  const existing = Object.hasOwn(reviews, username);
  // Define an own property even when the username matches a built-in object property.
  Object.defineProperty(reviews, username, {
    value: review.trim(), enumerable: true, configurable: true, writable: true,
  });

  return res.status(existing ? 200 : 201).json({
    message: existing ? 'Review updated.' : 'Review added.',
    isbn,
    username,
    review: reviews[username],
  });
});

regd_users.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  const { reviews } = books[isbn];
  if (!Object.hasOwn(reviews, req.username)) {
    return res.status(404).json({ message: 'You have no review for this book.' });
  }

  delete reviews[req.username];
  return res.json({ message: 'Review deleted.', isbn, username: req.username });
});

module.exports = { authenticated: regd_users, isValid, validPassword, register };
