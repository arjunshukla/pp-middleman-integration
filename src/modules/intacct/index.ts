import { MainModule } from '../classes/mainmodule';
import { IntacctApiModule } from './classes/api';

export * from './classes/api';
export * from './classes/invoicing';


export class IntacctModule extends MainModule {

    constructor(...args) {

        

        super(new IntacctApiModule(...args), ...args);
        
    }

}