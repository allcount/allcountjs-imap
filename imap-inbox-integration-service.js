'use strict';
var inspect = require('util').inspect;
var Q = require('q');

module.exports = function () {
    var service = {};
    service.imap = require('imap');

    service.compile = function (objects, errors) {
        objects.forEach(function (obj) {
            var imapConfig = obj.imapConfig;
            if (imapConfig) {
                service.imapConfig = imapConfig;
            }
        });
    };

    service.fetchInboundEmails = function () {
        var future = Q.defer();

        var imap = new service.imap({
            user: service.imapConfig.user,
            password: service.imapConfig.password,
            host: service.imapConfig.host || 'imap.gmail.com',
            port: service.imapConfig.port || 993,
            tls: service.imapConfig.tls || true
        });

        function openInbox(cb) {
            imap.openBox('INBOX', true, cb);
        }

        imap.once('ready', function() {
            openInbox(function(err, box) {
                if (err) throw err;
                console.log('uid validity = %s', box.uidvalidity);
                console.log('uid next = %s', box.uidnext);
                var f = imap.seq.fetch(box.messages.total + ':*', { bodies: [''] });
                f.on('message', function(msg, seqno) {
                    console.log('Message #%d', seqno);
                    var prefix = '(#' + seqno + ') ';
                    msg.on('body', function(stream, info) {
                        if (info.which === 'TEXT')
                            console.log(prefix + 'Body [%s] found, %d total bytes', inspect(info.which), info.size);
                        var buffer = '', count = 0;
                        stream.on('data', function(chunk) {
                            count += chunk.length;
                            buffer += chunk.toString('utf8');
                            if (info.which === 'TEXT')
                                console.log(prefix + 'Body [%s] (%d/%d)', inspect(info.which), count, info.size);
                        });
                        stream.once('end', function() {
                            console.log('INFO = %s', inspect(info));
                            if (info.which !== 'TEXT')
                                console.log(prefix + 'Parsed header: %s', inspect(service.imap.parseHeader(buffer)));
                            else
                                console.log(prefix + 'Body [%s] Finished', inspect(info.which));
                                console.log(prefix + 'Body itself: %s', buffer);
                        });
                    });
                    msg.once('attributes', function(attrs) {
                        console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                    });
                    msg.once('end', function() {
                        console.log(prefix + 'Finished');
                    });
                });
                f.once('error', function(err) {
                    console.log('Fetch error: ' + err);
                });
                f.once('end', function() {
                    console.log('Done fetching all messages!');
                    imap.end();
                });
            });
        });

        imap.once('error', function(err) {
            console.log(err);
            future.reject(err);
        });

        imap.once('end', function() {
            future.resolve('TODO: Here must be fetched data...');
            console.log('Connection ended');
        });

        imap.connect();

        return future.promise;
    };

    return service;
};