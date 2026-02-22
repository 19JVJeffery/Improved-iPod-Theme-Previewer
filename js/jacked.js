import { extractFilteredImages } from "./unpack.js";
import { json as fallbackJson } from "./json.js";

const state = {
  config: fallbackJson,
  primary: { loaded: false, name: "none", map: new Map(), isStock: false, wallpaperColorAnchor: "Green" },
  compare: { loaded: false, name: "none", map: new Map(), isStock: false, wallpaperColorAnchor: "Green" },
  selectedColor: "Green",
  selectedStyle: "solid",
  currentPage: 0,
  compareMode: false,
  splitPercent: 50,
  showLabels: true,
  openedApp: null,
  isPagingDrag: false,
  totalPages: 2,
  themeMode: "system",
  activeSurroundFile: "",
  rotationDeg: 0,
};

const WALLPAPER_STYLES = ["solid", "striped", "dotted", "circles", "neutral"];
const NEUTRAL_DEFAULT_BY_COLOR = {
  Slate: { full_res: "229442216_0064", preview: "229442229_0064" },
  Silver: { full_res: "229442215_0064", preview: "229442228_0064" },
  Blue: { full_res: "229442320_0064", preview: "229442323_0064" },
  Green: { full_res: "229442320_0064", preview: "229442323_0064" },
  Yellow: { full_res: "229442216_0064", preview: "229442229_0064" },
  Pink: { full_res: "229442216_0064", preview: "229442229_0064" },
  Purple: { full_res: "229442216_0064", preview: "229442229_0064" },
  Red: { full_res: "229442216_0064", preview: "229442229_0064" },
  "Space Gray": { full_res: "229442216_0064", preview: "229442229_0064" },
  Gold: { full_res: "229442216_0064", preview: "229442229_0064" },
  "Pink (2015)": { full_res: "229442216_0064", preview: "229442229_0064" },
  "Blue (2015)": { full_res: "229442216_0064", preview: "229442229_0064" },
};

const palette = {
  Slate: "#4f5864",
  Silver: "#ecf0ef",
  Blue: "#45bdd8",
  Green: "#70c093",
  Yellow: "#d7dc48",
  Pink: "#f47578",
  Purple: "#cf91cc",
  Red: "#f33a3d",
  "Space Gray": "#606772",
  Gold: "#d4bf7a",
  "Pink (2015)": "#ef9eaf",
  "Blue (2015)": "#5ea5ee",
};

const $ = (id) => document.getElementById(id);

const el = {
  primaryFileInput: $("primaryFileInput"),
  compareFileInput: $("compareFileInput"),
  loadRemoteBtn: $("loadRemoteBtn"),
  firmwareSelect: $("firmwareSelect"),
  firmwareHint: $("firmwareHint"),
  colorChips: $("colorChips"),
  styleButtons: $("styleButtons"),
  compareToggle: $("compareToggle"),
  splitRange: $("splitRange"),
  showLabelsToggle: $("showLabelsToggle"),
  openSettingsBtn: $("openSettingsBtn"),
  toggleSidebarBtn: $("toggleSidebarBtn"),
  closeSettingsBtn: $("closeSettingsBtn"),
  settingsWindow: $("settingsWindow"),
  settingsWindowTitlebar: $("settingsWindowTitlebar"),
  themeSystemBtn: $("themeSystemBtn"),
  themeLightBtn: $("themeLightBtn"),
  themeDarkBtn: $("themeDarkBtn"),
  rotateLeftBtn: $("rotateLeftBtn"),
  rotateRightBtn: $("rotateRightBtn"),
  wallpaperBase: $("wallpaperBase"),
  wallpaperCompare: $("wallpaperCompare"),
  splitHandle: $("splitHandle"),
  screen: document.querySelector(".screen"),
  deviceArtHost: $("deviceArtHost"),
  statusTime: $("statusTime"),
  themeNamePrimary: $("themeNamePrimary"),
  themeNameCompare: $("themeNameCompare"),
  appsGrid: $("appsGrid"),
  appsGridCompare: $("appsGridCompare"),
  pageDots: $("pageDots"),
  appOverlay: $("appOverlay"),
  overlayTitle: $("overlayTitle"),
  overlayIcon: $("overlayIcon"),
  overlayMessage: $("overlayMessage"),
  openDiagnosticsBtn: $("openDiagnosticsBtn"),
  closeDiagnosticsBtn: $("closeDiagnosticsBtn"),
  diagnosticsWindow: $("diagnosticsWindow"),
  diagnosticsWindowTitlebar: $("diagnosticsWindowTitlebar"),
  assetSummary: $("assetSummary"),
  missingList: $("missingList"),
  toast: $("toast"),
};

const surroundSvgCache = new Map();

const supportedApps = new Set(["music", "photos", "videos", "podcasts", "radio"]);

init();

async function init() {
  initializeTheme();
  bindEvents();
  await loadConfig();
  await loadFirmwares();
  renderColorChips();
  renderStyleButtons();
  updateStatusTime();
  setInterval(updateStatusTime, 30_000);
  setupPageSwipe();
  setupOverlaySwipeToClose();
  setupDiagnosticsWindow();
  setupSettingsWindow();
  fitDeviceShell();
  window.addEventListener("resize", fitDeviceShell);
  renderApps();
  refreshAllViews();
}

