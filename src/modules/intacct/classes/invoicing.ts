import * as intacct from 'intacct-api';
import * as paypal from 'paypal-rest-sdk';
import { SubModule, BaseConfig } from '../../classes';
import { Modules } from '../../../modules';
import { IntacctInvoiceSchema } from '../schemas/invoice';
import { db } from '../../../'

export interface IntacctInvoicingConfig extends BaseConfig {
    name: 'IntacctInvoicingModule',
    config: {
        autogenerate: boolean,
        interval: number,
        merchant_email: string
    }
    
}


export class IntacctInvoicingModule extends SubModule {

    public name;
    private api;
    private model;
    private syncInterval;

    constructor(...args) {

        let defaultConfig: IntacctInvoicingConfig = {
            name: 'IntacctInvoicingModule',
            config: {
                autogenerate: true,
                interval: 15000,
                merchant_email: process.env.PAYPAL_MERCHANT_EMAIL
            }
        };

        super(defaultConfig, ...args);

        
    }

    async init() {

        this.model = db.model('IntacctInvoice', IntacctInvoiceSchema);

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
            this.startService() 
        ]);

    }

    async createPayPalInvoice(invoice) {
        return new Promise((resolve, reject) => {
                var create_invoice_json = {
                merchant_info: {
                    email: this.configuration.get('merchant_email'),
                    "first_name": "Dennis",
                    "last_name": "Doctor",
                    "business_name": "Medical Professionals, LLC",
                    "phone": {
                        "country_code": "001",
                        "national_number": "5032141716"
                    },
                    "address": {
                        "line1": "1234 Main St.",
                        "city": "Portland",
                        "state": "OR",
                        "postal_code": "97217",
                        "country_code": "US"
                    }
                },
                "billing_info": [{
                    "email": "buyer1@awesome.com"
                }],
                "items": [{
                    "name": "Sutures",
                    "quantity": 100.0,
                    "unit_price": {
                        "currency": "USD",
                        "value": 5
                    }
                }],
                "note": "Medical Invoice 16 Jul, 2013 PST",
                "payment_term": {
                    "term_type": "NET_45"
                },
                "shipping_info": {
                    "first_name": "Sally",
                    "last_name": "Patient",
                    "business_name": "Not applicable",
                    "phone": {
                        "country_code": "001",
                        "national_number": "5039871234"
                    },
                    "address": {
                        "line1": "1234 Broad St.",
                        "city": "Portland",
                        "state": "OR",
                        "postal_code": "97216",
                        "country_code": "US"
                    }
                },
                "tax_inclusive": false,
                "total_amount": {
                    "currency": "USD",
                    "value": "500.00"
                }
            };

            paypal.invoice.create(create_invoice_json, (error, invoice) => error ? reject(error) : resolve(invoice));
        });
    }

    async sendPayPalInvoice(id) {
        return new Promise((resolve, reject) => {
            paypal.invoice.send(id, (error, response) => error ? reject(error) : resolve(response));
        });
    }

    async startService() {
        await this.syncInvoices();
        this.syncInterval = setInterval(async () => {    

            this.syncInvoices();

        }, this.configuration.get('interval'));
    }

    async syncInvoices() {
            // GET ALL INVOICES CREATED IN THE LAST DAY
            var date = new Date();
            date.setDate(date.getDate() - 1);
            let query = `WHENCREATED > "${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}"`;
            // TODO: COMMENT OUT BELOW
            query = 'WHENCREATED = "07/19/2011"';
            const cid = intacct.IntacctApi.readByQuery({ object: 'ARINVOICE', query });
            await this.api.request(cid);
            let invoices = cid.get('arinvoice');
            return await invoices.forEach(async invoice => await this.syncInvoice(invoice));
    }


    async syncInvoice(invoice) {
        let inv;
        try {
            
            // Find Invoice in DB.
            inv = await this.model.findOne({
                intacctid: invoice.RECORDNO,
            });
            
            // Save new invoice if not found
            if (!inv) {
                inv = new this.model({
                    intacctid: invoice.RECORDNO,
                });
            }

            // Create PayPal Invoice
            if (!inv.paypalid) {
                try {
                    let pinv:any = await this.createPayPalInvoice(invoice);
                    inv.paypalid = pinv.id;
                    inv.jobs.push({
                        name: 'CreatePayPalInvoice',
                        success: true,
                        response: JSON.stringify(pinv)
                    });
                } catch (err) {
                    err.name = 'SendPayPalInvoice';
                    throw err;
                }
                
                
            }

            // Check Jobs for a successful send
            if (inv.jobs.filter(job => job.name === 'SendPayPalInvoice' && job.success).length === 0) {
                try {
                    let response = await this.sendPayPalInvoice(inv.paypalid);
                    inv.jobs.push({
                        name: 'SendPayPalInvoice',
                        success: true,
                        response: JSON.stringify(response)
                    });
                } catch (err) {
                    err.name = 'SendPayPalInvoice';
                    throw err;
                }
                
            }

            if (inv.jobs.filter(job => job.name === 'UpdatIntacctInvoiceWithPayPalId' && job.success).length === 0) {
                // Update Intacct Invoice
                const cid = intacct.IntacctApi.update({ ARINVOICE: { RECORDNO: inv.intacctid, PAYPALINVOICEID: inv.paypalid } });
                let response = await this.api.request(cid);

                inv.jobs.push({
                    name: 'UpdatIntacctInvoiceWithPayPalId',
                    success: true,
                    response: JSON.stringify(response)
                });
            }


            return await inv.save();
            

        } catch (err) {
            inv.jobs.push({
                name: err.name || 'InvoiceSync',
                success: false,
                response: JSON.stringify(err)
            });
            await inv.save();
            throw err;
        }  
            
    }

}