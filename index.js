window.addEventListener('load', () => {
    loadDatabase();
});

window.addEventListener("load", () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("serviceworker.js")
      .then(console.log("registered service worker"))
    }
  });

var imageBase64 = null;
var db = null;
var internetConnection = window.navigator.onLine;
var request = null;
var internetTimestamp = null;

function worldTimeApiGet(url, data = null) {
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", url, true);
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var response = JSON.parse(xhttp.responseText);
            internetTimestamp = response.unixtime
            console.log(`World Time API connection successful (${internetTimestamp})`)
        }
    }
    xhttp.send(data);
}

var yeet = true;

function loadDatabase() {
    if (true) {
        document.getElementById("status").innerHTML = "Checking time from API";
        worldTimeApiGet("https://worldtimeapi.org/api/timezone/Etc/UTC");

        document.getElementById("status").innerHTML = "Opening database";
        
        let request = window.indexedDB.open('notes_db', 1);
        request.onsuccess = function() {
            if (yeet) {
                document.getElementById("status").innerHTML = "Loading data from database";
                console.log("Loading data from database")
                db = request.result;
                displayData();
            }
        };
        request.onerror = function() {
            document.getElementById("status").innerHTML = "Database failed to open";
            console.log("Database failed to open")
        };
        request.onupgradeneeded = function(e) {
            yeet = false;
            db = e.target.result;
            objectStore = db.createObjectStore('notes_os', { keyPath: 'id', autoIncrement:true });
            objectStore.createIndex('image', 'image');
            objectStore.createIndex('unlockTime', 'unlockTime');
            document.getElementById("status").innerHTML = "Database created";
            console.log("Database created")
        };
    } else {
        document.getElementById("status").innerHTML = "No internet. Restart.";
        console.log("No internet. Restart.")
    }
}

function saveBtn() {
    console.log("Input datetime: " + inputTimeUnix());
    var file = document.querySelector('input[type=file]').files[0];
	var reader = new FileReader();

	reader.onload = function() {
        var imageBase64 = reader.result;
        var timeUnix = inputTimeUnix();
        addImageWithTime(imageBase64, timeUnix);
	}

	reader.readAsDataURL(file);
}

var inputTimeUnix = () => {
    var unlockDate = document.getElementById("inputDate").value;
    var unlockTime = document.getElementById("inputTime").value;
    var isoTime = unlockDate + "T" + unlockTime;
    return Date.parse(isoTime);
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
        console.log('Transaction completed: database modification finished.');
        displayData();
    };

    transaction.onerror = function() {
        console.log('Transaction not opened due to error');
    };
}

function displayData() {
    var objectStore = db.transaction('notes_os').objectStore('notes_os');

    var response = objectStore.getAll();
    response.onsuccess = function(event) {
        document.getElementById("status").innerHTML = "Finished loading data from database";
        console.log("Finished loading data from database")
        if (response.result.length < 1) {
            document.getElementById("status").innerHTML = "Database empty";
            console.log("Database empty");
        } else {
            document.getElementById("status").innerHTML = "Loaded image from database successfully";
            console.log("Loaded image from database successfully");
            displayIfUnlocked(response.result[response.result.length - 1]);
        }
    }
}

function displayIfUnlocked(responseData) {
    var today = new Date();
    var currentUnix = Date.parse(today);
    console.log("Current unix: " + currentUnix);

    var image = responseData.image;
    var unlockTime = parseInt(responseData.unlockTime);

    if (currentUnix >= unlockTime) {
        document.getElementsByTagName("img")[0].src = image;
        document.getElementById("status").innerHTML = "Image is displayed";
        console.log("Image is displayed");
        console.log("Image time: " + unlockTime);
    } else {
        document.getElementById("status").innerHTML = "Insufficient time";
        console.log("Insufficient time");
        console.log("Image time: " + unlockTime);
    }
}


function deleteDatabase() {
    db.close();
    var request = indexedDB.deleteDatabase('notes_db');
    document.getElementById("status").innerHTML = "Database deleted";
    console.log("Database deleted");
}






function deleteItem(e) {
    // retrieve the name of the task we want to delete. We need
    // to convert it to a number before trying it use it with IDB; IDB key
    // values are type-sensitive.
    let noteId = Number(e.target.parentNode.getAttribute('data-note-id'));

    // open a database transaction and delete the task, finding it using the id we retrieved above
    let transaction = db.transaction(['notes_os'], 'readwrite');
    let objectStore = transaction.objectStore('notes_os');
    let request = objectStore.delete(noteId);

    // report that the data item has been deleted
    transaction.oncomplete = function() {
      // delete the parent of the button
      // which is the list item, so it is no longer displayed
      e.target.parentNode.parentNode.removeChild(e.target.parentNode);
      console.log('Note ' + noteId + ' deleted.');

      // Again, if list item is empty, display a 'No notes stored' message
      if(!list.firstChild) {
        const listItem = document.createElement('li');
        listItem.textContent = 'No notes stored.';
        list.appendChild(listItem);
      }
    };
}

// window.addEventListener('online', () =>
//     internetConnection = true
// );
// window.addEventListener('offline', () => 
//     internetConnection = false
// );