function bindEvents() {
  el.primaryFileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    loadIPSWFromFile(file, "primary");
  });

  el.compareFileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    loadIPSWFromFile(file, "compare");
  });

  el.loadRemoteBtn.addEventListener("click", () => {
    const url = el.firmwareSelect.value;
    if (!url) {
      showToast("Pick a firmware source first.");
      return;
    }
    loadIPSWFromURL(url, "primary");
  });

  el.compareToggle.addEventListener("change", () => {
    state.compareMode = el.compareToggle.checked;
    refreshThemeLabels();
    refreshWallpaperLayers();
  });

  el.splitRange.addEventListener("input", () => {
    state.splitPercent = Number(el.splitRange.value);
    refreshWallpaperLayers();
  });

  el.showLabelsToggle.addEventListener("change", () => {
    state.showLabels = el.showLabelsToggle.checked;
    renderApps();
  });

  el.openDiagnosticsBtn?.addEventListener("click", openDiagnosticsWindow);
  el.closeDiagnosticsBtn?.addEventListener("click", closeDiagnosticsWindow);
  el.openSettingsBtn?.addEventListener("click", openSettingsWindow);
  el.toggleSidebarBtn?.addEventListener("click", toggleSidebar);
  el.closeSettingsBtn?.addEventListener("click", closeSettingsWindow);
  el.themeSystemBtn?.addEventListener("click", () => setThemeMode("system"));
  el.themeLightBtn?.addEventListener("click", () => setThemeMode("light"));
  el.themeDarkBtn?.addEventListener("click", () => setThemeMode("dark"));
  el.rotateLeftBtn?.addEventListener("click", () => rotateShell(-90));
  el.rotateRightBtn?.addEventListener("click", () => rotateShell(90));

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      setPage(Math.min(getMaxPageIndex(), state.currentPage + 1));
    } else if (event.key === "ArrowLeft") {
      setPage(Math.max(0, state.currentPage - 1));
    } else if (event.key.toLowerCase() === "c") {
      state.compareMode = !state.compareMode;
      el.compareToggle.checked = state.compareMode;
      refreshWallpaperLayers();
    } else if (event.key === "Escape") {
      closeAppOverlay();
    }
  });
}

async function loadConfig() {
  try {
    const response = await fetch("./assets/assets.json");
    if (response.ok) {
      const loaded = await response.json();
      state.config = normalizeWallpaperStyles(mergeConfigWithFallback(loaded, fallbackJson));
    }
  } catch (_error) {
    // fallback JSON is already loaded.
  }

  state.config = normalizeWallpaperStyles(state.config);

  if (!state.config.wallpapers_by_color[state.selectedColor]) {
    state.selectedColor = Object.keys(state.config.wallpapers_by_color)[0] || "Green";
  }
}

async function loadFirmwares() {
  const fallback = [{ name: "No remote list available", url: "" }];
  let firmwares = fallback;

  try {
    const response = await fetch("./assets/firmwares.json");
    if (response.ok) {
      firmwares = await response.json();
    }
  } catch (_error) {
    // keep fallback
  }

  el.firmwareSelect.innerHTML = "";
  for (const firmware of firmwares) {
    const option = document.createElement("option");
    option.value = firmware.url || "";
    option.textContent = firmware.author ? `${firmware.author} / ${firmware.name}` : firmware.name;
    el.firmwareSelect.append(option);
  }
}

async function loadIPSWFromFile(file, target) {
  try {
    showToast(`Extracting ${target} IPSW: ${file.name}`);
    const buffer = await file.arrayBuffer();
    const images = await extractFilteredImages(buffer, state.config);
    setImageMap(images, target, file.name);
    showToast(`${target} theme loaded (${images.length} assets).`);
  } catch (error) {
    showToast(`Failed to load IPSW: ${error.message}`);
  }
}

async function loadIPSWFromURL(url, target) {
  try {
    showToast("Downloading firmware. This can take a while.");
    let response;
    try {
      response = await fetch(url);
      if (!response.ok) throw new Error("Direct fetch failed");
    } catch (_e) {
      const proxy = `https://ipswproxy.zeehondie.net/?url=${encodeURIComponent(url)}`;
      response = await fetch(proxy);
      if (!response.ok) throw new Error("Proxy fetch failed");
    }
    const buffer = await response.arrayBuffer();
    const images = await extractFilteredImages(buffer, state.config);
    const optionText = el.firmwareSelect.selectedOptions?.[0]?.textContent?.trim() || "";
    const shortName = optionText || url.split("/").pop() || "remote.ipsw";
    setImageMap(images, target, shortName);
    showToast(`${target} remote firmware loaded.`);
  } catch (error) {
    showToast(`Remote load error: ${error.message}`);
  }
}

function setImageMap(images, target, name) {
  const map = new Map();
  for (const img of images) {
    const prefix = String(img.id);
    if (!map.has(prefix)) {
      map.set(prefix, img.dataURL);
    }
  }

  state[target] = {
    loaded: true,
    name,
    map,
    isStock: detectStockFirmware(name),
    wallpaperColorAnchor: state.selectedColor,
  };

  if (target === "primary") {
    state.currentPage = 0;
  }

  refreshAllViews();
}

function refreshAllViews() {
  refreshDeviceArt();
  refreshWallpaperLayers();
  refreshThemeLabels();
  renderStyleButtons();
  renderApps();
  renderDiagnostics();
}

function renderColorChips() {
  const colors = Object.keys(state.config.wallpapers_by_color || {});
  el.colorChips.innerHTML = "";

  for (const color of colors) {
    const button = document.createElement("button");
    button.className = `chip${color === state.selectedColor ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `<span class="chip-dot" style="background:${palette[color] || "#8790a0"}"></span><span>${color}</span>`;
    button.addEventListener("click", () => {
      state.selectedColor = color;
      refreshAllViews();
      renderColorChips();
    });
    el.colorChips.append(button);
  }
}

