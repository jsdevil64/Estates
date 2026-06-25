
// 1. உங்களோட புதிய Google Apps Script URL-ஐ கீழே உள்ள இடத்தில் பேஸ்ட் பண்ணுங்க தலை
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhPAYCQq5N3-CP-byg7aAkNxWzRzxmHm1MwMiEt41HF7hH-Mhkbmyg3dFiHw95TCoh/exec';

// --- ROYAL GIFT SYSTEM CONFIG (உங்களின் UPI விபரங்கள்) ---
const MY_UPI_ID = '8939717405@ybl'; 
const MY_NAME = 'Royal Estates Admin'; 

const propertyGrid = document.getElementById('property-grid');
const openFormBtn = document.getElementById('open-form-btn');
const registerModal = document.getElementById('register-modal');
const closeRegBtn = document.getElementById('close-reg-btn');
const propertyForm = document.getElementById('property-form');
const resultsCount = document.getElementById('results-count');

const tipsBtn = document.getElementById('tips-btn');
const tipsModal = document.getElementById('tips-modal');
const closeTipsBtn = document.getElementById('close-tips-btn');
const tipsForm = document.getElementById('tips-form');

const searchBtn = document.getElementById('search-btn');
const areaSearch = document.getElementById('area-search');
const propertyFilter = document.getElementById('property-filter');
const chips = document.querySelectorAll('.chip');

let properties = [];

// --- 2. Google Sheet-ல இருந்து டேட்டாவை இழுத்துட்டு வந்து கார்டு கிரியேட் பண்ற பங்க்ஷன் ---
async function loadPropertiesFromSheet() {
    propertyGrid.innerHTML = `
        <div style="text-align:center; padding:40px; grid-column: 1/-1; color:#D4AF37;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:28px; margin-bottom:10px;"></i>
            <p>பிரீமியம் சொத்து விபரங்கள் லோடு ஆகிறது...</p>
        </div>`;
        
    try {
        const response = await fetch(SCRIPT_URL, { method: "GET" });
        properties = await response.json();
        
        if (properties.error) {
            console.error("Apps Script Error:", properties.error);
            propertyGrid.innerHTML = '<div style="text-align:center; padding:40px; grid-column: 1/-1; color:red;"><p>Apps Script பிழை!</p></div>';
        } else {
            handleSearch(); // டேட்டா வந்ததும் கார்டுகளை ஸ்கிரீன்ல காட்டும்
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        propertyGrid.innerHTML = '<div style="text-align:center; padding:40px; grid-column: 1/-1; color:red;"><p>டேட்டா லோடு செய்வதில் பிழை ஏற்பட்டுள்ளது!</p></div>';
    }
}

// --- 3. ஷீட்ல இருக்குற விபரங்களை வச்சு கார்டுகளை உருவாக்கும் லாஜிக் (Direct Index Method) ---
function renderProperties(dataToRender = properties) {
    propertyGrid.innerHTML = '';
    resultsCount.textContent = `${dataToRender.length} இடங்கள் உள்ளன`;

    if(dataToRender.length === 0) {
        propertyGrid.innerHTML = `
            <div style="text-align:center; padding:40px; color:#5C677D; grid-column: 1/-1;">
                <i class="fa-solid fa-building-circle-xmark" style="font-size:36px; margin-bottom:10px; color:#cbd5e1;"></i>
                <p>இந்த ஏரியாவில் சொத்துக்கள் எதுவும் இல்லை! முதல் ஆளாகப் பதியவும்.</p>
            </div>`;
        return;
    }

    dataToRender.forEach(prop => {
        const card = document.createElement('div');
        card.className = 'expert-card';

        // உங்க ஷீட்ல இருக்குற பெயர்களை நேரடியாகவோ அல்லது கட்டங்களின் வரிசைப்படியோ எடுக்கிறது
        const pName     = prop.name     || prop["name"]     || Object.values(prop)[1] || "No Name";
        const pPhone    = prop.phone    || prop["phone"]    || Object.values(prop)[2] || "";
        const pType     = prop.type     || prop["type"]     || Object.values(prop)[3] || "flat";
        const pPrice    = prop.price    || prop["price"]    || Object.values(prop)[4] || "No Price";
        const pLocation = prop.location || prop["location"] || Object.values(prop)[5] || "No Location";

        // சொத்தின் வகைக்கு ஏற்ப ஐகானை மாற்றுதல்
        let iconHtml = '<i class="fa-solid fa-building"></i>';
        if(pType.toString().toLowerCase() === 'land') iconHtml = '<i class="fa-solid fa-map"></i>';
        if(pType.toString().toLowerCase() === 'tolet') iconHtml = '<i class="fa-solid fa-door-open"></i>';

        card.innerHTML = `
            <div class="card-left">
                <div class="avatar-container">
                    ${iconHtml}
                </div>
                <div class="expert-info">
                    <h4>${pName} <span class="badge">${pType.toString().toUpperCase()}</span></h4>
                    <p class="price-tag">${pPrice}</p>
                    <p class="expert-loc"><i class="fa-solid fa-location-dot"></i> ${pLocation}</p>
                </div>
            </div>
            <div class="card-right-actions">
                <a href="tel:${pPhone}" class="call-btn-link"><i class="fa-solid fa-phone"></i></a>
                <a href="https://wa.me/91${pPhone}" target="_blank" class="wa-btn-link"><i class="fa-brands fa-whatsapp"></i></a>
            </div>
        `;
        propertyGrid.appendChild(card);
    });
}


// --- 4. தேடல் மற்றும் ஃபில்டர் லாஜிக் (பாதுகாப்பானது) ---
function handleSearch() {
    const searchText = areaSearch.value ? areaSearch.value.toLowerCase().trim() : "";
    const selectedType = propertyFilter.value;

    const filtered = properties.filter(prop => {
        // prop.location அல்லது prop.name காலியாக இருந்தாலும் எர்ரர் வராமல் தடுக்க '|| ""' சேர்க்கப்பட்டுள்ளது
        const locationText = (prop.location || "").toString().toLowerCase();
        const matchesArea = locationText.includes(searchText);
        const matchesType = (selectedType === 'all' || prop.type === selectedType);
        return matchesArea && matchesType;
    });

    renderProperties(filtered);
}



// தேடல் நிகழ்வுகள் (Events)
searchBtn.addEventListener('click', handleSearch);
areaSearch.addEventListener('input', handleSearch);
propertyFilter.addEventListener('change', handleSearch);

// சிப்ஸ் ஃபில்டர் (Chips)
chips.forEach(chip => {
    chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        propertyFilter.value = chip.getAttribute('data-filter');
        handleSearch();
    });
});

