/*
  scripts.js — HBnB Part 4
  =========================
  - Task 1 : Login JWT -> cookie -> redirection
  - Task 2 : Index — liste places + filtre prix (10, 50, 100, All)
  - Task 3 : Place details — infos, amenities, reviews
  - Task 4 : Add Review (page standalone add_review.html)
  - BONUS  : Add Place (page add_place.html)

  API Flask : http://127.0.0.1:5000/api/v1
*/

const API_URL = 'http://127.0.0.1:5000/api/v1';

// ============================================================
// UTILITIES
// ============================================================

/**
 * Get a cookie value by its name.
 */
function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [key, val] = cookie.split('=');
        if (key === name) return val;
    }
    return null;
}

/**
 * Extract ?id=<uuid> from the URL query string.
 */
function getPlaceIdFromURL() {
    return new URLSearchParams(window.location.search).get('id');
}

/**
 * Check authentication and toggle login link visibility.
 * - No token  -> show "Login" link
 * - Has token -> show "Logout" link
 */
function checkAuthentication() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');

    if (loginLink) {
        if (!token) {
            loginLink.textContent = 'Login';
            loginLink.className = 'login-button';
            loginLink.href = 'login.html';
            loginLink.onclick = null;
            loginLink.style.display = 'block';
        } else {
            loginLink.textContent = 'Logout';
            loginLink.className = 'login-button';
            loginLink.href = '#';
            loginLink.style.display = 'block';
            loginLink.onclick = (e) => {
                e.preventDefault();
                document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                window.location.href = 'index.html';
            };
        }
    }

    return token;
}

// ============================================================
// TASK 1 — LOGIN
// ============================================================

/**
 * POST /api/v1/auth/login
 * Success -> store JWT token in cookie, redirect to index.html
 * Failure -> display error message
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
            document.cookie = `token=${data.access_token}; path=/`;
            window.location.href = 'index.html';
        } else {
            const errorDiv = document.getElementById('login-error');
            if (errorDiv) {
                errorDiv.textContent = 'Login failed: ' + response.statusText;
                errorDiv.style.display = 'block';
            }
        }
    } catch (error) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = 'Cannot reach the API. Is the server running?';
            errorDiv.style.display = 'block';
        }
    }
}

// ============================================================
// TASK 2 — INDEX (places list)
// ============================================================

/**
 * Populate the price filter dropdown.
 * Options: 10, 50, 100, All (as required by specs).
 */
function setupPriceFilter() {
    const select = document.getElementById('price-filter');
    if (!select) return;
    [
        { value: '10',  label: '10' },
        { value: '50',  label: '50' },
        { value: '100', label: '100' },
        { value: 'all', label: 'All' }
    ].forEach(({ value, label }) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (value === 'all') opt.selected = true;
        select.appendChild(opt);
    });
}

/**
 * GET /api/v1/places/
 * Fetch all places from the API.
 * Token is optional (public endpoint).
 */
async function fetchPlaces(token) {
    const list = document.getElementById('places-list');
    if (!list) return;

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
        const res = await fetch(`${API_URL}/places/`, { headers });
        if (res.ok) {
            const places = await res.json();
            displayPlaces(places);
        } else {
            list.innerHTML = '<p class="no-places-msg">Unable to load places.</p>';
        }
    } catch (error) {
        list.innerHTML = '<p class="no-places-msg">Cannot reach the API.</p>';
    }
}

/**
 * Create place-card elements and append to #places-list.
 * Each card has: title, price per night, View Details button.
 */
function displayPlaces(places) {
    const list = document.getElementById('places-list');
    if (!list) return;
    list.innerHTML = '';

    if (places.length === 0) {
        list.innerHTML = '<p class="no-places-msg">No places available.</p>';
        return;
    }

    places.forEach(place => {
        const card = document.createElement('div');
        card.className = 'place-card';
        card.dataset.price = place.price;

        card.innerHTML = `
            <h2>${place.title}</h2>
            <p class="price-tag">Price per night: $${place.price}</p>
            <a href="place.html?id=${place.id}" class="details-button">View Details</a>
        `;
        list.appendChild(card);
    });
}

/**
 * Client-side filter: show/hide place cards based on selected max price.
 * Uses element.style.display to toggle visibility without page reload.
 */
function applyFilters() {
    const maxPrice = document.getElementById('price-filter')?.value || 'all';
    const cards = document.querySelectorAll('.place-card');

    cards.forEach(card => {
        const priceOk = maxPrice === 'all' || parseFloat(card.dataset.price) <= parseFloat(maxPrice);
        card.style.display = priceOk ? '' : 'none';
    });
}

