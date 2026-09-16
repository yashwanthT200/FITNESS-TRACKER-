# Garmin Clone Project

This is a full-stack Garmin clone with a React frontend and Node.js/Express backend.

## Prerequisites
- [Node.js](https://nodejs.org/) installed
- MongoDB installed locally, or a cloud MongoDB URI (Atlas)

## Setup

### 1. Database Configuration
Navigate to the `backend` folder and edit the `.env` file to include your MongoDB connection string if you aren't using a local MongoDB instance.

### 2. Backend Setup
Open a terminal in the `backend` folder and run:
```bash
npm install
node server.js
```
The backend server will start on port 5000.

### 3. Frontend Setup
Open a separate terminal in the `frontend` folder and run:
```bash
npm install
npm run dev
```
The frontend will be accessible at `http://localhost:5173`.

## Contributing
1. Clone the repository.
2. Create a new branch for your feature.
3. Make your changes and commit.
4. Push your branch and submit a pull request.
