GLOBAL = {
  TASKS: [],
};

$(document).ready(() => {
  $("#header-date").val(getTommorowDateString());
  $("#header-title").html(
    `שבצק ל${formatDayInWeekDate(new Date(getTommorowDateString()))}`
  );
  $("#header-date").change(handleMainDateChange);

  //   flatpickr("#start-time-block-456", {
  //     enableTime: true,
  //     dateFormat: "Y-m-d H:i",
  //     time_24hr: true,
  //     minuteIncrement: 15,
  //     defaultDate: new Date(getTommorowDateString()).setHours(9, 0, 0, 0), // Set to 9:00 AM
  //     locale: "he",
  //   });
  //   flatpickr("#end-time-block-456", {
  //     enableTime: true,
  //     dateFormat: "Y-m-d H:i",
  //     time_24hr: true,
  //     minuteIncrement: 15,
  //     defaultDate: new Date(getTommorowDateString()).setHours(13, 0, 0, 0), // Set to 9:00 AM
  //     locale: "he",
  //   });
});

// ------------------------------ HANDLERS ------------------------------
const handleMainDateChange = (e) => {
  TOM_DATE = e.target.value; // Update the global date variable
  $("#header-title").html(
    `שבצק ל${formatDayInWeekDate(new Date(e.target.value))}`
  ); // Set the header title
};
// ------------------------------ EVENTS ------------------------------
const addNewTask = () => {
  let colornumber = GLOBAL.TASKS.length + 1;
  let color = getBrightColor(colornumber);
  const blockId = generateUniqID();
  const TaskId = generateUniqID();
  const startTimeStamp = new Date(getTommorowDateString()).setHours(9, 0, 0, 0); // Set to 9:00 AM
  const endTimeStamp = new Date(getTommorowDateString()).setHours(13, 0, 0, 0); // Set to 1:00 PM
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

const updateSoldierSelection = (blockId, soldierId) => {
  const block = getBlockById(blockId);
  if (block) {
    // Check if the soldierId is already in the block's soldiersNames array
    if (!block.soldiersNames.includes(soldierId)) {
      let soldierObj = SOLIDJER.find(
        (soldier) => soldier.keywords[1] === soldierId
      );
      if (soldierObj) {
        block.soldiersNames.push(soldierObj); // Add the soldierId to the array
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: "חייל כבר נבחר",
        text: "החייל הזה כבר נבחר בבלוק הזה.",
      });
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

// ------------------------------ RENDERS ------------------------------
const renderTasksList = () => {
  const $taskContainer = $("#tasks-container");
  $taskContainer.empty(); // Clear the container before rendering
  // Get the selected date from header-date input
  const selectedDate = $("#header-date").val();
  const selectedDateObj = new Date(selectedDate);
  selectedDateObj.setHours(0, 0, 0, 0); // Reset time to start of day

  // Filter tasks that have blocks on the selected date
  const filteredTasks = GLOBAL.TASKS.filter((task) => {
    return task.blocks.some((block) => {
      const blockStartDate = new Date(block.startTimeStamp);
      const blockEndDate = new Date(block.endTimeStamp);
      blockStartDate.setHours(0, 0, 0, 0);
      blockEndDate.setHours(0, 0, 0, 0);

      return (
        blockStartDate.getTime() === selectedDateObj.getTime() ||
        blockEndDate.getTime() === selectedDateObj.getTime()
      );
    });
  });

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
      taskHTML += `</td>`;
      taskHTML += `<td class="solijer-name">`;
      taskHTML += `<div id="soldier-amounts-block${block.blockId}" class="block-amounts">`;
      for (let i = 0; i < block.soldierAmount; i++) {
        const selectedSoldier = block.soldiersNames[i] || null;
        taskHTML += `<select onchange="updateSoldierSelection('${block.blockId}',this.value)" name="" class="soldier-select" id="soldier-select-block${block.blockId}">`;
        taskHTML += `<option value="-1">בחר חייל..</option>`;
        // Assuming you have a function to get soldiers, you can loop through them here
        SOLIDJER.forEach((soldier) => {
          const isSelected =
            selectedSoldier &&
            selectedSoldier.keywords[1] === soldier.keywords[1];
          taskHTML += `<option value="${soldier.keywords[1]}" ${
            isSelected ? "selected" : ""
          }>${soldier.value}</option>`;
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
// ------------------------------ HELPERS ------------------------------
const getTommorowDateString = () => {
  let tommorowDate = new Date();
  tommorowDate.setDate(tommorowDate.getDate() + 1);
  return tommorowDate.toISOString().split("T")[0]; // Format to YYYY-MM-DD
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
