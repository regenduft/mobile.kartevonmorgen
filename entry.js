
    /* ENTRY DETAILS VIEW */

    function displayDetails(id) {
        if (cache[id] == null) {
            getResults([id], doDisplayDetails);
        } else {
            doDisplayDetails([id]);
        }
    }

    function doDisplayDetails(ids) {
        var entry = cache[ids[0]];

        /*      categories: (1) […]
        0: "77b3c33a92554bcf8e8c2c86cedd6f6f"
    city: "Stuttgart"
    country: null
    created: 1549735281
    description: "long long text"
    email: "post@slowtec.de"
    homepage: "http://www.slowtec.de/"
    id: "4c20979fe0754e74875afa4308d73ce7"
    image_link_url: "https://slowtec.de/"
    image_url: "https://slowtec.de/images/slowtec_sinn_voll_entwickeln.png"
    lat: 48.720333561636664
    license: "CC0-1.0"
    lng: 9.152239220753424
    ratings: (5) […]
        0: "3f9859013b404843ba5a64daf48a20d2"
        ​​​1: "6a9896d8cd4e45319919f185a84ff015"
        ​​​2: "0e65bc0f7a46467a8db1a8a53b76b677"
        ​​​3: "f3acab513e2e4a2ab66197a8d4cea3e6"
        ​​​4: "281bfdfef8124b3e8b643150fe61daed"
    street: "Friedrichsberg 55"
    tags: (20) […]
        0: "assoziativ"
        ​​​1: "ie-stationsidee"
        ​​​2: "ingenieurbüro"
    telephone: null
    title: "slowtec GmbH"
    version: 38
    zip: "70567" */



        location.hash = entry.id + ';' + (resultMapObj ? (lat + ',' + lon) : city);
        displayedEntry = entry;

        var detailsCtnr = document.getElementById("details");
      /*  while (detailsCtnr.childElementCount > 2) {
            detailsCtnr.removeChild(detailsCtnr.firstElementChild.nextElementSibling);
        }*/
        detailsCtnr.style.display = "block";

        if (!entry.ratings || entry.ratings.length == 0) {
            displayDetailsRatings([]);
        }

        for (var key in entry) {
            if (key == 'ratings') {
                if (entry[key].length > 0) {
                    getRatings(entry[key], displayDetailsRatings);
                }

            } else if (key != 'id' && key != 'created' && key != 'lat' && key !=
                    'lon' && key != 'lng' && key != 'version') {

                var lbl = findChildWithId(detailsCtnr, 'details_' + key);
                var ctnr = findChildWithId(detailsCtnr, 'details_' + key + '_ctnr');
                hide(lbl);
                hide(ctnr);
                if (lbl && entry[key]) {
                    var value = entry[key];

                    if (key == 'categories') {
                        if (entry[key].length > 0) {
                            value = categories[entry[key][0]].name
                            lbl.className = 'iRaMrp ' + categories[entry[key][0]].name.toLowerCase().replace('unternehmen', 'company');
                        }
                    }
                    if (key == 'tags') {
                        var tag = document.getElementById('details_tag');
                        if (tag) {
                            hide(tag);
                            lbl.innerHTML = '';
                            lbl.appendChild(tag);
                            for (var v in value) {
                                tag2 = tag.cloneNode(true);
                                unhide(tag2);
                                setInnerTextOfChildWithIdAndRemoveId(tag2, 'details_tagname', '#'+value[v]);
                                lbl.appendChild(tag2);
                            }
                        }
                    } else {

                        lbl.innerText = value;

                    }

                    if (key == 'homepage') {
                        lbl.href = entry[key].match(/^https?:\/\//) ? entry[key] : ('https://' + encodeURI(entry[key]));
                    }
                    if (key == 'email') {
                        lbl.href = entry[key].match(/^mailto?:/) ? entry[key] : ('mailto:' + encodeURI(entry[key]));
                    }
                    if (key == 'telephone') {
                        lbl.href = entry[key].match(/^mailto?:/) ? entry[key] : ('tel:' + encodeURI(entry[key]));
                    }
                    unhide(lbl);
                    unhide(ctnr);
                }
            }
        }

        var sre = findEntryInCache(entry.id);
        if (sre) {
            updateRatingFlower(sre, detailsCtnr, 'details_flower_', false);
            updateRatingFlower(sre, detailsCtnr, 'details_rating_', false);
        }

        var lbl = document.getElementById('details_route');
        if (lbl) {
            lbl.href='https://graphhopper.com/maps/?point='
                + encodeURIComponent(entry.street ? entry.street : '') + '+' + encodeURIComponent(entry.zip ? entry.zip : '') + '+' + encodeURIComponent(entry.city ? entry.city : '') + '+' + encodeURIComponent(entry.country ? entry.country : '')
                + '&amp;locale=de-DE&amp;vehicle=bike&amp;weighting=fastest&amp;elevation=false&amp;use_miles=false&amp;layer=Omniscale';
        }

        var ctnr = document.createElement("DIV");
        if (detailsCtnr.firstElementChild.nextElementSibling.firstChild.className == 'mapLink') {
            detailsCtnr.removeChild(detailsCtnr.firstElementChild.nextElementSibling);
        }
        detailsCtnr.insertBefore(ctnr,
                detailsCtnr.firstElementChild.nextElementSibling);

        var iMob = navigator.userAgent.indexOf('iPhone') >= 0  || navigator.userAgent.indexOf('iPad') >= 0 || navigator.userAgent.indexOf('iPod') >=0;
        var andy = navigator.userAgent.indexOf('Android') >= 0;
        var winp = navigator.userAgent.indexOf('Windows Phone') >= 0;

        if (iMob || andy || winp) {
            var map = document.createElement('A');
            if (winp) {
                map.href = 'maps:'+entry.lat+','+entry.lng;
            }
            if (andy) {
                map.href = 'geo:'+entry.lat+','+entry.lng;
            }
            if (iMob) {
                map.href = 'http://maps.apple.com?daddr='+entry.lat+','+entry.lng;
            }
            map.innerText = 'Mit Maps-App öffnen'

            var mapCtnr = document.createElement("DIV");
            mapCtnr.appendChild(map);
            mapCtnr.className="maplink";
            ctnr.appendChild(mapCtnr);
        }

        var map2 = document.createElement('A');
        map2.href =
                'http://www.openstreetmap.org/?mlat='+entry.lat+'&mlon='+entry.lng+'&zoom=16&layers=M';
        map2.innerText = 'In Openstreet-Map zeigen';
        map2.target = "_blank";
        map2.className = 'blank';

        var mapCtnr2 = document.createElement("DIV");
        mapCtnr2.appendChild(map2);
        mapCtnr2.className="mapLink";
        ctnr.appendChild(mapCtnr2);

        var edit = document.createElement('BUTTON');
        edit.onclick = function() {location.href='edit.html#'+entry.id};
        edit.innerText = 'Eintrag bearbeiten...';
        ctnr.appendChild(edit);

        document.getElementById('overMapScroll').style.display='none';//.scrollTo(0,1);
        if (mapMarkers && mapMarkers[entry.id]) {
            mapMarkers[entry.id].openPopup();
        }
    }

    function findEntryInCache(id){
        for (var e in searchResultOrig['visible']) {
            if (searchResultOrig['visible'][e].id == id) {
                return searchResultOrig['visible'][e];
            }
        }
        for (var e in searchResultOrig['invisible']) {
            if (searchResultOrig['invisible'][e].id == id) {
                return searchResultOrig['invisible'][e];
            }
        }
    }

    function displayDetailsRatings(ratings) {
        var ratingTemplate = document.getElementById('template_rating');
        hide(ratingTemplate);
        var commentTemplate = document.getElementById('template_rating_text');
        hide(commentTemplate);
        for (rt in ratingTypes) {
            var ctnr = document.getElementById('details_ratings_' + rt);
            if (ctnr) {
                ctnr.innerHTML = '';
            }
        }
        for (r in ratings) {
            var ctnr = document.getElementById('details_ratings_' + ratings[r].context);
            if (ctnr) {
                var tempRating = ratingTemplate.cloneNode(true);
                renderDetailsRating(ratings[r], tempRating, commentTemplate)
                ctnr.appendChild(tempRating);
            }
        }
    }

    function renderDetailsRating(rating, tempRating, commentTemplate) {
        tempRating.removeAttribute('id');
        unhide(tempRating);
        setInnerTextOfChildWithIdAndRemoveId(tempRating, 'rating_title', rating.title);
        setInnerTextOfChildWithIdAndRemoveId(tempRating, 'rating_value', rating.value < 0 ? 'von gestern' : rating.value == 0 ? 'von heute' : rating.value == 2 ? 'visionär' : 'von morgen');
        var src = findChildWithId(tempRating, 'rating_source');
        if (src) {
            src.removeAttribute('id');
            if (rating.source) {
                if (rating.source.trim().toLowerCase().match(/^[a-z][^ <>"']+$/)) {
                    src.href = (rating.source.trim().toLowerCase().match(/^https?:/) ? '' : 'http://') + encodeURI(rating.source.trim());
                } else {
                    src.href = '#';
                    src.innertText = rating.source;
                }
            } else {
                src.href = '';
                src.innerText = '';
                hide(src);
            }
        }
        var comments = findChildWithId(tempRating, 'details_rating_comments');
        if (comments && rating.comments) {
            comments.removeAttribute('id');
            if (commentTemplate) {
                for (c in rating.comments) {
                    var tempComment = commentTemplate.cloneNode(true);
                    unhide(tempComment);
                    tempComment.removeAttribute('id');
                    tempComment.innerText = rating.comments[c].text;
                    comments.appendChild(tempComment);
                }
            }
        }
    }

    function hide (lbl) {
        if (lbl) {
            lbl.style.display = 'none';
        }
    }

    function unhide(lbl) {
        if (lbl) {
            if (lbl.style.removeProperty) { lbl.style.removeProperty('display') } else if (lbl.style.removeAttribute){ lbl.style.removeAttribute('display') } else { lbl.style.display = '' }
        }
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
