const errorNameUser = {
    status: 500,
    responseText: "Sorry, something went wrong",
  }


require('dotenv').config();

const express = require('express');
const cors = require('cors');


const app = express();
app.use(cors());

const PORT = process.env.PORT;


app.get('/location', handleLocationRequest )
app.get('/weather', handleWeatherRequest )
 
function handleLocationRequest(req, res) {

    
const search = req.query.city;

const locationsData = require('./data/location.json')

if(!search)  {
    res.status(500).send("something went wrong")
} 
const location = new Location(locationsData[0], search)
res.send(location)

 }

function handleWeatherRequest(req, res) {   
/*     const search = req.query.search_query;
 */
    const weatherArr = [];

    const weatherData = require('./data/weather.json')

    weatherData.data.forEach((element) => {
        weatherArr.push(new Weather(element) )
    })
    res.send(weatherArr)
 
    
} 


 ///------ Constructor -------------

function Location(data, search) {
    this.search_query = search;
    this.formatted_query = data.display_name;
    this.latitude = data.lat;
    this.longitude = data.lon;
}

function Weather(data) {
    this.forecast = data.weather.description;
    this.time = data.datetime;
} 
 


app.use('*', (req, res) => {
    res.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
