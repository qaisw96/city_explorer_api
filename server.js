// load environmenyal variable from .env file
require('dotenv').config();

// Extract packages
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require(`pg`)

// const { response } = require('express');
const app = express();
app.use(cors());

// sign values to varibles from .env file 
const ENV = process.env.ENV || "DEP"
const PORT = process.env.PORT;
const LocationCodeAPIKey = process.env.GEO_CODE_API_KEY
const WeatherCodeAPIKey = process.env.WEATHER_CODE_API_KEY
const parkCodeAPIKey = process.env.PARK_CODE_API_KEY
const moviesCodeAPIKey = process.env.MOVIE_API_KEY
const yelpCodeAPIKey = process.env.YELP_API_KEY
const dataBaseUrl = process.env.DATABASE_URL

// Database connection setup ---- Ready to be conneted :
let client = '';
if (ENV === 'DEP') {
  client = new pg.Client({
    connectionString: dataBaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  client = new pg.Client({
    connectionString: dataBaseUrl,
  });
}

//End Points :
app.get('/location', handleLocationRequest )
app.get('/weather', handleWeatherRequest )
app.get('/parks', handleParkRequest )
app.get('/movies', handleMoviesRequest)
app.get('/yelp', handleYelpRequest)

function handleLocationRequest(req, res) {

    
    const searchQ = req.query.city ;

    
    if(!searchQ)  {
        res.status(404).send("city not found")
    }  
    
    handleLocationInfoFromDb(searchQ).then(result => {
        res.status(200).json(result)
        console.log(`pass first function`)
    }).catch(error => {
        console.log(error)
        res.status(500).send(`sorry something went wrong`)
    })
    
    
}

function handleLocationInfoFromDb(city) {
    
    const safeValues = [city]
    const sqlQuery = `SELECT * FROM locations WHERE search_query=$1`
    
    return client.query(sqlQuery, safeValues).then(results => {
        if(results.rows.length !== 0) {
            console.log(`sendind data from DB`)
            console.log(results.rows[0])
            return results.rows[0]
        } else {
            const url = `https://us1.locationiq.com/v1/search.php?key=${LocationCodeAPIKey}&q=${city}&format=json`

            return superagent.get(url).then(resData => {
                const location = new Location(resData.body[0], city)
                const safeValues = [location.search_query, location.formatted_query, location.latitude, location.longitude]
                const sqlQuery = `INSERT INTO locations(search_query, formatted_query, latitude, longitude) VALUES( $1, $2, $3, $4)`    
                client.query(sqlQuery, safeValues)
            
                console.log(`send from API`)
                return location
              }).catch((error) => {
                res.status(500).send('Sorry, something went wrong');
              });
        }
    })
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
    }).catch((error) => {
        console.log('error', error )
        res.status(500).send('there is no park data')
    })
}

function handleMoviesRequest(req, res) {
    const movieUrl = `https://api.themoviedb.org/3/movie/550?api_key=${moviesCodeAPIKey}&limit=4`

    superagent.get(movieUrl).then(moviesData => {
        let movie = new Movie(moviesData.body)
    
        res.send(movie)  
        })
        
}

function handleYelpRequest(req, res) {

    const serQuery = req.query.search_query;
    const yelpUrl = `https://api.yelp.com/v3/businesses/search?location=${serQuery}&limit=5`;

    if (!serQuery) {
      res.status(404).send('search what you want');
    }

    superagent.get(yelpUrl).set('Authorization', `Bearer ${yelpCodeAPIKey}`).then(data=>{
      const yelpDataSet = data.body.businesses.map(yelp=>{
        return new Yelp(yelp);
      });
      res.status(200).send(yelpDataSet);
    }).catch(error=>{
      console.error('ERROR',error);
      res.status(500).send('No YELP DATA');
    });
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

function Movie(data) {
    this.title = data.title
    this.overview = data.overview
    this.average_votes = data.vote_average
    this.total_votes = data.vote_count
    this.image_url = data.production_companies[0].logo_path
    this.popularity = data.popularity
    this.released_on = data.release_date
}

function Yelp(data) {
    this.name = data.name;
    this.image_url = data.image_url;
    this.price = data.price;
    this.rating = data.rating;
    this.url = data.url;
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

