import * as mongoose from 'mongoose';
import * as winston from 'winston';
import * as intacctapi from 'intacct-api';
import { BaseModule } from '../../classes';
import { IntacctInvoiceSchema } from '../schemas/invoice';
import { intacct } from '../';
import { Modules } from '../../../';


export class IntacctInvoiceModule extends BaseModule {

    private model;
    private paypalInvoice;
    private interval = process.env.INTACCT_INVOICE_INTERVAL || 3600000;
    private PayPalInvoiceModule;
    private queryString;

    constructor(...args) {

        super(...args);

        this.PayPalInvoiceModule = Modules.get('PayPalInvoiceModule');
        
        let date = new Date();
        date.setDate(date.getDate() - 1);
        this.queryString = process.env.INTACCT_INVOICE_QUERY || `RAWSTATE = 'A' AND PAYPALINVOICEID is null AND  WHENCREATED > "${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}"`;
        
    }

    async init() {

        this.model = mongoose.model('IntacctInvoice', IntacctInvoiceSchema);
        this.paypalInvoice = mongoose.model('PayPalInvoice');

        await Promise.all([
            this.service() 
        ]);

    }

    

    async update(updateObj) {
        const cid = intacctapi.IntacctApi.update(updateObj);
        let result = await intacct.request(cid);
        if (!cid.isSuccessful()) {
            throw new Error(result.rawPayload);
        }
        return cid;
    }

    async query(query = this.queryString) {
        const cid = intacctapi.IntacctApi.readByQuery({ object: 'ARINVOICE', query });
        await intacct.request(cid);
        return cid.get('arinvoice') || [];
    }

    async save(invoice) {
        return await this.model.findOneAndUpdate({ RECORDNO: invoice.RECORDNO }, invoice, { upsert: true, returnNewDocument: true }); 
    }

    async service() {
        
        await this.sync();
        
        setInterval(async () => {    
            await this.sync();
        }, this.interval);
    }

    async toPaypalJson(invoice) {
        return {
                "reference": invoice.RECORDNO,
                "billing_info": [{
                    "email": "buyer1@awesome.com"
                }],
                "items": [{
                    "name": "Sutures",
                    "quantity": 100,
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
    }

    async sync() {
        try {
            let qinvoices = await this.query();
            await qinvoices.forEach(async invoice => {
                let intacctinvoice, ppinvoice;
                try {
                    // Find or Create Invoice Model
                    intacctinvoice = await this.model.findOne({ RECORDNO: invoice.RECORDNO });
                    if (!intacctinvoice) {
                        intacctinvoice = new this.model(invoice);
                    }
                    
                    // Create or Find PayPal Invoice
                    if (!intacctinvoice.PAYPALINVOICEID) {
                        ppinvoice = await this.PayPalInvoiceModule.create(this.toPaypalJson(invoice));
                        intacctinvoice.PAYPALINVOICEID = ppinvoice.id;
                    } else {
                        ppinvoice = await this.PayPalInvoiceModule.find(intacctinvoice.PAYPALINVOICEID);
                    }
                    
                    // Send PayPal Invoice
                    if (ppinvoice.status === 'DRAFT') {
                        await this.PayPalInvoiceModule.send(ppinvoice.id);
                    }
                    
                    intacctinvoice.PAYPALINVOICEMESSAGE = 'Invoice Sent Successfully';
            
                } catch (err) {
                    winston.error(err);
                }

                try {
                    // Update Intacct
                    this.update({ ARINVOICE: { RECORDNO: intacctinvoice.RECORDNO, PAYPALINVOICEID: intacctinvoice.PAYPALINVOICEID, PAYPALINVOICEMESSAGE: intacctinvoice.PAYPALINVOICEMESSAGE } });
                } catch (err) {
                    winston.error(err);
                }

                await intacctinvoice.save();
                await ppinvoice.save();
            });

        } catch (err) {
            winston.error(err);
        }
    }
}