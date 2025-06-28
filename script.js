TASK_GLOBAL = [];
TASK_GLOBAL2 = [];
SHIFTS_GLOBAL = [];
SOLIDIER_HERE_GLOBAL = [];

$(document).ready(() => {
  let tommorowDate = new Date();
  let todayDate = new Date().toISOString().split("T")[0]; // Format to YYYY-MM-DD
  tommorowDate.setDate(tommorowDate.getDate() + 1);
  let day2after = new Date();
  day2after.setDate(day2after.getDate() + 2);
  day2after = day2after.toISOString().split("T")[0]; // Format to YYYY-MM-DD
  tommorowDate = tommorowDate.toISOString().split("T")[0]; // Format to YYYY-MM-DD
  TOM_DATE = tommorowDate; // Store the date in a global variable
  $("#header-date").val(tommorowDate);
  $("#header-title").html(`שבצק ל${formatDate(new Date(TOM_DATE))}`); // Set the header title

  TASK_GLOBAL = JSON.parse(localStorage.getItem("tasks")) || [];
  TASK_GLOBAL2 = JSON.parse(localStorage.getItem("tasks2")) || [];
  SHIFTS_GLOBAL = JSON.parse(localStorage.getItem("shifts")) || [];
  SOLIDIER_HERE_GLOBAL = JSON.parse(localStorage.getItem("solidierHere")) || [];

  //RenderTasksList(TASK_GLOBAL); // Render existing tasks
  RenderTaskList2(); // Render tasks from TASK_GLOBAL2
  // show and hide modal
  $("#addTaskBtn").click(addTask);
  $("#close-modal").click(() => {
    $(".modal-ph").fadeOut();
  });
  $("#save-task").click(saveTask);
  $("#start-time").val(tommorowDate + "T13:00");
  $("#isContinueTask").prop("checked", true); // Set the checkbox to true by default
  $(".add-handy-block-wraper").hide();
  $("#isContinueTask").change(changeHandler);
  $("#addBlockBtn").click(handleAddBlock);
  $("#ishereINDATE").val(tommorowDate);
  $("#ishereINDATEtommorrow").val(day2after);
  $("#header-date").change(handleMainDateChange);
  //$(document).on("mouseover", "pick-list *", handleMouseOverPickList);
  renderShifts();
});

const initPickList = () => {
  const soldierApprpriate =
    JSON.parse(localStorage.getItem("solidierHere")) || [];
  const pickListItems = $("pick-list");
  pickListItems.each((index, item) => {
    let block = getBlockById(item.id.split("-")[2]);
    const taskDate = block.blockDate;
    let soldiersForDate = soldierApprpriate.filter((soldier) => {
      return soldier.date === taskDate && soldier.isHere;
    });
    //console.log(taskDate, soldiersForDate, soldierApprpriate);
    soldiersForDate = soldiersForDate.map((soldier) => {
      return getFullSoldiersByNames([soldier.name])[0];
    });
    console.log(soldiersForDate);
    soldiersForDate.push(getFullSoldiersByNames(["?"])[0]); // Add the "?" option
    item.setItems(soldiersForDate);
    item.addEventListener("picklist-select", handleChangePickList);
    item.addEventListener("picklist-input", handleRemovePickList);
    item.shadowRoot
      .querySelector(".dropdown-list")
      .addEventListener("mouseover", handleMouseOverPickList);
    item.shadowRoot
      .querySelector(".dropdown-list")
      .addEventListener("mouseout", handleMouseOutPickList);
  });
};

const createNewSchedule = () => {
  // Calculate the previous day's date
  const previousDate = new Date(TOM_DATE);
  previousDate.setDate(previousDate.getDate() - 1);
  const previousDateString = previousDate.toISOString().split("T")[0];

  // Filter tasks that have at least one block with date matching TOM_DATE minus one day
  const tasksToClone = TASK_GLOBAL2.filter((task) => {
    return task.blocks.some((block) => block.blockDate === previousDateString);
  });

  if (tasksToClone.length === 0) {
    Swal.fire({
      title: "אין משימות להעתקה",
      text: `לא נמצאו משימות מתאריך ${formatDate(new Date(previousDateString))} להעתקה`,
      icon: "info",
      confirmButtonText: "אישור",
    });
    return;
  }

  // Create a deep copy of filtered tasks
  const newTasks = tasksToClone.map((task) => {
    const newTaskId = generateUniqID();
    const newBlocks = task.blocks.map((block) => {
      const newBlockId = generateUniqID();
      return {
        ...block,
        blockID: newBlockId,
        blockDate: TOM_DATE, // Update to the current TOM_DATE
      };
    });

    // Create new task object with new ID and blocks
    const newTask = {
      ...task,
      id: newTaskId,
      blocks: newBlocks,
    };

    // Generate new HTML string with updated IDs and date
    let newHtmlString = task.htmlString;

    // Replace task ID in HTML
    newHtmlString = newHtmlString.replace(new RegExp(task.id, "g"), newTaskId);

    // Replace block IDs and dates in HTML
    task.blocks.forEach((originalBlock, index) => {
      const newBlock = newBlocks[index];
      newHtmlString = newHtmlString.replace(
        new RegExp(originalBlock.blockID, "g"),
        newBlock.blockID
      );

      // Update date value in HTML
      newHtmlString = newHtmlString.replace(
        `value="${originalBlock.blockDate}"`,
        `value="${TOM_DATE}"`
      );

      // Update formatted date display
      newHtmlString = newHtmlString.replace(
        formatDate(new Date(originalBlock.blockDate)),
        formatDate(new Date(TOM_DATE))
      );
    });

    newTask.htmlString = newHtmlString;
    return newTask;
  });

  // Add new tasks to TASK_GLOBAL2
  TASK_GLOBAL2.push(...newTasks);

  // Save to localStorage
  localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));

  // Re-render the task list
  RenderTaskList2();

  // Show success message
  Swal.fire({
    title: "לוח זמנים חדש נוצר בהצלחה!",
    text: `נוצרו ${newTasks.length} משימות חדשות לתאריך ${formatDate(
      new Date(TOM_DATE)
    )} מהעתקת משימות מתאריך ${formatDate(new Date(previousDateString))}`,
    icon: "success",
    confirmButtonText: "אישור",
  });
};

