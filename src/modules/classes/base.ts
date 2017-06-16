

export interface BaseConfig {
    name: string,
    config: any
}

export function isConfig(object: any): object is BaseConfig {
    return 'name' in object && 'config' in object;
}


export class BaseModule {

    protected configuration: Map<string, any>;
    protected name: string;
    protected log;

    constructor(...args) {

        this.configuration = new Map();
        this.configuration.set('name', this.constructor.name);

        let configs:BaseConfig[] = args.filter(arg => isConfig(arg) && arg.name === this.configuration.get('name'));
        let realconfig = {};
        
        if (configs) {
            configs
                .map(config => config.config)
                .map(config => Object.assign(realconfig, config))
            
            Object
                .keys(realconfig)
                .map(key => 
                    this.configuration.set(key, realconfig[key])
                );
        }

        
    }

    getName(): string {
        return this.configuration.get('name');
    }

}