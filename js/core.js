/* --- GLOBAL STATE --- */
let currentLang = localStorage.getItem('preferredLang') || CONFIG.DEFAULT_LANG;
let allProducts = []; 
let filteredProducts = []; 

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLanguageToggle();
    initScrollEffects();
    applyLanguage();
    
    // LOGO FIX: Navigate to home on click
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.onclick = () => window.location.href = 'index.html';
    }
});

function initNavigation() {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');
    const closeBtn = document.getElementById('close-menu');
    if (menuToggle && navLinks) {
        menuToggle.onclick = () => {
            navLinks.classList.add('active');
            menuToggle.style.visibility = 'hidden';
        };
        if (closeBtn) {
            closeBtn.onclick = () => {
                navLinks.classList.remove('active');
                menuToggle.style.visibility = 'visible';
            };
        }
    }
}

function initScrollEffects() {
    const backToTopBtn = document.getElementById('backToTop');
    const nav = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        // 1. Handle Navbar Background
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // 2. Handle Back to Top Visibility
        if (window.pageYOffset > 400) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    // 3. Smooth Scroll Execution
    if (backToTopBtn) {
        backToTopBtn.onclick = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };
    }
}

function initLanguageToggle() {
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.onclick = () => {
            currentLang = currentLang === 'en' ? 'te' : 'en';
            localStorage.setItem('preferredLang', currentLang);
            applyLanguage();
            // Trigger refresh on dynamic parts if they exist
            if (typeof renderCatalog === 'function') renderCatalog(filteredProducts);
        };
    }
}

function applyLanguage() {
    const langBtn = document.getElementById('lang-toggle');
    document.querySelectorAll('[data-en]').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
    });
    if (langBtn) langBtn.textContent = currentLang === 'en' ? 'తెలుగు' : 'English';
}
