GLOBAL = {
  TASKS: [],
  PRECENCE: [],
};

$(document).ready(() => {
  $("#header-date").val(getTommorowDateString());
  $("#header-title").html(
    `שבצק ל${formatDayInWeekDate(new Date(getTommorowDateString()))}`
  );
  $("#header-date").change(handleMainDateChange);
  $("#ishereINDATE").change(handleIsHereInDateChange);
  $("#ishereINDATEtommorrow").change(handleIsHereInDateChange);
  $("#soldier-detail-modal").draggable();
  getFromServer();
});

// ------------------------------ HANDLERS ------------------------------
const handleMainDateChange = (e) => {
  TOM_DATE = e.target.value; // Update the global date variable
  $("#header-title").html(
    `שבצק ל${formatDayInWeekDate(new Date(e.target.value))}`
  ); // Set the header title
  renderTasksList(); // Re-render the tasks list based on the new date
};

const handleIsHereInDateChange = (e) => {
  $("#ishereIN").val("");
  $("#ishereINtommorrow").val("");
  todayDate = $("#ishereINDATE").val();
  tommorowDate = $("#ishereINDATEtommorrow").val();
  for (let i = 0; i < GLOBAL.PRECENCE.length; i++) {
    if (GLOBAL.PRECENCE[i].date === todayDate) {
      $("#ishereIN").val(GLOBAL.PRECENCE[i].name + "\n" + $("#ishereIN").val());
    }
    if (GLOBAL.PRECENCE[i].date === tommorowDate) {
      $("#ishereINtommorrow").val(
        GLOBAL.PRECENCE[i].name + "\n" + $("#ishereINtommorrow").val()
      );
    }
  }
};

const handleNameChange = (input, taskId) => {
  const task = getTaskById(taskId);
  if (task) {
    task.taskName = input.value.trim();
  }
};

// ------------------------------ EVENTS ------------------------------
const addNewTask = () => {
  let colornumber = GLOBAL.TASKS.length + 1;
  let color = getBrightColor(colornumber);
  const blockId = generateUniqID();
  const TaskId = generateUniqID();
  const startTimeStamp = new Date($("#header-date").val()).setHours(9, 0, 0, 0); // Set to 9:00 AM
  const endTimeStamp = new Date($("#header-date").val()).setHours(13, 0, 0, 0); // Set to 1:00 PM
  let newTask = {
    color: color,
    taskId: TaskId,
    blocks: [
      {
        blockId: blockId,
        soldierAmount: 1,
        startTimeStamp: startTimeStamp,
        endTimeStamp: endTimeStamp,
        duration: calculateDurationInHours(startTimeStamp, endTimeStamp),
        soldiersNames: [],
      },
    ],
    taskName: "משימה חדשה",
  };
  GLOBAL.TASKS.push(newTask);
  renderTasksList();
};

const initTimePickers = () => {
  GLOBAL.TASKS.forEach((task) => {
    task.blocks.forEach((block) => {
      // Initialize flatpickr for start time
      flatpickr(`#start-time-block-${block.blockId}`, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        minuteIncrement: 30,
        defaultDate: new Date(block.startTimeStamp),
        locale: "he",
        onChange: (selectedDates) => {
          block.startTimeStamp = selectedDates[0].getTime();
          block.duration = calculateDurationInHours(
            block.startTimeStamp,
            block.endTimeStamp
          );
          $(`#block-duration-${block.blockId}`).text(`${block.duration} שעות`); // Update the duration span
          $(`#end-span-${block.blockId}`).text(
            formatDayInWeekDate(new Date(block.endTimeStamp))
          ); // Update the end date span
          $(`#start-span-${block.blockId}`).text(
            formatDayInWeekDate(new Date(block.startTimeStamp))
          ); // Update the start date span
        },
      });

      // Initialize flatpickr for end time
      flatpickr(`#end-time-block-${block.blockId}`, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        minuteIncrement: 30,
        defaultDate: new Date(block.endTimeStamp),
        locale: "he",
        onChange: (selectedDates) => {
          block.endTimeStamp = selectedDates[0].getTime();
          block.duration = calculateDurationInHours(
            block.startTimeStamp,
            block.endTimeStamp
          );
          $(`#block-duration-${block.blockId}`).text(`${block.duration}  שעות`); // Update the duration span
          $(`#end-span-${block.blockId}`).text(
            formatDayInWeekDate(new Date(block.endTimeStamp))
          ); // Update the end date span
          $(`#start-span-${block.blockId}`).text(
            formatDayInWeekDate(new Date(block.startTimeStamp))
          ); // Update the start date span
        },
      });
    });
  });
};

