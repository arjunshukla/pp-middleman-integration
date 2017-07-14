import * as mongoose from 'mongoose';

// TODO: Add missing keys...

let options = {
  timestamps: true
}

let Event = {
    name: String,
    success: Boolean,
    event: Object
}

let EventSchema = new mongoose.Schema(Event, options);


let Schema = {
    RECORDNO: { 
        type: String, 
        unique: true,
        required: true,
        dropDups: true
    },
    PAYPALINVOICEID: String,
    RECORDTYPE: String,
    RECORDID: String,
    STATE: String,
    RAWSTATE: String,
    CUSTOMERNAME: String,
    DELIVERY_OPTIONS: String,
    DESCRIPTION: String,
    DESCRIPTION2: String,
    TERMNAME: {
        type:String,
        enum: ['NET_15', 'NET_30', 'NET_45'], // DUE_ON_RECEIPT, DUE_ON_DATE_SPECIFIED, NET_10, NET_15, NET_30, NET_45, NET_60, NET_90, NO_DUE_DATE
    },
    TERMKEY: String,
    WHENCREATED: Date,
    WHENPOSTED: Date,
    WHENDISCOUNT: Date,
    WHENDUE: Date,
    WHENPAID: Date,
    BASECURR: String,
    CURRENCY: String,
    TOTALENTERED: Number,
    TOTALSELECTED: Number,
    TOTALPAID: Number,
    TOTALDUE: Number,
    TRX_TOTALENTERED: Number,
    TRX_TOTALSELECTED: Number,
    TRX_TOTALPAID: Number,
    TRX_TOTALDUE: Number,

    events: [EventSchema]
};


export let IntacctInvoiceSchema = new mongoose.Schema(Schema, options);
