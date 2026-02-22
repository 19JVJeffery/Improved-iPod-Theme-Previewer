## iPod Nano Theme Previewer: Jacked

This build merges the original **n7g HTML/CSS/JS previewer** with feature ideas from the specialized Swift preview workflow to create a more powerful browser-based IPSW theme preview tool.

### Stack
- HTML
- CSS
- JavaScript modules

### What this version adds
- Primary + compare IPSW loading
- Split compare mode for wallpapers
- Expanded color support (including 2015 mappings in assets config)
- Asset diagnostics panel (missing ID inspector)
- Refined control dock with quick color/style switching
- Keyboard shortcuts:
  - Left/Right: page switch
  - `C`: compare mode toggle
  - `Esc`: close app overlay

### Run locally
From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

### Notes
- IPSW unpacking still uses the original unpacker modules in `js/`.
- Remote firmware loading may depend on CORS/proxy availability.
