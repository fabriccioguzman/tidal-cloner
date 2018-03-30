module.exports = {
  parseJSONDate(dateString) {
    return (new Date(dateString.replace(/\+([0-9]{2})([0-9]{2})$/, '+$1:$2'))).valueOf();
  },
};
