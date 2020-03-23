$( document ).ready( function() {
/*
=====================================================================
*   Global Object
===================================================================== 
*/
const elementsArray = ["Toronto"]; // Initial array
const calendar = {
  fullDayOfWeek : [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
  abvDayOfWeek  : [ "SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT" ],
  fullMonth     : [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
  abvMonth      : [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
}
const WEATHER_API_KEY = "2a54c31e9834cbfba0c705cff7db3d06";

// Call current weather data for one location: https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={appid}
// Call current UV data for one location: https://api.openweathermap.org/data/2.5/uvi?appid={appid}&lat={lat}&lon={lon}
// Call 5 day / 3 hour forecast data: https://api.openweathermap.org/data/2.5/forecast?q={city name}&appid={your api key}

/*
=====================================================================
*   API Functions
===================================================================== 
*/
function callWeatherAPI( inputValue ) {
  const queryCurrentWeather = "https://api.openweathermap.org/data/2.5/weather?q=" + inputValue + "&appid=" + WEATHER_API_KEY;
  
  // Object containing all information about the weather
  let weatherObj = {};

  fetch(queryCurrentWeather)
    .then(responseCurrentWeather => responseCurrentWeather.json())
    .then( dataCurrentWeather => {
      // "$.extend": The second object will overwrite or add to the base object. UNDEFINED values are not copied.
      $.extend(weatherObj, { longitude: dataCurrentWeather.coord.lon, latitude: dataCurrentWeather.coord.lat, temperature: convertFahrenheit(dataCurrentWeather.main.temp), feelsLike: convertFahrenheit(dataCurrentWeather.main.feels_like), windSpeed: dataCurrentWeather.wind.speed, pressure: dataCurrentWeather.main.pressure, humidity: dataCurrentWeather.main.humidity, sunrise: timeConversion(dataCurrentWeather.sys.sunrise), sunset: timeConversion(dataCurrentWeather.sys.sunset), description: dataCurrentWeather.weather[0].main, fullDescription: dataCurrentWeather.weather[0].description, country: dataCurrentWeather.sys.country } ); 

      $("#subtitle").append( $("<h1>").text( inputValue + ", " ), $("<h2>").text( weatherObj.country ) );

      // Get UV Index information
      callUVIndexAPI( inputValue, weatherObj );
    })
    .catch(err => alert("Oops.. I couldn't find your city in my database, that's embarrassing! [404.1]"))
}

function callUVIndexAPI( inputVal, weatherObject ) {
  const queryUVData = "https://api.openweathermap.org/data/2.5/uvi?appid=" + WEATHER_API_KEY + "&lat=" + weatherObject.latitude + "&lon=" + weatherObject.longitude;

  fetch(queryUVData)
    .then(responseUVIndex => responseUVIndex.json())
    .then(dataUVIndex => {
      // "$.extend": The second object will overwrite or add to the base object. UNDEFINED values are not copied.
      $.extend(weatherObject, { uvIndex: dataUVIndex.value } );

      // Get Daily Forecast Information
      callDailyForecastAPI ( inputVal, weatherObject );
    })
    .catch(err => alert("Oops.. I couldn't find your city in my database, that's embarrassing! [404.2]"))
}

function callDailyForecastAPI( inputV, weatherObj ) {
  const queryDailyForecast  = "https://api.openweathermap.org/data/2.5/forecast?q=" + inputV + "&appid=" + WEATHER_API_KEY;

  let arrayDailyForecast = [];

  fetch(queryDailyForecast)
    .then(responseDailyForecast => responseDailyForecast.json())
    .then( dataDailyForecast => {
      let followingDay = "0000-00-00";
      // Add a 5-day forecast
      for (let index = 0; index < dataDailyForecast.cnt; index++) {
        if ( followingDay !==  (dataDailyForecast.list[index].dt_txt).substr(0, 10) ) {
          followingDay = (dataDailyForecast.list[index].dt_txt).substr(0, 10);
          arrayDailyForecast.push( { temperature: convertFahrenheit(dataDailyForecast.list[index].main.temp), humidity: dataDailyForecast.list[index].main.humidity, description: dataDailyForecast.list[index].weather[0].main, fullDescription: dataDailyForecast.list[index].weather[0].description, followingDate: followingDay } );
        }
      }

      $.extend(weatherObj, { arrayDailyForecast } );

      // Show weather information on the screen
      createWeatherForm( weatherObj );
    })
    .catch(err => alert("Oops.. I couldn't find your city in my database, that's embarrassing! [404.3]"))
}

/*
=====================================================================
*   Add Button - Function
===================================================================== 
*/
// This function handles events where the add button is clicked
$("#add-button").on("click", function(event) {
  // Grab the text the user types into the input field
  const inputField = $("#inputbox").val().trim();
  $("#inputbox").val("");

  // event.preventDefault() prevents submit button from trying to send a form.
  // Using a submit button instead of a regular button allows the user to hit
  // "Enter" instead of clicking the button if desired
  event.preventDefault();

  if ( inputField.length > 0) {
    if ( !verifyElementExistence( inputField ) ) {
      // Clear entire view: Delete the content inside the buttons-view and subtitle to adding new elements
      // (this is necessary otherwise will repeat buttons and subtitles)
      clearFullView();

      // Add new element into the array
      elementsArray.push(inputField);

      // Loop through the array, then generate buttons for each element in the array
      createNewButton();
    }
    else {
      // In case there is already an element with the same name, clear only the subtitle view
      clearViewPartially();
    }

    callWeatherAPI( inputField );
  }
});

/*
=====================================================================
*   Existing Button - Function
===================================================================== 
*/
// Get every click on the screen
$( document ).on("click", ".hcity", alertElementName);


/*
=====================================================================
*   General Functions
===================================================================== 
*/
function clearFullView() {
  $("#buttons-view").empty();
  $("#subtitle").empty();
  $(".forecast-container").empty();
}

function clearViewPartially() {
  $("#subtitle").empty();
  $(".forecast-container").empty();
}

function verifyElementExistence ( newElement ) {
  let result = false;
  elementsArray.forEach( ( item ) => {
    if ( newElement.toLowerCase() === item.toLowerCase() ){
      result = true;
    }
  });
  return result;
}

function createNewButton() {
  elementsArray.forEach( ( item, index ) => $("#buttons-view").append( $("<button>").attr( "id", "button-" + ( index + 1 ) ).attr( "type", "submit" ).attr( "class", "btn btn-info hcity").attr( "value", item ).text( item ) ) );
}

function createWeatherForm( responseWeather ) {
  /*
  =====================================================================
  *   Main Weather Form
  ===================================================================== 
  */
  const date = formatDate();
  const uvIndexColor = verifyUVIndexColor(responseWeather.uvIndex);
  // const logo = getLogo();

  const forecastToday = `
  <div class="today forecast">
    <div class="forecast-header">
      <div class="date">${date[0].outerHTML}</div>
      <div class="logo"><img src="./img/icons/icons8-ca.png" alt="Forecast-CA" width=40></div>
    </div>
    <div class="forecast-content">
      <div class="degree">
        <div class="num">${responseWeather.temperature}<sup>o</sup>F</div>
        <div class="forecast-icon">
          <img src="./img/icons/icons8-${responseWeather.description.toLowerCase()}-0.png" alt="Current Forecast" width=90>
        </div>
        <div class="forecast-desc">	
          <span>${responseWeather.fullDescription}</span>
        </div>
      </div>
      <br />
      <span id="col_left" class="bottom_space"><img src="./img/icons/icons8-sunrise.png" alt="Sunrise" width=40> 08:13:09 am</span>
      <span id="col_right" class="bottom_space"><img src="./img/icons/icons8-sunset.png" alt="Sunset" width=40> 08:13:53 pm</span>
      <span id="col_left"><b>Feels Like: </b>${responseWeather.feelsLike}<sup>o</sup>F</span>
      <span id="col_right"><b>Humidity: </b>${responseWeather.humidity} %</span>
      <span id="col_left"><b>Wind Speed: </b>${responseWeather.windSpeed} MPH</span>
      <span id="col_right" class="uv-index" style="color: ${uvIndexColor[0]}; background-color: ${uvIndexColor[1]};"><b>UV Index: </b>${responseWeather.uvIndex}</span>
    </div>
  </div>
  `;

  /*
  =====================================================================
  *   Daily Forecast
  ===================================================================== 
  */
  let forecastDaily = "";
  let forecastDay;
  let indexPosition = 1;

  for (let index = 0; index < responseWeather.arrayDailyForecast.length; index++) {
    forecastDay = getFormattedDailyDate(responseWeather.arrayDailyForecast[index].followingDate, indexPosition);

    // Verify if it is not the same date
    if ( forecastDay !== "0") {
      forecastDaily += 
      `
      <div class="forecast">
        <div class="forecast-daily-header">
          <div class="day">${forecastDay}</div>
        </div> 
        <div class="forecast-content">
          <div class="forecast-daily-icon">
            <img src="./img/icons/icons8-${responseWeather.arrayDailyForecast[index].description.toLowerCase()}-1.png" alt="Following Forecast" width=48>
          </div>
          <div class="degree">${responseWeather.arrayDailyForecast[index].temperature}<sup>o</sup>F</div>
          <br />
          <span id="col_right"><img src="./img/icons/icons8-hygrometer.png" alt="Humidity" width=25>${responseWeather.arrayDailyForecast[index].humidity}</span>
        </div>
      </div>
      `;

      indexPosition++;
    }
  }

  /*
  =====================================================================
  *   Appending ALL information
  ===================================================================== 
  */
  const finalForm = $(".forecast-container");
  finalForm.append( forecastToday, forecastDaily );
}

function alertElementName() {
  const elementName = $(this).attr("value");

  if ( elementName.length > 0) {
    // Clear only the subtitle view
    clearViewPartially();

    callWeatherAPI( elementName );
  }
}

function verifyUVIndexColor(uvIndex) {
  /*
  =====================================================================
  *   Green  = #52DE97 (UV index reading of 0 to 2)
  *   Yellow = #FFF591 (UV index reading of 3 to 5)
  *   Orange = #FFAC41 (UV index reading of 6 to 7)
  *   Red    = #FF1E56 (UV index reading of 8 to 10)
  ===================================================================== 
  */

  // Present with a color that indicates whether the conditions are:
  // "Low" (Green/White), "Moderate" (Yellow/Black), "High" (Orange/Black), 
  // "Very high" (Red/White), or "Extreme" (Violet/White) 
  let arrayUVIndexColor = [];
  // Color
  arrayUVIndexColor[0] = ( uvIndex >= 3 && uvIndex < 8 ) ? "#000000" : "#FFFFFF";
  // Background-Color
  arrayUVIndexColor[1] = ( uvIndex >= 0 && uvIndex < 3 ) ? "#52DE97" : ( ( uvIndex >= 3 && uvIndex < 6 ) ? "#FFF591" : ( ( uvIndex >= 6 && uvIndex < 8 ) ? "#FFAC41" : ( ( uvIndex >= 8 && uvIndex < 11 ) ? "#FF1E56" : "#BE79DF" ) ) );

  return arrayUVIndexColor;
}

function getFormattedDailyDate(dDate, iPos) {
  const d = new Date();
  const MAX_DAY_OF_WEEK = 6;

  // Verify Current Date with Following Date
  if ( d.getDate() === parseInt(dDate.slice(8, 10)) )
    return "0"; // Same as Current Date (Do not show!!)

  // Get the Index of the Current Day of the Week
  let indexDayWeek = (d.getDay() + iPos) > MAX_DAY_OF_WEEK ? (d.getDay() + iPos) - (MAX_DAY_OF_WEEK + 1) : d.getDay() + iPos;

  return (`${calendar.abvDayOfWeek[indexDayWeek]}, ${dDate.slice(8, 10)}`);
}

function formatDate() {
  const d = new Date();

  let iDayWeek =  d.getDay();

  // Get Month
  let fullMonth = calendar.fullMonth[ d.getMonth() ];
  // Get Current Date
  let currentDay = d.getDate();
  // Get Year
  let fullYear = d.getFullYear();
  // Get the Day of the Week
  let dayOfWeek = calendar.fullDayOfWeek[ iDayWeek ] + ",  ";

  // Get Current Date
  const fullDate = $("<h4>").append( dayOfWeek ).append( currentDay ).append( $( "<em>" ).append( getOrdinalSuffix( d.getDate() ) ) ).append( ` ${fullMonth}` ).append( ` ${fullYear}` );
  // $("#subtitle").append( fullDate );

  return fullDate;
}

function getOrdinalSuffix (currentDate) {
  const cDate1 = currentDate % 10,
        cDate2 = currentDate % 100;

  return ( ( cDate1 == 1 && cDate2 != 11 ) ? "st" : ( ( cDate1 == 2 && cDate2 != 12 ) ? "nd" : ( ( cDate1 == 3 && cDate2 != 13 ) ? "rd" : "th" ) ) );
}

function convertFahrenheit (temperature) {
  // Calculate the temperature (converted from Kelvin)
  return ( (temperature - 273.15) * 1.80 + 32 ).toFixed(1);
}

function timeConversion(millisec) {
  // let milliseconds = parseInt((millisec % 1000) / 100),
  let seconds = Math.floor((millisec / 1000) % 60),
      minutes = Math.floor((millisec / (1000 * 60)) % 60),
      hours   = Math.floor((millisec / (1000 * 60 * 60)) % 24);

  hours   = ( hours   < 10 ) ? "0" + hours   : hours;
  minutes = ( minutes < 10 ) ? "0" + minutes : minutes;
  seconds = ( seconds < 10 ) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
}


/*
=====================================================================
*   Build webpage
===================================================================== 
*/
  // Loop through the array, then generate buttons for each element in the array
  createNewButton();
})