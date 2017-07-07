var express = require('express')
var app = express();
var https = require('https');
var config = require('config');

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

global.access_token = '';

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
  //console.log(request.body);	
  //console.log(location);
  //response.send(location); 	
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

app.get('/bookuber', function(req, res) {
	var state = req.query.state;
	var code = req.query.code;
	if(state == 'mapView') {
	//var myObject = { title:state + ' : ', supplies:['X','Y','Z'], estimates:code };
	var myObject = { code:code };
	res.render('ubermap.ejs', myObject );
	}
});

var getEstimatesForUserLocation = function(userLatitude, userLongitude, dropLatitude, dropLongitude, access_token, estimates) {
	var parsedData = '';
	//console.log("Requesting updated time estimate...");
	
	//console.log(access_token);
	//console.log(userLatitude);
	//console.log(userLongitude);
	//console.log(dropLatitude);
	//console.log(dropLongitude);
	
	var qs = require("querystring");
	//var http = require("https");

	///////////////////// For Products : START //////////////////////
	var options = {
	  "method": "GET",
	  "hostname": "sandbox-api.uber.com",
	  //"port": null,
	  "path": '/v1.2/products?latitude='+userLatitude+'&longitude='+userLongitude,
	  "headers": {
		'Authorization': "Bearer " + access_token,
		'Accept-Language': "en_US",
		'content-type': "application/json",
	  }
	};

	var req = https.request(options, function (res) {
	  	
	  var chunks = [];

	  res.on("data", function (chunk) {
		//console.log('chunk'+chunk);  
		chunks.push(chunk);
	  });

	  res.on("end", function () {
		var body = Buffer.concat(chunks);
		var json = JSON.parse(body);
		//var json = JSON.stringify(body);
		//console.log('Products'+chunks);
		global.Products = json;
		if(json) global.Product_id = json["products"][0]["product_id"];
		parsedData = json;
		estimates(json);
		//console.log('Products'+Products);
		//console.log(Product_id);	
		
	  });
	});

	req.end();
	///////////////////// For Products : END //////////////////////	

//return parsedData;  
}

app.get('/uber', function(req, res) {
var productList = '';	
var allEstimate = '';

var userLatitude = req.query.start_latitude;
var userLongitude = req.query.start_longitude;
var dropLatitude = req.query.end_latitude;
var dropLongitude = req.query.end_longitude;
var code = req.query.code;

//console.log(code);

//////////////// Added to get Access Token using Authorization code : START //////////////////

var qs = require("querystring");
//var http = require("https");

var options = {
  "method": "POST",
  "hostname": "login.uber.com",
  //"port": null,
  "path": "/oauth/v2/token",
  "headers": {
    "content-type": "application/x-www-form-urlencoded"
  }
};

var req2 = https.request(options, function (res2) {
  var chunks = [];

  res2.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res2.on("end", function () {
    var body = Buffer.concat(chunks);
	var json = JSON.parse(body);
	//console.log("access_token1"+access_token);
	if(access_token == '') access_token = json.access_token;
	//console.log("access_token2"+access_token);

	///////////// Added to get Estimatiion : START /////////////
	productList = getEstimatesForUserLocation(userLatitude, userLongitude, dropLatitude, dropLongitude, access_token, function (estimates)
	{
		//console.log('Called : '+estimates);
		//var allEstimate = '';
		var data = estimates["products"]; 
			//console.log(data);
			if (typeof data != typeof undefined) {
				// Sort Uber products by time to the user's location 
				/*data.sort(function(t0, t1) {
					return t0.duration - t1.duration;
				});*/

				data.forEach(displayProducts);
				//console.log("Updating time estimate...");
				var checked = '';
				function displayProducts(item, index) {
					if(index == 0) {
						checked = 'checked';
					} else {
						checked = '';
					}	
					allEstimate += '<input type="radio" name="product" value="' + item.product_id + '" ' + checked + '>' + item.display_name + " " + '<img src="' + item.image + '" alt="' + item.display_name + '" width="40" > '; 
					//alert(allEstimate);
				}
							
			}
		
		//console.log(allEstimate);
		res.send(allEstimate+'<input type="button" name="estimate" id="estimate" value="Get Estimate" onclick="getEstimatesForSelectedVehicle();" >');	
	});
	///////////// Added to get Estimatiion : END ///////////////  
	
  });
});

req2.write(qs.stringify({ code: code,
  client_id: 'q5XFNcuI0FffOKwN79Im1WStCTJPeY-d',
  client_secret: 'hBPm-ocnBDS23XSc6B1zLwjKLcJPYYnm5oKMH8_u',
  redirect_uri: 'https://my-demo-bot.herokuapp.com/bookuber',
  grant_type: 'authorization_code' }));

req2.end();	
	
///////////////// Added to get Access Token using Authorization code : END ////////////////
});

