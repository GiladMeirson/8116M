TASK_GLOBAL2 = [];
SHIFTS_GLOBAL = [];
SOLIDIER_HERE_GLOBAL = [];

$(document).ready(() => {
  console.log("ready");
  $("#modalControl").hide();
  getFromServer();
  let today = new Date();
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 0);
  let formattedDate = tomorrow.toISOString().split("T")[0];
  $("#header-date").val(formattedDate);
  $("#header-date").on("change", () => {
    console.log("Date changed to:", $("#header-date").val());
    let allShifts = groupByTaskAndBaseBlockId(SHIFTS_GLOBAL);
    RenderSchedule(filterByDate(allShifts, $("#header-date").val()));
  });

  $("#search-input").on("input", () => {
    let searchTerm = $("#search-input").val().toLowerCase();
    console.log("Search term:", searchTerm);
    let filteredShifts = SHIFTS_GLOBAL.filter((shift) =>
      shift.soldierName.toLowerCase().includes(searchTerm)
    );
    console.log("Filtered tasks:", filteredShifts);

    // Re-render the schedule with the filtered tasks
    let allShifts = groupByTaskAndBaseBlockId(filteredShifts);
    RenderSchedule(filterByDate(allShifts, $("#header-date").val()));
  });
});

const getFromServer = () => {
  $(".loader").show();
  ReadFrom("Data", (data) => {
    if (data) {
      //console.log("Data read from server:", data);
      $(".loader").hide();
      TASK_GLOBAL2 = data.tasks || [];
      SHIFTS_GLOBAL = data.shifts || [];
      SOLIDIER_HERE_GLOBAL = data.soldiersHere || [];
      let allShifts = groupByTaskAndBaseBlockId(SHIFTS_GLOBAL);
      RenderSchedule(filterByDate(allShifts, $("#header-date").val()));
      //console.log("Grouped Shifts:", allShifts);
    } else {
      $(".loader").hide();
      Swal.fire({
        title: "שגיאה בטעינת הנתונים",
        text: "לא נמצאו נתונים בשרת",
        icon: "error",
        confirmButtonText: "אישור",
      });
    }
  });
};

const groupByTaskAndBaseBlockId = (data) => {
  return data.reduce((grouped, item) => {
    // Get the task ID from the block object
    const taskId = item.block.taskId;

    // Extract the base block ID (part before the "-")
    const baseBlockId = item.blockID.split("-")[0];

    // If this task ID doesn't exist, create an object for it
    if (!grouped[taskId]) {
      grouped[taskId] = {};
    }

    // If this base block ID doesn't exist within the task, create an array for it
    if (!grouped[taskId][baseBlockId]) {
      grouped[taskId][baseBlockId] = [];
    }

    // Add the current item to the appropriate group
    grouped[taskId][baseBlockId].push(item);

    return grouped;
  }, {});
};

const filterByDate = (groupedData, targetDate) => {
  const filtered = {};
  //console.log("Filtering data for date:", targetDate);
  //console.log("Grouped data structure:", groupedData);

  Object.keys(groupedData).forEach((taskId) => {
    //console.log(`Processing task: ${taskId}`);
    Object.keys(groupedData[taskId]).forEach((blockId) => {
      //console.log(`Processing block: ${blockId}`);
      //console.log(`Items in block:`, groupedData[taskId][blockId]);

      const filteredItems = groupedData[taskId][blockId].filter((item) => {
        //console.log(
        `Comparing: "${item.block.blockStartDate}" === "${targetDate}"`;
        //);
        return item.block.blockStartDate === targetDate;
      });

      //console.log(`Filtered items for ${taskId}-${blockId}:`, filteredItems);

      if (filteredItems.length > 0) {
        if (!filtered[taskId]) {
          filtered[taskId] = {};
        }
        filtered[taskId][blockId] = filteredItems;
      }
    });
  });

  //console.log("Final filtered result:", filtered);
  return filtered;
};

const RenderSchedule = (groupedData) => {
  //console.log("Rendering schedule with grouped data:", groupedData);
  const $ph = $("#schedule-ph");
  $ph.empty(); // Clear previous content
  let str = ``;
  let index = 1;

  Object.keys(groupedData).forEach((taskId) => {
    // Get the first item to access task name
    const firstBlockId = Object.keys(groupedData[taskId])[0];
    const firstItem = groupedData[taskId][firstBlockId][0];
    let color = getBrightColor(index++);
    // Render task header once per task
    str += `<div class="task">
            <h1 class="task-title" style="background-color: ${color}">${firstItem.taskName}</h1>
            <div class="row header">
              <div class="col-4">שעות</div>
              <div class="col-8">חיילים</div>
            </div>`;

    // Render each block within this task
    Object.keys(groupedData[taskId]).forEach((blockId) => {
      const items = groupedData[taskId][blockId];
      if (items.length > 0) {
        str += `<div class="row content">
              <div class="col-4 times-col">
                <p class="time">${items[0].block.startTime}-${
          items[0].block.endTime
        }</p>
                <p class="day_in_week">${formatDayDate(
                  new Date(items[0].block.blockStartDate)
                )}</p>
              </div>
                <div class="col-8 soldiers-col">
                    <ul class="soldiers-list">
                    ${items
                      .map(
                        (item) =>
                          `<li onclick="handleSoldierClick('${item.soldierName.replace(/'/g, "\\'")}')" class="soldier-item">${item.soldierName}</li>`
                      )
                      .join("")}
                    </ul>
              </div>
            </div>`;
      }
    });

    // Close the task div
    str += `</div>`;
  });

  $ph.append(str);
};

function formatDayDate(date) {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const dayName = days[date.getDay()];
  return `יום ${dayName}`;
}

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

const handleSoldierClick = (soldierName) => {
  const normalizeString = (str) => str.replace(/['"`]/g, "").trim();

  let fullSoldierObject = SOLIDJER.find(
    (soldier) => normalizeString(soldier.value) === normalizeString(soldierName)
  );
  console.log("Full soldier object:", fullSoldierObject);
  if (fullSoldierObject) {
    $("#soldierName").text(fullSoldierObject.value);
    $("#soldiernumber").text(fullSoldierObject.keywords[1]);
    $("#soldierUnit").text("מחלקה " + fullSoldierObject.keywords[0]);
    $("#modalControl").show();
  }
};

const closeThis = (id) => {
  $(`#${id}`).hide();
};
