// LabSimplifier — Laser Diffraction Simulation Controller
// =============================================================================
// Complete physics simulation of the Experiment 11:
// Determination of Wavelength of Diode Laser using Transmission Diffraction Grating.
//
// Features:
// - User-triggered step progression (Steps 1 to 5)
// - Realistic 2D animated top-view optical bench canvas
// - Wall projection screen with high-accuracy millimeter ruler & laser spots
// - Exact physics calculation using arcsin & tan with realistic noise
// - Robust reading recorder checking unique (N, D, n) tuples
// =============================================================================

// Polyfill for roundRect on CanvasRenderingContext2D if missing
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    if (typeof radii === "undefined") radii = 0;
    if (typeof radii === "number") radii = [radii, radii, radii, radii];
    const r = radii[0] || 0;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

class SimController {
  constructor() {
    this.benchCanvas = null;
    this.benchCtx = null;
    this.wallCanvas = null;
    this.wallCtx = null;

    // Simulation parameters
    this.N = 2500;            // lines / cm (choices: 2500, 3000, 4000)
    this.D = 150;             // distance to wall in cm (range: 100 - 300 cm)
    this.n = 1;               // diffraction order (choices: 1, 2)
    this.lambdaActual = 6.7e-5; // cm (670 nm diode laser wavelength)

    // Procedure step: 1 to 5 (after 5, controls are fully interactive)
    this.procedureStep = 1;
    this.maxProcedureSteps = 5;

    // Procedure step texts matching exact requirements
    this.stepDescriptions = [
      "Switch on the laser.",
      "Point the laser toward the grating.",
      "Place the grating normal to the laser beam.",
      "Observe the diffraction maxima on the screen.",
      "Measure D (grating to wall) and Yₙ (position of nth maximum)."
    ];

    // Readings collection
    this.readings = [];
    this.animId = null;
    this.time = 0;
    this.onUpdateCallback = null;
  }

  // Initialize canvases and event bindings
  init(options = {}) {
    this.benchCanvas = options.benchCanvas;
    this.wallCanvas = options.wallCanvas;
    this.onUpdateCallback = options.onUpdate || null;
    this.procedureStep = options.initialStep || 1;

    if (this.benchCanvas) {
      this.benchCtx = this.benchCanvas.getContext("2d");
    }
    if (this.wallCanvas) {
      this.wallCtx = this.wallCanvas.getContext("2d");
    }

    if (Array.isArray(options.existingReadings)) {
      this.readings = [...options.existingReadings];
    }

    this.resizeCanvases();
    this.play();
  }

  resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;

    if (this.benchCanvas) {
      const rect = this.benchCanvas.getBoundingClientRect();
      const w = rect.width || 800;
      const h = rect.height || 200;
      this.benchCanvas.width = w * dpr;
      this.benchCanvas.height = h * dpr;
      if (this.benchCtx) {
        this.benchCtx.resetTransform ? this.benchCtx.resetTransform() : this.benchCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.benchCtx.scale(dpr, dpr);
      }
    }

