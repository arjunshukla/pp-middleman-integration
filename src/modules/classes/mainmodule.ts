import * as chalk from 'chalk';
import { SubModule } from './submodule';
import { BaseModule } from './basemodule';


export class MainModule extends BaseModule {

    protected submodules;

    constructor(...args) {

        super(...args);

        this.submodules = new Map();

        args
            .filter(arg => arg instanceof SubModule)
            .map(submodule => this.submodules.set(submodule.getName(), submodule));
    }

    getSubmodules() {
        return this.submodules;
    }

    init() {
        console.log(chalk.bold.yellow(`Initializing Module: ${this.getName()}`));
        let promises = [];
        this.submodules.forEach(module => promises.push(module.init(this)));
        return Promise.all(promises)
                .then(() => {
                    console.log(chalk.bold.yellow(`Initialized Module: ${this.getName()}`));
                });
    }

}