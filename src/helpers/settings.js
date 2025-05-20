const defaultSettings = {
  todoistApiKey: '',
};

export let settings;

export function readSettings() { //Todo: we should use like a singleton or something so we're not reading this multiple times
  if (!settings) {
    settings = JSON.parse(localStorage.getItem('settings')) ?? defaultSettings;
  }

  return settings;
}