const handleMainDateChange = (e) => {
  TOM_DATE = e.target.value; // Update the global date variable
  $("#header-title").html(`שבצק ל${formatDate(new Date(e.target.value))}`); // Set the header title
  RenderTaskList2();
};

const addTask = () => {
  $(".modal-ph").fadeIn();
};

const saveTask = () => {
  const taskData = {
    taskName: document.getElementById("task-name").value,
    soldierAmount: parseInt(document.getElementById("solidjer-amount").value),
    commanderAmount: parseInt(
      document.getElementById("commandor-amount").value
    ),

    startTime: document.getElementById("start-time").value,
    blockDuration: parseInt(document.getElementById("block-duration").value),
    blockAmount: parseInt(document.getElementById("block-amount").value),
    taskColor: $("#task-color").val(),
    isContinueTask: $("#isContinueTask").is(":checked"),
  };
  taskData.blocks = [];
  if (!taskData.isContinueTask) {
    $(".start-time-in").each((index, element) => {
      taskData.blocks.push({
        startTime: element.value,
        blockDuration: $(".block-duration")[index].value,
        blockID: generateUniqID(),
      });
    });
  } else {
    taskData.blockIDs = [];
    for (let i = 0; i < taskData.blockAmount; i++) {
      taskData.blocks.push({
        startTime: taskData.startTime,
        blockDuration: taskData.blockDuration,
        blockID: generateUniqID(),
      });
    }
  }
  TASK_GLOBAL.push(taskData);
  localStorage.setItem("tasks", JSON.stringify(TASK_GLOBAL));
  Swal.fire({
    title: "המשימה נשמרה בהצלחה!",
    icon: "success",
    confirmButtonText: "אישור",
  }).then(() => {
    RenderTasksList(TASK_GLOBAL);
    $(".modal-ph").fadeOut();
  });
};

const RenderTask = (task) => {
  let timeblocks = [];

  if (task.isContinueTask) {
    // Original logic for continuous tasks
    let [hours, minutes] = task.startTime.split(":");
    let startTime = new Date(task.startTime);
    let currentDate = new Date(task.startTime.split("T")[0]); // Base date
    startTime.setHours(parseInt(hours), parseInt(minutes), 0);

    for (let i = 0; i < task.blockAmount; i++) {
      let blockStart = new Date(
        startTime.getTime() + i * task.blockDuration * 60 * 60 * 1000
      );
      let blockEnd = new Date(
        startTime.getTime() + (i + 1) * task.blockDuration * 60 * 60 * 1000
      );

      // If this block starts on a later hour than the previous block ended,
      // we're still on the same date
      if (
        i > 0 &&
        blockStart.getHours() < timeblocks[i - 1].end.split(":")[0]
      ) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      let blockFullDate = currentDate.toISOString().split("T")[0];

      timeblocks.push({
        start: formatTime(blockStart),
        end: formatTime(blockEnd),
        date: formatDate(blockStart),
        fulldate: blockFullDate,
        blockID: task.blocks[i].blockID,
      });
    }
  } else {
    // Logic for non-continuous tasks
    task.blocks.forEach((block) => {
      let [hours, minutes] = block.startTime.split("T")[1].split(":");
      let blockStart = new Date(block.startTime);
      blockStart.setHours(parseInt(hours), parseInt(minutes), 0);

      let blockEnd = new Date(
        blockStart.getTime() + parseInt(block.blockDuration) * 60 * 60 * 1000
      );

      timeblocks.push({
        start: formatTime(blockStart),
        end: formatTime(blockEnd),
        date: formatDate(blockStart),
        fulldate: blockStart.toISOString().split("T")[0],
        blockID: block.blockID,
      });
    });
  }

  // Create the table container and header
  let Finalstr = `
        <div class="table-container">
        <span class="task-close" onclick="removeTask(this)" id="${task.taskName}">X</span>
          <h2 style="background-color:${task.taskColor}">${task.taskName}</h2>
          <table class="example-task">
            <thead>
              <tr>
                <th class="task-time">שעות</th>
                <th class="solijer-name">שם חייל</th>
              </tr>
            </thead>
            <tbody>`;

  // Generate rows for each time block
  timeblocks.forEach((block) => {
    Finalstr += `
              <tr>
                <td class="task-time">
                  <span class="block-date">${block.date}</span><br>
                  <input type="time" class="start-time timeIN" value="${block.start}" /> -
                  <input type="time" class="end-time timeIN" value="${block.end}" />
                </td>
                <td class="solijer-name">`;

    // Add pick-list elements based on required soldiers and commanders
    for (let i = 0; i < task.soldierAmount + task.commanderAmount; i++) {
      Finalstr += `<pick-list data-date="${block.fulldate}" 
      id="pick-list-${block.blockID}"
      data-start="${block.start}" 
      data-end="${block.end}" 
      data-task-name="${task.taskName}" placeholder="בחר חייל.."></pick-list>`;
    }

    Finalstr += `
                </td>
              </tr>`;
  });

  // Close the table and container
  Finalstr += `
            </tbody>
          </table>
        </div>`;

  return Finalstr;
};