const addNewBlock = (taskId, taskBodyId) => {
  const blockId = generateUniqID();
  const task = getTaskById(taskId);
  const lastBlock = task.blocks[task.blocks.length - 1];
  const newBlock = {
    blockId: blockId,
    soldierAmount: lastBlock.soldierAmount,
    startTimeStamp: lastBlock.endTimeStamp, // Start from the end of the last block
    endTimeStamp: lastBlock.endTimeStamp + lastBlock.duration * 60 * 60 * 1000,
    duration: lastBlock.duration,
    soldiersNames: [],
  };
  task.blocks.push(newBlock);
  renderTasksList();
};

const addSoldierToBlock = (blockId) => {
  const block = getBlockById(blockId);
  if (block) {
    block.soldierAmount++;
    renderTasksList();
  }
};
const removeBlock = (taskId, taskBodyId) => {
  const task = getTaskById(taskId);
  if (task && task.blocks.length > 1) {
    Swal.fire({
      title: "האם אתה בטוח?",
      text: "האם אתה בטוח שתרצה למחוק את הבלוק האחרון?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "כן, מחק",
      cancelButtonText: "ביטול",
    }).then((result) => {
      if (result.isConfirmed) {
        task.blocks.pop(); // Remove the last block
        renderTasksList();
      }
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "שגיאה",
      text: "אי אפשר למחוק את הבלוק היחידי שיש במשימה",
    });
  }
};

const removeSoldierFromBlock = (blockId) => {
  const block = getBlockById(blockId);
  if (block && block.soldierAmount > 1) {
    block.soldierAmount--;
    renderTasksList();
  } else {
    Swal.fire({
      icon: "error",
      title: "שגיאה",
      text: "אי אפשר למחוק את החייל האחרון בבלוק",
    });
  }
};
const removeTask = (taskId) => {
  Swal.fire({
    title: "האם אתה בטוח?",
    text: "האם אתה בטוח שתרצה למחוק את המשימה הזו?",
    icon: "warning",
    showCancelButton: true,
  }).then((result) => {
    if (result.isConfirmed) {
      // Remove the task from the global tasks array
      GLOBAL.TASKS = GLOBAL.TASKS.filter((task) => task.taskId !== taskId);
      renderTasksList();
    }
  });
};

