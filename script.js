let currentLang="en";
let products=[];
let currentPage=1;
const perPage=6;

window.addEventListener('scroll', function() {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

/* Load Collections */
/*
fetch("collections.json")
.then(res=>res.json())
.then(cols=>{
  const grid=document.getElementById("collectionsGrid");
  cols.forEach(c=>{
    grid.innerHTML+=`
      <div class="card" onclick="filterCategory('${c.id}')">
        <img src="images/${c.image}">
        <h3 class="gold">${c["name_"+currentLang]}</h3>
      </div>`;
  });
});
*/

if(document.getElementById("collectionsGrid")){
fetch("collections.json").then(r=>r.json()).then(cols=>{
  const grid=document.getElementById("collectionsGrid");
  cols.forEach(c=>{
    grid.innerHTML+=`
      <a href="catalog.html?cat=${c.id}" class="card">
        <img src="images/${c.image}">
        <h3 class="gold">${c.name_en}</h3>
      </a>`;
  });
});
}

/* Load Products */
/*
fetch("products.json")
.then(res=>res.json())
.then(data=>{
  window.products=data;
  renderProducts(data);
});
*/

/* LOAD PRODUCTS (CATALOG PAGE) */
if(document.getElementById("productGrid")){
fetch("products.json").then(r=>r.json()).then(data=>{
  products=data;
  const params=new URLSearchParams(window.location.search);
  const cat=params.get("cat");
  if(cat) products=products.filter(p=>p.category===cat);
  renderProducts();
  setupPagination();
});
}

/*
function renderProducts(list){
  const grid=document.getElementById("productGrid");
  grid.innerHTML="";
  list.forEach((p,i)=>{
    grid.innerHTML+=`
      <div class="card" onclick="openModal(${i})">
        <img src="images/${p.image}">
        <h3 class="gold">${p["title_"+currentLang]}</h3>
      </div>`;
  });
}
*/
function renderProducts(){
  const start=(currentPage-1)*perPage;
  const list=products.slice(start,start+perPage);
  productGrid.innerHTML="";
  list.forEach((p,i)=>{
    productGrid.innerHTML+=`
      <div class="card" onclick="openModal(${start+i})">
        <img src="images/${p.image}">
        <h3 class="gold">${p.title_en}</h3>
      </div>`;
  });
}

function setupPagination(){
  const pages=Math.ceil(products.length/perPage);
  pagination.innerHTML="";
  for(let i=1;i<=pages;i++){
    pagination.innerHTML+=`<button onclick="goPage(${i})">${i}</button>`;
  }
}

function goPage(p){currentPage=p;renderProducts()}

function filterCategory(cat){
  const filtered=products.filter(p=>p.category===cat);
  renderProducts(filtered);
}

/* Modal */
function openModal(i){
  const p=products[i];
  modal.style.display="flex";
  modalImg.src="images/"+p.image;
  modalTitle.innerText=p["title_"+currentLang];
  modalDesc.innerText=p["desc_"+currentLang];
  const msg=`Hi, I'm interested in the ${p.title_en}`;
  waBtn.onclick=()=>window.open(`https://wa.me/918978569063?text=${encodeURIComponent(msg)}`);
}

function closeModal(){modal.style.display="none"}

/* Testimonials rotation */
/*
const testimonials=document.querySelectorAll('.testimonial');
let tIndex=0;
setInterval(()=>{
  testimonials[tIndex].classList.remove('active');
  tIndex=(tIndex+1)%testimonials.length;
  testimonials[tIndex].classList.add('active');
},4000);
*/
/*
const t=document.querySelectorAll(".testimonial");
if(t.length){
let ti=0;
setInterval(()=>{
  t[ti].classList.remove("active");
  ti=(ti+1)%t.length;
  t[ti].classList.add("active");
},3500);
}
*/

async function loadTestimonials() {
    const container = document.getElementById('testimonial-container');
    if (!container) return;

    try {
        // Use a relative path for GitHub Pages
        const response = await fetch('./testimonials.json'); 
        if (!response.ok) throw new Error("Could not load JSON");
        
        const data = await response.json();
        
        // 1. Inject the HTML
        container.innerHTML = data.map((item, index) => `
            <div class="testimonial ${index === 0 ? 'active' : ''}" style="display: ${index === 0 ? 'block' : 'none'}">
                <p class="testimonial-text">"${item.text}"</p>
                <h4 class="testimonial-author">- ${item.name}</h4>
                <div class="stars">${item.rating}</div>
            </div>
        `).join('');

        // 2. Start the animation ONLY after elements exist
        if (data.length > 1) {
            startCarousel();
        }
    } catch (error) {
        console.error("Testimonial Error:", error);
        container.innerHTML = "<p>Trusted by hundreds of families in Hyderabad.</p>";
    }
}
/*
function startCarousel() {
    let current = 0;
    
    setInterval(() => {
        const items = document.querySelectorAll('.testimonial');
        if (items.length === 0) return;

        // Hide current
        items[current].style.opacity = '0';
        setTimeout(() => {
            items[current].style.display = 'none';
            items[current].classList.remove('active');

            // Move to next
            current = (current + 1) % items.length;

            // Show next
            items[current].style.display = 'block';
            items[current].classList.add('active');
            // Small delay to trigger fade-in
            setTimeout(() => { items[current].style.opacity = '1'; }, 50);
        }, 500); // Half-second fade out
    }, 4000);
}
*/
function startCarousel() {
    let current = 0;
    const items = document.querySelectorAll('.testimonial');
    if (items.length === 0) return;

    setInterval(() => {
        // 1. Fade out current
        items[current].style.opacity = '0';
        
        // Use a short delay so the fade-out starts before we switch
        setTimeout(() => {
            items[current].style.display = 'none';
            items[current].classList.remove('active');

            // Move to next index
            current = (current + 1) % items.length;

            // 2. Prepare next
            items[current].style.display = 'block';
            items[current].classList.add('active');
            
            // 3. Fade in next immediately
            setTimeout(() => {
                items[current].style.opacity = '1';
            }, 50); 
        }, 400); // This matches the 0.4s CSS transition
    }, 5000); // 5 seconds per testimonial
}

// Call the function
loadTestimonials();

/*
async function loadTestimonials() {
    const container = document.getElementById('testimonial-container');
    try {
        const response = await fetch('testimonials.json');
        const data = await response.json();
        
        let html = '';
        data.forEach((item, index) => {
            html += `
                <div class="testimonial ${index === 0 ? 'active' : ''}">
                    <p>"${item.text}"</p>
                    <h4>- ${item.name}</h4>
                    <div class="stars">${item.rating}</div>
                </div>
            `;
        });
        container.innerHTML = html;
        startCarousel(); // Initialize the sliding logic
    } catch (error) {
        console.error("Error loading testimonials:", error);
    }
}

function startCarousel() {
    let current = 0;
    const items = document.querySelectorAll('.testimonial');
    if(items.length === 0) return;

    setInterval(() => {
        items[current].classList.remove('active');
        current = (current + 1) % items.length;
        items[current].classList.add('active');
    }, 4000); // Change every 4 seconds
}

loadTestimonials();
*/

/* Category filtering scroll fix */
function filterCategory(cat){
  const filtered=products.filter(p=>p.category===cat);
  renderProducts(filtered);
  document.getElementById("catalog").scrollIntoView({behavior:"smooth"});
}