const RenderTasksList = (tasksList) => {
  const $tasksContainer = $("#tasks-container");
  $tasksContainer.empty(); // Clear previous tasks
  tasksList.forEach((task) => {
    const taskHTML = RenderTask(task);
    $tasksContainer.append(taskHTML);
  });
  $tasksContainer.append(
    `<div class="btn-add-task-container">
      <button onclick="addNewTask()" class="add-task-btn">+</button>
    </div>`
  );
  initPickList();
};

const handleNameChange = (input, taskID) => {
  const taskName = input.value.trim();
  input.value = taskName; // Update the input value to remove leading/trailing spaces
  //console.log("Task name changed to:", taskName, taskID);
  // Update the task's name in TASK_GLOBAL2
  const taskIndex = TASK_GLOBAL2.findIndex((task) => task.id === taskID);
  if (taskIndex !== -1) {
    TASK_GLOBAL2[taskIndex].taskName = taskName;
    // Update the HTML string for the task
    const taskElement = document.getElementById(taskID);
    TASK_GLOBAL2[taskIndex].htmlString = taskElement.outerHTML;
    localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
  }
};
const handleTimeChange = (input, isStart, taskID, blockID) => {
  const timeValue = input.value.trim();
  //console.log("Time changed to:", timeValue, isStart, taskID, blockID);
  const taskIndex = TASK_GLOBAL2.findIndex((task) => task.id === taskID);
  if (taskIndex !== -1) {
    const block = TASK_GLOBAL2[taskIndex].blocks.find(
      (block) => block.blockID === blockID
    );

    if (block) {
      if (isStart) {
        block.startTime = timeValue;
        block.duration = calculateDuration(timeValue, block.endTime);
      } else {
        block.endTime = timeValue;
        block.duration = calculateDuration(block.startTime, timeValue);
      }

      // Update shifts that have blockIDs starting with this blockID
      SHIFTS_GLOBAL.forEach((shift) => {
        if (shift.blockID.startsWith(blockID)) {
          if (isStart) {
            shift.startTime = timeValue;
          } else {
            shift.endTime = timeValue;
          }
          shift.duration = block.duration;
          shift.block = { ...block }; // Update the block reference in the shift
        }
      });

      localStorage.setItem("shifts", JSON.stringify(SHIFTS_GLOBAL));
      localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
    }
  }
};

const handleDateChange = (input, blockID) => {
  const dateValue = input.value;
  //console.log("Date changed to:", dateValue, blockID);

  // Find the block directly by searching through all tasks
  for (let task of TASK_GLOBAL2) {
    const block = task.blocks.find((block) => block.blockID === blockID);
    if (block) {
      block.blockDate = dateValue;
      localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
      break;
    }
  }

  // Update shifts that have blockIDs starting with this blockID
  SHIFTS_GLOBAL.forEach((shift) => {
    if (shift.blockID.startsWith(blockID)) {
      shift.date = dateValue;
      shift.block.blockDate = dateValue;
    }
  });
  localStorage.setItem("shifts", JSON.stringify(SHIFTS_GLOBAL));

  const $blockDateSpan = $(`#block-date-${blockID}`);
  if ($blockDateSpan.length) {
    $blockDateSpan.text(formatDate(new Date(dateValue)));
  } else {
    console.error("Block date span not found for blockID:", blockID);
  }
};

const getTimeStr = (id, time, isStart = true, blockID) => {
  //console.log(id, time, isStart);
  let timeStrIN = `
      <div class="ttime ttime-${isStart ? "start" : "end"}">
      <input onChange="handleTimeChange(this,${isStart},'${id}','${blockID}')" class="ttime-IN hours-${
    isStart ? "start" : "end"
  }" value="${time}" list="hours-${isStart ? "start" : "end"}" />
      <datalist id="hours-${isStart ? "start" : "end"}">
        <option value="00:00"></option>
        <option value="01:00"></option>
        <option value="02:00"></option>
        <option value="03:00"></option>
        <option value="04:00"></option>
        <option value="05:00"></option>
        <option value="06:00"></option>
        <option value="07:00"></option>
        <option value="08:00"></option>
        <option value="09:00"></option>
        <option value="10:00"></option>
        <option value="11:00"></option>
        <option value="12:00"></option>
        <option selected value="13:00"></option>
        <option value="14:00"></option>
        <option value="15:00"></option>
        <option value="16:00"></option>
        <option value="17:00"></option>
        <option value="18:00"></option>
        <option value="19:00"></option>
        <option value="20:00"></option>
        <option value="21:00"></option>
        <option value="22:00"></option>
        <option value="23:00"></option>

      </datalist>
    </div>`;
  return timeStrIN;
};

const getTaskById = (taskID) => {
  const taskIndex = TASK_GLOBAL2.findIndex((task) => task.id === taskID);
  if (taskIndex !== -1) {
    return TASK_GLOBAL2[taskIndex];
  } else {
    console.error("Task not found with ID:", taskID);
    return null;
  }
};

