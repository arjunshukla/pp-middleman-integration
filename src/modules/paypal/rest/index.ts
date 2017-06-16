import * as paypal from 'paypal-rest-sdk';

export * from './classes';
export * from './schemas';

export interface BaseSearch {
    page?: number,
    page_size?: number,
    total_count_required?: boolean
}

export interface PayPalRestConfig {
    mode: string,
    client_id: string,
    client_secret: string,
    headers?: any
}


paypal.configure({
    mode: process.env.PAYPAL_MODE || process.env === 'development' ? 'sandbox' : 'live',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET,
    headers: {
        'PayPal-Partner-Attribution-Id': 'Middleman'
    }
});

export let PayPalRest = paypal;