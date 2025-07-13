GLOBAL = [];

$(document).ready(() => {
  console.log("ready");
  $("#modalControl").hide();
  getFromServer();
  let today = new Date();
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 0);
  let formattedDate = tomorrow.toLocaleDateString("en-CA"); // YYYY-MM-DD format
  $("#header-date").val(formattedDate);
  $("#header-date").on("change", () => {
    const selectedDate = $("#header-date").val();
    const filteredData = filterByDate(GLOBAL, selectedDate);
    RenderSchedule(filteredData);
  });

  $("#search-input").on("input", () => {
    let searchTerm = $("#search-input").val().toLowerCase();

    // Remove previous highlights
    $(".highlight-soldier").removeClass("highlight-soldier");

    const filteredData = GLOBAL.map((task) => ({
      ...task,
      blocks: task.blocks.filter((block) =>
        block.soldiersNames?.some((soldier) =>
          soldier.value.toLowerCase().includes(searchTerm)
        )
      ),
    })).filter((task) => task.blocks.length > 0);

    RenderSchedule(filterByDate(filteredData, $("#header-date").val()));

    // Add highlight to matching soldiers if there's a search term
    if (searchTerm) {
      setTimeout(() => {
        $(".soldier-item").each(function () {
          if ($(this).text().toLowerCase().includes(searchTerm)) {
            $(this).addClass("highlight-soldier");
          }
        });
      }, 100); // Small delay to ensure DOM is updated
    }
  });
});

const getFromServer = () => {
  $(".loader").show();
  ReadFrom("Data2", (data) => {
    console.log("Data received from server:", data.TASKS);
    if (data) {
      //console.log("Data read from server:", data);
      $(".loader").hide();
      GLOBAL = data.TASKS;
      RenderSchedule(filterByDate(GLOBAL, $("#header-date").val()));
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

const filterByDate = (data, targetDate) => {
  // Convert target date to start and end timestamps
  const targetStart = new Date(targetDate).setHours(0, 0, 0, 0);
  const targetEnd = new Date(targetDate).setHours(23, 59, 59, 999);

  return data
    .map((task) => ({
      ...task,
      blocks: task.blocks.filter((block) => {
        // Check if the block either starts or ends within the target date
        return (
          (block.startTimeStamp >= targetStart &&
            block.startTimeStamp <= targetEnd) ||
          (block.endTimeStamp >= targetStart &&
            block.endTimeStamp <= targetEnd) ||
          (block.startTimeStamp <= targetStart &&
            block.endTimeStamp >= targetEnd)
        );
      }),
    }))
    .filter((task) => task.blocks.length > 0);
};

const RenderSchedule = (data) => {
  const $ph = $("#schedule-ph");
  $ph.empty();
  let str = "";

  data.forEach((task) => {
    str += `
      <div class="task">
        <h1 class="task-title" style="background-color: ${task.color}">${task.taskName}</h1>
        <div class="row header">
          <div class="col-5">שעות</div>
          <div class="col-7">חיילים</div>
        </div>`;

    task.blocks.forEach((block) => {
      // Convert timestamps to readable format
      const startDate = new Date(block.startTimeStamp);
      const endDate = new Date(block.endTimeStamp);
      const startTime = startDate.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const endTime = endDate.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (block.soldiersNames && block.soldiersNames.length > 0) {
        str += `
          <div class="row content">
            <div class="col-5 times-col">
              <p class="time">${startTime}-${endTime}</p>
              <p class="day_in_week">${formatDayRange(startDate, endDate)}</p>
            </div>
            <div class="col-7 soldiers-col">
              <ul class="soldiers-list">
                ${block.soldiersNames
                  .map(
                    (soldier) =>
                      `<li onclick="handleSoldierClick('${soldier.value.replace(
                        /'/g,
                        "\\'"
                      )}')" 
                      class="soldier-item" id="id-${soldier.keywords[1]}">${
                        soldier.value
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>
          </div>`;
      }
    });

    str += "</div>";
  });

  $ph.append(str);
};

function formatDayDate(date) {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const dayName = days[date.getDay()];
  return `יום ${dayName}`;
}

function formatDayRange(startDate, endDate) {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const startDay = startDate.getDay();
  const endDay = endDate.getDay();

  // Check if the dates are on different days
  if (startDate.toDateString() !== endDate.toDateString()) {
    return `יום ${days[startDay]} - יום ${days[endDay]}`;
  }

  // If same day, return original format
  return `יום ${days[startDay]}`;
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
