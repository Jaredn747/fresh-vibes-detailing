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
		remove(className) { classes.delete(className); },
		contains(className) { return classes.has(className); }
	};
}

function createQuoteFormEnvironment(fetchImplementation) {
	let wasReset = false;
	let wasPrevented = false;
	const submitButton = {
		disabled: false,
		textContent: 'Send Request'
	};
	const fields = {
		'quote-name': { value: 'Jared Customer', classList: createClassList(), setAttribute() {} },
		'quote-phone': { value: '7147120371', classList: createClassList(), setAttribute() {} },
		'quote-service': { value: 'maintenance', classList: createClassList(), setAttribute() {} },
		'name-error': { textContent: '' },
		'phone-error': { textContent: '' },
		'service-error': { textContent: '' },
		'quote-form-status': { textContent: '', classList: createClassList() }
	};
	const form = {
		querySelector(selector) {
			return selector === 'button[type="submit"]' ? submitButton : null;
		},
		reset() { wasReset = true; }
	};

	const context = {
		console,
		fetch: fetchImplementation,
		window: {},
		document: {
			addEventListener() {},
			querySelectorAll() { return []; },
			getElementById(id) {
				if (id === 'quote-form') return form;
				return fields[id] || null;
			}
		}
	};

	vm.runInNewContext(script, context);

	return {
		context,
		fields,
		submitButton,
		form,
		get wasReset() { return wasReset; },
		get wasPrevented() { return wasPrevented; },
		submit() {
			context.handleQuoteFormSubmit({
				preventDefault() { wasPrevented = true; },
				target: form
			});
		}
	};
}

function flushPromises() {
	return new Promise((resolve) => setImmediate(resolve));
}

describe('quote form', () => {
	it('submits the form and shows success for a 201 response', async () => {
		let request;
		const environment = createQuoteFormEnvironment(async (url, options) => {
			request = { url, options };
			return { status: 201 };
		});

		environment.submit();
		assert.equal(environment.submitButton.disabled, true);
		assert.equal(environment.submitButton.textContent, 'Sending...');
		await flushPromises();

		assert.equal(environment.wasPrevented, true);
		assert.equal(request.url, 'http://localhost:5000/api/quotes');
		assert.equal(request.options.method, 'POST');
		assert.equal(request.options.headers['Content-Type'], 'application/json');
		assert.deepEqual(JSON.parse(request.options.body), {
			name: 'Jared Customer',
			phone: '7147120371',
			serviceType: 'maintenance'
		});
		assert.match(environment.fields['quote-form-status'].textContent, /30 minutes/);
		assert.equal(environment.wasReset, true);
		assert.equal(environment.submitButton.disabled, false);
		assert.equal(environment.submitButton.textContent, 'Send Request');
	});

	it('shows an error and re-enables the form when the request fails', async () => {
		const environment = createQuoteFormEnvironment(async () => ({ status: 500 }));

		environment.submit();
		await flushPromises();

		assert.match(environment.fields['quote-form-status'].textContent, /try again/);
		assert.equal(environment.submitButton.disabled, false);
		assert.equal(environment.submitButton.textContent, 'Send Request');
		assert.equal(environment.wasReset, false);
	});
});