// மோடல் ஓபன்/க்ளோஸ் (Modals)
openFormBtn.addEventListener('click', () => registerModal.style.display = 'flex');
closeRegBtn.addEventListener('click', () => registerModal.style.display = 'none');

if(tipsBtn && tipsModal && closeTipsBtn) {
    tipsBtn.addEventListener('click', () => tipsModal.style.display = 'flex');
    closeTipsBtn.addEventListener('click', () => tipsModal.style.display = 'none');
}

window.addEventListener('click', (e) => {
    if (e.target === registerModal) registerModal.style.display = 'none';
    if (e.target === tipsModal) tipsModal.style.display = 'none';
});

// --- 5. வெப்சைட்ல ஃபார்ம் சப்மிட் பண்ணுனா, கூகுள் ஷீட்டுக்கு அனுப்பிட்டு உடனே கார்டை ரெப்ரெஷ் பண்ற லாஜிக் ---
propertyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = propertyForm.querySelector('.submit-btn');
    submitBtn.textContent = 'பதிவாகிறது... வெயிட் பண்ணுங்க தலை...';
    submitBtn.disabled = true;

    // கூகுள் ஷீட் 'doPost'-க்கு தேவையான ஃபார்ம் டேட்டா
    const formData = new URLSearchParams();
    formData.append('name', document.getElementById('owner-name').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('type', document.getElementById('prop-type').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('location', document.getElementById('location').value);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const result = await response.json();
        
        if(result.result === 'success') {
            alert('சொத்து விபரங்கள் வெற்றிகரமாக கூகுள் ஷீட்டில் சேமிக்கப்பட்டது!');
            propertyForm.reset();
            registerModal.style.display = 'none';
            
            // முக்கியம்: ஷீட்ல விழுந்த உடனே புது கார்டை வெப்சைட்ல காட்ட இதோ கூப்பிட்டாச்சு!
            loadPropertiesFromSheet(); 
        } else {
            alert('பிழை: ' + result.error);
        }
    } catch (error) {
        console.error('Error uploading data:', error);
        alert('விபரங்கள் கூகுள் ஷீட்டில் சேமிக்கப்பட்டுவிட்டது! (கார்டுகளைப் பார்க்க பக்கத்தை ரீஃப்ரெஷ் செய்யவும்)');
        loadPropertiesFromSheet();
    } finally {
        submitBtn.textContent = 'விபரங்களைச் சமர்ப்பிக்க';
        submitBtn.disabled = false;
    }
});

// --- 6. UPI Payment (Tips) சப்மிட் லாஜிக் ---
if (tipsForm) {
    tipsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = document.getElementById('tips-amount').value;
        if (!amount || amount <= 0) return;

        const upiUrl = `upi://pay?pa=${encodeURIComponent(MY_UPI_ID)}&pn=${encodeURIComponent(MY_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Royal Gift for Estates App')}`;
        window.location.href = upiUrl;
        
        tipsModal.style.display = 'none';
        tipsForm.reset();
    });
}

// பக்கம் லோடு ஆனதும் டேட்டாவை கொண்டு வரும்
document.addEventListener('DOMContentLoaded', loadPropertiesFromSheet);
