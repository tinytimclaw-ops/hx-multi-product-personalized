// Airport data with coordinates for distance calculation
const AIRPORTS = {
  'LHR': { name: 'London Heathrow', lat: 51.4700, lng: -0.4543, region: 'London' },
  'LGW': { name: 'London Gatwick', lat: 51.1537, lng: -0.1821, region: 'London' },
  'STN': { name: 'London Stansted', lat: 51.8860, lng: 0.2389, region: 'London' },
  'LTN': { name: 'London Luton', lat: 51.8747, lng: -0.3683, region: 'London' },
  'LCY': { name: 'London City', lat: 51.5048, lng: 0.0495, region: 'London' },
  'MAN': { name: 'Manchester', lat: 53.3537, lng: -2.2750, region: 'North West' },
  'BHX': { name: 'Birmingham', lat: 52.4539, lng: -1.7481, region: 'Midlands' },
  'EDI': { name: 'Edinburgh', lat: 55.9500, lng: -3.3725, region: 'Scotland' },
  'GLA': { name: 'Glasgow', lat: 55.8719, lng: -4.4331, region: 'Scotland' },
  'BRS': { name: 'Bristol', lat: 51.3827, lng: -2.7191, region: 'South West' },
  'NCL': { name: 'Newcastle', lat: 55.0375, lng: -1.6919, region: 'North East' },
  'EMA': { name: 'East Midlands', lat: 52.8311, lng: -1.3278, region: 'Midlands' },
  'LBA': { name: 'Leeds Bradford', lat: 53.8659, lng: -1.6606, region: 'Yorkshire' },
  'ABZ': { name: 'Aberdeen', lat: 57.2020, lng: -2.1979, region: 'Scotland' },
  'BFS': { name: 'Belfast', lat: 54.6575, lng: -6.2158, region: 'Northern Ireland' },
  'SOU': { name: 'Southampton', lat: 50.9503, lng: -1.3568, region: 'South' },
  'CWL': { name: 'Cardiff', lat: 51.3968, lng: -3.3433, region: 'Wales' },
  'EXT': { name: 'Exeter', lat: 50.7344, lng: -3.4139, region: 'South West' },
  'INV': { name: 'Inverness', lat: 57.5425, lng: -4.0475, region: 'Scotland' },
  'DSA': { name: 'Doncaster Sheffield', lat: 53.4747, lng: -1.0047, region: 'Yorkshire' }
};

// User location data
let userLocation = null;
let nearestAirports = [];
let currentProduct = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  detectUserLocation();
});

