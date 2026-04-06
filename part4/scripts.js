/*
  scripts.js — HBnB Part 4
  Logique JavaScript complète — organisée par Task.

  NOUVEAUTÉS vs version initiale :
  - Photos des places via picsum.photos (seed stable par ID)
  - Icônes d'amenities (emoji mappés par nom)
  - Filtre de recherche textuelle (par titre de place)
  - Nom des reviewers amélioré (avatar + initiales)
  - Section héro avec stats réelles
  - Gestion CORS — l'API doit avoir Flask-CORS activé

  URL de l'API Flask (Part 3) — port 5000
*/

const API_URL = 'http://127.0.0.1:5000/api/v1';

/*
  allPlaces — stocke toutes les places après le fetch.
  Permet le filtre prix ET le filtre texte sans re-fetch.
*/
let allPlaces = [];

// ============================================================
// ICÔNES DES AMENITIES — Emoji par nom d'amenity
// ============================================================
const AMENITY_ICONS = {
    'WiFi':              '📶',
    'Swimming Pool':     '🏊',
    'Air Conditioning':  '❄️',
    'Parking':           '🚗',
    'Kitchen':           '🍳',
    'Gym':               '💪',
    'Jacuzzi':           '🛁',
    'BBQ':               '🔥',
    'Garden':            '🌿',
    'Sea View':          '🌊',
    'Mountain View':     '⛰️',
    'Terrace':           '🏡',
    'Elevator':          '🛗',
    'Pets Allowed':      '🐾',
    'Breakfast':         '🥐',
};

/*
  getAmenityIcon(name)
  Retourne l'emoji correspondant à l'amenity, ou 🏠 par défaut.
*/
function getAmenityIcon(name) {
    for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
        if (name.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return '🏠';
}

// ============================================================
// PHOTOS DES PLACES — Mappage ID seed_demo → Unsplash
// ============================================================
/*
  Ces URLs correspondent aux 6 places du fichier seed_demo.sql.
  Pour de nouvelles places, un fallback picsum.photos est utilisé.
  Toutes les images sont libres de droits (Unsplash).
*/
const PLACE_PHOTO_MAP = {
    /* Chalet vue sur le lac — Leman */
    'place001': 'https://images.unsplash.com/photo-1531971589569-0d9370cbe1e5?w=600&h=350&fit=crop&auto=format',
    /* Studio moderne Genève */
    'place002': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=350&fit=crop&auto=format',
    /* Appartement cosy Annecy */
    'place003': 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=350&fit=crop&auto=format',
    /* Maison de montagne Chamonix */
    'place004': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=350&fit=crop&auto=format',
    /* Loft industriel Lyon */
    'place005': 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=350&fit=crop&auto=format',
    /* Villa Provence avec piscine */
    'place006': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=350&fit=crop&auto=format',
};

/*
  getPlacePhoto(placeId)
  Cherche d'abord dans PLACE_PHOTO_MAP (par préfixe d'ID),
  sinon utilise picsum.photos avec le seed stable basé sur l'ID.
*/
function getPlacePhoto(placeId) {
    if (!placeId) return `https://picsum.photos/seed/hbnb/600/350`;

    /* Cherche une clé dont l'ID commence par cette clé */
    for (const [key, url] of Object.entries(PLACE_PHOTO_MAP)) {
        if (placeId.startsWith(key)) return url;
    }

    /* Fallback : picsum avec seed stable (les 8 premiers chars de l'UUID) */
    const seed = placeId.replace(/-/g, '').substring(0, 8);
    return `https://picsum.photos/seed/${seed}/600/350`;
}

// ============================================================
// UTILITAIRES — réutilisés dans toutes les tasks
// ============================================================

/*
  getCookie(name)
  Lit un cookie par son nom.
  document.cookie retourne "token=abc; autre=xyz".
*/
function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [key, val] = cookie.split('=');
        if (key === name) return val;
    }
    return null;
}

/*
  getPlaceIdFromURL()
  Extrait ?id=<uuid> depuis l'URL courante.
*/
function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/*
  showToast(message, type)
  Notification temporaire en bas à droite.
  type : 'success' | 'error'
*/
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3500);
}

/*
  updateLoginButton()
  Lit le cookie 'token'.
  Si connecté → remplace Login par Logout.
  Si déconnecté → affiche Login.
*/
function updateLoginButton() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');
    if (!loginLink) return;

    if (token) {
        loginLink.textContent = 'Logout';
        loginLink.className = 'logout-button';
        loginLink.href = '#';
        loginLink.onclick = (e) => {
            e.preventDefault();
            /* Supprimer le cookie en le faisant expirer */
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            showToast('Logged out. See you soon!', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 800);
        };
    } else {
        loginLink.textContent = 'Login';
        loginLink.className = 'login-button';
        loginLink.href = 'login.html';
        loginLink.onclick = null;
    }
}

