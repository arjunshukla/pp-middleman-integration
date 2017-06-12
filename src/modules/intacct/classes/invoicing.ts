import * as intacct from 'intacct-api';
import { SubModule } from '../../classes';
import { Modules } from '../../../modules';

export interface IntacctInvoicingConfig {
    autogenerate: boolean,
    cron: {
        create: number
    }
}

export class IntacctInvoicingModule extends SubModule {

    public name;
    private api;

    constructor(...args) {

        let defaultConfig = {
            autogenerate: true,
            cron: {
                create: 60000
            }
        };

        super(defaultConfig);
    }

    async init() {

        this.api = Modules
                    .get('IntacctModule')
                    .getSubmodules()
                    .get('IntacctApiModule')
                    .getApi();

        await Promise.all([
            Modules
                .get('PayPalRestModule')
                .getSubmodules()
                .get('PayPalWebhooksModule')
                .add(['INVOICING.INVOICE.CANCELLED', 'INVOICING.INVOICE.PAID', 'INVOICING.INVOICE.REFUNDED', 'INVOICING.INVOICE.UPDATED']),
            this.startCron() 
        ]);

    }

    async query() {
        const cid = intacct.IntacctApi.readByQuery({ object: 'ARINVOICE' });
        let invoices = await this.api.request(cid);
        return invoices.payload;
    }

    async startCron() {
        let invoices = await this.query();
        // TODO: Need to create mongoose model and store the results of invoices in database.
        // TODO: Use setInterval to start the cronjob.  Use config from above.
        // TODO: Should read webhooks from mongoose and do Intacct apis
        console.log(invoices);
        
    }

}