const express = require('express')
const path = require('path')
const socketIO = require('socket.io');
const PORT = process.env.PORT || 5000
const fetch = require('node-fetch');

// start the express server with the appropriate routes for our webhook and web requests
var app = express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.json())
  .post('/alchemyhook', (req, res) => { notificationReceived(req); res.status(200).end() })
  .get('/*', (req, res) => res.sendFile(path.join(__dirname + '/index.html')))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

// start the websocket server
const io = socketIO(app);

// listen for client connections/calls on the WebSocket server
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));
    socket.on('register address', (data) => {
      addNFTWebhook(data)
    });
    socket.on('listen webhook', (webhook_id) => {
      addHookNotif(webhook_id);
    });
});

// notification received from Alchemy from the webhook. Let the clients know.
function notificationReceived(req) {
    console.log("notification received!");
    console.log(1, JSON.stringify(req.body))
    io.emit('notification', JSON.stringify(req.body));
}

// add an address to a notification in Alchemy
async function addHookNotif(id) {
    console.log("adding address");
    const body = { webhook_id: id };
    try {
      fetch('https://dashboard.alchemy.com/api/update-webhook-nft-filters', {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        headers: { 'X-Alchemy-Token': 'AUTH_TOKEN'}
      })
        .then(res => res.json())
        .then(json => console.log("Successfully added address:", json))
        .catch(err => console.log("Error! Unable to add address:", err));
    }
    catch (err) {
      console.error(err);
    }
}

async function addNFTWebhook(data) {
  console.log("adding NFT track");

  try {
    fetch('https://dashboard.alchemy.com/api/create-webhook', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      headers: { 'X-Alchemy-Token': 'AUTH_TOKEN'}
    })
      .then(res => res.json())
      .then(json => io.emit('addNFTnotif', JSON.stringify(json)) )
      .then(json => console.log("Successfully added address:", json))
      .catch(err => console.log("Error! Unable to add address:", err));
  }
  catch (err) {
    console.error(err);
  }
}
