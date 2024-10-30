let zoomLevel = 1; // Initial zoom level
let isDragging = false; // For tracking drag status
let currentX = 0, currentY = 0; // Track current image position
let initialMouseX, initialMouseY; // Initial mouse position

const image = document.getElementById('groundChartImage');
const container = document.getElementById('image-container');

// Disable default drag behavior of the image
image.addEventListener('dragstart', (event) => {
    event.preventDefault();
});

// Pointer down to start dragging
image.addEventListener('pointerdown', (event) => {
    if (zoomLevel > 1) {
        isDragging = true;
        image.setPointerCapture(event.pointerId); // Capture pointer events for this element
        image.style.cursor = 'grabbing';

        initialMouseX = event.clientX;
        initialMouseY = event.clientY;

        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
    }
});

// Pointer up to stop dragging
image.addEventListener('pointerup', () => {
    isDragging = false;
    image.style.cursor = 'grab';
    // Re-enable text selection
    document.body.style.userSelect = '';
});

// Pointer move to handle dragging
image.addEventListener('pointermove', (event) => {
    if (isDragging) {
        const dx = event.clientX - initialMouseX;
        const dy = event.clientY - initialMouseY;

        // Update current position directly
        currentX += dx;
        currentY += dy;

        // Update image position
        image.style.transform = `translate(${currentX}px, ${currentY}px) scale(${zoomLevel})`;

        // Update initial mouse position
        initialMouseX = event.clientX;
        initialMouseY = event.clientY;
    }
});

// Function to zoom in
function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.2, 3); // Cap zoom level to 3
    updateImageTransform();
}

// Function to zoom out
function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.2, 1); // Minimum zoom level of 1
    updateImageTransform();
}

// Update image transform based on zoom
function updateImageTransform() {
    if (zoomLevel === 1) {
        // Reset offsets when zooming out to original size
        currentX = 0;
        currentY = 0;
        image.style.transform = 'translate(-50%, -50%) scale(1)';
    } else {
        image.style.transform = `translate(${currentX}px, ${currentY}px) scale(${zoomLevel})`;
    }
}

// Function to handle changing the image
function updateGroundChart() {
    const selector = document.getElementById('groundChartSelector');
    const selectedValue = selector.value;

    // Update image source
    image.src = selectedValue;

    // Reset zoom level and transform to center
    zoomLevel = 1;
    currentX = 0;
    currentY = 0;
    image.style.transform = 'translate(-50%, -50%) scale(1)';
}

const fullscreenButton = document.getElementById('fullscreen-btn');
const iframe = document.getElementById('groundChartImage');

// Toggle full screen
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        // Request full screen for the iframe
        iframe.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Event listener for fullscreen button
fullscreenButton.addEventListener('click', toggleFullScreen);

function displayFrequency() {
    const dropdown = document.getElementById('frequencyDropdown');
    const selectedFrequency = dropdown.value; // Get selected frequency
    const displayElement = document.getElementById('frequencyDisplay'); // Get the display element

    console.log("Selected Frequency:", selectedFrequency); // Debugging log

    if (selectedFrequency) {
        displayElement.textContent = `${selectedFrequency}`; // Display selected frequency
        localStorage.setItem('selectedFrequency', selectedFrequency); // Save to localStorage
    } else {
        displayElement.textContent = ''; // Clear if nothing selected
    }
}

window.onload = function () {
    // Check if there's a saved selection in localStorage
    const savedFrequency = localStorage.getItem('selectedFrequency');
    console.log("Saved Frequency from localStorage:", savedFrequency); // Debugging log

    if (savedFrequency) {
        const dropdown = document.getElementById('frequencyDropdown');
        dropdown.value = savedFrequency; // Set the dropdown to the saved value
        displayFrequency(); // Display the saved frequency
    }
};

document.addEventListener("DOMContentLoaded", function () {
    // Get references to the dropdown and image elements
    const selector = document.getElementById("groundChartSelector");
    const image = document.getElementById("groundChartImage");

    // Function to update the ground chart based on the selected value
    function updateGroundChart() {
        const selectedValue = selector.value;

        if (selectedValue) {
            // Update the image source
            image.src = selectedValue;

            // Save the selected value to localStorage
            localStorage.setItem('selectedGroundChart', selectedValue);
        }
    }

    // Function to load the saved ground chart on page load
    function loadSavedGroundChart() {
        const savedValue = localStorage.getItem('selectedGroundChart');

        if (savedValue) {
            // Set the dropdown to the saved value
            selector.value = savedValue; 

            // Update the image based on the saved value
            image.src = savedValue; 
        }
    }

    // Load saved notes for all sections
    function loadNotes() {
        displayNotes('notesList1'); // For the first notes section
        displayNotes('notesList2'); // For the second notes section
        displayNotes('notesList3'); // For the third notes section
    }

    // Attach the updateGroundChart function to the dropdown change event
    selector.addEventListener('change', updateGroundChart);

    // Load the saved ground chart and notes on page load
    window.onload = function () {
        loadSavedGroundChart();
        loadNotes();
    };
});


