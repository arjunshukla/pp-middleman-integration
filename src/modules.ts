import { PayPalRestModule, PayPalWebhooksModule, PayPalRestApiConfig } from './modules/paypal';
import { IntacctModule, IntacctInvoicingModule } from './modules/intacct';
import { BaseModule } from './modules/classes';

/*
let intacctConfig: IntacctApiConfig = {
    name: "IntacctApiModule",
    config: {
        senderId: "PayPal",
        senderPassword: "h@W*o3189F",
        userId: "Guest",
        password: "P@ssw0rd",
        companyId: "PayPal-DEV" 
    }
    
};
*/
let paypalRestConfig: PayPalRestApiConfig = {
    name: "PayPalRestApiModule",
    config: {
        mode: "sandbox",
        client_id: "AWQFhxwy2M5zYTDmRTGXKvBlg9Snel-gM0OiDgfkdNXxZW3CnXrXNcDP4IUOh4v5snrFipkZ-d5nIlVo",
        client_secret: "EPZIzfC8kHDhsSvrxwrXD226Yql56Mw4ecKpag_DOtW3ZAh4Gux9XtbD0X_l1LeXQk9HDNwp-GGGcT42"
    }
};

export let Modules = new Map<string, BaseModule | any>([
    ['PayPalRestModule', new PayPalRestModule(
        paypalRestConfig,
        new PayPalWebhooksModule()
    )],
    ['IntacctModule', new IntacctModule(
        //intacctConfig,
        new IntacctInvoicingModule()
    )]
]);