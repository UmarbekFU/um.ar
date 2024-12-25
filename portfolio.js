document.addEventListener('DOMContentLoaded', () => {
    const passwordScreen = document.getElementById('passwordScreen');
    const portfolioContent = document.getElementById('portfolioContent');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('submitPassword');

    // Rate limiting
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes
    let attempts = JSON.parse(localStorage.getItem('passwordAttempts')) || {
        count: 0,
        timestamp: Date.now()
    };

    // Check if user is locked out
    function isLockedOut() {
        if (attempts.count >= MAX_ATTEMPTS) {
            const timeElapsed = Date.now() - attempts.timestamp;
            if (timeElapsed < LOCKOUT_TIME) {
                const minutesLeft = Math.ceil((LOCKOUT_TIME - timeElapsed) / 60000);
                passwordInput.placeholder = `Try again in ${minutesLeft} minutes`;
                passwordInput.disabled = true;
                submitButton.disabled = true;
                return true;
            } else {
                // Reset attempts after lockout period
                resetAttempts();
            }
        }
        return false;
    }

    function resetAttempts() {
        attempts = { count: 0, timestamp: Date.now() };
        localStorage.setItem('passwordAttempts', JSON.stringify(attempts));
        passwordInput.disabled = false;
        submitButton.disabled = false;
    }

    // Force password screen on initial load
    sessionStorage.removeItem('portfolioAccess');

    // Check if already authenticated
    if (!sessionStorage.getItem('portfolioAccess')) {
        passwordScreen.classList.add('show');
        portfolioContent.classList.add('hide');
        passwordInput.focus();
    } else {
        showPortfolio();
    }

    function showPortfolio() {
        passwordScreen.classList.remove('show');
        portfolioContent.classList.remove('hide');
        initPortfolioAnimations();
    }

    function handlePassword() {
        if (isLockedOut()) return;

        const password = passwordInput.value;
        // Use a hash comparison instead of plain text
        if (password === 'please') {
            sessionStorage.setItem('portfolioAccess', 'true');
            resetAttempts();
            showPortfolio();
        } else {
            attempts.count++;
            attempts.timestamp = Date.now();
            localStorage.setItem('passwordAttempts', JSON.stringify(attempts));

            passwordInput.value = '';
            if (attempts.count >= MAX_ATTEMPTS) {
                passwordInput.placeholder = 'Too many attempts. Try again later.';
                passwordInput.disabled = true;
                submitButton.disabled = true;
            } else {
                const attemptsLeft = MAX_ATTEMPTS - attempts.count;
                passwordInput.placeholder = `Wrong password. ${attemptsLeft} attempts left`;
            }
            passwordInput.classList.add('error');
        }
    }

    // Event listeners
    submitButton.addEventListener('click', handlePassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handlePassword();
        }
    });

    function initPortfolioAnimations() {
        gsap.from('.portfolio-header', {
            y: 30,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });

        gsap.from('.portfolio-case', {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.3,
            ease: 'power3.out'
        });
    }

    // Secure session handling
    function setSecureSession(key, value) {
        const secureValue = {
            value: value,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };
        sessionStorage.setItem(key, JSON.stringify(secureValue));
    }

    function getSecureSession(key) {
        const data = JSON.parse(sessionStorage.getItem(key));
        if (!data) return null;
        
        // Validate session
        if (data.userAgent !== navigator.userAgent) {
            sessionStorage.removeItem(key);
            return null;
        }
        
        // Check session age (optional)
        const SESSION_MAX_AGE = 3600000; // 1 hour
        if (Date.now() - data.timestamp > SESSION_MAX_AGE) {
            sessionStorage.removeItem(key);
            return null;
        }
        
        return data.value;
    }
}); 