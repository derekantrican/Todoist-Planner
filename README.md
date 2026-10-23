# Todoist Planner

This is an attempt to bring the experience of Any.Do Planner (formerly known as "Moment") to Todoist.

If you haven't heard about Any.Do Planner, here's a video:

[![Watch on YouTube](https://i.imgur.com/uh36k7O.png)](https://www.youtube.com/watch?v=4_Wvv7eDgdY)

## How it works

Todoist Planner pulls in the tasks you need to deal with (by default, everything due today or overdue) and walks you through them one at a time. For each task you decide:

| Action | Options |
|---|---|
| **Today** | No time, Morning (10:00), Noon (12:00), Afternoon (15:00), Evening (19:00), or pick another time |
| **Later** | Tomorrow, In 2 days, Next week (your Todoist "next week" day), or pick a day |
| **Done** | Completes the task |
| **Delete** | Clears the task off your list |

Every choice is saved straight to Todoist. Once you've been through everything, you're done planning for the day.

A few details:

- **Recurring tasks keep their recurrence.** Rescheduling only moves the next occurrence; it never changes the repeat pattern.
- **Times are kept.** Moving a task with a time (e.g. "4:30 PM") to another day keeps that time unless you pick a new one.
- **Optional labels.** You can have a label added to tasks depending on when you schedule them (Today / Tomorrow / Later), which is handy for building Todoist filters around your plan.
- **Nothing gets lost.** If Todoist rejects a change, the task is put back at the top of the list so you can try again.

### Mobile and desktop

- **Phones and tablets** get a layout modeled on the Any.Do app: your tasks flow in as a row of dots, with the current task and the action buttons at the bottom of the screen.
- **Desktop** (windows 1100px or wider) gets a layout modeled on Any.Do's website: the current task on the left and all of your tasks as cards on the right. You can scroll the cards and click any of them to plan that task next.

## Getting started

1. Open the app. The first time, it shows the settings screen.
2. Paste in your Todoist API token. You can find it in Todoist under [Settings → Integrations → Developer](https://app.todoist.com/app/settings/integrations/developer).
3. Optionally change the task filter or set the labels to apply, then press **Save & start planning**.

Your token and settings are stored only in your browser's local storage, and the app talks directly to the Todoist API. There's no server in between.

To change your settings later, use the gear icon (or go to `/settings`).

### Settings

| Setting | Description |
|---|---|
| API token | Your personal Todoist API token (required) |
| Task filter | Any Todoist filter query (the same syntax as Todoist's own filters). Defaults to `today \| overdue` |
| Today / Tomorrow / Later labels | Optional labels added to a task when you schedule it for today, tomorrow, or later |

## Development

This is a [Create React App](https://create-react-app.dev/) project using React 19, with plain CSS (no UI framework).

```bash
npm install
npm start
```

`npm start` runs the app at [http://localhost:3000](http://localhost:3000). To create a production build in `build/`:

```bash
npm run build
```

### Project layout

| Path | Contents |
|---|---|
| `src/App.js` | The planner itself: loading tasks, the mobile & desktop layouts, and scheduling logic |
| `src/views/` | The settings screen, picker sheet, action buttons, and other views |
| `src/helpers/todoistApi.js` | Calls to the [Todoist API v1](https://developer.todoist.com/api/v1/) |
| `src/helpers/settings.js` | Reading & saving settings in local storage |
| `src/helpers/utils.js` | Date helpers, greetings, and Todoist colors |

### Deploying

The app is hosted on GitHub Pages at [todoplus.derekantrican.com](https://todoplus.derekantrican.com). To deploy, run:

```bash
npm run deploy
```

This builds the app and pushes `build/` to the `gh-pages` branch using [gh-pages](https://github.com/tschaub/gh-pages). [`public/CNAME`](public/CNAME) is included in every build so GitHub Pages keeps the custom domain.

GitHub Pages has no single-page app fallback, so paths like `/settings` use the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) trick: [`public/404.html`](public/404.html) redirects to `/?/settings`, and a script in [`public/index.html`](public/index.html) turns that back into `/settings` before the app loads.

The custom domain is set up like this:

- **Cloudflare DNS:** a `CNAME` record for `todoplus` pointing to `derekantrican.github.io`, set to *DNS only* (if it's ever proxied, the SSL/TLS mode must be *Full*, not *Flexible*)
- **Repo Settings → Pages:** Source is *Deploy from a branch* (`gh-pages`, `/ (root)`), custom domain is `todoplus.derekantrican.com`, and *Enforce HTTPS* is on

The build is a plain static site, so it can also be hosted anywhere else that serves static files.
