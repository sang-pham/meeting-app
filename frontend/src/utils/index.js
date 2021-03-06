export * from './axios.utils';
export * from './socket.utils';
export * from './config';

const convertDate = (mysqlDate) => {
  return mysqlDate.split('T')[0]
}

const timeDiff = (mysqlTime) => {
  let _time = new Date(mysqlTime).getTime()
  let second = Math.round((Date.now() - _time) / 1000)
  let time = 0;
  // if (second < 60) {
  //   return "Just now";
  // }
  if (second < 3600) {
    time = Math.round(second / 60);
    if (time <= 1) {
      return "A minute ago";
    }
    return time + " minutes ago";
  }
  if (second < 86400) {
    time = Math.round(second / 3600);
    if (time == 1) {
      return "An hour ago";
    }
    return time + " hours ago";
  }
  if (second < 2629800) {
    time = Math.round(second / 86400);
    if (time == 1) {
      return "A day ago";
    }
    return time + " days ago";
  }
  if (second < 31557600) {
    time = Math.round(second / 2629800);
    if (time == 1) {
      return "A month ago";
    }
    return time + " months ago";
  }
  time = Math.round(second / 31557600);
  if (time == 1) {
    return "A year ago";
  }
  return time + " years ago";
}

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday']

const MONTHS = ['Jan', 'Feb', 'Marh', 'Apr', 'May', "June",
  'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const messageTimeDiff = (mysqlTime1, mysqlTime2) => {
  let time1 = new Date(mysqlTime1).getTime()
  let time2 = new Date(mysqlTime2).getTime()
  let timeDiff = Math.round((time1 - time2) / 1000)
  let res = ''
  if (timeDiff > 3600) {
    time1 = new Date(mysqlTime1)
    timeDiff = Date.now() - time1
    let minute = time1.getMinutes().toString().length === 1 ? `0${time1.getMinutes()}` : time1.getMinutes()
    let hour = time1.getHours().toString().length === 1 ? `0${time1.getHours()}` : time1.getHours()
    if (timeDiff < 43200) {
      res = `${hour}:${minute}`
    } else {
      res = `${WEEK_DAYS[time1.getDay()]}, ${MONTHS[time1.getMonth()]} ${time1.getDate()} ${time1.getFullYear()} ${hour}:${minute}`
    }
  }
  return res
}

const getAmTime = mysqlTime => {
  let time = new Date(mysqlTime)
  let minute = time.getMinutes().toString().length === 1 ? `0${time.getMinutes()}` : time.getMinutes()
  let hour = time.getHours()
  if (hour === 0) {
    hour = 12;
    minute += ' AM'
  } else if (hour >= 12) {
    if (hour > 12) hour -= 12;
    minute += ' PM'
  } else {
    minute += ' AM'
  }
  return `${hour}:${minute}`
}


const getTime = mysqlTime => {
  let time = new Date(mysqlTime)
  let minute = time.getMinutes().toString().length === 1 ? `0${time.getMinutes()}` : time.getMinutes()
  let hour = time.getHours().toString().length === 1 ? `0${time.getHours()}` : time.getHours()
  return `${WEEK_DAYS[time.getDay()]}, ${MONTHS[time.getMonth()]} ${time.getDate()} ${time.getFullYear()} ${hour}:${minute}`
}

const getFileSize = (size) => {
  if (size < 1000) {
    return size + ' B';
  } else if (size < Math.pow(1000, 2)) {
    size /= 1000;
    return Math.round(size) + ' KB';
  } else if (size < Math.pow(1000, 3)) {
    size /= Math.pow(1000, 2);
    return Math.round(size) + ' MB';
  }
}

const getConnectedDevices = (type, callback) => {
  navigator.mediaDevices.enumerateDevices()
      .then(devices => {
          const filtered = devices.filter(device => device.kind === type);
          callback(filtered);
      });
}

const emotionRegex = /[:;=<]+["^'-]*[3()pPdD*oO]+/g;

export {
  convertDate, timeDiff, messageTimeDiff, getTime,
  emotionRegex, getAmTime, getFileSize, getConnectedDevices
}