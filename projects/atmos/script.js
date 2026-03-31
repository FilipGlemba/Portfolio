const apiBasePath = "/api";
const defaultCity = "Bratislava";
const themeStorageKey = "atmos-theme";
const unitStorageKey = "atmos-unit";
const recentSearchesKey = "atmos-recent-searches";
const maxRecentSearches = 5;

const elements = {
  body: document.body,
  html: document.documentElement,
  form: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  locationBtn: document.getElementById("locationBtn"),
  suggestions: document.getElementById("suggestions"),
  quickActions: document.getElementById("quickActions"),
  recentSearches: document.getElementById("recentSearches"),
  themeToggle: document.getElementById("themeToggle"),
  unitToggle: document.getElementById("unitToggle"),
  weatherHeading: document.getElementById("weatherHeading"),
  statusBadge: document.getElementById("statusBadge"),
  message: document.getElementById("message"),
  cityName: document.getElementById("cityName"),
  description: document.getElementById("description"),
  updatedAt: document.getElementById("updatedAt"),
  weatherIcon: document.getElementById("weatherIcon"),
  temp: document.getElementById("temp"),
  feelsLike: document.getElementById("feelsLike"),
  tempRange: document.getElementById("tempRange"),
  weatherMain: document.getElementById("weatherMain"),
  clouds: document.getElementById("clouds"),
  airQuality: document.getElementById("airQuality"),
  weatherSummary: document.getElementById("weatherSummary"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  pressure: document.getElementById("pressure"),
  visibility: document.getElementById("visibility"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  hourlyForecast: document.getElementById("hourlyForecast"),
  dailyForecast: document.getElementById("dailyForecast")
};

const state = {
  unit: localStorage.getItem(unitStorageKey) || "metric",
  suggestionResults: [],
  activeSuggestionIndex: -1,
  suggestionRequestId: 0,
  suggestionDebounceId: undefined,
  lastQuery: defaultCity,
  currentData: null,
  forecastData: null,
  airQualityIndex: null
};

function setTheme(theme) {
  elements.html.dataset.theme = theme;
  elements.themeToggle.setAttribute("aria-pressed", String(theme === "light"));
  localStorage.setItem(themeStorageKey, theme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey);
  const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  setTheme(savedTheme || (systemPrefersLight ? "light" : "dark"));
}

function setUnit(unit) {
  state.unit = unit;
  elements.body.dataset.unit = unit;
  elements.unitToggle.setAttribute("aria-pressed", String(unit === "imperial"));
  localStorage.setItem(unitStorageKey, unit);
}

function initializeUnit() {
  setUnit(state.unit === "imperial" ? "imperial" : "metric");
}

function getTemperatureUnitLabel() {
  return state.unit === "metric" ? "°C" : "°F";
}

function formatTemperature(value) {
  return `${Math.round(value)}${getTemperatureUnitLabel()}`;
}

function formatWind(speed) {
  return state.unit === "metric"
    ? `${Math.round(speed * 3.6)} km/h`
    : `${Math.round(speed)} mph`;
}

function formatVisibility(visibilityMeters) {
  if (state.unit === "metric") {
    return `${(visibilityMeters / 1000).toFixed(1)} km`;
  }

  return `${(visibilityMeters / 1609.34).toFixed(1)} mi`;
}

function formatTime(unixSeconds, timezoneShiftSeconds) {
  const date = new Date((unixSeconds + timezoneShiftSeconds) * 1000);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(date);
}

function formatUpdatedAt(timezoneShiftSeconds) {
  const now = new Date(Date.now() + timezoneShiftSeconds * 1000);
  return `Last update: ${new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(now)}`;
}

function formatDayName(timestampSeconds, timezoneShiftSeconds) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    timeZone: "UTC"
  }).format(new Date((timestampSeconds + timezoneShiftSeconds) * 1000));
}

function formatHourName(timestampSeconds, timezoneShiftSeconds) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date((timestampSeconds + timezoneShiftSeconds) * 1000));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setStatus(stateName, message) {
  elements.body.classList.toggle("is-loading", stateName === "loading");
  elements.body.classList.toggle("is-error", stateName === "error");

  if (stateName === "loading") {
    elements.statusBadge.textContent = "Loading";
  } else if (stateName === "error") {
    elements.statusBadge.textContent = "Error";
  } else {
    elements.statusBadge.textContent = "Ready";
  }

  elements.message.textContent = message;
}

