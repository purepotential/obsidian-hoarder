import { App, PluginSettingTab, Setting, Notice, TFolder } from "obsidian";
import HoarderPlugin from "./main";

export interface HoarderSettings {
  apiKey: string;
  apiEndpoint: string;
  syncFolder: string;
  attachmentsFolder: string;
  syncIntervalMinutes: number;
  lastSyncTimestamp: number;
  updateExistingFiles: boolean;
  excludeArchived: boolean;
  onlyFavorites: boolean;
  syncNotesToHoarder: boolean;
  excludedTags: string[];
}

export const DEFAULT_SETTINGS: HoarderSettings = {
  apiKey: "",
  apiEndpoint: "https://api.hoarder.app/api/v1",
  syncFolder: "Hoarder",
  attachmentsFolder: "Hoarder/attachments",
  syncIntervalMinutes: 60,
  lastSyncTimestamp: 0,
  updateExistingFiles: false,
  excludeArchived: true,
  onlyFavorites: false,
  syncNotesToHoarder: true,
  excludedTags: [],
};

export class HoarderSettingTab extends PluginSettingTab {
  plugin: HoarderPlugin;
  syncButton: any;

  constructor(app: App, plugin: HoarderPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  onunload() {
    // Clean up event listener
    this.plugin.events.off('sync-state-change', this.updateSyncButton);
  }

  private updateSyncButton = (isSyncing: boolean) => {
    if (this.syncButton) {
      this.syncButton.setButtonText(isSyncing ? "Syncing..." : "Sync Now");
      this.syncButton.setDisabled(isSyncing);
    }
  };

  // Get all folders in the vault
  private getFolders(): string[] {
    const folders: string[] = ['/'];
    this.app.vault.getAllLoadedFiles().forEach(file => {
      if (file instanceof TFolder) {
        folders.push(file.path);
      }
    });
    return folders.sort();
  }

  private createFolderSuggestions(input: any, settingKey: 'syncFolder' | 'attachmentsFolder') {
    // Create the suggestion dropdown
    const dropdown = createDiv({ cls: 'suggestion-dropdown suggestion-dropdown-hidden' });
    input.inputEl.parentElement?.appendChild(dropdown);

    // Show/hide suggestions based on input
    input.inputEl.addEventListener('input', () => {
      const value = input.inputEl.value.toLowerCase();
      const allFolders = this.getFolders();
      const matches = allFolders.filter((folder: string) => folder.toLowerCase().includes(value));

      if (matches.length && value) {
        dropdown.empty();
        dropdown.removeClass('suggestion-dropdown-hidden');
        matches.forEach((match: string) => {
          const suggestion = dropdown.createDiv('suggestion-item');
          suggestion.setText(match);
          suggestion.addEventListener('click', async () => {
            input.inputEl.value = match;
            input.inputEl.dispatchEvent(new Event('input'));
            this.plugin.settings[settingKey] = match;
            await this.plugin.saveSettings();
            dropdown.addClass('suggestion-dropdown-hidden');
          });
        });
      } else {
        dropdown.addClass('suggestion-dropdown-hidden');
      }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target as Node) && e.target !== input.inputEl) {
        dropdown.addClass('suggestion-dropdown-hidden');
      }
    });

    return input;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Your Hoarder API key")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
          .inputEl.addClass('hoarder-wide-input')
      );

    new Setting(containerEl)
      .setName("API Endpoint")
      .setDesc("Hoarder API endpoint URL (default: https://api.hoarder.app/api/v1)")
      .addText((text) =>
        text
          .setPlaceholder("Enter API endpoint")
          .setValue(this.plugin.settings.apiEndpoint)
          .onChange(async (value) => {
            this.plugin.settings.apiEndpoint = value;
            await this.plugin.saveSettings();
          })
          .inputEl.addClass('hoarder-wide-input')
      );

    new Setting(containerEl)
      .setName("Sync Folder")
      .setDesc("Folder where bookmarks will be saved")
      .addText((text) => {
        const input = text
          .setPlaceholder("Example: folder1/folder2")
          .setValue(this.plugin.settings.syncFolder)
          .onChange(async (value) => {
            this.plugin.settings.syncFolder = value;
            await this.plugin.saveSettings();
          });

        input.inputEl.addClass('hoarder-medium-input');
        return this.createFolderSuggestions(input, 'syncFolder');
      });

    new Setting(containerEl)
      .setName("Attachments Folder")
      .setDesc("Folder where bookmark images will be saved")
      .addText((text) => {
        const input = text
          .setPlaceholder("Example: folder1/attachments")
          .setValue(this.plugin.settings.attachmentsFolder)
          .onChange(async (value) => {
            this.plugin.settings.attachmentsFolder = value;
            await this.plugin.saveSettings();
          });

        input.inputEl.addClass('hoarder-medium-input');
        return this.createFolderSuggestions(input, 'attachmentsFolder');
      });

    new Setting(containerEl)
      .setName("Sync Interval")
      .setDesc("How often to sync (in minutes)")
      .addText((text) =>
        text
          .setPlaceholder("60")
          .setValue(String(this.plugin.settings.syncIntervalMinutes))
          .onChange(async (value) => {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue > 0) {
              this.plugin.settings.syncIntervalMinutes = numValue;
              await this.plugin.saveSettings();
              this.plugin.startPeriodicSync();
            }
          })
          .inputEl.addClass('hoarder-small-input')
      );

    new Setting(containerEl)
      .setName("Update Existing Files")
      .setDesc("Whether to update or skip existing bookmark files")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.updateExistingFiles)
        .onChange(async (value) => {
          this.plugin.settings.updateExistingFiles = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Exclude Archived")
      .setDesc("Exclude archived bookmarks from sync")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.excludeArchived)
        .onChange(async (value) => {
          this.plugin.settings.excludeArchived = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Only Favorites")
      .setDesc("Only sync favorited bookmarks")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.onlyFavorites)
        .onChange(async (value) => {
          this.plugin.settings.onlyFavorites = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Sync Notes to Hoarder")
      .setDesc("Whether to sync notes to Hoarder")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.syncNotesToHoarder)
        .onChange(async (value) => {
          this.plugin.settings.syncNotesToHoarder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Excluded Tags")
      .setDesc("Bookmarks with these tags will not be synced (comma-separated), unless favorited")
      .addText((text) =>
        text
          .setPlaceholder("private, secret, draft")
          .setValue(this.plugin.settings.excludedTags.join(", "))
          .onChange(async (value) => {
            // Split by comma, trim whitespace, and filter out empty strings
            this.plugin.settings.excludedTags = value
              .split(",")
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0);
            await this.plugin.saveSettings();
          })
          .inputEl.addClass('hoarder-wide-input')
      );

    // Add Sync Now button
    new Setting(containerEl)
      .setName("Manual Sync")
      .setDesc("Sync bookmarks now")
      .addButton((button) => {
        this.syncButton = button
          .setButtonText(this.plugin.isSyncing ? "Syncing..." : "Sync Now")
          .setDisabled(this.plugin.isSyncing)
          .onClick(async () => {
            const result = await this.plugin.syncBookmarks();
            new Notice(result.message);
          });

        // Subscribe to sync state changes
        this.plugin.events.on('sync-state-change', this.updateSyncButton);
        
        return button;
      });

    // Add Last Sync Time
    if (this.plugin.settings.lastSyncTimestamp > 0) {
      containerEl.createEl("div", {
        text: `Last synced: ${new Date(
          this.plugin.settings.lastSyncTimestamp
        ).toLocaleString()}`,
        cls: "setting-item-description",
      });
    }
  }
}
