import * as mongoose from 'mongoose';

let Schema = {
    id: { 
        type: String, 
        unique: true,
        required: true,
        dropDups: true
    },
    number: String,
    status: String,
    billing_info: [
        {
          email: String
        }
    ],
    invoice_date: Date,
    total_amount: {
        currency: String,
        value: String
    },
    metadata: {
        created_date: Date
    }
};

let options = {
  timestamps: true
}

export let PayPalInvoiceSchema = new mongoose.Schema(Schema, options);
