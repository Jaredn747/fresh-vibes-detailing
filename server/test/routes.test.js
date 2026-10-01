const assert = require('node:assert/strict');
const http = require('node:http');
const { after, before, describe, it } = require('node:test');
const express = require('express');

const Quote = require('../models/quote');
const Booking = require('../models/booking');
const Service = require('../models/service');
const quoteRoutes = require('../routes/quotes');
const bookingRoutes = require('../routes/bookings');
const serviceRoutes = require('../routes/services');

const app = express();
app.use(express.json());
app.use('/api/quotes', quoteRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);

let server;
let port;
const originalQuoteSave = Quote.prototype.save;
const originalBookingSave = Booking.prototype.save;
const originalServiceFind = Service.find;
const originalServiceFindByIdAndUpdate = Service.findByIdAndUpdate;

const sampleService = {
	_id: 'service-id',
	serviceKey: 'Exterior',
	title: 'Maintenance Wash',
	price: '$75.00+',
	duration: '1hr',
	shortDescription: 'PH neutral wash.',
	fullDescription: '<p>Full service details.</p>'
};

function request(method, path, body) {
	return new Promise((resolve, reject) => {
		const payload = body === undefined ? '' : JSON.stringify(body);
		const requestOptions = {
			hostname: '127.0.0.1',
			port,
			path,
			method,
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(payload)
			}
		};
		const req = http.request(requestOptions, (res) => {
			let responseBody = '';
			res.setEncoding('utf8');
			res.on('data', (chunk) => { responseBody += chunk; });
			res.on('end', () => {
				resolve({
					status: res.statusCode,
					body: responseBody ? JSON.parse(responseBody) : null
				});
			});
		});
		req.on('error', reject);
		req.end(payload);
	});
}

before(async () => {
	Quote.prototype.save = async function saveQuote() { return this; };
	Booking.prototype.save = async function saveBooking() { return this; };
	Service.find = async () => [sampleService];
	Service.findByIdAndUpdate = async (id, updates) => {
		if (id === 'missing-service') return null;
		return { ...sampleService, ...updates, _id: id };
	};

	server = await new Promise((resolve) => {
		const runningServer = app.listen(0, () => resolve(runningServer));
	});
	port = server.address().port;
});

after(async () => {
	Quote.prototype.save = originalQuoteSave;
	Booking.prototype.save = originalBookingSave;
	Service.find = originalServiceFind;
	Service.findByIdAndUpdate = originalServiceFindByIdAndUpdate;
	await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe('quote routes', () => {
	it('creates a quote and returns 201', async () => {
		const response = await request('POST', '/api/quotes', {
			name: 'Jared Customer',
			phone: '7147120371',
			serviceType: 'maintenance'
		});

		assert.equal(response.status, 201);
		assert.equal(response.body.name, 'Jared Customer');
		assert.equal(response.body.serviceType, 'maintenance');
	});

	it('returns 400 when a quote field is missing', async () => {
		const response = await request('POST', '/api/quotes', { name: 'Jared Customer' });

		assert.equal(response.status, 400);
		assert.match(response.body.error, /required/i);
	});

	it('returns 500 when saving a quote fails', async () => {
		Quote.prototype.save = async function failQuoteSave() { throw new Error('database unavailable'); };
		const response = await request('POST', '/api/quotes', {
			name: 'Jared Customer',
			phone: '7147120371',
			serviceType: 'maintenance'
		});

		assert.equal(response.status, 500);
		Quote.prototype.save = async function saveQuote() { return this; };
	});
});

describe('booking routes', () => {
	it('creates a booking and returns 201 with optional condition defaults', async () => {
		const response = await request('POST', '/api/bookings', {
			vehicleType: 'Sedan',
			vehicleMake: 'Honda',
			vehicleModel: 'Civic',
			serviceName: 'Headlight Restoration',
			servicePrice: '$100.00+',
			firstName: 'Jared',
			lastName: 'Customer',
			phone: '7147120371'
		});

		assert.equal(response.status, 201);
		assert.equal(response.body.stains, false);
		assert.equal(response.body.petHair, false);
	});

	it('returns 400 when a required booking field is missing', async () => {
		const response = await request('POST', '/api/bookings', {
			vehicleType: 'Sedan',
			firstName: 'Jared',
			lastName: 'Customer'
		});

		assert.equal(response.status, 400);
		assert.match(response.body.error, /required/i);
	});

	it('returns 500 when saving a booking fails', async () => {
		Booking.prototype.save = async function failBookingSave() { throw new Error('database unavailable'); };
		const response = await request('POST', '/api/bookings', {
			vehicleType: 'Sedan',
			vehicleMake: 'Honda',
			vehicleModel: 'Civic',
			serviceName: 'Maintenance Wash',
			servicePrice: '$75.00+',
			firstName: 'Jared',
			lastName: 'Customer',
			phone: '7147120371'
		});

		assert.equal(response.status, 500);
		Booking.prototype.save = async function saveBooking() { return this; };
	});
});

describe('service routes', () => {
	it('returns all services publicly', async () => {
		const response = await request('GET', '/api/services');

		assert.equal(response.status, 200);
		assert.deepEqual(response.body, [sampleService]);
	});

	it('updates a service by id', async () => {
		const response = await request('PUT', '/api/services/service-id', { price: '$95.00+' });

		assert.equal(response.status, 200);
		assert.equal(response.body.price, '$95.00+');
	});

	it('returns 404 when updating a missing service', async () => {
		const response = await request('PUT', '/api/services/missing-service', { price: '$95.00+' });

		assert.equal(response.status, 404);
	});
});