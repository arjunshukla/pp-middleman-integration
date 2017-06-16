import * as mongoose from 'mongoose';

let Schema = {
    name: String,
    success: Boolean,
    event: Object
};

let options = {
  timestamps: true
}

export let EventSchema = new mongoose.Schema(Schema, options);