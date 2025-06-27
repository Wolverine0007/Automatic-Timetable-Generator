courses={};
function slotexpand(slotnames){
	slotnames=slotnames.replace(/[\s]/ig,"").toUpperCase();
	var finalslots=[];
	var slotlist=slotnames.split(/[;,]/ig);
	for (i in slotlist){
		var currslot=slotlist[i];
		switch (currslot){
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
			case "10":
			case "11":
				finalslots=finalslots.concat([currslot+"A",currslot+"B",currslot+"C"]);
				break;				
			default:
				finalslots.push(currslot);
		}
	}
	return finalslots;
}

// Data structure to store timetable data for multiple classes
const timetableData = {
    classes: {}, // Store timetables for different classes
    teachers: {}, // Track teacher schedules across all classes
    venues: {}, // Track venue usage across all classes
    currentClass: null // Currently active class
};

// Function to save timetable data to localStorage
function saveTimetableData() {
    localStorage.setItem('timetableData', JSON.stringify(timetableData));
}

// Function to load timetable data from localStorage
function loadTimetableData() {
    const savedData = localStorage.getItem('timetableData');
    if (savedData) {
        Object.assign(timetableData, JSON.parse(savedData));
    }
}

// Function to switch between classes
function switchClass(classId) {
    if (!classId) return;
    
    timetableData.currentClass = classId;
    
    // Clear current timetable display
    const allCells = document.querySelectorAll(".maintbl td.used");
    allCells.forEach(cell => {
        cell.querySelector(".course-name").innerText = "";
        cell.querySelector(".course-venue").innerText = "";
        cell.querySelector(".course-teacher").innerText = "";
        cell.classList.remove("used");
        cell.style.backgroundColor = "white";
        cell.style.display = "";
        cell.style.height = "";
        cell.rowSpan = "1";
    });

    // Load timetable for selected class
    if (timetableData.classes[classId]) {
        Object.entries(timetableData.classes[classId]).forEach(([slot, data]) => {
            const cells = document.getElementsByClassName(`slot-${slot}`);
            for (let cell of cells) {
                if (data.type === 'lab') {
                    cell.rowSpan = "2";
                    cell.style.height = "100px";
                    cell.querySelector(".course-name").innerText = data.course + " (Lab)";
                    cell.style.backgroundColor = "rgba(255, 182, 193, 0.5)";
                } else {
                    cell.querySelector(".course-name").innerText = data.course;
                    cell.style.backgroundColor = "rgba(173, 216, 230, 0.5)";
                }
                cell.querySelector(".course-venue").innerText = data.venue;
                cell.querySelector(".course-teacher").innerText = data.teacher;
                cell.classList.add("used");
            }
        });
    }
}

// Enhanced conflict checking function
function checkConflicts(slot, course, classId) {
    const conflicts = {
        teacherConflict: false,
        venueConflict: false,
        classConflict: false,
        details: []
    };

    // Check teacher conflicts across all classes
    if (timetableData.teachers[course.teacher]) {
        const teacherSlots = timetableData.teachers[course.teacher];
        if (teacherSlots[slot]) {
            conflicts.teacherConflict = true;
            conflicts.details.push(`Teacher ${course.teacher} is already teaching ${teacherSlots[slot].course} in class ${teacherSlots[slot].class} at slot ${slot}`);
        }
    }

    // Check venue conflicts across all classes
    if (timetableData.venues[course.venue]) {
        const venueSlots = timetableData.venues[course.venue];
        if (venueSlots[slot]) {
            conflicts.venueConflict = true;
            conflicts.details.push(`Venue ${course.venue} is already occupied by ${venueSlots[slot].course} in class ${venueSlots[slot].class} at slot ${slot}`);
        }
    }

    // Check class-specific conflicts
    if (timetableData.classes[classId] && timetableData.classes[classId][slot]) {
        conflicts.classConflict = true;
        conflicts.details.push(`This class already has ${timetableData.classes[classId][slot].course} scheduled at slot ${slot}`);
    }

    return conflicts;
}

