const defaultSettings = {
  todoistApiKey: '',
};

export function readSettings() { //Todo: we should use like a singleton or something so we're not reading this multiple times
  return JSON.parse(localStorage.getItem('settings')) ?? defaultSettings;
}