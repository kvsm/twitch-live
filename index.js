import Koa from 'koa'
import yaml from 'js-yaml'
import fs from 'fs'
import { exit } from 'process'
import TwitchClient from 'twitch'
import dotenv from 'dotenv-safe'

// Load .env environment variables
dotenv.config()

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
const clientId = 


const app = new Koa()

app.use(async (ctx) => {
  ctx.body = 'Hello World'
})

app.listen(3000)
