let images = [];
let sites = [];
let numSites = 100;
let canvasWidth = 1485;
let canvasHeight = 2100;
let currentSeed = 2; // Default seed
let voronoi; // D3 Voronoi diagram

function preload() {
  for (let i = 1; i <= 102; i++) {
    let filename = "images/" + nf(i, 3) + ".jpg";
    images.push(loadImage(filename));
  }
}

function setup() {
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("sketch-container");

  console.log("Images loaded:", images.length);
  console.log("Using random seed:", currentSeed);

  // Set the random seed for reproducible results
  randomSeed(currentSeed);

  generateSites();
  renderVoronoiCPU();

  noLoop();
}

function generateSites() {
  sites = [];
  for (let i = 0; i < numSites; i++) {
    sites.push({
      x: random(width),
      y: random(height),
      img: random(images),
      rotation: random(TWO_PI),
      scale: random(0.5, 2),
      offsetX: random(-100, 100),
      offsetY: random(-100, 100),
      greyLevel: random(0.5, 1.0), // Random grey multiplier for opacity effect
      RGBtint: [random(0.5, 1.5), random(0.8, 1.2), random(0.8, 1.2)], // Random RGB tint
      alpha: random(0.1, 0.3), // Site-based transparency - each clip has uniform alpha
    });
  }

  console.log("Generated", sites.length, "sites with seed:", currentSeed);

  // Create D3 Voronoi diagram for efficient site lookup
  if (typeof d3 !== "undefined" && d3.Delaunay) {
    console.log("Creating Voronoi diagram with D3...");
    try {
      let points = sites.map((site) => [site.x, site.y]);
      let delaunay = d3.Delaunay.from(points);
      voronoi = delaunay.voronoi([0, 0, width, height]);
      console.log("D3 Voronoi diagram created successfully!");
    } catch (e) {
      console.error("D3 Voronoi creation failed:", e);
      voronoi = null;
    }
  } else {
    console.error(
      "D3 Delaunay not available! Make sure to include: <script src='https://cdn.jsdelivr.net/npm/d3-delaunay@6'></script>"
    );
    console.log("Check that d3 object exists:", typeof d3);
    console.log("Check that d3.Delaunay exists:", typeof d3?.Delaunay);
    voronoi = null;
  }
}

function renderVoronoiCPU() {
  background(255);

  console.log("Starting CPU rendering...");
  let startTime = millis();

  // Use reasonable step size for good quality vs performance
  let step = 3;

  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < height; y += step) {
      let closestSite = findClosestSite(x, y);

      // Transform coordinates relative to site center
      let localX = x - closestSite.x;
      let localY = y - closestSite.y;

      // Apply rotation
      let cos_r = cos(closestSite.rotation);
      let sin_r = sin(closestSite.rotation);
      let rotatedX = localX * cos_r - localY * sin_r;
      let rotatedY = localX * sin_r + localY * cos_r;

      // Apply scale and offset
      let finalX = rotatedX / closestSite.scale + closestSite.offsetX;
      let finalY = rotatedY / closestSite.scale + closestSite.offsetY;

      // Wrap coordinates to create seamless tiling
      let imgX =
        ((finalX % closestSite.img.width) + closestSite.img.width) %
        closestSite.img.width;
      let imgY =
        ((finalY % closestSite.img.height) + closestSite.img.height) %
        closestSite.img.height; // Sample color from image
      let c = closestSite.img.get(floor(imgX), floor(imgY));

      // Create tint color based on site properties (converting to 0-255 range)
      let tintR = 255 * closestSite.greyLevel * closestSite.RGBtint[0];
      let tintG = 255 * closestSite.greyLevel * closestSite.RGBtint[1];
      let tintB = 255 * closestSite.greyLevel * closestSite.RGBtint[2];

      // Apply Photoshop-style multiply blend mode: (A * B) / 255
      let multipliedR = (red(c) * tintR) / 255;
      let multipliedG = (green(c) * tintG) / 255;
      let multipliedB = (blue(c) * tintB) / 255;

      // Draw pixel block with site-based uniform transparency
      fill(multipliedR, multipliedG, multipliedB, closestSite.alpha * 255);
      noStroke();
      rect(x, y, step, step);
    }
  }

  let endTime = millis();
  console.log("CPU rendering completed in", endTime - startTime, "ms");

  // Draw site centers
  drawSites();
}

function findClosestSite(x, y) {
  // Use D3 Voronoi for O(log n) lookup if available
  let index = voronoi.delaunay.find(x, y);
  return sites[index];
}

function drawSites() {
  fill(255, 100, 100);
  stroke(255);
  strokeWeight(2);
  for (let site of sites) {
    // circle(site.x, site.y, 10);
  }
}

function keyPressed() {
  if (key === "s" || key === "S") {
    save("voronoi_seed_" + currentSeed + "_" + millis() + ".png");
    console.log("Image saved with seed:", currentSeed);
  }
  if (key === "r" || key === "R") {
    console.log("Regenerating...");
    currentSeed = floor(random(1, 999999));
    randomSeed(currentSeed);
    generateSites();
    clear();
    renderVoronoiCPU();
  }
}
