exports.installModule = function (injection) {
    injection.bindMultiple('compileServices', [
        'imapInboxIntegrationService'
    ]);
};