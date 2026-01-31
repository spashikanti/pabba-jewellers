let currentLang="en";

/* Load Collections */
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

/* Load Products */
fetch("products.json")
.then(res=>res.json())
.then(data=>{
  window.products=data;
  renderProducts(data);
});

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

function closeModal(){modal.style.display="none";}