const updateSoldierSelection = (blockId, soldierId, selectId) => {
  const block = getBlockById(blockId);
  if (block) {
    // If -1 is selected, remove the soldier with matching selectId
    if (soldierId === "-1") {
      const soldierIndex = block.soldiersNames.findIndex(
        (soldier) => soldier.selectId === selectId
      );
      if (soldierIndex !== -1) {
        block.soldiersNames.splice(soldierIndex, 1);
      }
      return;
    }

    // Find the soldier object from SOLIDJER array
    let soldierObj = SOLIDJER.find(
      (soldier) => soldier.keywords[1] === soldierId
    );

    if (soldierObj) {
      // Check if any soldier with the same name already exists in the block
      const isDuplicate = block.soldiersNames.some(
        (existingSoldier) => existingSoldier.value === soldierObj.value
      );
      soldierObj.selectId = selectId; // Add selectId to the soldier object

      if (!isDuplicate) {
        const existingSoldierIndex = block.soldiersNames.findIndex(
          (existingSoldier) => existingSoldier.selectId === selectId
        );

        if (existingSoldierIndex !== -1) {
          // Replace the existing soldier with the new one
          block.soldiersNames[existingSoldierIndex] = soldierObj;
        } else {
          // Add new soldier if no existing soldier found with this selectId
          block.soldiersNames.push(soldierObj);
        }
        renderDeatilSoldierModal(block, soldierObj);
      } else {
        Swal.fire({
          icon: "warning",
          title: "חייל כבר משובץ",
          text: "החייל הזה כבר משובץ בבלוק הזה.",
        });
        // Reset the select element to default value
        const selects = document.querySelectorAll(`#${selectId}`);
        selects[selects.length - 1].value = "-1";
      }
      const shiftColid = checkShiftsColids(block, soldierObj);
      if (shiftColid != null) {
        let textToWarn = `החייל ${
          soldierObj.value
        } כבר משובץ במשמרת אחרת באותו זמן.\n ${
          shiftColid.taskName
        } \n למשמרת ${formatDayAndTime(
          shiftColid.block.startTimeStamp
        )} - ${formatDayAndTime(shiftColid.block.endTimeStamp)}`;
        Swal.fire({
          icon: "warning",
          title: "התנגשות במשמרות",
          text: textToWarn,
          customClass: {
            container: "custom-swal-container",
            popup: "custom-swal-popup",
            header: "custom-swal-header",
            title: "custom-swal-title",
            text: "custom-swal-text",
          },
          showClass: {
            popup: "animate__animated animate__fadeInDown",
          },
          html: textToWarn.replace(/\n/g, "<br>"),
        });
        // Reset the select element to default value
        const selects = document.querySelectorAll(`#${selectId}`);
        selects[selects.length - 1].value = "-1";
        block.soldiersNames.pop();
      }
    }
  } else {
    console.error("Block not found with ID:", blockId);
  }
};

const moveto = (locationName) => {
  Swal.fire({
    title: "האם לשמור את השינויים?",
    text: "האם ברצונך לשמור את השינויים לפני המעבר לדף הבא? אם לא, השינויים יאבדו.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "כן, שמור",
    cancelButtonText: "לא, המשך בלי לשמור",
  }).then((result) => {
    if (result.isConfirmed) {
      //saveToserver();
      setTimeout(() => {
        window.location.href = `${locationName}.html`;
      }, 1000);
    } else {
      window.location.href = `${locationName}.html`;
    }
  });
  return;
};

const saveHeres = () => {
  todayDate = $("#ishereINDATE").val();
  tommorowDate = $("#ishereINDATEtommorrow").val();
  const soldiersToday = $("#ishereIN").val().split("\n");
  const soldiersTommorrow = $("#ishereINtommorrow").val().split("\n");

  // Remove existing entries for today and tomorrow dates only
  GLOBAL.PRECENCE = GLOBAL.PRECENCE.filter(
    (soldier) => soldier.date !== todayDate && soldier.date !== tommorowDate
  );

  // Add today's soldiers
  soldiersToday.forEach((soldier) => {
    if (soldier.trim()) {
      GLOBAL.PRECENCE.push({
        name: soldier.trim(),
        date: todayDate,
        isHere: true,
      });
    }
  });

  // Add tomorrow's soldiers
  soldiersTommorrow.forEach((soldier) => {
    if (soldier.trim()) {
      GLOBAL.PRECENCE.push({
        name: soldier.trim(),
        date: tommorowDate,
        isHere: true,
      });
    }
  });

  Swal.fire({
    title: "החיילים נשמרו בהצלחה!",
    icon: "success",
    confirmButtonText: "אישור",
  }).then(() => {
    closeishereModal();
  });
};