app.get('/getPrice', function(req, res) {
	var userLatitude = req.query.start_latitude;
	var userLongitude = req.query.start_longitude;
	var dropLatitude = req.query.end_latitude;
	var dropLongitude = req.query.end_longitude;
	var product_id = req.query.product_id;

	//console.log("getPrice of "+product_id);
	
	var options = {
	  "method": "POST",
	  "hostname": "sandbox-api.uber.com",
	  "path": '/v1.2/requests/estimate',
	  "headers": {
		'Authorization': "Bearer " + access_token,
		'Accept-Language': "en_US",
		'Content-Type': "application/json"
	  }
	};

	var req3 = https.request(options, function (res2) {
	  //console.log("res"+res2);	
	  var chunks = [];

	  res2.on("data", function (chunk) {
		//console.log('chunk'+JSON.stringify(chunk));  
		chunks.push(chunk);
	  });

	  res2.on("end", function () {
		var body = Buffer.concat(chunks);
		var json = JSON.parse(body);
		//console.log('Fair_ID : '+json["fare"]["fare_id"]);	
		res.send(json);
		//console.log(body);
		//console.log(body.toString());
		//console.log(json);
		//console.log(json.toString());
		
	  });
	});

	req3.write(JSON.stringify({
	  product_id: Product_id,	
	  start_latitude: userLatitude,
	  start_longitude: userLongitude,
	  end_latitude: dropLatitude,
	  end_longitude: dropLongitude }));
	  
	req3.end();
});

app.get('/confirmRequest', function(req, res) {
	var userLatitude = req.query.start_latitude;
	var userLongitude = req.query.start_longitude;
	var dropLatitude = req.query.end_latitude;
	var dropLongitude = req.query.end_longitude;
	var fare_id = req.query.fare_id;

	//console.log("Request of "+fare_id);
	
	var options = {
	  "method": "POST",
	  "hostname": "sandbox-api.uber.com",
	  "path": '/v1.2/requests',
	  "headers": {
		'Authorization': "Bearer " + access_token,
		'Accept-Language': "en_US",
		'Content-Type': "application/json"
	  }
	};

	var req3 = https.request(options, function (res2) {
	  //console.log("res"+res2);	
	  var chunks = [];

	  res2.on("data", function (chunk) {
		//console.log('chunk'+JSON.stringify(chunk));  
		chunks.push(chunk);
	  });

	  res2.on("end", function () {
		var body = Buffer.concat(chunks);
		var json = JSON.parse(body);
		//console.log('Fair_ID : '+json["fare"]["fare_id"]);	
		res.send(json);
		//console.log(body);
		//console.log(body.toString());
		//console.log(json);
		//console.log(json.toString());
		
	  });
	});

	req3.write(JSON.stringify({
	  fare_id: fare_id,	
	  start_latitude: userLatitude,
	  start_longitude: userLongitude,
	  end_latitude: dropLatitude,
	  end_longitude: dropLongitude }));
	  
	req3.end();
});

app.get('/surge_confirmation', function(req, res) {
	console.log(res);
});

app.get('/cancell', function(req, res) {
	var options = {
			  "method": "DELETE",
			  "hostname": "sandbox-api.uber.com",
			  "path": '/v1.2/requests/current',
			  "headers": {
				'Authorization': "Bearer " + access_token,
				'Accept-Language': "en_US",
				'Content-Type': "application/json"
			  }
			};

			var req = https.request(options, function (res2) {
			  //console.log("res3"+res);	
			  var chunks = [];

			  res2.on("data", function (chunk) {
				//console.log('chunk'+JSON.stringify(chunk));  
				chunks.push(chunk);
			  });

			  res2.on("end", function () {
			  //console.log('Cancelled');
			  res.send('Cancelled');
			  });
			});

			req.end();
});

//////////JM : END//////////

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
