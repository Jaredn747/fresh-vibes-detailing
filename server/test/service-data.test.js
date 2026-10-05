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
		contains(className) {
			return classes.has(className);
		}
	};
}

function createElement(dataset = {}) {
	return {
		dataset,
		hidden: false,
		textContent: '',
		classList: createClassList(),
		setAttribute(name, value) {
			this[name] = value;
		}
	};
}

function createServiceEnvironment(fetchImplementation) {
	const serviceSection = createElement();
	const loadingMessage = createElement();
	const price = createElement({ serviceKey: 'Exterior', serviceField: 'price' });
	const title = createElement({ serviceKey: 'Exterior', serviceField: 'title' });
	const elements = {
		'service-menu-section': serviceSection,
		'services-loading': loadingMessage
	};
	const contentElements = [price, title];
	const context = {
		console: { error() {} },
		fetch: fetchImplementation,
		window: { scrollTo() {} },
		document: {
			addEventListener() {},
			getElementById(id) {
				return elements[id] || null;
			},
			querySelectorAll(selector) {
				return selector === '[data-service-key]' ? contentElements : [];
			}
		}
	};

	vm.runInNewContext(script, context);

	return { context, loadingMessage, price, serviceSection, title };
}

describe('service data loading', () => {
	it('maps API services and updates the page after loading', async () => {
		let resolveRequest;
		const environment = createServiceEnvironment(() => new Promise((resolve) => {
			resolveRequest = resolve;
		}));
		const loading = environment.context.loadServices();

		assert.equal(environment.serviceSection['aria-busy'], 'true');
		assert.equal(environment.loadingMessage.hidden, false);

		resolveRequest({
			ok: true,
			json: async () => [{
				serviceKey: 'Exterior',
				title: 'Updated Maintenance Wash',
				price: '$99.00+',
				duration: '90m',
				shortDescription: 'Updated service description.'
			}]
		});
		await loading;

		assert.equal(environment.title.textContent, 'Updated Maintenance Wash');
		assert.equal(environment.price.textContent, '$99.00+');
		assert.equal(environment.serviceSection['aria-busy'], 'false');
		assert.equal(environment.loadingMessage.hidden, true);
	});

	it('uses fallback services when the API request fails', async () => {
		const environment = createServiceEnvironment(async () => {
			throw new Error('API unavailable');
		});

		await environment.context.loadServices();

		assert.equal(environment.price.textContent, '$75.00+');
		assert.equal(environment.serviceSection['aria-busy'], 'false');
		assert.equal(environment.loadingMessage.hidden, true);
	});
});