// Function to update timetable data
function updateTimetableData(slot, course, classId, type = 'theory') {
    // Initialize class data if not exists
    if (!timetableData.classes[classId]) {
        timetableData.classes[classId] = {};
    }

    // Initialize teacher data if not exists
    if (!timetableData.teachers[course.teacher]) {
        timetableData.teachers[course.teacher] = {};
    }

    // Initialize venue data if not exists
    if (!timetableData.venues[course.venue]) {
        timetableData.venues[course.venue] = {};
    }

    // Update class timetable
    timetableData.classes[classId][slot] = {
        course: course.subject,
        teacher: course.teacher,
        venue: course.venue,
        type: type
    };

    // Update teacher schedule
    timetableData.teachers[course.teacher][slot] = {
        course: course.subject,
        class: classId,
        venue: course.venue,
        type: type
    };

    // Update venue schedule
    timetableData.venues[course.venue][slot] = {
        course: course.subject,
        teacher: course.teacher,
        class: classId,
        type: type
    };

    // Save updated data
    saveTimetableData();
}

function addCourse(coursename,slots,venue,color,lectureType,isAuto=false,classId='default'){
	 console.log(color);
	 eslots=slotexpand(slots);
	 
	 // Create a simpler course ID that doesn't include slots
	 slotid="course-"+coursename.replace(/[^A-Za-z0-9\-\_\:\.]/ig,'-');
	 
	 // If course already exists, check type
	 if(courses[slotid]) {
		 if (courses[slotid].lectureType && lectureType && courses[slotid].lectureType !== lectureType) {
			 alert('Cannot overwrite a '+courses[slotid].lectureType+' with a '+lectureType+' for the same course.');
			 return false;
		 }
		 courses[slotid].slots = courses[slotid].slots.concat(eslots);
	 } else {
		 courses[slotid]={"name":coursename,"slots":eslots,"venue":venue, "color" : color, "lectureType": lectureType};
	 }

	for(aslot in eslots){
		if($('.slot-'+eslots[aslot]).length<=0){
			alert("Slot "+eslots[aslot]+" does not exist");
			return false;
		}
	}
	
	 for (aslot in eslots){
		 eslots[aslot]=new String(eslots[aslot]);
		if($('.slot-'+eslots[aslot]+'.used').length>0||$('.slot-clash-'+eslots[aslot]+'.used').length>0){
			 // If lab or auto, always act as if 'Cancel' was pressed
			 if(lectureType === 'lab' || isAuto) {
				 delete courses[slotid];
				 return true;
			 }
			 var arr=$('.slot-'+eslots[aslot]+'.used,.slot-clash-'+eslots[aslot]+'.used').map(function(){return $(this).find('.slot-name').html()+" ("+$(this).find('.course-name').html()+")"}).get()
			 var arr2=$('.slot-'+eslots[aslot]+'.used,.slot-clash-'+eslots[aslot]+'.used').map(function(){return $(this).find('.course-name').html()}).get()
			// Filter out self-clashes by removing the current course from the clash list
			arr2 = arr2.filter(function(course) { return course !== coursename; });
			arr = arr.filter(function(slot) { return !slot.includes(coursename); });
			
			if(arr2.length > 0) {  // Only show clash warning if there are actual courses (excluding self)
				$('.course-name').each(function(){if(arr2.indexOf(this.innerHTML)!=-1){$(this).parents(".used").addClass('softDanger')}})
				$('.slot-'+eslots[aslot]+'.used,.slot-clash-'+eslots[aslot]+'.used').addClass('dangerRem').removeClass("softDanger")
				eslots[aslot].nooverwrite=!confirm("Slot clash of "+eslots[aslot]+" with "+arr.join(", ")+", overwrite other course or cancel this one?");
				$('.used').removeClass('dangerRem').removeClass('softDanger')
				if(!eslots[aslot].nooverwrite){
					$('.slot-'+eslots[aslot]+'.used,.slot-clash-'+eslots[aslot]+'.used').each(function(){$('.rmslot[data-slotid='+$(this).data('slotid')+']').click()});
				}else{
					delete courses[slotid];
					return true;
				}
			}
		}
	 }
	 
	 for (aslot in eslots){
		 console.log(eslots[aslot]+" "+eslots[aslot].overwrite)
		if(!eslots[aslot].nooverwrite){
			showSlot(eslots[aslot],true,color);
			var $slot=$('.slot-'+eslots[aslot]);
			$slot.find('.course-name').html(coursename);
			$slot.find('.course-venue').html(venue);
			$slot.data('slotid',slotid)
		}
	 }
	 
	 // Remove existing course entry if it exists
	 $('#list-'+slotid).remove();
	 
	 // Add new course entry
	 $('<tr id="list-'+slotid+'"><td><button type="button" class="btn btn-default btn-xs list-'+slotid+' " id="color-button-'+slotid+'"><span class="glyphicon glyphicon-pencil"></span></button></td><td id="list-name-'+slotid+'">'+coursename+'</td><td><button class="rmslot  btn-xs btn btn btn-danger" data-slotid="'+slotid+'">x</button></td></tr>').appendTo('#listb')
	 $('#color-button-' + slotid).attr('style', 'background-color:'+color+' !important')
	 .colorpicker({format: "rgba", color:color}).on('changeColor', function(ev){
		 var rgbc = ev.color.toRGB();
		 var rgbc_str = "rgba("+rgbc.r + "," + rgbc.g + "," + rgbc.b + ",0.36)";
		 courses[slotid].color = rgbc_str;
		 for (aslot in eslots){
			 if(!eslots[aslot].nooverwrite){
				 $('.slot-'+eslots[aslot]).attr('style', 'background-color:'+rgbc_str+' !important');
			 }
		 }
		 updatePerma()
		 $('#color-button-' + slotid).attr('style', 'background-color:'+rgbc_str+' !important');
	 });
	 
	 updatePerma()
	 $("#inputrow input:not(#color)").val("");
	 // 	$("#color").val("rgba(255, 255, 0, 0.36)"); // the previous used default color

    for (aslot in eslots) {
        eslots[aslot] = new String(eslots[aslot]);
        
        // Check for conflicts
        const conflicts = checkConflicts(eslots[aslot], {
            subject: coursename,
            teacher: venue, // Assuming venue parameter is actually teacher
            venue: venue
        }, classId);

        if (conflicts.teacherConflict || conflicts.venueConflict || conflicts.classConflict) {
            if (lectureType === 'lab' || isAuto) {
                delete courses[slotid];
                return true;
            }

            let conflictMessage = "Slot conflict detected:\n";
            if (conflicts.teacherConflict) {
                conflictMessage += `- Teacher ${venue} is already teaching ${conflicts.details[0]}\n`;
            }
            if (conflicts.venueConflict) {
                conflictMessage += `- Venue ${venue} is already occupied by ${conflicts.details[1]}\n`;
            }
            if (conflicts.classConflict) {
                conflictMessage += `- This class already has ${conflicts.details[2]}\n`;
            }

            if (!confirm(conflictMessage + "\nDo you want to overwrite?")) {
                delete courses[slotid];
                return true;
            }
        }

        // Update timetable data if no conflicts or user chose to overwrite
        updateTimetableData(eslots[aslot], {
            subject: coursename,
            teacher: venue,
            venue: venue
        }, classId, 'theory');
    }
 }
 

