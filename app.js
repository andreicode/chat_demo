const express = require('express');
const app = express();
const port = 3000;
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');
const bodyParser = require('body-parser');

const shopSockets = [];
const customersSockets = [];

const users = [
    {
        id: 0, name: 'Mihai', conversation: [
            {
                message: 'Buna Seara!',
                time: '12.06',
                customer: true,
            },
            {
                message: 'Buna Ziua!',
                time: '12.09',
                customer: false,
            },
        ]
    },
    { id: 1, name: 'Marius', conversation: [] },
    {
        id: 2, name: 'Mara', conversation: [
            {
                message: 'Buna!',
                time: '12.01',
                customer: true,
            },
            {
                message: 'Buna si tie!',
                time: '12.06',
                customer: false,
            },
        ]
    }
];

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/users', (req, res) => res.json({ staus: 'success', data: users }));
app.get('/conversation/:id', (req, res) => res.json({status: 'success', data: users[req.params.id].conversation }));
app.post('/message/shop', (req, res) => {
    const message = {
        message: req.body.message,
        time: new Date(Date.now()).toTimeString().substr(0, 5),
        customer: false,
    }

    users.find((user) => {
        if (user.id === req.body.id) {
            user.conversation.push(message);
        }
    })

    shopSockets.forEach( (socket) => socket.emit('message', Object.assign(message, { userId: req.body.id })));

    for (let i = 0; i < customersSockets.length; i++) {
        if (customersSockets[i].userId === req.body.id) {
            customersSockets[i].emit('message', message);
        }
    }

    res.json({ staus: 'success', data: message });
});
app.post('/message/customer', (req, res) => {
    const message = {
        message: req.body.message,
        time: new Date(Date.now()).toTimeString().substr(0, 5),
        customer: true,
    }

    users.find((user) => {
        if (user.id === req.body.id) {
            user.conversation.push(message);
        }
    })

    shopSockets.forEach( (socket) => socket.emit('message', Object.assign(message, { userId: req.body.id })));

    for (let i = 0; i < customersSockets.length; i++) {
        if (customersSockets[i].userId === req.body.id) {
            customersSockets[i].emit('message', message);
        }
    }

    res.json({ staus: 'success', data: message });
});


io.on('connection', function (socket) {
    if (socket.handshake.query.token === 'shop') {
        console.log('Shop Connected');
        shopSockets.push(socket);
    } else {
        console.log('User connected');
        customersSockets.push(Object.assign(socket, { userId: parseInt(socket.handshake.query.token) }));
    }

    socket.on('disconnect', () => {
        if (socket.handshake.query.token === 'shop') {
            for (let i = 0; i < shopSockets.length; i++) {
                if (shopSockets[i].id === socket.id) {
                    shopSockets.splice(i, 1);
                    console.log('Shop Disc')
                    break;
                }
            }
        } else {
            for (let i = 0; i < customersSockets.length; i++) {
                if (customersSockets[i].id === socket.id) {
                    customersSockets.splice(i, 1);
                    break;
                }
            }
        }
    })
});

http.listen(port, () => console.log(`Example app listening on port ${port}!`))