const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	phone: {
		type: String,
		required: true,
		trim: true
	},
	serviceType: {
		type: String,
		required: true,
		trim: true
	}
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);