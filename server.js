const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config({ path: './config.env' });

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Routes
app.use('/api/company', require('./routes/company'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 