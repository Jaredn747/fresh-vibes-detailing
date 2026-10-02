const express = require('express');
const Booking = require('../models/booking');
const { sendBookingNotification } = require('../utils/email');

const router = express.Router();

router.post('/', async (req, res) => {
	const {
		vehicleType,
		vehicleMake,
		vehicleModel,
		serviceName,
		servicePrice,
		stains,
		petHair,
		firstName,
		lastName,
		phone,
		email
	} = req.body;

	const requiredFields = [
		vehicleType,
		vehicleMake,
		vehicleModel,
		serviceName,
		servicePrice,
		firstName,
		lastName,
		phone
	];

	if (requiredFields.some((field) => !field)) {
		return res.status(400).json({ error: 'Vehicle, service, first name, last name, and phone are required.' });
	}

	try {
		const booking = new Booking({
			vehicleType,
			vehicleMake,
			vehicleModel,
			serviceName,
			servicePrice,
			stains,
			petHair,
			firstName,
			lastName,
			phone,
			email
		});
		const savedBooking = await booking.save();
		sendBookingNotification(savedBooking);
		return res.status(201).json(savedBooking);
	} catch (error) {
		return res.status(500).json({ error: 'Failed to save booking.' });
	}
});

module.exports = router;