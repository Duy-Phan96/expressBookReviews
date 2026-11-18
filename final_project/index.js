const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { randomBytes } = require('node:crypto');
const { authenticated } = require('./router/auth_users');
const { general } = require('./router/general');

const app = express();
const port = Number(process.env.PORT ?? 5000);
app.locals.jwtSecret = randomBytes(32);

app.use(express.json({ limit: '16kb' }));

app.use('/customer', session({
  secret: randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 1000 },
}));

app.use('/customer/auth', (req, res, next) => {
  const token = req.session.token;
  if (!token) {
    return res.status(401).json({ message: 'Login required.' });
  }

  try {
    const claims = jwt.verify(token, req.app.locals.jwtSecret, { algorithms: ['HS256'] });
    req.username = claims.sub;
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session. Log in again.' });
  }

  next();
});

app.use('/customer', authenticated);
app.use('/', general);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.status === 413) {
    return res.status(413).json({ message: 'Request body is too large.' });
  }
  if (error.status === 400) {
    return res.status(400).json({ message: 'Malformed request.' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Internal server error.' });
});

if (require.main === module) {
  app.listen(port, () => console.log(`Book Review API listening on port ${port}`));
}

module.exports = app;
