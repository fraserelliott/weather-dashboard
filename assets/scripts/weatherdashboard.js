document.getElementById("submitBtn").addEventListener("click", getLocation);

const API_KEY = "f23ee9deb4e1a7450f3157c44ed020e1";

function getLocation() {
    const location = document.getElementById("locationInput").value;

    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`)
        .then((response) => response.json())
        .then((responseObj) => {
            const lat = responseObj[0].lat;
            const lon = responseObj[0].lon;
            getWeather(lat, lon);
        })
        .catch((error) => console.error("Fetch error: ", error));
}

function getWeather(lat, lon) {
    console.log(`${lat}, ${lon}`)
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
        .then((response) => response.json())
        .then((responseObj) => updateWeather(responseObj))
        .catch((error) => console.error("Fetch error: ", error));
}

function updateWeather(obj) {
    console.log(obj);
}