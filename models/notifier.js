const notifier = require('node-notifier');

/*
notifier.notify({
    'title': 'APS Dashboard',
    'message': 'Hello, there!',
    'wait': true
});
*/

exports.notify = notifier.notify;