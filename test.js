var express = require('express')
var app = express();

var config = require('config');

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello World!')
})

//////////JM : START//////////

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = config.get('pageAccessToken');

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

/*app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
	console.log(JSON.stringify(req.query));
    res.sendStatus(403);          
  }  
});*/

// Webhook setup
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});


app.post('/webhook', function(request, response) {
  var location = request.body.result.parameters.city;
  //var location = 'Kolkata';	
  console.log(request.body);	
  console.log(location);
  
  if(request.body.result.action == 'bookUber') {
	//////////////// Preparing output JSON : START /////////////////
	  	  var outJSON = {
		  "speech": "INR 293",
		  "displayText": "INR 293, Will reach in 3 minutes.",
		  "data": "Test Data",
		  "contextOut": [{"name": "cabbooking"}],
		  "source": "Uber"
		  }
	//////////////// Preparing output JSON : END /////////////////	  
  	response.send(outJSON); 
  }	  
	
  getWeather(location).then(weatherJson => {
	  	  //response.send(weatherJson);
		  var weatherDetails = '';
		  
	  	  weatherDetails = weatherDetails + 'Hi, here is the weather in ' + location + ' - ';	
	  
		  var temp = weatherJson.main.temp - 273.15;
		  weatherDetails = weatherDetails + 'Current temperature : ' + temp + ' C';
			
		  var humid = weatherJson.main.humidity;
		  weatherDetails = weatherDetails + ', Humidity : ' + humid + '%';
				
	          var cloud = weatherJson.clouds.all;
		  weatherDetails = weatherDetails + ', Cloud : ' +cloud + '%';
			
		  var desc = weatherJson.weather[0].description;
		  weatherDetails = weatherDetails + ', Overall weather : ' + desc;	  
    
	  	  //////////////// Preparing output JSON : START /////////////////
	  	  var outJSON = {
		  "speech": weatherDetails,
		  "displayText": weatherDetails,
		  "data": "Test Data",
		  "contextOut": [{"name": "forecast"}],
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
