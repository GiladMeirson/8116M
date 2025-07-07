const ReadFrom = (ref, CB) => {
  const collection = firebase.database().ref(ref);
  collection.on("value", (snapshot) => {
    const data = snapshot.val();
    console.log("Data read from Firebase:", data);
    CB(data);
  });
};

const Save = (ref, value) => {
  ref = firebase.database().ref(ref);
  ref.set(value);
  $(".loader").hide();
};
