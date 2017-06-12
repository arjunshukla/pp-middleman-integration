import { SubModule, BaseConfig } from '../../classes';
import * as intacct from 'intacct-api'; 


export interface IntacctApiConfig extends BaseConfig {
    name: 'IntacctApiModule',
    config: {
        senderId: string,
        senderPassword: string,
        sessionId?: string,
        userId?: string,
        password?: string,
        companyId: string
        controlId?: string,
        uniqueId?: boolean,
        dtdVersion?: string,
        returnFormat?: string,
        pagesize?: number
    }
}


export class IntacctApiModule extends SubModule {

    protected api;
    
    constructor(...args) {

        let defaultConfig: IntacctApiConfig = {
            name: 'IntacctApiModule',
            config: {
                senderId: process.env.INTACCT_SENDER_ID,
                senderPassword: process.env.INTACCT_SENDER_PASSWORD,
                sessionId: process.env.INTACCT_SESSION_ID,
                userId: process.env.INTACCT_USER_ID,
                password: process.env.INTACCT_USER_PASSWORD,
                companyId: process.env.INTACCT_COMPANY_ID,
                controlId: "testRequestId",
                uniqueId: false,
                dtdVersion: "3.0",
                returnFormat: "json",
                pagesize: 100
            }
        };

        super(defaultConfig, ...args);

        this.api = new intacct.IntacctApi({
            auth: {
                senderId: this.configuration.get('senderId'),
                senderPassword: this.configuration.get('senderPassword'),
                sessionId: this.configuration.get('sessionId'),
                userId: this.configuration.get('userId'),
                companyId: this.configuration.get('companyId'),
                password: this.configuration.get('password')
            },
            controlId: this.configuration.get('controlId'),
            uniqueId: this.configuration.get('uniqueId'),
            dtdVersion: this.configuration.get('dtdVersion')
        });

    }

    getApi() {
        return this.api;
    }

}