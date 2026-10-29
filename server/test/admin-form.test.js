const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { describe, it } = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '../../js/admin.js'), 'utf8');

function createAdminFormEnvironment(fetchImplementation) {
	let submitHandler;
	let logoutHandler;
	const submitButton = { disabled: false };
	const passwordInput = {
		value: 'admin-password',
		focusCalled: false,
		focus() { this.focusCalled = true; }
	};
	const errorMessage = { textContent: '' };
	const servicesStatus = { textContent: '' };
	const loginSection = { hidden: false };
	const dashboardSection = { hidden: true };
	const serviceNodes = [];
	const logoutButton = {
		addEventListener(event, handler) {
			if (event === 'click') logoutHandler = handler;
		}
	};
	const servicesList = {
		replaceChildren() { serviceNodes.length = 0; },
		append(node) { serviceNodes.push(node); }
	};
	const form = {
		addEventListener(event, handler) {
			if (event === 'submit') submitHandler = handler;
		},
		querySelector(selector) {
			return selector === 'button[type="submit"]' ? submitButton : null;
		}
	};
	const storedItems = new Map();
	const elements = {
		'admin-login-form': form,
		'admin-password': passwordInput,
		'admin-login-error': errorMessage,
		'login-section': loginSection,
		'dashboard-section': dashboardSection,
		'admin-logout': logoutButton,
		'services-status': servicesStatus,
		'admin-services-list': servicesList
	};
	const context = {
		console,
		fetch: fetchImplementation,
		localStorage: {
			setItem(key, value) { storedItems.set(key, value); },
			getItem(key) { return storedItems.get(key); },
			removeItem(key) { storedItems.delete(key); }
		},
		document: {
			addEventListener(event, handler) {
				if (event === 'DOMContentLoaded') handler();
			},
			getElementById(id) {
				return elements[id];
			},
			createElement() {
				const node = {
					className: '',
					textContent: '',
					append() {}
				};
				serviceNodes.push(node);
				return node;
			}
		}
	};

	vm.runInNewContext(script, context);

	return {
		errorMessage,
		loginSection,
		dashboardSection,
		passwordInput,
		submitButton,
		servicesStatus,
		get storedToken() { return storedItems.get('adminToken'); },
		submit() {
			return submitHandler({
				preventDefault() {},
			});
		},
		logout() {
			return logoutHandler();
		}
	};
}

describe('admin login form', () => {
	it('falls back to the backend when the website server does not provide the API', async () => {
		const requests = [];
		const environment = createAdminFormEnvironment(async (url) => {
			requests.push(url);
			if (url === '/api/admin/login') {
				return {
					status: 501,
					ok: false,
					json: async () => ({})
				};
			}

			if (url.endsWith('/api/services')) {
				return { ok: true, status: 200, json: async () => [] };
			}

			return {
				ok: true,
				status: 200,
				json: async () => ({ token: 'test.jwt.token' })
			};
		});

		await environment.submit();

		assert.deepEqual(requests, [
			'/api/admin/login',
			'http://localhost:5001/api/admin/login',
			'/api/services'
		]);
		assert.equal(environment.storedToken, 'test.jwt.token');
		assert.equal(environment.dashboardSection.hidden, false);
	});

	it('stores the token and shows the dashboard after a successful login', async () => {
		let loginRequest;
		const environment = createAdminFormEnvironment(async (url, options) => {
			if (url.endsWith('/api/services')) {
				return {
					ok: true,
					status: 200,
					json: async () => [{
						title: 'Maintenance Wash',
						price: '$75.00+',
						duration: '1hr',
						shortDescription: 'PH neutral wash.'
					}]
				};
			}

			loginRequest = { url, options };
			return {
				ok: true,
				status: 200,
				json: async () => ({ token: 'test.jwt.token' })
			};
		});

		await environment.submit();

		assert.equal(loginRequest.url, '/api/admin/login');
		assert.equal(loginRequest.options.method, 'POST');
		assert.deepEqual(JSON.parse(loginRequest.options.body), { password: 'admin-password' });
		assert.equal(environment.storedToken, 'test.jwt.token');
		assert.equal(environment.loginSection.hidden, true);
		assert.equal(environment.dashboardSection.hidden, false);
		assert.equal(environment.servicesStatus.textContent, '1 services loaded.');
		assert.equal(environment.submitButton.disabled, false);
	});

	it('clears the token and returns to the login form when logging out', async () => {
		const environment = createAdminFormEnvironment(async (url) => {
			if (url.endsWith('/api/services')) {
				return { ok: true, status: 200, json: async () => [] };
			}
			return { ok: true, status: 200, json: async () => ({ token: 'test.jwt.token' }) };
		});

		await environment.submit();
		environment.logout();

		assert.equal(environment.storedToken, undefined);
		assert.equal(environment.loginSection.hidden, false);
		assert.equal(environment.dashboardSection.hidden, true);
	});

	it('shows an error for an invalid login response', async () => {
		const environment = createAdminFormEnvironment(async () => ({
			ok: false,
			status: 401,
			json: async () => ({ error: 'Invalid password' })
		}));

		await environment.submit();

		assert.equal(environment.errorMessage.textContent, 'Wrong password');
		assert.equal(environment.loginSection.hidden, false);
		assert.equal(environment.dashboardSection.hidden, true);
		assert.equal(environment.submitButton.disabled, false);
	});

	it('rejects an empty password without making a request', async () => {
		let requestMade = false;
		const environment = createAdminFormEnvironment(async () => {
			requestMade = true;
		});
		environment.passwordInput.value = '';

		await environment.submit();

		assert.equal(requestMade, false);
		assert.equal(environment.errorMessage.textContent, 'Wrong password');
		assert.equal(environment.passwordInput.focusCalled, true);
	});
});
