function loadFullCollections() {
    const grid = document.getElementById("fullCollectionsGrid");
    if (!grid) return;

    fetch("collections.json")
        .then(r => r.json())
        .then(cols => {
            grid.innerHTML = cols.map(c => {
                const picHtml = getPictureHtml(c.image, c.name_en);
                return `
                    <div class="collection-card" onclick="window.location.href='catalog.html?category=${c.id}'">
                        ${picHtml}
                        <div class="card-overlay">
                            <h3 data-en="${c.name_en}" data-te="${c.name_te}">${currentLang === 'en' ? c.name_en : c.name_te}</h3>
                            <span class="view-all-btn" data-en="Explore Collection" data-te="సేకరణను అన్వేషించండి">Explore Collection</span>
                        </div>
                    </div>
                `;
            }).join('');
        });
}
