const yaml = require('js-yaml')
const fs = require('fs')
const { exit } = require('process')
const TwitchService = require('./TwitchService.js')

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

  // Listen to webhook updates
  await twitch.subscribeToUpdates()
})()
