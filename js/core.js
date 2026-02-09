/* --- GLOBAL STATE --- */
let currentLang = localStorage.getItem('preferredLang') || 'en';
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
    const nav = document.querySelector('.navbar');
    const backToTopBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
        if (backToTopBtn) {
            if (window.pageYOffset > 400) backToTopBtn.classList.add('show');
            else backToTopBtn.classList.remove('show');
        }
    });
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
