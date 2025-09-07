# JudgeX
![Issues](https://img.shields.io/github/issues/Mostafa-khatab/JudgeX)
![Watchers](https://img.shields.io/github/watchers/Mostafa-khatab/JudgeX?style=social)
![Stars](https://img.shields.io/github/stars/Mostafa-khatab/JudgeX?style=social)

A comprehensive web application for online judging system with algorithm questions, courses, and contests. Built with MERN stack (MongoDB, Express, React and Node.js).

## ✨ Features

- 🔗 Separated backend and frontend.
- 🧑‍💻 User-friendly interface for solving and submitting coding problems.
- 📚 Problem management for admins (create, edit, delete problems).
- 🎓 Course management system with video content and resources.
- 🏆 Contest management with automated problem linking.
- 🔐 User authentication and role-based access control.
- 📦 Fully containerized with Docker Compose for easy deployment.
- 🖥️ Dedicated Admin Dashboard included

## 🧩 Limitations
- ❗ Currently supports only basic problem types (input/output-based).
- 🔐 Code is not executed inside a secure sandbox; Docker is used, but additional isolation layers (e.g., gVisor, seccomp, AppArmor) are not implemented.
- 🧵 No job queue system (like Redis or RabbitMQ): simultaneous judging requests may cause error.

## 🧱 Project Structure

```
JudgeX/
├── client/              # Frontend (React)
├── admin/               # Admin Dashboard (React)
├── server/              # Backend API (Node.js + Express)
├── judger/              # Automated judging system
├── docker-compose.yml   # Orchestrates services using Docker
├── Dockerfile.*         # Docker configuration for each service
└── README.md
```

## 🛠 Tech Stack

- **Frontend**: React, Tailwind CSS, Axios
- **Admin Dashboard**: React, Tailwind CSS, Axios, TanStack Query
- **Backend**: Node.js, Express.js, MongoDB
- **Judging System**: Node.js, Express.js (no sandbox)
- **Deployment**: Docker, Docker Compose

## ☁️ External Services

This project uses the following third-party services:
- **Cloudinary** — used for storing and managing media assets (images, files, etc.)
- **Mailtrap** — email service for testing and sending emails (e.g., user verification, notifications)

## 🚀 Getting Started

### Requirements

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) (optional)
- [Docker Compose](https://docs.docker.com/compose/) (optional)

### Setup Instructions

1. **Clone the repository**

    ```bash
    git clone https://github.com/Mostafa-khatab/JudgeX.git
    cd JudgeX
	```

2. **Setting up the environment**
	
	Create a .env file in the `server/`, `client/`, `admin/`, `judger/`  directory and define the necessary environment variables using the following template:

	### Judger Service
	```env
	PORT=             # Port for the Judger service (default 8090)
	```
	### Server Service
	```env
	NODE_ENV=         # Environment for server [production | development] (optional)

 	PORT=             # Port for the Server service (default 8080)

 	CLIENT_URL=       # Frontend URL (default http://localhost:5173)

	ADMIN_URL=        # Admin dashboard URL (default http://localhost:5174)

	JUDGER_URL=       # Judger service URL (default http://localhost:8090)

	JWT_SECRET=       # Secret key for JWT

	HASH_SALT=        # Salt for hashing passwords (set a custom value for security)

	DATABASE_URL=     # MongoDB URL for the database (default mongodb://localhost:27017/JudgeX | default for docker: mongodb://mongo:27017/JudgeX)

	MAILTRAP_TOKEN=   # Mailtrap API token (for email testing)

	CLOUD_NAME=       # Cloudinary cloud name

	CLOUD_KEY=        # Cloudinary API key

	CLOUD_SECRET=     # Cloudinary API secret
	```
	### Client Service
	```env
	VITE_API_URL=     # Backend API URL for the client (default http://localhost:8080)
	```
	### Admin Dashboard Service
	```env
	VITE_API_URL=     # Backend API URL (default: http://localhost:8080)
	VITE_CLIENT_URL=  # App client (not Admin Dashboard) (default: http://localhost:5173)
	```

3. **Start services**
	### Manual start

	```bash
	# Judger Service

	cd judger

 	npm i
 	# or
 	yarn
 
	npm run dev
	# or
	yarn dev
	```

	```bash
	# Server Service

	cd server
 
 	npm i
 	# or
 	yarn
 
	npm run dev
	# or
	yarn dev
	```

	```bash
	# Client Service

	cd client
 
 	npm i
 	# or
 	yarn
 
	npm run dev
	# or
	yarn dev
	```

	```bash
	# Admin Dashboard Service

	cd admin
 
 	npm i
 	# or
 	yarn
 
	npm run dev
	# or
	yarn dev
	```

	### Or start services with Docker Compose
	```bash
	docker-compose up --build
	```

4. **Access the application**

	- Open [http://localhost:5173](http://localhost:5173/) in your browser to access JudgeX
	- Open [http://localhost:5174](http://localhost:5174/) in your browser to access Admin Dashboard

## 📸 Screenshots

### JudgeX
![welcome-light](./screenshots/1.png)
![home-light](./screenshots/2.png)
![problems-light](./screenshots/3.png)
![submissions-light](./screenshots/4.png)
![contests-light](./screenshots/5.png)

![welcome-dark](./screenshots/6.png)
![home-dark](./screenshots/7.png)
![problems-dark](./screenshots/8.png)
![submissions-dark](./screenshots/9.png)
![contests-dark](./screenshots/10.png)

### Admin Dashboard
![dashboard-1-light](./screenshots/admin-1.png)
![dashboard-2-light](./screenshots/admin-2.png)
![problem-light](./screenshots/admin-3.png)
![submission-light](./screenshots/admin-4.png)
![contest-light](./screenshots/admin-5.png)
![user-light](./screenshots/admin-6.png)

![dashboard-1-dark](./screenshots/admin-7.png)
![dashboard-2-dark](./screenshots/admin-8.png)
![problem-dark](./screenshots/admin-9.png)
![submission-dark](./screenshots/admin-10.png)
![contest-dark](./screenshots/admin-11.png)
![user-dark](./screenshots/admin-12.png)

And much more for you to explore...

## 🌱 Database Seeding

JudgeX includes several seeding scripts to populate the database with sample data:

### Course Management
```bash
# Seed sample courses with video content and resources
cd server
npm run seed:courses

# Clear all courses from database
npm run clear:courses
```

### Contest Management
```bash
# Seed contests and link existing problems
cd server
npm run seed:contests

# Clear all contests from database
npm run clear:contests
```

### Problem Management
```bash
# Seed problems from various sources
cd server
npm run seed:problems
npm run seed:codeforces
npm run seed:codeforces:simple
npm run seed:codeforces:batch

# Clear all problems
npm run clear:problems

# Check problem statistics
npm run check:problems
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or suggestions.

## 📄 License
This project is licensed under the [MIT](LICENSE) License.

---
JudgeX is a comprehensive online judging system that continues to evolve with new features and improvements. If you enjoy this tool, feel free to give it a star on GitHub!