    /* POI DISPLAY */

    var poiEnabled = true;
    var poiWithoutName = false;
    var poiMarkers = {};
    var poiBbox = null;
    var transportBox = null;
    var poiLoading = 0;
    var poiResult = {};

    function togglePoi() {
        poiEnabled = !poiEnabled;
        findPoi();
        var mele = document.getElementById('menuPoi');
        if (mele) {
            mele.style.fontWeight = poiEnabled ? 'bold' : 'normal';
        }
        var ablauf = new Date();
        var in400Tagen = ablauf.getTime() + (400 * 24 * 60 * 60 * 1000);
        ablauf.setTime(in400Tagen);
        document.cookie = 'poi='+(poiEnabled ? '1' : '0')+'; path=/; expires=' + ablauf.toGMTString();
    }

    function togglePoiWithoutName() {
        poiWithoutName = !poiWithoutName;
        findPoi();
        var mele = document.getElementById('menuPoiName');
        if (mele) {
            mele.style.fontWeight = poiWithoutName ? 'bold' : 'normal';
        }
        var ablauf = new Date();
        var in400Tagen = ablauf.getTime() + (400 * 24 * 60 * 60 * 1000);
        ablauf.setTime(in400Tagen);
        document.cookie = 'poiName='+(poiWithoutName ? '1' : '0')+'; path=/; expires=' + ablauf.toGMTString();
    }

    function findPoi() {
        if (poiEnabled && resultMapObj && resultMapObj.getZoom && resultMapObj.getZoom() > 16 && bbox && bbox.length && bbox.length >= 3) {
            if ((!poiBbox) || (!poiBbox.length) || (poiBbox.length < 3) || poiBbox[0] > bbox[0] || poiBbox[1] > bbox[1] || poiBbox[2] < bbox[2] || poiBbox[3] < bbox[3]) {
                for (e in poiMarkers) {
                    resultMapObj.removeLayer(poiMarkers[e]);
                    delete poiMarkers[e];
                }
                var poiBounds = (bbox[3] - bbox[1]) > 0.008 ? resultMapObj.getBounds().pad(0.2) : resultMapObj.getBounds().pad(1);
                poiBbox = [poiBounds.getSouthWest().lat, poiBounds.getSouthWest().lng, poiBounds.getNorthEast().lat, poiBounds.getNorthEast().lng];
                transportBox = poiBbox;
                poiResult = {};
                doFindPoi('node[~"^(office|shop|amenity|craft|restaurant|tourism|hiking)$"~"."];out qt;', poiBbox);
                doFindPoi('way[~"^(office|shop|amenity|craft|restaurant|tourism|hiking)$"~"."];out center qt;', poiBbox);
                doFindPoi('node[~"^(highway|railway|public_transport)$"~"^(station|platform|bus_stop|tram_stop|subway_entrance|halt)$"];out qt;', poiBbox);
            } else {
                for (e in poiMarkers) {
                    if ((!poiResult[e]) || (!poiResult[e].lat) || (!poiResult[e].lng) || (!bbox) || bbox.length < 3 || ((!poiWithoutName) && (!poiResult[e].name) )
                       || poiResult[e].lat < bbox[0] || poiResult[e].lat > bbox[2] || poiResult[e].lng < bbox[1] || poiResult[e].lng > bbox[3]) {
                        resultMapObj.removeLayer(poiMarkers[e]);
                        delete poiMarkers[e];
                    }
                }
                for (j in poiResult) {
                    addPoiMarker(poiResult[j]);
                }
            }
        } else if (resultMapObj && resultMapObj.getZoom && resultMapObj.getZoom() > 15 && bbox && bbox.length && bbox.length >= 3) {
            if ((!transportBox) || (!transportBox.length) || (transportBox.length < 3) || transportBox[0] > bbox[0] || transportBox[1] > bbox[1] || transportBox[2] < bbox[2] || transportBox[3] < bbox[3]) {
                for (e in poiMarkers) {
                    resultMapObj.removeLayer(poiMarkers[e]);
                    delete poiMarkers[e];
                }
                var poiBounds = (bbox[3] - bbox[1]) > 0.012 ? resultMapObj.getBounds().pad(0.2) : resultMapObj.getBounds().pad(1);
                transportBox = [poiBounds.getSouthWest().lat, poiBounds.getSouthWest().lng, poiBounds.getNorthEast().lat, poiBounds.getNorthEast().lng];
                poiBbox = null;
                poiResult = {};
                doFindPoi('node[~"^(highway|railway|public_transport)$"~"^(station|platform|bus_stop|tram_stop|subway_entrance|halt)$"];out qt;', transportBox);
            } else {
                for (e in poiMarkers) {
                    if ((!poiResult[e]) || (!poiResult[e].lat) || (!poiResult[e].lng) || (!bbox) || bbox.length < 3
                            || poiResult[e].lat < bbox[0] || poiResult[e].lat > bbox[2] || poiResult[e].lng < bbox[1] || poiResult[e].lng > bbox[3]
                            || (!(poiResult[e].tags.highway ||poiResult[e].tags.railway || poiResult[e].tags.public_transport))
                        ) {
                        resultMapObj.removeLayer(poiMarkers[e]);
                        delete poiMarkers[e];
                    }
                }
                for (j in poiResult) {
                    if (poiResult[j] && (poiResult[j].tags.highway || poiResult[j].tags.railway || poiResult[j].tags.public_transport)) {
                        addPoiMarker(poiResult[j]);
                    }
                }
            }
        } else {
            for (e in poiMarkers) {
                resultMapObj.removeLayer(poiMarkers[e]);
                delete poiMarkers[e];
            }
        }
    }

    function doFindPoi(query, myBbox) {
        var xhttp = new XMLHttpRequest();
        //showWait(null, xhttp);
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4) {
                if (xhttp.status == 200) {
                    poiLoading--;
                    if (poiLoading <= 0) {
                        var elem = document.getElementById('poiloading');
                        if (elem) {
                            elem.style.display = 'none';
                        }
                    }
                    var response = JSON.parse(xhttp.responseText);
                    var res = response ? response.elements : response;
                    if (res) {
                        for (var e in res) {
                            if (res[e] && res[e].id && res[e].tags
                             && ((res[e].tags.office && res[e].tags.office != 'no')
                                || (res[e].tags.shop && res[e].tags.shop != 'no')
                                || (res[e].tags.amenity && res[e].tags.amenity != 'no')
                                || (res[e].tags.craft && res[e].tags.craft != 'no')
                                || (res[e].tags.restaurant && res[e].tags.restaurant != 'no')
                                || (res[e].tags.tourism && res[e].tags.tourism != 'no')
                                || (res[e].tags.hiking && res[e].tags.hiking != 'no')
                                || (res[e].tags.highway && res[e].tags.highway != 'no')
                                || (res[e].tags.railway && res[e].tags.railway != 'no')
                                || (res[e].tags.public_transport && res[e].tags.public_transport != 'no')
                            )) {
                                displayPoi(res[e]);
                            }
                        }
                    }
                }
            }
        };
        xhttp.open("GET",
                'https://overpass.kumi.systems/api/interpreter/?data=[out:json][timeout:180][bbox:'
                + myBbox.join(',') + '];' + query
                , true);
        xhttp.send();
        poiLoading++;
    }

    function displayPoi(osmEntry) {
        var poi = {
            id: 'osm_' + osmEntry.id,
            name: osmEntry.tags.name,
            title: osmEntry.tags.name ? osmEntry.tags.name : osmEntry.tags.shop ? ('shop: ' + osmEntry.tags.shop) : osmEntry.tags.amenity ? ('poi: ' + osmEntry.tags.amenity) : osmEntry.tags.craft ? ('craft: ' + osmEntry.tags.craft) : osmEntry.tags.office ? ('office: ' + osmEntry.tags.office) : 'unknown',
            lat: osmEntry.center ? osmEntry.center.lat : osmEntry.lat,
            lng: osmEntry.center ? osmEntry.center.lon : osmEntry.lon,
            homepage: osmEntry.tags['website'] ? osmEntry.tags['website'] :
                    osmEntry.tags['url'] ? osmEntry.tags['url'] :
                            osmEntry.tags['contact:website'],
            tags: osmEntry.tags,
            license: '© OpenStreetMap.org contributors, ODbL',
            origin: 'openstreetmap.org'
        }
        if (!poiMarkers[poi.id]) {
            poiResult[poi.id] = poi;
            addPoiMarker(poi);
        }
    }

    function addPoiMarker(entry) {
        if (resultMapObj && entry && (entry.name || poiWithoutName) && (!poiMarkers[entry.id]) && entry.lat && entry.lng && bbox && bbox.length >= 3
            && entry.lat >= bbox[0] && entry.lat <= bbox[2] && entry.lng >= bbox[1] && entry.lng <= bbox[3]) {
            poiMarkers[entry.id] = L.marker({lat:entry.lat, lng:entry.lng}, {icon:
                    L.divIcon({iconSize: [24,24],
                        iconAnchor:[12,12], className:'poiMarker ', html:'<i class="map-icon map-icon-'+getMapIconName(entry)+'"></i>'})});
            poiMarkers[entry.id].addTo(resultMapObj);
            var href = entry.homepage && entry.homepage.trim ? entry.homepage.trim() : '';
            if (entry.tags && entry.name && (entry.tags.highway || entry.tags.railway || entry.tags.public_transport)) {
                poiMarkers[entry.id].bindPopup('<a href="https://mobile.bahn.de/bin/mobil/bhftafel.exe/dox?productsFilter=1111111111000000&input=' + encodeURIComponent(entry.name + (entry.name.indexOf(city)>=0 ? '' : (', ' + city))) + '" target="_blank">'+entry.name+'</a>');
            } else {
                poiMarkers[entry.id].bindPopup(
                        (entry.name ? '<a href="https://duckduckgo.com/?q=' + encodeURIComponent(entry.name + ' ' + city) + '" target="_blank"><i class="map-icon map-icon-search"></i></a>&#160;' : '')
                        + '<a' + (href ? ' href="' + ((!href) || (!href.indexOf) || (href.trim().indexOf('http') == 0) ? '' : 'http://') + href : '') + '" target="_blank">' + entry.title + '</a>'
                );
            }
        }
    }

    function getMapIconName(poi) {
        var fallback = tagMap.fall_back;
        if (poi && poi.tags) {
            for (k in poi.tags) {
                var myMap = tagMap[k];
                if (myMap) {
                    var res = myMap[poi.tags[k]];
                    if (res) {
                        return res;
                    }
                    if (myMap.fall_back) {
                        fallback = myMap.fall_back;
                    }
                }
            }
        }
        return fallback;
    }

    var tagMap = {
        amenity: {
            fall_back: 'postal-code',
            parking: 'parking',
            place_of_worship: 'place-of-worship',
            school: 'school',
            bench: 'park',
            restaurant: 'restaurant',
            fuel: 'gas-station',
            cafe: 'cafe',
            fast_food: 'food',
            bank: 'bank',
            post_box: 'post-box',
            pharmacy: 'health',
            kindergarten: 'playground',
            recycling: 'snow green',
            grave_yard: 'cemetery',
            waste_basket: 'route',
            bicycle_parking: 'bicycling',
            toilets: 'toilet',
            shelter: 'roofing-contractor',
            hospital: 'hospital',
            post_office: 'post-office',
            pub: 'bar',
            drinking_water: 'plumber',
            public_building: 'political',
            atm: 'atm',
            telephone: 'volume-control-telephone',
            bar: 'bar',
            police: 'police',
            fire_station: 'fire-station',
            parking_space: 'parking',
            hunting_stand: 'archery',
            townhall: 'city-hall',
            vending_machine: 'storage',
            /*fountain: '',*/
            doctors: 'doctor',
            library: 'library',
            social_facility: 'walking',
            car_wash: 'car-wash',
            university: 'university',
            swimming_pool: 'swimming',
            /*community_centre: '',*/
            college: 'university',
            dentist: 'dentist',
            waste_disposal: 'route',
            marketplace: 'convenience-store',
            bus_station: 'bus-station',
            clinic: 'hospital',
            parking_entrance: 'parking',
            taxi: 'taxi-stand',
            theatre: 'movie-theater',
            bicycle_rental: 'bicycle-store',
            cinema: 'movie-theater',
            veterinary: 'veterinary-care',
            mobile_money_agent: 'finance',
            courthouse: 'courthouse',
            nightclub: 'night-club',
            arts_centre: 'art-gallery',
            bbq: 'restaurant',
            nursing_home: '',
            ferry_terminal: 'boat-tour',
            grit_bin: '',
            car_rental: 'car-rental',
            clock: 'compass',
            shower: 'hair-care',
            biergarten: 'restaurant',
            driving_school: '',
            charging_station: '',
            embassy: 'government',
            ice_cream: 'cafe',
            prison: 'police',
            water_point: 'plumber',
            car_sharing: 'car-rental',
            childcare: 'playground',
            emergency_phone: 'volume-control-telephone',
            bureau_de_change: 'finance',
            motorcycle_parking: 'motobike-trail',
            studio: '',
            residential: '',
            shop: 'department-store',
            food_court: '',
            watering_place: '',
            boat_storage: 'boating',
            casino: 'casino',
            sauna: '',
            Residential: '',
            brothel: '',
            kiosk: 'convenience-store',
            retirement_home: '',
            gambling: '',
            game_feeding: '',
            compressed_air: '',
            bicycle_repair_station: 'bicycle-store',
            'parking;fuel': '',
            social_centre: 'walking',
            payment_terminal: '',
            register_office: '',
            kneipp_water_cure: '',
            advertising: '',
            public_bookcase: '',
            dojo: '',
            lavoir: '',
            boat_rental: '',
            gym: '',
            monastery: '',
            sanitary_dump_station: '',
            ticket_validator: '',
            garages: '',
            office: '',
            animal_shelter: '',
            training: '',
            vehicle_inspection: '',
            internet_cafe: '',
            water: '',
            public_hall: '',
            ranger_station: '',
            stables: '',
            stripclub: '',
            dancing_school: '',
            refugee_housing: '',
            events_venue: '',
            money_transfer: '',
            feeding_place: '',
            love_hotel: '',
            mortuary: '',
            crematorium: '',
            weighbridge: '',
            sanatorium: '',
            emergency_service: 'health',
            nursery: '',
            dive_centre: '',
            customs: ''
        },
        shop: {
            fall_back: 'department-store',
            convenience : 'convenience-store',
            supermarket: 'grocery-or-supermarket',
            clothes: 'clothing-store',
            hairdresser: 'beauty-salon',
            bakery: 'bakery',
            car: 'car-dealer',
            car_repair: 'car-repair',
            kiosk: 'convenience-store',
            doityourself: 'hardware-store',
            butcher: '',
            florist: 'florist',
            mall: 'shopping-mall',
            furniture: 'furniture-store',
            shoes: 'clothing-store',
            hardware: 'hardware-store',
            electronics: 'point-of-interest',
            alcohol: 'night-club',
            beauty: 'beauty-salon',
            bicycle: 'bicycle-store',
            books: 'book-store',
            mobile_phone: 'point-of-interest',
            jewelry: 'jewelry-store',
            department_store: 'department-store',
            optician: '',
            gift: '',
            car_parts: '',
            greengrocer: 'convenience-store',
            chemist: '',
            variety_store: 'convenience-store',
            sports: '',
            computer: '',
            travel_agency: 'travel-agency',
            stationery: '',
            garden_centre: 'florist',
            confectionery: '',
            laundry: 'laundry',
            beverages: 'liquor-store',
            newsagent: '',
            toys: '',
            pet: '',
            dry_cleaning: '',
            vacant: '',
            motorcycle: '',
            boutique: '',
            tyres: '',
            deli: '',
            copyshop: '',
            funeral_directors: '',
            hifi: '',
            outdoor: 'climbing',
            art: 'art-gallery',
            farm: 'horse-riding',
            tailor: '',
            interior_decoration: '',
            tobacco: '',
            seafood: 'fish-cleaning',
            photo: 'point-of-interest',
            fabric: '',
            kitchen: '',
            paint: '',
            massage: '',
            second_hand: '',
            ticket: '',
            video: '',
            estate_agent: '',
            wine: '',
            music: '',
            trade: '',
            lottery: '',
            pawnbroker: '',
            charity: 'walking',
            antiques: '',
            cosmetics: '',
            bed: '',
            musical_instrument: '',
            bookmaker: '',
            tattoo: '',
            houseware: '',
            general: '',
            fashion: '',
            medical_supply: '',
            craft: '',
            baby_goods: '',
            hearing_aids: '',
            fishmonger: '',
            carpet: '',
            tea: '',
            bag: '',
            erotic: '',
            coffee: '',
            curtain: '',
            frame: '',
            video_games: '',
            ice_cream: '',
            food: '',
            locksmith: '',
            money_lender: '',
            bathroom_furnishing: '',
            energy: '',
            cheese: '',
            dairy: '',
            glaziery: '',
            organic: '',
            herbalist: '',
            fishing: '',
            pastry: '',
            chocolate: '',
            perfumery: '',
            radiotechnics: '',
            grocery: '',
            gas: '',
            scuba_diving: '',
            photo_studio: '',
            insurance: '',
            wholesale: '',
            watches: '',
            electrical: '',
            'e-cigarette': '',
            shoe_repair: '',
            leather: '',
            winery: '',
            furnace: '',
            religion: '',
            hunting: '',
            motorcycle_repair: '',
            vacuum_cleaner: '',
            solarium: '',
            frozen_food: '',
            fish: '',
            household: '',
            street_vendor: '',
            weapons: '',
            lighting: '',
            sewing: '',
        },
        craft: {
            fall_back: 'hardware_store',
            carpenter: '',
            shoemaker: '',
            photographer: '',
            electrician: '',
            brewery: '',
            winery: '',
            tailor: '',
            confectionery: '',
            plumber: '',
            metal_construction: '',
            sawmill: '',
            hvac: '',
            gardener: '',
            painter: '',
            stonemason: '',
            handicraft: '',
            dressmaker: '',
            glaziery: '',
            caterer: '',
            key_cutter: '',
            pottery: '',
            beekeeper: '',
            roofer: '',
            blacksmith: '',
            window_construction: '',
            photographic_laboratory: '',
            upholsterer: '',
            locksmith: '',
            clockmaker: '',
            tiler: '',
            jeweller: '',
            distillery: '',
            optician: '',
            watchmaker: '',
            agricultural_engines: '',
            joiner: '',
            builder: '',
            electronics_repair: 'point-of-interest',
            tinsmith: '',
            bookbinder: '',
            plasterer: '',
            scaffolder: '',
            carpet_layer: '',
            boatbuilder: '',
            cabinet_maker: '',
            electronics: 'point-of-interest',
            saddler: '',
            catering: '',
            sculpter: '',
            computer: '',
            confectionary: ''
        },
        office: {
            fall_back: 'city-hall',
            company: 'insurance-agency',
            government: '',
            estate_agent: 'estate-agency',
            insurance: 'insurance-agency',
            administrative: '',
            lawyer: 'lawyer',
            educational_institution: 'museum',
            telecommunication: '',
            ngo: 'museum',
            it: '',
            accountant: 'finance',
            research: 'university',
            employment_agency: '',
            religion: 'synagogue',
            physician: 'physiotherapist',
            association: '',
            architect: '',
            travel_agent: 'travel-agency',
            newspaper: '',
            financial: 'financial',
            therapist: '',
            political_party: '',
            advertising_agency: '',
            tax_advisor: 'financial',
            notary: 'financial',
            tax: 'financial',
            foundation: '',
            parish: '',
            vacant: '',
            consulting: '',
            camping: 'campground',
            forestry: '',
            publisher: '',
            quango: '',
            administration: '',
            register: '',
            cooperative: '',
            podologist: '',
            charity: 'walking',
            logistics: 'moving-company',
            engineering: '',
            solicitor: '',
            healer: '',
            water_utility: '',
            taxi: 'taxi-stand',
            university: 'university',
            commercial: '',
            real_estate: 'real-estate-agency',
            medical: 'doctor',
            education: 'school',
        },
        restaurant: {
            fall_back: 'restaurant'
        },
        tourism: {
            fall_back: 'natural-feature',
            information: 'travel-agency',
            hotel: 'lodging',
            attraction: '',
            viewpoint: '',
            picnic_site: 'park',
            camp_site: 'campground',
            guest_house: 'lodging',
            museum: 'museum',
            artwork: 'art-gallery',
            motel: 'lodging',
            chalet: '',
            hostel: 'lodging',
            caravan_site: 'rv-park',
            alpine_hut: 'roofing-contractor',
            theme_park: 'amusement-park',
            zoo: 'zoo',
            apartment: 'lodging',
            wilderness_hut: 'roofing-contractor',
            gallery: 'art-gallery',
            bed_and_breakfast: 'lodging',
            hanami: '',
            wine_cellar: 'night-club',
            resort: 'lodging',
            trail_riding_station: '',
            disused_camp_site: 'roofing-contractor',
            aquarium: 'aquarium',
            apartments: 'lodging',
            cabin: 'roofing-contractor',
            winery: 'night-club',
            lean_to: '',
            hut: 'roofing-contractor',
            picnic_table: 'park',
            village_sign: 'viewing',
            sign: 'viewing',
            camping: 'campground'
        },
        hiking: {
            fall_back: 'trail-walking',
            no: ''
        },
        highway: {
            fall_back: 'bus-station',
            bus_stop: 'bus-station',
            platform: 'bus-station'
        },
        railway: {
            fall_back: 'train-station',
            station: 'train-station',
            platform: 'train-station',
            tram_stop: 'train-station',
            subway_entrance: 'subway-station'
        },
        public_transport: {
            fall_back: 'bus-station',
            station: 'train-station',
            tram_stop: 'train-station',
            bus_stop: 'bus-station',
            subway_entrance: 'subway-station'
        },
        fall_back: 'embassy'
    }
