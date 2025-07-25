# Family Tree Management Application

A React + Vite application for managing family trees with Node.js backend.

## Project Structure

- **Frontend**: React + Vite application  
- **Backend**: Node.js + Express + Neo4j (separate backend folder)

## Setup Instructions

### Frontend (this directory)
```bash
npm install
npm run dev
```

### Backend (backend folder)  
```bash
cd backend
npm install
npm start
```

## Features

- Family tree visualization
- Admin role for the first user
- Add family members with relationships
- Professional UI design
- JWT authentication

## Admin Access

The first user who registers becomes the admin automatically and can add family members. Other users can only view the family tree after logging in with their email and temporary password.