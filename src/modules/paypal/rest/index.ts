import { MainModule } from '../../classes/mainmodule';
import { PayPalRestApiModule } from './classes/api';

export * from './classes/api';
export * from './classes/webhooks';

export class PayPalRestModule extends MainModule {

    constructor(...args) {
        super(new PayPalRestApiModule(...args), ...args);
    }

}