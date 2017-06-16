import { PayPalRest } from '../';
import { BaseModule, BaseConfig } from '../../../classes';

export interface WebhookType {
    name: string
}

export interface PayPalWebhooksConfig extends BaseConfig {
    name: 'PayPalWebhooksModule',
    config: {
        hostname: string,
        route: string
    }
}

export class PayPalWebhooksModule extends BaseModule {

    private hostname = process.env.PAYPAL_WEBHOOK_HOSTNAME;
    private route = process.env.PAYPAL_WEBHOOK_ROUTE || '/paypal/webhooks/listen';
    private enabledTypes: WebhookType[] = [
        {
            name: 'IDENTITY.AUTHORIZATION-CONSENT.REVOKED'
        }
    ];
    
    private availableTypes: WebhookType[];

    private webhook;

    constructor(...args) {
        
        super(...args);

        
    }

    async init() {
        
        let webhooksPromise =  new Promise((resolve, reject) => {
            PayPalRest.notification.webhook.list((error, response) => {
                if (error) {
                    return reject(error);
                } else {
                    let filter = response
                                    .webhooks
                                    .filter(webhook => { 
                                        return webhook.url === `https://${this.hostname}${this.route}`;
                                    })
                    
                    if (filter.length > 0) {
                        this.webhook = filter[0];
                        PayPalRest.notification.webhook.replace(filter[0].id, [{ op: 'replace', path: '/event_types', value: this.enabledTypes }], (error, response) => {
                            if (error && error.response.name !== 'WEBHOOK_PATCH_REQUEST_NO_CHANGE') {
                                return reject(error);
                            }
                            return resolve(this.webhook);
                        });
                    } else {
                        var create_webhook_json = {
                            url: `https://${this.hostname}${this.route}`,
                            event_types: this.enabledTypes
                        };
                        PayPalRest.notification.webhook.create(create_webhook_json, (error, webhook) => {
                            if (error) {
                                return reject(error);
                            } else {
                                this.webhook = webhook;
                                return resolve(this.webhook);
                            }
                        });
                    }

                }
            });
        });
    
        let eventPromise = new Promise((resolve, reject) => {
            PayPalRest.notification.webhookEventType.list((error, response) => {
                if (error) {
                    reject(error);
                } else {
                    this.availableTypes = response.event_types;
                    resolve(response.event_types);
                }
            });
        });
            
    
        await Promise.all([eventPromise, webhooksPromise]);
    }

    add(types: string[]) {
        // TODO: Make sure type is in availableTypes array
        types.filter(type => {
            return this.availableTypes.filter(atype => atype.name === type).length;
        })
        .map(type => this.enabledTypes.push({ name: type }));;
        
        return new Promise((resolve, reject) => {
            PayPalRest.notification.webhook.replace(this.webhook.id, [{ op: 'replace', path: '/event_types', value: this.enabledTypes }], (error, response) => {
                if (error && error.response.name !== 'WEBHOOK_PATCH_REQUEST_NO_CHANGE') {
                    return reject(error);
                }
                resolve()
            });
        });

    }

}