function renderStyleButtons() {
  if (!WALLPAPER_STYLES.includes(state.selectedStyle)) {
    state.selectedStyle = WALLPAPER_STYLES[0];
  }

  el.styleButtons.innerHTML = "";
  const wallpaperColor = getEffectiveWallpaperColor("primary");
  for (const style of WALLPAPER_STYLES) {
    const wallpaperEntry = getWallpaperEntry(wallpaperColor, style);
    const previewUrl = findImageById(wallpaperEntry?.preview || wallpaperEntry?.full_res, state.primary.map);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `style-btn${style === state.selectedStyle ? " active" : ""}`;
    button.title = style;
    button.setAttribute("aria-label", style);

    if (previewUrl) {
      const preview = document.createElement("img");
      preview.className = "style-thumb";
      preview.src = previewUrl;
      preview.alt = `${style} wallpaper preview`;
      button.append(preview);
    } else {
      const previewFallback = document.createElement("span");
      previewFallback.className = "style-thumb placeholder";
      button.append(previewFallback);
    }

    button.addEventListener("click", () => {
      state.selectedStyle = style;
      refreshWallpaperLayers();
      renderStyleButtons();
      renderDiagnostics();
    });
    el.styleButtons.append(button);
  }
}

function refreshDeviceArt() {
  // Use dedicated per-color surround SVGs from the specialized previewer assets.
  const surroundMap = {
    Red: "nano_single_red.svg",
    Pink: "nano_single_pink.svg",
    "Pink (2015)": "nano_single_pink2015.svg",
    Purple: "nano_single_purple.svg",
    Yellow: "nano_single_yellow.svg",
    Green: "nano_single_green.svg",
    Blue: "nano_single_blue.svg",
    "Blue (2015)": "nano_single_blue2015.svg",
    Slate: "nano_single_slate.svg",
    "Space Gray": "nano_single_spacegray.svg",
    Silver: "nano_single_silver.svg",
    Gold: "nano_single_gold.svg",
  };

  const surround = surroundMap[state.selectedColor] || "nano_single.svg";
  renderSurroundSvg(surround);
}

function refreshWallpaperLayers() {
  const idleScreen = !state.primary.loaded;
  el.screen?.classList.toggle("idle", idleScreen);

  const primaryColor = getEffectiveWallpaperColor("primary");
  const compareColor = getEffectiveWallpaperColor("compare");
  const primaryEntry = getWallpaperEntry(primaryColor, state.selectedStyle);
  const compareEntry = getWallpaperEntry(compareColor, state.selectedStyle);
  const baseUrl = findImageById(primaryEntry?.full_res, state.primary.map);
  const compareUrl = findImageById(compareEntry?.full_res, state.compare.map);

  if (baseUrl) {
    el.wallpaperBase.style.backgroundImage = `url(${baseUrl})`;
  } else if (idleScreen) {
    el.wallpaperBase.style.backgroundImage = "none";
  }

  if (compareUrl) {
    el.wallpaperCompare.style.backgroundImage = `url(${compareUrl})`;
  } else if (idleScreen) {
    el.wallpaperCompare.style.backgroundImage = "none";
  }

  const split = `${state.splitPercent}%`;
  const baseRightInset = `${Math.max(0, 100 - state.splitPercent)}%`;
  const compareVisible = state.compareMode && state.compare.loaded;
  el.wallpaperCompare.style.clipPath = `inset(0 0 0 ${split})`;
  el.wallpaperBase.style.clipPath = compareVisible ? `inset(0 ${baseRightInset} 0 0)` : "none";
  el.splitHandle.style.left = split;

  el.wallpaperCompare.style.opacity = compareVisible ? "1" : "0";
  el.splitHandle.style.opacity = compareVisible ? "1" : "0";
  el.appsGridCompare.style.opacity = compareVisible ? "1" : "0";
  el.appsGrid.style.clipPath = compareVisible ? `inset(0 ${baseRightInset} 0 0)` : "none";
  el.appsGridCompare.style.clipPath = `inset(0 0 0 ${split})`;

  if (state.compareMode && !state.compare.loaded) {
    showToast("Load a compare IPSW first.");
    state.compareMode = false;
    el.compareToggle.checked = false;
    el.wallpaperCompare.style.opacity = "0";
    el.wallpaperBase.style.clipPath = "none";
    el.splitHandle.style.opacity = "0";
    el.appsGrid.style.clipPath = "none";
    el.appsGridCompare.style.opacity = "0";
  }
}

function visibleApps() {
  const preferredOrder = ["music", "videos", "fitness", "podcasts", "photos", "radio", "settings", "clock"];
  const toKey = (name) => {
    const raw = String(name || "").toLowerCase().replace(/\s+/g, "");
    if (raw === "video") return "videos";
    if (raw === "photo") return "photos";
    if (raw === "podcast") return "podcasts";
    return raw;
  };

  return (state.config.app_icons || [])
    .filter((app) => !(app.notes || "").toLowerCase().includes("unused"))
    .sort((a, b) => {
      const aKey = toKey(a.name);
      const bKey = toKey(b.name);
      const ai = preferredOrder.indexOf(aKey);
      const bi = preferredOrder.indexOf(bKey);
      const aRank = ai === -1 ? 999 : ai;
      const bRank = bi === -1 ? 999 : bi;
      return aRank - bRank;
    });
}

function getMaxPageIndex() {
  return Math.max(0, state.totalPages - 1);
}

function setPage(page) {
  state.currentPage = Math.max(0, Math.min(getMaxPageIndex(), page));
  updatePageDots();
  positionPageWrappers(0, true);
}

function renderApps() {
  renderAppsInto(el.appsGrid, state.primary.map, false);
  renderAppsInto(el.appsGridCompare, state.compare.map, true);

  const apps = visibleApps();
  const perPage = 6;
  const pages = Math.max(1, Math.ceil(apps.length / perPage));
  state.totalPages = pages;
  state.currentPage = Math.min(state.currentPage, pages - 1);
  buildPageDots(pages);
  updatePageDots();
}

