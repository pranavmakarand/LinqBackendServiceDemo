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

### 10. Rate Limiting 
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

### 11. Integration tests have been added in the test folder

### All the optional and the non optional tasks have been completed :)

## 📬 API Documentation

All protected endpoints require a valid JWT token passed in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

### 🔐 Auth Routes

---

#### 📝 Register  
**POST** `/auth/register`  
Registers a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Success Response:**
- `201 Created`
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

**Error Response:**
- `400 Bad Request` (missing fields or user already exists)
```json
{
  "error": "Email and password are required"
}
```

---

#### 🔓 Login  
**POST** `/auth/login`  
Authenticates the user and returns a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Success Response:**
- `200 OK`
```json
{
  "access token": "<jwt_token>"
  "refreshToken": "<refresh_token>"
}
```

**Error Response:**

- `400 Bad Request` (missing fields)
```json
{
  "error": "Email and password are required"
}
```

- `401 Unauthorized`
```json
{
  "error": "Invalid credentials"
}
```

---

#### ♻️ Refresh Token  
**POST** `/auth/refresh`  
Issues a new JWT access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "<refresh_token>"
}
```

**Success Response:**
- `200 OK`
```json
{
  "accesstoken": "<new_jwt_token>"
}
```

**Error Response:**
- `401 Unauthorized`
```json
{
  "error": "Invalid or expired refresh token"
}
```

---

### 👥 Contact Routes

---

#### ➕ Create Contact  
**POST** `/contacts`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Success Response:**
- `201 Created`
```json
{
  "id": "contact_id",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Error Response:**
- `400 Bad Request`
```json
{
  "error": "Invalid input"
}
```

---

#### 📄 Get All Contacts  
**GET** `/contacts`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response:**
- `200 OK`
```json
[
  {
    "id": "contact_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
]
```

---

#### 📄 Get Contact by ID  
**GET** `/contacts/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response:**
- `200 OK`
```json
{
  "id": "contact_id",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Error Response:**
- `404 Not Found`
```json
{
  "error": "Contact not found"
}
```

---

#### 📝 Update Contact  
**PUT** `/contacts/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

**Success Response:**
- `201 OK`
```json
{
  "id": "contact_id",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Error Response:**
- `400 Bad Request` or `404 Not Found`
```json
{
  "error": "Contact not found"
}
```

---

#### ❌ Delete Contact  
**DELETE** `/contacts/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response:**
- `204`
```
No content
```

---

### 🗒️ Note Routes

---

#### ➕ Create Note for Contact  
**POST** `/contacts/:contactId/notes`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "body": "This is a note"
}
```

**Success Response:**
- `201 Created`
```json
{
  "id": "note_id",
  "contactId": "contact_id",
  "body": "This is a note"
}
```

**Error Response:**
- `400 Bad Request`
```json
{
  "error": "Note body is required"
}
```

---

#### 📄 Get Notes for Contact  
**GET** `/contacts/:contactId/notes`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response:**
- `200 OK`
```json
[
  {
    "id": "note_id",
    "body": "This is a note"
  }
]
```

---

#### 📄 Get Note by ID  
**GET** `/contacts/:contactId/notes/:noteId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response:**
- `200 OK`
```json
{
  "id": "note_id",
  "contactId": "contact_id",
  "body": "This is a note"
}
```

**Error Response:**
- `404 Not Found`
```json
{
  "error": "Note not found"
}
```

---

#### 📝 Update Note  
**PUT** `/contacts/:contactId/notes/:noteId`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "body": "Updated note content"
}
```

**Success Response:**
- `201`
```json
{
  "id": "note_id",
  "contactId": "contact_id",
  "body": "This is a note"
}
```

**Error Response:**
- `400 Bad Request`
```json
{
  "error": "Note body is required"
}
```

---

#### ❌ Delete Note  
**DELETE** `/contacts/:contactId/notes/:noteId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response:**
- `204`
```json
No Content
```

**Error Response:**
- `404 Not Found`
```json
{
  "error": "Note not found"
}
```

## 🚀 What I Would Improve or Add with More Time

If given additional time, I would focus on enhancing the scalability, searchability, and developer experience of the service:

### 1. 🔍 Elasticsearch Integration for Notes Search

After processing `note.created` or `note.updated` jobs in the background queue, I would index the note content into an **Elasticsearch** cluster. This would enable:

- Fast, full-text search across all notes
- Ranked and filtered search results
- Improved query capabilities for large-scale datasets

> Example: `GET /search/notes?query=meeting` would return relevant notes with matching content.

---

### 2. ⚡ Distributed Caching with Redis

To improve performance and reduce PostgreSQL load, I would implement **Redis-based caching** for:

- Frequently accessed contacts (`GET /contacts`)
- Notes per contact (`GET /contacts/:id/notes`)

Cached responses would be refreshed on mutation events or automatically expired using TTL (Time-to-Live). This would significantly boost API responsiveness.

---

### 3. 🛠️ Additional Enhancements

- 🧾 Swagger/OpenAPI documentation for interactive API reference  
- 📊 Bull Board UI for visual monitoring of background jobs  
- 🐳 Docker Compose setup for PostgreSQL + Redis + App  
- 🔁 CI/CD automation with GitHub Actions for continuous testing and deployment  

---

These improvements would further elevate the scalability, reliability, and maintainability of the service in a production-grade environment.


