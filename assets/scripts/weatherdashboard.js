$(document).ready(function () {
    $('#bub1').click(function () {
        $('#Modal1').modal('show');
    });

    $('#bub2').click(function () {
        $('#Modal2').modal('show');
    });

    $('#bub3').click(function () {
        $('#Modal3').modal('show');
    });

    $('#bub4').click(function () {
        $('#Modal4').modal('show');
    });

    $(document).ready(function () {
        $('#bub5').click(function () {
            $('#Modal5').modal('show');
        });
    });
});

document.getElementById("submitBtn").addEventListener("click", getLocation);
document.getElementById("locationInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        getLocation();
    }
});

const API_KEY = "f23ee9deb4e1a7450f3157c44ed020e1";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

let cityName = "";

const forecastCharts = [];

const weatherEmojis = {
    Clear: '☀️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Clouds: '☁️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
    Smoke: '🌫️',
    Dust: '🌫️',
    Ash: '🌋',
    Sand: '🏜️',
    Squall: '💨',
    Tornado: '🌪️',
    Snow: '❄️'
};

weatherGeolocation();

function weatherGeolocation() {
    if (navigator.geolocation) {
        console.log("using geolocation data");
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
                .then(response => {
                    if (!response.ok) throw new Error('Reverse geocode response not OK');
                    return response.json();
                })
                .then(data => {
                    const townName = data.address.city || data.address.town || data.address.village;
                    if (!townName) throw new Error('No town name found');
                    console.log("Detected location:", townName);
                    cityName = townName;
                    // Now call getWeather since we have a town name
                    getWeather(lat, lon);
                })
                .catch(err => {
                    console.error("Failed to get town name, aborting weather fetch:", err);
                    cityName = "London";
                    getWeather(51.5073219, -0.1276474);
                });
        },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    console.log("User denied geolocation permission or it’s blocked");
                    // fallback logic here - call getWeather with default location
                    cityName = "London";
                    getWeather(51.5073219, -0.1276474);
                } else {
                    console.log("Geolocation error:", error.message);
                }
            }
        );
    } else {
        console.log("geolocation isn't available");
        cityName = "London";
        getWeather(51.5073219, -0.1276474);
    }
}