function renderAppsInto(gridEl, map, isCompareLayer) {
  if (!gridEl) return;
  const apps = visibleApps();
  const perPage = 6;
  const pages = Math.max(1, Math.ceil(apps.length / perPage));
  state.currentPage = Math.min(state.currentPage, pages - 1);
  const visiblePageCount = Math.max(2, pages);

  gridEl.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "apps-pages-wrapper";
  gridEl.append(wrapper);

  for (let pageIndex = 0; pageIndex < visiblePageCount; pageIndex += 1) {
    const pageEl = document.createElement("div");
    pageEl.className = "apps-page";
    const pageApps = apps.slice(pageIndex * perPage, (pageIndex + 1) * perPage);

    for (const app of pageApps) {
      const appNode = document.createElement("button");
      appNode.type = "button";
      appNode.className = `app${state.showLabels ? "" : " hide-label"}`;
      if (isCompareLayer) {
        appNode.tabIndex = -1;
        appNode.setAttribute("aria-hidden", "true");
      }

      const iconWrap = document.createElement("div");
      iconWrap.className = "app-icon-wrap";

      const img = document.createElement("img");
      img.alt = app.name;
      img.src = findImageById(app.id, map) || "";
      img.className = "app-icon-main";

      const pressShadowUrl = findImageById("229442200_0064", map);
      const pressShadow = document.createElement("img");
      pressShadow.className = "app-press-shadow";
      pressShadow.alt = "";
      if (pressShadowUrl) {
        pressShadow.src = pressShadowUrl;
      }

      const label = document.createElement("span");
      label.textContent = app.name;

      iconWrap.append(img);
      if (pressShadowUrl) {
        iconWrap.append(pressShadow);
      }

      appNode.append(iconWrap, label);
      if (!isCompareLayer) {
        appNode.addEventListener("mousedown", () => {
          if (!state.isPagingDrag) appNode.classList.add("pressed");
        });
        appNode.addEventListener("mouseup", () => appNode.classList.remove("pressed"));
        appNode.addEventListener("mouseleave", () => appNode.classList.remove("pressed"));
        appNode.addEventListener("touchstart", () => {
          if (!state.isPagingDrag) appNode.classList.add("pressed");
        });
        appNode.addEventListener("touchend", () => appNode.classList.remove("pressed"));
        appNode.addEventListener("touchcancel", () => appNode.classList.remove("pressed"));
        appNode.addEventListener("click", () => {
          if (state.isPagingDrag) return;
          openAppOverlay(app);
        });
      }
      pageEl.append(appNode);
    }

    wrapper.append(pageEl);
  }

  positionPageWrappers(0, false);
}

function openAppOverlay(app) {
  const key = app.name.toLowerCase().replace(/\s+/g, "");
  const alias = {
    video: "videos",
    photo: "photos",
    podcast: "podcasts",
  };
  const normalized = alias[key] || key;

  if (!supportedApps.has(normalized)) {
    showToast("No content mock is only available for media apps.");
    return;
  }
  const id = state.config.appContentPlaceholders?.[normalized];

  state.openedApp = app.name;
  el.overlayTitle.textContent = app.name;
  el.overlayIcon.src = findImageById(app.id, state.primary.map) || "";
  el.overlayMessage.textContent =
    normalized === "radio"
      ? "No Radio Signal. Plug in headphones for reception."
      : `No ${app.name}. Sync ${app.name.toLowerCase()} content with iTunes.`;

  if (id) {
    const placeholder = findImageById(id, state.primary.map);
    if (placeholder) {
      el.overlayIcon.src = placeholder;
    }
  }

  el.appOverlay.classList.remove("hidden");
}

function closeAppOverlay() {
  state.openedApp = null;
  el.appOverlay.style.transform = "translateX(0)";
  el.appOverlay.style.opacity = "1";
  el.appOverlay.classList.add("hidden");
}

function initializeTheme() {
  const saved = window.localStorage.getItem("previewer_theme_mode");
  const mode = saved || "system";
  setThemeMode(mode, false);
  if (window.matchMedia) {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", () => {
      if (state.themeMode === "system") setThemeMode("system", false);
    });
  }
}

function setThemeMode(mode, persist = true) {
  const valid = mode === "light" || mode === "dark" || mode === "system";
  state.themeMode = valid ? mode : "system";
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = state.themeMode === "system" ? (prefersDark ? "dark" : "light") : state.themeMode;
  document.body.setAttribute("data-theme", resolved);
  if (persist) window.localStorage.setItem("previewer_theme_mode", state.themeMode);
  updateThemeButtons();
}

function toggleSidebar() {
  document.body.classList.toggle("sidebar-collapsed");
  window.setTimeout(fitDeviceShell, 210);
}

function rotateShell(deltaDeg) {
  state.rotationDeg += deltaDeg;
  fitDeviceShell();
}

function updateThemeButtons() {
  const mapping = {
    system: el.themeSystemBtn,
    light: el.themeLightBtn,
    dark: el.themeDarkBtn,
  };
  for (const [name, button] of Object.entries(mapping)) {
    if (!button) continue;
    button.classList.toggle("active", state.themeMode === name);
  }
}

