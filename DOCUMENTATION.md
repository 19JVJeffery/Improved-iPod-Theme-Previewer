# iPod Nano 7 Theme Previewer - Docs

## What This App Does
This app previews iPod nano 7th generation theme assets from IPSW files in-browser.

Main capabilities:
- Load a primary theme IPSW
- Load a compare IPSW
- Split compare mode for side-by-side visual checks
- Device color + wallpaper preview controls
- Interactive page switching and icon/app preview behavior
- Asset diagnostics window for missing IDs

## Running Locally
From this folder:

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

## Core Controls
- `Load Theme IPSW`: load primary theme
- `Load Compare IPSW`: load secondary theme for compare mode
- `Load Remote Firmware`: download and preview a remote firmware source
- `Compare Mode`: enable split comparison
- `Split`: adjust split percentage
- `Show Labels`: show/hide icon labels
- `☰ Sidebar`: collapse/expand settings panel
- `⚙︎ Settings`: open appearance options
- `ⓘ Docs`: open this docs/credits window

## Keyboard Shortcuts
- `Left` / `Right`: switch pages
- `C`: toggle compare mode
- `Esc`: close open app preview

## Remote Firmware Flow
1. Open firmware source selector under `Load Remote Firmware`
2. Choose source
3. Click `Load Remote Firmware`
4. Wait for download to complete, then extraction starts automatically

## Troubleshooting

### Local IPSW fails to load
- Ensure the file is a valid IPSW archive.
- If the browser still shows an error, reload the page and retry.

### Remote firmware appears stalled
- Confirm network access and CORS/proxy availability.
- Try another listed source.

### Missing icons/wallpapers
- Open `Asset Diagnostics` to inspect missing IDs.

## Developer Notes
- Primary app logic: `/js/jacked.js`
- IPSW extraction pipeline: `/js/unpack.js`
- ZIP container unpack: `/js/IPSWUnpacker.js`
- UI shell/layout: `/index.html`, `/styles.css`

For attribution and provenance, use the **Credits** tab.
