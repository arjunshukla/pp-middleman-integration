

export default function (router) {
    router.get('/', (req, res) => {
        res.send('First Route! Version: ');
    });
}