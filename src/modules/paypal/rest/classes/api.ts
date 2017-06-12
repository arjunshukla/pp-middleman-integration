import * as paypal from 'paypal-rest-sdk';
import { BaseConfig, SubModule } from '../../../classes';

export interface PayPalRestApiConfig extends BaseConfig {
    name: 'PayPalRestApiModule',
    config: {
        mode: string,
        client_id: string,
        client_secret: string
    }
    
}

export class PayPalRestApiModule extends SubModule {

    protected api: any;
    

    constructor(...args) { 
        let defaultConfig: PayPalRestApiConfig = {
            name: 'PayPalRestApiModule',
            config: {
                mode: process.env.PAYPAL_MODE || process.env === 'development' ? 'sandbox' : 'live',
                client_id: process.env.PAYPAL_CLIENT_ID,
                client_secret: process.env.PAYPAL_CLIENT_SECRET
            }
        };

        

        super(defaultConfig, ...args);

        paypal.configure({
            mode: this.configuration.get('mode'),
            client_id: this.configuration.get('client_id'),
            client_secret: this.configuration.get('client_secret')
        });
        this.api = paypal;
    }

    getApi() {
        return this.api;
    }

}