function setupPageSwipe() {
  const swipeTarget = el.screen;
  if (!swipeTarget) return;

  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let wheelAccumulator = 0;
  let wheelResetTimer = null;
  let wheelCooldownUntil = 0;

  const pointX = (event) => {
    if (event.touches && event.touches.length) return event.touches[0].clientX;
    if (event.changedTouches && event.changedTouches.length) return event.changedTouches[0].clientX;
    return event.clientX;
  };
  const pageWidth = () => Math.max(1, swipeTarget.clientWidth);

  const syncTranslateFromPage = () => {
    prevTranslate = -pageWidth() * state.currentPage;
    currentTranslate = prevTranslate;
  };
  const applyEdgeResistance = (dx) => {
    const atFirst = state.currentPage === 0 && dx > 0;
    const atLast = state.currentPage === getMaxPageIndex() && dx < 0;
    if (!atFirst && !atLast) return dx;
    const magnitude = Math.abs(dx);
    const damped = Math.sign(dx) * Math.pow(magnitude, 0.82) * 0.38;
    return damped;
  };
  const pulseEdgePressure = (direction) => {
    const nudge = direction === "left" ? -14 : 14;
    positionPageWrappers(nudge, true);
    window.setTimeout(() => {
      positionPageWrappers(0, true);
    }, 120);
  };

  const start = (event) => {
    if (state.openedApp) return;
    if (event.type.startsWith("touch") && event.cancelable) event.preventDefault();
    isDragging = true;
    startX = pointX(event);
    syncTranslateFromPage();
    state.isPagingDrag = false;
    positionPageWrappers(0, false);
  };

  const move = (event) => {
    if (!isDragging) return;
    const clientX = pointX(event);
    const dx = clientX - startX;
    if (Math.abs(dx) < 12) return;
    const resistedDx = applyEdgeResistance(dx);
    currentTranslate = prevTranslate + resistedDx;
    if (Math.abs(resistedDx) > 7) {
      state.isPagingDrag = true;
      if (event.type.startsWith("touch") && event.cancelable) event.preventDefault();
      document.querySelectorAll(".app.pressed").forEach((appNode) => appNode.classList.remove("pressed"));
    }
    positionPageWrappers(currentTranslate, false, true);
  };

  const end = (event) => {
    if (!isDragging) return;
    isDragging = false;
    const movedBy = pointX(event) - startX;
    const wasAtFirst = state.currentPage === 0;
    const wasAtLast = state.currentPage === getMaxPageIndex();
    if (movedBy < -50 && state.currentPage < getMaxPageIndex()) {
      state.currentPage += 1;
    }
    if (movedBy > 50 && state.currentPage > 0) {
      state.currentPage -= 1;
    }
    if (wasAtFirst && movedBy > 50) {
      pulseEdgePressure("right");
    }
    if (wasAtLast && movedBy < -50) {
      pulseEdgePressure("left");
    }
    syncTranslateFromPage();
    positionPageWrappers(0, true);
    updatePageDots();
    window.setTimeout(() => {
      state.isPagingDrag = false;
    }, 310);
  };

  swipeTarget.addEventListener("mousedown", start);
  swipeTarget.addEventListener("mousemove", move);
  swipeTarget.addEventListener("mouseup", end);
  swipeTarget.addEventListener("mouseleave", end);

  swipeTarget.addEventListener("touchstart", start, { passive: false });
  swipeTarget.addEventListener(
    "touchmove",
    move,
    { passive: false },
  );
  swipeTarget.addEventListener("touchend", end);
  swipeTarget.addEventListener("touchcancel", end);

  swipeTarget.addEventListener("dragstart", (event) => event.preventDefault());

  swipeTarget.addEventListener(
    "wheel",
    (event) => {
      if (state.openedApp) return;
      const now = Date.now();
      if (now < wheelCooldownUntil) {
        event.preventDefault();
        return;
      }

      const axisDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(axisDelta) < 2) return;
      event.preventDefault();

      wheelAccumulator += axisDelta;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAccumulator = 0;
      }, 130);

      if (wheelAccumulator > 70 && state.currentPage < getMaxPageIndex()) {
        state.currentPage += 1;
        wheelAccumulator = 0;
        wheelCooldownUntil = now + 280;
        setPage(state.currentPage);
      } else if (wheelAccumulator > 70 && state.currentPage >= getMaxPageIndex()) {
        wheelAccumulator = 0;
        wheelCooldownUntil = now + 220;
        pulseEdgePressure("left");
      } else if (wheelAccumulator < -70 && state.currentPage > 0) {
        state.currentPage -= 1;
        wheelAccumulator = 0;
        wheelCooldownUntil = now + 280;
        setPage(state.currentPage);
      } else if (wheelAccumulator < -70 && state.currentPage <= 0) {
        wheelAccumulator = 0;
        wheelCooldownUntil = now + 220;
        pulseEdgePressure("right");
      }
    },
    { passive: false },
  );
}

function setupOverlaySwipeToClose() {
  let isDragging = false;
  let startX = 0;
  let currentX = 0;

  const start = (clientX) => {
    if (!state.openedApp) return;
    isDragging = true;
    startX = clientX;
    currentX = 0;
  };

  const move = (clientX) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    if (dx <= 0) return;
    currentX = dx;
    el.appOverlay.style.transition = "none";
    el.appOverlay.style.transform = `translateX(${dx}px)`;
  };

  const end = () => {
    if (!isDragging) return;
    isDragging = false;
    el.appOverlay.style.transition = "transform 0.25s ease, opacity 0.25s ease";
    if (currentX > 100) {
      el.appOverlay.style.transform = "translateX(120%)";
      el.appOverlay.style.opacity = "0";
      window.setTimeout(closeAppOverlay, 240);
    } else {
      el.appOverlay.style.transform = "translateX(0)";
      el.appOverlay.style.opacity = "1";
    }
  };

  el.appOverlay.addEventListener("mousedown", (event) => start(event.clientX));
  el.appOverlay.addEventListener("mousemove", (event) => move(event.clientX));
  el.appOverlay.addEventListener("mouseup", end);
  el.appOverlay.addEventListener("mouseleave", end);

  el.appOverlay.addEventListener("touchstart", (event) => start(event.touches[0].clientX), { passive: true });
  el.appOverlay.addEventListener("touchmove", (event) => move(event.touches[0].clientX), { passive: true });
  el.appOverlay.addEventListener("touchend", end);
  el.appOverlay.addEventListener("touchcancel", end);
}

