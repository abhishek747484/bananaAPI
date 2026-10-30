# Banana Memory Quest

A browser-based, single-player memory game built with HTML, CSS, vanilla JavaScript, Node.js, Express and MongoDB. It integrates the University of Bedfordshire Banana Game API.

## Features

- Register and log in with a username, email and password.
- Passwords are hashed with bcrypt.
- Server-side sessions are stored in MongoDB; the browser receives an HttpOnly session cookie.
- Protected game API routes require an authenticated session.
- A banana-themed memory matching game with event-driven interactions.
- After matching all pairs, solve a Banana Game API image puzzle.
- The puzzle answer is checked on the server. The solution is not sent to the browser.
- Logout destroys the session.

## Requirements

- Node.js 18 or newer
- MongoDB database (MongoDB Atlas free tier is suitable, subject to its current limits)

## Setup

1. Extract the ZIP and open the `banana-memory-quest` folder in VS Code.
2. Open a terminal in that folder and install dependencies:

   ```bash
   npm install
   ```

3. Create a MongoDB database:
   - Create a free MongoDB Atlas cluster, or use a local MongoDB server.
   - If using Atlas, create a database user and allow your development IP address in Network Access.
   - Copy the connection string.

4. Create a file named `.env` in the project root. Copy the values from `.env.example` and replace:
   - `MONGODB_URI` with your MongoDB connection string.
   - `SESSION_SECRET` with a long random secret.

   Do not share your `.env` file or commit it to GitHub.

5. Start the application:

   ```bash
   npm run dev
   ```

   Or use `npm start`.

6. Open **http://localhost:3000** in your browser, register an account, log in and play.

## How the Banana API is used

The backend requests JSON from:

`https://marcconrad.com/uob/banana/api.php?out=json`

The API returns a `question` image URL and a numeric `solution`. The backend saves the solution in the user's session and sends only the image URL to the browser. When the player submits an answer, the backend compares it with the saved solution.

If the API is temporarily unavailable, the memory game will still work, but the Banana Challenge will show an error and let the player retry.

## Project structure

```text
banana-memory-quest/
├── client/
│   ├── assets/
│   ├── css/
│   │   ├── auth.css
│   │   ├── game.css
│   │   └── style.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── game.js
│   ├── pages/
│   │   ├── game.html
│   │   ├── login.html
│   │   └── register.html
│   └── index.html
├── server/
│   ├── config/database.js
│   ├── controllers/authController.js
│   ├── controllers/gameController.js
│   ├── middleware/authMiddleware.js
│   ├── models/User.js
│   ├── routes/authRoutes.js
│   ├── routes/gameRoutes.js
│   ├── services/bananaService.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Assignment concepts demonstrated

1. **Event-driven programming:** form submissions, card clicks, restart, answer submission and logout use JavaScript event listeners.
2. **Interoperability:** the Express backend communicates with the external Banana Game API using HTTP and JSON.
3. **Virtual identity:** registration, login, password hashing, authentication middleware, protected routes, server-side sessions, cookies and logout.

Version control is intentionally left for you to demonstrate separately in Git/GitHub.

## Important notes

- This is an educational prototype, not a production-ready public service.
- Use HTTPS in production and set `NODE_ENV=production` so the session cookie is marked Secure.
- Keep the Banana API call on the backend. Do not send the correct solution to the frontend.
- If you change the frontend/backend deployment arrangement, configure secure cookies and same-origin or explicit CORS/CSRF protection appropriately.
