// ===== Professional Weather Portal =====
const apiKey = "1fdd09312314cb1182a7b97699a3dd84"; // Replace with your API key

// Elements
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const cityInput = document.getElementById("cityInput");
const unitBtn = document.getElementById("unitBtn");
const modeBtn = document.getElementById("modeBtn");

const weatherBox = document.getElementById("weatherBox");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const weatherIcon = document.getElementById("weatherIcon");

const forecastBox = document.getElementById("forecastBox");
const forecastCards = document.getElementById("forecastCards");

const errorMsg = document.getElementById("errorMsg");
const loader = document.getElementById("loader");

const historySelect = document.getElementById("historySelect");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

let isCelsius = true;

// Helpers
function saveToHistory(city){
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  const cityNorm = city.trim();
  if(cityNorm && !history.includes(cityNorm)){
    history.unshift(cityNorm);
    history = history.slice(0, 10);
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  }
  updateHistoryUI();
}

function updateHistoryUI(){
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  historySelect.innerHTML = '<option value="">Recent searches</option>';
  history.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    historySelect.appendChild(opt);
  });
}

// Data fetching
async function fetchWeather(city){
  if(!city) return;
  setLoading(true);

  try {
    const unit = isCelsius ? "metric" : "imperial";

    // Current
    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${unit}&appid=${apiKey}`);
    if(!currentRes.ok) throw new Error("City not found");
    const current = await currentRes.json();

    // Update current UI
    cityName.textContent = `${current.name}, ${current.sys.country}`;
    temperature.textContent = `🌡 ${current.main.temp.toFixed(1)}°${isCelsius ? "C" : "F"}`;
    description.textContent = `🌥 ${current.weather?.[0]?.description ?? ""}`;
    humidity.textContent = `💧 Humidity: ${current.main.humidity}%`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${current.weather?.[0]?.icon}@2x.png`;
    weatherIcon.alt = current.weather?.[0]?.main ?? "Weather icon";
    weatherBox.classList.remove("hidden");

    // Forecast (7 weekdays)
    const fcRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${unit}&appid=${apiKey}`);
    const fc = await fcRes.json();

    forecastCards.innerHTML = "";
    const seenDays = new Set();
    fc.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const weekday = date.toLocaleDateString(undefined, { weekday: "long" });

      if (!seenDays.has(weekday) && seenDays.size < 7) {
        seenDays.add(weekday);
        const el = document.createElement("div");
        el.className = "forecast-card";
        el.innerHTML = `
          <h4>${weekday}</h4>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" 
               alt="${item.weather[0].main}" width="48" height="48"/>
          <div class="metric">${Math.round(item.main.temp)}°${isCelsius ? "C" : "F"}</div>
        `;
        forecastCards.appendChild(el);
      }
    });
    forecastBox.classList.remove("hidden");

    // History
    saveToHistory(city);
  } catch (e){
    errorMsg.classList.remove("hidden");
    console.error(e);
  } finally {
    setLoading(false);
  }
}

function setLoading(v){
  if(v){ loader.classList.remove("hidden"); }
  else { loader.classList.add("hidden"); }
}

// Events
searchBtn.addEventListener("click", () => fetchWeather(cityInput.value.trim()));
cityInput.addEventListener("keypress", e => { if(e.key === "Enter") fetchWeather(cityInput.value.trim()); });
refreshBtn.addEventListener("click", () => location.reload());

unitBtn.addEventListener("click", () => {
  isCelsius = !isCelsius;
  unitBtn.textContent = isCelsius ? "Switch to °F" : "Switch to °C";
  if(cityName.textContent){
    fetchWeather(cityName.textContent.split(",")[0]);
  }
});

historySelect.addEventListener("change", () => {
  if(historySelect.value) fetchWeather(historySelect.value);
});
clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("weatherHistory");
  updateHistoryUI();
});

// Dark/Light Mode Toggle
modeBtn.addEventListener("click", () => {
  if (document.documentElement.classList.contains("dark")) {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    modeBtn.textContent = "🌙";
  } else {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    modeBtn.textContent = "☀️";
  }
});

// Init theme (system preference)
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.add("light");
}

// Init history
updateHistoryUI();
