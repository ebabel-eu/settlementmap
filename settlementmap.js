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

  function generateSettlementShape(gridCount, targetCount, avoidEdges = true) {
    const filled = new Set();
    const toExplore = [];

    // Start near the center, with some randomness
    const offset = Math.floor(Math.random() * 4) - 2;
    const center = Math.floor(gridCount / 2);
    toExplore.push(`${center + offset},${center + offset}`);
    filled.add(`${center + offset},${center + offset}`);

    while (filled.size < targetCount && toExplore.length > 0) {
      const [x, y] = toExplore.shift().split(',').map(Number);
      const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;

        if (
          nx >= (avoidEdges ? 1 : 0) &&
          ny >= (avoidEdges ? 1 : 0) &&
          nx < gridCount - (avoidEdges ? 1 : 0) &&
          ny < gridCount - (avoidEdges ? 1 : 0) &&
          !filled.has(key) &&
          Math.random() < 0.65
        ) {
          filled.add(key);
          toExplore.push(key);
          if (filled.size >= targetCount) break;
        }
      }
    }

    return Array.from(filled).map(str => str.split(',').map(Number));
  }

  function splitIntoDistricts(cells, districtTypes, type) {
    const shuffled = [...cells];
    const grid = new Map(shuffled.map(([x, y]) => [`${x},${y}`, null]));
    const chunks = {};
    const queue = [];
    let remaining = new Set(shuffled.map(([x, y]) => `${x},${y}`));

    const districtOrder = [...districtTypes].sort(() => Math.random() - 0.5);

    for (const district of districtOrder) {
      const chunk = [];

      const seed = shuffled.find(([x, y]) => remaining.has(`${x},${y}`));
      if (!seed) {
        console.warn(`No remaining cell found for district ${district}`);
        continue;
      }

      const [seedX, seedY] = seed;
      const visited = new Set();
      queue.push([seedX, seedY]);
      visited.add(`${seedX},${seedY}`);
      remaining.delete(`${seedX},${seedY}`);

      let maxCells;
      if (district === "Fort") {
        maxCells = type === "Town"
          ? Math.floor(1 + Math.random() * 2)
          : Math.floor(3 + Math.random() * 4); // 3 to 6
      } else {
        maxCells = Math.floor(cells.length / districtTypes.length * (0.8 + Math.random() * 0.4));
      }

      while (queue.length > 0 && chunk.length < maxCells) {
        const [x, y] = queue.shift();
        chunk.push([x, y]);
        grid.set(`${x},${y}`, district);

        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (const [dx, dy] of directions) {
          const nx = x + dx;
          const ny = y + dy;
          const key = `${nx},${ny}`;
          if (remaining.has(key) && !visited.has(key)) {
            visited.add(key);
            queue.push([nx, ny]);
            remaining.delete(key);
          }
        }
      }

      chunks[district] = chunk;
    }

    return chunks;
  }

  function getDistrictColour(district) {
    const variableName = `--district-${district.toLowerCase().replace(/\s+/g, '-')}`;
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || '#ccc';
  }

  function drawDistricts(ctx, gridCount, districtChunks) {
    const cellSize = canvas.width / gridCount;

    for (const [district, cells] of Object.entries(districtChunks)) {
      const colour = getDistrictColour(district);
      ctx.fillStyle = colour;
      for (const [x, y] of cells) {
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
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
    const districts = [...allowedDistricts[type]];

    const usableShape = generateSettlementShape(gridCount, Math.floor(gridCount * gridCount * 0.4), true);
    const districtCells = splitIntoDistricts(usableShape, districts, type);

    drawDistricts(ctx, gridCount, districtCells);
    drawGrid(ctx, gridCount);
  }

  // Event listeners
  newVillageBtn.addEventListener("click", () => generateSettlement("Village", ctx));
  newTownBtn.addEventListener("click", () => generateSettlement("Town", ctx));
  newCityBtn.addEventListener("click", () => generateSettlement("City", ctx));

  generateSettlement("Village", ctx);
}

loadApp();