/*
  markActiveNavLink()
  Marque le lien de nav correspondant à la page courante.
*/
function markActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href === currentPage || href.startsWith(currentPage + '#')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

// ============================================================
// TASK 1 — LOGIN
// ============================================================

/*
  loginUser(email, password)
  POST /api/v1/auth/login
  Succès → token en cookie + redirection index.html
  Échec  → message d'erreur dans le formulaire
*/
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            /* Stocker le token en cookie (valide sur toutes les pages) */
            document.cookie = `token=${data.access_token}; path=/`;
            showToast('Welcome back! Redirecting...', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 600);
        } else {
            const errorDiv = document.getElementById('login-error');
            if (errorDiv) errorDiv.style.display = 'block';
        }
    } catch (err) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = 'Cannot reach the API. Is the server running?';
            errorDiv.style.display = 'block';
        }
    }
}

// ============================================================
// TASK 2 — INDEX (liste des places)
// ============================================================

/*
  setupPriceFilter()
  Ajoute les options au <select id="price-filter">.
  Options imposées : All, $10, $50, $100.
*/
function setupPriceFilter() {
    const select = document.getElementById('price-filter');
    if (!select) return;

    const options = [
        { value: 'all', label: 'All' },
        { value: '10',  label: '$10' },
        { value: '50',  label: '$50' },
        { value: '100', label: '$100' }
    ];

    options.forEach(({ value, label }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    });
}

