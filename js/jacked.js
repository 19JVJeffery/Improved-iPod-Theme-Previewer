import { extractFilteredImages } from "./unpack.js";
import { json as fallbackJson } from "./json.js";

const state = {
  config: fallbackJson,
  primary: { loaded: false, name: "none", map: new Map(), isStock: false, wallpaperColorAnchor: "Green", firmwareProfile: "custom" },
  compare: { loaded: false, name: "none", map: new Map(), isStock: false, wallpaperColorAnchor: "Green", firmwareProfile: "custom" },
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
  language: "en",
  docsSidebarHidden: false,
  remoteAbortController: null,
  activeSurroundFile: "",
  rotationDeg: 0,
  catalogProfiles: null,
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
  Red: "#e31722",
  "Space Gray": "#606772",
  Gold: "#d4bf7a",
  "Pink (2015)": "#ef9eaf",
  "Blue (2015)": "#5ea5ee",
};

// Candidate ID routes cataloged from:
// - original n7g preview logic (`new.html`)
// - ThemeToolViewModel known UI IDs in iPod Nano Theming GUI
const UI_ID_POOL = {
  statusBar: ["229443248", "229443064"],
  musicTop: ["229443210"],
  musicArt: ["229443135"],
  musicControls: ["229443228"],
  placeholders: ["229443058", "229443059", "229443060", "229443061", "229443062", "229443063", "229443064", "229443391"],
  battery: [
    "229441884", "229441885", "229441886", "229441887", "229441888", "229441889",
    "229441890", "229441891", "229441892", "229441893", "229441894", "229441895",
    "229441896", "229441897", "229441898", "229441899", "229441900", "229441901",
    "229441902", "229441903", "229441904", "229441905", "229441906", "229441907",
  ],
};

const DEFAULT_APP_SCREEN_PROFILE_MAP = {
  stock_2012: {
    statusBar: [...UI_ID_POOL.statusBar],
    music: {
      top: [...UI_ID_POOL.musicTop],
      art: [...UI_ID_POOL.musicArt],
      controls: [...UI_ID_POOL.musicControls],
    },
    appPlaceholders: {
      music: ["229443059", "229443058", "229443060"],
      videos: ["229443061", "229443062", "229443063"],
      podcasts: ["229443062", "229443061", "229443063"],
      photos: ["229443060", "229443059", "229443061"],
      radio: ["229443064", "229443063", "229443062"],
      settings: ["229443064", "229443059", "229443060"],
      clock: ["229443064", "229443060", "229443059"],
      fitness: ["229443061", "229443060", "229443059"],
      voicerecorder: ["229443064", "229443062", "229443061"],
      itunesu: ["229443063", "229443062", "229443061"],
      audiobooks: ["229443058", "229443059", "229443060"],
    },
  },
  stock_2015: {
    statusBar: [...UI_ID_POOL.statusBar],
    music: {
      top: [...UI_ID_POOL.musicTop],
      art: [...UI_ID_POOL.musicArt],
      controls: [...UI_ID_POOL.musicControls],
    },
    appPlaceholders: {
      music: ["229443059", "229443058", "229443060"],
      videos: ["229443061", "229443062", "229443063"],
      podcasts: ["229443062", "229443061", "229443063"],
      photos: ["229443060", "229443059", "229443061"],
      radio: ["229443391", "229443064", "229443063"],
      settings: ["229443064", "229443059", "229443060"],
      clock: ["229443064", "229443060", "229443059"],
      fitness: ["229443061", "229443060", "229443059"],
      voicerecorder: ["229443064", "229443062", "229443061"],
      itunesu: ["229443063", "229443062", "229443061"],
      audiobooks: ["229443058", "229443059", "229443060"],
    },
  },
  custom: {
    statusBar: [...UI_ID_POOL.statusBar],
    music: {
      top: [...UI_ID_POOL.musicTop],
      art: [...UI_ID_POOL.musicArt],
      controls: [...UI_ID_POOL.musicControls],
    },
    appPlaceholders: {
      music: ["229443059", "229443058", "229443060"],
      videos: ["229443061", "229443062", "229443063"],
      podcasts: ["229443062", "229443061", "229443063"],
      photos: ["229443060", "229443059", "229443061"],
      radio: ["229443391", "229443064", "229443063"],
      settings: ["229443064", "229443059", "229443060"],
      clock: ["229443064", "229443060", "229443059"],
      fitness: ["229443061", "229443060", "229443059"],
      voicerecorder: ["229443064", "229443062", "229443061"],
      itunesu: ["229443063", "229443062", "229443061"],
      audiobooks: ["229443058", "229443059", "229443060"],
    },
  },
};
const CATALOG_STORAGE_KEY = "previewer_app_screen_catalog_v1";
const APP_PAGE_ORDER = ["music", "videos", "fitness", "podcasts", "photos", "radio", "clock", "settings", "audiobooks", "itunesu", "voicerecorder"];
// Interaction panes modeled from Apple iPod nano 7 user guide screenshots:
// - Music (p18), Videos (p27), Radio (p29), Fitness (p34),
// - Photos (p39), Clock (p43), Voice Memos (p46), Settings references (p12).
// Firmware skinning remains ID-driven via DEFAULT_APP_SCREEN_PROFILE_MAP.
const APP_MOCK_LIBRARY = {
  music: {
    subtitle: "Music",
    panes: [
      { label: "Library", rows: ["Songs", "Artists", "Albums", "Genres", "Compilations"], kind: "list" },
      {
        label: "Now Playing",
        rows: ["You Belong To You", "3 of 14", "Sufjan Wilkinson"],
        slider: { label: "Track Position", value: 58 },
        transport: true,
        kind: "player",
      },
      { label: "Playlists", rows: ["Top 25 Most Played", "Recently Added", "Workout Mix"], kind: "list" },
    ],
  },
  videos: {
    subtitle: "Videos",
    panes: [
      { label: "Library", rows: ["Movies", "TV Shows", "Rentals", "Music Videos"], kind: "list" },
      {
        label: "Playback",
        rows: ["Sample Movie", "Chapter 3", "HD"],
        slider: { label: "Track Position", value: 34 },
        transport: true,
        kind: "player",
      },
    ],
  },
  podcasts: {
    subtitle: "Podcasts",
    panes: [
      { label: "Unplayed", rows: ["Tech Weekly", "History Deep Dive", "Design Notes"], kind: "list" },
      { label: "Shows", rows: ["Subscribed", "Downloaded", "Saved Episodes"], kind: "list" },
    ],
  },
  photos: {
    subtitle: "Photos",
    panes: [
      { label: "Albums", rows: ["Camera Roll", "Favorites", "Events", "Faces"], kind: "list" },
      {
        label: "Viewer",
        rows: ["12 of 19"],
        slider: { label: "Photo Position", value: 64 },
        kind: "viewer",
      },
    ],
  },
  radio: {
    subtitle: "FM Radio",
    panes: [
      {
        label: "Live",
        rows: ["Station: 102.5", "Now: Summer Mix"],
        meter: true,
        slider: { label: "Radio Tuner", value: 53 },
        transport: true,
        kind: "radio",
      },
      { label: "Presets", rows: ["87.5", "90.1", "94.3", "102.5", "107.9"], kind: "list" },
    ],
  },
  settings: {
    subtitle: "Settings",
    panes: [
      {
        label: "General",
        rows: ["Brightness", "Wallpaper", "Date & Time", "Language", "Accessibility"],
        slider: { label: "Brightness", value: 72 },
        kind: "settings",
      },
      {
        label: "Music",
        rows: ["Sound Check", "EQ", "Volume Limit", "Audio Crossfade"],
        toggles: ["Shake to Shuffle", "Group Compilations"],
        kind: "settings",
      },
      {
        label: "About",
        rows: ["Capacity", "Version 1.1.2", "Serial Number"],
        kind: "list",
      },
    ],
  },
  clock: {
    subtitle: "Clocks",
    panes: [
      { label: "World Clock", rows: ["Cupertino", "London", "Tokyo"], clockFaces: true, kind: "clock" },
      { label: "Timer", rows: ["00:30:00", "Repeat: Off"], slider: { label: "Set Timer", value: 40 }, kind: "clock" },
      { label: "Stopwatch", rows: ["00:00:00.00"], transport: true, kind: "clock" },
    ],
  },
  fitness: {
    subtitle: "Fitness",
    panes: [
      { label: "Workouts", rows: ["Walk", "Run", "Nike + iPod", "Pedometer"], kind: "fitness" },
      { label: "History", rows: ["This Week", "This Month", "All Workouts"], kind: "list" },
      { label: "Goals", rows: ["Daily Step Goal", "PowerSong"], slider: { label: "Goal Progress", value: 62 }, kind: "list" },
    ],
  },
  voicerecorder: {
    subtitle: "Voice Memos",
    panes: [
      { label: "Record", rows: ["00:00", "March 26, 2012"], recordButton: true, slider: { label: "Input Level", value: 48 }, kind: "voice" },
      { label: "Memos", rows: ["Memo 01", "Memo 02", "Memo 03"], kind: "list" },
    ],
  },
  itunesu: {
    subtitle: "iTunes U",
    panes: [
      { label: "Courses", rows: ["Featured Courses", "My Courses", "Top Collections"], kind: "list" },
      { label: "Downloads", rows: ["Lecture 1", "Lecture 2", "Lecture 3"], kind: "list" },
    ],
  },
  audiobooks: {
    subtitle: "Audiobooks",
    panes: [
      { label: "Library", rows: ["Current Book", "Purchased", "Collections"], kind: "list" },
      { label: "Now Playing", rows: ["Chapter 12", "01:24:31"], slider: { label: "Book Position", value: 43 }, transport: true, kind: "player" },
    ],
  },
};

