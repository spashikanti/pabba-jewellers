document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('fullCollectionsGrid')) {
        loadFullCollections();
    }
});

function loadFullCollections() {
    const grid = document.getElementById("fullCollectionsGrid");
    if (!grid) return;

    fetch("collections.json")
        .then(r => r.json())
        .then(cols => {
            grid.innerHTML = cols.map(c => `
                <div class="collection-card" onclick="window.location.href='catalog.html?category=${c.id}'">
                    <img src="images/${c.image}" alt="${c.name_en}">
                    <div class="card-overlay">
                        <h3 data-en="${c.name_en}" data-te="${c.name_te}">${currentLang === 'en' ? c.name_en : c.name_te}</h3>
                        <span class="view-all-btn" data-en="Explore Collection" data-te="సేకరణను అన్వేషించండి">Explore Collection</span>
                    </div>
                </div>
            `).join('');
        });
}
