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
    //Start from the defaults so settings added after the user last saved still get a value
    settings = {...defaultSettings, ...JSON.parse(localStorage.getItem('settings'))};
  }

  return settings;
}

export function saveSettings(modifiedSettings) {
  localStorage.setItem('settings', JSON.stringify(modifiedSettings));
  settings = modifiedSettings;
}