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
  const customMenu = document.getElementById("customMenu");

  const namePools = {
    Village: data.villageNames,
    Town: data.townNames,
    City: data.cityNames
  };
  const gridSizes = data.gridSizes;
  const allowedDistricts = data.allowedDistricts;

  let gridCount = 10;
  let currentSettlementType = "Village";
  let cellMap = new Map(); // key: "x,y" -> district

  function getRandomName(settlementType) {
    const settlementNames = namePools[settlementType];
    const index = Math.floor(Math.random() * settlementNames.length);
    return settlementNames[index];
  }

  function clearMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cellMap.clear();
  }

  function drawGrid() {
    const cellSize = canvas.width / gridCount;

    for (const [key, district] of cellMap.entries()) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = getDistrictColour(district);
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function getDistrictColour(district) {
    const baseName = district.toLowerCase().replace(/\s*(district|quarter)$/i, '').trim();
    const variableName = `--district-${baseName.replace(/\s+/g, '-')}`;
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || '#ccc';
  }

  function generateEmptySettlement(type) {
    currentSettlementType = type;
    gridCount = gridSizes[type];
    nameEl.textContent = getRandomName(type);
    typeEl.textContent = type;
    clearMap();
    drawGrid();
  }

  // Context menu logic
  let currentClick = { x: 0, y: 0 };
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const cellSize = canvas.width / gridCount;
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    currentClick = { x, y };

    customMenu.innerHTML = "";
    const recommended = allowedDistricts[currentSettlementType];

    for (const district of recommended) {
      const li = document.createElement("li");
      li.textContent = district;
      li.style.cursor = "pointer";
      li.onclick = () => {
        setDistrict(x, y, district);
        hideMenu();
      };
      customMenu.appendChild(li);
    }

    // Divider
    const divider = document.createElement("li");
    divider.textContent = "────────────";
    customMenu.appendChild(divider);

    const customLi = document.createElement("li");
    customLi.textContent = "Enter custom district...";
    customLi.style.cursor = "pointer";
    customLi.style.fontStyle = "italic";
    customLi.onclick = () => {
      const custom = prompt("Enter district name:");
      if (custom) {
        setDistrict(x, y, custom);
      }
      hideMenu();
    };
    customMenu.appendChild(customLi);

    customMenu.style.left = `${e.clientX}px`;
    customMenu.style.top = `${e.clientY}px`;
    customMenu.style.display = "block";
  });

  function hideMenu() {
    customMenu.style.display = "none";
  }

  function setDistrict(x, y, district) {
    cellMap.set(`${x},${y}`, district);
    drawGrid();
  }

  window.addEventListener("click", hideMenu);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideMenu();
  });

  // Buttons
  newVillageBtn.addEventListener("click", () => generateEmptySettlement("Village"));
  newTownBtn.addEventListener("click", () => generateEmptySettlement("Town"));
  newCityBtn.addEventListener("click", () => generateEmptySettlement("City"));

  generateEmptySettlement("Village"); // start with default
}

loadApp();
