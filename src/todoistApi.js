import { uuidv4 } from "./utils";

const todoistRestApiBase = 'https://api.todoist.com/rest/v2';
const todoistSyncApi = 'https://api.todoist.com/sync/v9/sync';

export function getApiKeyFromSettings() { //Todo: when we have more settings, this should probably move to a Settings.js class
  return localStorage.getItem('todoistApiKey');
}

export async function todoistGetTasks() {
  const response = await fetch(`${todoistRestApiBase}/tasks?filter=today|overdue`, {
    headers: {
      'Authorization' : `Bearer ${getApiKeyFromSettings()}`,
    },
  });
  
  return await response.json();
};

export async function todoistGetLabels() {
  const response = await fetch(`${todoistRestApiBase}/labels`, {
    headers: {
      'Authorization' : `Bearer ${getApiKeyFromSettings()}`,
    },
  });
  
  return await response.json();
};

export async function todoistUpdateTask(id, data) {
  await fetch(todoistSyncApi, {
      method: 'post',
      headers: {
        'Authorization' : `Bearer ${getApiKeyFromSettings()}`,
        'Content-Type' : 'application/x-www-form-urlencoded',
      },
      body: [
        //Todo: see if I can do this with the REST API (rather than Sync)
        //Todo: if I have to use the Sync API, see if I can do the below as JSON rather than form-urlencoded
        `commands=${encodeURIComponent(JSON.stringify([{
          type: 'item_update',
          uuid: uuidv4(),
          args: {
            id: id,
            ...data
          }
        }]))}`
      ]
  });
};

export async function todoistCompleteTask(id) {
  await fetch(`${todoistRestApiBase}/tasks/${id}/close`, {
    method: 'post',
    headers: {
      'Authorization' : `Bearer ${getApiKeyFromSettings()}`,
    },
  });
};

export async function todoistDeleteTask(id) {
  const response = await fetch(`${todoistRestApiBase}/tasks/${id}`, {
    method: 'delete',
    headers: {
      'Authorization' : `Bearer ${getApiKeyFromSettings()}`,
    },
  });
  
  return await response.json();
};