// ------------------------------ RENDERS ------------------------------
const renderTasksList = () => {
  const $taskContainer = $("#tasks-container");
  $taskContainer.empty(); // Clear the container before rendering
  // Get the selected date from header-date input
  const selectedDate = $("#header-date").val();
  const selectedDateObj = new Date(selectedDate);
  selectedDateObj.setHours(0, 0, 0, 0); // Reset time to start of day

  // Filter tasks that have blocks on the selected date
  const filteredTasks = GLOBAL.TASKS.map((task) => {
    // Create a copy of the task
    const filteredTask = { ...task };

    // Filter blocks that start or end on selected date
    filteredTask.blocks = task.blocks.filter((block) => {
      const blockStartDate = new Date(block.startTimeStamp);
      const blockEndDate = new Date(block.endTimeStamp);
      blockStartDate.setHours(0, 0, 0, 0);
      blockEndDate.setHours(0, 0, 0, 0);

      return (
        blockStartDate.getTime() === selectedDateObj.getTime() ||
        blockEndDate.getTime() === selectedDateObj.getTime()
      );
    });

    return filteredTask;
  }).filter((task) => task.blocks.length > 0); // Only keep tasks that have matching blocks

  let taskHTML = "";
  console.log("Filtered Tasks:", filteredTasks);
  filteredTasks.forEach((task) => {
    taskHTML += `<div class="table-container" id="${task.taskId}">`;
    taskHTML += `<span class="task-close" onclick="removeTask('${task.taskId}')">X</span>`;
    taskHTML += `<h2 style="background-color: ${task.color}">`;
    taskHTML += `<input style="background-color: ${task.color}" type="text" class="task-title" id="" onKeyUp="handleNameChange(this,'${task.taskId}')" value="${task.taskName}" />`;
    taskHTML += `</h2>`;
    taskHTML += `<table class="example-task">`;
    taskHTML += `<thead>`;
    taskHTML += `<tr>`;
    taskHTML += `<th class="task-time">שעות</th>`;
    taskHTML += `<th class="solijer-name">שם חייל</th>`;
    taskHTML += `</tr>`;
    taskHTML += `</thead>`;
    taskHTML += `<tbody id="task-body-${task.taskId}">`;
    task.blocks.forEach((block) => {
      if (typeof block.soldiersNames == "undefined") {
        block.soldiersNames = [];
      }
      taskHTML += `<tr id="tr-${block.blockId}">`;
      taskHTML += `<td class="task-time">`;
      taskHTML += `<div class="block-times">`;
      taskHTML += `<div class="block-time-start">`;
      taskHTML += `<span class="start-time-span"> מתחיל </span><br />`;
      taskHTML += `<span id="start-span-${
        block.blockId
      }" class="day-span">${formatDayInWeekDate(
        new Date(block.startTimeStamp)
      )}</span>`;
      taskHTML += `<input type="text" class="flat-picker flat-start" id="start-time-block-${block.blockId}"/>`;
      taskHTML += `</div>`;
      taskHTML += `<div class="block-time-end">`;
      taskHTML += `<span class="end-time-span"> מסתיים </span><br />`;
      taskHTML += `<span id="end-span-${
        block.blockId
      }" class="day-span">${formatDayInWeekDate(
        new Date(block.endTimeStamp)
      )}</span>`;
      taskHTML += `<input type="text" class="flat-picker flat-end" id="end-time-block-${block.blockId}"/>`;
      taskHTML += `</div>`;
      taskHTML += `</div>`;
      taskHTML += `<h2 id="block-duration-${block.blockId}">משך: ${block.duration} שעות</h2>`;
      taskHTML += `</td>`;
      taskHTML += `<td class="solijer-name">`;
      taskHTML += `<div id="soldier-amounts-block${block.blockId}" class="block-amounts">`;
      for (let i = 0; i < block.soldierAmount; i++) {
        const selectedSoldier = block.soldiersNames[i] || null;
        taskHTML += `<select onchange="updateSoldierSelection('${block.blockId}',this.value,this.id)" name="" class="soldier-select" id="soldier-select-block${block.blockId}-${i}">`;
        taskHTML += `<option value="-1">בחר חייל..</option>`;
        // Assuming you have a function to get soldiers, you can loop through them here
        let soldiersAreHere = getSoldierObjByPrences(
          block.startTimeStamp,
          block.endTimeStamp
        );
        soldiersAreHere.forEach((soldier) => {
          const isSelected =
            selectedSoldier &&
            selectedSoldier.keywords[1] === soldier.keywords[1];
          let backgroundColor = "";
          switch (soldier.keywords[0]) {
            case "7":
              backgroundColor = "#ffcdd2"; // light red
              break;
            case "אוהד":
              backgroundColor = "#bbdefb"; // light blue
              break;
            case "בייניש":
              backgroundColor = "#c8e6c9"; // light green
              break;
            case "מסופח":
              backgroundColor = "#fff9c4"; // light yellow
              break;
            case 'מפל"ג':
              backgroundColor = "#e1bee7"; // light purple
              break;
          }
          taskHTML += `<option onmouseover="handleMouseOverSelection(this, '${
            block.blockId
          }')"  style="background-color: ${backgroundColor}" value="${
            soldier.keywords[1]
          }" ${isSelected ? "selected" : ""}>${soldier.value}</option>`;
        });
        taskHTML += `</select>`;
      }
      taskHTML += `</div>`;
      taskHTML += `<button onclick="addSoldierToBlock('${block.blockId}')" class="add-soldier-btn">+</button>`;
      taskHTML += `<button onclick="removeSoldierFromBlock('${block.blockId}')" class="remove-soldier-btn">-</button>`;
      taskHTML += `</td>`;
      taskHTML += `</tr>`;
    });
    taskHTML += `</tbody>`;
    taskHTML += `</table>`;
    taskHTML += `<div class="add-block-btn-wraper">`;
    taskHTML += `<button onclick="addNewBlock('${task.taskId}', 'task-body-${task.taskId}')" class="add-block-btn">+</button>`;
    taskHTML += `<button onclick="removeBlock('${task.taskId}', 'task-body-${task.taskId}')" class="remove-block-btn">-</button>`;
    taskHTML += `</div>`;
    taskHTML += `</div>`; // Close table-container
  });
  $taskContainer.html(taskHTML); // Render the tasks in the container
  initTimePickers(); // Initialize time pickers for the newly rendered tasks
};
const renderDeatilSoldierModal = (block, soldierObj) => {
  const lastShift = getLatestShiftBefore(
    soldierObj.keywords[1],
    block.startTimeStamp
  );

  console.log("Last Shift in renderDeatilSoldierModal:", lastShift);
  if (lastShift) {
    const restTimeHours = calculateDurationInHours(
      lastShift.block.endTimeStamp,
      block.startTimeStamp
    );
    const spanColor = getColorForDurationSpan(
      lastShift.block.duration,
      restTimeHours
    );
    $("#soldier-name").text(soldierObj.value);
    $("#soldier-unit").text("מחלקת " + soldierObj.keywords[0]); // Assuming keywords[0] is the unit
    $("#last-task-name").text(lastShift.taskName);
    $("#last-task-date").html(
      `התחיל ב${formatDayAndTime(
        lastShift.block.startTimeStamp
      )} עד ${formatDayAndTime(lastShift.block.endTimeStamp)} <br />`
    );
    $("#last-task-duration").text(
      `משך המשימה : ${lastShift.block.duration} שעות`
    );
    $("#last-task-rest").html(
      `מנוחה עד למשימה הבאה לשיבוץ :
       <span id="last-task-rest-time">${restTimeHours} שעות</span>`
    );
    $("#last-task-rest-time").css("background-color", spanColor);
    $("#soldier-detail-modal").fadeIn();
  }
};
// ------------------------------ HELPERS ------------------------------
const getTommorowDateString = () => {
  let tommorowDate = new Date();
  tommorowDate.setDate(tommorowDate.getDate() + 1);
  return tommorowDate.toISOString().split("T")[0]; // Format to YYYY-MM-DD
};

