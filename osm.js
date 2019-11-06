    /* OPEN STREET MAP SEARCH */

    var osmEnabled = false;
    var osmBbox = null;

    var osmLoading = 0;

    function findOsm() {
        var resultCtnr = document.getElementById('openstreetmap');
        while (resultCtnr.childElementCount > 0) {
            resultCtnr.removeChild(resultCtnr.firstElementChild);
        }
        var head = document.createElement("H3");
        head.innerText = "Open Street Map Results:"
        resultCtnr.appendChild(head);
        if (osmEnabled && osmBbox && bbox && bbox.length == 4 && osmBbox.length == 4 &&
                osmBbox[0] && osmBbox[1] && osmBbox[2] && osmBbox[3] &&
                bbox[0] && bbox[1] && bbox[2] && bbox[3] &&
                osmBbox[0] <= bbox[0] && osmBbox[1] <= bbox[1] && osmBbox[2] >=
                bbox[2] && osmBbox[3] >= bbox[3]) {
            for (var e in cache) {
                if (e && e.match(/^osm_/) ) {
                    displayOsmFromCache(e);
                }
            }
            findPoi();
            return;
        }
        if (mapMarkers && resultMapObj) {
            for (e in mapMarkers) {
                var marker = mapMarkers[e];
                if (marker && e.match && e.match(/^osm_.+/)) {
                    resultMapObj.removeLayer(marker);
                    delete mapMarkers[e];
                }
            }
        }
        if (osmEnabled && bbox && bbox.length == 4 && Math.abs(bbox[2] - bbox[0]) <= 0.201 && Math.abs(bbox[3] - bbox[1]) <= 0.241) {
            osmBbox = [(bbox[2] + bbox[0])/2 - 0.1,
                (bbox[3] + bbox[1])/2 - 0.12,
                (bbox[2] + bbox[0])/2 + 0.1,
                (bbox[3] + bbox[1])/2 + 0.12];

            var loading = document.createElement("DIV");
            loading.className = "loading";
            loading.innerText = "lade Daten...";
            loading.id = "osmloading"
            resultCtnr.appendChild(loading);

            var ebtn = document.getElementById('btnOpenStreetMap');
            if (ebtn) {
                ebtn.innerText="Lade von OSM..."
            }

            doFindOsm('node[~"^(organic|diet:vegan|diet:vegetarian|fair_trade|regional|second_hand|charity|ngo|identity)$"~"^([^nN].*|[nN][^oO].*|[nN][oO].+)$"];out qt;');
            doFindOsm('way[~"^(organic|diet:vegan|diet:vegetarian|fair_trade|regional|second_hand|charity|ngo|identity)$"~"^([^nN].*|[nN][^oO].*|[nN][oO].+)$"];out center qt;');
            doFindOsm('node[~"^(office|shop|leisure|craft)$"~"^(organic|diet:vegan|diet:vegetarian|fair_trade|second_hand|charity|ngo|farm|garden|beekeeper|dressmaker|handicraft|pottery|beekeper|electronics_repair|basket_maker)$"];out qt;');
            doFindOsm('way[~"^(office|shop|craft)$"~"^(organic|diet:vegan|diet:vegetarian|fair_trade|second_hand|charity|ngo|farm|garden|beekeeper|dressmaker|handicraft|pottery|beekeper|electronics_repair|basket_maker)$"];out center qt;');


        } else if (osmEnabled || (bbox && bbox.length == 4 && (Math.abs(bbox[2] - bbox[0]) > 0.201 || Math.abs(bbox[3] - bbox[1]) > 0.241))) {
            var ebtn = document.getElementById('btnOpenStreetMap');
            if (ebtn) {
                ebtn.innerText="ZOOM for OSM!"
            }
            osmBbox = null;
        } else {
            var ebtn = document.getElementById('btnOpenStreetMap');
            if (ebtn) {
                ebtn.innerText="OpenStreetMap"
            }
        }

        findPoi();
    }

    function doFindOsm(query) {
        var xhttp = new XMLHttpRequest();
        //showWait(null, xhttp);
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4) {
                if (xhttp.status == 200) {
                    osmLoading--;
                    if (osmLoading <= 0) {
                        var elem = document.getElementById('osmloading');
                        if (elem) {
                            elem.style.display = 'none';
                        }
                        var ebtn = document.getElementById('btnOpenStreetMap');
                        if (ebtn) {
                            ebtn.innerText="OpenStreetMap"
                        }
                    }
                    var response = JSON.parse(xhttp.responseText);
                    var res = response ? response.elements : response;
                    if (res) {
                        for (var e in res) {
                            if (res[e]&& res[e].tags && res[e].tags.name &&
                                    ((!res[e].tags.shop) || res[e].tags.shop != 'car')) {

                                displayOsm(res[e]);
                            }
                        }
                    }
                } else {
                    var resultCtnr = document.getElementById('openstreetmap');
                    var osmerr = document.createElement("DIV");
                    osmerr.className = "loaderr";
                    osmerr.innerText = "Server nicht erreichbar";
                    resultCtnr.appendChild(osmerr);
                }
            }
        };
        xhttp.open("GET",
                'https://overpass.kumi.systems/api/interpreter/?data=[out:json][timeout:180][bbox:'
                + osmBbox.join(',') + '];' + query
                , true);
        xhttp.send();
        osmLoading++;
    }

    function displayOsm(osmEntry) {
        var entry = {
            id: 'osm_' + osmEntry.id,
            title: osmEntry.tags.name,
            lat: osmEntry.center ? osmEntry.center.lat : osmEntry.lat,
            lng: osmEntry.center ? osmEntry.center.lon : osmEntry.lon,
            description: getEntryType(osmEntry),
            street: osmEntry.tags['addr:street'],
            zip: osmEntry.tags['addr:postcode'] ?
                    osmEntry.tags['addr:postcode'] : osmEntry.tags['addr:zip'],
            city: osmEntry.tags['addr:city'] ? osmEntry.tags['addr:city']
                    : osmEntry.tags['addr:town'] ? osmEntry.tags['addr:town']
                    : osmEntry.tags['addr:village'],
            homepage: osmEntry.tags['website'] ? osmEntry.tags['website'] :
                    osmEntry.tags['url'] ? osmEntry.tags['url'] :
                            osmEntry.tags['contact:website'],
            tags: osmEntry.tags,
            license: '© OpenStreetMap.org contributors, ODbL',
            origin: 'openstreetmap.org'
        }

        cache[entry.id] = entry;

        displayOsmFromCache(entry.id);
    }

    function displayOsmFromCache(entryId) {
        if (osmIsResult(entryId)) {
            var entry = cache[entryId];
            if (entry && entry.lat >= bbox[0] && entry.lat <= bbox[2] &&
                    entry.lng >= bbox[1] && entry.lng <= bbox[3]) {
                var resultCtnr = document.getElementById('openstreetmap');
                var osmCtnr = document.createElement("DIV");
                osmCtnr.className = "entry";
                osmCtnr.onclick = createShowFunc(osmCtnr, entryId);

                var title = document.createElement("A");
                title.innerText = entry.title;
                title.href = '#' + entryId;
                title.onclick = osmCtnr.onclick;

                var desc = document.createElement("DIV");
                desc.innerText = entry.description;

                osmCtnr.appendChild(title);
                osmCtnr.appendChild(desc);
                resultCtnr.appendChild(osmCtnr);
            }

            if (!mapMarkers[entry.id]) {
                addMapMarker(entry);
            }
        }
    }

    function osmIsResult(entryId) {
        var filter = document.getElementById('text');
        if (filter && filter.value) {
            var entry = cache[entryId];
            if (entry && entry.tags) {
                for (var e in entry.tags) {
                    if (e.indexOf(filter.value) >= 0) {
                        return true;
                    }
                    if (entry.tags[e] && entry.tags[e].indexOf(filter.value) >= 0) {
                        return true;
                    }
                }
            }
            return false;
        } else {
            return true;
        }
    }

    function getEntryType(osmEntry) {
        var res = '';
        if (osmEntry && osmEntry.tags) {
            for (tag in osmEntry.tags) {
                if (tag && tag.match(/^(office|shop|leisure|craft|organic|diet:vegan|diet:vegetarian|fair_trade|regional|second_hand|charity|ngo|identity)$/) ) {
                    res += capitalizeFirstLetter(tag) + ": " + osmEntry.tags[tag] + ', ';
                }
            }
        }
        return res + '\n  © OpenStreetMap.org contributors, ODbL';
    }

    function getOsmResults(ids, callback) {
        // do nothing.
    }