// Detect user location via IP geolocation
async function detectUserLocation() {
  const locationCard = document.getElementById('locationCard');

  try {
    const response = await fetch('https://ipinfo.io/json');
    const data = await response.json();

    // Parse lat/lng from "loc" field (format: "lat,lng")
    const [lat, lng] = data.loc ? data.loc.split(',').map(Number) : [null, null];

    if (!lat || !lng) {
      throw new Error('Geolocation failed');
    }

    userLocation = {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country || 'Unknown',
      lat: lat,
      lng: lng
    };

    // Calculate nearest airports
    nearestAirports = calculateNearestAirports(userLocation.lat, userLocation.lng);

    // Update UI
    locationCard.innerHTML = `
      <div class="status-success">
        <span class="status-icon">📍</span>
        <span>Showing airports nearest to ${userLocation.city}, ${userLocation.region}</span>
      </div>
    `;

    // Update product recommendations
    updateProductRecommendations();

  } catch (error) {
    console.error('Location detection failed:', error);

    // Fallback: use default London location
    userLocation = {
      city: 'London',
      region: 'England',
      country: 'United Kingdom',
      lat: 51.5074,
      lng: -0.1278
    };

    nearestAirports = calculateNearestAirports(userLocation.lat, userLocation.lng);

    locationCard.innerHTML = `
      <div class="status-success">
        <span class="status-icon">🌍</span>
        <span>Showing all UK airports (enable location for personalized results)</span>
      </div>
    `;

    updateProductRecommendations();
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate nearest airports sorted by distance
function calculateNearestAirports(userLat, userLng) {
  const airportsWithDistance = Object.entries(AIRPORTS).map(([code, airport]) => ({
    code,
    ...airport,
    distance: calculateDistance(userLat, userLng, airport.lat, airport.lng)
  }));

  return airportsWithDistance.sort((a, b) => a.distance - b.distance);
}

// Update product recommendations based on location and time
function updateProductRecommendations() {
  const now = new Date();
  const month = now.getMonth();
  const isHolidaySeason = (month >= 5 && month <= 8) || (month === 11 || month === 0); // Jun-Sep, Dec-Jan

  // Parking badge
  const parkingBadge = document.getElementById('parkingBadge');
  if (nearestAirports[0] && nearestAirports[0].distance < 50) { // 50 km = ~31 miles
    parkingBadge.textContent = `${nearestAirports[0].name} nearby`;
    parkingBadge.classList.add('nearby');
  } else {
    parkingBadge.textContent = 'Save up to 60%';
    parkingBadge.classList.add('popular');
  }

  // Hotel + Parking badge (recommended during holiday season)
  const hotelParkingBadge = document.getElementById('hotelParkingBadge');
  if (isHolidaySeason) {
    hotelParkingBadge.textContent = 'Perfect for holidays';
  } else {
    hotelParkingBadge.textContent = 'Most popular';
  }

  // Lounge badge
  const loungeBadge = document.getElementById('loungeBadge');
  loungeBadge.textContent = 'Relax before you fly';
  loungeBadge.classList.add('popular');

  // Hotel badge
  const hotelBadge = document.getElementById('hotelBadge');
  hotelBadge.textContent = 'Perfect for early flights';
  hotelBadge.classList.add('nearby');
}

// Show product form
function showProductForm(product) {
  currentProduct = product;

  const searchSection = document.getElementById('searchSection');
  const searchTitle = document.getElementById('searchTitle');
  const dateFields = document.getElementById('dateFields');
  const passengerFields = document.getElementById('passengerFields');

  // Scroll to form
  searchSection.style.display = 'block';
  searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Update title
  const titles = {
    'parking': 'Search Airport Parking',
    'hotel-parking': 'Search Hotel + Parking Packages',
    'lounge': 'Search Airport Lounges',
    'hotel': 'Search Airport Hotels'
  };
  searchTitle.textContent = titles[product];

  // Populate airport dropdown (nearest first)
  populateAirportDropdown();

  // Configure form fields based on product
  if (product === 'parking') {
    dateFields.innerHTML = `
      <div class="form-group">
        <label for="outDate" class="form-label">Drop-off date</label>
        <input type="date" id="outDate" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="outTime" class="form-label">Drop-off time</label>
        <select id="outTime" class="form-control" required>
          ${generateTimeOptions('06:00')}
        </select>
      </div>
      <div class="form-group">
        <label for="inDate" class="form-label">Collection date</label>
        <input type="date" id="inDate" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="inTime" class="form-label">Collection time</label>
        <select id="inTime" class="form-control" required>
          ${generateTimeOptions('12:00')}
        </select>
      </div>
    `;
    passengerFields.style.display = 'none';
    initializeParkingDates();
  } else if (product === 'hotel-parking') {
    dateFields.innerHTML = `
      <div class="form-group">
        <label for="checkIn" class="form-label">Check-in date (night before flight)</label>
        <input type="date" id="checkIn" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="flightDate" class="form-label">Flight date</label>
        <input type="date" id="flightDate" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="returnDate" class="form-label">Return date</label>
        <input type="date" id="returnDate" class="form-control" required>
      </div>
    `;
    passengerFields.style.display = 'none';
    initializeHotelParkingDates();
  } else if (product === 'lounge') {
    dateFields.innerHTML = `
      <div class="form-group">
        <label for="outDate" class="form-label">Departure date</label>
        <input type="date" id="outDate" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="outTime" class="form-label">Flight time</label>
        <select id="outTime" class="form-control" required>
          ${generateTimeOptions('10:00')}
        </select>
      </div>
    `;
    passengerFields.style.display = 'grid';
    initializeLoungeDates();
  } else if (product === 'hotel') {
    dateFields.innerHTML = `
      <div class="form-group">
        <label for="checkIn" class="form-label">Check-in date</label>
        <input type="date" id="checkIn" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="checkOut" class="form-label">Check-out date</label>
        <input type="date" id="checkOut" class="form-control" required>
      </div>
    `;
    passengerFields.style.display = 'none';
    initializeHotelDates();
  }

  // Setup form submission
  const form = document.getElementById('searchForm');
  form.onsubmit = (e) => {
    e.preventDefault();
    submitSearch(product);
  };
}

// Hide product form
function hideProductForm() {
  const searchSection = document.getElementById('searchSection');
  searchSection.style.display = 'none';

  // Scroll back to products
  document.querySelector('.products').scrollIntoView({ behavior: 'smooth' });
}

// Populate airport dropdown with nearest airports first
function populateAirportDropdown() {
  const airportSelect = document.getElementById('airport');
  const airportHint = document.getElementById('airportHint');

  airportSelect.innerHTML = nearestAirports.map(airport => {
    const distanceMiles = airport.distance * 0.621371; // Convert km to miles
    return `<option value="${airport.code}">${airport.name}${distanceMiles < 62 ? ' (' + Math.round(distanceMiles) + ' miles away)' : ''}</option>`;
  }).join('');

  if (nearestAirports[0]) {
    airportHint.textContent = `${nearestAirports[0].name} is your nearest airport`;
  }
}

// Generate time options for select
function generateTimeOptions(defaultTime) {
  const times = [];
  for (let h = 0; h < 24; h++) {
    const hour = h.toString().padStart(2, '0');
    const timeStr = `${hour}:00`;
    const selected = timeStr === defaultTime ? ' selected' : '';
    times.push(`<option value="${hour}%3A00"${selected}>${timeStr}</option>`);
  }
  return times.join('');
}

// Date initialization functions
function datePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function initializeParkingDates() {
  const outDateInput = document.getElementById('outDate');
  const inDateInput = document.getElementById('inDate');

  outDateInput.value = datePlus(1);
  inDateInput.value = datePlus(9);
  outDateInput.setAttribute('min', datePlus(0));

  // Auto-recalculate return date when outbound changes
  outDateInput.addEventListener('change', () => {
    const outDate = new Date(outDateInput.value);
    outDate.setDate(outDate.getDate() + 8);
    inDateInput.value = outDate.toISOString().split('T')[0];
  });
}

function initializeHotelParkingDates() {
  const checkInInput = document.getElementById('checkIn');
  const flightDateInput = document.getElementById('flightDate');
  const returnDateInput = document.getElementById('returnDate');

  checkInInput.value = datePlus(1);
  flightDateInput.value = datePlus(2);
  returnDateInput.value = datePlus(9);
  checkInInput.setAttribute('min', datePlus(0));

  checkInInput.addEventListener('change', () => {
    const checkIn = new Date(checkInInput.value);
    checkIn.setDate(checkIn.getDate() + 1);
    flightDateInput.value = checkIn.toISOString().split('T')[0];
  });
}

function initializeLoungeDates() {
  const outDateInput = document.getElementById('outDate');
  outDateInput.value = datePlus(1);
  outDateInput.setAttribute('min', datePlus(0));
}

function initializeHotelDates() {
  const checkInInput = document.getElementById('checkIn');
  const checkOutInput = document.getElementById('checkOut');

  checkInInput.value = datePlus(1);
  checkOutInput.value = datePlus(2);
  checkInInput.setAttribute('min', datePlus(0));

  checkInInput.addEventListener('change', () => {
    const checkIn = new Date(checkInInput.value);
    checkIn.setDate(checkIn.getDate() + 1);
    checkOutInput.value = checkIn.toISOString().split('T')[0];
  });
}

// Submit search and redirect to appropriate product page
function submitSearch(product) {
  const airport = document.getElementById('airport').value;

  if (product === 'parking') {
    const outDate = document.getElementById('outDate').value;
    const outTime = document.getElementById('outTime').value;
    const inDate = document.getElementById('inDate').value;
    const inTime = document.getElementById('inTime').value;

    const url = `https://www.holidayextras.com/static/?selectProduct=cp&#/categories|carpark?agent=WY992&ppts=&customer_ref=&lang=en&adults=2&depart=${airport}&terminal=&arrive=&flight=default&in=${inDate}&out=${outDate}&park_from=${outTime}&park_to=${inTime}&filter_meetandgreet=&filter_parkandride=&children=0&infants=0&redirectReferal=carpark&from_categories=true&adcode=&promotionCode=`;

    window.location.href = url;

  } else if (product === 'hotel-parking') {
    const checkIn = document.getElementById('checkIn').value;
    const flightDate = document.getElementById('flightDate').value;
    const returnDate = document.getElementById('returnDate').value;

    const url = `https://www.holidayextras.com/static/?selectProduct=pah&#/categories|pah?agent=WY992&lang=en&adults=2&depart=${airport}&terminal=&arrive=&flight=default&in=${returnDate}&out=${checkIn}&check_out=${flightDate}&park_from=06%3A00&park_to=12%3A00&children=0&infants=0&from_categories=true&adcode=&promotionCode=`;

    window.location.href = url;

  } else if (product === 'lounge') {
    const outDate = document.getElementById('outDate').value;
    const outTime = document.getElementById('outTime').value;
    const adults = document.getElementById('adults').value;
    const children = document.getElementById('children').value;
    const infants = document.getElementById('infants').value;

    const url = `https://www.holidayextras.com/static/?selectProduct=lou&#/categories|lou?agent=WY992&lang=en&adults=${adults}&depart=${airport}&in=${outDate}&out=${outDate}&depart_time=${outTime}&children=${children}&infants=${infants}&from_categories=true&adcode=&promotionCode=`;

    window.location.href = url;

  } else if (product === 'hotel') {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;

    const url = `https://www.holidayextras.com/static/?selectProduct=hol&#/categories|hol?agent=WY992&lang=en&adults=2&depart=${airport}&in=${checkOut}&out=${checkIn}&children=0&infants=0&from_categories=true&adcode=&promotionCode=`;

    window.location.href = url;
  }
}
