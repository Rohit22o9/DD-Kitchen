/* eslint-disable no-console */
const silent = process.env.NODE_ENV === 'test' && !process.env.DEBUG_TEST_LOGS;
const ts = () => new Date().toISOString();

module.exports = {
  info: (...a) => !silent && console.log(ts(), 'INFO', ...a),
  warn: (...a) => !silent && console.warn(ts(), 'WARN', ...a),
  error: (...a) => !silent && console.error(ts(), 'ERROR', ...a),
};