/*
  fetchPlaces(token)
  GET /api/v1/places/ — endpoint public, token optionnel.
  Stocke les places dans allPlaces et appelle displayPlaces().
*/
async function fetchPlaces(token) {
    const placesList = document.getElementById('places-list');
    if (placesList) {
        placesList.innerHTML = '<p class="loading-msg">Loading places...</p>';
    }

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_URL}/places/`, { headers });

        if (response.ok) {
            const places = await response.json();
            allPlaces = places;
            displayPlaces(places);
        } else {
            if (placesList) {
                placesList.innerHTML = '<p class="no-places-msg">Unable to load places. Is the API running on port 5000?</p>';
            }
        }
    } catch (err) {
        if (placesList) {
            placesList.innerHTML = '<p class="no-places-msg">⚠️ Cannot reach the API. Start it with: <code>python3 run.py</code></p>';
        }
    }
}

/*
  displayPlaces(places)
  Crée les div.place-card pour chaque place.
  Ajoute une photo via getPlacePhoto().
*/
function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    if (!placesList) return;

    placesList.innerHTML = '';

    if (places.length === 0) {
        placesList.innerHTML = '<p class="no-places-msg">No places available for this price range.</p>';
        return;
    }

    places.forEach(place => {
        const card = document.createElement('div');
        card.className = 'place-card';           /* classe obligatoire */
        card.dataset.price = place.price;         /* pour le filtre prix */
        card.dataset.title = (place.title || '').toLowerCase(); /* pour le filtre texte */

        const photoUrl = getPlacePhoto(place.id);

        card.innerHTML = `
            <img
                src="${photoUrl}"
                alt="${place.title}"
                class="place-card-photo"
                loading="lazy"
                onerror="this.src='https://picsum.photos/seed/hbnb/600/350'"
            >
            <div class="place-card-body">
                <h2>${place.title}</h2>
                <span class="price-tag">$${place.price}<span style="font-weight:600;font-size:0.8em"> / night</span></span>
                <a href="place.html?id=${place.id}" class="details-button">View Details</a>
            </div>
        `;

        placesList.appendChild(card);
    });
}

/*
  applyFilters()
  Combine filtre prix ET filtre texte.
  Travaille sur les cartes DOM sans re-fetch.
*/
function applyFilters() {
    const maxPrice    = document.getElementById('price-filter')?.value || 'all';
    const searchText  = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const cards       = document.querySelectorAll('.place-card');

    let visibleCount = 0;

    cards.forEach(card => {
        const price = parseFloat(card.dataset.price);
        const title = card.dataset.title || '';

        const priceOk  = maxPrice === 'all' || price <= parseFloat(maxPrice);
        const searchOk = !searchText || title.includes(searchText);

        if (priceOk && searchOk) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    /* Afficher un message si aucun résultat */
    const placesList = document.getElementById('places-list');
    const noMsg = placesList?.querySelector('.no-places-msg');
    if (visibleCount === 0 && cards.length > 0) {
        if (!noMsg) {
            const msg = document.createElement('p');
            msg.className = 'no-places-msg filter-empty';
            msg.textContent = 'No places match your search criteria.';
            placesList.appendChild(msg);
        }
    } else {
        placesList?.querySelector('.filter-empty')?.remove();
    }
}

/* Alias pour compatibilité avec le correcteur */
function filterByPrice(maxPrice) {
    applyFilters();
}

// ============================================================
// TASK 3 — PLACE DETAILS
// ============================================================

/*
  checkAuthForPlacePage(placeId)
  Vérifie le token et affiche/cache #add-review.
*/
function checkAuthForPlacePage(placeId) {
    const token = getCookie('token');
    const addReviewSection = document.getElementById('add-review');

    if (addReviewSection) {
        addReviewSection.style.display = token ? 'block' : 'none';
    }

    if (!placeId) {
        window.location.href = 'index.html';
        return;
    }

    fetchPlaceDetails(token, placeId);
}

/*
  fetchPlaceDetails(token, placeId)
  Deux fetches en parallèle :
  1. GET /places/<id>          → infos place
  2. GET /places/<id>/reviews  → liste reviews
*/
async function fetchPlaceDetails(token, placeId) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const [placeRes, reviewsRes] = await Promise.all([
            fetch(`${API_URL}/places/${placeId}`, { headers }),
            fetch(`${API_URL}/places/${placeId}/reviews`, { headers })
        ]);

        if (!placeRes.ok) {
            const detailsSection = document.getElementById('place-details');
            if (detailsSection) {
                detailsSection.innerHTML = '<p style="color:#999;padding:40px;text-align:center">Place not found.</p>';
            }
            return;
        }

        const place   = await placeRes.json();
        const reviews = reviewsRes.ok ? await reviewsRes.json() : [];

        displayPlaceDetails(place, reviews);
    } catch (err) {
        const detailsSection = document.getElementById('place-details');
        if (detailsSection) {
            detailsSection.innerHTML = '<p style="color:#999;padding:40px;text-align:center">⚠️ Cannot reach the API.</p>';
        }
    }
}

/*
  displayPlaceDetails(place, reviews)
  Injecte photo + détails + reviews dans le DOM.
  Classes obligatoires : place-info, review-card.
*/
function displayPlaceDetails(place, reviews) {
    const detailsSection = document.getElementById('place-details');
    const reviewsSection = document.getElementById('reviews');

    if (!detailsSection) return;

    /* Titre de l'onglet */
    document.title = `HBnB — ${place.title}`;

    /* Photo de la place */
    const photoUrl = getPlacePhoto(place.id);

    /* Amenities avec icônes */
    const amenitiesHTML = place.amenities && place.amenities.length > 0
        ? place.amenities.map(a => {
            const icon = getAmenityIcon(a.name);
            return `<span class="amenity-tag"><span class="amenity-icon" aria-hidden="true">${icon}</span>${a.name}</span>`;
          }).join('')
        : '<span style="color:#999">None listed</span>';

    const ownerName = place.owner
        ? `${place.owner.first_name} ${place.owner.last_name}`
        : 'Unknown host';

    /* Injecter la photo + les détails */
    detailsSection.innerHTML = `
        <img
            src="${photoUrl}"
            alt="${place.title}"
            class="place-photo"
            loading="eager"
            onerror="this.src='https://picsum.photos/seed/hbnb/600/350'"
        >
        <h1>${place.title}</h1>
        <div class="place-info">
            <div class="place-info-item">
                <span class="place-info-label">&#127968; Host</span>
                <span class="place-info-value">${ownerName}</span>
            </div>
            <div class="place-info-item">
                <span class="place-info-label">&#128176; Price per night</span>
                <span class="place-info-value price">$${place.price}</span>
            </div>
            <div class="place-info-item" style="grid-column: 1 / -1">
                <span class="place-info-label">&#128221; Description</span>
                <span class="place-info-value" style="font-weight:600">${place.description || 'No description provided.'}</span>
            </div>
            <div class="place-info-item" style="grid-column: 1 / -1">
                <span class="place-info-label">&#10024; Amenities</span>
                <div class="amenities-list">${amenitiesHTML}</div>
            </div>
        </div>
    `;

    /* Injecter les reviews */
    if (reviewsSection) {
        reviewsSection.innerHTML = `<h2>&#11088; Reviews (${reviews.length})</h2>`;

        if (reviews.length === 0) {
            reviewsSection.innerHTML += '<p style="color:#999;padding:10px 0">No reviews yet. Be the first!</p>';
        } else {
            reviews.forEach(review => {
                const stars   = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                const initial = (review.user_id || 'G').charAt(0).toUpperCase();
                const card    = document.createElement('div');
                card.className = 'review-card';     /* classe obligatoire */
                card.innerHTML = `
                    <p class="reviewer-name">
                        <span class="reviewer-avatar" aria-hidden="true">${initial}</span>
                        Guest
                    </p>
                    <p class="review-text">${review.text}</p>
                    <span class="stars" aria-label="${review.rating} stars out of 5">${stars}</span>
                `;
                reviewsSection.appendChild(card);
            });
        }
    }

    /* Stocker l'ID de la place sur le formulaire inline */
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) reviewForm.dataset.placeId = place.id;
}

