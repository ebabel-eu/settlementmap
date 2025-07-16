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
  const allowedDistricts = data.allowedDistricts;

  function getRandomName(settlementType) {
    const settlementNames = namePools[settlementType];
    const index = Math.floor(Math.random() * settlementNames.length);
    return settlementNames[index];
  }

  function clearMap(ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function generateSettlementShape(gridCount, targetCount) {
    const filled = new Set();
    const toExplore = [];

    // Start near the center
    const center = Math.floor(gridCount / 2);
    toExplore.push(`${center},${center}`);
    filled.add(`${center},${center}`);

    while (filled.size < targetCount && toExplore.length > 0) {
      const [x, y] = toExplore.shift().split(',').map(Number);

      // Neighbouring positions (4-directional)
      const directions = [
        [0, -1], [1, 0], [0, 1], [-1, 0]
      ];

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;

        if (
          nx >= 0 && ny >= 0 &&
          nx < gridCount && ny < gridCount &&
          !filled.has(key) &&
          Math.random() < 0.6 // randomness to make shape less uniform
        ) {
          filled.add(key);
          toExplore.push(key);
          if (filled.size >= targetCount) break;
        }
      }
    }

    return Array.from(filled).map(str => str.split(',').map(Number));
  }

  function drawDistricts(ctx, gridCount, districtTypes, cells) {
    const cellSize = canvas.width / gridCount;

    for (const [x, y] of cells) {
      const district = districtTypes[Math.floor(Math.random() * districtTypes.length)];
      ctx.fillStyle = getDistrictColour(district);
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  function getDistrictColour(district) {
    const variableName = `--district-${district.toLowerCase().replace(/\s+/g, '-')}`;
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || '#ccc';
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

  function generateSettlement(type, ctx) {
    const name = getRandomName(type);
    nameEl.textContent = name;
    typeEl.textContent = type;

    clearMap(ctx);

    const gridCount = gridSizes[type];
    const districtTypes = allowedDistricts[type];

    const usedCells = new Set();

    for (const district of districtTypes) {
      const maxFill = Math.floor((gridCount * gridCount) / districtTypes.length * (0.8 + Math.random() * 0.4)); // variable size
      const cells = generateDistrictShape(gridCount, maxFill, usedCells);
      drawDistrict(ctx, gridCount, district, cells);
      for (const [x, y] of cells) {
        usedCells.add(`${x},${y}`);
      }
    }

    drawGrid(ctx, gridCount); // overlay
  }

  function generateDistrictShape(gridCount, targetCount, usedCells) {
    const filled = new Set();
    const toExplore = [];

    // Start from a random unused cell
    let start;
    do {
      const sx = Math.floor(Math.random() * gridCount);
      const sy = Math.floor(Math.random() * gridCount);
      const key = `${sx},${sy}`;
      if (!usedCells.has(key)) {
        start = key;
        break;
      }
    } while (true);

    toExplore.push(start);
    filled.add(start);

    while (filled.size < targetCount && toExplore.length > 0) {
      const [x, y] = toExplore.shift().split(',').map(Number);

      const directions = [
        [0, -1], [1, 0], [0, 1], [-1, 0]
      ];

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;

        if (
          nx >= 0 && ny >= 0 &&
          nx < gridCount && ny < gridCount &&
          !filled.has(key) &&
          !usedCells.has(key) &&
          Math.random() < 0.7
        ) {
          filled.add(key);
          toExplore.push(key);
          if (filled.size >= targetCount) break;
        }
      }
    }

    return Array.from(filled).map(str => str.split(',').map(Number));
  }

  function drawDistrict(ctx, gridCount, district, cells) {
    const cellSize = canvas.width / gridCount;
    ctx.fillStyle = getDistrictColour(district);
    for (const [x, y] of cells) {
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // Event listeners
  newVillageBtn.addEventListener("click", () => generateSettlement("Village", ctx));
  newTownBtn.addEventListener("click", () => generateSettlement("Town", ctx));
  newCityBtn.addEventListener("click", () => generateSettlement("City", ctx));

  generateSettlement("Village", ctx);
}

loadApp();
