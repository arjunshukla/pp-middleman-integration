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
        this.queryString = process.env.INTACCT_INVOICE_QUERY || `RAWSTATE = 'A' AND PAYPALINVOICEMESSAGE IS NULL AND WHENCREATED > "${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}"`;
        
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

// TODO: Pass multiple RECORDNOs and make just one read call to Intacct
    async read(RECORDNO){
        const cid = intacctapi.IntacctApi.read({ object: 'ARINVOICE', keys: RECORDNO });
        await intacct.request(cid);
        return cid.data.ARINVOICE[0] || [];//get('arinvoice') || [];
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




    async toPaypalJson1(invoice) {



        // return {
            //     "reference": invoice.RECORDNO,
            //     "billing_info": [{
            //         "email": "buyer1@awesome.com"
            //     }],
            //     "items": [{
            //         "name": "Sutures",
            //         "quantity": 100,
            //         "unit_price": {
            //             "currency": "USD",
            //             "value": 5
            //         }
            //     }],
            //     "note": "Medical Invoice 16 Jul, 2013 PST",
            //     "payment_term": {
            //         "term_type": "NET_45"
            //     },
            //     "shipping_info": {
            //         "first_name": "Sally",
            //         "last_name": "Patient",
            //         "business_name": "Not applicable",
            //         "phone": {
            //             "country_code": "001",
            //             "national_number": "5039871234"
            //         },
            //         "address": {
            //             "line1": "1234 Broad St.",
            //             "city": "Portland",
            //             "state": "OR",
            //             "postal_code": "97216",
            //             "country_code": "US"
            //         }
            //     },
            //     "tax_inclusive": false,
            //     "total_amount": {
            //         "currency": "USD",
            //         "value": "500.00"
            //     }
            // };
    }

// Take a param: Intacct Invoice Object 
toPaypalJson(intacctInvoiceJSON) {

    // extract line items...

    let arrPPInvItems = this.toPayPalLineItems(intacctInvoiceJSON.ARINVOICEITEMS.arinvoiceitem);

    let createInvoiceJSON = {
        'merchant_info': {
            'email': process.env.PAYPAL_MERCHANT_EMAIL,
            'first_name': process.env.PAYPAL_MERCHANT_FIRST_NAME,
            'last_name': process.env.PAYPAL_MERCHANT_LAST_NAME,
            'business_name': process.env.PAYPAL_MERCHANT_BUSINESS_NAME,
            'phone': {
                'country_code': process.env.PAYPAL_MERCHANT_PHONE_COUNTRY_CODE,
                'national_number': process.env.PAYPAL_MERCHANT_PHONE_NUMBER
            },
            'address': {
                'line1': process.env.PAYPAL_MERCHANT_ADDRESS_LINE1,
                'city': process.env.PAYPAL_MERCHANT_ADDRESS_CITY,
                'state': process.env.PAYPAL_MERCHANT_COUNTRY_STATE,
                'postal_code': process.env.PAYPAL_MERCHANT_COUNTRY_POSTAL_CODE,
                'country_code': process.env.PAYPAL_MERCHANT_COUNTRY_CODE
            }
        },
        'billing_info': [{
            'email': intacctInvoiceJSON.BILLTO.EMAIL1
        }],
        'items': arrPPInvItems,
        'note': intacctInvoiceJSON.CUSTMESSAGE.MESSAGE,
        'payment_term': {
            'term_type': 'NET_45'//intacctInvoiceJSON.TERMNAME
        },
        'shipping_info': {
            'first_name': intacctInvoiceJSON.SHIPTO.FIRSTNAME,
            'last_name': intacctInvoiceJSON.SHIPTO.LASTNAME,
            'business_name': intacctInvoiceJSON.SHIPTO.CONTACTNAME,
            'phone': {
                'country_code': '',
                'national_number': intacctInvoiceJSON.SHIPTO.PHONE1
            },
            'address': {
                'line1': intacctInvoiceJSON.SHIPTO.MAILADDRESS.ADDRESS1 + ' ' + intacctInvoiceJSON.SHIPTO.MAILADDRESS.ADDRESS2,
                'city': intacctInvoiceJSON.SHIPTO.MAILADDRESS.CITY,
                'state': intacctInvoiceJSON.SHIPTO.MAILADDRESS.STATE,
                'postal_code': intacctInvoiceJSON.SHIPTO.MAILADDRESS.ZIP,
                'country_code': intacctInvoiceJSON.SHIPTO.MAILADDRESS.COUNTRYCODE
            }
        },
        'tax_inclusive': true,
        'total_amount': {
            'currency': intacctInvoiceJSON.CURRENCY,
            'value': intacctInvoiceJSON.TRX_TOTALENTERED
        }
    };

    console.log("PP Invoice JSON: \n" + JSON.stringify(createInvoiceJSON, null, 2));

    return createInvoiceJSON;
}

// Method to extract 
toPayPalLineItems(arrInvoiceItems) {

    let arrPPInvItems = [];

    if (arrInvoiceItems.length > 0) {
        for (var i = 0; i < arrInvoiceItems.length; i++) {
            arrPPInvItems.push({
                'name': arrInvoiceItems[i].ITEMNAME == "" ? ('Item '+ arrInvoiceItems[i].LINE_NO) : arrInvoiceItems[i].ACCOUNTTITLE,
                'quantity': 1,
                'unit_price': {
                    'currency': arrInvoiceItems[i].CURRENCY,
                    'value': arrInvoiceItems[i].AMOUNT
                }
            });
        }
        return arrPPInvItems;
    }
    else {
        return arrPPInvItems;
    }
}

    async sync() {
        try {
            let qinvoices = await this.query();
            for (let invoice of qinvoices) {
                let intacctinvoice, ppinvoice;
                try {
                    // Find or Create Invoice Model
                    intacctinvoice = await this.model.findOne({ RECORDNO: invoice.RECORDNO });
                    if (!intacctinvoice) {
                        intacctinvoice = new this.model(invoice);

                        // TODO: check and add mongoose validator and store in DB...
                        // intacctinvoice.validate(err => {
                        //     throw err;
                        // });
                    }
                    
                    // Create or Find PayPal Invoice
                    if (!intacctinvoice.PAYPALINVOICEID) {
                        let intacctInvoice = await this.read(invoice.RECORDNO);
                        // let ppInvObj = this.toPaypalJson(intacctInvoice);
                        ppinvoice = await this.PayPalInvoiceModule.create(this.toPaypalJson(intacctInvoice));
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
                    intacctinvoice.PAYPALINVOICEMESSAGE = JSON.stringify(err);
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
            }

        } catch (err) {
            winston.error(err);
        }
    }
}