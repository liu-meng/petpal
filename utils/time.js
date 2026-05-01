function pad(value) {
  return String(value).padStart(2, '0');
}

function toDate(dateLike) {
  if (dateLike instanceof Date) {
    return new Date(dateLike.getTime());
  }

  if (typeof dateLike === 'number' || typeof dateLike === 'string') {
    const date = new Date(dateLike);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date();
}

function formatDate(dateLike) {
  const date = toDate(dateLike);

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}

function isSameDay(a, b) {
  return formatDate(a) === formatDate(b);
}

function isToday(dateLike) {
  return isSameDay(dateLike, Date.now());
}

function hasCrossedDay(prev, next) {
  return formatDate(prev) !== formatDate(next);
}

module.exports = {
  formatDate,
  hasCrossedDay,
  isSameDay,
  isToday,
};
