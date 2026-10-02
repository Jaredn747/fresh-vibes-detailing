const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');

process.env.EMAIL_USER = 'sender@example.com';
process.env.EMAIL_PASS = 'app-password';
process.env.NOTIFICATION_EMAIL = 'notifications@example.com';

const {
	transporter,
	sendQuoteNotification,
	sendBookingNotification
} = require('../utils/email');

const originalSendMail = transporter.sendMail;

afterEach(() => {
	transporter.sendMail = originalSendMail;
});

function flushPromises() {
	return new Promise((resolve) => setImmediate(resolve));
}

describe('email notifications', () => {
	it('sends a formatted quote notification without returning the promise', async () => {
		let mail;
		transporter.sendMail = (options) => {
			mail = options;
			return Promise.resolve();
		};

		const result = sendQuoteNotification({
			name: 'Jared Customer',
			phone: '7147120371',
			serviceType: 'Maintenance Wash',
			createdAt: '2026-10-01T12:00:00.000Z'
		});
		await flushPromises();

		assert.equal(result, undefined);
		assert.equal(mail.from, 'sender@example.com');
		assert.equal(mail.to, 'notifications@example.com');
		assert.equal(mail.subject, 'New Quote Request - Fresh Vibes');
		assert.match(mail.text, /Name: Jared Customer/);
		assert.match(mail.text, /Phone: 7147120371/);
		assert.match(mail.text, /Service: Maintenance Wash/);
		assert.match(mail.text, /Received:/);
	});

	it('includes all booking details and handles a missing customer email', async () => {
		let mail;
		transporter.sendMail = (options) => {
			mail = options;
			return Promise.resolve();
		};

		sendBookingNotification({
			vehicleType: 'SUV',
			vehicleMake: 'Honda',
			vehicleModel: 'Civic',
			serviceName: 'Interior Detail',
			servicePrice: '$150.00+',
			stains: true,
			petHair: false,
			firstName: 'Jared',
			lastName: 'Customer',
			phone: '7147120371',
			createdAt: '2026-10-01T12:00:00.000Z'
		});
		await flushPromises();

		assert.equal(mail.subject, 'New Booking Request - Fresh Vibes');
		assert.match(mail.text, /Vehicle: SUV/);
		assert.match(mail.text, /Make: Honda/);
		assert.match(mail.text, /Model: Civic/);
		assert.match(mail.text, /Service: Interior Detail/);
		assert.match(mail.text, /Price: \$150\.00\+/);
		assert.match(mail.text, /Stains: Yes/);
		assert.match(mail.text, /Pet hair: No/);
		assert.match(mail.text, /Customer: Jared Customer/);
		assert.match(mail.text, /Phone: 7147120371/);
		assert.match(mail.text, /Email: Not provided/);
		assert.match(mail.text, /Received:/);
	});

	it('logs send failures without throwing', async () => {
		const loggedErrors = [];
		const originalConsoleError = console.error;
		console.error = (...args) => loggedErrors.push(args);
		transporter.sendMail = () => Promise.reject(new Error('SMTP unavailable'));

		try {
			const result = sendQuoteNotification({
				name: 'Jared Customer',
				phone: '7147120371',
				serviceType: 'Maintenance Wash'
			});
			assert.equal(result, undefined);
			await flushPromises();
		} finally {
			console.error = originalConsoleError;
		}

		assert.equal(loggedErrors.length, 1);
		assert.match(loggedErrors[0][0], /Quote notification email failed/);
		assert.match(loggedErrors[0][1].message, /SMTP unavailable/);
	});
});