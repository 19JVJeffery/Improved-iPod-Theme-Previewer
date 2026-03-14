# App UI Implementation Notes

This file documents the resources used to drive the current in-app UI mocks.

## Source inputs used
- iPod Nano Theming GUI project:
  - `/Users/jamesjeffery/Desktop/iPod Nano Theming GUI/iPod Themer GUI/iPod Themer GUI/Models.swift`
  - `/Users/jamesjeffery/Desktop/iPod Nano Theming GUI/iPod Themer GUI/iPod Themer GUI/ThemeToolViewModel.swift`
- Official user guide screenshots (rendered from):
  - `/Users/jamesjeffery/Downloads/ma1624_ipod_nano_2015_user_guide.pdf`

## Firmware ID sets used in previewer
- Home/app icons: `229442201`-`229442211` families
- UI placeholders/screen art: `229443058`-`229443064`, `229443135`, `229443210`, `229443228`, `229443248`, `229443391`
- Battery/status glyph pool: `229441884`-`229441907`

## Manual pages referenced for per-app interaction pane modeling
- Music: page 18
- Videos: page 27
- Radio: page 29
- Fitness: page 34
- Photos: page 39
- Clock: page 43
- Voice Memos: page 46
- Settings references: page 12
- Home icon/page ordering: pages 5-6

## Runtime behavior
- Visual skin remains firmware-ID-driven.
- Interaction panes are manual-faithful mock logic intended to preview UI structure and flow, not executable app logic.
- Additional confirmed ID mappings can be injected via catalog import (see `APP_SCREEN_CATALOG_FORMAT.md`).
