require('dotenv').config();

const express = require('express');
const cors = require('cors');


const app = express();
app.use(cors());

app.get('/location', handleLocationRequest )
/* app.get('/location', handleRestaurantRequest )
 */

function handleLocationRequest(req, res) {

    const locationsData = require('./data/location.json')
    const location = new Location(locationsData)
    res.send(location)

}

/* function handleRestaurantRequest() {

    const locationsData = require('./data/weather.json')
    const restaurant


} */


//------ Constructor -------------

function Location(data) {
    this.latitude = data.lat;
    this.longitude = data.lon;
}

/* function Restaurant(data) {
    this
}
 */


app.use('*', (req, res) => {
    res.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
