const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { describe, it } = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '../../js/script.js'), 'utf8');

function createClassList() {
	const classes = new Set();
	return {
		toggle(className, enabled) {
			if (enabled) classes.add(className);
			else classes.delete(className);
		},
		add(className) { classes.add(className); },
		remove(className) { classes.delete(className); }
	};
}

function createElement(value = '') {
	return {
		value,
		textContent: '',
		innerText: '',
		innerHTML: '',
		style: {},
		classList: createClassList(),
		setAttribute() {},
		querySelectorAll() { return []; }
	};
}

function createBookingFormEnvironment(fetchImplementation) {
	let wasReset = false;
	let wasPrevented = false;
	const elements = {
		vehicleMake: createElement('Honda'),
		vehicleModel: createElement('Civic'),
		'contact-first-name': createElement('Jared'),
		'contact-last-name': createElement('Customer'),
		'contact-phone': createElement('7147120371'),
		'first-name-error': createElement(),
		'last-name-error': createElement(),
		'contact-phone-error': createElement(),
		'contact-form-status': createElement(),
		'contact-email': createElement('jared@example.com'),
		'contact-submit': createElement('Continue to Verification')
	};

	Object.assign(elements['contact-form-status'], { classList: createClassList() });
	for (const id of ['warn-stains', 'warn-hair', 'final-service-title', 'card-service-name', 'card-price', 'footer-price', 'card-duration', 'card-desc-short', 'modal-full-text']) {
		elements[id] = createElement();
	}
	for (const id of ['login-section', 'vehicle-grid-section', 'vehicle-details-section', 'service-menu-section', 'condition-section', 'final-service-section', 'contact-info-section']) {
		elements[id] = createElement();
	}

	const emailInput = elements['contact-email'];
	const submitButton = elements['contact-submit'];
	const contactForm = {
		querySelector(selector) {
			if (selector === 'input[type="email"]') return emailInput;
			if (selector === 'button[type="submit"]') return submitButton;
			return null;
		},
		reset() { wasReset = true; }
	};

	const conditionButtonGroup = {
		querySelectorAll() { return []; }
	};
	const stainsButton = createElement();
	const hairButton = createElement();
	stainsButton.parentNode = conditionButtonGroup;
	hairButton.parentNode = conditionButtonGroup;

	const context = {
		console,
		fetch: fetchImplementation,
		window: { scrollTo() {} },
		document: {
			addEventListener() {},
			querySelectorAll() { return []; },
			getElementById(id) { return elements[id] || createElement(); }
		}
	};

	vm.runInNewContext(script, context);
	context.goToDetails('SUV');
	context.goToServices();
	context.handleServiceClick('Interior');
	context.selectCondition('stains', true, stainsButton);
	context.selectCondition('hair', false, hairButton);
	context.submitCondition();

	return {
		context,
		elements,
		contactForm,
		submitButton,
		get wasReset() { return wasReset; },
		get wasPrevented() { return wasPrevented; },
		submit() {
			context.handleContactInfoSubmit({
				preventDefault() { wasPrevented = true; },
				target: contactForm
			});
		}
	};
}

function flushPromises() {
	return new Promise((resolve) => setImmediate(resolve));
}

describe('booking form', () => {
	it('sends accumulated wizard data and shows success for a 201 response', async () => {
		let request;
		const environment = createBookingFormEnvironment(async (url, options) => {
			request = { url, options };
			return { status: 201 };
		});

		environment.submit();
		assert.equal(environment.submitButton.disabled, true);
		assert.equal(environment.submitButton.textContent, 'Sending...');
		await flushPromises();

		assert.equal(environment.wasPrevented, true);
		assert.equal(request.url, 'http://localhost:5001/api/bookings');
		assert.equal(request.options.method, 'POST');
		assert.equal(request.options.headers['Content-Type'], 'application/json');
		assert.deepEqual(JSON.parse(request.options.body), {
			vehicleType: 'SUV',
			vehicleMake: 'Honda',
			vehicleModel: 'Civic',
			serviceName: 'Basic Interior Detail',
			servicePrice: '$150.00+',
			stains: true,
			petHair: false,
			firstName: 'Jared',
			lastName: 'Customer',
			phone: '7147120371',
			email: 'jared@example.com'
		});
		assert.match(environment.elements['contact-form-status'].textContent, /successfully/);
		assert.equal(environment.wasReset, true);
		assert.equal(environment.submitButton.disabled, false);
	});

	it('shows an error and re-enables the form when booking submission fails', async () => {
		const environment = createBookingFormEnvironment(async () => ({ status: 500 }));

		environment.submit();
		await flushPromises();

		assert.match(environment.elements['contact-form-status'].textContent, /try again/);
		assert.equal(environment.submitButton.disabled, false);
		assert.equal(environment.wasReset, false);
	});
});