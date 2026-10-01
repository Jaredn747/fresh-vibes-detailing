const express = require('express');
const Service = require('../models/service');

const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const services = await Service.find();
		return res.json(services);
	} catch (error) {
		return res.status(500).json({ error: 'Failed to load services.' });
	}
});

router.put('/:id', async (req, res) => {
	try {
		const updatedService = await Service.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);

		if (!updatedService) {
			return res.status(404).json({ error: 'Service not found.' });
		}

		return res.json(updatedService);
	} catch (error) {
		return res.status(500).json({ error: 'Failed to update service.' });
	}
});

module.exports = router;