import { settings } from "./settings";

const todoistRestApiBase = 'https://api.todoist.com/api/v1';

export async function todoistUpdateSettingsFromTodoist() {
  const response = await fetch(`${todoistRestApiBase}/user`, {
    headers: {
      'Authorization' : `Bearer ${settings.todoistApiKey}`,
    },
  });

  const user = await response.json();

  settings.next_week = user.next_week; // 1-7 with "1" being "Monday"
  settings.time_format = user.time_format === 0 ? 24 : 12;
}

export async function todoistGetTasks() {
  const response = await fetch(`${todoistRestApiBase}/tasks/filter?query=${settings.taskFilter ?? 'today|overdue'}`, {
    headers: {
      'Authorization' : `Bearer ${settings.todoistApiKey}`,
    },
  });
  
  return await response.json();
};

export async function todoistGetLabels() {
  const response = await fetch(`${todoistRestApiBase}/labels`, {
    headers: {
      'Authorization' : `Bearer ${settings.todoistApiKey}`,
    },
  });
  
  return await response.json();
};

export async function todoistUpdateTask(id, data) {
  await fetch(`${todoistRestApiBase}/sync`, {
      method: 'post',
      headers: {
        'Authorization' : `Bearer ${settings.todoistApiKey}`,
        'Content-Type' : 'application/x-www-form-urlencoded',
      },
      body: [
        //Todo: see if I can do this with the REST API (rather than Sync)
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
      'Authorization' : `Bearer ${settings.todoistApiKey}`,
    },
  });
};

export async function todoistDeleteTask(id) {
  await fetch(`${todoistRestApiBase}/tasks/${id}`, {
    method: 'delete',
    headers: {
      'Authorization' : `Bearer ${settings.todoistApiKey}`,
    },
  });
};