// Candidate scene assets found in stock 39A10023 firmware dump.
// These are intentionally candidates (not hard links) so custom themes still override by ID.
const APP_SCENE_BASE_CANDIDATES = {
  global: {
    background: ["229443254", "229443294", "229443251"],
    top: ["229443248", "229443210"],
    footer: ["229443289", "229443290", "229443228"],
  },
  music: {
    background: ["229443251", "229443294"],
    top: ["229443210", "229443248"],
    hero: ["229443135"],
    footer: ["229443228", "229443289"],
  },
  videos: {
    background: ["229443254", "229443294", "229443251"],
    hero: ["229443061", "229443063"],
    footer: ["229443228", "229443289", "229443290"],
  },
  podcasts: {
    background: ["229443254", "229443294"],
    hero: ["229443062", "229443063"],
    footer: ["229443289", "229443290"],
  },
  photos: {
    background: ["229443254", "229443294"],
    hero: ["229443060", "229443032"],
    footer: ["229443289", "229443290"],
  },
  radio: {
    background: ["229443294", "229443251", "229443254"],
    hero: ["229443391", "229443064", "229443071"],
    footer: ["229443296", "229443289", "229443228"],
  },
  settings: {
    background: ["229443254", "229443294"],
    hero: ["229443064"],
    footer: ["229443289", "229443290"],
  },
  clock: {
    background: ["229443254", "229443294"],
    hero: ["229443071", "229443098", "229443243", "229443244", "229443245", "229443246"],
    footer: ["229443289", "229443290"],
  },
  fitness: {
    background: ["229443296", "229443184", "229443186", "229443254"],
    hero: ["229443061", "229443172", "229443173", "229443212", "229443213"],
    footer: ["229443296", "229443289", "229443290"],
  },
  voicerecorder: {
    background: ["229443251", "229443294"],
    hero: ["229443064", "229443062"],
    footer: ["229443289", "229443290", "229443296"],
  },
  itunesu: {
    background: ["229443254", "229443294"],
    hero: ["229443063", "229443261", "229443262"],
    footer: ["229443289", "229443290"],
  },
  audiobooks: {
    background: ["229443254", "229443294"],
    hero: ["229443058", "229443263"],
    footer: ["229443289", "229443290", "229443228"],
  },
};

function defaultAppScreenTemplates(is2015 = false) {
  const radioHero = is2015 ? ["229443391", "229443064"] : ["229443064", "229443063"];
  return {
    music: {
      layout: "music_rich",
      top: ["229443210"],
      hero: ["229443135"],
      controls: ["229443228"],
      rows: ["229443059", "229443060", "229443061"],
    },
    videos: {
      layout: "list_media",
      hero: ["229443061"],
      rows: ["229443063", "229443062", "229443061"],
      footer: ["229443064"],
    },
    podcasts: {
      layout: "list_media",
      hero: ["229443062"],
      rows: ["229443063", "229443062", "229443061"],
      footer: ["229443064"],
    },
    photos: {
      layout: "gallery",
      hero: ["229443060"],
      tiles: ["229443060", "229443061", "229443062", "229443063"],
      footer: ["229443064"],
    },
    radio: {
      layout: "status_hero",
      hero: radioHero,
      rows: ["229443064", "229443063"],
      footer: ["229443064"],
    },
    settings: {
      layout: "list_settings",
      hero: ["229443064"],
      rows: ["229443059", "229443060", "229443061", "229443062"],
      footer: ["229443064"],
    },
    clock: {
      layout: "status_hero",
      hero: ["229443064", "229443060"],
      rows: ["229443064", "229443060"],
      footer: ["229443064"],
    },
    fitness: {
      layout: "status_hero",
      hero: ["229443061"],
      rows: ["229443061", "229443060", "229443059"],
      footer: ["229443064"],
    },
    voicerecorder: {
      layout: "status_hero",
      hero: ["229443064", "229443062"],
      rows: ["229443062", "229443061"],
      footer: ["229443064"],
    },
    itunesu: {
      layout: "list_media",
      hero: ["229443063"],
      rows: ["229443063", "229443062", "229443061"],
      footer: ["229443064"],
    },
    audiobooks: {
      layout: "list_media",
      hero: ["229443058"],
      rows: ["229443058", "229443059", "229443060"],
      footer: ["229443064"],
    },
  };
}

DEFAULT_APP_SCREEN_PROFILE_MAP.stock_2012.appScreens = defaultAppScreenTemplates(false);
DEFAULT_APP_SCREEN_PROFILE_MAP.stock_2015.appScreens = defaultAppScreenTemplates(true);
DEFAULT_APP_SCREEN_PROFILE_MAP.custom.appScreens = defaultAppScreenTemplates(true);

const $ = (id) => document.getElementById(id);

const el = {
  primaryFileInput: $("primaryFileInput"),
  compareFileInput: $("compareFileInput"),
  loadRemoteBtn: $("loadRemoteBtn"),
  remotePopover: $("remotePopover"),
  firmwareSelect: $("firmwareSelect"),
  languageSelect: $("languageSelect"),
  firmwareHint: $("firmwareHint"),
  appTitle: $("appTitle"),
  appSubtitle: $("appSubtitle"),
  loadThemeBtnText: $("loadThemeBtnText"),
  loadCompareBtnText: $("loadCompareBtnText"),
  unloadFirmwareBtn: $("unloadFirmwareBtn"),
  catalogImportInput: $("catalogImportInput"),
  importCatalogBtnText: $("importCatalogBtnText"),
  firmwareSourceLabel: $("firmwareSourceLabel"),
  ipodColorsTitle: $("ipodColorsTitle"),
  wallpapersTitle: $("wallpapersTitle"),
  jackedControlsTitle: $("jackedControlsTitle"),
  rotationLabel: $("rotationLabel"),
  compareModeLabel: $("compareModeLabel"),
  splitLabel: $("splitLabel"),
  showLabelsLabel: $("showLabelsLabel"),
  shortcutPagesLabel: $("shortcutPagesLabel"),
  shortcutCompareLabel: $("shortcutCompareLabel"),
  shortcutCloseLabel: $("shortcutCloseLabel"),
  assetDiagnosticsTitle: $("assetDiagnosticsTitle"),
  assetDiagnosticsDesc: $("assetDiagnosticsDesc"),
  diagnosticsWindowTitle: $("diagnosticsWindowTitle"),
  settingsWindowTitle: $("settingsWindowTitle"),
  appearanceTitle: $("appearanceTitle"),
  appearanceDesc: $("appearanceDesc"),
  languageTitle: $("languageTitle"),
  languageDesc: $("languageDesc"),
  docsWindowTitle: $("docsWindowTitle"),
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
  statusBatteryIcon: $("statusBatteryIcon"),
  themeNamePrimary: $("themeNamePrimary"),
  themeNameCompare: $("themeNameCompare"),
  appsGrid: $("appsGrid"),
  appsGridCompare: $("appsGridCompare"),
  pageDots: $("pageDots"),
  appOverlay: $("appOverlay"),
  overlayTitle: $("overlayTitle"),
  overlayContent: $("overlayContent"),
  openDiagnosticsBtn: $("openDiagnosticsBtn"),
  closeDiagnosticsBtn: $("closeDiagnosticsBtn"),
  diagnosticsWindow: $("diagnosticsWindow"),
  diagnosticsWindowTitlebar: $("diagnosticsWindowTitlebar"),
  openDocsBtn: $("openDocsBtn"),
  closeDocsBtn: $("closeDocsBtn"),
  docsWindow: $("docsWindow"),
  docsWindowTitlebar: $("docsWindowTitlebar"),
  toggleDocsSidebarBtn: $("toggleDocsSidebarBtn"),
  docsSidebar: $("docsSidebar"),
  docsTabBtn: $("docsTabBtn"),
  creditsTabBtn: $("creditsTabBtn"),
  docsContent: $("docsContent"),
  remoteProgress: $("remoteProgress"),
  remoteProgressTitle: $("remoteProgressTitle"),
  remoteProgressMeta: $("remoteProgressMeta"),
  remoteProgressFill: $("remoteProgressFill"),
  cancelRemoteProgressBtn: $("cancelRemoteProgressBtn"),
  assetSummary: $("assetSummary"),
  missingList: $("missingList"),
  toast: $("toast"),
};