const addNewTask = () => {
  let colornumber = TASK_GLOBAL2.length + 1;
  let color = getBrightColor(colornumber);
  const blockID = generateUniqID();
  const id = generateUniqID();
  let TaskToSave = {
    color: color,
    id: id,
    blocks: [],
  };
  if (TaskToSave.blocks.length === 0) {
    TaskToSave.blocks.push({
      blockID: blockID,
      blockDate: TOM_DATE,
      startTime: "09:00",
      endTime: "13:00",
      duration: calculateDuration("09:00", "13:00"),
      soldierAmount: 1,
    });
  }

  let taskSTR = `
  <div class="table-container" id="${id}">
        <span class="task-close" onclick="removeTask('${id}')" >X</span>
          <h2 style="background-color:${color}"><input style="background-color:${color}" 
          type="text" class="task-title" id="" 
          onKeyUp="handleNameChange(this,'${id}')" value="שם המשימה" />
          </h2>
          <table class="example-task">
            <thead>
              <tr>
                <th class="task-time">שעות</th>
                <th class="solijer-name">שם חייל</th>
              </tr>
            </thead>
            <tbody id="task-body-${id}">
              <tr id="${blockID}">
                <td class="task-time">
                <div class="block-date-wraper">
                  <span id="block-date-${blockID}" class="block-date">${formatDate(
    new Date(TOM_DATE)
  )}</span>
                  <input type="date" onChange = "handleDateChange(this,'${blockID}')" class="start-time timeIN" value="${TOM_DATE}" />
                </div>
                <div class="ttime-block-wraper">
                  ${getTimeStr(
                    id,
                    "09:00",
                    true,
                    blockID
                  )} <span class="makaf">-</span>
                  ${getTimeStr(id, "13:00", false, blockID)}
                </div>
                  
                </td>
                <td class="solijer-name">
                <div id="soldier-amounts-${blockID}" class="block-amounts">
                <pick-list data-date="${TOM_DATE}" class="${id}" id="pick-list-${blockID}" data-start="" data-end="" data-task-name="" placeholder="בחר חייל.."></pick-list>
                </div>
                <button onclick="addSoldierToBlock('${blockID}')" class="add-soldier-btn">+</button>
                <button onclick="removeSoldierFromBlock('${blockID}')" class="remove-soldier-btn">-</button>

                </td>
              </tr>
            </tbody>
          </table>
          <div class="add-block-btn-wraper">
          <button onclick="addNewBlock('${id}','task-body-${id}')" class="add-block-btn">+</button>
          <button onclick="removeBlock('${id}','task-body-${id}')" class="remove-block-btn">-</button>
          </div>
        </div>
  `;

  TaskToSave.htmlString = taskSTR;
  TASK_GLOBAL2.push(TaskToSave);
  localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
  // Render the new task in the tasks container
  RenderTaskList2();
  // const $tasksContainer = $("#tasks-container");
  // $tasksContainer.empty(); // Clear previous tasks
  // $tasksContainer.append(taskSTR);
  // $tasksContainer.append(
  //   `<div class="btn-add-task-container">
  //     <button onclick="addNewTask()" class="add-task-btn">+</button>
  //   </div>`
  // );
  //initPickList();
  renderShifts(); // Re-render shifts to include the new task
};

const addNewBlock = (taskID, containerBodyID) => {
  //console.log(taskID, containerBodyID);
  $tbody = $(`#${containerBodyID}`);
  const ThisTask = getTaskById(taskID);
  const lastBlock = ThisTask.blocks[ThisTask.blocks.length - 1];
  const blockID = generateUniqID();
  const blockDuration = lastBlock.duration;

  let newBlock = {
    blockID: blockID,
    blockDate: lastBlock.blockDate,
    startTime: lastBlock.endTime,
    endTime: incrementHour(lastBlock.endTime, blockDuration),
    duration: calculateDuration(lastBlock.startTime, lastBlock.endTime),
    soldierAmount: lastBlock.soldierAmount,
  };
  ThisTask.blocks.push(newBlock);

  // Generate pick-list elements based on soldierAmount
  let pickListElements = "";
  for (let i = 0; i < newBlock.soldierAmount; i++) {
    pickListElements += `<pick-list 
      data-date="${lastBlock.blockDate}" 
      class="${ThisTask.id}" 
      id="pick-list-${blockID}-${i}" 
      data-start="" 
      data-end="" 
      data-task-name="" 
      placeholder="בחר חייל.."></pick-list>`;
  }

  let newBlockHtmlString = `
  <tr id="${blockID}">
                <td class="task-time">
                <div class="block-date-wraper">
                  <span id="block-date-${blockID}" class="block-date">${formatDate(
    new Date(lastBlock.blockDate)
  )}</span>
                  <input type="date" onChange = "handleDateChange(this,'${blockID}')" class="start-time timeIN" value="${
    lastBlock.blockDate
  }" />
                </div>
                <div class="ttime-block-wraper">
                  ${getTimeStr(
                    ThisTask.id,
                    newBlock.startTime,
                    true,
                    blockID
                  )} <span class="makaf">-</span>
                  ${getTimeStr(ThisTask.id, newBlock.endTime, false, blockID)}
                </div>
                  
                </td>
                <td class="solijer-name">
                <div id="soldier-amounts-${blockID}" class="block-amounts">
                ${pickListElements}
                </div>              
                <button onclick="addSoldierToBlock('${blockID}')" class="add-soldier-btn">+</button>
                <button onclick="removeSoldierFromBlock('${blockID}')" class="remove-soldier-btn">-</button>
                </td>
              </tr>
  `;

  $tbody.append(newBlockHtmlString);
  tableContainer = document.getElementById(taskID);
  ThisTask.htmlString = tableContainer.outerHTML;
  localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
  initPickList(); // Initialize the new pick-lists
};

