document.getElementById("submitBtn").addEventListener("click", getLocation);
document.getElementById("locationInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        getLocation();
    }
});

const API_KEY = "f23ee9deb4e1a7450f3157c44ed020e1";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
        .catch((error) => createAlert("Error fetching weather.", 2000));
}

function updateWeather(obj) {
    console.log("weather data", obj);

    const date = new Date(obj.dt * 1000);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    document.getElementById("currentTime").textContent = `${hours}:${minutes} - ${toTitleCase(document.getElementById("locationInput").value)}`;
    document.getElementById("currentTemperature").textContent = `${Number.parseInt(obj.main.temp)}\u00B0C`;
    document.getElementById("weatherSummary").textContent = obj.weather[0].main;
    document.getElementById("feelsLikeTemperature").textContent = `Feels like ${Number.parseInt(obj.main.feels_like)}\u00B0C`;
    document.getElementById("weatherDescription").textContent = `${toTitleCase(obj.weather[0].description)}. The high will be ${Number.parseInt(obj.main.temp_max)}\u00B0C`;
    document.getElementById("windSpeed").textContent = `${Number.parseFloat(obj.wind.speed).toFixed(1)} km/h`;
    document.getElementById("humidity").textContent = `${obj.main.humidity}%`;
    document.getElementById("visibility").textContent = `${Number.parseFloat(obj.visibility / 1000).toFixed(1)}km`;
    document.getElementById("pressure").textContent = `${obj.main.pressure}hPa`;
    document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${obj.weather[0].icon}@2x.png`;

    getForecast(obj.coord.lat, obj.coord.lon);
}

function getForecast(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
        .then((response) => response.json())
        .then((responseObj) => updateForecast(responseObj))
        .catch((error) => createAlert("Error fetching forecast.", 2000));
}

function updateForecast(obj) {
    console.log("forecast data", obj);

    const forecastChartData = []; //Array where forecastChartData[0] is today, 1 is tomorrow, etc. For charts.
    const forecastData = []; //Like chart data but recording data used for the daily summary

    let i = 0; //Start at 0
    let lastDay = new Date().getDate();
    forecastChartData[0] = [];
    forecastData[0] = [];
    obj.list.forEach((item) => {
        const dt = new Date(item.dt * 1000); //convert from unix datetime
        const currentDay = dt.getDate();
        //work out if it's a new day
        if (lastDay !== currentDay) {
            i++; //Move to the next day for storing data
            forecastChartData[i] = [];
            forecastData[i] = [];
            lastDay = currentDay;
        }

        forecastChartData[i].push({
            x: dt.getHours(),
            y: item.main.temp
        });

        //store data for this time in the array for this day
        forecastData[i].push({
            dt: dt,
            low: item.main.temp_min,
            high: item.main.temp_max,
            humidity: item.main.humidity,
            wind: item.wind.speed,
            icon: item.weather[0].icon
        });
    });

    const forecastSummary = summariseForecast(forecastData);

    updateForecastElements(forecastChartData, forecastSummary);
}

function updateForecastElements(forecastChartData, forecastSummary) {   
    for(let i=1; i<=5; i++) {
        let index=i-1;
        document.getElementById(`cardday${i}`).textContent = WEEKDAYS[forecastSummary[index].day];
        document.getElementById(`cardhigh${i}`).textContent = `High: ${Number.parseInt(forecastSummary[index].high)}\u00B0C`;
        document.getElementById(`cardlow${i}`).textContent = `Low: ${Number.parseInt(forecastSummary[index].low)}\u00B0C`;
        document.getElementById(`cardhumid${i}`).textContent = `Humidity: ${Number.parseInt(forecastSummary[index].humidity)}%`;
        document.getElementById(`cardwind${i}`).textContent = `Wind Speed: ${Number.parseFloat(forecastSummary[index].wind).toFixed(1)} km/h`;
    }
}

function summariseForecast(forecastData) {
    //This should take an array where forecastData[i] is an array of data over that day, see updateForecast for properties

    return forecastData.map(day => summariseDay(day)); //TODO: add day to summary
}

function summariseDay(forecastDay) {
    //This takes an array of data over a given day to summarise it, see updateForecast for properties

    let low = forecastDay[0].low;
    let high = forecastDay[0].high;
    let humiditySum = 0;
    let windSum = 0;

    forecastDay.forEach((item) => {
        if (item.low < low) low = item.low;
        if (item.high > high) high = item.high
        humiditySum += item.humidity;
        windSum += item.wind;
    });

    return {
        low,
        high,
        humidity: humiditySum / forecastDay.length,
        wind: windSum / forecastDay.length,
        day: forecastDay[0].dt.getDay()
    };
}

function createAlert(text, delayMs) {
    console.log(`Creating alert: ${text}`);
    const alert = document.createElement("div");
    alert.className = "erroralert";
    alert.innerHTML = `${text}`;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.classList.add('hide');
        setTimeout(() => document.body.removeChild(alert), 150);
    }, delayMs);
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}