const surroundSvgCache = new Map();
const docsCache = new Map();

const translations = {
  en: {
    sidebar: "☰ Sidebar",
    settings: "⚙︎ Settings",
    docs: "ⓘ Docs",
    title: "iPod Nano 7 Theme Previewer",
    subtitle: "Original n7g preview stack, upgraded with split compare and diagnostics.",
    loadTheme: "Load Theme IPSW",
    loadCompare: "Load Compare IPSW",
    unloadFirmware: "⏏ Unload",
    importCatalog: "Import ID Catalog",
    loadRemote: "Load Remote Firmware",
    firmwareSource: "Firmware Source",
    ipodColors: "iPod Colors",
    wallpapers: "Wallpapers",
    controls: "Extra Controls",
    rotation: "Rotation",
    compareMode: "Compare Mode",
    split: "Split",
    showLabels: "Show Labels",
    pages: "pages",
    compare: "compare",
    closeApp: "close app",
    assetDiag: "Asset Diagnostics",
    assetDiagDesc: "Open a draggable diagnostics window to inspect missing IDs.",
    open: "Open",
    settingsTitle: "Settings",
    appearance: "Appearance",
    appearanceDesc: "Choose how the previewer UI looks.",
    language: "Language",
    languageDesc: "Choose the app language.",
    docsTitle: "Documentation & Credits",
    docsTab: "Docs",
    creditsTab: "Credits",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
  },
  es: {
    sidebar: "☰ Barra lateral", settings: "⚙︎ Ajustes", docs: "ⓘ Docs", title: "iPod Nano 7 Theme Previewer",
    subtitle: "Vista previa n7g mejorada con comparación dividida y diagnósticos.", loadTheme: "Cargar IPSW de tema",
    loadCompare: "Cargar IPSW de comparación", loadRemote: "Cargar firmware remoto", firmwareSource: "Fuente de firmware",
    ipodColors: "Colores del iPod", wallpapers: "Fondos", controls: "Controles", rotation: "Rotación",
    compareMode: "Modo comparación", split: "División", showLabels: "Mostrar etiquetas", pages: "páginas",
    compare: "comparar", closeApp: "cerrar app", assetDiag: "Diagnóstico de recursos",
    assetDiagDesc: "Abrir una ventana movible para revisar IDs faltantes.", open: "Abrir", settingsTitle: "Ajustes",
    appearance: "Apariencia", appearanceDesc: "Elige cómo se ve la interfaz.", language: "Idioma",
    languageDesc: "Elige el idioma de la app.", docsTitle: "Documentación y créditos", docsTab: "Docs",
    creditsTab: "Créditos", themeSystem: "Sistema", themeLight: "Claro", themeDark: "Oscuro",
  },
  fr: { sidebar: "☰ Barre latérale", settings: "⚙︎ Réglages", docs: "ⓘ Docs", title: "iPod Nano 7 Theme Previewer",
    subtitle: "Pile n7g améliorée avec comparaison divisée et diagnostics.", loadTheme: "Charger IPSW thème",
    loadCompare: "Charger IPSW comparaison", loadRemote: "Charger firmware distant", firmwareSource: "Source firmware",
    ipodColors: "Couleurs iPod", wallpapers: "Fonds", controls: "Contrôles", rotation: "Rotation",
    compareMode: "Mode comparaison", split: "Séparation", showLabels: "Afficher les libellés", pages: "pages",
    compare: "comparer", closeApp: "fermer app", assetDiag: "Diagnostic des ressources",
    assetDiagDesc: "Ouvrir une fenêtre déplaçable pour inspecter les IDs manquants.", open: "Ouvrir", settingsTitle: "Réglages",
    appearance: "Apparence", appearanceDesc: "Choisissez l'apparence de l'interface.", language: "Langue",
    languageDesc: "Choisissez la langue de l'application.", docsTitle: "Documentation et crédits", docsTab: "Docs",
    creditsTab: "Crédits", themeSystem: "Système", themeLight: "Clair", themeDark: "Sombre", },
  de: { sidebar: "☰ Seitenleiste", settings: "⚙︎ Einstellungen", docs: "ⓘ Docs", title: "iPod Nano 7 Theme Previewer",
    subtitle: "n7g-Vorschau mit Split-Vergleich und Diagnose erweitert.", loadTheme: "Theme-IPSW laden",
    loadCompare: "Vergleichs-IPSW laden", loadRemote: "Remote-Firmware laden", firmwareSource: "Firmware-Quelle",
    ipodColors: "iPod-Farben", wallpapers: "Hintergründe", controls: "Steuerung", rotation: "Drehung",
    compareMode: "Vergleichsmodus", split: "Split", showLabels: "Beschriftungen anzeigen", pages: "Seiten",
    compare: "vergleichen", closeApp: "App schließen", assetDiag: "Asset-Diagnose",
    assetDiagDesc: "Öffne ein verschiebbares Fenster für fehlende IDs.", open: "Öffnen", settingsTitle: "Einstellungen",
    appearance: "Darstellung", appearanceDesc: "Wähle das Aussehen der UI.", language: "Sprache",
    languageDesc: "Wähle die Sprache der App.", docsTitle: "Dokumentation & Credits", docsTab: "Docs",
    creditsTab: "Credits", themeSystem: "System", themeLight: "Hell", themeDark: "Dunkel", },
  it: { sidebar: "☰ Barra laterale", settings: "⚙︎ Impostazioni", docs: "ⓘ Docs", title: "iPod Nano 7 Theme Previewer",
    subtitle: "Stack n7g migliorato con confronto split e diagnostica.", loadTheme: "Carica IPSW tema",
    loadCompare: "Carica IPSW confronto", loadRemote: "Carica firmware remoto", firmwareSource: "Sorgente firmware",
    ipodColors: "Colori iPod", wallpapers: "Sfondi", controls: "Controlli", rotation: "Rotazione",
    compareMode: "Modalità confronto", split: "Divisione", showLabels: "Mostra etichette", pages: "pagine",
    compare: "confronta", closeApp: "chiudi app", assetDiag: "Diagnostica risorse",
    assetDiagDesc: "Apri una finestra trascinabile per gli ID mancanti.", open: "Apri", settingsTitle: "Impostazioni",
    appearance: "Aspetto", appearanceDesc: "Scegli l'aspetto dell'interfaccia.", language: "Lingua",
    languageDesc: "Scegli la lingua dell'app.", docsTitle: "Documentazione e crediti", docsTab: "Docs",
    creditsTab: "Crediti", themeSystem: "Sistema", themeLight: "Chiaro", themeDark: "Scuro", },
  pt: { sidebar: "☰ Barra lateral", settings: "⚙︎ Configurações", docs: "ⓘ Docs", title: "iPod Nano 7 Theme Previewer",
    subtitle: "Preview n7g com comparação dividida e diagnósticos.", loadTheme: "Carregar IPSW de tema",
    loadCompare: "Carregar IPSW de comparação", loadRemote: "Carregar firmware remoto", firmwareSource: "Fonte de firmware",
    ipodColors: "Cores do iPod", wallpapers: "Papéis de parede", controls: "Controles", rotation: "Rotação",
    compareMode: "Modo de comparação", split: "Divisão", showLabels: "Mostrar rótulos", pages: "páginas",
    compare: "comparar", closeApp: "fechar app", assetDiag: "Diagnóstico de assets",
    assetDiagDesc: "Abra uma janela arrastável para IDs ausentes.", open: "Abrir", settingsTitle: "Configurações",
    appearance: "Aparência", appearanceDesc: "Escolha a aparência da interface.", language: "Idioma",
    languageDesc: "Escolha o idioma do app.", docsTitle: "Documentação e créditos", docsTab: "Docs",
    creditsTab: "Créditos", themeSystem: "Sistema", themeLight: "Claro", themeDark: "Escuro", },
  nl: { sidebar: "☰ Zijbalk", settings: "⚙︎ Instellingen", docs: "ⓘ Docs", title: "iPod Nano 7 Theme Previewer",
    subtitle: "n7g-preview uitgebreid met split-vergelijking en diagnostiek.", loadTheme: "Thema IPSW laden",
    loadCompare: "Vergelijkings-IPSW laden", loadRemote: "Externe firmware laden", firmwareSource: "Firmwarebron",
    ipodColors: "iPod-kleuren", wallpapers: "Achtergronden", controls: "Bediening", rotation: "Rotatie",
    compareMode: "Vergelijkingsmodus", split: "Split", showLabels: "Labels tonen", pages: "pagina's",
    compare: "vergelijk", closeApp: "app sluiten", assetDiag: "Asset-diagnose",
    assetDiagDesc: "Open een versleepbaar venster voor ontbrekende IDs.", open: "Openen", settingsTitle: "Instellingen",
    appearance: "Weergave", appearanceDesc: "Kies hoe de interface eruitziet.", language: "Taal",
    languageDesc: "Kies de taal van de app.", docsTitle: "Documentatie & credits", docsTab: "Docs",
    creditsTab: "Credits", themeSystem: "Systeem", themeLight: "Licht", themeDark: "Donker", },
  ja: { sidebar: "☰ サイドバー", settings: "⚙︎ 設定", docs: "ⓘ ドキュメント", title: "iPod Nano 7 Theme Previewer",
    subtitle: "n7gプレビューを分割比較と診断で拡張。", loadTheme: "テーマIPSWを読み込む",
    loadCompare: "比較IPSWを読み込む", loadRemote: "リモートファームを読み込む", firmwareSource: "ファームウェアソース",
    ipodColors: "iPodカラー", wallpapers: "壁紙", controls: "コントロール", rotation: "回転",
    compareMode: "比較モード", split: "分割", showLabels: "ラベル表示", pages: "ページ",
    compare: "比較", closeApp: "アプリを閉じる", assetDiag: "アセット診断",
    assetDiagDesc: "不足IDを確認するドラッグ可能ウィンドウを開きます。", open: "開く", settingsTitle: "設定",
    appearance: "外観", appearanceDesc: "UIの見た目を選択します。", language: "言語",
    languageDesc: "アプリの言語を選択します。", docsTitle: "ドキュメントとクレジット", docsTab: "Docs",
    creditsTab: "Credits", themeSystem: "システム", themeLight: "ライト", themeDark: "ダーク", },
  zh: { sidebar: "☰ 侧边栏", settings: "⚙︎ 设置", docs: "ⓘ 文档", title: "iPod Nano 7 Theme Previewer",
    subtitle: "基于 n7g 的预览器，增强了分屏对比与诊断。", loadTheme: "加载主题 IPSW",
    loadCompare: "加载对比 IPSW", loadRemote: "加载远程固件", firmwareSource: "固件来源",
    ipodColors: "iPod 颜色", wallpapers: "壁纸", controls: "控制", rotation: "旋转",
    compareMode: "对比模式", split: "分割", showLabels: "显示标签", pages: "页面",
    compare: "对比", closeApp: "关闭应用", assetDiag: "资源诊断",
    assetDiagDesc: "打开可拖动窗口以检查缺失 ID。", open: "打开", settingsTitle: "设置",
    appearance: "外观", appearanceDesc: "选择界面外观。", language: "语言",
    languageDesc: "选择应用语言。", docsTitle: "文档与致谢", docsTab: "文档",
    creditsTab: "致谢", themeSystem: "系统", themeLight: "浅色", themeDark: "深色", },
};