const removeBlock = (taskID, containerBodyID) => {
  const $tbody = $(`#${containerBodyID}`);
  const ThisTask = getTaskById(taskID);

  // Get the last block (assuming you want to remove the last one)
  const lastBlock = ThisTask.blocks[ThisTask.blocks.length - 1];
  const blockID = lastBlock ? lastBlock.blockID : null;

  if (blockID && ThisTask.blocks.length > 1) {
    // Show confirmation dialog before removing the block
    Swal.fire({
      title: "האם אתה בטוח?",
      text: "האם אתה בטוח שברצונך להסיר את הבלוק האחרון?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "כן, הסר",
      cancelButtonText: "לא, השאר",
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove the block from the task
        const blockIndex = ThisTask.blocks.findIndex(
          (block) => block.blockID === blockID
        );
        if (blockIndex !== -1) {
          ThisTask.blocks.splice(blockIndex, 1);
          $tbody.find(`#${blockID}`).remove();

          // Remove all shifts associated with this block
          SHIFTS_GLOBAL = SHIFTS_GLOBAL.filter(
            (shift) => !shift.blockID.startsWith(blockID)
          );
          localStorage.setItem("shifts", JSON.stringify(SHIFTS_GLOBAL));

          ThisTask.htmlString = document.getElementById(taskID).outerHTML;
          localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
        }
      }
    });
  } else if (ThisTask.blocks.length <= 1) {
    // Optional: Show warning if trying to remove the last block
    Swal.fire({
      title: "לא ניתן להסיר",
      text: "חייב להיות לפחות בלוק אחד במשימה",
      icon: "warning",
      confirmButtonText: "אישור",
    });
  }
};

const addSoldierToBlock = (blockID) => {
  const $ph = $(`#soldier-amounts-${blockID}`);
  // Find the block in TASK_GLOBAL2 and increment soldierAmount
  for (let task of TASK_GLOBAL2) {
    const block = task.blocks.find((block) => block.blockID === blockID);
    if (block) {
      block.soldierAmount = (block.soldierAmount || 1) + 1;
      // Add another pick-list for the new soldier
      const newPickListID = `pick-list-${blockID}-${block.soldierAmount}`;
      $ph.append(
        `<pick-list data-date="${block.blockDate}" class="${task.id}" id="${newPickListID}" data-start="" data-end="" data-task-name="" placeholder="בחר חייל.."></pick-list>`
      );
      task.htmlString = document.getElementById(task.id).outerHTML; // Update the HTML string in the task object
      localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
      initPickList();
      break;
    }
  }
};

const removeSoldierFromBlock = (blockID) => {
  const $ph = $(`#soldier-amounts-${blockID}`);
  // Find the block in TASK_GLOBAL2 and decrement soldierAmount
  for (let task of TASK_GLOBAL2) {
    const block = task.blocks.find((block) => block.blockID === blockID);

    if (block) {
      if (block.soldierAmount <= 1) {
        Swal.fire({
          title: "לא ניתן להסיר",
          text: "חייב להיות לפחות חייל אחד בבלוק",
          icon: "warning",
          confirmButtonText: "אישור",
        });
        return;
      }
      block.soldierAmount = (block.soldierAmount || 1) - 1;

      // Find the last pick-list element to remove
      const lastPickListID = `pick-list-${blockID}-${block.soldierAmount + 1}`;
      const $lastPickList = $(`#${lastPickListID}`);
      // Remove associated shift from SHIFTS_GLOBAL if exists
      const shiftIndex = SHIFTS_GLOBAL.findIndex(
        (shift) => shift.blockID === lastPickListID.replace("pick-list-", "")
      );
      if (shiftIndex !== -1) {
        SHIFTS_GLOBAL.splice(shiftIndex, 1);
        localStorage.setItem("shifts", JSON.stringify(SHIFTS_GLOBAL));
      }
      // Remove the last pick-list for the soldier
      const lastPickList = $ph.children().last();
      lastPickList.remove();
      task.htmlString = document.getElementById(task.id).outerHTML; // Update the HTML string in the task object
      localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
      initPickList();
      break;
    }
  }
};

const RenderTaskList2 = () => {
  const $tasksContainer = $("#tasks-container");
  $tasksContainer.empty(); // Clear previous tasks

  // Filter tasks that have at least one block with date matching TOM_DATE
  const filteredTasks = TASK_GLOBAL2.filter((task) => {
    return task.blocks.some((block) => block.blockDate === TOM_DATE);
  });

  filteredTasks.forEach((task) => {
    const taskHTML = task.htmlString;
    $tasksContainer.append(taskHTML);
    const taskElement = document.getElementById(task.id);
    for (let block of task.blocks) {
      const blockID = block.blockID;
      // Update date span and input
      const $blockDateSpan = $(`#block-date-${blockID}`);
      if ($blockDateSpan.length) {
        $blockDateSpan.text(formatDate(new Date(block.blockDate)));
        const dateInput = document.querySelector(
          `#${CSS.escape(blockID)} input[type="date"]`
        );
        if (dateInput) {
          dateInput.value = block.blockDate;
        }
      }
      // Add this new code to update the task name input
      const taskNameInput = taskElement.querySelector(".task-title");
      if (taskNameInput && task.taskName) {
        taskNameInput.value = task.taskName;
      }

      // Update time inputs
      const startTimeInput = document.querySelector(
        `#${CSS.escape(blockID)} .hours-start`
      );
      const endTimeInput = document.querySelector(
        `#${CSS.escape(blockID)} .hours-end`
      );

      if (startTimeInput && block.startTime) {
        startTimeInput.value = block.startTime;
      }

      if (endTimeInput && block.endTime) {
        endTimeInput.value = block.endTime;
      }
    }
  });

  $tasksContainer.append(
    `<div class="btn-add-task-container">
      <button onclick="addNewTask()" class="add-task-btn">+</button>
    </div>`
  );
  initPickList();
};
// Helper function to format time as HH:mm
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Add this new helper function to format the date
function formatDate(date) {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const dayName = days[date.getDay()];
  return `יום ${dayName}`;
}

