'use strict';

var chai = require('chai');
chai.should();
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var imapService = require('../imap-inbox-integration-service.js')();


imapService.imapConfig = {
    user: 'should.be.mocked@gmail.com',
    password: '****'
};

describe.skip('Imap inbound integration service', function () {
    describe('fetching', function () {
        it('should be done', function () {
            return imapService.fetchInboundEmails().should.be.fulfilled;
        });
    });
});