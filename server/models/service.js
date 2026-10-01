const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
	serviceKey: {
		type: String,
		required: true,
		unique: true,
		trim: true
	},
	title: {
		type: String,
		required: true,
		trim: true
	},
	price: {
		type: String,
		required: true,
		trim: true
	},
	duration: {
		type: String,
		required: true,
		trim: true
	},
	shortDescription: {
		type: String,
		required: true,
		trim: true
	},
	fullDescription: {
		type: String,
		required: true
	}
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);