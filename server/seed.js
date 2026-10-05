const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
require('dotenv').config();

const Service = require('./models/service');

const serviceDetails = [
	{
		serviceKey: 'Exterior',
		title: 'Maintenance Wash',
		price: '$75.00+',
		duration: '1hr',
		shortDescription: 'PH neutral wash, deionized water, spray wax, tire shine. Sedan/coupe pricing starts at $75.'
	},
	{
		serviceKey: 'Interior',
		title: 'Basic Interior Detail',
		price: '$150.00+',
		duration: '2-4hr',
		shortDescription: 'Deep vacuum, steam cleaning, plastics scrubbed, and light upholstery spot cleaning.'
	},
	{
		serviceKey: 'Full',
		title: 'Full Interior Detail',
		price: '$250.00+',
		duration: '4hr+',
		shortDescription: 'Shampoo, extraction, leather conditioning.'
	},
	{
		serviceKey: '3Month',
		title: '3-Month Ceramic Sealant',
		price: '$175.00+',
		duration: '2hr',
		shortDescription: 'Clay bar treatment + 3-month SiO2 sealant.'
	},
	{
		serviceKey: '6Month',
		title: '6-Month Hybrid SiO2 Wax',
		price: '$250.00+',
		duration: '2.5hr',
		shortDescription: 'Deep rich gloss, water beading, chemical decontamination.'
	},
	{
		serviceKey: 'PolishWax',
		title: 'Polish & Wax (6 Month)',
		price: '$325.00+',
		duration: '4hr',
		shortDescription: 'Paint enhancement polish to remove swirls + 6-month protection.'
	},
	{
		serviceKey: '1Year',
		title: '1 Year Ceramic Coating',
		price: '$600.00+',
		duration: '1 Day',
		shortDescription: 'Full polish + 1 year ceramic coating.'
	},
	{
		serviceKey: '3Year',
		title: '3 Year Ceramic Coating',
		price: '$800.00+',
		duration: '1-2 Days',
		shortDescription: 'Deep swirl correction + 3 year coating + Wheel coating.'
	},
	{
		serviceKey: '6Year',
		title: '6 Year Ceramic Coating',
		price: '$1200.00+',
		duration: '2-3 Days',
		shortDescription: 'Ultimate protection. Paint, Wheels, and Windows coated.'
	},
	{
		serviceKey: 'Headlight',
		title: 'Headlight Restoration',
		price: '$100.00+',
		duration: '1hr',
		shortDescription: 'Sanding & polishing. UV sealant.'
	},
	{
		serviceKey: 'Engine',
		title: 'Engine Bay Cleaning',
		price: '$100.00+',
		duration: '1hr',
		shortDescription: 'Degrease and dress engine bay.'
	},
	{
		serviceKey: 'Windshield',
		title: 'Windshield Ceramic Coating',
		price: '$125.00+',
		duration: '45m',
		shortDescription: 'Hydrophobic layer for glass.'
	},
	{
		serviceKey: 'Tint',
		title: 'Window Tinting',
		price: 'Call for Price',
		duration: 'Varies',
		shortDescription: 'Professional window tinting.'
	},
	{
		serviceKey: 'Audio',
		title: 'Car Audio/Screen',
		price: 'Call for Price',
		duration: 'Varies',
		shortDescription: 'Screen replacement.'
	},
	{
		serviceKey: 'Wrap',
		title: 'Car Wrapping',
		price: 'Call for Price',
		duration: 'Varies',
		shortDescription: 'Full color change or vinyl.'
	},
	{
		serviceKey: 'Upholstery',
		title: 'Upholstery Repair',
		price: 'Call for Price',
		duration: 'Varies',
		shortDescription: 'Repair rips and tears.'
	}
];

function getTemplateDescription(serviceKey, bookingHtml) {
	const templatePattern = new RegExp(`<template id="desc-${serviceKey}">([\\s\\S]*?)</template>`);
	const match = bookingHtml.match(templatePattern);

	if (!match) {
		throw new Error(`Missing booking template for service: ${serviceKey}`);
	}

	return match[1].trim();
}

function buildServices() {
	const bookingHtml = fs.readFileSync(path.join(__dirname, '..', 'booking.html'), 'utf8');

	return serviceDetails.map((service) => ({
		...service,
		fullDescription: getTemplateDescription(service.serviceKey, bookingHtml)
	}));
}

async function seedServices() {
	if (!process.env.MONGODB_URI) {
		throw new Error('MONGODB_URI is not configured.');
	}

	const services = buildServices();
	await mongoose.connect(process.env.MONGODB_URI);

	try {
		await Service.deleteMany({});
		await Service.insertMany(services);
		console.log(`Seeded ${services.length} services successfully.`);
	} finally {
		await mongoose.disconnect();
	}
}

module.exports = { buildServices, getTemplateDescription, seedServices, serviceDetails };

if (require.main === module) {
	seedServices()
		.catch((error) => {
			console.error('Failed to seed services:', error);
			process.exitCode = 1;
		});
}