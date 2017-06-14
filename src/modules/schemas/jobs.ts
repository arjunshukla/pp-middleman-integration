import * as mongoose from 'mongoose';

let Schema = {
    name: String,
    success: Boolean,
    response: String
};

let options = {
  timestamps: true
}

export let JobSchema = new mongoose.Schema(Schema, options);