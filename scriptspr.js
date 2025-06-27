document.addEventListener('DOMContentLoaded', () => {
  const venueCountInput = document.getElementById('venueCount');
  const venueDetailsContainer = document.getElementById('venueDetails');
  const timeSlotCountInput = document.getElementById('timeSlotCount');
  const timeSlotDetailsContainer = document.getElementById('timeSlotDetails');
  const timetableForm = document.getElementById('timetableForm');
  const timetableDiv = document.getElementById('timetable');
  const downloadBtn = document.getElementById('downloadPdf');

  // Generate venue fields
  venueCountInput.addEventListener('input', () => {
    const count = parseInt(venueCountInput.value, 10);
    venueDetailsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const div = document.createElement('div');
      div.classList.add('venue-capacity');
      div.innerHTML = `
        <input type="text" placeholder="Venue ${i + 1} Name" required />
        <input type="number" placeholder="Capacity (e.g., 20)" min="1" required />
      `;
      venueDetailsContainer.appendChild(div);
    }
  });

  // Generate time slot fields
  timeSlotCountInput.addEventListener('input', () => {
    const count = parseInt(timeSlotCountInput.value, 10);
    timeSlotDetailsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const div = document.createElement('div');
      div.classList.add('time-slot-group');
      div.innerHTML = `
        <input type="text" placeholder="Time Slot ${i + 1} (e.g., 8:00 AM - 11:00 AM)" required />
      `;
      timeSlotDetailsContainer.appendChild(div);
    }
  });

  function formatDayDate(dateObj) {
    const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(dateObj);
    let dayName = '', month = '', day = '', year = '';
    parts.forEach(part => {
      if (part.type === 'weekday') dayName = part.value.toUpperCase();
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
      if (part.type === 'year') year = part.value;
    });
    return `${dayName} (${day}-${month}-${year})`;
  }

  // Generate timetable
  timetableForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const startId = parseInt(document.getElementById('startId').value, 10);
    const endId = parseInt(document.getElementById('endId').value, 10);
    const examDateValue = document.getElementById('examDate').value;
    const subject = document.getElementById('subject').value.trim();

    const venueDivs = venueDetailsContainer.querySelectorAll('.venue-capacity');
    const venues = [];
    venueDivs.forEach(div => {
      const inputs = div.getElementsByTagName('input');
      const name = inputs[0].value.trim();
      const capacity = parseInt(inputs[1].value, 10);
      venues.push({ name, capacity });
    });

    const timeSlotInputs = timeSlotDetailsContainer.getElementsByTagName('input');
    const timeSlots = [];
    for (let i = 0; i < timeSlotInputs.length; i++) {
      timeSlots.push(timeSlotInputs[i].value.trim());
    }

    if (startId > endId) {
      alert('Starting Student ID must be less than or equal to Ending Student ID.');
      return;
    }
    if (venues.length === 0 || timeSlots.length === 0 || subject === '') {
      alert('Please enter at least one venue, one time slot, and the subject.');
      return;
    }

    let currentDate = new Date(examDateValue);
    if (isNaN(currentDate.getTime())) {
      alert('Invalid Exam Date. Please select a valid date.');
      return;
    }

    let assignments = [];
    let currentStudentId = startId;

    while (currentStudentId <= endId) {
      const currentDayStr = formatDayDate(currentDate);
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        for (let venue of venues) {
          if (currentStudentId > endId) break;
          const studentRangeStart = currentStudentId;
          const studentRangeEnd = Math.min(currentStudentId + venue.capacity - 1, endId);
          assignments.push({
            dayDate: currentDayStr,
            timeSlot: timeSlots[slotIndex],
            venue: venue.name,
            studentRange: `${studentRangeStart} - ${studentRangeEnd}`
          });
          currentStudentId = studentRangeEnd + 1;
        }
        if (currentStudentId > endId) break;
      }
      if (currentStudentId <= endId) {
        do {
          currentDate.setDate(currentDate.getDate() + 1);
        } while (currentDate.getDay() === 0); // 0 = Sunday
      }
      
    }

    const groups = {};
    assignments.forEach(item => {
      const key = `${item.dayDate}|${item.timeSlot}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    let timetableHTML = `<h3>Subject: ${subject}</h3>`;
    Object.keys(groups).forEach(key => {
      const group = groups[key];
      timetableHTML += `<table class="group-table">
        <tr class="group-header">
          <td colspan="3" contenteditable="true">${group[0].dayDate} - ${group[0].timeSlot}</td>
        </tr>
        <tr>
          <th>S.No</th>
          <th>Venue</th>
          <th>Student IDs</th>
        </tr>`;
      group.forEach((assignment, index) => {
        timetableHTML += `<tr>
          <td contenteditable="true">${index + 1}</td>
          <td contenteditable="true">${assignment.venue}</td>
          <td contenteditable="true">${assignment.studentRange}</td>
        </tr>`;
      });
      timetableHTML += `</table>`;
    });

    timetableDiv.innerHTML = `<h2>Exam Timetable</h2>${timetableHTML}`;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.id = 'editButton';
    editBtn.style.marginRight = '10px';
    editBtn.style.padding = '8px 16px';
    editBtn.style.fontSize = '16px';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Changes';
    saveBtn.id = 'saveChanges';
    saveBtn.style.padding = '8px 16px';
    saveBtn.style.fontSize = '16px';

    const makeEditable = (editable) => {
      const cells = timetableDiv.querySelectorAll('td[contenteditable]');
      cells.forEach(cell => {
        cell.setAttribute('contenteditable', editable);
      });
    };

    makeEditable('false');
    editBtn.addEventListener('click', () => makeEditable('true'));
    saveBtn.addEventListener('click', () => {
      makeEditable('false');
      alert('Changes saved successfully!');
    });

    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(saveBtn);
    timetableDiv.appendChild(buttonContainer);

    downloadBtn.style.display = 'block';
    downloadBtn.style.marginTop = '10px';
    downloadBtn.style.padding = '8px 16px';
  });

  downloadBtn.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'pt', 'a4');
    

  
    // Clone the timetable div
    const clonedTimetable = timetableDiv.cloneNode(true);
  
    // Remove buttons from the cloned div
    const buttons = clonedTimetable.querySelectorAll('button');
    buttons.forEach(button => button.remove());
  
    // Create a hidden container to hold the cleaned timetable
    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'fixed';
    hiddenContainer.style.top = '-10000px';
    hiddenContainer.appendChild(clonedTimetable);
    document.body.appendChild(hiddenContainer);
  
    // Generate PDF from the cleaned clone
    await doc.html(clonedTimetable, {
      callback: function (doc) {
        doc.setTextColor(200);
doc.setFontSize(30);
doc.text("CONFIDENTIAL", doc.internal.pageSize.width / 2, doc.internal.pageSize.height / 2, {
  align: "center",
  angle: 45,
});

doc.setTextColor(0);
doc.setFontSize(10);
const dateStr = new Date().toLocaleDateString();
doc.text(`Generated on: ${dateStr}`, 40, doc.internal.pageSize.height - 30);
doc.text('__________________\nPrincipal Signature', doc.internal.pageSize.width - 150, doc.internal.pageSize.height - 30);

        doc.save('ExamTimetable.pdf');
        document.body.removeChild(hiddenContainer); // clean up
      },
      x: 20,
      y: 20,
      width: 570,
      html2canvas: {
        scale: 2
      }
    });
  });
  
  
  

  window.addEventListener("beforeunload", (e) => {
    if (timetableDiv.innerHTML.trim() !== '') {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  window.addEventListener("unload", () => {
    timetableDiv.innerHTML = '';
  });
});
window.generateTimetableFromData = function(formData) {
  // Helper function for formatting date
  function formatDayDate(dateObj) {
    const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(dateObj);
    let dayName = '', month = '', day = '', year = '';
    parts.forEach(part => {
      if (part.type === 'weekday') dayName = part.value.toUpperCase();
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
      if (part.type === 'year') year = part.value;
    });
    return `${dayName} (${day}-${month}-${year})`;
  }

  const timetableDiv = document.getElementById('timetable');
  const downloadBtn = document.getElementById('downloadPdf');
  const { startId, endId, examDateValue, subject, venues, timeSlots } = formData;

  let currentDate = new Date(examDateValue);
  let assignments = [];
  let currentStudentId = startId;

  while (currentStudentId <= endId) {
    const currentDayStr = formatDayDate(currentDate);
    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
      for (let venue of venues) {
        if (currentStudentId > endId) break;
        const studentRangeStart = currentStudentId;
        const studentRangeEnd = Math.min(currentStudentId + venue.capacity - 1, endId);
        assignments.push({
          dayDate: currentDayStr,
          timeSlot: timeSlots[slotIndex],
          venue: venue.name,
          studentRange: `${studentRangeStart} - ${studentRangeEnd}`
        });
        currentStudentId = studentRangeEnd + 1;
      }
      if (currentStudentId > endId) break;
    }
    if (currentStudentId <= endId) {
      do {
        currentDate.setDate(currentDate.getDate() + 1);
      } while (currentDate.getDay() === 0); // Skip Sundays
    }
  }

  const groups = {};
  assignments.forEach(item => {
    const key = `${item.dayDate}|${item.timeSlot}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  let timetableHTML = `<h3>Subject: ${subject}</h3>`;
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    timetableHTML += `<table class="group-table">
      <tr class="group-header">
        <td colspan="3" contenteditable="true">${group[0].dayDate} - ${group[0].timeSlot}</td>
      </tr>
      <tr>
        <th>S.No</th>
        <th>Venue</th>
        <th>Student IDs</th>
      </tr>`;
    group.forEach((assignment, index) => {
      timetableHTML += `<tr>
        <td contenteditable="true">${index + 1}</td>
        <td contenteditable="true">${assignment.venue}</td>
        <td contenteditable="true">${assignment.studentRange}</td>
      </tr>`;
    });
    timetableHTML += `</table>`;
  });

  timetableDiv.innerHTML = `<h2>Exam Timetable</h2>${timetableHTML}`;

  // Show download button
  if (downloadBtn) {
    downloadBtn.style.display = 'block';
    downloadBtn.style.marginTop = '10px';
    downloadBtn.style.padding = '8px 16px';
  }
};