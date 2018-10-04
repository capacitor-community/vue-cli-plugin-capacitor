const execa = require('execa')
const fs = require('fs-extra')

module.exports = (api, options) => {
  const pluginOptions = options ? options.pluginOptions || {} : {}

  api.registerCommand(
    'capacitor:build',
    {
      description: 'build app for Android/iOS with Capacitor',
      usage: 'vue-cli-service capacitor:build --(android|ios)'
    },
    async args => {
      // Uses platforms set in args or installed platforms
      const platforms = []
      if (args.android || args.ios) {
        if (args.android) {
          platforms.push('android')
        }
        if (args.ios) {
          platforms.push('ios')
        }
      } else {
        if (await fs.pathExists(api.resolve('./android'))) {
          platforms.push('android')
        }
        if (await fs.pathExists(api.resolve('./ios'))) {
          platforms.push('ios')
        }
      }

      // Build app with Vue CLI
      await api.service.run('build', args)
      for (const platform of platforms) {
        // Copy app
        await execa('cap', ['copy', platform], {
          stdio: 'inherit'
        })
        console.log(
          `\nLaunching ${
            platform === 'android' ? 'Android Studio' : 'XCode'
          }. Build your app here to finish.\n`
        )
        // Launch native studio to finish build
        await execa('cap', ['open', platform], {
          stdio: 'inherit'
        })
      }
    }
  )

  api.registerCommand(
    'capacitor:serve',
    {
      description: 'serve app in Android/iOS with Capacitor',
      usage: 'vue-cli-service capacitor:serve --(android|ios)'
    },
    async args => {
      let platform
      if (args.android && args.ios) {
        throw new Error('Please specify a single platform to develop with')
      } else {
        if (args.android) {
          platform = 'android'
        } else if (args.ios) {
          platform = 'ios'
        } else {
          platform = pluginOptions.defaultPlatform || 'android'
        }
      }
      // Make sure there is an index.HTMLAllCollection, otherwise Capacitor will crash
      if (!(await fs.exists(api.resolve('./dist/index.html')))) {
        await fs.ensureDir(api.resolve('./dist'))
        await fs.writeFile(api.resolve('./dist/index.html'), '<html></html>')
      }
      // Copy app data
      await execa('cap', ['copy', platform])
      // Start dev server
      const { networkUrl, url } = await api.service.run('serve')
      let capacitorConfig
      // Tell capacitor to load dev server URL
      if (platform === 'android') {
        capacitorConfig = await fs.readFile(
          api.resolve('./android/app/src/main/assets/capacitor.config.json'),
          'utf8'
        )
      } else {
        capacitorConfig = await fs.readFile(
          api.resolve('./ios/App/App/capacitor.config.json'),
          'utf8'
        )
      }
      capacitorConfig = JSON.parse(capacitorConfig)
      capacitorConfig.server = capacitorConfig.server || {}
      if (!networkUrl && platform === 'android') {
        // AVDs can connect to localhost of host computer
        console.log(
          'WARNING! Network server is not available. App will only work on an AVD, not on a physical device'
        )
      } else if (!networkUrl) {
        throw new Error(
          'Unable to host app on network. This is required to run a dev server on iOS.'
        )
      }
      capacitorConfig.server.url =
        networkUrl || `http://10.0.2.2${url.match(/:\d{4}\//)[0]}`
      // Write updated config
      if (platform === 'android') {
        await fs.writeFile(
          api.resolve('./android/app/src/main/assets/capacitor.config.json'),
          JSON.stringify(capacitorConfig)
        )
      } else {
        await fs.writeFile(
          api.resolve('./ios/App/App/capacitor.config.json'),
          JSON.stringify(capacitorConfig)
        )
      }

      console.log(
        `\nLaunching ${
          platform === 'android' ? 'Android Studio' : 'XCode'
        }. Run your app here, and it will automatically connect to the dev server.\n`
      )
      // Launch native studio
      await execa('cap', ['open', platform], {
        stdio: 'inherit'
      })
    }
  )
}

module.exports.defaultModes = {
  'capacitor:build': 'production',
  'capacitor:serve': 'development'
}
