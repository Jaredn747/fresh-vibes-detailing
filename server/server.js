const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const quoteRoutes = require('./routes/quotes');
const bookingRoutes = require('./routes/bookings');
const serviceRoutes = require('./routes/services');
const adminRoutes = require('./routes/admin');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/quotes', quoteRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
	res.json({ message: 'Fresh Vibes API is running' });
});

app.get('/api/health', (req, res) => {
	res.json({ status: 'ok' });
});

if (process.env.MONGODB_URI) {
	mongoose.connect(process.env.MONGODB_URI)
		.then(() => {
			console.log('Connected to MongoDB');
		})
		.catch((error) => {
			console.error('MongoDB connection error:', error);
		});
} else {
	console.warn('MONGODB_URI is not configured; starting without a database connection.');
}

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

module.exports = app;
