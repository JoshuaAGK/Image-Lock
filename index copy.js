window.addEventListener("load", () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("serviceworker.js")
      .then(console.log("registered service worker"))
    }
    runAfterLoad();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        worldTimeApiGet();
    }
});

var imageBase64 = null;
var db = null;
var internetConnection = window.navigator.onLine;
var request = null;
var internetTimestamp = null;
const MAX_VALS = {
    "date-input-days": Infinity,
    "date-input-hours": 23,
    "date-input-minutes": 59
}
var begunInterval = false;
var unlockTimestamp = null;
const ALWAYS_CONNECT = true // Only set to true for debugging
worldTimeApiGet();

if (ALWAYS_CONNECT) {
    internetTimestamp = new Date().getTime();
    const updateInternetTimestamp = setInterval(function() {
        internetTimestamp = new Date().getTime();
        getFormDatetime();
    }, 500);
}

function worldTimeApiGet(data = null) {
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", "https://worldtimeapi.org/api/timezone/Etc/UTC", true);
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var response = JSON.parse(xhttp.responseText);
            internetTimestamp = response.unixtime * 1000;
            console.log(`World Time API connection successful (${internetTimestamp})`)
            if (begunInterval == false) {
                const updateInternetTimestamp = setInterval(function() {
                    internetTimestamp += 500;
                    getFormDatetime();
                }, 500);
                begunInterval = true;
            }
        }
    }
    xhttp.send(data);
}

function setMain(main) {
    var mainLoading = document.getElementById("main-loading");
    var mainAddimage = document.getElementById("main-addimage");
    var mainShowimage = document.getElementById("main-showimage");

    switch(main) {
        case "main-loading":
            mainLoading.classList.remove("unavailable");
            mainAddimage.classList.add("unavailable");
            mainShowimage.classList.add("unavailable");
            break;
        case "main-addimage":
            mainLoading.classList.add("unavailable");
            mainAddimage.classList.remove("unavailable");
            mainShowimage.classList.add("unavailable");
            break;
        case "main-showimage":
            mainLoading.classList.add("unavailable");
            mainAddimage.classList.add("unavailable");
            mainShowimage.classList.remove("unavailable");
            break;
    }
}
  

function handleDateStepper(e) {
    if (!e.classList.contains("unavailable")) {
        
        var clickedParent = e.parentNode.id;
        var stepperDisplay = document.getElementById(clickedParent).getElementsByTagName("p")[0];
        var stepperVal = parseInt(stepperDisplay.innerHTML);

        var maxVal = MAX_VALS[clickedParent];

        var increment = e.classList.contains("surround-stepper-right") ? 1 : -1;

        stepperDisplay.innerHTML = stepperVal + increment;

        if (parseInt(stepperDisplay.innerHTML) < 1) {
            document.getElementById(clickedParent).getElementsByClassName("surround-stepper-left")[0].classList.add("unavailable")
        } else {
            document.getElementById(clickedParent).getElementsByClassName("surround-stepper-left")[0].classList.remove("unavailable")
        }

        if (parseInt(stepperDisplay.innerHTML) >= maxVal) {
            document.getElementById(clickedParent).getElementsByClassName("surround-stepper-right")[0].classList.add("unavailable")
        } else {
            document.getElementById(clickedParent).getElementsByClassName("surround-stepper-right")[0].classList.remove("unavailable")
        }

        var days = parseInt(document.getElementById("date-input-days").getElementsByTagName("p")[0].innerHTML);
        var hours = parseInt(document.getElementById("date-input-hours").getElementsByTagName("p")[0].innerHTML);
        var minutes = parseInt(document.getElementById("date-input-minutes").getElementsByTagName("p")[0].innerHTML);

        if (days == 0 && hours == 0 && minutes == 0) {
            document.getElementById("section-time").getElementsByClassName("btn-confirm")[0].classList.add("unavailable")
        } else {
            document.getElementById("section-time").getElementsByClassName("btn-confirm")[0].classList.remove("unavailable")
        }
    }

    getFormDatetime();
}

