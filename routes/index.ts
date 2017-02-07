import * as pack from '../package.json';

const version = (<any>pack).version;

export default function (router) {
    router.get('/', (req, res) => {
        res.send('First Route! Version: ' + version);
    });
}