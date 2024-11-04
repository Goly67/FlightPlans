let zoomLevel = 1;
let isDragging = false;
let currentX = 0, currentY = 0;
let initialMouseX, initialMouseY;

const image = document.getElementById('groundChartImage');
const container = document.getElementById('image-container');
const fullscreenButton = document.getElementById('fullscreen-btn');
const iframe = document.getElementById('groundChartImage');

// Disable default image dragging
image.addEventListener('dragstart', (event) => event.preventDefault());

// Zoom and transform updates using a single function
function updateImageTransform() {
    image.style.transform = zoomLevel === 1
        ? 'translate(-50%, -50%) scale(1)'
        : `translate(${currentX}px, ${currentY}px) scale(${zoomLevel})`;
}

// Debounce transform updates for dragging to improve performance
function dragImage(event) {
    if (isDragging) {
        requestAnimationFrame(() => {
            currentX += event.clientX - initialMouseX;
            currentY += event.clientY - initialMouseY;
            initialMouseX = event.clientX;
            initialMouseY = event.clientY;
            updateImageTransform();
        });
    }
}

image.addEventListener('pointerdown', (event) => {
    if (zoomLevel > 1) {
        isDragging = true;
        image.setPointerCapture(event.pointerId);
        image.style.cursor = 'grabbing';
        initialMouseX = event.clientX;
        initialMouseY = event.clientY;
        document.body.style.userSelect = 'none';
    }
});

image.addEventListener('pointerup', () => {
    isDragging = false;
    image.style.cursor = 'grab';
    document.body.style.userSelect = '';
});

image.addEventListener('pointermove', dragImage);

function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.2, 3);
    updateImageTransform();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.2, 1);
    updateImageTransform();
}

// Ground chart selection handling with cached state
function updateGroundChart() {
    const selector = document.getElementById('groundChartSelector');
    const selectedValue = selector.value;
    image.src = selectedValue;
    localStorage.setItem('selectedGroundChart', selectedValue);
    zoomLevel = 1;
    currentX = 0;
    currentY = 0;
    updateImageTransform();
}

// Full-screen toggle
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        iframe.requestFullscreen().catch(err => console.error(`Error enabling full-screen: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
}

fullscreenButton.addEventListener('click', toggleFullScreen);

// Load initial state and setup listeners only once
document.addEventListener("DOMContentLoaded", () => {
    const selector = document.getElementById('groundChartSelector');
    selector.addEventListener('change', updateGroundChart);
    
    const savedValue = localStorage.getItem('selectedGroundChart');
    if (savedValue) {
        selector.value = savedValue;
        image.src = savedValue;
    }
    
    updateGroundChart();

    // Handle local storage only once and use cached data for displaying flight plans, notes, etc.
    displayFlightPlans();
    loadNotes();

    // Frequency display on change
    const dropdown = document.getElementById('frequencyDropdown');
    dropdown.addEventListener('change', displayFrequency);
    const savedFrequency = localStorage.getItem('selectedFrequency');
    if (savedFrequency) {
        dropdown.value = savedFrequency;
        displayFrequency();
    }
});

function displayFrequency() {
    const dropdown = document.getElementById('frequencyDropdown');
    const selectedFrequency = dropdown.value;
    const displayElement = document.getElementById('frequencyDisplay');
    displayElement.textContent = selectedFrequency;
    localStorage.setItem('selectedFrequency', selectedFrequency);
}

// Other utility functions here...

function displayFlightPlans() {
    const flightPlansList = document.getElementById('flightPlansList');
    const flightPlans = JSON.parse(localStorage.getItem('flightPlans')) || [];
    flightPlansList.innerHTML = flightPlans.length
        ? flightPlans.map(plan => `
            <div class="flight-plan">
                <h3>${plan.callsign} - ${plan.departure} to ${plan.arrival}</h3>
                <p><strong>Aircraft:</strong> ${plan.aircraft}</p>
                <p><strong>Flight Rule Type:</strong> ${plan.flightRule}</p>
                <p><strong>SID:</strong> ${plan.sid}</p>
                <p><strong>Cruising Level:</strong> ${plan.cruisingLevel}</p>
                <p><strong>Squawk:</strong> ${plan.squawk || 'Not assigned'}</p>
            </div>`).join('')
        : '<p class="no-plans">No flight plans submitted yet.</p>';
}

function loadNotes() {
    ['notesList1', 'notesList2', 'notesList3'].forEach(displayNotes);
}

function displayNotes(listId) {
    const notesList = document.getElementById(listId);
    const notes = JSON.parse(localStorage.getItem(listId)) || [];
    notesList.innerHTML = notes.length
        ? `<ul class="notes-list">
            ${notes.map((note, index) => `
                <li class="note-item">
                    <span class="note-text">${note}</span>
                    <div class="button-container">
                        <button class="edit-note" onclick="editNote(${index}, '${listId}')">Edit</button>
                        <button class="delete-note" onclick="deleteNote(${index}, '${listId}')">Delete</button>
                    </div>
                </li>`).join('')}
        </ul>`
        : '<p class="no-notes">No notes added yet.</p>';
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
    const atisText = `Gran Canaria (GCLP)\n\nGCLP_APP [121.300]: @xaie9\n\n`;
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
                        <div class="compass-container">
            <img src="https://lh5.googleusercontent.com/5SWZemJiwH05gTUEqE4PcTC1OYhPZB38mOmrux7prgoSJ4SXG3t6ei1hqqV8DD2FDYME-j86EsqSFCRjrln4WwwJj1MtpDSbZL4DLruUZchaH7DTQ4JZdKVCtOVqpSWBsA=w739"
                class="compass" alt="Compass">
        </div>
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