    if (this.wallCanvas) {
      const rect = this.wallCanvas.getBoundingClientRect();
      const w = rect.width || 800;
      const h = rect.height || 140;
      this.wallCanvas.width = w * dpr;
      this.wallCanvas.height = h * dpr;
      if (this.wallCtx) {
        this.wallCtx.resetTransform ? this.wallCtx.resetTransform() : this.wallCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.wallCtx.scale(dpr, dpr);
      }
    }
  }

  // Physics calculation with exact arcsin & tan + realistic noise
  computeYn(N, D, n) {
    const sinPhi = n * N * this.lambdaActual;
    if (sinPhi >= 1) {
      return null; // Order not formed (total internal reflection / past 90 degrees)
    }
    const tanPhi = sinPhi / Math.sqrt(1 - sinPhi * sinPhi);
    const YnNominal = D * tanPhi;

    // Small realistic measurement noise (±2%)
    const noise = 1 + (Math.random() - 0.5) * 0.04;
    const YnMeasured = Math.round(YnNominal * noise * 10) / 10;

    return {
      sinPhi: parseFloat(sinPhi.toFixed(4)),
      tanPhi: parseFloat(tanPhi.toFixed(4)),
      Yn: YnMeasured
    };
  }

  // Step advancement triggered by user
  nextStep() {
    if (this.procedureStep < this.maxProcedureSteps) {
      this.procedureStep++;
    } else {
      this.procedureStep = this.maxProcedureSteps + 1; // Interactive mode
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getState());
    }
  }

  setGrating(N) {
    this.N = Number(N);
    if (this.onUpdateCallback) this.onUpdateCallback(this.getState());
  }

  setDistance(D) {
    this.D = Number(D);
    if (this.onUpdateCallback) this.onUpdateCallback(this.getState());
  }

  setOrder(n) {
    this.n = Number(n);
    if (this.onUpdateCallback) this.onUpdateCallback(this.getState());
  }

  // Record a reading with duplicate check
  recordReading() {
    const currentPhysics = this.computeYn(this.N, this.D, this.n);
    if (!currentPhysics) {
      return { success: false, reason: "Order not formed with these parameters." };
    }

    // Check if this exact combination (N, D, n) already exists
    const duplicate = this.readings.some(
      r => r.N === this.N && r.D === this.D && r.n === this.n
    );

    if (duplicate) {
      return {
        success: false,
        reason: "Already recorded this combination. Please adjust N, D, or n."
      };
    }

    // Compute experimental lambda from recorded Yn
    // sin phi approx = Yn / sqrt(D^2 + Yn^2) or Yn / D
    const Yn = currentPhysics.Yn;
    const sinPhiExp = Yn / Math.sqrt(this.D * this.D + Yn * Yn);
    const lambdaExp = sinPhiExp / (this.N * this.n);
    const percentError = Math.abs((lambdaExp - this.lambdaActual) / this.lambdaActual) * 100;

    const record = {
      sNo: this.readings.length + 1,
      N: this.N,
      D: this.D,
      n: this.n,
      Yn: Yn,
      sinPhi: parseFloat(sinPhiExp.toFixed(4)),
      lambda: parseFloat((lambdaExp * 1e8).toFixed(2)), // in 10^-8 cm (Angstroms)
      lambdaCm: lambdaExp,
      percentError: parseFloat(percentError.toFixed(2))
    };

    this.readings.push(record);

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getState());
    }

    return {
      success: true,
      record: record,
      count: this.readings.length
    };
  }

  getReadings() {
    return this.readings;
  }

  getState() {
    const phys = this.computeYn(this.N, this.D, this.n);
    return {
      procedureStep: this.procedureStep,
      maxProcedureSteps: this.maxProcedureSteps,
      stepDescription: this.procedureStep <= this.maxProcedureSteps
        ? this.stepDescriptions[this.procedureStep - 1]
        : "Record your readings by varying N, D, or n.",
      isInteractive: this.procedureStep > this.maxProcedureSteps,
      N: this.N,
      D: this.D,
      n: this.n,
      physics: phys,
      readingsCount: this.readings.length,
      hasRequiredReadings: this.readings.length >= 3
    };
  }

  // Animation Loop
  play() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const render = () => {
      this.time += 0.03;
      this.draw();
      this.animId = requestAnimationFrame(render);
    };
    this.animId = requestAnimationFrame(render);
  }

  // Master draw routine
  draw() {
    this.drawBench();
    this.drawWall();
  }

  // 1. Top-View Optical Bench Canvas
  drawBench() {
    if (!this.benchCtx || !this.benchCanvas) return;
    const ctx = this.benchCtx;
    const rect = this.benchCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Bench background texture & grid
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, w, h);

    // Subtle table grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 20; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const centerY = h / 2;
    const laserX = 40;
    const laserWidth = 70;
    const laserHeight = 34;
    const gratingX = w * 0.42;
    const wallX = w - 30;

    // Draw Laser Source (Step 1+)
    ctx.save();
    // Mount block
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(laserX - 10, centerY - laserHeight / 2 - 4, laserWidth + 10, laserHeight + 8, 6);
    ctx.fill();
    ctx.stroke();

    // Laser body
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(laserX, centerY - laserHeight / 2, laserWidth - 8, laserHeight, 4);
    ctx.fill();

    // Laser Aperture
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(laserX + laserWidth - 8, centerY - 6, 8, 12);

    // Diode power indicator LED
    const isLaserOn = this.procedureStep >= 1;
    ctx.fillStyle = isLaserOn ? "#ef4444" : "#475569";
    ctx.beginPath();
    ctx.arc(laserX + 16, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    if (isLaserOn) {
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Label: "Diode Laser"
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Diode Laser", laserX + laserWidth / 2 - 4, centerY + laserHeight / 2 + 16);
    ctx.restore();

    // Draw Incident Laser Beam (Step 1: short beam, Step 2+: reaches grating or wall)
    if (isLaserOn) {
      ctx.save();
      const beamStartX = laserX + laserWidth;
      let beamEndX = wallX;

      if (this.procedureStep === 1) {
        beamEndX = beamStartX + 60; // Short glowing beam
      } else if (this.procedureStep === 2) {
        beamEndX = gratingX; // Reaches grating position
      } else {
        beamEndX = gratingX;
      }

      // Outer glow
      ctx.strokeStyle = "rgba(229, 56, 59, 0.4)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(beamStartX, centerY);
      ctx.lineTo(beamEndX, centerY);
      ctx.stroke();

      // Core beam
      ctx.strokeStyle = "#ff4d4f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(beamStartX, centerY);
      ctx.lineTo(beamEndX, centerY);
      ctx.stroke();

      // Laser emission pulse
      const pulseX = beamStartX + ((this.time * 80) % (beamEndX - beamStartX || 1));
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(pulseX, centerY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Diffraction Grating (Step 3+)
    if (this.procedureStep >= 3) {
      ctx.save();
      const gratingH = 80;

      // Grating Stand
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(gratingX - 12, centerY + gratingH / 2, 24, 16);

      // Grating Frame
      ctx.fillStyle = "#334155";
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(gratingX - 6, centerY - gratingH / 2, 12, gratingH, 3);
      ctx.fill();
      ctx.stroke();

      // Grating Slits (vertical lines indication)
      ctx.strokeStyle = "rgba(148, 163, 184, 0.7)";
      ctx.lineWidth = 1;
      for (let gy = centerY - gratingH / 2 + 8; gy <= centerY + gratingH / 2 - 8; gy += 6) {
        ctx.beginPath();
        ctx.moveTo(gratingX - 3, gy);
        ctx.lineTo(gratingX + 3, gy);
        ctx.stroke();
      }

      // Grating Label
      ctx.fillStyle = "#38bdf8";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Grating (${this.N} l/cm)`, gratingX, centerY - gratingH / 2 - 8);
      ctx.restore();
    }

    // Draw Diffracted Beams (Step 4+)
    if (this.procedureStep >= 4) {
      ctx.save();
      const phys = this.computeYn(this.N, this.D, 1);
      const phys2 = this.computeYn(this.N, this.D, 2);

      // Central Maximum (n = 0) Beam
      ctx.strokeStyle = "rgba(229, 56, 59, 0.4)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(gratingX, centerY);
      ctx.lineTo(wallX, centerY);
      ctx.stroke();

      ctx.strokeStyle = "#ff4d4f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gratingX, centerY);
      ctx.lineTo(wallX, centerY);
      ctx.stroke();

      // Diffracted orders scaling for canvas
      // Angle φ = arcsin(n N λ)
      const maxVisualAngle = 0.55; // visual spread limit in canvas radians
      const angle1 = Math.asin(Math.min(0.95, 1 * this.N * this.lambdaActual)) * (maxVisualAngle / 0.35);
      const spreadY1 = (wallX - gratingX) * Math.tan(angle1);

      // First Order Beams (n = +1 and n = -1)
      this.drawLaserRay(ctx, gratingX, centerY, wallX, centerY - spreadY1, 1);
      this.drawLaserRay(ctx, gratingX, centerY, wallX, centerY + spreadY1, 1);

      // Second Order Beams (n = +2 and n = -2) if formed
      if (phys2) {
        const angle2 = Math.asin(Math.min(0.95, 2 * this.N * this.lambdaActual)) * (maxVisualAngle / 0.35);
        const spreadY2 = (wallX - gratingX) * Math.tan(angle2);
        this.drawLaserRay(ctx, gratingX, centerY, wallX, centerY - spreadY2, 2);
        this.drawLaserRay(ctx, gratingX, centerY, wallX, centerY + spreadY2, 2);
      }
      ctx.restore();
    }

    // Draw Wall / Screen
    ctx.save();
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wallX, 15);
    ctx.lineTo(wallX, h - 15);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Wall / Screen", wallX, h - 4);
    ctx.restore();

    // Draw Measurement Annotations (Step 5+)
    if (this.procedureStep >= 5) {
      ctx.save();
      // Distance D Dimension line
      const dimY = h - 24;
      ctx.strokeStyle = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      ctx.lineWidth = 1.5;

      // Line with arrows
      ctx.beginPath();
      ctx.moveTo(gratingX, dimY);
      ctx.lineTo(wallX, dimY);
      ctx.stroke();

      // Left tick & right tick
      ctx.beginPath();
      ctx.moveTo(gratingX, dimY - 5);
      ctx.lineTo(gratingX, dimY + 5);
      ctx.moveTo(wallX, dimY - 5);
      ctx.lineTo(wallX, dimY + 5);
      ctx.stroke();

      // D label
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`D = ${this.D} cm`, (gratingX + wallX) / 2, dimY - 6);

      // Yn dimension indicator
      const phys = this.computeYn(this.N, this.D, this.n);
      if (phys) {
        const maxVisualAngle = 0.55;
        const angle = Math.asin(Math.min(0.95, this.n * this.N * this.lambdaActual)) * (maxVisualAngle / 0.35);
        const spreadY = (wallX - gratingX) * Math.tan(angle);

        ctx.strokeStyle = "#e5383b";
        ctx.fillStyle = "#e5383b";
        ctx.lineWidth = 1.5;

        // Vertical Yn indicator next to wall
        const ynX = wallX + 14;
        ctx.beginPath();
        ctx.moveTo(ynX, centerY);
        ctx.lineTo(ynX, centerY - spreadY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ynX - 4, centerY);
        ctx.lineTo(ynX + 4, centerY);
        ctx.moveTo(ynX - 4, centerY - spreadY);
        ctx.lineTo(ynX + 4, centerY - spreadY);
        ctx.stroke();

        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Yₙ = ${phys.Yn} cm`, ynX + 6, centerY - spreadY / 2);
      }
      ctx.restore();
    }
  }

  drawLaserRay(ctx, x1, y1, x2, y2, order) {
    ctx.save();
    const alpha = order === 1 ? 0.35 : 0.2;
    ctx.strokeStyle = `rgba(229, 56, 59, ${alpha})`;
    ctx.lineWidth = order === 1 ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = order === 1 ? "#ff6b6b" : "#ff8787";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Wall View Canvas (Ruler & Diffraction Spots)
  drawWall() {
    if (!this.wallCtx || !this.wallCanvas) return;
    const ctx = this.wallCtx;
    const rect = this.wallCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Dark screen background
    ctx.fillStyle = "#060911";
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const rulerY = h / 2 + 10;

    // Draw Measurement Scale / Ruler
    ctx.strokeStyle = "#475569";
    ctx.fillStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rulerY);
    ctx.lineTo(w - 20, rulerY);
    ctx.stroke();

    // Millimeter & Centimeter ticks
    const pxPerCm = (w * 0.4) / 50; // 50 cm fits in 40% of canvas
    ctx.font = "9px monospace";
    ctx.textAlign = "center";

    for (let cm = -60; cm <= 60; cm += 5) {
      const x = centerX + cm * pxPerCm;
      if (x < 15 || x > w - 15) continue;

      const isMajor = cm % 10 === 0;
      const tickH = isMajor ? 12 : 7;

      ctx.beginPath();
      ctx.moveTo(x, rulerY - tickH / 2);
      ctx.lineTo(x, rulerY + tickH / 2);
      ctx.stroke();

      if (isMajor) {
        ctx.fillText(Math.abs(cm).toString(), x, rulerY + 20);
      }
    }

    // If procedure step < 4, no diffraction spots visible on wall
    if (this.procedureStep < 4) {
      ctx.fillStyle = "#64748b";
      ctx.font = "italic 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        this.procedureStep === 1
          ? "Switch on laser & place grating to see diffraction spots"
          : "Align laser and grating along the optical bench",
        centerX,
        rulerY - 24
      );
      return;
    }

    // Compute physics for spots
    const phys1 = this.computeYn(this.N, this.D, 1);
    const phys2 = this.computeYn(this.N, this.D, 2);

    // 1. Central Spot (n = 0) - Most intense
    this.drawLaserSpot(ctx, centerX, rulerY, 14, 1.0, "n = 0 (Central)");

    // 2. First Order Spots (n = -1 and +1)
    if (phys1) {
      const offsetPx1 = phys1.Yn * pxPerCm;
      const isSelected = this.n === 1;
      this.drawLaserSpot(ctx, centerX + offsetPx1, rulerY, 10, 0.75, "n = +1", isSelected);
      this.drawLaserSpot(ctx, centerX - offsetPx1, rulerY, 10, 0.75, "n = -1", isSelected);

      // Dimension arrow on wall if n = 1 and step >= 5
      if (isSelected && this.procedureStep >= 5) {
        this.drawWallDimension(ctx, centerX, centerX + offsetPx1, rulerY - 28, `Y₁ = ${phys1.Yn} cm`);
      }
    }

    // 3. Second Order Spots (n = -2 and +2) if formed
    if (phys2) {
      const offsetPx2 = phys2.Yn * pxPerCm;
      const isSelected = this.n === 2;
      this.drawLaserSpot(ctx, centerX + offsetPx2, rulerY, 7, 0.5, "n = +2", isSelected);
      this.drawLaserSpot(ctx, centerX - offsetPx2, rulerY, 7, 0.5, "n = -2", isSelected);

      // Dimension arrow on wall if n = 2 and step >= 5
      if (isSelected && this.procedureStep >= 5) {
        this.drawWallDimension(ctx, centerX, centerX + offsetPx2, rulerY - 28, `Y₂ = ${phys2.Yn} cm`);
      }
    } else if (this.n === 2) {
      // Order not formed notice
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Order n = 2 not formed (sin φ ≥ 1)", centerX, rulerY - 32);
    }
  }

  drawLaserSpot(ctx, x, y, radius, intensity, label, isSelected = false) {
    ctx.save();

    // Outer glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
    grad.addColorStop(0, `rgba(255, 60, 60, ${intensity})`);
    grad.addColorStop(0.4, `rgba(229, 56, 59, ${intensity * 0.5})`);
    grad.addColorStop(1, "rgba(229, 56, 59, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Bright intense core
    ctx.fillStyle = `rgba(255, 230, 230, ${intensity})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Selection ring if active order
    if (isSelected) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Spot Label
    ctx.fillStyle = isSelected ? "#38bdf8" : "#94a3b8";
    ctx.font = isSelected ? "bold 10px sans-serif" : "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y - radius - 8);

    ctx.restore();
  }

  drawWallDimension(ctx, x1, x2, y, label) {
    ctx.save();
    ctx.strokeStyle = "#38bdf8";
    ctx.fillStyle = "#38bdf8";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    // Left & right ticks
    ctx.beginPath();
    ctx.moveTo(x1, y - 4);
    ctx.lineTo(x1, y + 4);
    ctx.moveTo(x2, y - 4);
    ctx.lineTo(x2, y + 4);
    ctx.stroke();

    // Dimension text
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, (x1 + x2) / 2, y - 6);
    ctx.restore();
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

// Export to window
if (typeof window !== "undefined") {
  window.SimController = SimController;
}
