TASK_GLOBAL = [];
TASK_GLOBAL2 = [];
SHIFTS_GLOBAL = [];
SOLIDIER_HERE_GLOBAL = [];
API_PREFIX_LOCAL = "http://localhost:3000";
API_PREFIX = "https://eight116m-server.onrender.com";

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

  getFromServer();
  TASK_GLOBAL2 = JSON.parse(localStorage.getItem("tasks2")) || [];
  SHIFTS_GLOBAL = JSON.parse(localStorage.getItem("shifts")) || [];
  SOLIDIER_HERE_GLOBAL = JSON.parse(localStorage.getItem("solidierHere")) || [];

  //RenderTasksList(TASK_GLOBAL); // Render existing tasks
  //RenderTaskList2(); // Render tasks from TASK_GLOBAL2
  // show and hide modal
  $("#close-modal").click(() => {
    $(".modal-ph").fadeOut();
  });
  $("#start-time").val(tommorowDate + "T13:00");
  $("#ishereINDATE").val(tommorowDate);
  $("#ishereINDATEtommorrow").val(day2after);
  $("#header-date").change(handleMainDateChange);
  $("#ishereINDATE").change(handleIsHereInDateChange);
  //$(document).on("mouseover", "pick-list *", handleMouseOverPickList);
  //renderShifts();
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
    //console.log(soldiersForDate);
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
      text: `לא נמצאו משימות מתאריך ${formatDate(
        new Date(previousDateString)
      )} להעתקה`,
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
        blockStartDate: new Date(
          new Date(block.blockStartDate).setDate(
            new Date(block.blockStartDate).getDate() + 1
          )
        )
          .toISOString()
          .split("T")[0], // Update start date to tomorrow
        blockEndDate: new Date(
          new Date(block.blockEndDate).setDate(
            new Date(block.blockEndDate).getDate() + 1
          )
        )
          .toISOString()
          .split("T")[0], // Update end date to tomorrow
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


const handleIsHereInDateChange = (e) => {
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
};