function updatePerma(){
	$('#perma').attr('href','?timetable='+encodeURIComponent(btoa(JSON.stringify(courses)))+"&slots="+$('#snametog').hasClass('active'));
	return $('#perma').attr('href');
}
 function showSlot(slotname,use,color){
	 $('.slot-'+slotname).show();
	 if(use){$('.slot-'+slotname).attr('style', 'background-color:'+color+' !important')
                               .addClass('used');}
	 $('.clashbuddy-'+slotname).show();
	 $('.slot-clash-'+slotname).hide();
 }
 function hideSlot(slotname,unuse){

	 if(unuse){$('.slot-'+slotname).removeClass('used')
			                           .attr('style', 'background-color:white !important');}

	 if($('.clashbuddy-'+slotname+".used").length==0&&$('.clashbuddy-'+slotname).length!=0){
		$('.slot-'+slotname).hide();
		$('.clashbuddy-'+slotname).hide();
		$('.slot-clash-'+slotname).show();	 		 
	 }

 }
 function toggleSlot(){
 $('#snametog').toggleClass('active')
	if($('#snametog').hasClass('active')){
	  $('.slot-name').show();
	  $('#snametog').html('Hide slot names');
	}else{
		$('.slot-name').hide();
		$('#snametog').html('Show slot names');
	};
  $('#snametog').blur();
  updatePerma();
  }
 function getJsonFromUrl() {
	 
  var query = location.search.substr(1);
  var data = query.split("&");
  var result = {};
  for(var i=0; i<data.length; i++) {
    var item = data[i].split("=");
    result[item[0]] = item[1];
  }
  return result;
}

function printable(){
	history.pushState({},"",updatePerma())
	if(confirm("Remove colors?")){
		$('.used').css('background-color','white')
	}
	$('body').html($('.maintbl').parent().html())
}