const changeHandler = () => {
  const isChecked = $("#isContinueTask").is(":checked");
  if (isChecked) {
    $(".block-amounts").show();
    $(".add-handy-block-wraper").hide();
  } else {
    $(".block-amounts").hide();
    $(".add-handy-block-wraper").show();
  }
};

const handleAddBlock = () => {
  let length = $(".start-time").length;
  let strBlock = `
  <span>שעת התחלה</span>
              <input type="datetime-local" name="" class="start-time-in" id="start-time-in${length}" />
              <span>משך בלוק:</span>
              <input
                type="number"
                name=""
                class="block-duration"
                id="block-duration"
                min="0.5"
                value="4"
              />
  `;
  $(".block-start-wraper").append(strBlock);
};

const handleRemovePickList = (e) => {
  if (e.detail.value == "") {
    console.log("inside !#@");
    const pickList = e.target;
    let id = pickList.getAttribute("id");
    id = id.replace("pick-list-", ""); // Remove 'pick-list-' prefix to get the blockID
    const shiftIndex = SHIFTS_GLOBAL.findIndex((shift) => shift.blockID === id);
    if (shiftIndex !== -1) {
      SHIFTS_GLOBAL.splice(shiftIndex, 1);
      localStorage.setItem("shifts", JSON.stringify(SHIFTS_GLOBAL));
    }
  }
};

const handleChangePickList = (e) => {
  const pickList = e.target;
  const taskID = pickList.getAttribute("class");
  const task = getTaskById(taskID);
  const selectedItem = e.detail.value;
  let id = pickList.getAttribute("id");
  id = id.replace("pick-list-", ""); // Remove 'pick-list-' prefix to get the blockID

  const taskName = task.taskName;
  const block = getBlockById(id.split("-")[0]);
  //console.log(block);

  // Check if a shift with this blockID already exists
  const existingShiftIndex = SHIFTS_GLOBAL.findIndex(
    (shift) => shift.blockID === id
  );

  const shift = {
    soldierName: selectedItem,
    startTime: block.startTime,
    taskName: taskName,
    blockID: id,
    endTime: block.endTime,
    duration: block.duration,
    date: block.blockDate,
    block: block,
  };
  let shiftColids = checkShiftColids(getAllShiftsByName(selectedItem), shift);
  console.log(shiftColids);
  if (shiftColids) {
    Swal.fire({
      title: "המשמרת מתנגשת עם משמרות אחרות",
      html: `המשמרת של "${
        shiftColids.soldierName
      }"<br>מתנגשת עם המשמרת בתאריך ${
        shiftColids.block.blockDate
      }<br>(${formatDate(new Date(shiftColids.block.blockDate))}) בין השעות ${
        shiftColids.startTime
      } - ${shiftColids.endTime}`,
      icon: "error",
      confirmButtonText: "אישור",
    });
    pickList.selectItem("?");
    return;
  }

  if (existingShiftIndex !== -1) {
    // Update existing shift
    SHIFTS_GLOBAL[existingShiftIndex] = shift;
  } else {
    // Add new shift
    SHIFTS_GLOBAL.push(shift);
  }

  localStorage.setItem("shifts", JSON.stringify(SHIFTS_GLOBAL));
  //console.log("Shift saved:", shift);
};
const handleMouseOverPickList = (e) => {
  // console.log("Mouse over pick-list:",e.target.tagName,e.target.parentNode.parentNode.parentNode.parentNode.host);
  if (e.target.tagName == "SPAN") {
    const soldierName = e.target.innerHTML.trim();
    const blockID =
      e.target.parentNode.parentNode.parentNode.parentNode.host.id;
    // console.log("Soldier Name:", soldierName, "Block ID:", blockID);
    const shifts = getAllShiftsByName(soldierName);
    const last_shift = getLastShiftByDateTimeReduce(shifts);
    const currentBlock = getBlockById(
      blockID.replace("pick-list-", "").split("-")[0]
    );
    const soldierObj = getFullSoldiersByNames([soldierName])[0];
    console.log(
      "Current Block:",
      currentBlock,
      "Shifts:",
      shifts,
      "Soldier Object:",
      soldierObj,
      last_shift
    );
    let lastTaskDate = `התחיל ב${last_shift.startTime} עד ${last_shift.endTime} <br> בתאריך ${last_shift.date}`;
    $("#soldier-detail-modal").css({
      display: "block",
      top: e.clientY - 50 + "px",
      left: e.clientX - 450 + "px",
      zIndex: 1000,
    });
    $("#soldier-detail-modal #soldier-name").text(soldierName);
    $("#soldier-detail-modal #soldier-unit").text(
      "מחלקת " + soldierObj.keywords[0]
    );
    $("#last-task-date").html(lastTaskDate);
    $("#last-task-duration").text(`משך המשימה : ${last_shift.duration} שעות`);
    $("#last-task-rest-time").text(
      `${calculateDuration(
        last_shift.endTime,
        currentBlock.startTime,
        last_shift.block.blockDate,
        currentBlock.blockDate
      )} שעות`
    );
    $("#last-task-rest-time").css({
      backgroundColor: getColorForDurationSpan(
        last_shift.duration,
        calculateDuration(
          last_shift.endTime,
          currentBlock.startTime,
          last_shift.block.blockDate,
          currentBlock.blockDate
        )
      ),
    });
  }
};
const handleMouseOutPickList = () => {
  $("#soldier-detail-modal").fadeOut();
};