init();

async function init() {
  initializeTheme();
  initializeLanguage();
  initializeCatalogProfiles();
  bindEvents();
  await loadConfig();
  randomizeInitialColor();
  await loadFirmwares();
  renderColorChips();
  renderStyleButtons();
  updateStatusTime();
  setInterval(updateStatusTime, 30_000);
  setupPageSwipe();
  setupOverlaySwipeToClose();
  setupDiagnosticsWindow();
  setupSettingsWindow();
  setupDocsWindow();
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
  el.unloadFirmwareBtn?.addEventListener("click", unloadPrimaryFirmware);
  el.catalogImportInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importCatalogFile(file);
    } finally {
      event.target.value = "";
    }
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
  el.languageSelect?.addEventListener("change", () => {
    setLanguage(el.languageSelect.value || "en");
  });

  el.openDiagnosticsBtn?.addEventListener("click", openDiagnosticsWindow);
  el.closeDiagnosticsBtn?.addEventListener("click", closeDiagnosticsWindow);
  const bindDocsOpen = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (el.docsWindow?.classList.contains("hidden")) {
      openDocsWindow();
    } else {
      closeDocsWindow();
    }
  };
  el.openDocsBtn?.addEventListener("click", bindDocsOpen);
  el.closeDocsBtn?.addEventListener("click", closeDocsWindow);
  el.openSettingsBtn?.addEventListener("click", () => {
    if (el.settingsWindow?.classList.contains("hidden")) {
      openSettingsWindow();
    } else {
      closeSettingsWindow();
    }
  });
  el.toggleSidebarBtn?.addEventListener("click", toggleSidebar);
  el.closeSettingsBtn?.addEventListener("click", closeSettingsWindow);
  el.themeSystemBtn?.addEventListener("click", () => setThemeMode("system"));
  el.themeLightBtn?.addEventListener("click", () => setThemeMode("light"));
  el.themeDarkBtn?.addEventListener("click", () => setThemeMode("dark"));
  el.rotateLeftBtn?.addEventListener("click", () => rotateShell(-90));
  el.rotateRightBtn?.addEventListener("click", () => rotateShell(90));
  el.cancelRemoteProgressBtn?.addEventListener("click", () => {
    if (state.remoteAbortController) {
      state.remoteAbortController.abort();
    }
    hideRemoteProgress();
    showToast("Remote firmware download canceled.");
  });

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
    state.remoteAbortController = new AbortController();
    showRemoteProgress("Downloading remote firmware…", 0, "Connecting…");
    let response;
    try {
      response = await fetch(url, { signal: state.remoteAbortController.signal });
      if (!response.ok) throw new Error("Direct fetch failed");
    } catch (_e) {
      const proxy = `https://ipswproxy.zeehondie.net/?url=${encodeURIComponent(url)}`;
      response = await fetch(proxy, { signal: state.remoteAbortController.signal });
      if (!response.ok) throw new Error("Proxy fetch failed");
    }
    const buffer = await readResponseWithProgress(response, (ratio, loaded, total) => {
      if (Number.isFinite(ratio)) {
        const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
        const meta = total
          ? `${pct}% (${formatBytes(loaded)} / ${formatBytes(total)})`
          : `${pct}% (${formatBytes(loaded)})`;
        showRemoteProgress("Downloading remote firmware…", pct, meta);
      } else {
        showRemoteProgress("Downloading remote firmware…", 15, `${formatBytes(loaded)} downloaded`);
      }
    });
    hideRemoteProgress();
    showToast("Download complete. Extracting IPSW assets…");
    const images = await extractFilteredImages(buffer, state.config);
    const optionText = el.firmwareSelect.selectedOptions?.[0]?.textContent?.trim() || "";
    const shortName = optionText || url.split("/").pop() || "remote.ipsw";
    setImageMap(images, target, shortName);
    showToast(`${target} remote firmware loaded.`);
  } catch (error) {
    if (error?.name === "AbortError") {
      hideRemoteProgress();
      state.remoteAbortController = null;
      return;
    }
    hideRemoteProgress();
    showToast(`Remote load error: ${error.message}`);
  } finally {
    state.remoteAbortController = null;
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
    firmwareProfile: detectFirmwareProfile(name, map),
  };

  if (target === "primary") {
    state.currentPage = 0;
  }

  refreshAllViews();
}

function detectFirmwareProfile(name, map) {
  const lowerName = String(name || "").toLowerCase();
  const has = (idPrefix) => map.has(String(idPrefix));
  const hasRadio2015 = has("229443391");
  const hasMusicChrome = has("229443210") && has("229443135") && has("229443228");

  if (
    lowerName.includes("39a10023")
    || lowerName.includes("1.1.2")
    || lowerName.includes("2015")
    || hasRadio2015
  ) {
    return "stock_2015";
  }

  if (
    lowerName.includes("37a40005")
    || lowerName.includes("36b10147")
    || lowerName.includes("1.0.4")
    || lowerName.includes("1.2")
    || lowerName.includes("2012")
    || hasMusicChrome
  ) {
    return "stock_2012";
  }

  return "custom";
}

