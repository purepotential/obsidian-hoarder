# Obsidian Hoarder Plugin

This plugin syncs your Hoarder bookmarks with Obsidian, creating markdown notes for each bookmark in a designated folder.

## Features

- Automatically syncs bookmarks from Hoarder every hour (configurable)
- Creates markdown files for each bookmark with metadata
- Configurable sync folder and API settings
- Updates existing bookmarks if they've changed

## Installation

1. Download the latest release from the releases page
2. Extract the zip file in your Obsidian vault's `.obsidian/plugins/` directory
3. Enable the plugin in Obsidian's settings

## Configuration

1. Open Obsidian Settings
2. Navigate to "Hoarder Sync" under "Community Plugins"
3. Enter your Hoarder API key
4. (Optional) Modify the sync interval and folder settings

## Hoarder Configuration

Ensure your CORS policy is set to allow requests from your Obsidian instance. In Traefik, add the following as a middleware:

```yaml
    obsidiancors:
      headers:
        accessControlAllowHeaders: "*"
        accessControlAllowOriginList:
          - app://obsidian.md
          - capacitor://localhost
          - http://localhost
```

## Settings

- **API Key**: Your Hoarder API key (required)
- **API Endpoint**: The Hoarder API endpoint (default: https://api.gethoarder.com)
- **Sync Folder**: The folder where bookmark notes will be created (default: "Hoarder")
- **Sync Interval**: How often to sync in minutes (default: 60)

## Development

1. Clone this repository
2. Install dependencies with `npm install`
3. Build the plugin with `npm run build`
4. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin directory

## License

MIT 