// ============================================================
// TASK 3 — PLACE DETAILS
// ============================================================

/**
 * Check auth and control add-review section visibility.
 * - Authenticated   -> show #add-review
 * - Not authenticated -> hide #add-review
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

/**
 * GET /api/v1/places/:id and GET /api/v1/places/:id/reviews
 * Fetch place details + reviews in parallel.
 */
async function fetchPlaceDetails(token, placeId) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
        const [placeRes, reviewsRes] = await Promise.all([
            fetch(`${API_URL}/places/${placeId}`, { headers }),
            fetch(`${API_URL}/places/${placeId}/reviews`, { headers })
        ]);

        if (!placeRes.ok) {
            const s = document.getElementById('place-details');
            if (s) s.innerHTML = '<p>Place not found.</p>';
            return;
        }

        const place = await placeRes.json();
        const reviews = reviewsRes.ok ? await reviewsRes.json() : [];
        displayPlaceDetails(place, reviews);
    } catch (error) {
        const s = document.getElementById('place-details');
        if (s) s.innerHTML = '<p>Cannot reach the API.</p>';
    }
}

/**
 * Fetch a user's name by their ID.
 * Returns "first_name last_name" or "Guest" on failure.
 */
async function fetchUserName(userId) {
    try {
        const res = await fetch(`${API_URL}/users/${userId}`);
        if (res.ok) {
            const user = await res.json();
            return `${user.first_name} ${user.last_name}`;
        }
    } catch (error) {
        /* ignore */
    }
    return 'Guest';
}

/**
 * Populate #place-details and #reviews sections.
 * Shows: name, host, price, description, amenities, reviews.
 * Fetches user names for each review via /users/:id.
 */
async function displayPlaceDetails(place, reviews) {
    const detailsSection = document.getElementById('place-details');
    const reviewsSection = document.getElementById('reviews');
    if (!detailsSection) return;

    document.title = `HBnB — ${place.title}`;

    const ownerName = place.owner
        ? `${place.owner.first_name} ${place.owner.last_name}`
        : 'Unknown host';

    const amenitiesText = place.amenities?.length
        ? place.amenities.map(a => a.name).join(', ')
        : 'None listed';

    detailsSection.innerHTML = `
        <h1>${place.title}</h1>
        <div class="place-info">
            <p><strong>Host:</strong> ${ownerName}</p>
            <p><strong>Price per night:</strong> $${place.price}</p>
            <p><strong>Description:</strong> ${place.description || 'No description provided.'}</p>
            <p><strong>Amenities:</strong> ${amenitiesText}</p>
        </div>
    `;

    if (reviewsSection) {
        reviewsSection.innerHTML = '<h2>Reviews</h2>';
        if (reviews.length === 0) {
            reviewsSection.innerHTML += '<p>No reviews yet.</p>';
        } else {
            /* Fetch all user names in parallel */
            const userNames = await Promise.all(
                reviews.map(r => fetchUserName(r.user_id))
            );

            reviews.forEach((r, i) => {
                const stars = '\u2605'.repeat(r.rating) + '\u2606'.repeat(5 - r.rating);
                const card = document.createElement('div');
                card.className = 'review-card';
                card.innerHTML = `
                    <p class="reviewer-name"><strong>${userNames[i]}:</strong></p>
                    <p class="review-text">${r.text}</p>
                    <p class="stars">Rating: ${stars}</p>
                `;
                reviewsSection.appendChild(card);
            });
        }
    }

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) reviewForm.dataset.placeId = place.id;
}

// ============================================================
// TASK 4 — ADD REVIEW
// ============================================================

/**
 * POST /api/v1/reviews/
 * Submit a review for a place.
 */