function updateStatusTime() {
  const now = new Date();
  const hh24 = now.getHours();
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ampm = hh24 >= 12 ? "PM" : "AM";
  const hh12 = hh24 % 12 || 12;
  el.statusTime.textContent = `${hh12}:${mm} ${ampm}`;
}

function fitDeviceShell() {
  const stage = document.querySelector(".preview-stage");
  const shell = document.getElementById("deviceShell");
  if (!stage || !shell) return;

  const availableW = stage.clientWidth - 20;
  const availableH = stage.clientHeight - 12;
  const baseW = 347.21649;
  const baseH = 659.10822;
  const normalized = (((state.rotationDeg % 360) + 360) % 360);
  const quarterTurns = Math.round(normalized / 90) % 4;
  const isSideways = quarterTurns % 2 === 1;
  const shellW = isSideways ? baseH : baseW;
  const shellH = isSideways ? baseW : baseH;
  const scale = Math.min(1, availableW / shellW, availableH / shellH);
  shell.style.setProperty("--shell-scale", String(Math.max(0.25, scale)));
  shell.style.setProperty("--shell-rotation", `${state.rotationDeg}deg`);
}

function positionPageWrappers(transformPx = 0, animate = true, absolute = false) {
  const baseWrapper = el.appsGrid?.querySelector(".apps-pages-wrapper");
  const compareWrapper = el.appsGridCompare?.querySelector(".apps-pages-wrapper");
  if (!baseWrapper || !compareWrapper || !el.screen) return;

  const screenWidth = Math.max(1, el.screen.clientWidth);
  const translate = absolute ? transformPx : -screenWidth * state.currentPage + transformPx;
  const transform = `translateX(${translate}px)`;

  baseWrapper.style.transition = animate ? "transform 0.3s ease" : "none";
  compareWrapper.style.transition = animate ? "transform 0.3s ease" : "none";
  baseWrapper.style.transform = transform;
  compareWrapper.style.transform = transform;
}

function buildPageDots(pages) {
  if (!el.pageDots) return;
  el.pageDots.innerHTML = "";
  for (let i = 0; i < pages; i += 1) {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.addEventListener("click", () => setPage(i));
    el.pageDots.append(dot);
  }
}

function updatePageDots() {
  if (!el.pageDots) return;
  Array.from(el.pageDots.children).forEach((dot, idx) => {
    dot.classList.toggle("active", idx === state.currentPage);
  });
}

function refreshThemeLabels() {
  if (!el.themeNamePrimary || !el.themeNameCompare) return;
  el.themeNamePrimary.textContent = state.primary.loaded ? `Theme: ${state.primary.name}` : "";
  const showCompare = state.compareMode && state.compare.loaded;
  el.themeNameCompare.textContent = showCompare ? `Compare: ${state.compare.name}` : "";
}

function renderDiagnostics() {
  if (!state.primary.loaded) {
    el.assetSummary.textContent = "Load an IPSW to inspect assets.";
    el.missingList.textContent = "";
    return;
  }

  const missing = computeMissingAssets(state.primary.map);
  el.assetSummary.textContent = `Primary: ${state.primary.name} | Missing IDs: ${missing.length}`;
  el.missingList.textContent = missing.length ? missing.join("\n") : "No missing assets for current preview set.";
}

function computeMissingAssets(map) {
  const needed = new Set();
  const wallpaperColor = getEffectiveWallpaperColor("primary");
  for (const style of WALLPAPER_STYLES) {
    const entry = getWallpaperEntry(wallpaperColor, style);
    if (entry?.full_res) needed.add(entry.full_res.trim());
    if (entry?.preview) needed.add(entry.preview.trim());
  }

  for (const app of visibleApps()) needed.add(String(app.id).trim());
  for (const placeholderId of Object.values(state.config.appContentPlaceholders || {})) {
    needed.add(String(placeholderId).trim());
  }

  needed.add("229442200_0064");

  const missing = [];
  for (const id of needed) {
    if (!findImageById(id, map)) missing.push(id);
  }

  missing.sort();
  return missing;
}

function findImageById(id, map) {
  if (!id || !map?.size) return "";
  const cleaned = String(id).trim();
  const prefix = cleaned.split("_")[0];
  if (prefix === "229442412" && map.has("229442312")) {
    return map.get("229442312") || "";
  }
  return map.get(prefix) || "";
}

let toastTimer = null;
function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.toast.classList.remove("show");
  }, 2200);
}

function openDiagnosticsWindow() {
  if (!el.diagnosticsWindow) return;
  el.diagnosticsWindow.classList.remove("hidden");
  el.diagnosticsWindow.setAttribute("aria-hidden", "false");
}

function closeDiagnosticsWindow() {
  if (!el.diagnosticsWindow) return;
  el.diagnosticsWindow.classList.add("hidden");
  el.diagnosticsWindow.setAttribute("aria-hidden", "true");
}

function setupDiagnosticsWindow() {
  if (!el.diagnosticsWindow || !el.diagnosticsWindowTitlebar) return;
  makeWindowDraggable(el.diagnosticsWindow, el.diagnosticsWindowTitlebar, "#closeDiagnosticsBtn");
}

function openSettingsWindow() {
  if (!el.settingsWindow) return;
  el.settingsWindow.classList.remove("hidden");
  el.settingsWindow.setAttribute("aria-hidden", "false");
}

