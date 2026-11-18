const assert = require('node:assert/strict');
const { once } = require('node:events');
const { before, after, test } = require('node:test');
const app = require('../index');
const books = require('../router/booksdb');

let server;
let baseURL;
let bookClient;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseURL = `http://127.0.0.1:${server.address().port}`;
  // Reload only the client module so it points to this test server's ephemeral port.
  const generalPath = require.resolve('../router/general');
  const oldUrl = process.env.BOOK_API_URL;
  process.env.BOOK_API_URL = baseURL;
  delete require.cache[generalPath];
  try {
    bookClient = require(generalPath);
  } finally {
    if (oldUrl === undefined) delete process.env.BOOK_API_URL;
    else process.env.BOOK_API_URL = oldUrl;
  }
});

after(async () => {
  if (server) await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function request(path, { method = 'GET', body, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(new URL(path, baseURL), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = response.headers.get('set-cookie');
  return { status: response.status, body: await response.json(), cookie: setCookie?.split(';')[0] };
}

const password = 'test-password';
const credentials = (username) => ({ username, password });
const register = (username) => request('/register', { method: 'POST', body: credentials(username) });
const login = (body) => request('/customer/login', { method: 'POST', body });
const reviewPath = '/customer/auth/review/1';

test('GET / lists all IBM books', async () => {
  const response = await request('/');
  assert.equal(response.status, 200);
  assert.equal(Object.keys(response.body).length, 10);
  assert.deepEqual(response.body, books);
});

test('GET /isbn finds the requested book', async () => {
  const response = await request('/isbn/8');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, books[8]);
});

test('GET /author returns every book by the author', async () => {
  const response = await request('/author/unknown');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, [books[4], books[5], books[6], books[7]]);
});

test('GET /title handles URL-encoded spaces and accents', async () => {
  const response = await request('/title/Le%20P%C3%A8re%20Goriot');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, [books[9]]);
});

test('GET /review returns an empty object for an unreviewed book', async () => {
  const response = await request('/review/2');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {});
});

test('Unknown ISBNs and unmatched authors and titles return 404', async () => {
  for (const path of ['/isbn/999', '/isbn/toString', '/review/999', '/author/Absent', '/title/Absent']) {
    assert.equal((await request(path)).status, 404, path);
  }
});

test('Registration creates a user and rejects duplicate usernames', async () => {
  const created = await register('registered-user');
  assert.equal(created.status, 201);
  assert.equal(created.body.username, 'registered-user');
  assert.equal((await register('registered-user')).status, 409);
});

test('Missing credentials, invalid input and malformed JSON return 400', async () => {
  for (const path of ['/register', '/customer/login']) {
    assert.equal((await request(path, { method: 'POST' })).status, 400);
    assert.equal((await request(path, { method: 'POST', body: credentials('invalid name') })).status, 400);
  }
  const response = await fetch(new URL('/register', baseURL), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'Malformed request.' });
  assert.equal((await request('/title/%20')).status, 400);
});

test('Login issues a session cookie and rejects incorrect credentials', async () => {
  assert.equal((await register('login-user')).status, 201);
  const success = await login(credentials('login-user'));
  assert.equal(success.status, 200);
  assert.match(success.cookie, /^connect\.sid=/);
  const wrongPassword = await login({ username: 'login-user', password: 'wrong' });
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongPassword.cookie, undefined);
  assert.equal((await login(credentials('missing-user'))).status, 401);
});

test('Review writes reject missing and invalid sessions', async () => {
  for (const method of ['PUT', 'DELETE']) {
    assert.equal((await request(reviewPath, { method })).status, 401);
    assert.equal((await request(reviewPath, { method, cookie: 'connect.sid=invalid' })).status, 401);
  }
});

test('Two users can create, edit and delete only their own reviews', async () => {
  assert.equal((await register('alice')).status, 201);
  assert.equal((await register('bob')).status, 201);
  const [{ cookie: alice }, { cookie: bob }] = await Promise.all([
    login(credentials('alice')), login(credentials('bob')),
  ]);
  assert.equal((await request(reviewPath, { method: 'PUT', cookie: alice })).status, 400);
  for (const method of ['PUT', 'DELETE']) {
    assert.equal((await request('/customer/auth/review/999', { method, cookie: alice })).status, 404);
  }

  const added = await request(reviewPath + '?review=First%20review', { method: 'PUT', cookie: alice });
  assert.equal(added.status, 201);
  assert.deepEqual((await request('/review/1')).body, { alice: 'First review' });

  const updated = await request(reviewPath, { method: 'PUT', cookie: alice, body: { review: 'Edited' } });
  assert.equal(updated.status, 200);
  assert.deepEqual((await request('/review/1')).body, { alice: 'Edited' });

  assert.equal((await request(reviewPath + '?username=alice', { method: 'DELETE', cookie: bob })).status, 404);
  const bobReview = await request(reviewPath + '?username=alice', {
    method: 'PUT', cookie: bob, body: { username: 'alice', review: 'Bob review' },
  });
  assert.equal(bobReview.status, 201);
  assert.equal(bobReview.body.username, 'bob');
  assert.deepEqual((await request('/review/1')).body, { alice: 'Edited', bob: 'Bob review' });

  assert.equal((await request(reviewPath, { method: 'DELETE', cookie: alice })).status, 200);
  assert.equal((await request(reviewPath, { method: 'DELETE', cookie: alice })).status, 404);
  assert.deepEqual((await request('/review/1')).body, { bob: 'Bob review' });
  assert.equal((await request(reviewPath, { method: 'DELETE', cookie: bob })).status, 200);
  assert.deepEqual((await request('/review/1')).body, {});
});

test('Parallel requests return consistent results and allow one registration per username', async () => {
  const registrations = Promise.all(Array.from({ length: 4 }, () => register('parallel-user')));
  const reads = Promise.all(Array.from({ length: 24 }, () => request('/isbn/3')));
  const [writes, responses] = await Promise.all([registrations, reads]);
  assert.deepEqual(writes.map(({ status }) => status).sort(), [201, 409, 409, 409]);
  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, books[3]);
  }
});

test('All four Axios methods reach their HTTP endpoints', async () => {
  const results = await Promise.all([
    bookClient.getAllBooks(),
    bookClient.getBookByISBN(3),
    bookClient.getBooksByAuthor('Jane Austen'),
    bookClient.getBooksByTitle("Njál's Saga"),
  ]);
  assert.deepEqual(results, [books, books[3], [books[8]], [books[7]]]);
  await assert.rejects(bookClient.getBookByISBN(999), { status: 404 });
});
