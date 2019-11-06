    /* COOKIE  and  REQUEST PARAMETER HANDLING */

    function saveCity() {
        var ablauf = new Date();
        var in400Tagen = ablauf.getTime() + (400 * 24 * 60 * 60 * 1000);
        ablauf.setTime(in400Tagen);
        document.cookie = 'city='+city+'; path=/; expires=' + ablauf.toGMTString();
        document.cookie = 'lat='+lat+'; path=/; expires=' + ablauf.toGMTString();
        document.cookie = 'lon='+lon+'; path=/; expires=' + ablauf.toGMTString();
        document.location.hash = ';' + city;
    }

    function initCity() {
        if (document.cookie) {
            var ca = document.cookie.split(';');
            if (ca) {
                for(var i=0;i < ca.length;i++) {
                    var c = ca[i];
                    while (c.charAt(0)==' ') c = c.substring(1);
                    if (c.indexOf('city=') == 0) {
                        city = c.substring(5);
                        document.getElementById('city').placeholder = 'Ort: ' + city;
                    }
                    if (c.indexOf('lat=') == 0) {
                        lat = parseFloat(c.substring(4));
                        bbox = [lat - 0.1, lon - 0.12, lat + 0.1, lon + 0.12];;
                    }
                    if (c.indexOf('lon=') == 0) {
                        lon = parseFloat(c.substring(4));
                        bbox = [lat - 0.1, lon - 0.12, lat + 0.1, lon + 0.12];
                    }
                    if (c.indexOf('poi=0') == 0) {
                        poiEnabled = false;
                        var mele = document.getElementById('menuPoi');
                        if (mele) {
                            mele.style.fontWeight = poiEnabled ? 'bold' : 'normal';
                        }
                    }
                    if (c.indexOf('poiName=1') == 0) {
                        poiWithoutName = true;
                        var mele = document.getElementById('menuPoiName');
                        if (mele) {
                            mele.style.fontWeight = poiEnabled ? 'bold' : 'normal';
                        }
                    }
                    if (c.indexOf('map=') == 0) {
                        mapStyle = c.substring(4);
                    }
                    if (c.indexOf('ovl=') == 0) {
                        mapOverlay = c.substring(4);
                    }
                }
            }
        }

        if(location.hash && location.hash != '#' && location.hash.replace(' ', '') && location.hash.replace(' ', '') != '#') {
            var parts = location.hash.replace(/^#/, '').split(';');
            if (parts.length > 1 && parts[1]) {
                var ll = parts[1].split(',');
                if (ll.length > 1 && ll[1] && ll[0] && ll[0].match(/^[0-9]+\.[0-9]*$/) && ll[1].match(/[0-9]+\.[0-9]*$/)) {
                        lat = parseFloat(ll[0]);
                        lon = parseFloat(ll[1]);
                        bbox = [lat - 0.1, lon - 0.12, lat + 0.1, lon + 0.12];
                        displayDetailsOnload = parts[0];
                } else {
                    var txt = decodeURIComponent(parts[1]);
                    if (txt.match(/^[0-9a-zA-Z\u00C0-\u017F,.;() :+\?/_-]+$/)) {
                        document.getElementById('city').placeholder = 'Ort: ' + city;
                        displayDetailsOnload = parts[0];
                        gotoCity(txt);
                    }
                }
            }
            if (parts.length > 0 && parts[0] && !displayDetailsOnload) {
                displayDetails(parts[0]);
            }

        }

        initMap();
    }
