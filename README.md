# Beacon Backend

A scalable Node.js/Express backend powering three frontends:

- **Amazon Consumer**
- **Amazon Seller**
- **Beacon Admin Dashboard**

This backend is modular, secure, and production-ready, with robust authentication, RBAC, file upload, validation, and seamless integration with multiple AI/ML microservices for trust, risk, and authenticity analysis.

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
- [ML/AI Model Integration](#mlai-model-integration)
- [Queues & Workers](#queues--workers)
- [Error Handling](#error-handling)
- [Extending the Backend](#extending-the-backend)
- [License](#license)

---

## Features

- **Multi-frontend support** (consumer, seller, admin) with role-based JWT authentication
- **RBAC** (Role-Based Access Control) middleware
- **Product, Seller, User, and Review management** APIs
- **Secure file uploads** (images to Cloudinary, in-memory buffer)
- **Robust validation** using [Zod](https://zod.dev/)
- **Centralized error handling**
- **Graceful shutdown** for production
- **Pagination and filtering** for product listings
- **AI/ML microservice integration** for product authenticity, review analysis, and seller risk
- **Background job queues and workers** (BullMQ) for scalable ML inference
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
│   ├── productController.js
│   ├── reviewController.js
│   ├── sellerController.js
│   └── userController.js
├── middleware/
│   ├── auth.js
│   ├── errorHandlers.js
│   ├── multer.js
│   ├── rbac.js
│   └── validate.js
├── ml_service/
│   ├── custom_features.py
│   ├── infer_api.py
│   ├── joblib/
│   ├── requirements.txt
│   ├── review_analyzer_api.py
│   └── save_tokenizer.py
├── models/
│   ├── Product.js
│   ├── Review.js
│   ├── Seller.js
│   └── User.js
├── package.json
├── package-lock.json
├── queues/
│   ├── productAnalysisQueue.js
│   └── reviewAnalysisQueue.js
├── routes/
│   ├── index.js
│   ├── productRoutes.js
│   ├── reviewRoutes.js
│   ├── sellerRoutes.js
│   └── userRoutes.js
├── utils/
│   ├── blipApi.js
│   ├── cloudinary.js
│   └── reviewAnalyzerApi.js
├── validators/
│   ├── productSchemas.js
│   └── reviewSchemas.js
├── workers/
│   ├── productAnalysisWorker.js
│   └── reviewAnalysisWorker.js
├── ai-ml-models/
│   ├── Graph-Neural-Network-model/
│   ├── Image-and-semantics-analysis-model/
│   ├── Review-analysis-model/
│   └── Suspicious-prediction-model/
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
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

---

## Setup & Installation

1. **Clone the repo:**

   ```bash
   git clone https://your-repo-url
   cd beacon-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**  
   Copy `.env.example` to `.env` and fill in your secrets.

4. **Start MongoDB and Redis:**  
   Make sure MongoDB and Redis are running locally or update the URIs for your cloud services.

5. **(Optional) Setup AI/ML microservices:**  
   See `ai-ml-models/` and `ml_service/` for Python model APIs and requirements.

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

- **Start ML/AI workers (in separate terminals):**
  ```bash
  node workers/productAnalysisWorker.js
  node workers/reviewAnalysisWorker.js
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

| Method | Endpoint                     | Description                              | Auth        |
| ------ | ---------------------------- | ---------------------------------------- | ----------- |
| GET    | `/api/products`              | List all products (paginated)            | Public      |
| GET    | `/api/products/:id`          | Get product by ID                        | Public      |
| POST   | `/api/products/create`       | Create product (with images)             | Seller only |
| GET    | `/api/products/mine`         | List seller's own products               | Seller only |
| GET    | `/api/products/pending`      | List products pending admin review       | Admin only  |
| PATCH  | `/api/products/:id/approve`  | Approve a pending product                | Admin only  |
| PATCH  | `/api/products/:id/takedown` | Takedown a product (mark as counterfeit) | Admin only  |

### Review Endpoints

| Method | Endpoint                               | Description                   | Auth     |
| ------ | -------------------------------------- | ----------------------------- | -------- |
| POST   | `/api/reviews/:productId`              | Add a review to a product     | Consumer |
| GET    | `/api/reviews/product/:productId`      | Get all reviews for a product | Public   |
| GET    | `/api/reviews/product/:productId/mine` | Get current user's review     | Consumer |

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

## ML/AI Model Integration

- **Python microservices** in `ai-ml-models/` and `ml_service/` directories:
  - **Image/semantic analysis** (BLIP, Gemini, etc.)
  - **Review authenticity analysis**
  - **Seller risk analysis (GNN, Suspicion models)**
- **BullMQ queues** (`queues/`) and **workers** (`workers/`) handle async ML inference and DB updates.
- **All trust, risk, and flag logic** is modular, explainable, and auditable in `models/Product.js`.

---

## Queues & Workers

- **BullMQ** is used for scalable background processing.
- **Workers** process jobs for product and review analysis, update trust scores, and flag risky items.
- **All workers are modular and can be extended for new ML tasks.**

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
- **Add new ML models/services:** Place in `/ai-ml-models` or `/ml_service` and connect via queue/worker.

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

---