function refreshAllViews() {
  refreshDeviceArt();
  refreshWallpaperLayers();
  refreshStatusbarArtwork();
  refreshStatusIndicators();
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
  el.deviceArtHost?.classList.toggle("rich-red", state.selectedColor === "Red");
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

function refreshStatusbarArtwork() {
  if (!el.statusTime) return;
  const profile = getAppScreenProfile(state.primary.firmwareProfile || "custom");
  const statusBarAsset = resolveAssetFromCandidates(profile.statusBar, state.primary.map);
  const statusBarEl = el.statusTime.closest(".statusbar");
  if (!statusBarEl) return;
  if (statusBarAsset) {
    statusBarEl.style.backgroundImage = `url(${statusBarAsset})`;
    statusBarEl.style.backgroundSize = "100% 100%";
    statusBarEl.style.backgroundPosition = "center";
    statusBarEl.style.backgroundRepeat = "no-repeat";
    statusBarEl.classList.add("asset-backed");
  } else {
    statusBarEl.style.backgroundImage = "";
    statusBarEl.style.backgroundSize = "";
    statusBarEl.style.backgroundPosition = "";
    statusBarEl.style.backgroundRepeat = "";
    statusBarEl.classList.remove("asset-backed");
  }
}

function refreshStatusIndicators() {
  if (!el.statusBatteryIcon) return;
  const batteryAsset = resolveBatteryAsset(state.primary.map);
  if (batteryAsset) {
    el.statusBatteryIcon.style.backgroundImage = `url(${batteryAsset})`;
    el.statusBatteryIcon.classList.add("asset-backed");
  } else {
    el.statusBatteryIcon.style.backgroundImage = "";
    el.statusBatteryIcon.classList.remove("asset-backed");
  }
}

function resolveBatteryAsset(map) {
  const pool = UI_ID_POOL.battery || [];
  if (!pool.length || !map?.size) return "";
  const minuteBucket = Math.floor(Date.now() / 60000) % pool.length;
  const rotated = [...pool.slice(minuteBucket), ...pool.slice(0, minuteBucket)];
  return resolveAssetFromCandidates(rotated, map) || "";
}

function visibleApps() {
  const toKey = (name) => {
    const raw = String(name || "").toLowerCase().replace(/\s+/g, "");
    if (raw === "video") return "videos";
    if (raw === "photo") return "photos";
    if (raw === "podcast") return "podcasts";
    if (raw === "voicerecorder") return "voicerecorder";
    if (raw === "book") return "audiobooks";
    return raw;
  };

  return (state.config.app_icons || [])
    .sort((a, b) => {
      const aKey = toKey(a.name);
      const bKey = toKey(b.name);
      const ai = APP_PAGE_ORDER.indexOf(aKey);
      const bi = APP_PAGE_ORDER.indexOf(bKey);
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
  const normalized = normalizeAppKey(app.name);
  const profileKey = state.primary.firmwareProfile || "custom";
  const placeholder = resolveAppPlaceholderForProfile(normalized, profileKey, state.primary.map);

  state.openedApp = app.name;
  el.overlayTitle.textContent = app.name;
  if (el.overlayContent) {
    el.overlayContent.innerHTML = buildAppMockMarkup({
      appName: app.name,
      appKey: normalized,
      placeholderUrl: placeholder,
      firmwareProfileKey: profileKey,
    });
    bindOverlayMockInteractions();
  }
  el.appOverlay.classList.remove("hidden");
}

function closeAppOverlay() {
  state.openedApp = null;
  el.appOverlay.style.transform = "translateX(0)";
  el.appOverlay.style.opacity = "1";
  el.appOverlay.classList.add("hidden");
}

function bindOverlayMockInteractions() {
  if (!el.overlayContent) return;

  for (const row of el.overlayContent.querySelectorAll(".mock-row")) {
    row.addEventListener("click", () => {
      const pane = row.closest(".mock-pane");
      if (!pane) return;
      pane.querySelectorAll(".mock-row.active").forEach((sibling) => sibling.classList.remove("active"));
      row.classList.add("active");
    });
  }

  for (const button of el.overlayContent.querySelectorAll(".mock-segment-btn")) {
    button.addEventListener("click", () => {
      const parent = button.parentElement;
      if (!parent) return;
      parent.querySelectorAll(".mock-segment-btn.active").forEach((it) => it.classList.remove("active"));
      button.classList.add("active");

      const container = button.closest(".overlay-interactive");
      if (!container) return;
      const paneIndex = Number(button.getAttribute("data-pane-index") || "0");
      container.querySelectorAll(".mock-pane").forEach((paneNode) => {
        const matches = Number(paneNode.getAttribute("data-pane-index")) === paneIndex;
        paneNode.classList.toggle("active", matches);
      });
    });
  }

  for (const toggle of el.overlayContent.querySelectorAll(".mock-toggle, .mock-record")) {
    toggle.addEventListener("click", () => {
      const active = toggle.getAttribute("aria-pressed") === "true";
      toggle.setAttribute("aria-pressed", active ? "false" : "true");
      toggle.classList.toggle("active", !active);
    });
  }

  for (const slider of el.overlayContent.querySelectorAll(".mock-slider-track")) {
    slider.addEventListener("pointerdown", (event) => {
      const rect = slider.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
      const fill = slider.querySelector(".mock-slider-fill");
      if (fill) fill.style.width = `${Math.round(ratio * 100)}%`;
    });
  }

  for (const transportBtn of el.overlayContent.querySelectorAll(".mock-transport-btn")) {
    transportBtn.addEventListener("click", () => {
      if (transportBtn.classList.contains("play")) {
        transportBtn.classList.toggle("paused");
        transportBtn.setAttribute("aria-label", transportBtn.classList.contains("paused") ? "Pause" : "Play");
      }
    });
  }
}

function normalizeAppKey(name) {
  const raw = String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const alias = {
    video: "videos",
    photo: "photos",
    podcast: "podcasts",
    voicerecorder: "voicerecorder",
    itunesu: "itunesu",
    book: "audiobooks",
    audiobooks: "audiobooks",
  };
  return alias[raw] || raw;
}

function getAppScreenProfile(profileKey) {
  const profiles = state.catalogProfiles || DEFAULT_APP_SCREEN_PROFILE_MAP;
  return profiles[profileKey] || profiles.custom || DEFAULT_APP_SCREEN_PROFILE_MAP.custom;
}

function initializeCatalogProfiles() {
  state.catalogProfiles = cloneProfiles(DEFAULT_APP_SCREEN_PROFILE_MAP);
  const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const incoming = parsed?.profiles || parsed?.app_screen_profiles || parsed?.firmwareProfiles || parsed;
    if (incoming && typeof incoming === "object") {
      state.catalogProfiles = mergeCatalogProfiles(state.catalogProfiles, incoming);
    }
  } catch (_error) {
    window.localStorage.removeItem(CATALOG_STORAGE_KEY);
  }
}

async function importCatalogFile(file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch (_error) {
    showToast("Catalog import failed: invalid JSON.");
    return;
  }

  const incoming = parsed?.profiles || parsed?.app_screen_profiles || parsed?.firmwareProfiles || parsed;
  if (!incoming || typeof incoming !== "object") {
    showToast("Catalog import failed: missing profile map.");
    return;
  }

  state.catalogProfiles = mergeCatalogProfiles(state.catalogProfiles || DEFAULT_APP_SCREEN_PROFILE_MAP, incoming);
  window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify({ version: 1, profiles: state.catalogProfiles }));
  showToast(`Catalog imported: ${file.name}`);
  if (state.openedApp) {
    const app = visibleApps().find((it) => it.name === state.openedApp);
    if (app) openAppOverlay(app);
  }
}

function cloneProfiles(input) {
  return JSON.parse(JSON.stringify(input));
}

function normalizeAssetIdCandidate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const prefix = raw.split("_")[0].replace(/\D/g, "");
  return prefix || "";
}

