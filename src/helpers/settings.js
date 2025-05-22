const defaultSettings = {
  todoistApiKey: '',
  taskFilter: 'today|overdue',
  todayLabel: '',
  tomorrowLabel: '',
  otherLabel: '',
};

export let settings;

export function readSettings() {
  if (!settings) {
    settings = JSON.parse(localStorage.getItem('settings')) ?? defaultSettings;
  }

  return settings;
}

export function saveSettings(modifiedSettings) {
  localStorage.setItem('settings', JSON.stringify(modifiedSettings));
  settings = modifiedSettings;
}