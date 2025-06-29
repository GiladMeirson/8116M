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
  const shifts = JSON.parse(localStorage.getItem("shifts")) || [];
  console.log("Shifts: ", shifts);

  // Group shifts by soldier name
  const soldierShifts = {};

  shifts.forEach((shift) => {
    if (!soldierShifts[shift.soldierName]) {
      soldierShifts[shift.soldierName] = [];
    }
    soldierShifts[shift.soldierName].push(shift);
  });

  // Get normalized data for each soldier
  const normalizedData = [];

  Object.keys(soldierShifts).forEach((soldierName) => {
    // Sort shifts by date and end time to get the latest shift
    const soldierShiftsList = soldierShifts[soldierName].sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.endTime}`);
      const dateTimeB = new Date(`${b.date}T${b.endTime}`);
      return dateTimeB - dateTimeA; // Latest first
    });

    const lastShift = soldierShiftsList[0];

    // Get soldier details from SOLIDJER array
    const soldierDetails = getFullSoldiersByNames([soldierName]);
    const personalNumber =
      soldierDetails.length > 0
        ? soldierDetails[0].keywords[1] || soldierDetails[0].id || "N/A"
        : "N/A";

    // Calculate rest time from last shift end until now
    const lastShiftEndDateTime = new Date(
      `${lastShift.date}T${lastShift.endTime}`
    );
    const now = new Date();
    const restTimeMs = now - lastShiftEndDateTime;
    const restTimeHours = restTimeMs / (1000 * 60 * 60); // Convert to decimal hours

    const restTimeString = restTimeHours.toFixed(2); // Format to 2 decimal places (e.g., 8.54)
    normalizedData.push({
      name: soldierName,
      personalNumber: personalNumber,
      lastTaskName: lastShift.taskName,
      lastTaskEndDate: `${convertDateFormat(lastShift.date)} ${lastShift.endTime}`,
      restTime: parseFloat(restTimeString),
    });
  });

  //   // Update DataTable with normalized data
  //   if (DATA_TABLE) {
  //     DATA_TABLE.clear();
  //     normalizedData.forEach(soldier => {
  //       DATA_TABLE.row.add([
  //         soldier.name,
  //         soldier.personalNumber,
  //         soldier.lastTaskName,
  //         soldier.lastTaskEndDate,
  //         soldier.restTime
  //       ]);
  //     });
  //     DATA_TABLE.draw();
  //   }

  return normalizedData;
};

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
  const [year, month, day] = dateString.split('-');
  // Return in dd/mm/yyyy format
  return `${day}/${month}/${year}`;
}