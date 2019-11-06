function loadModule(name) {
    var xhttp = new XMLHttpRequest();
    showWait(null, xhttp);
    xhttp.responseType="text";
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4) {
            if (xhttp.status == 200) {
                document.getElementById(name).innerHTML = xhttp.responseText;
                hideWait();
            } else {
                hideWait('Internet Verbindung.');
            }
            if (window.remainingModules) {
                window.remainingModules--;
                if (remainingModules == 0) {
                    initMap();
                }
            }
        }
    };
    xhttp.open("GET", name, true);
    xhttp.send();
}


/*  OVERLAY (waiting information, cancel button)  */

var cancelCallback = null;
var cancelXhttp = null;
var waitIsVisible = false;
var disableOverlay = false;

function showWait(msg, xhttp, noOverlay) {
    if(xhttp) {
        cancelXhttp = xhttp;
    }
    if (waitIsVisible) {
        return false;
    }
    if(disableOverlay || noOverlay) {
        document.getElementById('ovl_wheel').style.display = 'inline-block';
    } else {
        document.getElementById('ovl_wait').style.display = 'block';
        if (msg) {
            document.getElementById('ovl_wait_msg').innerText = msg;
        } else {
            document.getElementById('ovl_wait_msg').innerText = 'lade Daten...';
        }
    }
    return true;
}

function hideWait(err) {
    cancelCallback = null;
    cancelXhttp = null;
    waitIsVisible = false;
    if (err) {
        alert("Problem mit " + err);
    }
    document.getElementById('ovl_wait').style.display = 'none';
    document.getElementById('ovl_wheel').style.display = 'none';
}

function cancel() {
    if (cancelCallback) {
        cancelCallback();
    }
    if (cancelXhttp && cancelXhttp.abort) {
        cancelXhttp.abort();
    }
    hideWait();
}



/* MENU OPTIONS */

function toggleMenu() {
    var mele = document.getElementById('menu');
    if (mele) {
        if (mele.style.display == 'block') {
            mele.style.display = 'none';
        } else {
            mele.style.display = 'block';
        }
    }
}