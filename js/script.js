// 1. DATA
const carData = {
    "Acura": ["ILX", "Integra", "MDX", "RDX", "TLX"],
    "Audi": ["A3", "A4", "A5", "A6", "Q3", "Q5", "Q7", "Q8", "e-tron"],
    "BMW": ["3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "M3", "M4"],
    "Chevrolet": ["Blazer", "Camaro", "Colorado", "Corvette", "Equinox", "Malibu", "Silverado 1500", "Silverado 2500", "Suburban", "Tahoe", "Traverse"],
    "Ford": ["Bronco", "Edge", "Escape", "Explorer", "F-150", "F-250", "Mustang", "Ranger", "Maverick"],
    "Honda": ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot", "Ridgeline"],
    "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Wrangler", "Wagoneer"],
    "Lexus": ["ES", "GX", "IS", "LS", "LX", "NX", "RX", "UX"],
    "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "CLA", "GLA", "GLC", "GLE", "GLS", "G-Class"],
    "Nissan": ["Altima", "Armada", "Frontier", "Kicks", "Maxima", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan"],
    "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
    "Toyota": ["4Runner", "Camry", "Corolla", "Highlander", "Prius", "RAV4", "Sequoia", "Sienna", "Tacoma", "Tundra"]
};

// 2. SERVICE DATABASE (UPDATED TEXT)
const serviceDetails = {
    // --- WASH & INTERIOR ---
    "Exterior": {
        title: "Maintenance Wash", 
        price: "$60.00+", 
        duration: "1hr",
        shortDesc: "PH neutral wash, deionized water, spray wax, tire shine."
    },
    "Interior": {
        title: "Maintenance Interior Detail", 
        price: "$150.00+", 
        duration: "2.5hr",
        shortDesc: "Deep vacuum, steam cleaning, plastics scrubbed."
    },
    "Full": {
        title: "Full Interior Detail", 
        price: "$250.00+", 
        duration: "4hr+",
        shortDesc: "Shampoo, extraction, leather conditioning."
    },

    // --- CERAMIC SEALANTS & WAX ---
    "3Month": {
        title: "3-Month Ceramic Sealant", 
        price: "$175.00+", 
        duration: "2hr",
        shortDesc: "Clay bar treatment + 3-month SiO2 sealant."
    },
    "6Month": {
        title: "6-Month Hybrid SiO2 Wax", 
        price: "$250.00+", 
        duration: "2.5hr",
        shortDesc: "Deep rich gloss, water beading, chemical decontamination."
    },
    "PolishWax": {
        title: "Polish & Wax (6 Month)", 
        price: "$325.00+", 
        duration: "4hr",
        shortDesc: "Paint enhancement polish to remove swirls + 6-month protection."
    },

    // --- LONG TERM CERAMIC COATINGS ---
    "1Year": {
        title: "1 Year Ceramic Coating", 
        price: "$600.00+", 
        duration: "1 Day",
        shortDesc: "Full polish + 1 year ceramic coating."
    },
    "3Year": {
        title: "3 Year Ceramic Coating", 
        price: "$800.00+", 
        duration: "1-2 Days",
        shortDesc: "Deep swirl correction + 3 year coating + Wheel coating."
    },
    "6Year": {
        title: "6 Year Ceramic Coating", 
        price: "$1200.00+", 
        duration: "2-3 Days",
        shortDesc: "Ultimate protection. Paint, Wheels, and Windows coated."
    },

    // --- ADD-ONS / SPECIALTY ---
    "Headlight": {
        title: "Headlight Restoration", 
        price: "$125.00+", 
        duration: "1hr",
        shortDesc: "Sanding & polishing. UV sealant."
    },
    "Engine": {
        title: "Engine Bay Cleaning", 
        price: "$100.00+", 
        duration: "1hr",
        shortDesc: "Degrease and dress engine bay."
    },
    "Windshield": {
        title: "Windshield Ceramic Coating", 
        price: "$100.00+", 
        duration: "45m",
        shortDesc: "Hydrophobic layer for glass."
    },
    "Tint": {
        title: "Window Tinting", 
        price: "Call for Price", 
        duration: "Varies",
        shortDesc: "Professional window tinting."
    },
    "Audio": {
        title: "Car Audio/Screen", 
        price: "Call for Price", 
        duration: "Varies",
        shortDesc: "Screen replacement."
    },
    "Wrap": {
        title: "Car Wrapping", 
        price: "Call for Price", 
        duration: "Varies",
        shortDesc: "Full color change or vinyl."
    },
    "Upholstery": {
        title: "Upholstery Repair", 
        price: "Call for Price", 
        duration: "Varies",
        shortDesc: "Repair rips and tears."
    }
};

let currentServiceSelection = "";

function isValidPhoneNumber(phone) {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

function setFieldState(input, messageEl, message) {
    const hasError = Boolean(message);
    if (input) {
        input.classList.toggle('is-invalid', hasError);
        input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    }
    if (messageEl) {
        messageEl.textContent = message;
    }
}

function clearQuoteFormFeedback() {
    const fields = [
        { input: document.getElementById('quote-name'), messageEl: document.getElementById('name-error') },
        { input: document.getElementById('quote-phone'), messageEl: document.getElementById('phone-error') },
        { input: document.getElementById('quote-service'), messageEl: document.getElementById('service-error') }
    ];

    fields.forEach(function(field) {
        setFieldState(field.input, field.messageEl, '');
    });

    const status = document.getElementById('quote-form-status');
    if (status) {
        status.textContent = '';
        status.classList.remove('has-error');
    }
}

function handleQuoteFormSubmit(event) {
    event.preventDefault();

    const nameInput = document.getElementById('quote-name');
    const phoneInput = document.getElementById('quote-phone');
    const serviceSelect = document.getElementById('quote-service');
    const nameError = document.getElementById('name-error');
    const phoneError = document.getElementById('phone-error');
    const serviceError = document.getElementById('service-error');
    const status = document.getElementById('quote-form-status');

    let isFormValid = true;

    clearQuoteFormFeedback();

    if (!nameInput.value.trim()) {
        setFieldState(nameInput, nameError, 'Please enter your name.');
        isFormValid = false;
    }

    if (!isValidPhoneNumber(phoneInput.value.trim())) {
        setFieldState(phoneInput, phoneError, 'Please enter a valid phone number.');
        isFormValid = false;
    }

    if (!serviceSelect.value) {
        setFieldState(serviceSelect, serviceError, 'Please select a service.');
        isFormValid = false;
    }

    if (!isFormValid) {
        if (status) {
            status.textContent = 'Please fix the highlighted fields and try again.';
            status.classList.add('has-error');
        }
        return;
    }

    if (status) {
        status.textContent = "We'll get back to you within 30 minutes!";
        status.classList.remove('has-error');
    }

    event.target.reset();
}

// 3. PAGE LOAD
window.onload = function() {
    const makeSelect = document.getElementById('vehicleMake');
    if(makeSelect) {
        const sortedMakes = Object.keys(carData).sort();
        for (let i = 0; i < sortedMakes.length; i++) {
            let make = sortedMakes[i];
            let option = document.createElement("option");
            option.value = make;
            option.text = make;
            makeSelect.appendChild(option);
        }
    }
};

// 4. LOGIC
function updateModels() {
    const makeSelect = document.getElementById('vehicleMake');
    const modelSelect = document.getElementById('vehicleModel');
    modelSelect.innerHTML = '<option value="" disabled selected>Select model</option>';
    const selectedMake = makeSelect.value;
    const models = carData[selectedMake];
    if (models) {
        models.sort();
        models.forEach(function(model) {
            let option = document.createElement("option");
            option.value = model;
            option.text = model;
            modelSelect.appendChild(option);
        });
    }
    disableContinue();
}

function enableContinue() {
    const btn = document.getElementById('btnContinueDetails');
    btn.disabled = false;
    btn.classList.remove('btn-disabled');
    btn.classList.add('btn-primary');
}

function disableContinue() {
    const btn = document.getElementById('btnContinueDetails');
    btn.disabled = true;
    btn.classList.add('btn-disabled');
    btn.classList.remove('btn-primary');
}

function switchSection(id) {
    const sections = ['login-section', 'vehicle-grid-section', 'vehicle-details-section', 'service-menu-section', 'condition-section', 'final-service-section', 'contact-info-section'];
    sections.forEach(sec => {
        const el = document.getElementById(sec);
        if(el) el.style.display = 'none';
    });
    const target = document.getElementById(id);
    if(target) {
        target.style.display = 'block';
        window.scrollTo(0, 0);
    }
}

function goToGrid() { switchSection('vehicle-grid-section'); }
function goToLogin() { switchSection('login-section'); }
function backToGrid() { switchSection('vehicle-grid-section'); }
function goToDetails(vehicleType) { switchSection('vehicle-details-section'); }
function goToServices() { switchSection('service-menu-section'); }
function backToDetails() { switchSection('vehicle-details-section'); }
function backToServices() { switchSection('service-menu-section'); }
function goToContactInfo() { switchSection('contact-info-section'); }
function backFromContact() { switchSection('final-service-section'); }

function handleServiceClick(type) {
    currentServiceSelection = type; 
    const needsCondition = ['Interior', 'Full', '3Month', '1Year', '3Year', '6Year'];
    if (needsCondition.includes(type)) {
        switchSection('condition-section');
    } else {
        populateFinalCard(type);
        switchSection('final-service-section');
    }
}

function selectCondition(type, isYes, btnElement) {
    if (type === 'stains') document.getElementById('warn-stains').style.display = isYes ? 'block' : 'none';
    if (type === 'hair') document.getElementById('warn-hair').style.display = isYes ? 'block' : 'none';
    btnElement.parentNode.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
}

function submitCondition() {
    populateFinalCard(currentServiceSelection);
    switchSection('final-service-section');
}

function populateFinalCard(type) {
    const data = serviceDetails[type];
    if(!data) return;
    document.getElementById('final-service-title').innerText = data.title;
    document.getElementById('card-service-name').innerText = data.title;
    document.getElementById('card-price').innerText = data.price;
    document.getElementById('footer-price').innerText = data.price;
    document.getElementById('card-duration').innerText = data.duration;

    // Get HTML from template in booking.html
    const descTemplate = document.getElementById('desc-' + type);
    document.getElementById('card-desc-short').innerHTML = descTemplate ? descTemplate.innerHTML : '';
    document.getElementById('modal-full-text').innerHTML = descTemplate ? descTemplate.innerHTML : '';
}

function backFromFinal() {
    const needsCondition = ['Interior', 'Full', '3Month', '1Year', '3Year', '6Year'];
    if (needsCondition.includes(currentServiceSelection)) {
        switchSection('condition-section');
    } else {
        switchSection('service-menu-section');
    }
}

function openDetailsModal() { document.getElementById('details-modal').style.display = 'flex'; }
function closeDetailsModal() { document.getElementById('details-modal').style.display = 'none'; }

// Mobile hamburger menu: toggle `.nav-links.active` when `#mobile-menu` is clicked
document.addEventListener('DOMContentLoaded', function () {
    // Toggle handler for one or more #mobile-menu buttons (present on multiple pages)
    document.querySelectorAll('#mobile-menu').forEach(function(toggle) {
        toggle.addEventListener('click', function () {
            const navbar = toggle.closest('.navbar') || document.querySelector('.navbar');
            if (!navbar) return;
            const links = navbar.querySelector('.nav-links');
            if (!links) return;
            links.classList.toggle('active');
        });
    });

    // Close mobile menu when a nav link is clicked (prevents it staying open)
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        link.addEventListener('click', function () {
            const navbar = link.closest('.navbar') || document.querySelector('.navbar');
            if (!navbar) return;
            const links = navbar.querySelector('.nav-links');
            if (!links) return;
            if (links.classList.contains('active')) links.classList.remove('active');
        });
    });

    const quoteForm = document.getElementById('quote-form');
    if (quoteForm) {
        quoteForm.addEventListener('submit', handleQuoteFormSubmit);
    }
});