function getLocation() {
    cityName = document.getElementById("locationInput").value;

    if (!cityName) {
        createAlert("Please enter a location", 2000);
        return;
    }

    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`)
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

    document.getElementById("currentTime").textContent = `${hours}:${minutes} - ${toTitleCase(cityName)} ${getWeatherEmoji(obj.weather[0].main)}`;
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
        .catch((error) => {
            console.error(error);
            createAlert("Error fetching forecast.", 2000);
        });
}

function updateForecast(obj) {
    console.log("forecast data", obj);

    const forecastChartData = []; //Array where forecastChartData[0] is the first forecast day, etc. For charts to store {x,y} where x is time and y is temperature.
    const forecastData = []; //Like chart data but recording data used for the daily summary

    let i = 0; //Start at 0
    let lastDay = new Date(obj.list[0].dt * 1000).getDate(); //get the first day stored as a starting point
    forecastChartData[0] = [];
    forecastData[0] = [];

    //The API is providing 3 hour forecast items, this code is to iterate over them and group them into days for summarising and charting.

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
    // Update 5 forecast cards by mapping forecastSummary data to elements with IDs cardday1, cardday2, etc.
    for (let i = 1; i <= 5; i++) {
        const index = i - 1;

        //card data elements
        document.querySelectorAll(`.cardday${i}`).forEach((element) => element.textContent = `${WEEKDAYS[forecastSummary[index].day]} ${addOrdinalSuffix(forecastSummary[index].date)} ${MONTHS[forecastSummary[index].month]}`);
        document.getElementById(`cardhigh${i}`).textContent = `High: ${Math.round(forecastSummary[index].high)}\u00B0C`;
        document.getElementById(`cardlow${i}`).textContent = `Low: ${Math.round(forecastSummary[index].low)}\u00B0C`;
        document.getElementById(`cardhumid${i}`).textContent = `Humidity: ${Math.round(forecastSummary[index].humidity)}%`;
        document.getElementById(`cardwind${i}`).textContent = `Wind Speed: ${forecastSummary[index].wind.toFixed(1)} km/h`;
        document.getElementById(`cardicon${i}`).src = `https://openweathermap.org/img/wn/${forecastSummary[index].icon}@2x.png`;

        //charts

        //destroy charts first to replace
        if (forecastCharts[i]) {
            forecastCharts[i].destroy();
            forecastCharts[i] = null;
        }
        
        console.log(forecastChartData[i]);
        const ctx = document.getElementById(`forecastchart${i}`).getContext("2d");
        forecastCharts[i] = new Chart(ctx, {
            type: "line",
            data: {
                datasets: [{
                    data: forecastChartData[i],
                    fill: false,
                    showLine: true,
                    label: ""
                }]
            },
            options: {
                scales: {
                    x: {
                        type: "linear", // important for numeric x-axis
                        position: "bottom",
                        min: 0,
                        max: 24,
                        title: {
                            display: true,
                            text: "Hour of Day"
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: "Forecast Temperature (\u00B0C)"
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

function summariseForecast(forecastData) {
    //This should take an array where forecastData[i] is an array of data over that day, see updateForecast for properties

    return forecastData.map(day => summariseDay(day)); //TODO: add day to summary
}

function summariseDay(forecastDay) {
    // This takes an array of data over a given day to summarize it; see updateForecast for properties.

    let low = forecastDay[0].low;
    let high = forecastDay[0].high;
    let humiditySum = 0;
    let windSum = 0;
    const targetHour = 12; // Noon hour
    let closestIcon = forecastDay[0].icon;
    let smallestDiff = Infinity;

    forecastDay.forEach((item) => {
        if (item.low < low) low = item.low; // Find the lowest value; this acts like a min function on item.low.
        if (item.high > high) high = item.high; // Find the highest value; this acts like a max function on item.high.
        humiditySum += item.humidity; // Accumulate humidity to later calculate the average.
        windSum += item.wind; // Accumulate wind speed to later calculate the average.

        //Calculate difference to noon to set the desired icon
        const hour = item.dt.getHours();
        const diff = Math.abs(hour - targetHour);
        if (diff < smallestDiff) {
            smallestDiff = diff;
            closestIcon = item.icon;
        }
    });

    return {
        low,
        high,
        humidity: humiditySum / forecastDay.length,
        wind: windSum / forecastDay.length,
        day: forecastDay[0].dt.getDay(),
        month: forecastDay[0].dt.getMonth(),
        date: forecastDay[0].dt.getDate(),
        icon: closestIcon
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

function getWeatherEmoji(main) {

    const defaultWeatherEmojis = {
        Clear: "☀️",
        Rain: "🌧️",
        Drizzle: "🌧️",
        Thunderstorm: "⛈️",
        Clouds: "☁️",
        Mist: "🌫️",
        Fog: "🌫️",
        Haze: "🌫️",
        Smoke: "🌫️",
        Dust: "🌫️",
        Ash: "🌫️",
        Sand: "🌫️",
        Squall: "🌫️",
        Tornado: "🌪️",
        Snow: "❄️"
    };

    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 20;

    if (main === "Clear" && isNight) {
        return "🌙";
    }

    return defaultWeatherEmojis[main] || "";
}

function addOrdinalSuffix(n) {
    const k = n % 100; //Pattern repeats every 100 as 11, 12, 13, 111, 112, 113, etc are special cases.

    if (k >= 11 && k <= 13) {
        return n + "th"; //11th, 12th, 13th, 111th, 112th, 113th, etc
    }

    const j = n % 10; //Now we base it on the last digit.
    switch (j) {
        case 1:
            return n + "st"; //1st, 21st, 31st, etc
        case 2:
            return n + "nd"; //2nd, 22nd, 32nd, etc
        case 3:
            return n + "rd"; //3rd, 23rd, 33rd, etc
        default:
            return n + "th"; //all others: 4th, 5th, 6th, etc
    }
}