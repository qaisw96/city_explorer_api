
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const { response } = require('express');


const app = express();
app.use(cors());

const PORT = process.env.PORT;
const LocationCodeAPIKey = process.env.GEO_CODE_API_KEY
const WeatherCodeAPIKey = process.env.WEATHER_CODE_API_KEY


app.get('/location', handleLocationRequest )
app.get('/weather', handleWeatherRequest )
  


function handleLocationRequest(req, res) {

    
    const searchQ = req.query.city ;
 
    const url = `https://us1.locationiq.com/v1/search.php?key=${LocationCodeAPIKey}&q=${searchQ}&format=json`

    
     if(!searchQ)  {
          res.status(404).send("city not found")
      }  
        
    superagent.get(url).then(resData => {
        console.log(resData.body)
        const location = new Location(resData.body[0], searchQ)
        res.status(200).send(location);
      }).catch((error) => {
        res.status(500).send('Sorry, something went wrong');
      });
    
    
 }

function handleWeatherRequest(req, res) {   
    const latitude = req.query.lat
    const longitude = req.query.lon

   console.log(search)
 
   const weatherArr = [];
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?key=${WeatherCodeAPIKey}&q=${latitude}&q=${longitude}&format=json`

    superagent.get(url).then(dataSet => {
        // console.log()
        // dataSet.body.forEach(element => {
        //     weatherArr.push(new Weather(element) )
        // })
        // console.log(dataSet.body)
        // const weather = new Weather(dataSet.body.data)
        res.status(200).send(dataSet)
    })



    // const weatherData = require('./data/weather.json')


   
    res.send(weatherArr)
 
    
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
 


app.use('*', (req, res) => {
    res.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