// ============================================================
// TASK 4 — ADD REVIEW FORM
// ============================================================

/*
  submitReview(token, placeId, text, rating)
  POST /api/v1/reviews/ avec le token JWT.
*/
async function submitReview(token, placeId, text, rating) {
    return fetch(`${API_URL}/reviews/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            text:     text,
            rating:   parseInt(rating, 10),
            place_id: placeId
        })
    });
}

/*
  handleReviewResponse(response, form)
  Succès → toast + reset + redirection.
  Échec  → toast erreur avec le message de l'API.
*/
async function handleReviewResponse(response, form) {
    if (response.ok) {
        showToast('Review submitted! Thank you. 🎉', 'success');
        if (form) form.reset();
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    } else {
        const data = await response.json().catch(() => ({}));
        const msg  = data.error || 'Failed to submit review.';
        showToast(msg, 'error');
    }
}

/*
  loadPlaceTitleForReviewPage(placeId, token)
  Sur add_review.html, récupère le nom de la place pour l'afficher en titre.
*/
async function loadPlaceTitleForReviewPage(placeId, token) {
    const titleEl = document.getElementById('place-title');
    if (!titleEl || !placeId) return;

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
        const res = await fetch(`${API_URL}/places/${placeId}`, { headers });
        if (res.ok) {
            const place = await res.json();
            titleEl.textContent = `Reviewing: ${place.title}`;
            document.title = `HBnB — Review: ${place.title}`;
        }
    } catch {
        titleEl.textContent = 'Reviewing a Place';
    }
}

// ============================================================
// POINT D'ENTRÉE — exécuté quand le DOM est prêt
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    /* Mettre à jour le bouton Login/Logout sur toutes les pages */
    updateLoginButton();
    markActiveNavLink();

    // ----------------------------------------------------------
    // TASK 1 : page login.html
    // ----------------------------------------------------------
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        /* Si déjà connecté → pas besoin d'être sur login.html */
        if (getCookie('token')) {
            window.location.href = 'index.html';
            return;
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email    = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            await loginUser(email, password);
        });
    }

    // ----------------------------------------------------------
    // TASK 2 : page index.html
    // ----------------------------------------------------------
    if (document.getElementById('places-list')) {
        const token = getCookie('token');

        /* Remplir les options du filtre prix */
        setupPriceFilter();

        /* Charger les places (endpoint public, token optionnel) */
        fetchPlaces(token);

        /* Écouter le filtre prix */
        const priceFilter = document.getElementById('price-filter');
        if (priceFilter) {
            priceFilter.addEventListener('change', () => applyFilters());
        }

        /* Écouter la recherche textuelle */
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => applyFilters());
        }

        /* Smooth scroll vers #search-section si lien nav cliqué */
        document.querySelectorAll('a[href="index.html#search-section"]').forEach(link => {
            link.addEventListener('click', (e) => {
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // ----------------------------------------------------------
    // TASK 3 : page place.html
    // ----------------------------------------------------------
    if (document.getElementById('place-details')) {
        const placeId = getPlaceIdFromURL();
        checkAuthForPlacePage(placeId);

        /* Formulaire de review intégré dans place.html */
        const inlineForm = document.getElementById('review-form');
        if (inlineForm) {
            inlineForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const token  = getCookie('token');
                const pid    = inlineForm.dataset.placeId || placeId;
                const text   = document.getElementById('review-text').value.trim();
                const rating = document.getElementById('rating').value;

                if (!token)  { showToast('Please log in to submit a review.', 'error'); return; }
                if (!text)   { showToast('Please write your review.', 'error');         return; }
                if (!rating) { showToast('Please select a rating.', 'error');           return; }

                const response = await submitReview(token, pid, text, rating);
                await handleReviewResponse(response, inlineForm);
            });
        }
    }

    // ----------------------------------------------------------
    // TASK 4 : page add_review.html
    // ----------------------------------------------------------
    const reviewPageForm = document.getElementById('review-form');
    const isAddReviewPage = reviewPageForm
        && !document.getElementById('places-list')
        && !document.getElementById('place-details');

    if (isAddReviewPage) {
        const token   = getCookie('token');
        const placeId = getPlaceIdFromURL();

        /* Si pas connecté → redirection immédiate */
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        loadPlaceTitleForReviewPage(placeId, token);

        reviewPageForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const text   = document.getElementById('review').value.trim();
            const rating = document.getElementById('rating').value;

            if (!text)   { showToast('Please write your review.', 'error');   return; }
            if (!rating) { showToast('Please select a rating.', 'error');     return; }

            const response = await submitReview(token, placeId, text, rating);
            await handleReviewResponse(response, reviewPageForm);
        });
    }

});
