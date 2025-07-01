document.getElementById("submitBtn").addEventListener("click", getLocation);
document.getElementById("locationInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        getLocation();
    }
});

const API_KEY = "f23ee9deb4e1a7450f3157c44ed020e1";

function getLocation() {
    const location = document.getElementById("locationInput").value;

    if (!location) {
        createAlert("Please enter a location", 2000);
        return;
    }

    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`)
        .then((response) => response.json())
        .then((responseObj) => {
            const lat = responseObj[0].lat;
            const lon = responseObj[0].lon;
            getWeather(lat, lon);
        })
        .catch((error) => createAlert("Unable to find any data for this location.", 2000));
}

function getWeather(lat, lon) {
    console.log(`${lat}, ${lon}`);

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
        .then((response) => response.json())
        .then((responseObj) => updateWeather(responseObj))
        .catch((error) => console.error("Fetch error: ", error));
}

function updateWeather(obj) {
    console.log(obj);

    const date = new Date();
    document.getElementById("currentTime").textContent = `${date.getHours()}:${date.getMinutes()}`;
    document.getElementById("currentTemperature").textContent = `${obj.main.temp}\u00B0C`;
    document.getElementById("weatherSummary").textContent = obj.weather[0].main;
    document.getElementById("feelsLikeTemperature").textContent = `Feels like ${obj.main.feels_like}\u00B0C`;
    document.getElementById("weatherDescription").textContent = `${obj.weather[0].description}. The high will be ${obj.main.temp_max}\u00B0C`;
    document.getElementById("windSpeed").textContent = `${Number.parseFloat(obj.wind.speed).toFixed(1)} km/h`;
    document.getElementById("humidity").textContent = `${obj.main.humidity}%`;
    document.getElementById("visibility").textContent = `${Number.parseFloat(obj.visibility/1000).toFixed(1)}km`;
    document.getElementById("pressure").textContent = `${obj.main.pressure}hPa`;
}

function createAlert(text, delayMs) {
    const alert = document.createElement("div");
    alert.className = "erroralert";
    alert.innerHTML = `${text}`;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.classList.add('hide');
        setTimeout(() => document.body.removeChild(alert), 150);
    }, delayMs);
}