const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	}
});

function formatReceivedAt(createdAt) {
	return new Date(createdAt || Date.now()).toLocaleString();
}

function sendQuoteNotification({ name, phone, serviceType, createdAt }) {
	transporter.sendMail({
		from: process.env.EMAIL_USER,
		to: process.env.NOTIFICATION_EMAIL,
		subject: 'New Quote Request - Fresh Vibes',
		text: [
			'New quote request',
			'',
			`Name: ${name}`,
			`Phone: ${phone}`,
			`Service: ${serviceType}`,
			`Received: ${formatReceivedAt(createdAt)}`
		].join('\n')
	}).catch((error) => {
		console.error('Quote notification email failed:', error);
	});
}

function sendBookingNotification({
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
	email,
	createdAt
}) {
	transporter.sendMail({
		from: process.env.EMAIL_USER,
		to: process.env.NOTIFICATION_EMAIL,
		subject: 'New Booking Request - Fresh Vibes',
		text: [
			'New booking request',
			'',
			`Vehicle: ${vehicleType}`,
			`Make: ${vehicleMake}`,
			`Model: ${vehicleModel}`,
			`Service: ${serviceName}`,
			`Price: ${servicePrice}`,
			`Stains: ${stains ? 'Yes' : 'No'}`,
			`Pet hair: ${petHair ? 'Yes' : 'No'}`,
			`Customer: ${firstName} ${lastName}`,
			`Phone: ${phone}`,
			`Email: ${email || 'Not provided'}`,
			`Received: ${formatReceivedAt(createdAt)}`
		].join('\n')
	}).catch((error) => {
		console.error('Booking notification email failed:', error);
	});
}

module.exports = { transporter, sendQuoteNotification, sendBookingNotification };