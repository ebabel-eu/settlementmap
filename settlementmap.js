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
  const toggleDangerBtn = document.getElementById("toggleDangerButton");
  const poiSection = document.getElementById("poiList");

  const namePools = {
    Village: data.villageNames,
    Town: data.townNames,
    City: data.cityNames
  };
  const gridSizes = data.gridSizes;
  const allowedDistricts = data.allowedDistricts;

  let gridCount = 10;
  let currentSettlementType = "Village";
  let cellMap = new Map(); // key: "x,y" -> { district, poi? }

  function getRandomName(settlementType) {
    const settlementNames = namePools[settlementType];
    const index = Math.floor(Math.random() * settlementNames.length);
    return settlementNames[index];
  }

  function clearMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cellMap.clear();
  }

  function updatePoiList() {
    const poiList = document.querySelector("#poiList ul");
    poiList.innerHTML = "";

    // Sort entries by cell number
    const entries = [...cellMap.entries()]
      .filter(([_, value]) => value.poi)
      .map(([key, value]) => {
        const [x, y] = key.split(',').map(Number);
        const cellNumber = y * gridCount + x + 1;
        return { cellNumber, poi: value.poi };
      })
      .sort((a, b) => a.cellNumber - b.cellNumber);

    for (const { cellNumber, poi } of entries) {
      const li = document.createElement("li");

      const strong = document.createElement("strong");
      strong.textContent = cellNumber;

      const span = document.createElement("span");
      span.className = "poi-text";
      span.contentEditable = true;
      span.textContent = poi;

      li.appendChild(strong);
      li.append(": ");
      li.appendChild(span);
      poiList.appendChild(li);
    }
  }

  function getDangerColour(level) {
    switch (level) {
      case "Safe": return "#6a9955";
      case "Unsafe": return "#c2b000";
      case "Risky": return "#b96a00";
      case "Deadly": return "#8b0000";
      default: return "#333";
    }
  }

  function getDangerAbbreviation(level) {
    switch (level) {
      case "Safe": return "S";
      case "Unsafe": return "U";
      case "Risky": return "R";
      case "Deadly": return "D";
      default: return "?";
    }
  }

  function drawGrid() {
    const cellSize = canvas.width / gridCount;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [key, { district, poi, danger }] of cellMap.entries()) {
      const [x, y] = key.split(',').map(Number);
      const cellX = x * cellSize;
      const cellY = y * cellSize;

      // Fill cell background
      ctx.fillStyle = getDistrictColour(district);
      ctx.fillRect(cellX, cellY, cellSize, cellSize);

      // Set common styles
      const fontSize = Math.floor(cellSize * 0.2);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = "#222";
      ctx.textAlign = "center";

      const cellNumber = y * gridCount + x + 1;

      // Cell number (top)
      ctx.textBaseline = "top";
      ctx.fillText(`${cellNumber}`, cellX + cellSize / 2, cellY + 2);

      // District (middle)
      ctx.textBaseline = "middle";
      ctx.fillText(district, cellX + cellSize / 2, cellY + cellSize / 2);

      // PoI (bottom-left)
      if (poi) {
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText("PoI", cellX + 4, cellY + cellSize - 4);
      }

      // Danger level (bottom-right) for DM only
      if (poiSection.style.display !== "none" && danger) {
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = getDangerColour(danger);
        ctx.fillText(getDangerAbbreviation(danger), cellX + cellSize - 4, cellY + cellSize - 4);
      }
    }

    // Draw grid lines
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

    for (const district of data.districts) {
      const li = document.createElement("li");
      li.style.cursor = "pointer";
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.gap = "0.5em";

      const swatch = document.createElement("span");
      swatch.style.display = "inline-block";
      swatch.style.width = "1em";
      swatch.style.height = "1em";
      swatch.style.border = "1px solid #999";
      swatch.style.backgroundColor = getDistrictColour(district);

      const label = document.createElement("span");
      label.textContent = district;

      li.appendChild(swatch);
      li.appendChild(label);

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
    customLi.textContent = "Enter point of interest...";
    customLi.style.cursor = "pointer";
    customLi.style.fontStyle = "italic";
    customLi.onclick = () => {
      const custom = prompt("Enter point of interest:");
      if (custom) {
        const key = `${x},${y}`;
        const cell = cellMap.get(key);
        if (cell) {
          cellMap.set(key, { ...cell, poi: custom });
        } else {
          cellMap.set(key, { district: "Low", poi: custom }); // fallback default district
        }
        drawGrid();
        updatePoiList();
      }
      hideMenu();
    };
    customMenu.appendChild(customLi);

    // Divider
    const divider2 = document.createElement("li");
    divider2.textContent = "────────────";
    customMenu.appendChild(divider2);

    // Danger submenu
    const dangerLevels = ["Safe", "Unsafe", "Risky", "Deadly"];
    for (const level of dangerLevels) {
      const li = document.createElement("li");
      li.textContent = `Mark as ${level}`;
      li.style.cursor = "pointer";
      li.onclick = () => {
        const key = `${x},${y}`;
        const prev = cellMap.get(key);
        if (prev) {
          cellMap.set(key, { ...prev, danger: level });
        } else {
          cellMap.set(key, { district: "Low", danger: level }); // fallback default district
        }
        drawGrid();
        updatePoiList();
        hideMenu();
      };
      customMenu.appendChild(li);
    }

    // Divider
    const divider3 = document.createElement("li");
    divider3.textContent = "────────────";
    customMenu.appendChild(divider3);

    // Clear cell option
    const clearLi = document.createElement("li");
    clearLi.textContent = "Clear cell";
    clearLi.style.cursor = "pointer";
    clearLi.style.color = "#a00";
    clearLi.onclick = () => {
      const key = `${x},${y}`;
      cellMap.delete(key);
      drawGrid();
      updatePoiList();
      hideMenu();
    };
    customMenu.appendChild(clearLi);

    customMenu.style.left = `${e.clientX}px`;
    customMenu.style.top = `${e.clientY}px`;
    customMenu.style.display = "block";
  });

  function hideMenu() {
    customMenu.style.display = "none";
  }

  function setDistrict(x, y, district) {
    const key = `${x},${y}`;
    const prev = cellMap.get(key);
    cellMap.set(key, { district, poi: prev?.poi });
    drawGrid();
    updatePoiList();
  }

  window.addEventListener("click", hideMenu);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideMenu();
  });

  // Buttons
  newVillageBtn.addEventListener("click", () => generateEmptySettlement("Village"));
  newTownBtn.addEventListener("click", () => generateEmptySettlement("Town"));
  newCityBtn.addEventListener("click", () => generateEmptySettlement("City"));
  toggleDangerBtn.addEventListener("click", () => {
    const visible = poiSection.style.display !== "none";
    poiSection.style.display = visible ? "none" : "block";
    toggleDangerBtn.textContent = visible ? "Show to Players" : "Show to DM";
  });

  generateEmptySettlement("Village"); // start with default
}

loadApp();
