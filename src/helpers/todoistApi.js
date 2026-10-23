import { settings } from "./settings";

const todoistRestApiBase = 'https://api.todoist.com/api/v1';

async function todoistFetch(endpoint, options = {}) {
  const response = await fetch(`${todoistRestApiBase}${endpoint}`, {
    ...options,
    headers: {
      'Authorization' : `Bearer ${settings.todoistApiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Todoist request to ${endpoint} failed with status ${response.status}`);
  }

  return response;
}

//API v1 list endpoints are paginated ({results, next_cursor}) so keep requesting until there's no cursor
async function todoistGetAll(endpoint, params = {}) {
  const results = [];
  let cursor = null;

  do {
    const query = new URLSearchParams(params);
    if (cursor) {
      query.set('cursor', cursor);
    }

    const data = await (await todoistFetch(`${endpoint}?${query}`)).json();
    results.push(...data.results);
    cursor = data.next_cursor;
  } while (cursor);

  return results;
}

export async function todoistUpdateSettingsFromTodoist() {
  const user = await (await todoistFetch('/user')).json();

  settings.next_week = user.next_week; // 1-7 with "1" being "Monday"
  settings.time_format = user.time_format === 0 ? 24 : 12;

  return user;
}

export async function todoistGetTasks() {
  return await todoistGetAll('/tasks/filter', { query: settings.taskFilter ?? 'today|overdue' });
};

export async function todoistGetLabels() {
  return await todoistGetAll('/labels');
};

export async function todoistUpdateTask(id, data) {
  //This uses Sync rather than REST: REST updates replace the whole due object (stripping recurrence), whereas
  //item_update with an explicit due object (date + original string + is_recurring) just moves the anchor date
  const uuid = crypto.randomUUID();
  const response = await todoistFetch('/sync', {
    method: 'post',
    body: new URLSearchParams({
      commands: JSON.stringify([{
        type: 'item_update',
        uuid: uuid,
        args: {
          id: id,
          ...data
        }
      }]),
    }),
  });

  //Sync returns 200 even if the command itself failed - the per-command result is in sync_status
  const status = (await response.json()).sync_status?.[uuid];
  if (status !== 'ok') {
    throw new Error(`Todoist item_update failed: ${JSON.stringify(status)}`);
  }
};

export async function todoistCompleteTask(id) {
  await todoistFetch(`/tasks/${id}/close`, {
    method: 'post',
  });
};

export async function todoistDeleteTask(id) {
  await todoistFetch(`/tasks/${id}`, {
    method: 'delete',
  });
};
