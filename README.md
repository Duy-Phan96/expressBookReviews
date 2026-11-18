# Express Book Review Application

IBM final project for **Developing Back-End Apps with Node.js and Express**. The server uses the original ten-book catalog in `final_project/router/booksdb.js`.

## Install, test and run

Requires Node.js 22 or later and npm. The examples use a recent cURL version supporting `--json`.

```sh
git clone https://github.com/Duy-Phan96/expressBookReviews.git
cd expressBookReviews/final_project
npm ci
npm test
npm start
```

The API starts at `http://127.0.0.1:5000`. Use `PORT` to change the listening port or `npm run dev` to restart on edits. The tests start their own server on an available local port and run without a separate `npm start`.

## Endpoints

| Method and path | Result |
| --- | --- |
| `GET /` | Catalog keyed by ISBN |
| `GET /isbn/:isbn` | Book details |
| `GET /author/:author` | Matching books by author |
| `GET /title/:title` | Matching books by title |
| `GET /review/:isbn` | Review text keyed by username |
| `POST /register` | Create a user from JSON `username` and `password` |
| `POST /customer/login` | Authenticate with the same fields and issue a session cookie |
| `PUT /customer/auth/review/:isbn` | Create (`201`) or edit (`200`) the current user's review |
| `DELETE /customer/auth/review/:isbn` | Delete the current user's review (`200`) |

ISBNs are the catalog keys `1` through `10`. Author and title searches use case-insensitive full matches. Encode spaces and accents in URL path segments. Missing books or matches return `404` and an existing book with no reviews returns `{}`. Registration returns `201`, duplicate usernames return `409`, invalid input returns `400`, and failed login or missing authentication returns `401`.

```sh
curl --json '{"username":"reader","password":"course-demo-password"}' http://127.0.0.1:5000/register
curl --cookie-jar cookies.txt --json '{"username":"reader","password":"course-demo-password"}' http://127.0.0.1:5000/customer/login
curl --cookie cookies.txt --request PUT --json '{"review":"A memorable novel."}' http://127.0.0.1:5000/customer/auth/review/8
curl http://127.0.0.1:5000/review/8
curl --cookie cookies.txt --request DELETE http://127.0.0.1:5000/customer/auth/review/8
```

PUT also accepts a URL-encoded `?review=...` parameter. The API derives review ownership from the signed JWT stored in the server-side session. Sessions and tokens expire after one hour. Passwords use salted asynchronous scrypt hashing. The course project keeps users, sessions and reviews in memory, so they reset when the server restarts.

## Async Axios functions

Run this example from `final_project` with the API running. Set `BOOK_API_URL` in the client environment to use a different API base URL.

```sh
node -e "const api = require('./router/general'); Promise.all([api.getAllBooks(), api.getBookByISBN(8), api.getBooksByAuthor('Jane Austen'), api.getBooksByTitle('Pride and Prejudice')]).then(console.log).catch(error => { console.error(error.message); process.exitCode = 1; })"
```

See [the submission guide](submission/FINAL_SUBMISSION.md) for the recorded requests and GitHub links.