function getFormDatetime() {
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    var days = parseInt(document.getElementById("date-input-days").getElementsByTagName("p")[0].innerHTML);
    var hours = parseInt(document.getElementById("date-input-hours").getElementsByTagName("p")[0].innerHTML);
    var minutes = parseInt(document.getElementById("date-input-minutes").getElementsByTagName("p")[0].innerHTML);
    var date = new Date(internetTimestamp);

    function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function addHours(date, hours) {
        var result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }

    function addMinutes(date, minutes) {
        var result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }

    var returnString = "";

    if (days == 0 && hours == 0 && minutes == 0) {
        returnString = "Now";
    } else {
        date = addDays(date, days);
        date = addHours(date, hours);
        date = addMinutes(date, minutes)

        var newDate = new Date(date);
        var newTimestamp = newDate.getTime();
        var midnightYesterday = new Date().setHours(0, 0, 0, 0);
        var midnightTonight = new Date().setHours(24, 0, 0, 0);
        var midnightTomorrow = new Date();
        midnightTomorrow.setDate(midnightTomorrow.getDate() + 1);
        midnightTomorrow.setHours(24, 0, 0, 0);
        var midnightLastDayOfTheYear = new Date(new Date().getFullYear(), 11, 31).setHours(24, 0, 0, 0);
        var ordinal = '';
        const stDates = [1, 21, 31];
        const ndDates = [2, 22];
        const rdDates = [3, 23];

        if (stDates.includes(date.getDate())) {
            ordinal = 'st';
        } else if (ndDates.includes(date.getDate())) {
            ordinal = 'nd';
        } else if (rdDates.includes(date.getDate())) {
            ordinal = 'rd';
        } else {
            ordinal = 'th';
        }

        var dateString = "";
        if (newTimestamp > midnightYesterday && newTimestamp < midnightTonight) {
            dateString = "Today";
        } else if (newTimestamp > midnightTonight && newTimestamp < midnightTomorrow) {
            dateString = "Tomorrow";
        } else {
            if (newTimestamp < midnightLastDayOfTheYear) {
                dateString = date.getDate() + "<sup>" + ordinal + "</sup> " + MONTHS[date.getMonth()];
            } else {
                dateString = date.getDate() + "<sup>" + ordinal + "</sup> " + MONTHS[date.getMonth()] + " " + date.getFullYear();
            }
        }

        var hourString = date.getHours().toString();
        var minuteString = date.getMinutes().toString();

        var amPm = "am";
        if (hourString >= 13) {
            hourString -= 12;
            amPm = "pm";
        }

        if (minuteString.length == 1) {
            minuteString = "0" + minuteString;
        }

        var timeString = hourString + ":" + minuteString + " " + amPm;
        returnString = dateString + " at " + timeString;
    }

    document.getElementById("unlock-time-label").innerHTML = "Unlocks: <wbr>" + returnString;
    return [date, dateString];
}

function confirmInput() {
    unlockTimestamp = new Date(getFormDatetime()[0]).getTime();
    
    var file = document.querySelector('input[type=file]').files[0];
	var reader = new FileReader();

	reader.onload = function() {
        var imageBase64 = reader.result;
        var timeUnix = unlockTimestamp;
        addImageWithTime(imageBase64, timeUnix);
	}

	reader.readAsDataURL(file);

    scrollForward();
}

function runAfterLoad() {
    const inputElement = document.getElementById("img");
    inputElement.addEventListener("change", handleFiles, false);
    loadDatabase();
}

function handleFiles() {
    const fileList = this.files; /* now you can work with the file list */
    scrollForward();
}

function scrollForward() {
    window.scrollBy({
        top: 0,
        left: window.innerWidth
        // behavior : "smooth"
    })
}

function scrollBackward() {
    window.scrollBy({
        top: 0,
        left: window.innerWidth * -1
        // behavior : "smooth"
    })
}

var yeet = true;

function loadDatabase() {
    if (internetConnection || ALWAYS_CONNECT) {
        var request = window.indexedDB.open('notes_db', 1);
        request.onsuccess = function() {
            if (yeet) {
                db = request.result;
                displayData();
            }
        };
        request.onupgradeneeded = function(e) {
            yeet = false;
            db = e.target.result;
            objectStore = db.createObjectStore('notes_os', { keyPath: 'id', autoIncrement:true });
            objectStore.createIndex('image', 'image');
            objectStore.createIndex('unlockTime', 'unlockTime');
            document.getElementById("status").innerHTML = "Database created";
            console.log("Database created")
            setMain("main-addimage");
        };
    } else {
        console.log("No internet. Restart.")
    }
}

