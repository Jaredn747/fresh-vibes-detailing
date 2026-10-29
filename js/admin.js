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

            if (response.status !== 403) {
                return response;
            }
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Unable to reach the admin login service.');
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const passwordInput = document.getElementById('admin-password');
    const errorMessage = document.getElementById('admin-login-error');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

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
            loginSection.hidden = true;
            dashboardSection.hidden = false;
        } catch (error) {
            console.error('Admin login request failed:', error);
            errorMessage.textContent = 'Unable to log in. Please try again.';
        } finally {
            submitButton.disabled = false;
        }
    });
});
