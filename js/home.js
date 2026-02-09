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

function loadCollectionsHome() {
    return fetch("collections.json")
        .then(r => r.json())
        .then(cols => {
            const grid = document.getElementById("collectionsGrid");
            if (!grid) return;
            grid.innerHTML = cols.map(c => `
                <a href="catalog.html?category=${c.id}" class="card">
                    <img src="images/${c.image}" alt="${c.name_en}">
                    <h3 class="gold" data-en="${c.name_en}" data-te="${c.name_te}">
                        ${currentLang === 'en' ? c.name_en : c.name_te}
                    </h3>
                </a>
            `).join('');
        });
}

// ... Keep your initCollectionSlider, loadTestimonials, and animateCounters functions here ...
