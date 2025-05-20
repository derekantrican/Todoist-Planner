const defaultSettings = {
  todoistApiKey: '',
};

export function readSettings() { //Todo: we should use like a singleton or something so we're not reading this multiple times
  return localStorage.getItem('settings') ?? defaultSettings;
}