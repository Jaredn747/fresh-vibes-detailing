const adminApiBaseUrls = ['', 'http://localhost:5001', 'http://localhost:5000'];

async function submitAdminLogin(password) {
    let lastError;

    for (const baseUrl of adminApiBaseUrls) {
        try {
            const response = await fetch(`${baseUrl}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (response.status !== 404 && response.status !== 405 && response.status !== 501) {
                return response;
            }
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Unable to reach the admin login service.');
}

async function loadAdminServices(token) {
    let lastError;

    for (const baseUrl of adminApiBaseUrls) {
        try {
            const response = await fetch(`${baseUrl}/api/services`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status !== 404 && response.status !== 405 && response.status !== 501) {
                return response;
            }
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Unable to reach the services API.');
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const passwordInput = document.getElementById('admin-password');
    const errorMessage = document.getElementById('admin-login-error');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const logoutButton = document.getElementById('admin-logout');
    const servicesStatus = document.getElementById('services-status');
    const servicesList = document.getElementById('admin-services-list');

    function renderServices(services) {
        servicesList.replaceChildren();

        for (const service of services) {
            const serviceCard = document.createElement('article');
            serviceCard.className = 'admin-service-card';

            const title = document.createElement('h3');
            title.textContent = service.title;
            serviceCard.append(title);

            const details = document.createElement('p');
            details.className = 'admin-service-details';
            details.textContent = `${service.price} · ${service.duration}`;
            serviceCard.append(details);

            const description = document.createElement('p');
            description.textContent = service.shortDescription;
            serviceCard.append(description);

            servicesList.append(serviceCard);
        }
    }

    async function showDashboard() {
        loginSection.hidden = true;
        dashboardSection.hidden = false;
        servicesStatus.textContent = 'Loading services...';

        try {
            const response = await loadAdminServices(localStorage.getItem('adminToken'));
            if (!response.ok) {
                throw new Error('Services request failed.');
            }

            const services = await response.json();
            renderServices(services);
            servicesStatus.textContent = `${services.length} services loaded.`;
        } catch (error) {
            console.error('Service loading failed:', error);
            servicesStatus.textContent = 'Unable to load services. Please try again.';
        }
    }

    function showLogin() {
        localStorage.removeItem('adminToken');
        dashboardSection.hidden = true;
        loginSection.hidden = false;
        servicesList.replaceChildren();
        servicesStatus.textContent = '';
        passwordInput.focus();
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        if (!passwordInput.value) {
            errorMessage.textContent = 'Wrong password';
            passwordInput.focus();
            return;
        }

        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const response = await submitAdminLogin(passwordInput.value);
            const data = await response.json();

            if (!response.ok || !data.token) {
                errorMessage.textContent = 'Wrong password';
                return;
            }

            localStorage.setItem('adminToken', data.token);
            await showDashboard();
        } catch (error) {
            console.error('Admin login request failed:', error);
            errorMessage.textContent = 'Unable to log in. Please try again.';
        } finally {
            submitButton.disabled = false;
        }
    });

    logoutButton.addEventListener('click', showLogin);

    if (localStorage.getItem('adminToken')) {
        showDashboard();
    }
});
