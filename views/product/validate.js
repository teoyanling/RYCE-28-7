var send = document.getElementById("submit");
send.addEventListener("click", formValidation);

function formValidation(e){
  //Contact value
  var productname = document.getElementById("productname").value;
  var price = document.getElementById("price").value;
  var coe = document.getElementById("coe").value;
  var hireprice6 = document.getElementById("hireprice6").value;
  var hireprice12 = document.getElementById("hireprice12").value;
  
  //Presentation value
  var electricvehicle = document.getElementById("electricvehicle").checked;
  var sports = document.getElementById("sports").checked;
  var sedans = document.getElementById("sedans").checked;
  var SUVS = document.getElementById("SUVS").value;
  var description = document.getElementById("description").value.length;


  //Contact validation
  if (productname === "" || price === "" || coe === "" || hireprice6 === "" ||  hireprice12 === "" || description === "") {
    e.preventDefault();
    alert ("All Basic inforamtion must be filled.");
    return false;
  }

 

  //Title validation
  if ((electricvehicle === true && title === "") || (sports === true && title === "") || (sedans === true && title === "") || (SUVS === true && title === "")) {
    e.preventDefault();
    alert ("Car Type must be filled.");
    return false;
  }
  
  //Message validation
  if (msg > 200) {
    e.preventDefault();
    alert ("You can write max 200 signs.");
    return false;
  }
}