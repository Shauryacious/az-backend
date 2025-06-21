// app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
require('dotenv').config();

const { corsOptions } = require('./config'); // Centralized config
const { multerErrorHandler, globalErrorHandler } = require('./middleware/errorHandlers');
const apiRoutes = require('./routes');

const app = express();

// Global middlewares
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Health check endpoint (standardized)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server healthy' });
});

// Mount all API routes under /api
app.use('/api', apiRoutes);

// Error handlers (should be last)
app.use(multerErrorHandler);
app.use(globalErrorHandler);

module.exports = app;
