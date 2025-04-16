# 📘 LinqBackendServiceDemo

A backend service built with **Express**, **PostgreSQL**, and **Redis** that supports user authentication, contact management, and notes functionality — complete with rate limiting and background processing via BullMQ.

---

## 🚀 Features

- ✅ JWT-based authentication
- ✅ Contact CRUD operations
- ✅ Notes per contact
- ✅ Rate limiting with `express-rate-limit`
- ✅ Redis + BullMQ for async job queuing
- ✅ Fully tested with `Jest` and `Supertest`

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/pranavmakarand/LinqBackendServiceDemo.git
cd LinqBackendServiceDemo-main
```
### 2. Install dependencies

```bash
npm install
```
### For this project I have added .env (I understand this is not the best practice but to make it easy for you to setup)
```bash
DATABASE_URL=postgres://postgres@localhost:5432/contact_notes_dev
REDIS_URL=redis://localhost:6379
PORT=3000
JWT_SECRET=mysecret123
REFRESH_SECRET=myrefreshsecret456
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 4. Ensure services are running

Make sure both PostgreSQL and Redis are up and running locally.


```bash
Postgres setup
on cmd 
brew services start postgresql // Start postgres
psql -U postgres //Login as postgres user
CREATE DATABASE contact_notes_dev; //Creates the database
```
```bash
on cmd 
Redis setup
brew install redis
brew services start redis
redis-cli ping  # should return "PONG"
```

### 5. Testing
```bash
npm test
```

### 5. Start the server
```bash
npm run dev
```
### 6. Verify Setup

### Check PostgreSQL

Connect to your database:

```bash
psql -U postgres -d contact_notes_dev -h localhost
```
Then run:
```bash
\dt  -- Check that tables were created (e.g., Users, Contacts, Notes)
SELECT * FROM "Users";     -- Empty Row
SELECT * FROM "Contacts";  -- Empty Row
```
### You can use a UI Postgres tool like postico for the same

### 7. API Flow Summary

The testFlow.js script automates this:

✅ Registers a new user

✅ Logs in and retrieves JWT

✅ Creates a contact

✅ Creates a note for that contact

✅ Fetches notes

✅ Deletes the note

```bash
node testFlow.js
```
Then run:
```bash
\dt  -- Check that tables were created (e.g., Users, Contacts, Notes)
SELECT * FROM "Users";     -- Registered User
SELECT * FROM "Contacts";  -- Contact added for the above user
```
### 8 . Token Expiration
The application uses JWT (JSON Web Tokens) for authentication. When a user logs in, they receive a token which is:

Signed using a secret (JWT_SECRET)

Attached to each request as a Bearer token

Verified via middleware for protected routes

Tokens expire after a set duration (e.g. 1h) — this can be configured in the JWT creation logic.

```bash
const signAccessToken = (userId) => {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' });
};

const signRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
};

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);
```

If an expired or invalid token is used, the middleware responds with:

```bash
{
  "error": "Invalid or expired token"
}
```
This ensures only active sessions can access protected endpoints, enhancing security.

### 9. Retry Logic
This project uses BullMQ to handle jobs such as note creation and updates as mentioned in the take - home
When a note is created or updated, a job is added to the Redis queue:

``` bash
await noteQueue.add('note.created', {
  noteId,
  ...
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000 // retry after 2s, then 4s, then 8s
  },
  removeOnComplete: true
});
```
Retry Strategy

Attempts: Each job will be retried up to 3 times if it fails.

Backoff: Retries use exponential backoff to avoid overwhelming the system

```Bash

✅ 1. Initial State: wait
As soon as the job is added, it goes into the noteQueue:wait list.

Jobs here are queued and waiting to be picked up by a Worker.

✅ 2. Processing State: active
A Worker picks up the job, and it moves to noteQueue:active.

If it succeeds → moves to completed.

If it fails → moves to failed (but only after all retry attempts are exhausted).

🔁 3. Retry Mechanism: wait → active (again)
If a job fails, but it still has retry attempts left, BullMQ:

Waits for the backoff time (e.g., 2s, 4s, 8s with exponential).

Moves the job back to wait, where it re-enters the queue.

The Worker picks it up again → active.

✅ So: failed → wait → active → (completed or failed again).

This continues until:

The job succeeds: it moves to completed.

OR

The job fails max attempts: it moves to failed and stays there
```

### 9. Rate Limiting 
I am using express-rate-limit to add rate limiting as middleware per route.

```Bash

const createRateLimiter = (options) => rateLimit({
  windowMs: options.windowMs || 60 * 1000, // Default: 1 minute window
  max: options.max,                        // Max requests allowed
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.'
    });
  },
  keyGenerator: (req) => req.userId || req.ip // Rate-limiting is per user (or IP fallback)
});

```
I am appling rate limits per user by using req.userId (populated by the JWT auth middleware) as the key:

```Bash
keyGenerator: (req) => req.userId || req.ip
```
✅ This ensures:

Authenticated users are limited individually

Unauthenticated users are limited by IP

Route-Based Limits

```Bash
  CONTACT: {
    GET: 60,
    DETAIL: 100,
    POST: 20,
    PUT: 20,
    DELETE: 10
  },
  NOTE: {
    GET: 10,
    POST: 30,
    PUT: 20,
    DELETE: 15
  }

router.get('/contacts', contactGetLimiter);
router.post('/contacts', contactPostLimiter);
router.post('/contacts/:id/notes', notePostLimiter);

```
### What Happens on Limit Exceed

If a user exceeds the allowed limit:

They receive a 429 Too Many Requests response

The message clearly tells them to wait before trying again

```Bash
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later."
}

```

### 10. Integration tests have been added in the test folder

### All the optional and the non optional tasks have been completed :)
