const express = require('express');
const Quote = require('../models/quote');
const { sendQuoteNotification } = require('../utils/email');

const router = express.Router();

router.post('/', async (req, res) => {
	const { name, phone, serviceType } = req.body;

	if (!name || !phone || !serviceType) {
		return res.status(400).json({ error: 'Name, phone, and service type are required.' });
	}

	try {
		const quote = new Quote({ name, phone, serviceType });
		const savedQuote = await quote.save();
		sendQuoteNotification(savedQuote);
		return res.status(201).json(savedQuote);
	} catch (error) {
		return res.status(500).json({ error: 'Failed to save quote.' });
	}
});

module.exports = router;