function validateICS()
{
	$('#icsForm').html(''); //clean
	$('.maintbl').find('td').each(function(){
	if($(this).hasClass("used"))
	{
		var slot = $(this).find('.slot-name').text();
		var venue = $(this).find('.course-venue').text();
		var course = $(this).find('.course-name').text();
		$('<input type = "hidden" name = "slot[]" value = "'+slot+'" />').appendTo($('#icsForm'));
		$('<input type = "hidden" name = "venue[]" value = "'+venue+'" />').appendTo($('#icsForm'));
		$('<input type = "hidden" name = "course[]" value = "'+course+'" />').appendTo($('#icsForm'));
	}
	});
	$('#icsForm').submit();
}

$(document).ready(function(){
	$('#listb').on('click','.rmslot',function(){
	var slotid=$(this).data('slotid');
	 slotid=slotid.replace(/\s/ig,'-');
	var slots=courses[slotid].slots;
	for(i in slots){
		//hideSlot(slots[i],true);
		var $slot=$('.slot-'+slots[i]);
		$slot.find('.course-name').html("");
		$slot.find('.course-venue').html("");
		$slot.removeClass('used');
		$slot.attr('style', 'background-color:white !important')
	}
  $('.list-' + slotid).colorpicker('destroy');
	$('#list-'+slotid).remove();
	delete courses[slotid];
	updatePerma();
});
lspl=getJsonFromUrl();
if(lspl["data"]&&lspl["data"].length>0){
	var courses2=JSON.parse(decodeURIComponent(lspl["data"]));
	for(i in courses2){
		if (!courses2[i].color) {
			courses2[i].color = "rgba(255, 255, 0, 0.36)";
		}
		addCourse(courses2[i].name,courses2[i].slots.join(";"),courses2[i].venue,courses2[i].color,courses2[i].lectureType);
	}

}
if(lspl["timetable"]&&lspl["timetable"].length>0){
	var courses2=JSON.parse(atob(decodeURIComponent(lspl["timetable"])));
	for(i in courses2){
		if (!courses2[i].color) {
			courses2[i].color = "rgba(255, 255, 0, 0.36)";
		}
		addCourse(courses2[i].name,courses2[i].slots.join(";"),courses2[i].venue,courses2[i].color,courses2[i].lectureType);
	}

}
if(lspl["slots"]&&lspl["slots"]=="false"){

	toggleSlot();
}
	updatePerma();
	
	$('#helpicon').popover({"title":"Separate multiple slots with a comma. <br>Slot groups like '4' also allowed","trigger":"hover","html":true,"placement":"bottom"});
	$('.structtd').html('<br><br>');
  $('.picker').colorpicker({format: "rgba"}).on('changeColor', function(ev){
		var ev_rgb = ev.color.toRGB();
		var alpha = ev_rgb.a
		if (alpha === 1) { alpha = 0.36; }
		var ev_str = "rgba("+ev_rgb.r+","+ev_rgb.g+","+ev_rgb.b+","+alpha+")";
		$("#color").val(ev_str);
	});
	$('.maintbl td').dblclick(function () {
	    var $this = $(this);
	    if($("#cslots").val()==""){
	    	$("#cslots").val($this.find("span").first().text());
	    }
	    else{
	    	var text=$("#cslots").val();
	    	text=text + "," + $this.find("span").first().text();
	    	$("#cslots").val(text);
	    }
	});

});
// Define your subjects and weekly lecture count
const subjects = [
    { code: "ADS", lectures: 3, teacher: "RMD" },
    { code: "EI", lectures: 2, teacher: "KS" },
    { code: "CG", lectures: 1, teacher: "NDK" },
    { code: "DBMS", lectures: 3, teacher: "MK" }
];

// List of available slots excluding lunch and 8th period
const slots = [
    "1A", "2A", "3A", "4A", "5A", "6A", "7A",
    "1B", "2B", "3B", "4B", "5B", "6B", "7B",
    "1C", "2C", "3C", "4C", "5C", "6C", "7C",
    "1D", "2D", "3D", "4D", "5D", "6D", "7D",
    "1E", "2E", "3E", "4E", "5E", "6E", "7E"
];

