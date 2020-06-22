const TwitchClient = require('twitch').default
const WebHookListener = require('twitch-webhooks').default

class TwitchService {
  constructor(id, secret) {
    this.client = TwitchClient.withClientCredentials(id, secret)
    this.statuses = {}
    this.users = {}
    this.channels = []
    this.subscriptions = []
  }

  async setChannels(channels) {
    this.channels = channels
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i]
      const user = await this.client.helix.users.getUserByName(channel)
      this.users = { ...this.users, [channel]: user }
    }
  }

  async getChannelStatuses() {
    for (let i = 0; i < this.channels.length; i++) {
      const channel = this.channels[i]
      const isLive = await this.isStreamLive(channel)
      Object.assign(this.statuses, { [channel]: isLive })
    }
    return this.statuses
  }

  async isStreamLive(channel) {
    const user = this.users[channel]
    if (!user) {
      return false
    }
    return (await user.getStream()) !== null
  }

  async subscribeToUpdates(callback) {
    this.listener = await WebHookListener.create(this.client, { port: 8090 })
    this.listener.listen()
    for (let i = 0; i < this.channels.length; i++) {
      const channel = this.channels[i]
      const user = this.users[channel]
      const sub = await this.listener.subscribeToStreamChanges(
        user.id,
        async (stream) => {
          if (stream) {
            console.log(
              `${stream.userDisplayName} just went live with title: ${stream.title}`
            )
          } else {
            console.log(`${user.displayName} just went offline`)
          }
        }
      )
      this.subscriptions.push(sub)
    }
  }
}

module.exports = TwitchService
