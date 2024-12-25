document.addEventListener('DOMContentLoaded', () => {
    initPortfolioProtection();
});

function initPortfolioProtection() {
    const portfolioLink = document.getElementById('portfolioLink');
    const modal = document.getElementById('portfolioModal');
    const closeModal = document.getElementById('closeModal');
    const submitPassword = document.getElementById('submitPassword');
    const passwordInput = document.getElementById('portfolioPassword');

    if (!portfolioLink || !modal || !closeModal || !submitPassword || !passwordInput) return;

    portfolioLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        passwordInput.focus();
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        passwordInput.value = '';
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitPassword.click();
        }
    });

    submitPassword.addEventListener('click', () => {
        const password = passwordInput.value;
        // Replace 'antifragile' with your actual secret word
        if (password === 'antifragile') {
            sessionStorage.setItem('portfolioAccess', 'true');
            window.location.href = './portfolio.html';
        } else {
            passwordInput.value = '';
            passwordInput.placeholder = 'Wrong secret word. Try again.';
            passwordInput.classList.add('error');
            setTimeout(() => {
                passwordInput.classList.remove('error');
                passwordInput.placeholder = 'Secret word';
            }, 2000);
        }
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            passwordInput.value = '';
        }
    });

    // Close modal with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            passwordInput.value = '';
        }
    });
}

// CSRF Protection
function addCSRFToken() {
    const token = Math.random().toString(36).slice(2) + Date.now();
    sessionStorage.setItem('csrfToken', token);
    return token;
}

function validateCSRFToken(token) {
    return token === sessionStorage.getItem('csrfToken');
}

// Add to all forms
document.querySelectorAll('form').forEach(form => {
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrf_token';
    csrfInput.value = addCSRFToken();
    form.appendChild(csrfInput);
});

// Input Sanitization
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Use for all user inputs
document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', (e) => {
        e.target.value = sanitizeInput(e.target.value);
    });
});