import * as express from 'express';
import * as kraken from 'kraken-js';


let app = express();
app.use(kraken());
let server = app.listen(8000);

server.on('listening', () => {
    console.log('Server running on ' + server.address().address + ' on port ' + server.address().port + ' Updated!');
});