const getSoldierObjByPrences = (blockStartTimeStamp, BlockEndTimeStamp) => {
  let soldierArrayToReturn = [];
  const startDate = new Date(blockStartTimeStamp).toISOString().split("T")[0];
  const endDate = new Date(BlockEndTimeStamp).toISOString().split("T")[0];

  // Get all soldier names who are present on either start or end date
  const presentSoldierNames = GLOBAL.PRECENCE.filter(
    (presence) => presence.date === startDate || presence.date === endDate
  ).map((presence) => presence.name.trim().toLowerCase());

  // Filter SOLIDJER array to get only present soldiers
  soldierArrayToReturn = SOLIDJER.filter((soldier) =>
    presentSoldierNames.includes(soldier.value.trim().toLowerCase())
  );

  return soldierArrayToReturn;
};
const getTaskById = (taskId) => {
  const task = GLOBAL.TASKS.find((task) => task.taskId === taskId);
  if (task) {
    return task;
  } else {
    console.error("Task not found with ID:", taskId);
    return null;
  }
};
const getBlockById = (blockId) => {
  const task = GLOBAL.TASKS.find((task) =>
    task.blocks.find((block) => block.blockId === blockId)
  );
  if (task) {
    return task.blocks.find((block) => block.blockId === blockId);
  } else {
    console.error("Block not found with ID:", blockId);
    return null;
  }
};
// Add this new helper function to format the date
function formatDayInWeekDate(date) {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const dayName = days[date.getDay()];
  return `יום ${dayName}`;
}
const generateUniqID = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};
function getBrightColor(number) {
  const colors = [
    "#FF5252", // bright red
    "#4CAF50", // bright green
    "#448AFF", // bright blue
  ];

  // Use modulo to cycle through colors (number - 1 to make it 0-based)
  const colorIndex = (number - 1) % colors.length;
  return colors[colorIndex];
}
const calculateDurationInHours = (startTimestamp, endTimestamp) => {
  const diffInMilliseconds = endTimestamp - startTimestamp;
  const diffInHours = diffInMilliseconds / (1000 * 60 * 60); // Convert from milliseconds to hours
  return Math.round(diffInHours * 100) / 100; // Round to 2 decimal places
};
const showHereModal = () => {
  $("#ishereIN").val("");
  $("#ishereINtommorrow").val("");
  let todayDate = $("#ishereINDATE").val(
    new Date().toISOString().split("T")[0]
  );
  let tommorowDate = $("#ishereINDATEtommorrow").val(
    new Date(getTommorowDateString()).toISOString().split("T")[0]
  );
  for (let i = 0; i < GLOBAL.PRECENCE.length; i++) {
    if (GLOBAL.PRECENCE[i].date === todayDate.val()) {
      $("#ishereIN").val(GLOBAL.PRECENCE[i].name + "\n" + $("#ishereIN").val());
    }
    if (GLOBAL.PRECENCE[i].date === tommorowDate.val()) {
      $("#ishereINtommorrow").val(
        GLOBAL.PRECENCE[i].name + "\n" + $("#ishereINtommorrow").val()
      );
    }
  }
  $(".modal-ishere").fadeIn();
};
const closeishereModal = () => {
  $(".modal-ishere").fadeOut();
};

