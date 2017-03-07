var express = require('express')
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello World!')
})

//////////JM : START//////////

var getWeather = function ( location) {
  var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + location + '&appid=f953e7b081a49dc14a56671ffa303848';
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  })
    .then(rsp => {
      var res = rsp.json();
      return res;
    })
    .then(json => {
      if (json.error && json.error.message) {
        throw new Error(json.error.message);
      }
      return json;
    });
}

try {
  // if running from repo
  Wit = require('../').Wit;
  interactive = require('../').interactive;
} catch (e) {
  Wit = require('node-wit').Wit;
  interactive = require('node-wit').interactive;
}

app.get('/webhook', function(request, response) {
  var location = request.query.city;
  //console.log(request.query);	
  console.log(location);
  getWeather(location).then(weatherJson => {
		  var weatherDetails = '';
		  	
		  var temp = weatherJson.main.temp - 273.15;
		  weatherDetails = weatherDetails + 'Current temperature : ' + temp + ' C';
			
		  var humid = weatherJson.main.humidity;
		  weatherDetails = weatherDetails + ', Humidity : ' + humid + '%';
				
	    	  var cloud = weatherJson.clouds.all;
		  weatherDetails = weatherDetails + ', Cloud : ' +cloud + '%';
			
		  var desc = weatherJson.weather[0].description;
		  weatherDetails = weatherDetails + ', Overall weather : ' + desc;
			
		  weatherDetails = weatherDetails + ' in ' + location;
    
		  response.send(weatherDetails);
      })
})

app.post('/webhook', function(request, response) {
  var location = request.body.result.parameters.city;
  //console.log(request.body);	
  console.log(location);
  //response.send(location); 	
  getWeather(location).then(weatherJson => {
	  	  //response.send(weatherJson);
		  var weatherDetails = '';
		  	
		  var temp = weatherJson.main.temp - 273.15;
		  weatherDetails = weatherDetails + 'Current temperature : ' + temp + ' C';
			
		  var humid = weatherJson.main.humidity;
		  weatherDetails = weatherDetails + ', Humidity : ' + humid + '%';
				
	          var cloud = weatherJson.clouds.all;
		  weatherDetails = weatherDetails + ', Cloud : ' +cloud + '%';
			
		  var desc = weatherJson.weather[0].description;
		  weatherDetails = weatherDetails + ', Overall weather : ' + desc;
			
		  weatherDetails = weatherDetails + ' in ' + location;
    
	  	  //////////////// Preparing output JSON : START /////////////////
	  	  var outJSON = {
		  "speech": "Testing...",
		  "displayText": weatherDetails,
		  "data": "Test Data",
		  "contextOut": ["Test Context Output"],
		  "source": "openweathermap"
		  }
	  	  //////////////// Preparing output JSON : END /////////////////
	  
		  response.send(outJSON);
      })
})

//////////JM : END//////////

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
