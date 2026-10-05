🎨 Sketchly — Real-Time Collaborative Whiteboard

Sketchly is a full-stack, real-time collaborative whiteboard application inspired by tools like Excalidraw. It allows users to create rooms, draw together in real time, see other users' cursors, and communicate through room-based chat.

The project is built as a Turborepo monorepo with a Next.js frontend, Express REST API, WebSocket server, Prisma, and PostgreSQL.

🚀 Live Demo

Frontend:
https://sketchly-project-one.vercel.app

GitHub:
https://github.com/Shivank-pundir/EXCALIDRAW

✨ Features -----

🔐 Authentication
User signup and login
JWT-based authentication
Protected backend routes
Persistent authentication using local storage
Password hashing with bcrypt
🎨 Collaborative Drawing
Real-time drawing with WebSockets
Freehand pen
Rectangle
Circle
Line
Arrow
Text
Eraser
Custom stroke color
Custom fill color
Adjustable stroke width
Adjustable font size
Zoom support
Undo/redo
Drawing persistence
👥 Real-Time Collaboration
Create and join rooms
Multiple users can work in the same room
See currently connected users
Live cursor synchronization
Display user initials/name near their cursor
Real-time drawing synchronization
💬 Room Chat
Real-time room-based chat
Messages synchronized through WebSockets
User-specific chat messages
💾 Persistent Data
PostgreSQL database
Prisma ORM
Persistent rooms
Persistent drawings
Persistent chat data
📱 Responsive UI
Dashboard for managing rooms
Room-based collaborative workspace
Responsive interface
Modern whiteboard-style UI
🛠️ Tech Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Axios
WebSocket
Backend
Node.js
Express.js
TypeScript
WebSocket (ws)
JWT
bcrypt
Database
PostgreSQL
Neon PostgreSQL
Prisma ORM
Monorepo & Deployment
Turborepo
pnpm
Vercel — Frontend
Render — HTTP API
Render — WebSocket server

🏗️ Project Architecture--------

EXCALIDRAW/
│
├── apps/
│   │
│   ├── web/
│   │   └── Next.js frontend
│   │
│   ├── http-backend/
│   │   └── Express REST API
│   │
│   └── ws-backend/
│       └── WebSocket server
│
├── packages/
│   │
│   ├── backend-common/
│   │   └── Shared backend configuration
│   │
│   └── db-stable/
│       └── Prisma + PostgreSQL
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
🔄 How It Works

Sketchly uses three main services:

                 ┌─────────────────────┐
                 │      Next.js        │
                 │      Frontend       │
                 │      Vercel         │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
   ┌─────────────────────┐     ┌─────────────────────┐
   │    HTTP Backend     │     │    WebSocket        │
   │      Express        │     │      Backend        │
   │      Render         │     │      Render         │
   └──────────┬──────────┘     └──────────┬──────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
                 ┌─────────────────────┐
                 │     PostgreSQL       │
                 │       Neon           │
                 └─────────────────────┘
HTTP Backend -------

Handles:

Authentication
User management
Room creation
Room retrieval
Room joining
Drawing persistence
Database operations
WebSocket Backend

Handles real-time events such as:

Joining rooms
Leaving rooms
Drawing synchronization
Cursor movement
Chat messages
Connected users
🔌 API Overview
Authentication
Signup
POST /signup
Signin
POST /signin
Rooms
Create Room
POST /room

Example request:

{
  "name": "My Drawing Room"
}
Get User Rooms
GET /rooms
Get / Join Room
GET /room/:roomId

Protected routes use:

Authorization: Bearer <JWT_TOKEN>
🔌 WebSocket Events

The WebSocket server handles events including:

join_room
leave_room
get_chats
chat
drawing
cursor_move

This allows multiple users inside the same room to receive updates without refreshing the page.

🗄️ Database ------

Sketchly uses PostgreSQL with Prisma ORM.

The database stores application data such as:

Users
Rooms
Drawings
Chats

The drawing state is persisted so that users can reload a room without losing the previously saved canvas.

⚙️ Getting Started
Prerequisites

Make sure you have installed:

Node.js
pnpm
PostgreSQL / Neon database

Recommended Node.js version:

Node.js 24+

Check your versions:

node -v
pnpm -v

📥 Installation -----------------

Clone the repository:

git clone https://github.com/Shivank-pundir/EXCALIDRAW.git

Move into the project:

