import * as intacctapi from 'intacct-api';

export let intacct = new intacctapi.IntacctApi({
    auth: {
        senderId: process.env.INTACCT_SENDER_ID,
        senderPassword: process.env.INTACCT_SENDER_PASSWORD,
        sessionId: process.env.INTACCT_SESSION_ID,
        userId: process.env.INTACCT_USER_ID,
        password: process.env.INTACCT_USER_PASSWORD,
        companyId: process.env.INTACCT_COMPANY_ID
    },
    controlId: process.env.INTACCT_CONTROL_ID || 'testRequestId',
    uniqueId: process.env.INTACCT_CONTROL_ID || false,
    dtdVersion: process.env.INTACCT_DTD_VERSION || '3.0'
});

export * from './schemas';
export * from './classes';

