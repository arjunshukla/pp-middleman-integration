import { BaseModule } from './basemodule';

export class SubModule extends BaseModule {
    
    constructor(...args) {

        super(...args);

    }

    async init() {
        return Promise.resolve();
    }

}