async function loadApp() {
  const response = await fetch('./data.json');
  if (!response.ok) {
    console.error('Failed to load JSON data.');
    return;
  }
  const jsonData = await response.json();
  initApp(jsonData);
}

function initApp(data) {
  const canvas = document.getElementById("settlementCanvas");
  const ctx = canvas.getContext("2d");
  const nameEl = document.getElementById("settlement-name");
  const typeEl = document.getElementById("settlement-type");
  const newVillageBtn = document.getElementById("newVillageButton");
  const newTownBtn = document.getElementById("newTownButton");
  const newCityBtn = document.getElementById("newCityButton");

  const namePools = {
    Village: data.villageNames,
    Town: data.townNames,
    City: data.cityNames
  };

  function getRandomName(type) {
    const settlementNames = namePools[type];
    const index = Math.floor(Math.random() * settlementNames.length);
    return settlementNames[index];
  }

  function clearMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function generateSettlement(type) {
    const name = getRandomName(type);

    nameEl.textContent = name;
    typeEl.textContent = type;

    clearMap();

    // Temporary visual feedback (later: draw buildings, etc.)
    ctx.fillStyle = "#ddd";
    ctx.font = "20px serif";
    ctx.fillText(`${name} (${type})`, 20, 40);
  }

  // Event listeners
  newVillageBtn.addEventListener("click", () => generateSettlement("Village"));
  newTownBtn.addEventListener("click", () => generateSettlement("Town"));
  newCityBtn.addEventListener("click", () => generateSettlement("City"));

  generateSettlement("Village");
}

loadApp();