function autoGenerateTimetable() {
    const inputData = JSON.parse(localStorage.getItem("autoInputData"));
    if (!inputData) {
        alert("No input data found. Please fill out the auto input form.");
        return;
    }

    // Get batch and manual slots from input data
    const batchName = inputData.batch;
    const manualSlots = inputData.manualSlots || [];
    const courses = inputData.courses;

    // Clear previously auto-filled slots
    const allCells = document.querySelectorAll(".maintbl td.used");
    allCells.forEach(cell => {
        cell.querySelector(".course-name").innerText = "";
        cell.querySelector(".course-venue").innerText = "";
        cell.querySelector(".course-teacher").innerText = "";
        cell.classList.remove("used");
        cell.style.backgroundColor = "white";
        cell.style.display = "";
        cell.style.height = "";
        cell.rowSpan = "1";
    });

    // First, apply manual slot assignments
    manualSlots.forEach(slot => {
        const slotList = slot.slots.split(/[,\s]+/);
        slotList.forEach(slotName => {
            const cells = document.getElementsByClassName(`slot-${slotName}`);
            for (let cell of cells) {
                if (cell.querySelector(".course-name").innerText === "") {
                    // Check for conflicts before assigning
                    const conflicts = checkConflicts(slotName, {
                        subject: slot.subject,
                        teacher: "Manual",
                        venue: "Manual"
                    }, batchName);

                    if (conflicts.teacherConflict || conflicts.venueConflict || conflicts.classConflict) {
                        alert(`Conflict detected for manual slot ${slotName}:\n${conflicts.details.join('\n')}`);
                        continue;
                    }

                    cell.querySelector(".course-name").innerText = slot.subject;
                    cell.querySelector(".course-venue").innerText = "Manual";
                    cell.classList.add("used");
                    cell.style.backgroundColor = "rgba(144, 238, 144, 0.5)"; // Light green for manual slots

                    // Update timetable data
                    updateTimetableData(slotName, {
                        subject: slot.subject,
                        teacher: "Manual",
                        venue: "Manual"
                    }, batchName, 'manual');
                    break;
                }
            }
        });
    });

    // Define time periods with their corresponding slots
    const timePeriods = [
        {
            start: "8:30-9:25",
            end: "9:25-10:20",
            slots: ["1A", "4B", "7A", "3C", "7B"]
        },
        {
            start: "10:30-11:25",
            end: "11:25-12:20",
            slots: ["3A", "6A", "2B", "5C", "6B"]
        },
        {
            start: "1:15-2:10",
            end: "2:10-3:05",
            slots: ["5A", "8A", "4B", "7C", "8B"]
        },
        {
            start: "3:05-4:00",
            end: "4:00-4:50",
            slots: ["7A", "10A", "6B", "9C", "10B"]
        }
    ];

    // Create a map to track used slots and their details
    const usedSlots = new Map();
    // Track how many slots each course has been assigned
    const courseSlotsAssigned = new Map();
    // Track lab sessions for each course
    const labSessionsAssigned = new Map();

    // Define morning slots
    const morningSlots = [
        "1A", "4B", "7A", "3C", "7B",
        "2A", "5A", "1B", "4C", "5B",
        "3A", "6A", "2B", "5C", "6B",
        "4A", "7A", "3B", "6C", "7C"
    ];

    // First, handle lab lectures (they need 2 adjacent slots)
    courses.forEach(course => {
        if (course.lectureType === "lab") {
            labSessionsAssigned.set(course.subject, 0);
            const requiredLabSessions = course.lectures;
            // Build a list of all possible (period, slot) pairs for labs
            let labSlotPairs = [];
            timePeriods.forEach(period => {
                period.slots.forEach(slot => {
                    labSlotPairs.push({ period, slot });
                });
            });
            // Filter for priority 1: only use morning slots
            if (course.priority === 1) {
                labSlotPairs = labSlotPairs.filter(pair => morningSlots.includes(pair.slot));
            }
            shuffleArray(labSlotPairs);
            // Try to find adjacent slots for each lab session
            for (let pair of labSlotPairs) {
                if (labSessionsAssigned.get(course.subject) >= requiredLabSessions) break;
                const { period, slot } = pair;
                // Skip if slot is already used
                if (usedSlots.has(slot)) continue;
                // Find the cell for this slot
                    const cells = document.getElementsByClassName(`slot-${slot}`);
                    for (let cell of cells) {
                    // Skip if cell is hidden or already used
                    if (cell.style.display === "none" || cell.classList.contains("used")) continue;
                    // Get the row of this cell
                    const row = cell.parentElement;
                    const nextRow = row.nextElementSibling;
                    // Check if we can merge with the next row
                    if (nextRow && !nextRow.classList.contains("break-row")) {
                        const nextCell = nextRow.cells[Array.from(row.cells).indexOf(cell)];
                        // For priority 1, ensure nextCell is also a morning slot
                        if (course.priority === 1 && nextCell) {
                            const nextSlotName = nextCell.querySelector('.slot-name')?.innerText;
                            if (!morningSlots.includes(nextSlotName)) continue;
                        }
                        if (nextCell && !nextCell.classList.contains("used") && nextCell.style.display !== "none") {
                            // Mark both slots as used
                            usedSlots.set(slot, { course, type: 'lab', cell });
                            usedSlots.set(slot + "_nextrow", { course, type: 'lab', cell: nextCell }); // Mark next row's cell as used
                            // Merge the cells visually
                            cell.rowSpan = "2";
                            cell.style.height = "100px"; // Double height
                            cell.querySelector(".course-name").innerText = course.subject + " (Lab)";
                            cell.querySelector(".course-venue").innerText = course.venue;
                            cell.querySelector(".course-teacher").innerText = course.teacher;
                            cell.classList.add("used");
                            cell.style.backgroundColor = "rgba(255, 182, 193, 0.5)"; // Light pink for labs
                            // Hide the next cell
                            nextCell.style.display = "none";
                            nextCell.classList.add("used"); // Mark as used for logic
                            // Update lab sessions assigned for this course
                            const currentLabSessions = labSessionsAssigned.get(course.subject) + 1;
                            labSessionsAssigned.set(course.subject, currentLabSessions);
                            courseSlotsAssigned.set(course.subject, currentLabSessions);
                            break;
                        }
                    }
                }
            }
        }
    });

    // Then handle theory lectures
    courses.forEach(course => {
        if (course.lectureType === "theory") {
            let lecturesNeeded = course.lectures;
            courseSlotsAssigned.set(course.subject, 0);
            // Build a list of all possible (period, slot) pairs for theory
            let theorySlots = [];
            timePeriods.forEach(period => {
                period.slots.forEach(slot => {
                    theorySlots.push(slot);
                });
            });
            // Filter for priority 1: only use morning slots
            if (course.priority === 1) {
                theorySlots = theorySlots.filter(slot => morningSlots.includes(slot));
            }
            shuffleArray(theorySlots);
            for (let slot of theorySlots) {
                if (lecturesNeeded === 0) break;
                // Skip if slot is already used
                if (usedSlots.has(slot)) continue;
                const cells = document.getElementsByClassName(`slot-${slot}`);
                for (let cell of cells) {
                    // Skip if cell is hidden (part of a lab session)
                    if (cell.style.display === "none") continue;
                    if (cell.querySelector(".course-name").innerText === "") {
                        // Fill the slot visually
                        cell.querySelector(".course-name").innerText = course.subject;
                        cell.querySelector(".course-venue").innerText = course.venue;
                        cell.querySelector(".course-teacher").innerText = course.teacher;
                        cell.classList.add("used");
                        cell.style.backgroundColor = "rgba(173, 216, 230, 0.5)"; // Light blue for theory
                        // Mark slot as used
                        usedSlots.set(slot, { course, type: 'theory', cell });
                        // Update slots assigned for this course
                        courseSlotsAssigned.set(course.subject, courseSlotsAssigned.get(course.subject) + 1);
                        lecturesNeeded--;
                        break;
                    }
                }
            }
        }
    });

    // Verify slot assignments
    courses.forEach(course => {
        const slotsAssigned = courseSlotsAssigned.get(course.subject) || 0;
        if (slotsAssigned !== course.lectures) {
            console.warn(`Course ${course.subject} has ${slotsAssigned} slots assigned but needs ${course.lectures}`);
        }
    });

    // Save the generated timetable for this batch
    if (!timetableData.classes[batchName]) {
        timetableData.classes[batchName] = {};
    }

    // Update the permanent link after generation
    updatePerma();

    // After generating the timetable, save it for the batch
    saveTimetableData();
    
    // Switch to the newly generated timetable
    switchClass(batchName);
}

// Load timetable data when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTimetableData();
    
    // If there's a current class, display its timetable
    if (timetableData.currentClass) {
        switchClass(timetableData.currentClass);
    }
});
