var ACS = require('acs-node');
var _ = require("underscore");
var LatLon = require("latlon");

function list (req , res) {
    
    console.log("lat: " + req.query.lat * 1 + ", lon: " + req.query.lon * 1);
    ACS.Places.query({
        //page: 1 ,
        //per_page: 10 ,
        where: {
            lnglat: {
                '$nearSphere': [req.query.lon * 1 , req.query.lat * 1] ,
                '$maxDistance': req.query.d * 1 / 6371
            } ,
            type: "office"
        }
        ,sel: JSON.stringify({all: ["id", "name", "address", "city", "postal_code", "latitude", "longitude", "photo", "photo.id", "photo.urls", "urls", "photo.urls.original"]})
    } , function (e) {
        if (e.success) {
            
            //sort by distance to user location
            var latlon = new LatLon(req.query.lat, req.query.lon);
            
            console.log(JSON.stringify(latlon));
            
            var sortedPlaces = _.sortBy(e.places, function(place) {
                var distance = latlon.distanceTo(new LatLon(place.latitude, place.longitude));
                console.log("distance from user to " + place.name + " = " + distance + "km");
                place.distance = distance;
                return distance * 1;
            });
            console.log("sorted Offices: " + JSON.stringify(sortedPlaces));
            
            res.send(sortedPlaces);
        }
        else {
            console.log(JSON.stringify(e));
            res.send(500, {
                message: e.message,
                status: "ERROR"
            });
        }
    });
    
}
