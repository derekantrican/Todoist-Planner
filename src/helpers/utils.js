import Showdown from "showdown";

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

export function convertMarkdown(text) {
  if (text) {
    return new Showdown.Converter().makeHtml(text);
  }

  return null;
}

export function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}