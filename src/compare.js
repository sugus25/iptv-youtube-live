const fs = require('fs')
const { parse } = require('csv-parse/sync')
const { stringify } = require('csv-stringify/sync')
const path = require('path')
const axios = require('axios')

const getCache = async () => {
  const response = await axios.get('https://raw.githubusercontent.com/iptv-org/api/gh-pages/streams.json')
  return response.data
}

(async () => {
  // read the channels from csv file
  const file = path.join(__dirname, '../channels.csv')
  const contents = fs.readFileSync(file, 'utf8')
  const channels = parse(contents, {
    columns: true,
    skip_empty_lines: true
  })

  // get channels from remote cache
  const cache = await getCache()

  // merge the channels from two sourcea
  cache.forEach(item => {
    if (item.channel && item.channel !== '' && item.url.startsWith('https://ythls.armelin.one/channel/UC')) {
      // santize item
      item.url = item.url.replace('https://ythls.armelin.one/', '').replace('.m3u8', '')
      item.updated = (new Date()).toISOString()

      // find channel
      const index = channels.findIndex((channel) => channel.youtube === item.url)
      const channel = channels[index]

      if (channel) {
        // existing channel
      } else {
        // add new channel
        channels.push({
          name: item.channel,
          group: '',
          language: '',
          youtube: item.url,
          logo: '',
          updated: item.updated
        })
      }
    }
  })

  // sort channels alphabetically by their name
  channels.sort((a, b) => a.name.toLowerCase().trim().localeCompare(b.name.toLowerCase().trim()))

  const output = stringify(channels, { header: true })

  // console.log(output)

  fs.writeFileSync('channels.csv', output, { encoding: 'utf8', flag: 'w' })
})()