function closeSettingsWindow() {
  if (!el.settingsWindow) return;
  el.settingsWindow.classList.add("hidden");
  el.settingsWindow.setAttribute("aria-hidden", "true");
}

function setupSettingsWindow() {
  if (!el.settingsWindow || !el.settingsWindowTitlebar) return;
  makeWindowDraggable(el.settingsWindow, el.settingsWindowTitlebar, "#closeSettingsBtn");
}

function makeWindowDraggable(windowEl, titlebarEl, closeSelector) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;

  const onMove = (event) => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const nextLeft = Math.max(6, Math.min(window.innerWidth - 120, originLeft + dx));
    const nextTop = Math.max(52, Math.min(window.innerHeight - 80, originTop + dy));
    windowEl.style.left = `${nextLeft}px`;
    windowEl.style.top = `${nextTop}px`;
  };

  const onUp = () => {
    dragging = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  titlebarEl.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    if (closeSelector && event.target.closest(closeSelector)) return;
    dragging = true;
    const rect = windowEl.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    originLeft = rect.left;
    originTop = rect.top;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });
}

async function renderSurroundSvg(fileName) {
  if (!el.deviceArtHost || !fileName) return;
  if (state.activeSurroundFile === fileName && el.deviceArtHost.querySelector("svg")) return;
  state.activeSurroundFile = fileName;

  let svgText = surroundSvgCache.get(fileName);
  if (!svgText) {
    const response = await fetch(`./assets/${fileName}`);
    if (!response.ok) return;
    svgText = await response.text();
    surroundSvgCache.set(fileName, svgText);
  }

  el.deviceArtHost.innerHTML = svgText;
  const svg = el.deviceArtHost.querySelector("svg");
  if (!svg) {
    el.deviceArtHost.innerHTML = `<img class="device-svg" src="./assets/${fileName}" alt="iPod surround">`;
    return;
  }
  svg.classList.add("device-svg");
  // Make the surround visual-only by default; only hardware controls get pointer events.
  svg.querySelectorAll("*").forEach((node) => {
    node.style.pointerEvents = "none";
  });
  bindSurroundHardware(svg);
}