const handleNameChange = (input, taskID) => {
  const taskName = input.value.trim();
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
        let startDate = new Date().setHours(
          parseInt(block.startTime.split(":")[0])
        );
        let endDate = new Date().setHours(
          parseInt(block.endTime.split(":")[0])
        );
        if (startDate > endDate) {
          block.blockEndDate = new Date(block.blockDate);
          block.blockEndDate.setDate(block.blockEndDate.getDate() + 1);
          block.blockEndDate = block.blockEndDate.toISOString().split("T")[0]; // Format to YYYY-MM-DD
        } else {
          // Keep the same date if end time is not after start time
          block.blockStartDate = block.blockEndDate;
          block.blockDate = block.blockEndDate;
        }
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
      block.blockStartDate = dateValue;
      block.blockEndDate = dateValue;
      localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
      break;
    }
  }

  // Update shifts that have blockIDs starting with this blockID
  SHIFTS_GLOBAL.forEach((shift) => {
    if (shift.blockID.startsWith(blockID)) {
      shift.date = dateValue;
      shift.block.blockDate = dateValue;
      shift.block.blockStartDate = dateValue;
      shift.block.blockEndDate = dateValue;
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
      blockStartDate: TOM_DATE,
      blockEndDate: TOM_DATE,
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
    blockEndDate: lastBlock.blockEndDate,
    blockStartDate: lastBlock.blockEndDate,
    startTime: lastBlock.endTime,
    endTime: incrementHour(lastBlock.endTime, blockDuration),
    duration: calculateDuration(lastBlock.startTime, lastBlock.endTime),
    soldierAmount: lastBlock.soldierAmount,
  };
  let startDate = new Date().setHours(
    parseInt(newBlock.startTime.split(":")[0])
  );
  let endDate = new Date().setHours(parseInt(newBlock.endTime.split(":")[0]));
  if (startDate > endDate) {
    newBlock.blockEndDate = new Date(newBlock.blockDate);
    newBlock.blockEndDate.setDate(newBlock.blockEndDate.getDate() + 1);
    newBlock.blockEndDate = newBlock.blockEndDate.toISOString().split("T")[0]; // Format to YYYY-MM-DD
  }

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
    new Date(newBlock.blockEndDate)
  )}</span>
                  <input type="date" onChange = "handleDateChange(this,'${blockID}')" class="start-time timeIN" value="${
    newBlock.blockEndDate
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
    return task.blocks.some((block) => block.blockStartDate === TOM_DATE);
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
        $blockDateSpan.text(formatDate(new Date(block.blockEndDate)));
        const dateInput = document.querySelector(
          `#${CSS.escape(blockID)} input[type="date"]`
        );
        if (dateInput) {
          dateInput.value = block.blockEndDate;
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
  renderShifts();
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
  //console.log(shiftColids);
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
    let lastTaskDate = `התחיל ב${last_shift.startTime} עד ${last_shift.endTime} <br> בתאריך ${last_shift.date}`;
    $("#soldier-detail-modal").css({
      display: "block",
      position: "fixed",
      top: "10px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
    });
    $("#soldier-detail-modal #soldier-name").text(soldierName);
    $("#soldier-detail-modal #soldier-unit").text(
      "מחלקת " + soldierObj.keywords[0]
    );
    $("#last-task-name").html(last_shift.taskName);
    $("#last-task-date").html(lastTaskDate);
    $("#last-task-duration").text(
      `משך המשימה : ${last_shift.duration.toFixed(2)} שעות`
    );
    console.table(last_shift.block);
    console.table(currentBlock);

    const restTime = calculateDuration(
      last_shift.endTime,
      currentBlock.startTime,
      last_shift.block.blockEndDate,
      currentBlock.blockStartDate
    );

    // $.notify(
    //   `חייל: ${soldierName}\nמשימה אחרונה: ${last_shift.taskName}\nמ-${last_shift.startTime} עד ${last_shift.endTime}\nתאריך: ${last_shift.date}\nמשך משימה: ${last_shift.duration} שעות\nזמן מנוחה: ${restTime} שעות`,
    //   "info"
    // );
    $("#last-task-rest-time").text(
      `${calculateDuration(
        last_shift.endTime,
        currentBlock.startTime,
        last_shift.block.blockEndDate,
        currentBlock.blockStartDate
      ).toFixed(2)} שעות`
    );
    $("#last-task-rest-time").css({
      backgroundColor: getColorForDurationSpan(
        last_shift.duration,
        calculateDuration(
          last_shift.endTime,
          currentBlock.startTime,
          last_shift.block.blockEndDate,
          currentBlock.blockStartDate
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
      SHIFTS_GLOBAL = SHIFTS_GLOBAL.filter(
        (shift) => shift.block.taskId !== taskID
      );
      localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
      localStorage.setItem("shifts", JSON.stringify(SHIFTS_GLOBAL));
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
  console.table({
    startTime,
    endTime,
    startDate,
    endDate,
  });
  startTime = formatTimeString(startTime);
  endTime = formatTimeString(endTime);
  // If dates are provided, use them; otherwise assume same day
  if (startDate && endDate) {
    const startDateTime = new Date(startDate + "T" + startTime);
    const endDateTime = new Date(endDate + "T" + endTime);
    console.log("in calc duration", "start", startDateTime, "end", endDateTime);
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
      shift.block.blockStartDate + "T" + shift.startTime
    ).getTime();
    let endTimeStamp = new Date(
      shift.block.blockEndDate + "T" + shift.endTime
    ).getTime();

    let checkStartTimeStamp = new Date(
      shiftToCheck.block.blockStartDate + "T" + shiftToCheck.startTime
    ).getTime();
    let checkEndTimeStamp = new Date(
      shiftToCheck.block.blockEndDate + "T" + shiftToCheck.endTime
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

const exportScheduleToPDF = async () => {
  // Create a clean version of the schedule for PDF
  const scheduleContent = document.createElement("div");
  scheduleContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px; background-color: #ffffff; padding: 10px;">
      <h1 style="color: #000000; font-size: 24px; margin-bottom: 10px;">לוח משמרות - ${formatDate(
        new Date(TOM_DATE)
      )}</h1>
      <p style="color: #000000; font-size: 16px;">תאריך: ${TOM_DATE}</p>
    </div>
  `;

  // Clone tasks container
  const tasksClone = document.getElementById("tasks-container").cloneNode(true);

  // Remove edit elements from clone
  tasksClone
    .querySelectorAll(
      ".task-close, .add-task-btn, .add-soldier-btn, .remove-soldier-btn, .add-block-btn, .remove-block-btn"
    )
    .forEach((el) => el.remove());

  // Replace input fields with their values
  tasksClone
    .querySelectorAll(
      'input[type="time"], input[type="date"], input[type="text"]'
    )
    .forEach((input) => {
      const span = document.createElement("span");
      span.textContent = input.value || "";
      span.className = input.className;

      // Force inline styles for better rendering
      const computedStyle = window.getComputedStyle(input);
      span.style.cssText = `
      color: #000000;
      background-color: ${
        input.classList.contains("task-title")
          ? computedStyle.backgroundColor || "#ffffff"
          : "#ffffff"
      };
      border: none;
      padding: 2px 5px;
      display: inline-block;
      font-weight: ${
        input.classList.contains("task-title") ? "bold" : "normal"
      };
      font-size: 14px;
      width: auto;
      min-width: 100px;
    `;
      input.parentNode.replaceChild(span, input);
    });

  // Replace pick-lists with soldier names from SHIFTS_GLOBAL
  tasksClone.querySelectorAll("pick-list").forEach((pickList) => {
    const pickListId = pickList.id;
    const blockId = pickListId.replace("pick-list-", "");

    // Find the corresponding shift
    const shift = SHIFTS_GLOBAL.find((shift) => shift.blockID === blockId);
    const soldierName = shift ? shift.soldierName : "לא שובץ";

    const span = document.createElement("span");
    span.textContent = soldierName;
    span.style.cssText = `
      padding: 8px 12px;
      border: 1px solid #333333;
      display: inline-block;
      margin: 2px;
      color: #000000;
      background-color: #f0f0f0;
      border-radius: 4px;
      font-size: 14px;
      min-width: 100px;
      text-align: center;
    `;
    pickList.parentNode.replaceChild(span, pickList);
  });

  scheduleContent.appendChild(tasksClone);

  // Apply comprehensive PDF-friendly styles to container
  scheduleContent.style.cssText = `
    font-family: Arial, Helvetica, sans-serif;
    direction: rtl;
    text-align: right;
    max-width: 800px;
    margin: 0 auto;
    background-color: #ffffff;
    padding: 20px;
    color: #000000;
    line-height: 1.4;
  `;

  // Function to get contrasting text color based on background
  const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor === "transparent") return "#000000";

    const color = hexColor
      .replace("#", "")
      .replace("rgb(", "")
      .replace(")", "");

    if (color.includes(",")) {
      // Handle rgb format
      const [r, g, b] = color.split(",").map((num) => parseInt(num.trim()));
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? "#000000" : "#ffffff";
    } else {
      // Handle hex format
      const r = parseInt(color.substr(0, 2), 16);
      const g = parseInt(color.substr(2, 2), 16);
      const b = parseInt(color.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? "#000000" : "#ffffff";
    }
  };

  // Function to lighten a color for better readability
  const lightenColor = (hexColor, percent) => {
    if (!hexColor || hexColor === "transparent") return "#ffffff";

    let color = hexColor;
    if (color.includes("rgb")) {
      // Convert rgb to hex first
      const rgb = color.match(/\d+/g);
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);
      color = `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }

    color = color.replace("#", "");
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    const newR = Math.min(255, Math.floor(r + ((255 - r) * percent) / 100));
    const newG = Math.min(255, Math.floor(g + ((255 - g) * percent) / 100));
    const newB = Math.min(255, Math.floor(b + ((255 - b) * percent) / 100));

    return `#${newR.toString(16).padStart(2, "0")}${newG
      .toString(16)
      .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
  };

  // Force all inline styles for better html2canvas compatibility
  const allElements = scheduleContent.querySelectorAll("*");
  allElements.forEach((el, index) => {
    const computedStyle = window.getComputedStyle(el);

    // Force background color
    if (
      !el.style.backgroundColor ||
      el.style.backgroundColor === "transparent"
    ) {
      el.style.backgroundColor = "#ffffff";
    }

    // Force text color
    el.style.color = "#000000";

    // Handle different element types
    if (el.tagName === "TABLE") {
      el.style.cssText = `
        border-collapse: collapse;
        width: 100%;
        margin: 10px 0;
        background-color: #ffffff;
        border: 2px solid #333333;
      `;
    }

    if (el.tagName === "TH" || el.tagName === "TD") {
      el.style.cssText = `
        border: 1px solid #333333;
        padding: 8px;
        text-align: center;
        color: #000000;
        background-color: #ffffff;
        vertical-align: middle;
      `;
    }

    if (el.tagName === "TH") {
      el.style.backgroundColor = "#e0e0e0";
      el.style.fontWeight = "bold";
      el.style.color = "#000000";
    }

    // Handle task headers (H2 elements) with their original colors
    if (el.tagName === "H2") {
      const originalInput =
        el.querySelector("input") || el.querySelector("span");
      let originalBgColor = "#f0f0f0";

      if (originalInput) {
        const inputStyle = window.getComputedStyle(originalInput);
        originalBgColor = inputStyle.backgroundColor || originalBgColor;
      }

      // If it's still transparent or not set, try to get from the element itself
      if (
        originalBgColor === "transparent" ||
        originalBgColor === "rgba(0, 0, 0, 0)"
      ) {
        const h2Style = window.getComputedStyle(el);
        originalBgColor = h2Style.backgroundColor || getBrightColor(index + 1);
      }

      const textColor = getContrastColor(originalBgColor);

      el.style.cssText = `
        margin: 15px 0 10px 0;
        padding: 15px;
        border-radius: 8px;
        background-color: ${originalBgColor};
        color: ${textColor};
        text-align: center;
        font-weight: bold;
        font-size: 18px;
        border: 2px solid #333333;
      `;
    }
  });

  // Add alternating row colors for better readability
  const tables = scheduleContent.querySelectorAll("table");
  tables.forEach((table, tableIndex) => {
    const rows = table.querySelectorAll("tbody tr");

    // Get the task color from the header (H2) of this table's container
    const tableContainer = table.closest(".table-container");
    const header = tableContainer?.querySelector("h2");
    let taskColor = getBrightColor(tableIndex + 1);

    if (header) {
      const headerStyle = window.getComputedStyle(header);
      taskColor = headerStyle.backgroundColor || taskColor;
    }

    const lightTaskColor = lightenColor(taskColor, 85);
    const veryLightTaskColor = lightenColor(taskColor, 95);

    rows.forEach((row, rowIndex) => {
      const rowColor = rowIndex % 2 === 0 ? lightTaskColor : veryLightTaskColor;
      row.style.backgroundColor = rowColor;

      const cells = row.querySelectorAll("td");
      cells.forEach((cell) => {
        cell.style.backgroundColor = rowColor;
        cell.style.color = "#000000";
        cell.style.border = "1px solid #333333";
      });
    });
  });

  // Add to document temporarily for rendering
  document.body.appendChild(scheduleContent);

  try {
    // Wait for styles to apply
    await new Promise((resolve) => setTimeout(resolve, 200));

    const canvas = await html2canvas(scheduleContent, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      foreignObjectRendering: false,
      logging: true,
      letterRendering: true,
      removeContainer: false,
      onclone: (clonedDoc) => {
        // Force all elements in cloned document to have proper styles
        const clonedElements = clonedDoc.querySelectorAll("*");
        clonedElements.forEach((el) => {
          if (
            !el.style.backgroundColor ||
            el.style.backgroundColor === "transparent"
          ) {
            el.style.backgroundColor = "#ffffff";
          }
          if (!el.style.color) {
            el.style.color = "#000000";
          }
        });
      },
    });

    const imgData = canvas.toDataURL("image/png", 1.0);

    // Create PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    const fileName = `schedule-${TOM_DATE}-${formatDate(
      new Date(TOM_DATE)
    ).replace(/\s+/g, "-")}.pdf`;
    pdf.save(fileName);

    Swal.fire({
      title: "PDF נוצר בהצלחה!",
      text: `הקובץ נשמר בשם: ${fileName}`,
      icon: "success",
      confirmButtonText: "אישור",
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    Swal.fire({
      title: "שגיאה ביצירת PDF",
      text: "אירעה שגיאה בעת יצירת קובץ ה-PDF. נסה שוב.",
      icon: "error",
      confirmButtonText: "אישור",
    });
  } finally {
    // Clean up - remove the temporary element
    if (document.body.contains(scheduleContent)) {
      document.body.removeChild(scheduleContent);
    }
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
  window.location.href = `${locationName}.html`;
};

const formatTimeString = (timeStr) => {
  const [hours, minutes] = timeStr.split(":");
  const paddedHours = hours.padStart(2, "0");
  return `${paddedHours}:${minutes}`;
};

const saveToserver = () => {
  TASK_GLOBAL2 = JSON.parse(localStorage.getItem("tasks2")) || [];
  SHIFTS_GLOBAL = JSON.parse(localStorage.getItem("shifts")) || [];
  SOLIDIER_HERE_GLOBAL = JSON.parse(localStorage.getItem("solidierHere")) || [];
  const dataToSave = {
    tasks: TASK_GLOBAL2,
    shifts: SHIFTS_GLOBAL,
    soldiersHere: SOLIDIER_HERE_GLOBAL,
  };
  $(".loader").show();
  Save("Data", dataToSave);

  // fetch(`${API_PREFIX}/api/data`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(dataToSave),
  // })
  //   .then((response) => {
  //     $(".loader").hide();

  //     if (!response.ok) {
  //       throw new Error("Network response was not ok");
  //     }
  //     return response.json();
  //   })
  //   .then((data) => {
  //     console.log("Data saved successfully:", data);
  //     Swal.fire({
  //       title: "הנתונים נשמרו בהצלחה!",
  //       icon: "success",
  //       confirmButtonText: "אישור",
  //     });
  //   })
  //   .catch((error) => {
  //     $(".loader").hide();
  //     console.error("Error saving data:", error);
  //     Swal.fire({
  //       title: "שגיאה בשמירת הנתונים",
  //       text: "אירעה שגיאה בעת שמירת הנתונים לשרת\nתפנה לסיני 051-2122453",
  //       icon: "error",
  //       confirmButtonText: "אישור",
  //     });
  //   });
};

const getFromServer = () => {
  $(".loader").show();
  ReadFrom("Data", (data) => {
    $(".loader").hide();
    if (data) {
      console.log("Data loaded from server:", data);
      TASK_GLOBAL2 = data.tasks || [];
      SHIFTS_GLOBAL = data.shifts || [];
      SOLIDIER_HERE_GLOBAL = data.soldiersHere || [];
      localStorage.setItem("tasks2", JSON.stringify(TASK_GLOBAL2));
      localStorage.setItem("shifts", JSON.stringify(SHIFTS_GLOBAL));
      localStorage.setItem(
        "solidierHere",
        JSON.stringify(SOLIDIER_HERE_GLOBAL)
      );
      RenderTaskList2();
      renderShifts();
      Swal.fire({
        title: "הנתונים נטענו בהצלחה!",
        icon: "success",
        confirmButtonText: "אישור",
      });
    } else {
      Swal.fire({
        title: "שגיאה בטעינת הנתונים",
        text: "לא נמצאו נתונים בשרת",
        icon: "error",
        confirmButtonText: "אישור",
      });
    }
  });
};
