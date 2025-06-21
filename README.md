# Beacon Backend

A scalable Node.js/Express backend powering three frontends:

- **Amazon Consumer**
- **Amazon Seller**
- **Beacon Admin Dashboard**

This backend is modular, secure, and production-ready, with robust authentication, RBAC, file upload, and validation.

---

## Table of Contents

- [Features](#features)
- [Architecture & Folder Structure](#architecture--folder-structure)
- [Environment Variables](#environment-variables)
- [Setup & Installation](#setup--installation)
- [Running the Server](#running-the-server)
- [API Overview](#api-overview)
- [Authentication & Roles](#authentication--roles)
- [File Uploads](#file-uploads)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Extending the Backend](#extending-the-backend)
- [License](#license)

---

## Features

- **Multi-frontend support** (consumer, seller, admin) with role-based JWT authentication
- **RBAC** (Role-Based Access Control) middleware
- **Product, Seller, and User management** APIs
- **Secure file uploads** (images to Cloudinary, in-memory buffer)
- **Robust validation** using [Zod](https://zod.dev/)
- **Centralized error handling**
- **Graceful shutdown** for production
- **Pagination and filtering** for product listings
- **Environment-based configuration** for security and flexibility

---

## Architecture & Folder Structure

```
.
├── app.js
├── server.js
├── db.js
├── config/
│   ├── corsOptions.js
│   └── index.js
├── controllers/
│   ├── userController.js
│   ├── sellerController.js
│   └── productController.js
├── middleware/
│   ├── auth.js
│   ├── errorHandlers.js
│   ├── multer.js
│   ├── rbac.js
│   └── validate.js
├── models/
│   ├── User.js
│   ├── Seller.js
│   └── Product.js
├── routes/
│   ├── index.js
│   ├── userRoutes.js
│   ├── sellerRoutes.js
│   └── productRoutes.js
├── utils/
│   └── cloudinary.js
├── validators/
│   └── productSchemas.js
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file in your root with:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/beacon
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
NODE_ENV=development
```

---

## Setup & Installation

1. **Clone the repo:**

   ```bash
   git clone https://
   cd beacon-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**  
   Copy `.env.example` to `.env` and fill in your secrets.

4. **Start MongoDB:**  
   Make sure MongoDB is running locally or update `MONGO_URI` for your cloud DB.

---

## Running the Server

- **Development:**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm start
  ```

---

## API Overview

### User Endpoints

| Method | Endpoint             | Description                       | Auth          |
| ------ | -------------------- | --------------------------------- | ------------- |
| POST   | `/api/users/signup`  | Register (role based on frontend) | Public        |
| POST   | `/api/users/login`   | Login (role based on frontend)    | Public        |
| POST   | `/api/users/logout`  | Logout                            | Auth required |
| GET    | `/api/users/profile` | Get current user profile          | Auth required |

### Seller Endpoints

| Method | Endpoint              | Description            | Auth        |
| ------ | --------------------- | ---------------------- | ----------- |
| POST   | `/api/sellers/create` | Create seller profile  | Seller only |
| GET    | `/api/sellers/me`     | Get own seller profile | Seller only |

### Product Endpoints

| Method | Endpoint               | Description                   | Auth        |
| ------ | ---------------------- | ----------------------------- | ----------- |
| GET    | `/api/products`        | List all products (paginated) | Public      |
| GET    | `/api/products/:id`    | Get product by ID             | Public      |
| POST   | `/api/products/create` | Create product (with images)  | Seller only |
| GET    | `/api/products/mine`   | List seller's own products    | Seller only |

---

## Authentication & Roles

- **JWT-based authentication** using secure, httpOnly cookies.
- **Role-based cookies:**
  - `consumer_token` for consumers
  - `seller_token` for sellers
  - `beacon_token` for admins
- **`x-client-type` header** required on requests to identify frontend type.
- **RBAC middleware** restricts access to endpoints by user role.

---

## File Uploads

- **Image uploads** handled by [multer](https://github.com/expressjs/multer) in memory.
- **Direct upload to Cloudinary** via buffer for fast, secure, and scalable storage.
- **Limits:** 5 images per product, 5MB per image, only major web image formats allowed.

---

## Validation

- **All input validated** using [Zod](https://zod.dev/).
- **Custom middleware** ensures only valid data reaches controllers.
- **Consistent error responses** for validation errors.

---

## Error Handling

- **Centralized error handlers** for Multer and all other errors.
- **Consistent JSON error responses**.
- **Stack traces** shown only in non-production environments.

---

## Extending the Backend

- **Add new models:** Place in `/models`.
- **Add new endpoints:** Create new controllers and routes.
- **Add new validation:** Use Zod schemas in `/validators`.
- **Add new middleware:** Place in `/middleware` and use in routes as needed.
- **Add new utils/services:** Place in `/utils`.

---

## License

MIT (or your preferred license)

---

## Contributors

- Shaurya Bansal
- Srijan Agrawal

---

**Questions or issues?**  
Open an issue or contact the maintainer.
