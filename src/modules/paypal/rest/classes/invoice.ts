import * as mongoose from 'mongoose';
import * as winston from 'winston';
import { BaseModule } from '../../../classes';
import { BaseSearch, PayPalInvoiceSchema } from '../';
import { PayPalRest } from '../';

export interface PayPalInvoiceSearch extends BaseSearch {
    email?: string,
    recipient_first_name?: string,
    recipient_last_name?: string,
    recipient_business_name?: string,
    number?: string,
    status?: string,
    start_creation_date?: string,
    end_creation_date?: string,
}


export class PayPalInvoiceModule extends BaseModule {

    private model;
    private interval = process.env.PAYPAL_INVOICE_INTERVAL || 60000;
    // private merchant_email = process.env.PAYPAL_INVOICE_EMAIL;


    constructor(...args) {
        
        super(...args);
        winston.verbose(`PayPalInvoiceModule::Start`);

        winston.verbose(`PayPalInvoiceModule::Finish`);
    }

    async init() {
        
        this.model = mongoose.model('PayPalInvoice', PayPalInvoiceSchema);

        await this.service();
        
    }

    async search(search: PayPalInvoiceSearch = {}) {
        
        if (!search) {
            var date = new Date();
            search.start_creation_date = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} PST`;
            date.setDate(date.getDate() - 1);
            search.end_creation_date = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} PST`;
        }

        return new Promise((resolve, reject) => {
            PayPalRest.invoice.search(search, (error, response) => error ? reject(error) : resolve(response));
        });
    }

    async create(invoice) {
        // TODO: Remove merchant info
        /*invoice.merchant_info = {
            email: this.merchant_email,
            first_name: "Dennis",
            last_name: "Doctor",
            business_name: "Medical Professionals, LLC",
            phone: {
                country_code: "001",
                national_number: "5032141716"
            },
            address: {
                line1: "1234 Main St.",
                city: "Portland",
                state: "OR",
                postal_code: "97217",
                country_code: "US"
            }
        };*/
        return new Promise((resolve, reject) => {
            PayPalRest.invoice.create(invoice, (error, invoice) => error ? reject(error) : resolve(invoice));
        });
        
    }

    async send(id) {
        return new Promise((resolve, reject) => {
            PayPalRest.invoice.send(id, (error, response) => error ? reject(error) : resolve(response));
        });
    }

    async find(id) {
        return await this.model.findOne({ id });
    }

    async get(id) {
        return new Promise((resolve, reject) => {
            PayPalRest.invoice.get(id, (error, response) => error ? reject(error) : resolve(response));
        });
    }

    async save(invoice) {
        return await this.model.findOneAndUpdate({ id: invoice.id }, invoice, { upsert: true, returnNewDocument: true }); 
    }

    async sync() {
        let response: any = await this.search();
        response.invoices.forEach(async (invoice) => {
            try {
                await this.save(invoice);
                // Send PayPal Invoice
                    if (invoice.status === 'DRAFT') {
                        await this.send(invoice.id);
                    }
            } catch (err) {
                winston.error(err);
            }
            
        });
    }

    async service() {
        await this.sync();
        setInterval(async () => {
            try {
                await this.sync();
            } catch (err) {
                winston.error(err);
            }
        }, this.interval);
    }

   

}