const generateUniqID = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const renderShifts = () => {
  SHIFTS_GLOBAL.forEach((shift) => {
    const picklist = document.getElementById("pick-list-" + shift.blockID);
    if (picklist) {
      picklist.selectItem(shift.soldierName);
    }
  });
};

const removeTask = (taskID) => {
  //console.log("Removing task with ID:", taskID);
  Swal.fire({
    title: "האם אתה בטוח שאתה רוצה למחוק את המשימה?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "מחק",
    cancelButtonText: "בטל",
  }).then((result) => {
    if (result.isConfirmed) {
      // Remove the task from TASK_GLOBAL2
      TASK_GLOBAL2 = TASK_GLOBAL2.filter((task) => task.id !== taskID);
      localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
      RenderTaskList2();
      Swal.fire({
        title: "המשימה נמחקה בהצלחה!",
        icon: "success",
        confirmButtonText: "אישור",
      });
    }
  });
};

const saveHeres = () => {
  todayDate = $("#ishereINDATE").val();
  tommorowDate = $("#ishereINDATEtommorrow").val();
  const soldiersToday = $("#ishereIN").val().split("\n");
  const soldiersTommorrow = $("#ishereINtommorrow").val().split("\n");

  // Helper function to check if soldier already exists for a specific date
  const soldierExistsForDate = (soldierName, date) => {
    return SOLIDIER_HERE_GLOBAL.some(
      (soldier) =>
        soldier.name.trim() === soldierName.trim() && soldier.date === date
    );
  };

  // Add today's soldiers
  soldiersToday.forEach((soldier) => {
    if (soldier.trim() && !soldierExistsForDate(soldier, todayDate)) {
      SOLIDIER_HERE_GLOBAL.push({
        name: soldier.trim(),
        date: todayDate,
        isHere: true,
      });
    }
  });

  // Add tomorrow's soldiers
  soldiersTommorrow.forEach((soldier) => {
    if (soldier.trim() && !soldierExistsForDate(soldier, tommorowDate)) {
      SOLIDIER_HERE_GLOBAL.push({
        name: soldier.trim(),
        date: tommorowDate,
        isHere: true,
      });
    }
  });

  localStorage.setItem("solidierHere", JSON.stringify(SOLIDIER_HERE_GLOBAL));
  Swal.fire({
    title: "החיילים נשמרו בהצלחה!",
    icon: "success",
    confirmButtonText: "אישור",
  }).then(() => {
    closeishereModal();
    initPickList();
  });
};

function incrementHour(timeStr, increment) {
  // Split the time string into hours and minutes
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Create a new Date object and set the time
  const date = new Date();
  date.setHours(hours, minutes, 0);

  // Add the increment in hours
  date.setHours(date.getHours() + increment);

  // Format the result back to HH:mm
  const newHours = date.getHours().toString().padStart(2, "0");
  const newMinutes = date.getMinutes().toString().padStart(2, "0");

  return `${newHours}:${newMinutes}`;
}

const showHereModal = () => {
  $("#ishereIN").val("");
  $("#ishereINtommorrow").val("");
  todayDate = $("#ishereINDATE").val();
  tommorowDate = $("#ishereINDATEtommorrow").val();
  for (let i = 0; i < SOLIDIER_HERE_GLOBAL.length; i++) {
    if (SOLIDIER_HERE_GLOBAL[i].date === todayDate) {
      $("#ishereIN").val(
        SOLIDIER_HERE_GLOBAL[i].name + "\n" + $("#ishereIN").val()
      );
    }
    if (SOLIDIER_HERE_GLOBAL[i].date === tommorowDate) {
      $("#ishereINtommorrow").val(
        SOLIDIER_HERE_GLOBAL[i].name + "\n" + $("#ishereINtommorrow").val()
      );
    }
  }
  $(".modal-ishere").fadeIn();
};
const closeishereModal = () => {
  $(".modal-ishere").fadeOut();
};

const closeModalByID = (id) => {
  $(`#${id}`).fadeOut();
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

function calculateDuration(
  startTime,
  endTime,
  startDate = null,
  endDate = null
) {
  // If dates are provided, use them; otherwise assume same day
  if (startDate && endDate) {
    const startDateTime = new Date(startDate + "T" + startTime);
    const endDateTime = new Date(endDate + "T" + endTime);

    // Calculate difference in milliseconds and convert to hours
    const durationMilliseconds =
      endDateTime.getTime() - startDateTime.getTime();
    const durationHours = durationMilliseconds / (1000 * 60 * 60);

    return durationHours;
  }

  // Original logic for when no dates are provided
  // Split the times into hours and minutes
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  // Convert everything to minutes
  let startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;

  // Handle cases where end time is on next day
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60; // Add 24 hours in minutes
  }

  // Calculate difference in hours
  const durationHours = (endTotalMinutes - startTotalMinutes) / 60;

  return durationHours;
}

const getBlockById = (blockID) => {
  // Loop through each task in TASK_GLOBAL2
  for (let task of TASK_GLOBAL2) {
    // Search for block with matching blockID in task's blocks array
    const block = task.blocks.find((block) => block.blockID === blockID);
    if (block) {
      // Return block object with additional task info
      return {
        ...block,
        taskId: task.id,
        taskColor: task.color,
      };
    }
  }
  // Return null if block not found
  console.error("Block not found with ID:", blockID);
  return null;
};

