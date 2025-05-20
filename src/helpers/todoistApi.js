import { readSettings } from "./settings";

//Todo: Todoist is making a new, unified v1 API and we should change our methods to work with that: https://developer.todoist.com/api/v1
const todoistRestApiBase = 'https://api.todoist.com/rest/v2';
const todoistSyncApi = 'https://api.todoist.com/sync/v9/sync';

export async function todoistGetTasks() {
  const response = await fetch(`${todoistRestApiBase}/tasks?filter=today|overdue`, {
    headers: {
      'Authorization' : `Bearer ${readSettings().todoistApiKey}`,
    },
  });
  
  return await response.json();
};

export async function todoistGetLabels() {
  const response = await fetch(`${todoistRestApiBase}/labels`, {
    headers: {
      'Authorization' : `Bearer ${readSettings().todoistApiKey}`,
    },
  });
  
  return await response.json();
};

export async function todoistUpdateTask(id, data) {
  await fetch(todoistSyncApi, {
      method: 'post',
      headers: {
        'Authorization' : `Bearer ${readSettings().todoistApiKey}`,
        'Content-Type' : 'application/x-www-form-urlencoded',
      },
      body: [
        //Todo: see if I can do this with the REST API (rather than Sync)
        //Todo: if I have to use the Sync API, see if I can do the below as JSON rather than form-urlencoded
        `commands=${encodeURIComponent(JSON.stringify([{
          type: 'item_update',
          uuid: crypto.randomUUID(),
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
      'Authorization' : `Bearer ${readSettings().todoistApiKey}`,
    },
  });
};

export async function todoistDeleteTask(id) {
  const response = await fetch(`${todoistRestApiBase}/tasks/${id}`, {
    method: 'delete',
    headers: {
      'Authorization' : `Bearer ${readSettings().todoistApiKey}`,
    },
  });
  
  return await response.json();
};