// app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
require('dotenv').config();

const corsOptions = require('./config/corsOptions');
const { multerErrorHandler, globalErrorHandler } = require('./middleware/errorHandlers');
const apiRoutes = require('./routes');

const app = express();

app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get('/', (req, res) => {
    res.send('CORS-enabled Express server is running!');
});

// Mount all API routes under /api
app.use('/api', apiRoutes);

// Error handlers
app.use(multerErrorHandler);
app.use(globalErrorHandler);

module.exports = app;
