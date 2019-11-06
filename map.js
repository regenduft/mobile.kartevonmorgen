    /* MAP FUNCTIONS */

    var mapStyle = 'Wikimedia';
    var mapOverlay = null;
    var resultMapLayer = null;
    var resultMapOverlay = null;
    var resultMapObj = null;
    var mapMarkers = {};

    var cityLat = null;
    var cityLon = null;

    function toggleMap() {
        backScrollY = null;
        if (!resultMapObj) {
            if (confirm('Karte laden? (Langsam auf alten Handies!)')) {
                initMap();
            }
        } else {
            var ele = document.getElementById('overMap');
            if (ele) {
                if (ele.style.display/*(!ele.style.left) || (ele.style.left !== '0' && ele.style.left !== '0px')*/) {
                    unhide(ele);
                    //ele.style.left = '0px';
                    ele.style.overflow = "";
                    document.getElementById('resultMapCtnr').style.left='380px';
                    document.getElementById('mapBtn').innerText = "Karte";
                    document.getElementById('hideSideBarBtnIcon').setAttribute('transform', 'rotate(0)');
                } else {
                    hide(ele);
                    //ele.style.left = "-380px";
                    ele.style.overflow = "hidden";
                    document.getElementById('resultMapCtnr').style.left='0px';
                    document.getElementById('mapBtn').innerText = "Liste";
                    document.getElementById('hideSideBarBtnIcon').setAttribute('transform', 'rotate(180) translate(-193 -512)');
                    if ((!searchResult) || ((!searchResult.visible) && (!searchResult.invisible))) {
                        find();
                    }
                }
            }
        }
    }

    function isMapInFront() {
        var ele = document.getElementById('overMap');
        return ele && ele.style.left && ele.style.left == '-300px';
    }

    function setMapProvider(newStyle, newOverlay) {
        mapStyle = newStyle;
        mapOverlay = newOverlay;
        if (resultMapObj) {
            if (resultMapLayer) {
                resultMapObj.removeLayer(resultMapLayer);
            }
            try {
                resultMapLayer = L.tileLayer.provider(mapStyle);
            } catch(exception) {
                resultMapLayer = L.tileLayer.provider('OpenStreetMap.DE');
            }
            resultMapObj.addLayer(resultMapLayer);
            if (mapStyle == 'Esri.WorldImagery') {
                document.getElementById('resultMap').classList.add('darkMap');
            } else {
                document.getElementById('resultMap').classList.remove('darkMap');
            }
            if (resultMapOverlay) {
                resultMapObj.removeLayer(resultMapOverlay);
            }
            if (mapOverlay) {
                try {
                    resultMapOverlay = L.tileLayer.provider(mapOverlay);
                    resultMapObj.addLayer(resultMapOverlay);
                } catch(exception) {
                    resultMapOverlay = null;
                    mapOverlay = null;
                }
            }
        }
        var ablauf = new Date();
        var in400Tagen = ablauf.getTime() + (400 * 24 * 60 * 60 * 1000);
        ablauf.setTime(in400Tagen);
        document.cookie = 'map='+mapStyle+'; path=/; expires=' + ablauf.toGMTString();
        document.cookie = 'ovl='+(mapOverlay ? mapOverlay : '') +'; path=/; expires=' + ablauf.toGMTString();
    }

    function doInitMap() {
        document.getElementById('mapBtn').style.display = 'inline-block';

        if (resultMapObj != null || (!L) || (!L.tileLayer) || (!L.tileLayer.provider)) {
            console.log(resultMapObj == null ?
                    "Leaflet Scripts not yet loaded." :
                    "Map is already loaded");
            return;
        }
        resultMapObj = L.map('resultMap', {
            center: [lat, lon],
            tapTolerance: 30,
            tap: true,
            zoom: 12,
            zoomControl: false
        });
        L.control.zoom({
            position:'bottomright'
       }).addTo(resultMapObj);

        setMapProvider(mapStyle, mapOverlay);

        resultMapObj.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]]);

        resultMapObj.on('moveend', function (event) {
            bbox = [resultMapObj.getBounds().getSouthWest().lat, resultMapObj.getBounds().getSouthWest().lng, resultMapObj.getBounds().getNorthEast().lat, resultMapObj.getBounds().getNorthEast().lng];
            lat = resultMapObj.getCenter().lat;
            lon = resultMapObj.getCenter().lng;
            if (resultMapObj.getZoom() < 15) {
                city = lat + ',' + lon;
                cityLat = null;
                cityLon = null;
                document.getElementById('city').placeholder = 'Ort: ' + city;
            } else {
                if ((!cityLat) || (!cityLon) || Math.abs(resultMapObj.getCenter().lat - cityLat) > 0.01 || Math.abs(resultMapObj.getCenter().lng - cityLon) > 0.018) {
                    document.getElementById('city').placeholder = 'Ort: ' + lat + ',' + lon;
                    mapCenter2City();
                }
            }
            disableOverlay = true;
            find();
            window.setTimeout(function () {
                disableOverlay = false;
            }, 333);
            saveCity();
            document.location.hash = ';' + lat + ',' + lon;
        });

        toggleMap();
        find();
    }

    function initMap() {

        var lfcss = document.createElement("LINK");
        lfcss.rel = "stylesheet";
        lfcss.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/leaflet.css";
        document.head.appendChild(lfcss);

        var facss = document.createElement("LINK");
        facss.rel = "stylesheet";
        facss.href = "https://wap.kartevonmorgen.org/map-icons/css/map-icons.min.css";
        document.head.appendChild(facss);


        var lfjs = document.createElement("SCRIPT");
        lfjs.type = "text/javascript";
        lfjs.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/leaflet.js";
        lfjs.onload = function() {
            var lfjs2 = document.createElement("SCRIPT");
            lfjs2.type = "text/javascript";
            lfjs2.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet-providers/1.3.1/leaflet-providers.min.js";
            lfjs2.onload = doInitMap;
            document.body.appendChild(lfjs2);
        };
        document.body.appendChild(lfjs);

        var mapBtnEle = document.getElementById('btnInitMap');
        if (mapBtnEle) {
            mapBtnEle.innerText="Karte zeigen";
            mapBtnEle.onclick=toggleMap;
        }
    }

    function removeUnnecessaryMapMarkers() {
        if (mapMarkers && resultMapObj) {
            for (e in mapMarkers) {
                var marker = mapMarkers[e];
                if (marker && ((!e.match) || !e.match(/^osm_.+/))) {
                    if ( ((!searchResult['visible'])   || (searchResult['visible']   && searchResult['visible'].indexOf(e) < 0))
                            && ((!searchResult['invisible']) || (searchResult['invisible'] && searchResult['invisible'].indexOf(e) < 0)) ) {
                        resultMapObj.removeLayer(marker);
                        delete mapMarkers[e];
                    }
                } else if (marker && !osmIsResult(e)) {
                    resultMapObj.removeLayer(marker);
                    delete mapMarkers[e];
                }
            }
        }
    }

    function addMapMarker(entry) {
        if (resultMapObj && (!mapMarkers[entry.id]) && entry && entry.lat && entry.lng) {
            var cat = categories && entry.categories && entry.categories.length
            && entry.categories[0] ? categories[entry.categories[0]] : null;
            mapMarkers[entry.id] = L.marker({lat:entry.lat, lng:entry.lng}, {icon: entry.ratings && entry.ratings.total && entry.ratings.total >= 0
                        ? L.divIcon({iconSize: [27,41], iconAnchor: [13,41], className:'mapMarker '     + (cat ? cat.name :'unknown'), html:'<i class="map-icon map-icon-map-pin"></i>'})
                        : L.divIcon({iconSize: [16,17], iconAnchor: [8,8], className:'mapMarkerCircle ' + (cat ? cat.name :'unknown'), html:'<i class="map-icon map-icon-circle"></i>'})
            });
            mapMarkers[entry.id].addTo(resultMapObj);
            mapMarkers[entry.id].bindPopup('<a href="#" onclick="displayDetails('+"'"+entry.id+"'"+');if(isMapInFront()){toggleMap();backScrollY=null;}else{backScrollY=-1;}event.preventDefault();return false;">'+entry.title+'</a>', {offset: entry.ratings && entry.ratings.total && entry.ratings.total >= 0 ? [0,10] : [0,30]});
            mapMarkers[entry.id].bindTooltip(entry.title, {direction: 'bottom'});
            mapMarkers[entry.id].on('click', createOnMarkerClickFunc(entry.id) );
        }
    }

    function createOnMarkerClickFunc(entryId) {
        return function(){ displayDetails(entryId);if(isMapInFront()){toggleMap();backScrollY=null;}else{backScrollY=-1;}};
    }

    function mapCenter2City() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4) {
                if (xhttp.status == 200 && xhttp.responseText) {
                    var res = JSON.parse(xhttp.responseText);
                    if (res && res.address) {
                        if (res.address.city || res.address.town || res.address.village) {
                            city = res.address.city ? res.address.city : res.address.town ? res.address.town : res.address.village;
                            document.getElementById('city').placeholder = 'Ort: ' + city;
                            cityLat = res.lat;
                            cityLon = res.lon;
                            saveCity();
                        }
                    }
                }
            }
        };
        xhttp.open("GET",
                'https://open.mapquestapi.com/nominatim/v1/reverse.php?key=SJpWKrsbH6PZGQ9KZvyibuGzRkXS1LAw' +
                '&format=json&zoom=18&lat=' + lat + '&lon=' + lon, true);
        xhttp.send();
    }