const getColorForDurationSpan = (
  last_mission_duration,
  current_rest_duration
) => {
  console.log("last_mission_duration", last_mission_duration);
  console.log("current_rest_duration", current_rest_duration);
  if (last_mission_duration >= current_rest_duration) {
    return "#fba5a5";
  }
  if (last_mission_duration * 2 >= current_rest_duration) {
    return "#f8d986";
  }
  if (last_mission_duration * 2 < current_rest_duration) {
    return "#4CAF50";
  }
};

const closeModalByID = (id) => {
  $(`#${id}`).fadeOut();
};

const checkShiftsColids = (wantedBlock, soldObj) => {
  soldierShift = getBlocksBySoldierId(soldObj.keywords[1]);
  // Return the first conflicting block, or null if no conflicts
  for (let entry of soldierShift) {
    // Skip if this is the same block we're checking against
    if (entry.block.blockId === wantedBlock.blockId) continue;

    // Check for overlap
    const blockStart = entry.block.startTimeStamp;
    const blockEnd = entry.block.endTimeStamp;
    const wantedStart = wantedBlock.startTimeStamp;
    const wantedEnd = wantedBlock.endTimeStamp;

    if (
      (wantedStart >= blockStart && wantedStart < blockEnd) || // Start time overlaps
      (wantedEnd > blockStart && wantedEnd <= blockEnd) || // End time overlaps
      (wantedStart <= blockStart && wantedEnd >= blockEnd) // Completely contains the other block
    ) {
      return entry;
    }
  }
  return null;
};

