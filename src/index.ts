import { Modules } from './modules';
import * as express from 'express';
import * as kraken from 'kraken-js';
import * as mongoose from 'mongoose';
import * as chalk from 'chalk';

async function initModules() {
    let modules = Modules.values();
    let mod;
    while(mod = modules.next().value) {
        await mod.init();
    }
}

async function startServer() {
    return new Promise((resolve, reject) => {
        
            app = express();
            app.use(kraken());
            app.on('shutdown', function () {
                db.disconnect();
            });

            server = app.listen(8000);

            server.on('listening', () => {
                console.log(chalk.green.bold(`Server Listening | host: ${server.address().address} | port ${server.address().port}`));
                resolve();
            });

            server.on('error', (err) => {
                console.log(chalk.red.bold(`Server Error ${err}`));
                reject(err);
            });
        
    });
}

async function startDatabase() {
    return new Promise((resolve, reject) => {
            mongoose.Promise = Promise;
            mongoose.set('debug', process.env.MONGOOSE_DEBUG ? true : false);
            db = mongoose.createConnection(process.env.MONGOOSE_URI || 'mongodb://localhost/paypal');
            db.on('connected', () => {
                console.log(chalk.green.bold(`Mongoose Connected | host: ${db.host} | port: ${db.port} | name: ${db.name}`));
                resolve();
            });

            db.on('error', (err) => {
                console.log(chalk.red.bold(`Mongoose Connection Error: ${err}`));
                reject(err);
            });
        
    });
}

async function start() {
    await Promise.all([startServer(), startDatabase()]);
    await initModules();
}


// Define Express Server
export let app, db, server;

try {
    start();    
} catch (err) {
    console.log(chalk.bold.red(err));
    process.exit(1);
}


















