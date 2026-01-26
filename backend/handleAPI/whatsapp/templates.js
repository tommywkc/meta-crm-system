const BACK_HINT = '如需返回查看免費講座，請輸入：返回';

function freeSeminarsMenu(seminars, { formatDateHK, formatRemainingOnly }) {
  if (!seminars || seminars.length === 0) return '目前沒有開放中的免費講座。';

  const lines = ['以下是目前免費的講座'];
  seminars.forEach((s, idx) => {
    const start = formatDateHK(s.datetime_start);
    const end = s.datetime_end ? formatDateHK(s.datetime_end) : null;
    const dateRange = end ? `${start}至${end}` : `${start}`;
    const remaining = formatRemainingOnly(s.remaining_seats);
    lines.push(`${idx + 1}. ${s.event_name}（${dateRange} 餘下位置 ${remaining}）`);
    if (idx !== seminars.length - 1) lines.push('');
  });
  lines.push('如有興趣，請輸入相應的數字（例如：輸入 1）');
  return lines.join('\n');
}

function invalidSeminarOption() {
  return '無效的選項，請輸入清單內的數字。';
}

function invalidSessionOption() {
  return '無效的選項，請輸入清單內的場次數字。';
}

function noSessions(eventName) {
  return `「${eventName}」目前未有場次。\n${BACK_HINT}`;
}

function sessionsMenu(eventName, sessions, { formatDateTimeRangeHK, formatRemainingOnly }) {
  const lines = [`以下是${eventName}的場次`];
  sessions.forEach((s, i) => {
    const range = formatDateTimeRangeHK(s.datetime_start, s.datetime_end);
    const remaining = formatRemainingOnly(s.remaining_seats);
    lines.push(`${i + 1}. ${s.session_name}(${range} 餘下位置 ${remaining})`);
  });
  lines.push('請輸入相應的場次數字(例如：輸入 2)');
  lines.push(BACK_HINT);
  return lines.join('\n');
}

function askProfile(seminarName, sessionName, range) {
  return (
    `收到，你已選擇：\n` +
    `${seminarName}\n` +
    `${sessionName} ${range}\n\n` +
    `請根據以下格式輸入個人資料\n` +
    `(例子)\n` +
    `姓名: 王小明\n` +
    `電話號碼: 23456789\n` +
    `Email(選填): abcd@yahoo.com.hk\n\n` +
    `${BACK_HINT}`
  );
}

function blankProfileTemplate() {
  return `姓名: \n電話號碼: \nEmail(選填): `;
}

function askTestFirst() {
  return '請先輸入「查看免費講座」取得講座清單。';
}

function missingRequiredProfile() {
  return (
    '缺少必要資料（姓名、電話號碼）。\n請按以下格式重新輸入：\n' +
    '姓名: 王小明\n' +
    '電話號碼: 23456789\n' +
    'Email(選填): abcd@yahoo.com.hk'
  );
}

function invalidMobile() {
  return '電話號碼必須為 8 位數字，請重新輸入。';
}

function invalidEmail() {
  return '你輸入嘅 Email 格式唔正確，請重新輸入 Email（或留空 Email）。';
}

module.exports = {
  BACK_HINT,
  freeSeminarsMenu,
  invalidSeminarOption,
  invalidSessionOption,
  noSessions,
  sessionsMenu,
  askProfile,
  blankProfileTemplate,
  askTestFirst,
  missingRequiredProfile,
  invalidMobile,
  invalidEmail,
};
