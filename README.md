# Shopping Website (CSAI3124)

Full-stack e-commerce application built with **Node.js/Express** (backend) and **React/Vite** (frontend), using **PostgreSQL** as the database.

## Features

### Block A – Core Functions
- User registration & login (JWT authentication)
- Product listing with category browsing
- Shopping cart management
- Checkout & order creation
- Admin product & order management

### Block B – Multiple Photos & Order Processing
- Multiple product image upload/display
- Order status workflow (PENDING → CONFIRMED → SHIPPED → COMPLETED / CANCELLED / HOLD)
- Order filtering by status
- Status change date tracking with history timeline

### Block C – Advanced Search & Navigation
- Extended product attributes with HTML support
- Multi-attribute keyword search (full-text search)
- Category, price range, and tag filtering
- Related products display
- Admin attribute editing

---

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** ≥ 9

## Getting Started

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env` (a default is provided):

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopping_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Create Database

```bash
# In PostgreSQL
CREATE DATABASE shopping_db;
```

### 4. Initialize Schema & Seed Data

```bash
cd backend
npm run db:init    # Creates all tables, indexes, triggers
npm run db:seed    # Inserts sample categories, products, users
```

### 5. Start Development Servers

```bash
# Terminal 1 – Backend (port 5000)
cd backend
npm run dev

# Terminal 2 – Frontend (port 3000)
cd frontend 
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Test Accounts

| Role     | Email              | Password     |
|----------|--------------------|--------------|
| Admin    | admin@shop.com     | admin123     |
| Customer | customer@shop.com  | customer123  |

## Project Structure

```
Shopping-Website/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection
│   │   ├── database/       # Schema, init, seed scripts
│   │   ├── middleware/      # Auth, file upload
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Helpers
│   │   └── server.js       # Express app entry
│   ├── uploads/            # Product images (created at runtime)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # Auth & Cart providers
│   │   ├── pages/          # Customer & admin pages
│   │   ├── api.js          # Axios instance
│   │   ├── App.jsx         # Router setup
│   │   └── main.jsx        # Entry point
│   └── package.json
├── System_Design.md
├── Project_Scope_and_Activity_List.md
└── README.md
```

## API Overview

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint                          | Auth     | Description                  |
|--------|-----------------------------------|----------|------------------------------|
| POST   | /auth/register                    | —        | Register new customer        |
| POST   | /auth/login                       | —        | Login, receive JWT           |
| GET    | /products                         | —        | List products (paginated)    |
| GET    | /products/search                  | —        | Full-text search + filters   |
| GET    | /products/:id                     | —        | Product detail               |
| GET    | /products/:id/related             | —        | Related products             |
| GET    | /cart                             | Bearer   | View cart                    |
| POST   | /cart/items                       | Bearer   | Add item to cart             |
| POST   | /orders                           | Bearer   | Create order from cart       |
| GET    | /orders                           | Bearer   | List my orders (filter)      |
| GET    | /admin/products                   | Admin    | List all products            |
| POST   | /admin/products                   | Admin    | Create product               |
| PUT    | /admin/products/:id               | Admin    | Update product               |
| POST   | /admin/products/:id/images        | Admin    | Upload product images        |
| GET    | /admin/orders                     | Admin    | List all orders              |
| PUT    | /admin/orders/:id/status          | Admin    | Update order status          |

## Tech Stack

- **Backend:** Node.js, Express.js, PostgreSQL, JWT, bcryptjs, multer
- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Axios
- **Search:** PostgreSQL GIN indexes with tsvector full-text search
