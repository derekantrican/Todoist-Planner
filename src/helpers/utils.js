import dayjs from "dayjs";

export function todayWithHour(hour) {
  var today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour);
}

export function todayWithTime(hour, minute) {
  var today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
}

export function todayPlusDays(numDays) {
  var today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  today.setDate(today.getDate() + numDays);
  return today;
}

export function nextWeek(dayOfWeek) {
  var today = new Date();
  return todayPlusDays(((dayOfWeek + 7 - today.getDay()) % 7) || 7);
}

Date.prototype.yyyyMMdd = function () {
  var month = (this.getMonth() + 1).toString();
  var date = this.getDate().toString();
  
  month = month.length < 2 ? '0' + month : month;
  date = date.length < 2 ? '0' + date : date;
  
  return `${this.getFullYear()}-${month}-${date}`;
}

//Local date & time without a timezone (a "floating" datetime in Todoist)
export function toFloatingDateTime(date) {
  var pad = n => n.toString().padStart(2, '0');
  return `${date.yyyyMMdd()}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function greeting() {
  var hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export function isOverdue(due) {
  return !!due && dayjs(due.date).isBefore(dayjs().startOf('day'));
}

//Human readable version of a task's due object, like "Today at 12:00 PM" or "Overdue · Mon, Oct 20 · every Monday"
export function describeDue(due, timeFormat) {
  if (!due) {
    return 'No date';
  }

  var date = dayjs(due.date); //Floating times are parsed as local, 'Z' times are converted to local
  var today = dayjs().startOf('day');

  var description = date.isSame(today, 'day') ? 'Today' :
    date.isSame(today.add(1, 'day'), 'day') ? 'Tomorrow' :
    date.isBefore(today) ? `Overdue · ${date.format('ddd, MMM D')}` :
    date.format('ddd, MMM D');

  if (due.is_recurring) {
    return `${description} · ${due.string}`; //The recurring string usually already includes any time (e.g. "every Mon at 12pm")
  }

  if (due.date.includes('T')) {
    description += ` at ${date.format(timeFormat === 24 ? 'HH:mm' : 'h:mm A')}`;
  }

  return description;
}

//Todoist returns color names (e.g. "berry_red") rather than CSS colors
const todoistColors = {
  berry_red: '#b8256f', red: '#db4035', orange: '#ff9933', yellow: '#fad000', olive_green: '#afb83b',
  lime_green: '#7ecc49', green: '#299438', mint_green: '#6accbc', teal: '#158fad', sky_blue: '#14aaf5',
  light_blue: '#96c3eb', blue: '#4073ff', grape: '#884dff', violet: '#af38eb', lavender: '#eb96eb',
  magenta: '#e05194', salmon: '#ff8d85', charcoal: '#808080', grey: '#b8b8b8', taupe: '#ccac93',
};

export function todoistColor(name) {
  return todoistColors[name];
}

export function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}