// Add an event listener to the ground chart selector
document.getElementById('groundChartSelector').addEventListener('change', updateGroundChart);


async function fetchFlightPlans() {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbxrAjM5YnokoZm1MkkDrGNqdI23uvjatIb3pJTb_uBgooxjz-XKrllj2ILpVYXkPWQcXQ/exec');
        console.log('Response status:', response.status); // Log status code
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const flightPlans = await response.json();
        console.log('Fetched flight plans:', flightPlans); // Log fetched data
        displayFlightPlans(flightPlans);
    } catch (error) {
        console.error('Error fetching flight plans:', error); // Log error if any
    }
}

// https://script.google.com/macros/s/AKfycbxrAjM5YnokoZm1MkkDrGNqdI23uvjatIb3pJTb_uBgooxjz-XKrllj2ILpVYXkPWQcXQ/exec

function displayFlightPlans(flightPlans) {
    console.log('Displaying flight plans:', flightPlans); // Log flight plans
    const flightPlansList = document.getElementById('flightPlansList');
    flightPlansList.innerHTML = ''; // Clear existing content

    flightPlans.forEach(plan => {
        console.log('Flight Plan:', plan); // Log each flight plan
        const flightPlanElement = document.createElement('div');
        flightPlanElement.className = 'flight-plan';
        flightPlanElement.innerHTML = `
            <p>Callsign: ${plan.Callsign || 'N/A'}</p>
            <p>Departure: ${plan.Departure || 'N/A'}</p>
            <p>Arrival: ${plan.Arrival || 'N/A'}</p>
            <p>Aircraft: ${plan.Aircraft || 'N/A'}</p>
            <p>Flight Rule: ${plan.FlightRule || 'N/A'}</p>
            <p>SID: ${plan.SID || 'N/A'}</p>
            <p>Cruising Level: ${plan.CruisingLevel || 'N/A'}</p>
            <p>Squawk: ${plan.Squawk || 'N/A'}</p>
        `;
        flightPlansList.appendChild(flightPlanElement);
    });
}

function displayNotes(listId) {
    const notesList = document.getElementById(listId);
    const notes = JSON.parse(localStorage.getItem(listId)) || [];

    if (notes.length === 0) {
        notesList.innerHTML = '<p class="no-notes">No notes added yet.</p>';
        return;
    }

    notesList.innerHTML = `
    <ul class="notes-list">
        ${notes.map((note, index) => `
            <li class="note-item">
                <span class="note-text">${note}</span> 
                <div class="button-container"> <!-- Added container -->
                    <button class="edit-note" onclick="editNote(${index}, '${listId}')">Edit</button>
                    <button class="delete-note" onclick="deleteNote(${index}, '${listId}')">Delete</button>
                </div>
                <div class="edit-container" style="display: none;"> 
                    <input type="text" id="editNote-${index}" value="${note}">
                    <button class="update-note" onclick="updateNote(${index}, '${listId}')">Update</button>
                    <button class="cancel-edit" onclick="cancelEdit(${index}, '${listId}')">Cancel</button>
                </div>
            </li>
        `).join('')}
    </ul>
`;
        }

// Function to handle keydown event for adding and updating notes
function handleKeyDown(event, listId, inputId, isEditing = false, index = null) {
    if (event.key === 'Enter') { // Check if the pressed key is Enter
        event.preventDefault(); // Prevent form submission or any default action
        if (isEditing && index !== null) {
            updateNote(index, listId); // Update the note if in edit mode
        } else if (!isEditing) {
            addNote(listId, inputId); // Otherwise, add a new note
        }
    }
}

function editNote(index, listId) {
    const notesList = document.getElementById(listId); // Get the specific list
    const noteItem = notesList.querySelectorAll('.note-item')[index]; // Target note by index within this list
    const noteText = noteItem.querySelector('.note-text');
    const editContainer = noteItem.querySelector('.edit-container');
    const editInput = noteItem.querySelector(`#editNote-${index}`);
    const editButton = noteItem.querySelector('.edit-note');
    const deleteButton = noteItem.querySelector('.delete-note');

    // Toggle visibility for editing
    noteText.style.display = 'none';
    editContainer.style.display = 'flex';
    editButton.style.display = 'none';
    deleteButton.style.display = 'none';

    // Focus the input field and set the cursor at the end of the text
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    // Add a keydown listener to handle Enter key
    editInput.addEventListener('keydown', (event) => 
        handleKeyDown(event, listId, `editNote-${index}`, true, index)
    );
}

