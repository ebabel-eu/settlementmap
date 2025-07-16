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
    const districts = [...allowedDistricts[type]];

    // Step 1: Create organic blob with buffer
    const usableShape = generateSettlementShape(gridCount, Math.floor(gridCount * gridCount * 0.4), true);

    // Step 2: Partition blob into N contiguous sub-blobs
    const districtCells = splitIntoDistricts(usableShape, districts);

    // Step 3: Draw each district
    drawDistricts(ctx, gridCount, districtCells);

    drawGrid(ctx, gridCount); // overlay grid
  }

  // Modified shape generator to avoid edges
  function generateSettlementShape(gridCount, targetCount, avoidEdges = false) {
    const filled = new Set();
    const toExplore = [];

    const start = Math.floor(gridCount / 2);
    toExplore.push(`${start},${start}`);
    filled.add(`${start},${start}`);

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
          Math.random() < 0.6
        ) {
          filled.add(key);
          toExplore.push(key);
          if (filled.size >= targetCount) break;
        }
      }
    }

    return Array.from(filled).map(s => s.split(',').map(Number));
  }

  // Split blob into contiguous district areas
  function splitIntoDistricts(cells, districtTypes) {
    const shuffled = [...cells];
    const grid = new Map(shuffled.map(([x, y]) => [`${x},${y}`, null]));

    const chunks = {};
    const queue = [];
    let remaining = new Set(shuffled.map(([x, y]) => `${x},${y}`));

    for (const district of districtTypes) {
      const chunk = [];
      const seed = shuffled.find(([x, y]) => remaining.has(`${x},${y}`));
      if (!seed) {
        console.warn(`No remaining cell found for district ${district}`);
        continue; // Skip this district
      }

      const [seedX, seedY] = seed;
      const visited = new Set();
      queue.push([seedX, seedY]);
      visited.add(`${seedX},${seedY}`);
      remaining.delete(`${seedX},${seedY}`);

      const maxCells = Math.floor(cells.length / districtTypes.length * (0.8 + Math.random() * 0.4));

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

  // Event listeners
  newVillageBtn.addEventListener("click", () => generateSettlement("Village", ctx));
  newTownBtn.addEventListener("click", () => generateSettlement("Town", ctx));
  newCityBtn.addEventListener("click", () => generateSettlement("City", ctx));

  generateSettlement("Village", ctx);
}

loadApp();
