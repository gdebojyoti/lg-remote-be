const bonjour = require('bonjour')()
const ping = require('ping')
const { exec } = require('child_process')
const express = require('express')
const path = require('path')

// Discover services on the network
bonjour.find({ type: 'http' }, (service) => {
  console.log(`Found device: ${service.name} at ${service.referer.address}`)
})

// Ping devices in a specific IP range
const subnet = '192.168.0.'
const pingDevices = async () => {
  for (let i = 100; i < 255; i++) {
    const ip = `${subnet}${i}`
    console.log(`Pinging ${ip}`)
    const res = await ping.promise.probe(ip)
    if (res.alive) {
      console.log(`Device found: ${ip}`)
    }
  }
}

const arrayOfIds = [134, 193, 115, 183, 184]
const pingSpecificDevices = () => {
  arrayOfIds.forEach(async (id) => {
    const ip = `${subnet}${id}`
    console.log(`Pinging ${ip}`)
    const res = await ping.promise.probe(ip)
    if (res.alive) {
      console.log(`Device found: ${ip}`)
      exec(`arp -a ${ip}`, (err, stdout) => {
        if (!err) {
          const result = stdout.split('\n').find(line => line.includes(ip))
          if (result) {
            console.log(`Info: ${result}`)
          }
        }
      })
    } else {
      console.log(`Nope: ${ip}`)
    }
  })
}

// console.clear()
// pingDevices()
// pingSpecificDevices()

const lgtv = require('lgtv2')({
  url: 'ws://lgwebostv:3000' // Replace with your TV's IP address
})

lgtv.on('connect', () => {
  console.log('Connected to LG TV')

  lgtv.getSocket('ssap://com.webos.service.networkinput/getPointerInputSocket', (err, socket) => {
    if (err) {
      console.error('Error establishing pointer socket:', err);
      return;
    }
    pointerSocket = socket;
    console.log('Connected to pointer input socket', pointerSocket);
  });
})

lgtv.on('error', (err) => {
  console.error('Error connecting to LG TV:', err)
})

const app = express()
const PORT = 9112 // Choose any port you prefer
app.use(express.json())

// Establishing a socket connection for pointer events
let pointerSocket = null

// Increase volume
app.post('/volume/up', (req, res) => {
  lgtv.request('ssap://audio/volumeUp', (err) => {
    if (err) return res.status(500).send('Error increasing volume')
    res.send({
      success: true,
      msg: 'Volume increased'
    })
  })
})

// Decrease volume
app.post('/volume/down', (req, res) => {
  lgtv.request('ssap://audio/volumeDown', (err) => {
    if (err) return res.status(500).send('Error decreasing volume')
    res.send({
      success: true,
      msg: 'Volume decreased'
    })
  })
})

// Set volume
app.post('/volume/set/:level', (req, res) => {
  const volume = parseInt(req.params.level, 10)
  lgtv.request('ssap://audio/setVolume', { volume }, (err) => {
    if (err) return res.status(500).send('Error setting volume')
    res.send({
      success: true,
      msg: `Volume set to ${volume}`
    })
  })
})

// Send a toast message
app.post('/toast', (req, res) => {
  console.log('req', req.body.toastMessage)
  lgtv.request('ssap://system.notifications/createToast', { message: req.body.toastMessage }, (err) => {
    if (err) {
      return res.status(500).send({
        success: false,
        msg: 'Error showing toast'
      })
    }
    res.send({
      success: true,
      msg: 'Toast shown'
    })
  })
})

app.post('/pointer-features', (req, res) => {
  const { type, x, y, key } = req.body;
  
  if (!pointerSocket) {
    return res.status(500).send({
      success: false,
      msg: 'Pointer socket not initialized'
    })
  }

  // Assuming you have a predefined set of events you want to handle, e.g., move, click, etc.
  switch (type) {
    case 'move':
      pointerSocket.send('move', { dx: x, dy: y })
      break
    case 'click':
      switch (key) {
        case "UP":
        case "DOWN":
        case "LEFT":
        case "RIGHT":
        case "MENU":
        case "HOME":
        case "ENTER":
        case "MUTE":
        case "BACK": {
          pointerSocket.send('button', { name: key }) // key: "DOWN" | "MENU" | "BACK"
          break
        }
        default: {
          return res.status(400).send({
            success: false,
            msg: 'Invalid pointer event key'
          })
        }
      }
      break
    // Handle other values of `type`
    default:
      return res.status(400).send({
        success: false,
        msg: 'Invalid pointer event type'
      })
  }

  res.send({
    success: true,
    msg: `Pointer event (${type}) sent to LG TV`
  })
})

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'www/public')));

// Route to serve the web page
app.get('/web', (req, res) => {
  res.sendFile(path.join(__dirname, 'www', 'index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
