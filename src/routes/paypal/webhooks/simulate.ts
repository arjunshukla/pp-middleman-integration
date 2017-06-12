
export default function (router) {
    router.get('/:type', (req, res) => {
        if (req.param.type === '')
        res.send('GOT IT!');
    });
}