const fs = require('fs')
const { parse } = require('csv-parse/sync')
const { stringify } = require('csv-stringify/sync')
const path = require('path')
const axios = require('axios')

const getCache = async () => {
  const response = await axios.get('https://ythls-v3.onrender.com/cache')
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
    if (item.name && item.url.startsWith('channel/')) {
      // santize item
      item.updated = (new Date()).toISOString()

      // find channel
      const index = channels.findIndex((channel) => channel.youtube === item.url)
      const channel = channels[index]

      if (channel) {
        // existing channel

        // update logo
        if (item.logo && item.logo !== '' && channel.logo !== item.logo) {
          channel.logo = item.logo
          channel.updated = item.updated
        }

        // update name
        if (item.name !== '' && channel.name !== item.name) {
          channel.name = item.name
          channel.updated = item.updated
        }

        // remove video which is not live
        if (item.url.startsWith('video/') && !item.isLive) {
          channels.splice(index, 1)
        }
      } else {
        // add new channel if live
        if (item.isLive) {
          channels.push({
            name: item.name,
            group: '',
            language: '',
            youtube: item.url,
            logo: item.logo,
            updated: item.updated
          })
        }
      }
    }
  })

  // sort channels alphabetically by their name
  channels.sort((a, b) => a.name.toLowerCase().trim().localeCompare(b.name.toLowerCase().trim()))

  const output = stringify(channels, { header: true })

  // console.log(output)

  fs.writeFileSync('channels.csv', output, { encoding: 'utf8', flag: 'w' })
})()