function getBlocksBySoldierId(soldierId) {
  // Array to store matching blocks with task context
  let soldierBlocks = [];

  // Loop through each task
  GLOBAL.TASKS.forEach((task) => {
    // Loop through each block in the task
    task.blocks.forEach((block) => {
      // Check if soldiersNames exists and has entries
      if (block.soldiersNames && block.soldiersNames.length > 0) {
        // Check if any soldier in the block matches the ID
        const hasSoldier = block.soldiersNames.some(
          (soldier) => soldier.keywords && soldier.keywords[1] === soldierId
        );

        if (hasSoldier) {
          // Add block with task context
          soldierBlocks.push({
            taskId: task.taskId,
            taskName: task.taskName,
            taskColor: task.color,
            block: {
              ...block,
              // Include only the matching soldier
              soldiersNames: block.soldiersNames.filter(
                (soldier) => soldier.keywords[1] === soldierId
              ),
            },
          });
        }
      }
    });
  });

  return soldierBlocks;
}

function formatDayAndTime(timestamp) {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const date = new Date(timestamp);
  const dayName = days[date.getDay()];

  // Format hours and minutes with leading zeros
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `יום ${dayName} בשעה ${hours}:${minutes}`;
}

function getLatestShiftBefore(soldierId, timestamp) {
  // Array to store all matching blocks with task context
  let soldierBlocks = [];

  // Loop through each task in GLOBAL.TASKS
  GLOBAL.TASKS.forEach((task) => {
    // Loop through each block in the task
    task.blocks.forEach((block) => {
      // Check if block ends before the given timestamp and has soldiers
      if (
        block.endTimeStamp <= timestamp &&
        block.soldiersNames &&
        block.soldiersNames.length > 0
      ) {
        // Check if the soldier is assigned to this block
        const hasSoldier = block.soldiersNames.some(
          (soldier) => soldier.keywords && soldier.keywords[1] === soldierId
        );

        if (hasSoldier) {
          // Add block with task context
          soldierBlocks.push({
            taskId: task.taskId,
            taskName: task.taskName,
            taskColor: task.color,
            block: {
              ...block,
              // Include only the matching soldier
              soldiersNames: block.soldiersNames.filter(
                (soldier) => soldier.keywords[1] === soldierId
              ),
            },
          });
        }
      }
    });
  });

  // Sort blocks by endTimeStamp in descending order (latest first)
  soldierBlocks.sort((a, b) => b.block.endTimeStamp - a.block.endTimeStamp);

  // Return the latest block (first after sorting) or null if no blocks found
  return soldierBlocks.length > 0 ? soldierBlocks[0] : null;
}
// ------------------------------ SERVER ------------------------------
const saveToserver = () => {
  $(".loader").show();
  Save("Data2", GLOBAL);
};

const getFromServer = () => {
  $(".loader").show();
  ReadFrom("Data2", (data) => {
    $(".loader").hide();
    if (data) {
      GLOBAL = data;
      if (!GLOBAL.TASKS) {
        GLOBAL.TASKS = [];
      }
      if (!GLOBAL.PRECENCE) {
        GLOBAL.PRECENCE = [];
      }

      console.log("Data loaded from server:", GLOBAL);
      renderTasksList();
      Swal.fire({
        title: "הנתונים נטענו בהצלחה!",
        icon: "success",
        confirmButtonText: "אישור",
      });
    } else {
      Swal.fire({
        title: "שגיאה בטעינת הנתונים או שמאגר הנתונים ריק",
        text: "מאגר הנתונים ריק,לא נמצאו נתונים בשרת לכל בעיה ניתן לדבר עם סיני 051-2122453",
        icon: "info",
        confirmButtonText: "אישור",
      });
    }
  });
};
