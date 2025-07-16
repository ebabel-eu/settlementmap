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
  const gridSizes = data.gridSizes;

  function getRandomName(settlementType) {
    const settlementNames = namePools[settlementType];
    const index = Math.floor(Math.random() * settlementNames.length);
    return settlementNames[index];
  }

  function clearMap(ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid(ctx, gridCount) {
    const cellSize = canvas.width / gridCount;
    const width = canvas.width;
    const height = canvas.height;

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function generateSettlement(settlementType, ctx) {
    const name = getRandomName(settlementType);

    nameEl.textContent = name;
    typeEl.textContent = settlementType;

    clearMap(ctx);

    const gridCount = gridSizes[settlementType];
    drawGrid(ctx, gridCount);
  }

  // Event listeners
  newVillageBtn.addEventListener("click", () => generateSettlement("Village", ctx));
  newTownBtn.addEventListener("click", () => generateSettlement("Town", ctx));
  newCityBtn.addEventListener("click", () => generateSettlement("City", ctx));

  generateSettlement("Village", ctx);
}

loadApp();