function addImageWithTime(image, time) {
    let newItem = {
        image: image,
        unlockTime: time
    };

    let transaction = db.transaction(['notes_os'], 'readwrite');
    let objectStore = transaction.objectStore('notes_os');

    var request = objectStore.add(newItem);
    transaction.oncomplete = function() {
        displayData();
    };
}

async function displayData() {
    var objectStore = db.transaction('notes_os').objectStore('notes_os');

    var response = objectStore.getAll();
    response.onsuccess = async function(event) {
        console.log("Loaded database")

        if (response.result.length < 1) {
            console.log("Database empty");
            setMain("main-addimage");
        } else {
            console.log("Image loaded");
            setMain("main-showimage");
            var unlockTimestamp = response.result[0].unlockTime;
            console.log(internetTimestamp, unlockTimestamp);
            if (internetTimestamp >= unlockTimestamp) {
                document.getElementById("main-showimage").getElementsByTagName("img")[0].src = response.result[0].image;
                document.getElementById("main-showimage").getElementsByTagName("h1")[0].innerHTML = "Your image";
            } else {
                document.getElementById("main-showimage").getElementsByTagName("h1")[0].innerHTML = "Your image (locked)";
            }
        }
    }
}

function deleteDatabase() {
    db.close();
    var request = indexedDB.deleteDatabase('notes_db');
    loadDatabase();
    setMain("main-addimage");
}

function downloadImage() {
    const IMAGE_TYPES = {
        "/": "jpg",
        "i": "png",
        "R": "gif",
        "U": "webp",
        "A": "heic"
    }

    var objectStore = db.transaction('notes_os').objectStore('notes_os');
    var response = objectStore.getAll();
    response.onsuccess = function(event) {
        var imageChar = response.result[0].image.substring(response.result[0].image.indexOf(";base64,")).charAt(8);
        var strippedBase64 = response.result[0].image.substring(response.result[0].image.indexOf(";base64,") + 8);

        download("image." + IMAGE_TYPES[imageChar], strippedBase64, IMAGE_TYPES[imageChar])
    }
}

function download(name, writeData, type = "utf8") {
    const DOWNLOAD_META = {
        "utf8": "data:text/plain;charset=utf-8,",
        "jpg": "data:image/jpeg;base64,",
        "png": "data:image/png;base64,",
        "gif": "data:image/gif;base64,",
        "webp": "data:image/webp;base64,",
        "heic": "data:application/octet-stream;base64,"
    }

    var element = document.createElement('a');
    element.style.display = 'none';
    element.setAttribute('href', DOWNLOAD_META[type] + encodeURIComponent(writeData));
    element.setAttribute('download', name);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}



// function deleteItem(e) {
//     // retrieve the name of the task we want to delete. We need
//     // to convert it to a number before trying it use it with IDB; IDB key
//     // values are type-sensitive.
//     let noteId = Number(e.target.parentNode.getAttribute('data-note-id'));

//     // open a database transaction and delete the task, finding it using the id we retrieved above
//     let transaction = db.transaction(['notes_os'], 'readwrite');
//     let objectStore = transaction.objectStore('notes_os');
//     let request = objectStore.delete(noteId);

//     // report that the data item has been deleted
//     transaction.oncomplete = function() {
//       // delete the parent of the button
//       // which is the list item, so it is no longer displayed
//       e.target.parentNode.parentNode.removeChild(e.target.parentNode);
//       console.log('Note ' + noteId + ' deleted.');

//       // Again, if list item is empty, display a 'No notes stored' message
//       if(!list.firstChild) {
//         const listItem = document.createElement('li');
//         listItem.textContent = 'No notes stored.';
//         list.appendChild(listItem);
//       }
//     };
// }
//
// window.addEventListener('online', () =>
//     internetConnection = true
// );
// window.addEventListener('offline', () => 
//     internetConnection = false
// );