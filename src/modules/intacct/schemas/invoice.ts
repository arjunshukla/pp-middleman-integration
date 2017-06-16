import * as mongoose from 'mongoose';

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
    TERMNAME: String,
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