cd EXCALIDRAW

Install dependencies:

pnpm install

🔐 Environment Variables ----------

You need environment variables for the backend and frontend.

HTTP Backend

Create:

apps/http-backend/.env

Add:

DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
WebSocket Backend

Create:

apps/ws-backend/.env

Add:

DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
Frontend

Create:

apps/web/.env.local

For local development:

NEXT_PUBLIC_HTTP_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_WS_BACKEND_URL=ws://localhost:8080

Never commit .env, .env.local, or other files containing secrets to GitHub.

🧬 Database Setup --------------

Generate the Prisma client:

pnpm --filter db-stable exec prisma generate

If migrations are required:

pnpm --filter db-stable exec prisma migrate dev
▶️ Running the Project Locally

Because Sketchly contains multiple applications, run the services separately.

1. Start HTTP Backend
pnpm --filter http-backend dev

The API runs on:

http://localhost:4000
2. Start WebSocket Backend
pnpm --filter ws-backend dev

The WebSocket server runs on:

ws://localhost:8080
3. Start Frontend
pnpm --filter web dev

Open:

http://localhost:3000
🏭 Production Build

Build the frontend:
pnpm --filter web build

Build the HTTP backend:

pnpm --filter http-backend build

Build the WebSocket backend:

pnpm --filter ws-backend build

🌐 Deployment -------------

Frontend

The Next.js frontend is deployed using Vercel.

Production environment variables:

NEXT_PUBLIC_HTTP_BACKEND_URL=https://sketchly-http-backend-kv00.onrender.com
NEXT_PUBLIC_WS_BACKEND_URL=wss://sketchly-ws-backend-m4zw.onrender.com
HTTP Backend

The Express API is deployed using Render.

Production API:

https://sketchly-http-backend-kv00.onrender.com
WebSocket Backend

The WebSocket server is deployed using Render.

Production WebSocket endpoint:

wss://sketchly-ws-backend-m4zw.onrender.com
🔒 Security

Sketchly implements several security mechanisms:

JWT authentication
Password hashing using bcrypt
Protected API routes
Authorization headers
Environment variables for secrets
CORS configuration
Server-side authentication checks

Secrets such as database credentials and JWT keys are never stored directly in the source code.

📸 Screenshots

Add screenshots of your application here.

For example:

screenshots/
├── login.png
├── dashboard.png
├── whiteboard.png
└── collaboration.png

Then add them to this README:

![Login](screenshots/login.png)

![Dashboard](screenshots/dashboard.png)

![Collaborative Whiteboard](screenshots/whiteboard.png)
🧠 Key Technical Highlights

Some of the main technical challenges solved in this project include:

Real-Time Drawing Synchronization

Drawing operations are sent through WebSockets so that changes made by one user can be reflected for other users inside the same room.

Cursor Synchronization

Each connected user's cursor position is synchronized through WebSocket events, allowing collaborators to see each other's activity in real time.

Persistent Canvas

Drawing data is stored in PostgreSQL so the canvas can be restored when a user reloads the room.

Monorepo Architecture

Turborepo is used to manage multiple applications and shared packages inside a single repository.

Shared Backend Configuration

Common backend configuration is maintained inside shared packages instead of duplicating configuration across services.

📚 What I Learned

Building Sketchly helped me gain practical experience with:

Next.js App Router
TypeScript
Turborepo monorepos
Express.js
WebSockets
Real-time application architecture
JWT authentication
PostgreSQL
Prisma ORM
REST APIs
CORS
State management
Collaborative application design
Vercel deployment
Render deployment
Environment variable management
🔮 Future Improvements

Potential improvements for future versions:

 More advanced drawing tools
 Image upload
 Sticky notes
 Shapes library
 Better mobile support
 Room permissions
 Owner/admin controls
 Collaborative text editing
 Improved undo/redo synchronization
 Version history
 Export canvas as PNG/PDF
 Improved performance for large drawings
👨‍💻 Author

Shivank Pundir

Full-Stack Developer focused on building scalable and real-time web applications.

Profiles
GitHub: https://github.com/Shivank-pundir
LinkedIn: https://www.linkedin.com/in/shivank-pundir-9919b431a/
LeetCode: https://leetcode.com/shivapundir/
⭐ Support

If you find this project useful or interesting, consider giving the repository a ⭐ on GitHub.

📄 License

This project is intended for educational and portfolio purposes.
