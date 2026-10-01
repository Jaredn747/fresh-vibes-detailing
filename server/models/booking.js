const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
	vehicleType: {
		type: String,
		enum: ['Sedan', 'SUV', 'Truck', 'Van'],
		required: true
	},
	vehicleMake: {
		type: String,
		required: true,
		trim: true
	},
	vehicleModel: {
		type: String,
		required: true,
		trim: true
	},
	serviceName: {
		type: String,
		required: true,
		trim: true
	},
	servicePrice: {
		type: String,
		required: true,
		trim: true
	},
	stains: {
		type: Boolean,
		default: false
	},
	petHair: {
		type: Boolean,
		default: false
	},
	firstName: {
		type: String,
		required: true,
		trim: true
	},
	lastName: {
		type: String,
		required: true,
		trim: true
	},
	phone: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		trim: true
	}
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);