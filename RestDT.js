DATA_TABLE = null;

$(document).ready(() => {
  const normalizedData = getNormalizedData();
  // Initialize the DataTable
  DATA_TABLE = $("#status-soldier").DataTable({
    paging: true,
    searching: true,
    info: false,
    order: [[4, "asc"]],
    columnDefs: [
      { targets: [0], width: "20%" }, // Hide the first column
      { targets: [1], width: "20%" }, // Set width for the second column
      { targets: [2], width: "20%" }, // Set width for the third column
      { targets: [3], width: "20%" }, // Set width for the fourth column
      { targets: [4], width: "20%" }, // Set width for the fifth column
    ],
    columns: [
      { data: "name" },
      { data: "personalNumber" },
      { data: "lastTaskName" },
      { data: "lastTaskEndDate" },
      { data: "restTime" },
    ],
    data: normalizedData,
  });
});

const getNormalizedData = () => {
  GLOBAL = JSON.parse(localStorage.getItem("GLOBAL")) || {};
  console.log("GLOBAL data:", GLOBAL);

  // Create a map to store the latest task for each soldier
  const soldierLatestTasks = new Map();

  // Process each task and its blocks
  GLOBAL.TASKS.forEach((task) => {
    // Process each block in the task
    task.blocks.forEach((block) => {
      // Process each soldier in the block
      block.soldiersNames.forEach((soldier) => {
        const soldierName = soldier.value;
        const currentEndTime = new Date(block.endTimeStamp);

        // Check if this is the latest task for this soldier
        if (
          !soldierLatestTasks.has(soldierName) ||
          currentEndTime > soldierLatestTasks.get(soldierName).endTime
        ) {
          soldierLatestTasks.set(soldierName, {
            name: soldierName,
            personalNumber: soldier.keywords[1] || "N/A",
            lastTaskName: task.taskName,
            lastTaskEndTime: currentEndTime,
            endTimeStamp: block.endTimeStamp,
          });
        }
      });
    });
  });

  // Inside getNormalizedData function, update the time calculation part:
  const normalizedData = Array.from(soldierLatestTasks.values()).map(
    (soldier) => {
      // Calculate rest time from last task end until now
      const now = new Date();
      const restTimeMs = now - soldier.lastTaskEndTime;

      // Handle future dates
      if (restTimeMs < 0) {
        return {
          name: soldier.name,
          personalNumber: soldier.personalNumber,
          lastTaskName: soldier.lastTaskName,
          lastTaskEndDate: formatDateTime(soldier.endTimeStamp),
          restTime: "In Progress", // or "00:00" or "Future Task"
        };
      }

      // Convert milliseconds to hours and minutes
      const totalMinutes = Math.floor(restTimeMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Format as HH:MM
      const restTimeFormatted = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;

      return {
        name: soldier.name,
        personalNumber: soldier.personalNumber,
        lastTaskName: soldier.lastTaskName,
        lastTaskEndDate: formatDateTime(soldier.endTimeStamp),
        restTime: restTimeFormatted,
      };
    }
  );

  return normalizedData;
};

// Helper function to format date and time
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

const moveto = (locationName) => {
  window.location.href = `${locationName}.html`;
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

function convertDateFormat(dateString) {
  // Split the date string by '-'
  const [year, month, day] = dateString.split("-");
  // Return in dd/mm/yyyy format
  return `${day}/${month}/${year}`;
}
