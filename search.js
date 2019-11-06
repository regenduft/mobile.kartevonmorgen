    /*  CITY SEARCH AND SELECTION  */

    function gotoCity(addr) {
        var xhttp = new XMLHttpRequest();
        if (!showWait()) {
            return;
        }
        showWait(null, xhttp);
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4) {
                if (xhttp.status == 200) {
                    displayCities(JSON.parse(xhttp.responseText));
                    hideWait();
                } else {
                    hideWait('Internet Verbindung.');
                }
            }
        };
        xhttp.open("GET",
                'https://nominatim.openstreetmap.org/search' +
                '?format=json&addressdetails=1&q=' +
                (document.getElementById('city').value || !addr ? document.getElementById('city').value : addr) +
                ' DE'
                , true);
        xhttp.send();
    }

    function displayCities(cities) {
        var resultCtnr = document.getElementById('cities');
        while (resultCtnr.childElementCount > 0) {
            resultCtnr.removeChild(resultCtnr.firstElementChild);
        }
        if ((!cities) || cities.length == 0) {
            var title = document.createElement('DIV');
            title.innerText = "Nichts gefunden! Vollständigen Namen oder PLZ eingeben.";
            title.className="title";
            resultCtnr.appendChild(title);
        } else {
            var title = document.createElement('DIV');
            title.innerText = "Stadt auswählen / anklicken:";
            title.className="title";
            resultCtnr.appendChild(title);
            var found = false;
            var foundLat = '';
            var foundLon = '';
            var foundCity = '';
            var mapVisible = isMapInFront();
            for (var e in cities) {
                var city = cities[e];
                if ((city.type == 'administrative' || city.type == 'city' ||
                        city.type == 'town' || city.type == 'village' ||
                        city.type == 'postcode') &&
                        ((!city.address) || (!city.address.country_code) ||
                        city.address.country_code == 'de' ||
                        city.address.country_code == 'DE' ||
                        city.address.country_code == 'De')) {
                    var ctnr = document.createElement('A');

                    if (city.address.city) {
                        ctnr.innerText = city.address.city;
                    }
                    if (city.address.town) {
                        ctnr.innerText += (ctnr.innerText ? ', ' : '') +
                                city.address.town;
                    }
                    if (city.address.village) {
                        ctnr.innerText += (ctnr.innerText ? ', ' : '') +
                                city.address.village;
                    }

                    var myCity = ctnr.innerText || city.display_name;

                    if (((foundLat === '' || foundLat == city.lat) && (foundLon === '' || foundLon == city.lon))
                            || (foundLat && city.lat && Math.round(foundLat*10) == Math.round(city.lat*10) && foundLon && city.long && Math.round(foundLon*10) == Math.round(city.lon*10) && foundCity && myCity && (foundCity.indexOf(myCity)) >= 0 || myCity.indexOf(foundCity) >= 0)
                    ) {
                        foundLat = city.lat;
                        foundLon = city.lon;
                        if(!foundCity) {
                            foundCity = ctnr.innerText;
                        }
                    } else {
                        foundLat = null;
                        foundLon = null;
                        foundCity = null;
                    }

                    if (city.type == 'administrative' && city.address.county) {
                        ctnr.innerText += (ctnr.innerText ? ', ' : '') +
                                'Kreis ' + city.address.county;
                    }
                    else if (city.address.postcode) {
                        if (ctnr.innerText) {ctnr.innerText += ' ' + city.address.postcode}
                        else {ctnr.innerText = city.address.postcode;}
                    }
                    if (!ctnr.innerText) {
                        ctnr.innerText = city.display_name;
                    }

                    ctnr.onclick = createGoto(ctnr.innerText, city.lat, city.lon, mapVisible);


                    ctnr.href = "#";
                    resultCtnr.appendChild(ctnr);
                    found = true;
                }
            }
            if (foundLon && foundLat && foundCity) {
                goto(foundCity, foundLat, foundLon);
            } else {
                if (mapVisible) {
                    toggleMap();
                }
                if (!found) {
                    while (resultCtnr.childElementCount > 0) {
                        resultCtnr.removeChild(resultCtnr.firstElementChild);
                    }
                    var title = document.createElement('DIV');
                    title.innerText = "Nichts gefunden! Vollständigen Namen oder PLZ eingeben.";
                    title.className="title";
                    resultCtnr.appendChild(title);
                }
            }
        }
    }

    function createGoto(text, nlat, nlon, map) {
        return function(event) {
            goto(text, nlat, nlon);
            if (map) {
                toggleMap();
            }
            event.preventDefault();
            return false;
        }
    }

    function goto(new_city, new_lat, new_lon) {

        city = new_city;
        lat = parseFloat(new_lat);
        lon = parseFloat(new_lon);
        bbox = [lat - 0.1, lon - 0.12, lat + 0.1, lon + 0.12];
        document.getElementById('city').placeholder = 'Ort: ' + city;
        document.getElementById('city').value = '';
        var resultCtnr = document.getElementById('cities');
        while (resultCtnr.childElementCount > 0) {
            resultCtnr.removeChild(resultCtnr.firstElementChild);
        }
        saveCity();
        if (resultMapObj) {
            resultMapObj.fitBounds([[bbox[0],bbox[1]],[bbox[2],bbox[3]]]);
        }
        find();
    }
