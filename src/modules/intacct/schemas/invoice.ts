import * as mongoose from 'mongoose';
import { JobSchema } from '../../schemas/jobs'

let Schema = {
    intacctid: { 
        type: String, 
        unique: true,
        required: true,
        dropDups: true
    },
    paypalid: String,
    jobs: [JobSchema],
};

let options = {
  timestamps: true
}

export let IntacctInvoiceSchema = new mongoose.Schema(Schema, options);