function getRecentSearches() {
  try {
    const parsed = JSON.parse(localStorage.getItem(recentSearchesKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(city) {
  const trimmedCity = city.trim();

  if (!trimmedCity) {
    return;
  }

  const updatedRecentSearches = [
    trimmedCity,
    ...getRecentSearches().filter((item) => item.toLowerCase() !== trimmedCity.toLowerCase())
  ].slice(0, maxRecentSearches);

  localStorage.setItem(recentSearchesKey, JSON.stringify(updatedRecentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  const recentSearches = getRecentSearches();

  if (!recentSearches.length) {
    elements.recentSearches.innerHTML = '<span class="empty-inline">No recent cities yet.</span>';
    return;
  }

  elements.recentSearches.innerHTML = recentSearches
    .map(
      (city) =>
        `<button class="quick-chip" type="button" data-city="${escapeHtml(city)}">${escapeHtml(city)}</button>`
    )
    .join("");
}

function getWeatherIconMarkup(condition, iconCode = "01d", className = "weather-svg") {
  const isNight = iconCode.endsWith("n");
  const stroke = "currentColor";
  const sun = isNight ? "#b6b6ff" : "#ffca70";
  const cloud = isNight ? "#d9dcff" : "#f6f7fb";
  const rain = "#7ab6ff";
  const snow = "#f3fbff";
  const lightning = "#ffd54d";

  const icons = {
    Clear: `<svg class="${className}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="12" fill="${sun}" /><g stroke="${stroke}" stroke-linecap="round" stroke-width="3"><path d="M32 7v8"/><path d="M32 49v8"/><path d="M7 32h8"/><path d="M49 32h8"/><path d="M14.8 14.8l5.6 5.6"/><path d="M43.6 43.6l5.6 5.6"/><path d="M49.2 14.8l-5.6 5.6"/><path d="M20.4 43.6l-5.6 5.6"/></g></svg>`,
    Clouds: `<svg class="${className}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M19 46h27a10 10 0 0 0 0-20 14 14 0 0 0-26.7-2.5A10 10 0 0 0 19 46Z" fill="${cloud}" stroke="${stroke}" stroke-width="2.5"/></svg>`,
    Rain: `<svg class="${className}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M18 39h28a9 9 0 0 0 0-18 13 13 0 0 0-24.8-2.3A9 9 0 0 0 18 39Z" fill="${cloud}" stroke="${stroke}" stroke-width="2.5"/><path d="M24 45l-3 8" stroke="${rain}" stroke-width="3" stroke-linecap="round"/><path d="M34 45l-3 8" stroke="${rain}" stroke-width="3" stroke-linecap="round"/><path d="M44 45l-3 8" stroke="${rain}" stroke-width="3" stroke-linecap="round"/></svg>`,
    Drizzle: `<svg class="${className}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M18 39h28a9 9 0 0 0 0-18 13 13 0 0 0-24.8-2.3A9 9 0 0 0 18 39Z" fill="${cloud}" stroke="${stroke}" stroke-width="2.5"/><path d="M27 45l-2 5" stroke="${rain}" stroke-width="3" stroke-linecap="round"/><path d="M37 45l-2 5" stroke="${rain}" stroke-width="3" stroke-linecap="round"/></svg>`,
    Thunderstorm: `<svg class="${className}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M18 39h28a9 9 0 0 0 0-18 13 13 0 0 0-24.8-2.3A9 9 0 0 0 18 39Z" fill="${cloud}" stroke="${stroke}" stroke-width="2.5"/><path d="M34 41l-6 11h6l-4 10 12-15h-6l4-6Z" fill="${lightning}" stroke="${stroke}" stroke-width="1.5"/></svg>`,
    Snow: `<svg class="${className}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M18 39h28a9 9 0 0 0 0-18 13 13 0 0 0-24.8-2.3A9 9 0 0 0 18 39Z" fill="${cloud}" stroke="${stroke}" stroke-width="2.5"/><g stroke="${snow}" stroke-width="2.8" stroke-linecap="round"><path d="M24 46v8"/><path d="M20 50h8"/><path d="M36 46v8"/><path d="M32 50h8"/><path d="M48 46v8"/><path d="M44 50h8"/></g></svg>`,
    Mist: `<svg class="${className}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M14 24h36" stroke="${cloud}" stroke-width="3" stroke-linecap="round"/><path d="M10 34h44" stroke="${cloud}" stroke-width="3" stroke-linecap="round"/><path d="M18 44h28" stroke="${cloud}" stroke-width="3" stroke-linecap="round"/></svg>`,
    Fog: `<svg class="${className}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M14 24h36" stroke="${cloud}" stroke-width="3" stroke-linecap="round"/><path d="M10 34h44" stroke="${cloud}" stroke-width="3" stroke-linecap="round"/><path d="M18 44h28" stroke="${cloud}" stroke-width="3" stroke-linecap="round"/></svg>`
  };

  return icons[condition] || icons.Clouds;
}

async function apiRequest(endpoint, params) {
  const url = new URL(`${apiBasePath}${endpoint}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function closeSuggestions() {
  state.suggestionResults = [];
  state.activeSuggestionIndex = -1;
  elements.suggestions.classList.remove("is-open");
  elements.suggestions.innerHTML = "";
  elements.cityInput.setAttribute("aria-expanded", "false");
}

function renderSuggestions() {
  if (!state.suggestionResults.length) {
    closeSuggestions();
    return;
  }

  elements.suggestions.innerHTML = state.suggestionResults
    .map((item, index) => {
      const label = [item.name, item.state, item.country].filter(Boolean).join(", ");
      const isActive = index === state.activeSuggestionIndex ? " is-active" : "";
      return `
        <button
          class="suggestion-item${isActive}"
          type="button"
          data-index="${index}"
          role="option"
          aria-selected="${index === state.activeSuggestionIndex}"
        >
          <span class="suggestion-title">${escapeHtml(item.name)}</span>
          <span class="suggestion-subtitle">${escapeHtml(label)}</span>
        </button>
      `;
    })
    .join("");

  elements.suggestions.classList.add("is-open");
  elements.cityInput.setAttribute("aria-expanded", "true");
}

async function fetchSuggestions(query) {
  const trimmedQuery = query.trim();
  const requestId = ++state.suggestionRequestId;

  if (trimmedQuery.length < 2) {
    closeSuggestions();
    return;
  }

  try {
    const data = await apiRequest("/geocode", { q: trimmedQuery, limit: 5 });

    if (requestId !== state.suggestionRequestId) {
      return;
    }

    state.suggestionResults = data;
    state.activeSuggestionIndex = -1;
    renderSuggestions();
  } catch (error) {
    if (requestId === state.suggestionRequestId) {
      closeSuggestions();
    }

    console.error("Suggestion request failed:", error);
  }
}

function queueSuggestions(query) {
  clearTimeout(state.suggestionDebounceId);
  state.suggestionDebounceId = setTimeout(() => {
    fetchSuggestions(query);
  }, 220);
}

function applySuggestion(index) {
  const selectedItem = state.suggestionResults[index];

  if (!selectedItem) {
    return;
  }

  const cityQuery = [selectedItem.name, selectedItem.state, selectedItem.country]
    .filter(Boolean)
    .join(", ");

  elements.cityInput.value = cityQuery;
  closeSuggestions();
  fetchWeatherBundle(cityQuery);
}

function renderAirQuality(index) {
  const labels = {
    1: "Excellent",
    2: "Fair",
    3: "Moderate",
    4: "Poor",
    5: "Very poor"
  };

  elements.airQuality.textContent = labels[index] || "Unavailable";
}

function buildWeatherSummary(data, airQualityIndex) {
  const main = data.weather[0].main.toLowerCase();
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const humidity = data.main.humidity;
  const wind = formatWind(data.wind.speed);
  const visibility = formatVisibility(data.visibility ?? 0);
  const aqiMap = {
    1: "excellent",
    2: "fair",
    3: "moderate",
    4: "poor",
    5: "very poor"
  };
  const air = aqiMap[airQualityIndex] || "unknown";

  return `${temp}${getTemperatureUnitLabel()} with ${main} conditions, feeling like ${feelsLike}${getTemperatureUnitLabel()}. Humidity is at ${humidity}%, wind is ${wind}, visibility reaches ${visibility}, and air quality is ${air}.`;
}

function createLoadingMarkup(cards, lines = 3) {
  return Array.from({ length: cards }, () => {
    const skeletonLines = Array.from({ length: lines }, (_, index) => {
      const widthClass = index === lines - 1 ? "short" : index === 1 ? "medium" : "";
      return `<span class="skeleton-line ${widthClass}"></span>`;
    }).join("");

    return `
      <article class="loading-card">
        <div class="loading-stack">
          <span class="skeleton-icon"></span>
          ${skeletonLines}
        </div>
      </article>
    `;
  }).join("");
}

function renderLoadingState() {
  elements.hourlyForecast.innerHTML = createLoadingMarkup(6, 2);
  elements.dailyForecast.innerHTML = createLoadingMarkup(5, 3);
}

function renderCurrentWeather(data) {
  const weather = data.weather[0];
  elements.body.dataset.weather = weather.main;
  elements.weatherHeading.textContent = `Current weather in ${data.name}`;
  elements.cityName.textContent = `${data.name}, ${data.sys.country}`;
  elements.description.textContent = weather.description;
  elements.updatedAt.textContent = formatUpdatedAt(data.timezone);
  elements.temp.textContent = formatTemperature(data.main.temp);
  elements.feelsLike.textContent = `Feels like ${formatTemperature(data.main.feels_like)}`;
  elements.tempRange.textContent = `H: ${formatTemperature(data.main.temp_max)} / L: ${formatTemperature(data.main.temp_min)}`;
  elements.weatherMain.textContent = weather.main;
  elements.clouds.textContent = `${data.clouds.all}%`;
  elements.humidity.textContent = `${data.main.humidity}%`;
  elements.wind.textContent = formatWind(data.wind.speed);
  elements.pressure.textContent = `${data.main.pressure} hPa`;
  elements.visibility.textContent = formatVisibility(data.visibility ?? 0);
  elements.sunrise.textContent = formatTime(data.sys.sunrise, data.timezone);
  elements.sunset.textContent = formatTime(data.sys.sunset, data.timezone);
  elements.weatherIcon.innerHTML = getWeatherIconMarkup(weather.main, weather.icon, "weather-svg");
  elements.weatherSummary.textContent = buildWeatherSummary(data, state.airQualityIndex);
}

function renderHourlyForecast(forecastList, timezoneShiftSeconds) {
  const upcoming = forecastList.slice(0, 6);

  elements.hourlyForecast.innerHTML = upcoming
    .map(
      (item) => `
        <article class="hour-card">
          <p class="hour-time">${formatHourName(item.dt, timezoneShiftSeconds)}</p>
          <div class="forecast-icon">${getWeatherIconMarkup(item.weather[0].main, item.weather[0].icon, "forecast-svg")}</div>
          <p class="hour-temp">${formatTemperature(item.main.temp)}</p>
          <p class="day-meta">${escapeHtml(item.weather[0].main)}</p>
        </article>
      `
    )
    .join("");
}

function buildDailyForecast(forecastList, timezoneShiftSeconds) {
  const grouped = new Map();

  forecastList.forEach((item) => {
    const shiftedTimestamp = (item.dt + timezoneShiftSeconds) * 1000;
    const dateKey = new Date(shiftedTimestamp).toISOString().slice(0, 10);

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }

    grouped.get(dateKey).push(item);
  });

  return Array.from(grouped.values())
    .slice(0, 5)
    .map((items) => {
      const noonEntry =
        items.find((entry) => entry.dt_txt.includes("12:00:00")) || items[Math.floor(items.length / 2)];
      const min = Math.min(...items.map((entry) => entry.main.temp_min));
      const max = Math.max(...items.map((entry) => entry.main.temp_max));

      return {
        dayName: formatDayName(noonEntry.dt, timezoneShiftSeconds),
        description: noonEntry.weather[0].description,
        main: noonEntry.weather[0].main,
        icon: noonEntry.weather[0].icon,
        min,
        max
      };
    });
}

function renderDailyForecast(forecastList, timezoneShiftSeconds) {
  const dailyItems = buildDailyForecast(forecastList, timezoneShiftSeconds);

  elements.dailyForecast.innerHTML = dailyItems
    .map(
      (item) => `
        <article class="day-card">
          <div class="day-overview">
            <p class="day-name">${escapeHtml(item.dayName)}</p>
            <p>${escapeHtml(item.description)}</p>
          </div>
          <div class="forecast-icon">${getWeatherIconMarkup(item.main, item.icon, "forecast-svg")}</div>
          <p class="day-temp">${formatTemperature(item.max)} / ${formatTemperature(item.min)}</p>
        </article>
      `
    )
    .join("");
}

async function fetchAirQuality(lat, lon) {
  try {
    const data = await apiRequest("/air-quality", { lat, lon });
    return data.list?.[0]?.main?.aqi ?? null;
  } catch (error) {
    console.error("Air quality request failed:", error);
    return null;
  }
}

async function fetchWeatherBundle(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    setStatus("error", "Please enter a city name before searching.");
    elements.cityInput.focus();
    return;
  }

  state.lastQuery = trimmedQuery;
  setStatus("loading", `Loading weather for ${trimmedQuery}...`);
  elements.searchBtn.disabled = true;
  elements.locationBtn.disabled = true;
  closeSuggestions();
  renderLoadingState();

  try {
    const [currentData, forecastData] = await Promise.all([
      apiRequest("/weather", { q: trimmedQuery, units: state.unit, lang: "en" }),
      apiRequest("/forecast", { q: trimmedQuery, units: state.unit, lang: "en" })
    ]);

    state.currentData = currentData;
    state.forecastData = forecastData;
    state.airQualityIndex = await fetchAirQuality(currentData.coord.lat, currentData.coord.lon);

    renderCurrentWeather(currentData);
    renderAirQuality(state.airQualityIndex);
    renderHourlyForecast(forecastData.list, forecastData.city.timezone);
    renderDailyForecast(forecastData.list, forecastData.city.timezone);
    saveRecentSearch(currentData.name);
    setStatus("ready", `Showing live weather and forecast for ${currentData.name}.`);
  } catch (error) {
    setStatus(
      "error",
      error.message === "city not found"
        ? "City not found. Try another search term."
        : "Unable to load weather data right now. Check the city name or your connection."
    );
    console.error("Weather request failed:", error);
  } finally {
    elements.searchBtn.disabled = false;
    elements.locationBtn.disabled = false;
  }
}

async function fetchWeatherByCoordinates(lat, lon) {
  setStatus("loading", "Loading weather for your current location...");
  elements.searchBtn.disabled = true;
  elements.locationBtn.disabled = true;
  renderLoadingState();

  try {
    const [currentData, forecastData] = await Promise.all([
      apiRequest("/weather", { lat, lon, units: state.unit, lang: "en" }),
      apiRequest("/forecast", { lat, lon, units: state.unit, lang: "en" })
    ]);

    state.lastQuery = currentData.name;
    state.currentData = currentData;
    state.forecastData = forecastData;
    state.airQualityIndex = await fetchAirQuality(lat, lon);

    elements.cityInput.value = currentData.name;
    renderCurrentWeather(currentData);
    renderAirQuality(state.airQualityIndex);
    renderHourlyForecast(forecastData.list, forecastData.city.timezone);
    renderDailyForecast(forecastData.list, forecastData.city.timezone);
    saveRecentSearch(currentData.name);
    setStatus("ready", `Showing weather for your location: ${currentData.name}.`);
  } catch (error) {
    setStatus("error", "Unable to load weather for your location right now.");
    console.error("Geolocation weather request failed:", error);
  } finally {
    elements.searchBtn.disabled = false;
    elements.locationBtn.disabled = false;
  }
}

function requestLocationWeather() {
  if (!navigator.geolocation) {
    setStatus("error", "Geolocation is not supported in this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      fetchWeatherByCoordinates(coords.latitude, coords.longitude);
    },
    () => {
      setStatus("error", "Location access was denied. Search for a city instead.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function bindEvents() {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    fetchWeatherBundle(elements.cityInput.value);
  });

  elements.cityInput.addEventListener("input", (event) => {
    queueSuggestions(event.target.value);
  });

  elements.cityInput.addEventListener("keydown", (event) => {
    if (!state.suggestionResults.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.activeSuggestionIndex = (state.activeSuggestionIndex + 1) % state.suggestionResults.length;
      renderSuggestions();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      state.activeSuggestionIndex =
        state.activeSuggestionIndex <= 0
          ? state.suggestionResults.length - 1
          : state.activeSuggestionIndex - 1;
      renderSuggestions();
    }

    if (event.key === "Enter" && state.activeSuggestionIndex >= 0) {
      event.preventDefault();
      applySuggestion(state.activeSuggestionIndex);
    }

    if (event.key === "Escape") {
      closeSuggestions();
    }
  });

  elements.suggestions.addEventListener("click", (event) => {
    const button = event.target.closest(".suggestion-item");

    if (!button) {
      return;
    }

    applySuggestion(Number(button.dataset.index));
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-box")) {
      closeSuggestions();
    }
  });

  [elements.quickActions, elements.recentSearches].forEach((container) => {
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-city]");

      if (!button) {
        return;
      }

      const { city } = button.dataset;
      elements.cityInput.value = city;
      fetchWeatherBundle(city);
    });
  });

  elements.locationBtn.addEventListener("click", () => {
    requestLocationWeather();
  });

  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = elements.html.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });

  elements.unitToggle.addEventListener("click", () => {
    const nextUnit = state.unit === "metric" ? "imperial" : "metric";
    setUnit(nextUnit);
    fetchWeatherBundle(state.lastQuery);
  });
}

function initializeApp() {
  initializeTheme();
  initializeUnit();
  renderRecentSearches();
  bindEvents();
  fetchWeatherBundle(defaultCity);
}

initializeApp();