function normalizeAssetList(values) {
  const source = Array.isArray(values) ? values : (values == null ? [] : [values]);
  const seen = new Set();
  const out = [];
  for (const value of source) {
    const id = normalizeAssetIdCandidate(value);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function mergeCatalogProfiles(baseProfiles, incomingProfiles) {
  const merged = cloneProfiles(baseProfiles || DEFAULT_APP_SCREEN_PROFILE_MAP);
  for (const [profileKey, profileValue] of Object.entries(incomingProfiles || {})) {
    if (!profileValue || typeof profileValue !== "object") continue;
    const current = merged[profileKey] || { statusBar: [], music: { top: [], art: [], controls: [] }, appPlaceholders: {}, appScreens: {} };
    const next = {
      statusBar: normalizeAssetList(profileValue.statusBar ?? current.statusBar),
      music: {
        top: normalizeAssetList(profileValue.music?.top ?? current.music?.top),
        art: normalizeAssetList(profileValue.music?.art ?? current.music?.art),
        controls: normalizeAssetList(profileValue.music?.controls ?? current.music?.controls),
      },
      appPlaceholders: { ...(current.appPlaceholders || {}) },
      appScreens: cloneProfiles(current.appScreens || {}),
    };

    const appMap = profileValue.appPlaceholders;
    if (appMap && typeof appMap === "object") {
      for (const [appKey, candidateIds] of Object.entries(appMap)) {
        const normalized = normalizeAssetList(candidateIds);
        if (normalized.length) next.appPlaceholders[appKey] = normalized;
      }
    }

    const incomingScreens = profileValue.appScreens;
    if (incomingScreens && typeof incomingScreens === "object") {
      for (const [appKey, screenConfig] of Object.entries(incomingScreens)) {
        if (!screenConfig || typeof screenConfig !== "object") continue;
        const currentScreen = next.appScreens[appKey] || {};
        const mergedScreen = {
          ...currentScreen,
          ...screenConfig,
        };
        if (screenConfig.layout) mergedScreen.layout = String(screenConfig.layout);
        if (screenConfig.top !== undefined) mergedScreen.top = normalizeAssetList(screenConfig.top);
        if (screenConfig.hero !== undefined) mergedScreen.hero = normalizeAssetList(screenConfig.hero);
        if (screenConfig.controls !== undefined) mergedScreen.controls = normalizeAssetList(screenConfig.controls);
        if (screenConfig.rows !== undefined) mergedScreen.rows = normalizeAssetList(screenConfig.rows);
        if (screenConfig.tiles !== undefined) mergedScreen.tiles = normalizeAssetList(screenConfig.tiles);
        if (screenConfig.footer !== undefined) mergedScreen.footer = normalizeAssetList(screenConfig.footer);
        next.appScreens[appKey] = mergedScreen;
      }
    }
    merged[profileKey] = next;
  }
  return merged;
}

function resolveAssetFromCandidates(candidates, map) {
  if (!Array.isArray(candidates)) return "";
  for (const candidate of candidates) {
    const image = findImageById(candidate, map);
    if (image) return image;
  }
  return "";
}

function resolveAppPlaceholderForProfile(appKey, profileKey, map) {
  const profile = getAppScreenProfile(profileKey);
  const route = profile.appPlaceholders?.[appKey];
  const fromRoute = resolveAssetFromCandidates(route, map);
  if (fromRoute) return fromRoute;

  const fromPool = resolveAssetFromCandidates(UI_ID_POOL.placeholders, map);
  if (fromPool) return fromPool;

  const configPlaceholders = state.config.appContentPlaceholders || {};
  const configCandidates = [
    appKey,
    appKey.replace(/s$/, ""),
    appKey === "itunesu" ? "itunesU" : "",
    appKey === "voicerecorder" ? "voiceRecorder" : "",
  ].filter(Boolean);
  for (const key of configCandidates) {
    const id = configPlaceholders[key];
    const image = findImageById(id, map);
    if (image) return image;
  }
  return "";
}

function resolveAppScreenAssets(profile, appKey, map) {
  const screen = profile.appScreens?.[appKey] || {};
  const norm = (arr) => normalizeAssetList(arr);
  return {
    layout: screen.layout || "status_hero",
    top: resolveAssetFromCandidates(screen.top, map),
    hero: resolveAssetFromCandidates(screen.hero, map),
    controls: resolveAssetFromCandidates(screen.controls, map),
    rows: norm(screen.rows).map((id) => findImageById(id, map)).filter(Boolean),
    tiles: norm(screen.tiles).map((id) => findImageById(id, map)).filter(Boolean),
    footer: resolveAssetFromCandidates(screen.footer, map),
  };
}

function imageOrFallback(url, className) {
  if (url) return `<img class="${className}" src="${url}" alt="">`;
  return `<div class="${className} fallback"></div>`;
}

function resolveSceneBaseArtwork({ appKey, screen, legacyHero, map }) {
  const globalScene = APP_SCENE_BASE_CANDIDATES.global || {};
  const appScene = APP_SCENE_BASE_CANDIDATES[appKey] || {};
  const background = resolveAssetFromCandidates(
    [...(appScene.background || []), ...(globalScene.background || [])],
    map,
  );
  const top = screen.top || resolveAssetFromCandidates(
    [...(appScene.top || []), ...(globalScene.top || [])],
    map,
  );
  const hero = screen.hero || resolveAssetFromCandidates(appScene.hero || [], map) || legacyHero;
  const footer = screen.controls
    || screen.footer
    || resolveAssetFromCandidates([...(appScene.footer || []), ...(globalScene.footer || [])], map);

  return { background, top, hero, footer };
}

function buildAppMockMarkup({ appName, appKey, placeholderUrl, firmwareProfileKey }) {
  const profile = getAppScreenProfile(firmwareProfileKey);
  const appTitle = escapeHtml(appName);
  const titleLabel = appTitle;
  const statusBarBg = resolveAssetFromCandidates(profile.statusBar, state.primary.map);
  const musicTopBg = resolveAssetFromCandidates(profile.music?.top, state.primary.map);
  const musicArt = resolveAssetFromCandidates(profile.music?.art, state.primary.map);
  const musicControls = resolveAssetFromCandidates(profile.music?.controls, state.primary.map);
  const screen = resolveAppScreenAssets(profile, appKey, state.primary.map);
  const legacyHero = placeholderUrl || resolveAppPlaceholderForProfile(appKey, firmwareProfileKey, state.primary.map);
  const sceneBase = resolveSceneBaseArtwork({ appKey, screen, legacyHero, map: state.primary.map });
  const canRenderRichMusic = appKey === "music" && musicTopBg && musicArt && musicControls;
  const interactiveMarkup = buildInteractiveAppMarkup(appKey, appName);

  if (canRenderRichMusic) {
    return `
      <div class="overlay-firmware-app">
        <div class="overlay-firmware-status"${statusBarBg ? ` style="background-image:url('${statusBarBg}')"` : ""}>
          <span class="overlay-firmware-status-title">${titleLabel}</span>
        </div>
        <div class="overlay-firmware-body scene-shell">
          <div class="overlay-music-rich">
            <div class="overlay-music-top" style="background-image:url('${musicTopBg}')"></div>
            <img class="overlay-music-art" src="${musicArt}" alt="${appTitle}">
            <div class="overlay-music-controls" style="background-image:url('${musicControls}')"></div>
          </div>
          ${interactiveMarkup}
        </div>
      </div>
    `;
  }

  return `
    <div class="overlay-firmware-app">
      <div class="overlay-firmware-status"${statusBarBg ? ` style="background-image:url('${statusBarBg}')"` : ""}>
        <span class="overlay-firmware-status-title">${titleLabel}</span>
      </div>
      <div class="overlay-firmware-body scene-shell">
        ${sceneBase.background ? `<img class="overlay-scene-bg" src="${sceneBase.background}" alt="">` : ""}
        ${sceneBase.top ? `<img class="overlay-scene-top" src="${sceneBase.top}" alt="">` : ""}
        ${sceneBase.hero ? `<img class="overlay-scene-hero" src="${sceneBase.hero}" alt="">` : ""}
        ${sceneBase.footer ? `<img class="overlay-scene-footer" src="${sceneBase.footer}" alt="">` : ""}
        ${interactiveMarkup}
      </div>
    </div>
  `;
}

function buildMockPaneMarkup(pane, paneIndex) {
  const allRows = Array.isArray(pane.rows) ? pane.rows : [];
  const kind = String(pane.kind || "list");
  let featureMarkup = "";
  let listRows = allRows;

  if (kind === "player") {
    featureMarkup = `
      <div class="mock-feature player">
        <p class="mock-feature-title">${escapeHtml(allRows[0] || "Now Playing")}</p>
        <p class="mock-feature-sub">${escapeHtml(allRows[2] || "")}</p>
        <p class="mock-feature-meta">${escapeHtml(allRows[1] || "")}</p>
      </div>
    `;
    listRows = [];
  } else if (kind === "fitness") {
    const tileA = escapeHtml(allRows[0] || "Walk");
    const tileB = escapeHtml(allRows[1] || "Run");
    featureMarkup = `
      <div class="mock-feature fitness">
        <button class="mock-fitness-tile" type="button">${tileA}</button>
        <button class="mock-fitness-tile" type="button">${tileB}</button>
      </div>
    `;
    listRows = allRows.slice(2);
  } else if (kind === "clock") {
    featureMarkup = `
      <div class="mock-feature clock">
        <div class="mock-clock-big">12:40</div>
      </div>
    `;
  } else if (kind === "voice") {
    featureMarkup = `
      <div class="mock-feature voice">
        <div class="mock-voice-big">${escapeHtml(allRows[0] || "00:00")}</div>
        <div class="mock-voice-date">${escapeHtml(allRows[1] || "")}</div>
      </div>
    `;
    listRows = [];
  } else if (kind === "viewer") {
    featureMarkup = `
      <div class="mock-feature viewer">
        <div class="mock-viewer-count">${escapeHtml(allRows[0] || "1 of 1")}</div>
      </div>
    `;
    listRows = [];
  } else if (kind === "radio") {
    featureMarkup = `
      <div class="mock-feature radio">
        <p class="mock-feature-title">${escapeHtml(allRows[0] || "Station")}</p>
        <p class="mock-feature-sub">${escapeHtml(allRows[1] || "")}</p>
      </div>
    `;
    listRows = [];
  }

  const rows = listRows
    .map((row, index) => `<button class="mock-row" data-row-index="${paneIndex}-${index}" type="button"><span>${escapeHtml(row)}</span></button>`)
    .join("");
  const toggles = (pane.toggles || [])
    .map((name) => `
      <button class="mock-toggle" type="button" aria-pressed="false">
        <span class="mock-toggle-label">${escapeHtml(name)}</span>
        <span class="mock-toggle-pill"><span class="mock-toggle-knob"></span></span>
      </button>
    `)
    .join("");
  const slider = pane.slider
    ? `
      <div class="mock-slider">
        <span class="mock-slider-label">${escapeHtml(pane.slider.label || "")}</span>
        <button class="mock-slider-track" type="button">
          <span class="mock-slider-fill" style="width:${Math.max(0, Math.min(100, Number(pane.slider.value) || 0))}%"></span>
        </button>
      </div>
    `
    : "";
  const meter = pane.meter
    ? `
      <div class="mock-radio-meter">
        <div class="mock-radio-bar"><span style="width:55%"></span></div>
        <div class="mock-radio-ticks"><span>87.5</span><span>99.9</span><span>108</span></div>
      </div>
    `
    : "";
  const recordButton = pane.recordButton
    ? `<button class="mock-record" type="button" aria-pressed="false"><span class="dot"></span> Record</button>`
    : "";
  const transport = pane.transport
    ? `
      <div class="mock-transport">
        <button class="mock-transport-btn prev" type="button" aria-label="Previous">|&lt;</button>
        <button class="mock-transport-btn play" type="button" aria-label="Play">&gt;</button>
        <button class="mock-transport-btn next" type="button" aria-label="Next">&gt;|</button>
      </div>
    `
    : "";
  const clockFaces = pane.clockFaces
    ? `
      <div class="mock-clock-faces">
        <span></span><span></span><span></span>
      </div>
    `
    : "";

  return `
    <div class="mock-pane kind-${escapeHtml(kind)}" data-pane-index="${paneIndex}">
      ${featureMarkup}
      ${rows ? `<div class="mock-list">${rows}</div>` : ""}
      ${toggles ? `<div class="mock-toggles">${toggles}</div>` : ""}
      ${slider}
      ${meter}
      ${transport}
      ${recordButton}
      ${clockFaces}
    </div>
  `;
}

function buildInteractiveAppMarkup(appKey, appName) {
  const mock = APP_MOCK_LIBRARY[appKey] || {
    subtitle: appName,
    panes: [{ label: appName, rows: ["Sync with iTunes to load content."], kind: "list" }],
  };
  const panes = Array.isArray(mock.panes) && mock.panes.length
    ? mock.panes
    : [{ label: appName, rows: ["Sync with iTunes to load content."], kind: "list" }];
  const tabs = panes
    .map((pane, index) => `
      <button
        class="mock-segment-btn${index === 0 ? " active" : ""}"
        data-pane-index="${index}"
        type="button"
      >${escapeHtml(pane.label || `Pane ${index + 1}`)}</button>
    `)
    .join("");
  const paneMarkup = panes.map((pane, index) => buildMockPaneMarkup(pane, index)).join("");

  return `
    <section class="overlay-interactive" data-app="${escapeHtml(appKey)}">
      <div class="mock-header">
        <p class="mock-subtitle">${escapeHtml(mock.subtitle || appName)}</p>
        ${tabs ? `<div class="mock-segmented">${tabs}</div>` : ""}
      </div>
      <div class="mock-panes" data-active-pane="0">
        <div class="mock-panes-track">
          ${paneMarkup}
        </div>
      </div>
    </section>
  `;
}

function setOverlayPane(container, nextIndex, animate = true) {
  if (!container) return;
  const panes = Array.from(container.querySelectorAll(".mock-pane"));
  const track = container.querySelector(".mock-panes-track");
  if (!panes.length || !track) return;
  const maxIndex = panes.length - 1;
  const safe = Math.max(0, Math.min(maxIndex, nextIndex));
  const width = Math.max(1, container.clientWidth);
  container.dataset.activePane = String(safe);
  track.style.transition = animate ? "transform 0.24s ease" : "none";
  track.style.transform = `translateX(${-safe * width}px)`;
  panes.forEach((pane, idx) => pane.classList.toggle("active", idx === safe));
  const root = container.closest(".overlay-interactive");
  if (root) {
    root.querySelectorAll(".mock-segment-btn").forEach((tab) => {
      const idx = Number(tab.getAttribute("data-pane-index") || "0");
      tab.classList.toggle("active", idx === safe);
    });
  }
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

function initializeLanguage() {
  const saved = window.localStorage.getItem("previewer_language") || "en";
  setLanguage(saved, false);
}

function setLanguage(language, persist = true) {
  const lang = translations[language] ? language : "en";
  state.language = lang;
  if (el.languageSelect) el.languageSelect.value = lang;
  if (persist) window.localStorage.setItem("previewer_language", lang);
  applyTranslations();
}

function applyTranslations() {
  const t = translations[state.language] || translations.en;
  if (el.toggleSidebarBtn) el.toggleSidebarBtn.textContent = t.sidebar;
  if (el.openSettingsBtn) el.openSettingsBtn.textContent = t.settings;
  if (el.openDocsBtn) {
    el.openDocsBtn.textContent = t.docs;
    el.openDocsBtn.setAttribute("data-tip", t.docsTitle);
  }
  if (el.appTitle) el.appTitle.textContent = t.title;
  if (el.appSubtitle) el.appSubtitle.textContent = t.subtitle;
  if (el.loadThemeBtnText) el.loadThemeBtnText.textContent = t.loadTheme;
  if (el.loadCompareBtnText) el.loadCompareBtnText.textContent = t.loadCompare;
  if (el.unloadFirmwareBtn) {
    el.unloadFirmwareBtn.textContent = t.unloadFirmware || "⏏ Unload";
    el.unloadFirmwareBtn.setAttribute("data-tip", t.unloadFirmware || "Unload Firmware");
  }
  if (el.importCatalogBtnText) el.importCatalogBtnText.textContent = t.importCatalog || "Import ID Catalog";
  if (el.loadRemoteBtn) el.loadRemoteBtn.textContent = t.loadRemote;
  if (el.firmwareSourceLabel) el.firmwareSourceLabel.textContent = t.firmwareSource;
  if (el.ipodColorsTitle) el.ipodColorsTitle.textContent = t.ipodColors;
  if (el.wallpapersTitle) el.wallpapersTitle.textContent = t.wallpapers;
  if (el.jackedControlsTitle) el.jackedControlsTitle.textContent = t.controls;
  if (el.rotationLabel) el.rotationLabel.textContent = t.rotation;
  if (el.compareModeLabel) el.compareModeLabel.textContent = t.compareMode;
  if (el.splitLabel) el.splitLabel.textContent = t.split;
  if (el.showLabelsLabel) el.showLabelsLabel.textContent = t.showLabels;
  if (el.shortcutPagesLabel) el.shortcutPagesLabel.textContent = t.pages;
  if (el.shortcutCompareLabel) el.shortcutCompareLabel.textContent = t.compare;
  if (el.shortcutCloseLabel) el.shortcutCloseLabel.textContent = t.closeApp;
  if (el.assetDiagnosticsTitle) el.assetDiagnosticsTitle.textContent = t.assetDiag;
  if (el.assetDiagnosticsDesc) el.assetDiagnosticsDesc.textContent = t.assetDiagDesc;
  if (el.openDiagnosticsBtn) el.openDiagnosticsBtn.textContent = t.open;
  if (el.diagnosticsWindowTitle) el.diagnosticsWindowTitle.textContent = t.assetDiag;
  if (el.settingsWindowTitle) el.settingsWindowTitle.textContent = t.settingsTitle;
  if (el.appearanceTitle) el.appearanceTitle.textContent = t.appearance;
  if (el.appearanceDesc) el.appearanceDesc.textContent = t.appearanceDesc;
  if (el.languageTitle) el.languageTitle.textContent = t.language;
  if (el.languageDesc) el.languageDesc.textContent = t.languageDesc;
  if (el.docsWindowTitle) el.docsWindowTitle.textContent = t.docsTitle;
  if (el.docsTabBtn) el.docsTabBtn.textContent = t.docsTab;
  if (el.creditsTabBtn) el.creditsTabBtn.textContent = t.creditsTab;
  if (el.themeSystemBtn) el.themeSystemBtn.textContent = t.themeSystem;
  if (el.themeLightBtn) el.themeLightBtn.textContent = t.themeLight;
  if (el.themeDarkBtn) el.themeDarkBtn.textContent = t.themeDark;
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
  refreshStatusIndicators();
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

function randomizeInitialColor() {
  const colors = Object.keys(state.config.wallpapers_by_color || {});
  if (!colors.length) return;
  const idx = Math.floor(Math.random() * colors.length);
  state.selectedColor = colors[idx];
}

function unloadPrimaryFirmware() {
  if (!state.primary.loaded) {
    showToast("No loaded primary firmware.");
    return;
  }
  state.primary = {
    loaded: false,
    name: "none",
    map: new Map(),
    isStock: false,
    wallpaperColorAnchor: state.selectedColor,
    firmwareProfile: "custom",
  };
  state.compareMode = false;
  if (el.compareToggle) el.compareToggle.checked = false;
  state.currentPage = 0;
  closeAppOverlay();
  refreshAllViews();
  showToast("Primary firmware unloaded.");
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

  const activeProfile = getAppScreenProfile(state.primary.firmwareProfile || "custom");
  for (const id of normalizeAssetList(activeProfile.statusBar)) needed.add(id);
  for (const id of normalizeAssetList(activeProfile.music?.top)) needed.add(id);
  for (const id of normalizeAssetList(activeProfile.music?.art)) needed.add(id);
  for (const id of normalizeAssetList(activeProfile.music?.controls)) needed.add(id);
  for (const id of normalizeAssetList(UI_ID_POOL.battery)) needed.add(id);

  for (const screen of Object.values(activeProfile.appScreens || {})) {
    if (!screen || typeof screen !== "object") continue;
    for (const id of normalizeAssetList(screen.top)) needed.add(id);
    for (const id of normalizeAssetList(screen.hero)) needed.add(id);
    for (const id of normalizeAssetList(screen.controls)) needed.add(id);
    for (const id of normalizeAssetList(screen.rows)) needed.add(id);
    for (const id of normalizeAssetList(screen.tiles)) needed.add(id);
    for (const id of normalizeAssetList(screen.footer)) needed.add(id);
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

function showRemoteProgress(title, percent, meta) {
  if (!el.remoteProgress) return;
  el.remoteProgress.classList.remove("hidden");
  if (el.remoteProgressTitle) el.remoteProgressTitle.textContent = title;
  if (el.remoteProgressMeta) el.remoteProgressMeta.textContent = meta || "";
  if (el.remoteProgressFill) {
    const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
    el.remoteProgressFill.style.width = `${safePercent}%`;
  }
}

function hideRemoteProgress() {
  if (!el.remoteProgress) return;
  el.remoteProgress.classList.add("hidden");
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function readResponseWithProgress(response, onProgress) {
  const total = Number(response.headers.get("content-length") || "0");
  if (!response.body || typeof response.body.getReader !== "function") {
    const fallback = await response.arrayBuffer();
    onProgress?.(1, fallback.byteLength, total || fallback.byteLength);
    return fallback;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    loaded += value.byteLength;
    const ratio = total > 0 ? loaded / total : Number.NaN;
    onProgress?.(ratio, loaded, total);
  }

  const joined = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  onProgress?.(1, loaded, total || loaded);
  return joined.buffer;
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

function openDocsWindow() {
  if (!el.docsWindow) return;
  el.docsWindow.classList.remove("hidden");
  el.docsWindow.setAttribute("aria-hidden", "false");
  setDocsTab("docs");
}

function closeDocsWindow() {
  if (!el.docsWindow) return;
  el.docsWindow.classList.add("hidden");
  el.docsWindow.setAttribute("aria-hidden", "true");
}

function setupDocsWindow() {
  if (!el.docsWindow || !el.docsWindowTitlebar) return;
  makeWindowDraggable(el.docsWindow, el.docsWindowTitlebar, "#closeDocsBtn");
  el.docsTabBtn?.addEventListener("click", () => setDocsTab("docs"));
  el.creditsTabBtn?.addEventListener("click", () => setDocsTab("credits"));
  el.toggleDocsSidebarBtn?.addEventListener("click", toggleDocsSidebar);
  state.docsSidebarHidden = window.localStorage.getItem("previewer_docs_sidebar_hidden") === "1";
  applyDocsSidebarState();
}

function setDocsTab(tab) {
  const isCredits = tab === "credits";
  if (el.docsTabBtn) {
    el.docsTabBtn.classList.toggle("active", !isCredits);
    el.docsTabBtn.setAttribute("aria-selected", String(!isCredits));
  }
  if (el.creditsTabBtn) {
    el.creditsTabBtn.classList.toggle("active", isCredits);
    el.creditsTabBtn.setAttribute("aria-selected", String(isCredits));
  }
  const path = isCredits ? "./CREDITS.md" : "./DOCUMENTATION.md";
  void loadDocumentation(path);
}

async function loadDocumentation(path) {
  if (!el.docsContent) return;
  if (docsCache.has(path)) {
    el.docsContent.innerHTML = docsCache.get(path) || "";
    buildDocsSidebar();
    return;
  }
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Documentation file not found.");
    const text = await response.text();
    const rendered = renderMarkdown(text);
    docsCache.set(path, rendered);
    el.docsContent.innerHTML = rendered;
    buildDocsSidebar();
  } catch (error) {
    el.docsContent.textContent = `Unable to load documentation.\n${error.message}`;
  }
}

function toggleDocsSidebar() {
  state.docsSidebarHidden = !state.docsSidebarHidden;
  window.localStorage.setItem("previewer_docs_sidebar_hidden", state.docsSidebarHidden ? "1" : "0");
  applyDocsSidebarState();
}

function applyDocsSidebarState() {
  if (!el.docsWindow) return;
  el.docsWindow.classList.toggle("sidebar-hidden", state.docsSidebarHidden);
}

function buildDocsSidebar() {
  if (!el.docsSidebar || !el.docsContent) return;
  const headings = Array.from(el.docsContent.querySelectorAll("h1, h2, h3"));
  el.docsSidebar.innerHTML = "";
  if (!headings.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No sections.";
    el.docsSidebar.append(empty);
    return;
  }

  headings.forEach((heading, idx) => {
    if (!heading.id) {
      const slug = (heading.textContent || "section")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      heading.id = `${slug || "section"}-${idx + 1}`;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `docs-nav-btn level-${heading.tagName.slice(1)}`;
    btn.textContent = heading.textContent || "Section";
    btn.addEventListener("click", () => {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    el.docsSidebar.append(btn);
  });
}

function renderMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r/g, "").split("\n");
  const out = [];
  let inList = false;
  let inCode = false;
  let codeLines = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    out.push(`<p>${formatInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!inList) return;
    out.push("</ul>");
    inList = false;
  };

  const flushCode = () => {
    if (!inCode) return;
    out.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
    inCode = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushParagraph();
      closeList();
      if (inCode) {
        flushCode();
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      closeList();
      out.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      closeList();
      out.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      closeList();
      out.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      const item = line.replace(/^\s*[-*]\s+/, "");
      out.push(`<li>${formatInline(item)}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  flushCode();

  return out.join("\n");
}

function formatInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return html;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  const firmwareName = String(data?.name || "").toLowerCase();
  const selected = state.selectedColor;

  const hasSelected = Boolean(state.config.wallpapers_by_color?.[selected]);
  if (hasSelected) return selected;

  // Firmware-era aware fallback: 2015 colors map to closest 2012 sets if missing.
  if (selected === "Pink (2015)") return state.config.wallpapers_by_color?.Pink ? "Pink" : "Red";
  if (selected === "Blue (2015)") return state.config.wallpapers_by_color?.Blue ? "Blue" : "Green";
  if (selected === "Gold") return state.config.wallpapers_by_color?.Yellow ? "Yellow" : "Silver";

  // If a loaded firmware name suggests 2015 and a 2015 color exists, prefer it.
  if (firmwareName.includes("2015")) {
    if (state.config.wallpapers_by_color?.["Pink (2015)"] && selected === "Pink") return "Pink (2015)";
    if (state.config.wallpapers_by_color?.["Blue (2015)"] && selected === "Blue") return "Blue (2015)";
  }

  return selected;
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
