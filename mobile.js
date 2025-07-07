API_PREFIX = "https://eight116m-server.onrender.com";


$(document).ready(()=>{
    console.log('ready');
    getFromServer();
})


const getFromServer = () => {
  $(".loader").show();
  fetch(`${API_PREFIX}/api/data`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      $(".loader").hide();
      // Assuming data contains tasks, shifts, and soldiersHere
      TASK_GLOBAL2 = data.data.tasks || [];
      SHIFTS_GLOBAL = data.data.shift || [];
      SOLIDIER_HERE_GLOBAL = data.data.soldiersHere || [];
      console.log("Data fetched successfully:", data);
      Swal.fire({
        title: "הנתונים נטענו בהצלחה!",
        icon: "success",
        confirmButtonText: "אישור",
      });
    })
    .catch((error) => {
      $(".loader").hide();
      console.error("Error fetching data:", error);
      Swal.fire({
        title: "שגיאה בטעינת הנתונים",
        text: "אירעה שגיאה בעת טעינת הנתונים מהשרת\nתפנה לסיני 051-2122453",
        icon: "error",
        confirmButtonText: "אישור",
      });
    });
};