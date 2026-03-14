# App Screen Catalog JSON Format

Use this file format with **Import ID Catalog** in the top bar.

## Goal
Map app screen UI parts to IPSW asset IDs per firmware profile, without code changes.

## Accepted root keys
- `profiles` (recommended)
- `app_screen_profiles`
- `firmwareProfiles`
- or direct object keyed by profile name

## Supported profile keys
- `stock_2012`
- `stock_2015`
- `custom`
- any custom profile name (for future detection rules)

## Supported app keys
- `music`
- `videos`
- `podcasts`
- `photos`
- `radio`
- `settings`
- `clock`
- `fitness`
- `voicerecorder`
- `itunesu`
- `audiobooks`

## Schema
```json
{
  "version": 1,
  "profiles": {
    "stock_2015": {
      "statusBar": ["229443248", "229443064"],
      "music": {
        "top": ["229443210"],
        "art": ["229443135"],
        "controls": ["229443228"]
      },
      "appScreens": {
        "music": {
          "layout": "music_rich",
          "top": ["229443210"],
          "hero": ["229443135"],
          "controls": ["229443228"],
          "rows": ["229443059", "229443060", "229443061"]
        },
        "photos": {
          "layout": "gallery",
          "hero": ["229443060"],
          "tiles": ["229443060", "229443061", "229443062", "229443063"],
          "footer": ["229443064"]
        },
        "settings": {
          "layout": "list_settings",
          "hero": ["229443064"],
          "rows": ["229443059", "229443060", "229443061", "229443062"],
          "footer": ["229443064"]
        }
      },
      "appPlaceholders": {
        "music": ["229443059"],
        "videos": ["229443061"],
        "podcasts": ["229443062"],
        "photos": ["229443060"],
        "radio": ["229443391", "229443064"],
        "settings": ["229443064"],
        "clock": ["229443064"],
        "fitness": ["229443061"],
        "voicerecorder": ["229443064"],
        "itunesu": ["229443063"],
        "audiobooks": ["229443058"]
      }
    }
  }
}
```

## Notes
- IDs may be full (`229443059_0065`) or prefix-only (`229443059`); importer normalizes to prefixes.
- Arrays may also be a single string value.
- Imported profiles are merged and saved in browser local storage.
- Importing a new catalog updates app screens immediately.
- Layouts currently supported: `music_rich`, `list_media`, `list_settings`, `gallery`, `status_hero`.
- Interactive in-app mock controls are auto-rendered by app key and stay firmware-skinned via mapped IDs.
