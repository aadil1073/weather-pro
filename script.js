const apiKey = '1a09fba8c96cf38d020263f44d7e5c5d';
let useF = false;
window.lastWeatherData = null;
window.lastForecastData = null;

// THEME TOGGLE
document.getElementById('theme-toggle').addEventListener('click', () => {
    const body = document.body;
    body.classList.toggle('light-theme');
    const themeImg = document.getElementById('theme-img');
    if (body.classList.contains('light-theme')) {
        themeImg.src = "https://img.icons8.com/ios-glyphs/28/moon-symbol--v1.png";
    } else {
        themeImg.src = "https://img.icons8.com/ios-filled/28/ffffff/moon-symbol.png";
    }
});

// FAVORITES RENDERING
function renderFavorites() {
    const favs = JSON.parse(localStorage.getItem('favCities') || '[]');
    let html = '';
    if (favs.length) {
        html += '<b style="color:var(--txt-color);font-weight:900;letter-spacing:1.5px;font-size:1.1em">🌍 Favorites: </b>';
        favs.forEach(city => {
            const safeCity = city.replace(/"/g, '&quot;');
            html += `
        <span class="favorite-pair">
          <button class="favorite-btn" data-city="${safeCity}" tabindex="0">${city}</button>
          <button class="remove-favorite-btn" data-city="${safeCity}" title="Remove ${city}" aria-label="Remove ${city}">&times;</button>
        </span>`;
        });
    }
    html += `<button class="add-favorite-btn" title="Save current city">+ Add</button>`;
    document.getElementById('favorites').innerHTML = html;
}
renderFavorites();

// FAVORITES EVENT HANDLER (Event delegation)
document.getElementById('favorites').addEventListener('click', e => {
    if (e.target.classList.contains('favorite-btn')) {
        useFavorite(e.target.dataset.city);
    } else if (e.target.classList.contains('add-favorite-btn')) {
        addFavorite();
    } else if (e.target.classList.contains('remove-favorite-btn')) {
        removeFavorite(e.target.dataset.city);
    }
});

function useFavorite(city) {
    document.getElementById('city').value = city;
    getWeather();
}

function addFavorite() {
    const city = document.getElementById('city').value.trim();
    if (!city) {
        alert('Type a city first!');
        return;
    }
    let favs = JSON.parse(localStorage.getItem('favCities') || '[]');
    if (!favs.includes(city)) {
        favs.push(city);
        localStorage.setItem('favCities', JSON.stringify(favs));
        renderFavorites();
    }
}

function removeFavorite(city) {
    let favs = JSON.parse(localStorage.getItem('favCities') || '[]');
    favs = favs.filter(c => c !== city);
    localStorage.setItem('favCities', JSON.stringify(favs));
    renderFavorites();
}

// TEMPERATURE UNIT TOGGLE
document.getElementById('unit-switch').addEventListener('change', function () {
    useF = this.checked;
    if (window.lastWeatherData) displayWeather(window.lastWeatherData, true);
    if (window.lastForecastData) displayHourlyForecast(window.lastForecastData, true);
});
function renderTemp(kelvin) {
    let c = Math.round(kelvin - 273.15);
    if (!useF) return `${c}°C`;
    let f = Math.round((kelvin - 273.15) * 9 / 5 + 32);
    return `${f}°F`;
}

// GEOLOCATION BUTTON
document.getElementById('get-location-btn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Location not supported");
        return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
        getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    }, () => alert("Permission denied or error fetching your location."));
});

function getWeatherByCoords(lat, lon) {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    fetch(currentUrl)
        .then(r => r.json())
        .then(displayWeather)
        .catch(() => alert('Error fetching current weather (geo).'));
    fetch(forecastUrl)
        .then(r => r.json())
        .then(data => displayHourlyForecast(data.list))
        .catch(() => alert('Error fetching forecast (geo).'));
}

// SEARCH BY CITY
document.getElementById('search-btn').addEventListener('click', getWeather);
document.getElementById('city').addEventListener('keypress', e => {
    if (e.key === 'Enter') getWeather();
});
function getWeather() {
    const city = document.getElementById('city').value.trim();
    if (!city) {
        alert('Please enter a city');
        return;
    }
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}`;
    fetch(currentUrl)
        .then(r => r.json())
        .then(displayWeather)
        .catch(() => alert('Error fetching current weather data.'));
    fetch(forecastUrl)
        .then(r => r.json())
        .then(data => displayHourlyForecast(data.list))
        .catch(() => alert('Error fetching hourly forecast data.'));
}

// DISPLAY WEATHER
function displayWeather(data, triggeredByToggle = false) {
    window.lastWeatherData = data;
    const tempDiv = document.getElementById('temp-div');
    const weatherInfoDiv = document.getElementById('weather-info');
    const weatherIcon = document.getElementById('weather-icon');
    const hourlyForecastDiv = document.getElementById('hourly-forecast');
    const extraDiv = document.getElementById('extra-info');

    tempDiv.innerHTML = '';
    weatherInfoDiv.innerHTML = '';
    if (!triggeredByToggle) hourlyForecastDiv.innerHTML = '';
    weatherIcon.style.display = 'none';
    if (!triggeredByToggle) extraDiv.innerHTML = '';

    if (data.cod === '404' || data.cod === 404) {
        weatherInfoDiv.innerHTML = `<span style="color:crimson">${data.message}</span>`;
        tempDiv.innerHTML = '';
        extraDiv.innerHTML = '';
        return;
    }

    const cityName = data.name;
    const temperature = renderTemp(data.main.temp);
    const description = data.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    tempDiv.innerHTML = `<p>${temperature}</p>`;
    weatherInfoDiv.innerHTML = `<div>${cityName}</div><div>${description}</div>`;
    weatherIcon.src = iconUrl;
    weatherIcon.alt = description;
    weatherIcon.style.display = 'block';

    extraDiv.innerHTML = `
    <div style="display:flex;justify-content:space-around;color:var(--txt-color);font-size:1.1rem;">
      <span>🌡️ Feels: ${renderTemp(data.main.feels_like)}</span>
      <span>💧 ${data.main.humidity}%</span>
      <span title="Wind Speed">🌬️ ${Math.round(data.wind.speed)} m/s</span>
    </div>
  `;
}

// DISPLAY HOURLY FORECAST
function displayHourlyForecast(hourlyData, triggeredByToggle = false) {
    if (!Array.isArray(hourlyData)) return;
    window.lastForecastData = hourlyData;
    const hourlyForecastDiv = document.getElementById('hourly-forecast');
    if (!triggeredByToggle) hourlyForecastDiv.innerHTML = '';
    const next8 = hourlyData.slice(0, 8);

    next8.forEach(item => {
        const dateTime = new Date(item.dt * 1000);
        let hr = dateTime.getHours();
        const ampm = hr >= 12 ? 'PM' : 'AM';
        hr = hr % 12 || 12;

        const temperature = renderTemp(item.main.temp);
        const iconCode = item.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

        const hourlyItemHtml = `
      <div class="hourly-item">
        <div>${hr} ${ampm}</div>
        <img src="${iconUrl}" alt="Hourly Icon" />
        <div>${temperature}</div>
      </div>
    `;
        hourlyForecastDiv.innerHTML += hourlyItemHtml;
    });
}
