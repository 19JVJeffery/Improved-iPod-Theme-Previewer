## iPod Nano 7 Theme Previewer

> **Forked from [thgeraads/n7g — n7g_theme_previewer](https://github.com/thgeraads/n7g/tree/main/n7g_theme_previewer)**

### v0.2.0 (upstream base)

This is the first version of the iPod Nano 7 Theme Previewer, made mainly for theme creators to quickly check how their icons and wallpapers look on different iPod Nano 7 colors.

### What the upstream can do:
- Load your own .ipsw files to preview your theme
- Load .ipsw files from a URL (limited options for now)
- Preview app icons and wallpapers based on the device color (only the 2012 colors are supported for now)
- Load apps with "No Content" placeholders

---

## What this fork adds

This build extends the upstream previewer with additional features:

- Primary + compare IPSW loading
- Split compare mode for wallpapers
- Expanded color support (including 2015 mappings in assets config)
- Asset diagnostics panel (missing ID inspector)
- Refined control dock with quick color/style switching
- Keyboard shortcuts:
  - Left/Right: page switch
  - `C`: compare mode toggle
  - `Esc`: close app overlay

### Stack
- HTML
- CSS
- JavaScript modules

### Run locally
From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

### Notes
- IPSW unpacking still uses the original unpacker modules in `js/`.
- Remote firmware loading may depend on CORS/proxy availability.
- See [CREDITS.md](./CREDITS.md) for full attribution.
