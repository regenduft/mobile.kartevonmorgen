    /*  GEOLOCATION FUNCTIONS  */

    var geoLocationCancelled = false;

    function geolocate() {
        showWait('Positionsbestimmung...');
        geoLocationCancelled = false;
        cancelCallback = function(){geoLocationCancelled = true;}
        getLocation(function(res) {
            if (geoLocationCancelled) {
                return;
            }
            if (res && res.coords) {
                res = res.coords;
            }
            if (res && res.latitude && res.longitude) {
                hideWait();
                goto(res.latitude + ',' + res.longitude, res.latitude,
                        res.longitude);
            }
            else if (res && res.lat && res.lon) {
                hideWait();
                goto(res.lat + ',' + res.lon, res.lat, res.lon);
            } else if (res) {
                showWait('Position nicht gefunden, versuche es neu für 15 Minuten...');
                cancelCallback = function(){geoLocationCancelled = true;}
                getLocation(function(res) {
                    if (geoLocationCancelled) {
                        return;
                    }
                    if (res && res.coords) {
                        res = res.coords;
                    }
                    if (res && res.latitude && res.longitude) {
                        hideWait();
                        goto(res.latitude + ',' + res.longitude, res.latitude,
                                res.longitude);
                    }
                    else if (res && res.lat && res.lon) {
                        hideWait();
                        goto(res.lat + ',' + res.lon, res.lat, res.lon);
                    } else {
                        hideWait('GPS');
                    }
                }, 900000);
            } else {
                hideWait('Berechtigungs-Einstellung');
            }
        });
    }


    /*# get location (default timeout 8.8 seconds for google and 99 seconds for GPS)
     # with fallback to high accuracy in case that low accuracy is turned off
     # (this is necessary for android with google location services turned off)
     # callback will be called with NULL if position cannot be determined,
     # or with object { coords: { latitude: 1.234, longitude: 5.678 } }
     # ATTENTION: may never call the callback - in case the user does neither
     # confirm nor deny the confirmation dialog that the browser usually
     displays*/
    function getLocation(callback, pTimeout) {
        var errorCallback, ref, successCallback;
        if (pTimeout == null) {
            pTimeout = 99999;
        }
        if (!(typeof navigator !== "undefined" && navigator !== null ? (ref = navigator.geolocation) != null ? ref.getCurrentPosition : void 0 : void 0)) {
            return callback(null);
        } else {
            successCallback = function(position) {
                var ref1, ref2;
                if ((position != null ? (ref1 = position.coords) != null ? ref1.latitude : void 0 : void 0) && (position != null ? (ref2 = position.coords) != null ? ref2.longitude : void 0 : void 0)) {
                    return callback(position);
                } else {
                    return callback(null);
                }
            };
            errorCallback = function(positionError) {
                if (positionError != null && positionError.code != 1) {
                    return window.setTimeout((function() {
                        return navigator.geolocation.getCurrentPosition(successCallback, function(positionError2) {
                            return callback({});
                        }, {
                            enableHighAccuracy: true,
                            timeout: pTimeout,
                            maximumAge: Infinity
                        });
                    }), 11);
                } else {
                    return callback(null);
                }
            };
            return navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
                enableHighAccuracy: false,
                timeout: 8888,
                maximumAge: 999999
            });
        }
    }