async function submitReview(token, placeId, reviewText, rating) {
    return fetch(`${API_URL}/reviews/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            text: reviewText,
            rating: parseInt(rating, 10),
            place_id: placeId
        })
    });
}

/**
 * Handle the API response after submitting a review.
 */
async function handleReviewResponse(response, form) {
    if (response.ok) {
        alert('Review submitted successfully!');
        if (form) form.reset();
        window.location.href = 'index.html';
    } else {
        alert('Failed to submit review');
    }
}

/**
 * Load the place title for the standalone add_review.html page.
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
    } catch (error) {
        titleEl.textContent = 'Reviewing a Place';
    }
}

// ============================================================
// BONUS — ADD PLACE
// ============================================================

async function loadAmenitiesCheckboxes(token) {
    const container = document.getElementById('amenities-list');
    if (!container) return;

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
        const res = await fetch(`${API_URL}/amenities/`, { headers });
        if (!res.ok) {
            container.innerHTML = '<span>Could not load amenities.</span>';
            return;
        }
        const amenities = await res.json();

        if (amenities.length === 0) {
            container.innerHTML = '<span>No amenities available.</span>';
            return;
        }

        container.innerHTML = '';
        amenities.forEach(amenity => {
            const label = document.createElement('label');
            label.className = 'amenity-checkbox-label';
            label.innerHTML = `
                <input type="checkbox" name="amenities" value="${amenity.id}">
                <span class="amenity-checkbox-text">${amenity.name}</span>
            `;
            container.appendChild(label);
        });
    } catch (error) {
        container.innerHTML = '<span>Cannot load amenities.</span>';
    }
}

async function submitPlace(token, placeData) {
    return fetch(`${API_URL}/places/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(placeData)
    });
}

async function handleAddPlaceResponse(response, form) {
    if (response.ok) {
        const place = await response.json();
        alert('Place created successfully!');
        if (form) form.reset();
        window.location.href = `place.html?id=${place.id}`;
    } else {
        alert('Failed to create place.');
    }
}

// ============================================================
// DOM READY — entry point
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    /* Check authentication on every page (show/hide login link) */
    const token = checkAuthentication();

    // -- TASK 1 : login.html --
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        if (token) {
            window.location.href = 'index.html';
            return;
        }
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            await loginUser(email, password);
        });
    }

    // -- TASK 2 : index.html --
    if (document.getElementById('places-list')) {
        setupPriceFilter();
        fetchPlaces(token);

        document.getElementById('price-filter').addEventListener('change', (event) => {
            applyFilters();
        });
    }

    // -- TASK 3 : place.html --
    if (document.getElementById('place-details')) {
        const placeId = getPlaceIdFromURL();
        checkAuthForPlacePage(placeId);

        const inlineForm = document.getElementById('review-form');
        if (inlineForm) {
            inlineForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const currentToken = getCookie('token');
                const pid = inlineForm.dataset.placeId || placeId;
                const text = document.getElementById('review-text').value.trim();
                const rating = document.getElementById('rating').value;

                if (!currentToken || !text || !rating) return;

                const res = await submitReview(currentToken, pid, text, rating);
                await handleReviewResponse(res, inlineForm);
            });
        }
    }

    // -- TASK 4 : add_review.html (standalone page) --
    const reviewPageForm = document.getElementById('review-form');
    const isAddReviewPage = reviewPageForm
        && !document.getElementById('places-list')
        && !document.getElementById('place-details')
        && !document.getElementById('add-place-form');

    if (isAddReviewPage) {
        const placeId = getPlaceIdFromURL();

        /* Redirect unauthenticated users to index */
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        loadPlaceTitleForReviewPage(placeId, token);

        reviewPageForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const reviewText = document.getElementById('review').value.trim();
            const rating = document.getElementById('rating').value;

            if (!reviewText || !rating) return;

            const res = await submitReview(token, placeId, reviewText, rating);
            await handleReviewResponse(res, reviewPageForm);
        });
    }

    // -- BONUS : add_place.html --
    const addPlaceForm = document.getElementById('add-place-form');
    if (addPlaceForm) {
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        loadAmenitiesCheckboxes(token);

        addPlaceForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const title = document.getElementById('place-title').value.trim();
            const description = document.getElementById('place-description').value.trim();
            const price = parseFloat(document.getElementById('place-price').value);
            const latitude = parseFloat(document.getElementById('place-latitude').value);
            const longitude = parseFloat(document.getElementById('place-longitude').value);

            const amenities = Array.from(
                addPlaceForm.querySelectorAll('input[name="amenities"]:checked')
            ).map(cb => cb.value);

            if (!title || !price || price <= 0) return;
            if (isNaN(latitude) || latitude < -90 || latitude > 90) return;
            if (isNaN(longitude) || longitude < -180 || longitude > 180) return;

            const placeData = { title, description, price, latitude, longitude, amenities };

            const submitBtn = addPlaceForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Publishing...';
            }

            try {
                const res = await submitPlace(token, placeData);
                await handleAddPlaceResponse(res, addPlaceForm);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Publish My Place';
                }
            }
        });
    }

});
