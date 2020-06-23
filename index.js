const yaml = require('js-yaml')
const fs = require('fs')
const { exit } = require('process')
const rpio = require('rpio')
const onDeath = require('death')({ uncaughtException: true })
const TwitchService = require('./TwitchService.js')

// Init rpio
rpio.init({ gpiomem: false })
rpio.open(7, rpio.OUTPUT, rpio.LOW)

// Clean up nicely
onDeath((signal, err) => {
  rpio.close(7)
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
  channels.forEach((channel) => {
    const isLive = statuses[channel]
    console.log(`${channel} is ${isLive ? 'live' : 'offline'}`)
  })

  // Listen to webhook updates, passing callback
  await twitch.subscribeToUpdates((stream, user) => {
    if (stream) {
      console.log(
        `${stream.userDisplayName} just went live with title: ${stream.title}`
      )
      if (stream.userDisplayName == 'dru3th') {
        rpio.write(7, rpio.HIGH)
      }
    } else {
      console.log(`${user.displayName} just went offline`)
      if (user.displayName == 'dru3th') {
        rpio.write(7, rpio.LOW)
      }
    }
  })
})()