// Function to add a new note
function addNote(listId, inputId) {
    const newNoteInput = document.getElementById(inputId);
    const noteText = newNoteInput.value.trim();

    if (noteText) {
        const notes = JSON.parse(localStorage.getItem(listId)) || [];
        notes.push(noteText);
        localStorage.setItem(listId, JSON.stringify(notes));
        newNoteInput.value = ''; // Clear the input after adding a note
        displayNotes(listId); // Display notes for the specific section
    }
}

// When the page loads, set up the event listeners
window.onload = function () {
    fetchFlightPlans(); // Fetch flight plans from Google Sheets
    displayNotes('notesList1'); // For the first notes section
    displayNotes('notesList2'); // For the second notes section
    displayNotes('notesList3'); // For the third notes section

    // Add event listeners for keydown on note input fields
    document.getElementById('newNote1').addEventListener('keydown', (event) => handleKeyDown(event, 'notesList1', 'newNote1'));
    document.getElementById('newNote2').addEventListener('keydown', (event) => handleKeyDown(event, 'notesList2', 'newNote2'));
    document.getElementById('newNote3').addEventListener('keydown', (event) => handleKeyDown(event, 'notesList3', 'newNote3'));
};


function deleteNote(index, listId) {
    const notes = JSON.parse(localStorage.getItem(listId)) || [];

    notes.splice(index, 1);
    localStorage.setItem(listId, JSON.stringify(notes));

    displayNotes(listId); // Call displayNotes after deletion to refresh the UI
}

function updateNote(index, listId) {
    const notesList = document.getElementById(listId); // Get the specific list
    const notes = JSON.parse(localStorage.getItem(listId)) || []; // Get notes for this list
    const noteItem = notesList.querySelectorAll('.note-item')[index]; // Target note by index
    const updatedNote = noteItem.querySelector(`#editNote-${index}`).value.trim();

    if (updatedNote === "") {
        deleteNote(index, listId); // If the note is empty, delete it
    } else {
        // Update the note in localStorage
        notes[index] = updatedNote;
        localStorage.setItem(listId, JSON.stringify(notes));

        // Update the UI
        const noteText = noteItem.querySelector('.note-text');
        noteText.textContent = updatedNote;

        cancelEdit(index, listId); // Cancel edit mode after updating
    }
}

function cancelEdit(index, listId) {
    const notesList = document.getElementById(listId); // Get the specific list
    const noteItem = notesList.querySelectorAll('.note-item')[index]; // Target note by index
    const noteText = noteItem.querySelector('.note-text');
    const editContainer = noteItem.querySelector('.edit-container');
    const editButton = noteItem.querySelector('.edit-note');
    const deleteButton = noteItem.querySelector('.delete-note');

    // Restore visibility after canceling edit
    noteText.style.display = 'block';
    editContainer.style.display = 'none';
    editButton.style.display = 'block';
    deleteButton.style.display = 'block';
}



function copyServer() {
    const textToCopy = '31xxRy8Zpy'; // Server code to copy
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Server code copied to clipboard: ' + textToCopy);
    });
}

function copyPassword() {
    const textToCopy = 'PUBLICATC'; // Password to copy
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Password copied to clipboard: ' + textToCopy);
    });
}

function copyAtis() {
    const atisText = `Gran Canaria (GCLP)\n\nGCLP_APP [121.300]: @xaie9\n\n[**[CLICK HERE TO FILL UP FLIGHT PLAN]**](https://forms.gle/WfpsCb9wpCvrbcSc6)\n\n`;
    navigator.clipboard.writeText(atisText).then(() => {
        alert('ATIS copied to clipboard.');
    });
}

// Function to save flight plan with a timestamp
function saveFlightPlan(flightPlan) {
    const flightPlans = JSON.parse(localStorage.getItem('flightPlans')) || [];
    const timestamp = Date.now(); // Get the current time

    flightPlan.timestamp = timestamp; // Add timestamp to the flight plan
    flightPlans.push(flightPlan);
    localStorage.setItem('flightPlans', JSON.stringify(flightPlans));

    displayFlightPlans(); // Refresh UI
}

document.addEventListener('DOMContentLoaded', () => {
    const localNewsItem = document.getElementById('localNewsItem');

    // Define your single news item here
    const newsItem = {
        iframeSrc: "https://dev.project-flight.com/" // Replace with the actual iframe source you need
    };

    function createNewsItem(item) {
        localNewsItem.innerHTML = `
                        <div class="local-news-item-content">
                            <iframe 
                                class="windy-iframe" 
                                width="100%" 
                                height="450" 
                                src="https://dev.project-flight.com/"
                                frameborder="0">
                            </iframe>
                        </div>
                    `;
    }
    createNewsItem(newsItem);
});

// Initial display
displayFlightPlans();
displayNotes();