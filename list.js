    /* CORE SEARCH FUNCTION */

    var srv = "https://api.ofdb.io/v0/";

    var city = "Stuttgart";
    var lat = 48.75;
    var lon = 9.2;
    var bbox = [lat - 0.1, lon - 0.12, lat + 0.1, lon + 0.12];

    var backScrollY = 0;

    var categories = {};

    var searchResultOrig = [];
    var searchResult = [];

    var displayedEntry;

    var cache = {};

    var displayDetailsOnload = false;
    var ratingTypes = {diversity:"rgb(151,  191,  13 )",renewable:"rgb(255,  221,  0 )",fairness:"rgb(229,  98,   146)",humanity:"rgb(170,  56,   108)",transparency:"rgb(100,  122,  133)",solidarity:"rgb(0,    153,  173)"};

    function find() {
        if (showWait()) {
            if ((!categories) || (!categories.length) || categories.length == 0) {
                getCategories(doFind);
            } else {
                doFind();
            }
        }
        findOsm();
    }

    function doFind() {
        var xhttp = new XMLHttpRequest();
        showWait(null, xhttp);
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4) {
                if (xhttp.status == 200) {
                    searchResultOrig = JSON.parse(xhttp.responseText);
                    searchResult={'visible':[],'invisible':[]};
                    var totalCount = 0;
                    for (e in searchResultOrig['visible']) {
                        totalCount++;
                        if(totalCount <= 200) {
                                searchResult['visible'][e]=searchResultOrig['visible'][e].id;
                        }
                    }
                    for (e in searchResultOrig['invisible']) {
                        totalCount++;
                        if (totalCount <= 200){
                                searchResult['invisible'][e]=searchResultOrig['invisible'][e].id;
                        }
                    }

                    /*var uncached = extract_uncached(searchResult['visible']);
                    var uncached2 = extract_uncached(searchResult['invisible']);
                    if (uncached2 && uncached2.length > 0) {
                        uncached.push(uncached2);
                    }
                    if (uncached && uncached.length > 0) {
                        getResults(uncached, displaySearchResult);
                    } else {*/
                        displaySearchResult();
                        hideWait();/*
                    }*/
                } else {
                    hideWait('Internet Verbindung.');
                }
            }
        };
        xhttp.open("GET", srv
                + "search?text="
                + encodeURIComponent(document.getElementById('text').value)
                + "&categories="
                + extract_keys_not_disabled(categories).join(',')
                + "&bbox="
                + bbox.join(',')
                , true);
        xhttp.send();
    }

    function displaySearchResult() {
        var resultCtnr = document.getElementById('results_visible');
        resultCtnr.innerHTML = '';

        displayResultList(resultCtnr, searchResultOrig['visible']);

        resultCtnr = document.getElementById('results_invisible');
        resultCtnr.innerHTML = '';
        displayResultList(resultCtnr, searchResultOrig['invisible']);

        if (displayDetailsOnload) {
            displayDetails(displayDetailsOnload);
            displayDetailsOnload = false;
        }

        removeUnnecessaryMapMarkers();
    }

    function displayResultList(ctnr, entries) {
        for(var e in entries) {
            doDisplayResultListEntry(ctnr, entries[e]);
        }
    }


    function doDisplayResultListEntry(resultsCtnr, entry) {
/*{"0":{"id":"4c20979fe0754e74875afa4308d73ce7","lat":48.720333561636664,"lng":9.152239220753424,
    "title":"slowtec GmbH","description":"long long test","categories":["77b3c33a92554bcf8e8c2c86cedd6f6f"],
    "tags":["assoziativ","ie-stationsidee","ingenieurbüro","initiativ-kolloquium2","kartevonmorgen","linux","new-work","open-source","potentialentfaltung","regelungstechnik","regpis","selbstgeführt","smart-lowtec","socent","software","sozialezukunft","soziokratie","teal-organization","transforming-capitalism-lab","urbane-landwirtschaft"],
    "ratings":{"total":1.25,"diversity":2,"fairness":0,"humanity":2,"renewable":1.5,"solidarity":0,"transparency":2}}}
*/
        hide(document.getElementById('template_result'));
        var ctnr0 = document.getElementById('template_result').cloneNode(true);
        unhide(ctnr0);
        ctnr0.removeAttribute('id');
        ctnr0.setAttribute('class', categories[entry.categories[0]].name.toLowerCase().replace('unternehmen', 'company') + ' ResultListElement');

        setInnerTextOfChildWithIdAndRemoveId(ctnr0, 'result_category', categories[entry.categories[0]].name);
        setInnerTextOfChildWithIdAndRemoveId(ctnr0, 'result_title', entry.title);
        setInnerTextOfChildWithIdAndRemoveId(ctnr0, 'result_description', entry.description);

        updateRatingFlower(entry, ctnr0, 'result_rating_', true);

        var tagCtnr = findChildWithId(ctnr0, 'result_tags');
        if (tagCtnr) {
            tagCtnr.removeAttribute('id');
            tagCtnr.innerHTML = '';
            var first = true;
            for (var t in entry.tags) {
                if (first) {
                    first = false;
                } else {
                    tagCtnr.appendChild(document.createTextNode(' '));
                }
                var div = document.createElement('DIV');
                div.setAttribute('class', 'Tag');
                div.innerText = '#' + entry.tags[t];
                tagCtnr.appendChild(div);
            }
        }

        ctnr0.onclick = createShowFunc(ctnr0, entry.id);

        ctnr0.onmouseenter = createHoverFunc(entry.id, true);
        ctnr0.onmouseleave = createHoverFunc(entry.id, false);

        resultsCtnr.appendChild(ctnr0);

        addMapMarker(entry);
    }

    function createHoverFunc(entryId, open) {
        return function() {
            if (mapMarkers && mapMarkers[entryId]) {
                if (open) {
                    mapMarkers[entryId].openTooltip();
                } else {
                    mapMarkers[entryId].closeTooltip();
                }
            }
        }
    }

    function updateRatingFlower(entry, ctnr0, prefix, removeId) {
        for (var type in ratingTypes) {
            var rating = entry.ratings[type];
            var flower = findChildWithId(ctnr0, prefix + type);
            if (flower) {
                flower.setAttribute('transform', flower.getAttribute('transform').replace(/scale\([0-9.]+\)/, 'scale(' + ((rating || 1) * 0.49) + ')') );
                if (removeId) {
                    flower.removeAttribute('id');
                }
                if (! rating) {
                    flower.setAttribute('fill', 'rgb(221,  221,  221)');
                } else if (!removeId) {
                    flower.setAttribute('fill', ratingTypes[type]);
                }
            }
        }
    }

    function setInnerTextOfChildWithIdAndRemoveId(ctnr1, id, innerTxt) {
        var elem = findChildWithId(ctnr1, id);
        if (elem) {
            elem.innerText = innerTxt;
            elem.removeAttribute('id');
        } else {
            console.log(id + ' not found in ');
            console.log(ctnr1);
        }
    }

    function findChildWithId(ctnr2, id) {
        for (var i = 0; i < ctnr2.children.length; i++) {
            if (ctnr2.children[i].id == id) {
                return ctnr2.children[i];
            }
            if (ctnr2.children[i].firstChild) {
                var child = findChildWithId(ctnr2.children[i], id);
                if (child) {
                    return child;
                }
            }
        }
        return null;
    }

    function createShowFunc(ctnr, id) {
        return function (event) {
            backScrollY = document.getElementById('overMapScroll').scrollTop;
            window.setTimeout(function () {
                displayDetails(id);
            }, 11);
            event.preventDefault();
            return false;
        };
    }

    function hideDetails() {
        document.getElementById('details').style.display = 'none';
        document.getElementById('overMapScroll').style.display='block';
        if (displayedEntry && displayedEntry.id && mapMarkers[displayedEntry.id]) {
            mapMarkers[displayedEntry.id].closePopup();
        }
        /*if ((backScrollY && backScrollY >= 0) || backScrollY === 0) {
            window.setTimeout(function () {
                document.getElementById('overMapScroll').style.display='block';//.scrollTo(0, backScrollY);
                backScrollY = null;
            }, 11);
        } else if (backScrollY === null) {
            toggleMap();
        }*/
        location.hash=location.hash?location.hash.replace(/^[^;]*;/,';'):'';
    }


    function getResults(ids, callback) {
        if (ids && ids[0] && ids[0].match && ids[0].match(/^osm_.*/)) {
            return getOsmResults(ids, callback);
        }
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4) {
                if (xhttp.status == 200) {
                    var entries = JSON.parse(xhttp.responseText);
                    if (entries) {
                        if(entries.id && entries.title) {
                            cache[entries.id] = entries;
                        } else {
                            for(var e in entries) {
                                cache[entries[e].id] = entries[e];
                            }
                        }
                        callback(ids);
                    }
                    hideWait();
                } else {
                    hideWait('Internet Verbindung.');
                }
            }
        };
        showWait(null, xhttp);
        xhttp.open("GET", srv + 'entries/' + ids.join(','), true);
        xhttp.send();
    }

    function getCategories(callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var res = JSON.parse(xhttp.responseText);
                if (res) {
                    for (r in res) {
                        if (res[r] && res[r].id) {
                            if (!categories[res[r].id]) {
                                if(!categories.length) {
                                    categories.length = 1;
                                } else {
                                    categories.length = categories.length + 1;
                                }
                            }
                            categories[res[r].id] = res[r];
                        }
                    }
                }
                callback();
            }
        };
        xhttp.open("GET", srv + "categories/" , true);
        xhttp.send();
    }

    function getRatings(ratingIds, callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var res = JSON.parse(xhttp.responseText);
                if (res && res.length > 0) {
                    callback(res);
                }
            }
        }
        xhttp.open("GET", srv + "ratings/" + ratingIds.join(), true);
        xhttp.send();
    }

    function extract_keys_not_disabled(obj) {
        var res = [];
        for (e in obj) {
            if ((!obj[e]) || !obj[e].disabled) {
                res.push(e);
            }
        }
        return res;
    }

    function extract_uncached(ary) {
        var res = [];
        if (ary) {
            for (e in ary) {
                if (!cache[ary[e]]) {
                    res.push(ary[e]);
                }
            }
        }
        return res;
    }

    function toggleCat(categoryName) {
        if (categoryName == 'OpenStreetMap') {
            osmEnabled = !osmEnabled;
            toggleClass('btn'+categoryName, 'active', osmEnabled);
            if ((!osmEnabled) || (bbox && bbox.length == 4 &&
                    Math.abs(bbox[2] - bbox[0]) <= 0.201 && Math.abs(bbox[3] - bbox[1]) <= 0.241)) {
                findOsm();
            } else {
                alert('Bitte Karten zeigen und NÄHER ZOOMEN, um Open Street Map Einträge zu zeigen. (Die OpenstreetMap-API ist zu langsam, um große Regionen abzufragen).');
            }
            if (osmEnabled) {
                if (!isMapInFront()) {
                    document.getElementById('openstreetmap').scrollIntoView();
                }
            }
        } else if ((!categories) || (!categories.length) || categories.length == 0) {
            getCategories(function () {
                doToggleCat(categoryName)
            });
        } else {
            doToggleCat(categoryName);
        }
    }

    function doToggleCat(categoryName) {
        for (c in categories) {
            if (categories[c].name == categoryName) {
                if (categories[c].disabled) {
                    categories[c].disabled = false;
                } else {
                    categories[c].disabled = true;
                }
                toggleClass('btn'+categoryName, 'active', !categories[c].disabled);
                find();
            }
        }
    }

    function toggleClass(elemId, className, addClass) {
        var elem = document.getElementById(elemId);
        if (elem) {
            if (addClass) {
                elem.classList.add(className);
            } else {
                elem.classList.remove(className);
            }
        }
    }
