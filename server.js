// load environmenyal variable from .env file
require('dotenv').config();

// Extract packages
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const { response } = require('express');
const pg = require(`pg`)

const app = express();
app.use(cors());

// sign values to varibles from .env file 
const PORT = process.env.PORT;
const LocationCodeAPIKey = process.env.GEO_CODE_API_KEY
const WeatherCodeAPIKey = process.env.WEATHER_CODE_API_KEY
const parkCodeAPIKey = process.env.PARK_CODE_API_KEY
const dataBaseUrl = process.env.DATABASE_URL


// Database connection setup ---- Ready to be conneted :
const client = new pg.Client(dataBaseUrl)


// const postData = `select * from table`

app.get('/location', handleLocationRequest )
app.get('/location', handleLocationInfoFromDb )

app.get('/weather', handleWeatherRequest )
app.get('/park', handleParkRequest )


function handleLocationRequest(req, res) {

    
    const searchQ = req.query.city ;
 
    const url = `https://us1.locationiq.com/v1/search.php?key=${LocationCodeAPIKey}&q=${searchQ}&format=json`

    
     if(!searchQ)  {
          res.status(404).send("city not found")
      }  
        
    superagent.get(url).then(resData => {
        const location = new Location(resData.body[0], searchQ)
        res.status(200).send(location);
      }).catch((error) => {
        res.status(500).send('Sorry, something went wrong');
      });
      
      
    
 }

 function handleLocationInfoFromDb(req, res) {
    const city = req.query.city



 }

function handleWeatherRequest(req, res) {   
    // const latitude = req.query.lat
    // const longitude = req.query.lon
    const  { latitude, longitude } = req.query;
 
    const url = `https://api.weatherbit.io/v2.0/forecast/daily`
    const queryObj = {
        lat: req.query.latitude,
        lon: req.query.longitude,
        key: WeatherCodeAPIKey
    }

    superagent.get(url).query(queryObj).then(dataSet => {
        const myWeatherArrData = dataSet.body.data.map(weather => {
            return new Weather(weather)
        }) 

        res.send(myWeatherArrData)
    }).catch((error) => {
        console.log('ERROR', error);
        res.status(500).send('there is no data weather')
    })    
} 

function handleParkRequest(req, res) {
    const parkQuery = req.query.search_query

    const parkUrl = `https://developer.nps.gov/api/v1/parks?q=${parkQuery}&api_key=${parkCodeAPIKey}`

    superagent.get(parkUrl).then(parksDate => {
        const myParkDataArray = parksDate.body.data.map(park => {
            return new Park(park)
        })
        res.send(myParkDataArray)
        console.log
    }).catch((error) => {
        console.log('error', error )
        res.status(500).send('there is no park data')
    })
}

 ///------ Constructor -------------

function Location(data, searchQ) {
    this.search_query = searchQ
    this.formatted_query = data.display_name;
    this.latitude = data.lat;
    this.longitude = data.lon;
}

function Weather(data) {
    this.forecast = data.weather.description;
    this.time = data.datetime;
} 
 
function Park(data) {
    this.name = data.name
    this.address = `${data.addresses[0].line1}, ${data.addresses[0].city}, ${data.addresses[0].postalCode}`
    this.fee = `0.000`
    this.description = data.description
    this.url = data.url
}



// connect to DB and start the web server 
client.connect().then(() => {
    app.listen(PORT, () => { 
        console.log('connected to databace:', client.connectionParameters.database)
        console.log(`Listening to Port ${PORT}`) });
    })



app.use('*', (req, res) => {
    res.send('all good nothing to see here!');
});

