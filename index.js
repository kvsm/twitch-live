const yaml = require('js-yaml')
const fs = require('fs')
const { exit } = require('process')
const rpio = require('rpio')
const onDeath = require('death')({ uncaughtException: true })
const TwitchService = require('./TwitchService.js')

// Init rpio
rpio.init({ gpiomem: false })
const PINS = [7, 11, 13, 15]
PINS.forEach((pin) => {
  rpio.open(pin, rpio.OUTPUT, rpio.LOW)
})

// Clean up nicely
onDeath((signal, err) => {
  PINS.forEach(rpio.close)
})

// Load Twitch channel names from config
let channels
try {
  channels = yaml.safeLoad(fs.readFileSync('./channels.yml', 'utf8'))
} catch (e) {
  console.log(e)
  exit
}
console.log('Monitoring channels: ', channels)

// Create Twitch client
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const twitch = new TwitchService(clientId, clientSecret)

;(async () => {
  // Check initial status of channels
  await twitch.setChannels(channels)

  const statuses = await twitch.getChannelStatuses()
  channels.forEach((channel, idx) => {
    const isLive = statuses[channel]
    console.log(`${channel} is ${isLive ? 'live' : 'offline'}`)
    if (isLive && idx < PINS.length) {
      rpio.write(PINS[idx], rpio.HIGH)
      console.log(`Pin ${PINS[idx]} on`)
    }
  })

  // Listen to webhook updates, passing callback
  await twitch.subscribeToUpdates((stream, user) => {
    if (stream) {
      console.log(
        `${stream.userDisplayName} just went live with title: ${stream.title}`
      )
      const idx = channels.indexOf(stream.userDisplayName)
      if (idx < PINS.length) {
        rpio.write(PINS[idx], rpio.HIGH)
        console.log(`Pin ${PINS[idx]} on`)
      }
    } else {
      console.log(`${user.displayName} just went offline`)
      const idx = channels.indexOf(user.displayName)
      if (idx < PINS.length) {
        rpio.write(PINS[idx], rpio.HIGH)
        console.log(`Pin ${PINS[idx]} off`)
      }
    }
  })
})()
