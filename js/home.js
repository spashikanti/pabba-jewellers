document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('collectionsGrid')) {
        loadCollectionsHome().then(() => {
            initCollectionSlider();
        });
        loadTestimonials();
        const trustSection = document.querySelector('.trust');
        if (trustSection) trustObserver.observe(trustSection);
    }
});

async function loadCollectionsHome() {
    const grid = document.getElementById("collectionsGrid");
    if (!grid) return;

    try {
        // 1. Use the Smart Cache (returns already-parsed JSON)
        const cols = await fetchWithSmartCache("data/collections.json");

        if (!cols || cols.length === 0) {
            console.warn("No collections found to display on home.");
            return;
        }

        // 2. Map and Render
        grid.innerHTML = cols.map(c => {
            const displayName = currentLang === 'en' ? c.name_en : c.name_te;
            
            // Generate optimized picture HTML
            const picHtml = getPictureHtml(c.image, displayName);
            
            // IMPORTANT: Changed ${c.id} to ${c.gallery_id} for the new String-based URLs
            return `
                <a href="catalog.html?category=${c.gallery_id}" class="card">
                    ${picHtml}
                    <div class="card-content">
                        <h3 class="gold" data-en="${c.name_en}" data-te="${c.name_te}">
                            ${displayName}
                        </h3>
                    </div>
                </a>
            `;
        }).join('');

    } catch (err) {
        console.error("Home Collections Loading Error:", err);
        showNoConnectionMessage(); // Using the fallback we created
    }
}

function initCollectionSlider() {
    const grid = document.getElementById('collectionsGrid');
    const nextBtn = document.getElementById('colNext');
    const prevBtn = document.getElementById('colPrev');
    
    // If buttons don't exist in HTML, stop JS to prevent errors
    if (!grid || !nextBtn || !prevBtn) return;

    let currentIndex = 0;
    const items = grid.children;
    const totalItems = items.length;

    // 1. Determine how many items are visible at once based on screen width
    function getVisibleCount() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3; // Desktop
    }

    function updateSlider() {
        const visibleCount = getVisibleCount();
        
        // Hide arrows if we have fewer items than the screen can show
        if (totalItems <= visibleCount) {
            nextBtn.style.display = 'none';
            prevBtn.style.display = 'none';
            grid.style.transform = `translateX(0)`;
            return;
        } else {
            // Use flex on desktop/tablet, hide on mobile if you prefer swipe
            nextBtn.style.display = window.innerWidth <= 768 ? 'none' : 'flex';
            prevBtn.style.display = window.innerWidth <= 768 ? 'none' : 'flex';
        }

        // Calculate the slide percentage
        // We use 100 / visibleCount to move exactly one 'frame'
        const movePercentage = -(currentIndex * (100 / visibleCount));
        grid.style.transform = `translateX(${movePercentage}%)`;
    }

    // Explicitly clear existing listeners to prevent double-sliding
    nextBtn.onclick = () => {
        const visibleCount = getVisibleCount();
        if (currentIndex >= totalItems - visibleCount) {
            currentIndex = 0;
        } else {
            currentIndex++;
        }
        updateSlider();
    };

    prevBtn.onclick = () => {
        const visibleCount = getVisibleCount();
        if (currentIndex <= 0) {
            currentIndex = totalItems - visibleCount;
        } else {
            currentIndex--;
        }
        updateSlider();
    };

    // 2. Auto-slide Logic with "Pause on Hover"
    let autoSlideInterval = setInterval(() => nextBtn.click(), 5000);

    // Pause on hover
    grid.onmouseenter = () => clearInterval(autoSlideInterval);
    grid.onmouseleave = () => {
        clearInterval(autoSlideInterval); // Clear first to be safe
        autoSlideInterval = setInterval(() => nextBtn.click(), 5000);
    };

    // 3. Handle Screen Resizing (Switching from Mobile to Desktop)
    window.addEventListener('resize', () => {
        currentIndex = 0; // Reset to avoid math errors during resize
        updateSlider();
    });

    updateSlider(); // Initial call
}

async function loadTestimonials() {
    const container = document.getElementById('testimonial-container');
    if (!container) return;

    try {
        const data = await fetchWithSmartCache("data/testimonials.json");
        //const data = await response.json();
        //<div class="stars">${item.rating}</div>
        
        container.innerHTML = data.map((item, index) => `
            <div class="testimonial" style="display: ${index === 0 ? 'block' : 'none'}; opacity: ${index === 0 ? '1' : '0'}">
                <p class="testimonial-text">"${item.text}"</p>
                <h4 class="testimonial-author">- ${item.name}</h4>
                <div class="stars">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</div>
            </div>
        `).join('');

        if (data.length > 1) startCarousel();
    } catch (error) {
        container.innerHTML = "<p>Trusted by families since ${CONFIG.ESTABLISHED_YEAR}.</p>";
    }
}

/* --- COUNTER ANIMATION --- */
function animateCounters() {
    const counters = [
        { id: 'customerCount', target: 483, suffix: '+', decimals: 0 },
        { id: 'ratingCount', target: 4.3, suffix: '★', decimals: 1 }
    ];

    counters.forEach(counter => {
        const element = document.getElementById(counter.id);
        if (!element) return;

        let start = 0;
        const duration = 2000;
        const totalSteps = duration / 16;
        const increment = counter.target / totalSteps;

        const updateCount = () => {
            start += increment;
            if (start < counter.target) {
                element.innerText = start.toFixed(counter.decimals) + counter.suffix;
                requestAnimationFrame(updateCount);
            } else {
                // Final catch to ensure exact number
                element.innerText = counter.target.toFixed(counter.decimals) + counter.suffix;
                //element.innerText = counter.target + counter.suffix;
            }
        };
        updateCount();
    });
}

function startCarousel() {
    let current = 0;
    const items = document.querySelectorAll('.testimonial');
    if (items.length === 0) return;

    setInterval(() => {
        items[current].style.opacity = '0';
        setTimeout(() => {
            items[current].style.display = 'none';
            current = (current + 1) % items.length;
            items[current].style.display = 'block';
            setTimeout(() => { items[current].style.opacity = '1'; }, 50);
        }, 500);
    }, 5000);
}

// The "Observer" starts the animation only when the user scrolls to that section
const trustObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            trustObserver.unobserve(entry.target); // Run only once
        }
    });
}, { threshold: 0.5 });

