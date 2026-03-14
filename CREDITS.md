# iPod Nano 7 Theme Previewer - Credits

## Primary Source Repository
- Original browser previewer source:
  - [thgeraads/n7g - n7g_theme_previewer](https://github.com/thgeraads/n7g/tree/main/n7g_theme_previewer)

This project is derived from and extends that codebase.

## Verified Reuse Audit (Local Comparison)
Verified against a local clone of:
- `https://github.com/thgeraads/n7g.git`

Path compared:
- `/tmp/thgeraads-n7g/n7g_theme_previewer`

Files confirmed byte-identical to upstream `n7g_theme_previewer`:
- `/js/Fat16Parser.js`
- `/js/MseUnpacker.js`
- `/js/Img1Unpacker.js`
- `/js/SilverDBUnpacker.js`
- `/js/unpack.js`
- `/js/json.js`
- `/fonts/open-sans-v43-latin-regular.woff2`
- `/fonts/open-sans-v43-latin-500.woff2`
- `/assets/assets.json`
- `/assets/firmwares.json`

Files modified/extended in this project:
- `/js/jacked.js`
- `/js/IPSWUnpacker.js` (extended compatibility handling)
- `/index.html`
- `/styles.css`
- `/DOCUMENTATION.md`
- `/CREDITS.md`

## Upstream Research/Toolchain Credit Chain
Referenced by upstream `ipod_theme` project:
- [nfzerox/ipod_theme](https://github.com/nfzerox/ipod_theme)
- [CUB3D/ipod_sun](https://github.com/CUB3D/ipod_sun)
- [760ceb3b9c0ba4872cadf3ce35a7a494/ipodhax](https://github.com/760ceb3b9c0ba4872cadf3ce35a7a494/ipodhax)
- [spotlightishere/silverutil](https://github.com/spotlightishere/silverutil)

## Runtime Library Credit
- ZIP/inflate runtime used in-browser:
  - [fflate](https://github.com/101arrowz/fflate)
  - CDN sources:
    - [unpkg fflate@0.8.2](https://unpkg.com/fflate@0.8.2)
    - [jsDelivr fflate@0.8.2 UMD](https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js)

## Asset and UI Base Credits
Base preview assets/fonts and data configs originate from the upstream previewer structure:
- `/assets/*` (including wallpaper mapping and firmware source lists)
- `/fonts/*`

## License Pointers
- Upstream repo license files should be reviewed before redistribution:
  - `n7g` repository license: see upstream repo root
  - `ipod_theme` and dependency projects: see each repository’s LICENSE file

## Attribution Intent
This credits file is intended to attribute all identifiable upstream code, data, and library components used in this project.  
If additional third-party code/assets are added later, append them here immediately.