function bindSurroundHardware(svg) {
  const rects = Array.from(svg.querySelectorAll("rect"));
  const paths = Array.from(svg.querySelectorAll("path"));
  const ns = "http://www.w3.org/2000/svg";

  // Home button: round path used in all color variants.
  const home =
    paths.find((p) => (p.getAttribute("d") || "").includes("a 38.932055,38.936905")) ||
    paths.find((p) => /a\s*38\./.test(p.getAttribute("d") || ""));

  // Physical side/top controls share width=13.2836 across variants.
  const thinRects = rects.filter((r) => {
    const w = Number.parseFloat(r.getAttribute("width") || "0");
    return Math.abs(w - 13.2836) < 0.05;
  });

  const power =
    thinRects.find((r) => /matrix\(\s*0\s*,\s*1\s*,\s*-1\s*,\s*0/i.test(r.getAttribute("transform") || "")) || null;

  const sideButtons = thinRects
    .filter((r) => r !== power)
    .sort((a, b) => Number.parseFloat(a.getAttribute("y") || "0") - Number.parseFloat(b.getAttribute("y") || "0"));

  const volumeUp = sideButtons[0] || null;
  const volumeDown = sideButtons[1] || null;
  const shouldBoost = state.selectedColor === "Slate" || state.selectedColor === "Space Gray";

  const bindPressHold = (hitNode, visualNode, pressClass, onRelease, extraVisualNodes = []) => {
    if (!hitNode || !visualNode) return;
    hitNode.setAttribute("data-hw-button", "1");
    hitNode.style.pointerEvents = "auto";
    const visuals = [visualNode, ...extraVisualNodes].filter(Boolean);
    visuals.forEach((node) => {
      if (node.hasAttribute("transform")) {
        node.setAttribute("data-hw-has-transform", "1");
      }
    });

    let active = false;
    let pointerId = null;
    const release = () => {
      if (!active) return;
      active = false;
      pointerId = null;
      visuals.forEach((node) => node.classList.remove("hw-pressed", pressClass));
      onRelease?.();
      hitNode.removeEventListener("lostpointercapture", release);
      hitNode.removeEventListener("pointerup", release);
      hitNode.removeEventListener("pointercancel", release);
      hitNode.removeEventListener("pointerleave", release);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };

    hitNode.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pointerId = event.pointerId;
      active = true;
      visuals.forEach((node) => node.classList.add("hw-pressed", pressClass));
      if (hitNode.setPointerCapture && Number.isInteger(pointerId)) {
        try {
          hitNode.setPointerCapture(pointerId);
        } catch (_error) {
          // Ignore capture errors on unsupported pointer types.
        }
      }
      hitNode.addEventListener("lostpointercapture", release);
      hitNode.addEventListener("pointerup", release);
      hitNode.addEventListener("pointercancel", release);
      hitNode.addEventListener("pointerleave", release);
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    });
  };

  const makeHitZoneRect = (bbox) => {
    const hit = document.createElementNS(ns, "rect");
    hit.setAttribute("x", String(bbox.x));
    hit.setAttribute("y", String(bbox.y));
    hit.setAttribute("width", String(bbox.width));
    hit.setAttribute("height", String(bbox.height));
    hit.setAttribute("fill", "#ffffff");
    hit.setAttribute("fill-opacity", "0.001");
    hit.setAttribute("pointer-events", "all");
    hit.style.pointerEvents = "all";
    return hit;
  };

  const addHintRect = (targetNode, className, inset = 1.4) => {
    if (!targetNode) return null;
    const bbox = targetNode.getBBox();
    const hint = document.createElementNS(ns, "rect");
    hint.setAttribute("x", String(bbox.x - inset));
    hint.setAttribute("y", String(bbox.y - inset));
    hint.setAttribute("width", String(bbox.width + inset * 2));
    hint.setAttribute("height", String(bbox.height + inset * 2));
    hint.setAttribute("rx", String(Math.max(1, Number.parseFloat(targetNode.getAttribute("rx") || "2"))));
    hint.setAttribute("ry", String(Math.max(1, Number.parseFloat(targetNode.getAttribute("ry") || "2"))));
    hint.setAttribute("class", className);
    if (shouldBoost) hint.classList.add("hw-boost");
    targetNode.parentNode?.insertBefore(hint, targetNode);
    return hint;
  };

  const addBoostIfNeeded = (node) => {
    if (!node || !shouldBoost) return;
    node.classList.add("hw-boost");
  };

  if (home) {
    addBoostIfNeeded(home);
    bindPressHold(home, home, "hw-press-home", () => {
      if (state.openedApp) closeAppOverlay();
    });
  }

  if (power) {
    const powerHint = addHintRect(power, "hw-volume-hint", 1.8);
    powerHint?.classList.add("hw-power-zone");
    addBoostIfNeeded(powerHint);
    const powerBox = power.getBBox();
    const powerHit = makeHitZoneRect({
      x: powerBox.x - 8,
      y: powerBox.y - 8,
      width: powerBox.width + 16,
      height: powerBox.height + 16,
    });
    power.parentNode?.appendChild(powerHit);
    if (powerHint?.parentNode) {
      powerHint.parentNode.appendChild(powerHint);
    }
    bindPressHold(powerHit, powerHint || power, "hw-press-power");
  }

  if (volumeUp) {
    addHintRect(volumeUp, "hw-volume-hint", 1.2);
    addBoostIfNeeded(volumeUp);
    bindPressHold(volumeUp, volumeUp, "hw-press-side");
  }

  if (volumeDown) {
    addHintRect(volumeDown, "hw-volume-hint", 1.2);
    addBoostIfNeeded(volumeDown);
    bindPressHold(volumeDown, volumeDown, "hw-press-side");
  }

  // The play/back side button is flush between volume up/down; create an explicit middle zone.
  if (volumeUp && volumeDown) {
    const upBox = volumeUp.getBBox();
    const downBox = volumeDown.getBBox();
    const gapTop = upBox.y + upBox.height;
    const gapHeight = Math.max(12, downBox.y - gapTop);
    const playZoneHeight = Math.min(42, gapHeight);
    const playY = gapTop + (gapHeight - playZoneHeight) / 2;

    const playHint = document.createElementNS(ns, "rect");
    playHint.setAttribute("x", String(upBox.x - 1.2));
    playHint.setAttribute("y", String(playY));
    playHint.setAttribute("width", String(upBox.width + 2.4));
    playHint.setAttribute("height", String(playZoneHeight));
    playHint.setAttribute("rx", "2.8");
    playHint.setAttribute("ry", "2.8");
    playHint.setAttribute("class", "hw-playpause-hint");
    if (shouldBoost) playHint.classList.add("hw-boost");
    volumeUp.parentNode?.appendChild(playHint);

    const playHit = makeHitZoneRect({
      x: upBox.x,
      y: playY,
      width: upBox.width,
      height: playZoneHeight,
    });
    volumeUp.parentNode?.appendChild(playHit);
    bindPressHold(playHit, playHint, "hw-press-side");
  }
}

function detectStockFirmware(name) {
  const n = String(name || "").toLowerCase();
  return n.includes("stock");
}

function getEffectiveWallpaperColor(target) {
  const data = state[target];
  if (!data?.loaded) return state.selectedColor;
  if (data.isStock) return state.selectedColor;
  return data.wallpaperColorAnchor || state.selectedColor;
}

function getWallpaperEntry(color, style) {
  const primary = state.config.wallpapers_by_color?.[color]?.[style];
  const backup = fallbackJson.wallpapers_by_color?.[color]?.[style];
  const solidPrimary = state.config.wallpapers_by_color?.[color]?.solid;
  const solidBackup = fallbackJson.wallpapers_by_color?.[color]?.solid;
  return primary || backup || solidPrimary || solidBackup || null;
}

function mergeConfigWithFallback(base, fallback) {
  const merged = {
    ...fallback,
    ...base,
    wallpapers_by_color: { ...(fallback.wallpapers_by_color || {}), ...(base.wallpapers_by_color || {}) },
  };

  for (const [color, fallbackStyles] of Object.entries(fallback.wallpapers_by_color || {})) {
    const baseStyles = merged.wallpapers_by_color[color] || {};
    merged.wallpapers_by_color[color] = { ...fallbackStyles, ...baseStyles };
  }

  return merged;
}

function normalizeWallpaperStyles(config) {
  const clone = {
    ...config,
    wallpapers_by_color: { ...(config.wallpapers_by_color || {}) },
  };

  for (const color of Object.keys(clone.wallpapers_by_color)) {
    const styles = { ...(clone.wallpapers_by_color[color] || {}) };
    const solid = styles.solid || fallbackJson.wallpapers_by_color?.[color]?.solid || null;
    const neutralDefault = NEUTRAL_DEFAULT_BY_COLOR[color] || solid;

    for (const style of WALLPAPER_STYLES) {
      if (!styles[style]) {
        if (style === "neutral" && neutralDefault) {
          styles[style] = { ...neutralDefault };
        } else if (solid) {
          styles[style] = { ...solid };
        }
      }
    }

    clone.wallpapers_by_color[color] = styles;
  }

  return clone;
}
