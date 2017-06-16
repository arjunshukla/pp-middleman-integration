import * as express from 'express';
import * as kraken from 'kraken-js';
import * as mongoose from 'mongoose';
import * as winston from 'winston';
import { MongoDB } from 'winston-mongodb';

import { EventSchema } from './modules/schemas';
import { BaseModule } from './modules/classes';
import { PayPalWebhooksModule, PayPalInvoiceModule } from './modules/paypal';
import { IntacctInvoiceModule } from './modules/intacct';


export let app, server;
export let Modules = new Map<string, BaseModule | any>();

async function initModules() {
    winston.verbose('initModules::Start');
    let mod ,modules;
    modules = Modules.values();
    while(mod = modules.next().value) {
        await mod.init();
    }
    winston.verbose('initModules::Finish');
}

async function startServer() {
    winston.verbose('startServer::Start');
    return new Promise((resolve, reject) => {
        app = express();
        app.use(kraken());
        app.on('shutdown', () => {
            mongoose.disconnect();
        });

        server = app.listen(8000);

        server.on('listening', () => {
            winston.info(`Server Listening | host: ${server.address().address} | port ${server.address().port}`);
            resolve();
        });

        server.on('error', (err) => {
            throw err;
        });
        winston.verbose('startServer::Finish');
    });
}

async function startDatabase() {
    winston.verbose('startDatabase::Start');
    try {
        mongoose.Promise = Promise;
        mongoose.set('debug', process.env.MONGOOSE_DEBUG ? true : false);
        await mongoose.connect(process.env.MONGOOSE_URI);
        mongoose.model('Event', EventSchema);
        winston.info(`Mongoose Connected | host: ${mongoose.host} | port: ${mongoose.port} | name: ${mongoose.name}`);
    } catch (err) {
        throw err;
    }
    winston.verbose('startDatabase::Finish');
}

async function startLogger() {
    
    winston.level = process.env.LOG_LEVEL || 'info';
    winston.add(MongoDB, {
        db: process.env.MONGOOSE_URI,
        level: 'error'
    });
    
}

async function start() {
    await startLogger();
    await startDatabase();
    await startServer();
    await initModules();
}

// Construct Modules
Modules.set('PayPalWebhooksModule', new PayPalWebhooksModule());
Modules.set('PayPalInvoiceModule', new PayPalInvoiceModule());
Modules.set('IntacctInvoiceModule', new IntacctInvoiceModule());








try {
    start();    
} catch (err) {
    winston.error(err);
    process.exit(1);
}


