function getFullSoldiersByNames(namesList) {
  if (!Array.isArray(namesList)) {
    return [];
  }

  return namesList
    .map((name) =>
      SOLIDJER.find(
        (soldier) =>
          soldier.value.trim().toLowerCase() === name.trim().toLowerCase()
      )
    )
    .filter((soldier) => soldier !== undefined);
}

const getAllShiftsByName = (name) => {
  if (!name) {
    return [];
  }

  return SHIFTS_GLOBAL.filter(
    (shift) =>
      shift.soldierName.trim().toLowerCase() === name.trim().toLowerCase()
  );
};

const checkShiftColids = (allSoldierShifts, shiftToCheck) => {
  for (const shift of allSoldierShifts) {
    if (shift.blockID == shiftToCheck.blockID) {
      continue; // Skip shifts that are not in the same block
    }
    let startTimeStamp = new Date(
      shift.block.blockDate + "T" + shift.startTime
    ).getTime();
    let endTimeStamp = new Date(
      shift.block.blockDate + "T" + shift.endTime
    ).getTime();

    let checkStartTimeStamp = new Date(
      shiftToCheck.block.blockDate + "T" + shiftToCheck.startTime
    ).getTime();
    let checkEndTimeStamp = new Date(
      shiftToCheck.block.blockDate + "T" + shiftToCheck.endTime
    ).getTime();

    if (
      (checkStartTimeStamp >= startTimeStamp &&
        checkStartTimeStamp < endTimeStamp) ||
      (checkEndTimeStamp > startTimeStamp &&
        checkEndTimeStamp <= endTimeStamp) ||
      (checkStartTimeStamp <= startTimeStamp &&
        checkEndTimeStamp >= endTimeStamp) ||
      (startTimeStamp == checkStartTimeStamp &&
        endTimeStamp == checkEndTimeStamp)
    ) {
      return shift; // Overlap found - this will actually return
    }
  }
  return null; // No overlap found
};

const getLastShiftByDateTimeReduce = (shifts) => {
  if (!shifts || shifts.length === 0) {
    return null;
  }

  return shifts.reduce((latest, current) => {
    const latestDateTime = new Date(latest.date + "T" + latest.endTime);
    const currentDateTime = new Date(current.date + "T" + current.endTime);

    return currentDateTime > latestDateTime ? current : latest;
  });
};

const getColorForDurationSpan = (
  last_mission_duration,
  current_rest_duration
) => {
  if (last_mission_duration >= current_rest_duration) {
    return "#fba5a5";
  }
  if (last_mission_duration * 2 == current_rest_duration) {
    return "#f8d986";
  }
  if (last_mission_duration * 2 < current_rest_duration) {
    return "#4CAF50";
  }
};




const exportScheduleToPDF = async () => {
  // Create a clean version of the schedule for PDF
  const scheduleContent = document.createElement('div');
  scheduleContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1>לוח משמרות - ${formatDate(new Date(TOM_DATE))}</h1>
      <p>תאריך: ${TOM_DATE}</p>
    </div>
  `;
  
  // Clone tasks container without edit buttons
  const tasksClone = document.getElementById('tasks-container').cloneNode(true);
  
  // Remove edit elements from clone
  tasksClone.querySelectorAll('.task-close, .add-task-btn, .add-soldier-btn, .remove-soldier-btn, .add-block-btn, .remove-block-btn').forEach(el => el.remove());
  
  // Remove input fields and replace with text
  tasksClone.querySelectorAll('input[type="time"], input[type="date"]').forEach(input => {
    const span = document.createElement('span');
    span.textContent = input.value;
    span.className = input.className;
    input.parentNode.replaceChild(span, input);
  });
  
  // Replace pick-lists with selected values
  tasksClone.querySelectorAll('pick-list').forEach(pickList => {
    const span = document.createElement('span');
    span.textContent = pickList.value || 'לא שובץ';
    span.style.padding = '5px';
    span.style.border = '1px solid #ccc';
    span.style.display = 'inline-block';
    span.style.margin = '2px';
    pickList.parentNode.replaceChild(span, pickList);
  });
  
  scheduleContent.appendChild(tasksClone);
  
  // Apply PDF-friendly styles
  scheduleContent.style.cssText = `
    font-family: Arial, sans-serif;
    direction: rtl;
    text-align: right;
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
  `;
  
  // Add to document temporarily
  document.body.appendChild(scheduleContent);
  
  try {
    const canvas = await html2canvas(scheduleContent, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Access jsPDF correctly from the window object
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`schedule-${TOM_DATE}.pdf`);
    
    Swal.fire({
      title: 'PDF נוצר בהצלחה!',
      text: 'הקובץ נשמר בהצלחה',
      icon: 'success',
      confirmButtonText: 'אישור'
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    Swal.fire({
      title: 'שגיאה ביצירת PDF',
      text: 'אירעה שגיאה בעת יצירת קובץ ה-PDF',
      icon: 'error',
      confirmButtonText: 'אישור'
    });
  } finally {
    // Clean up
    document.body.removeChild(scheduleContent);
  }
};



//EXAMPLE SHIFT OBJECT
// {
//     "soldierName": "ליאור בדני",
//     "startTime": "13:00",
//     "blockID": "aJTMK-0",
//     "endTime": "17:00",
//     "duration": 4,
//     "date": "2025-06-27",
//     "block": {
//         "blockID": "aJTMK",
//         "blockDate": "2025-06-27",
//         "startTime": "13:00",
//         "endTime": "17:00",
//         "duration": 4,
//         "soldierAmount": 1,
//         "taskId": "U7ubK",
//         "taskColor": "#4CAF50"
//     }
// }
