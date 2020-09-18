const execa = require('execa')
const fs = require('fs-extra')
const { done, error, info, warn } = require('@vue/cli-shared-utils')

module.exports = (api, options) => {
  const pluginOptions = options ? options.pluginOptions || {} : {}

  api.registerCommand(
    'capacitor:build',
    {
      description: 'build app for Android/iOS with Capacitor',
      usage: 'vue-cli-service capacitor:build --(android|ios)'
    },
    async args => {
      const path = require('path')
      const outputDir = args.dest || pluginOptions.outputDir || 'dist'
      args.dest = path.join(outputDir, 'bundled')
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
      if (!args.skipBundle) await api.service.run('build', args)
      // Set web dir to build output
      setCapacitorConfig('main config', false, api.resolve(args.dest))
      for (const platform of platforms) {
        // Copy app
        await execa('cap', ['copy', platform], {
          stdio: 'inherit'
        })
        if (args.ide || platform === 'ios') {
          info(
            `\nLaunching ${
              platform === 'android' ? 'Android Studio' : 'XCode'
            }. Build your app here to finish.\n`
          )
          // Launch native studio to finish build
          await execa('cap', ['open', platform], {
            stdio: 'inherit'
          })
        } else {
          const basePath = api.resolve('android/app/build/outputs/apk/release')
          // Remove old build output
          await fs.remove(basePath)
          info('Building native app')
          await execa(
            `./gradlew${process.platform === 'win32' ? '.bat' : ''}`,
            ['assembleRelease'],
            { stdio: 'inherit', cwd: api.resolve('android') }
          )

          // Copy built apk to dist folder
          const unsignedPath = path.join(basePath, 'app-release-unsigned.apk')
          const signedPath = path.join(basePath, 'app-release.apk')
          if (await fs.exists(signedPath)) {
            await fs.copy(
              signedPath,
              path.join(api.resolve(outputDir), 'app-release.apk')
            )
          } else if (await fs.exists(unsignedPath)) {
            await fs.copy(
              unsignedPath,
              path.join(api.resolve(outputDir), 'app-release.apk')
            )
          } else {
            error(
              'Could not find outputted apk. Please resolve any errors with Capacitor. To run the build in Android Studio, pass the "--ide" argument to this command.'
            )
          }
        }
        done('Build Complete!')
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
      const getLanUrl = require('./util/getLanUrl')
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
      // Make sure cleartext is enabled
      if (platform === 'android') {
        const androidManifest = await fs.readFile(
          api.resolve('android/app/src/main/AndroidManifest.xml'),
          'utf8'
        )
        if (!androidManifest.match('android:usesCleartextTraffic="true"')) {
          warn(
            'Cleartext must be enabled to connect to the dev server on Android!'
          )
          warn(
            'Add `android:usesCleartextTraffic="true"` to src-capacitor/android/app/src/main/AndroidManifest.xml in the `application` tag'
          )
          // TODO: actual url with instructions
          // warn('See [need url] for more instructions')
          process.exit(1)
        }
      }
      // Make sure there is an index.html, otherwise Capacitor will crash
      await fs.ensureFile(api.resolve('./dist/index.html'))
      // Copy app data
      await execa('cap', ['copy', platform])
      // Start dev server
      const { url } = await api.service.run('serve')
      // resolve server options
      const projectDevServerOptions = Object.assign(
        api.resolveWebpackConfig().devServer || {},
        options.devServer
      )
      const protocol =
        args.https || projectDevServerOptions.https ? 'https' : 'http'
      const host =
        args.host ||
        process.env.HOST ||
        projectDevServerOptions.host ||
        '0.0.0.0'
      let port = url.match(/:(\d{2,4})\/?/)[1]

      let networkUrl = getLanUrl(protocol, host, port, options.baseUrl)
      if (!networkUrl && platform === 'android') {
        // AVDs can connect to localhost of host computer
        warn(
          'WARNING! Network server is not available. App will only work on an AVD, not on a physical device'
        )
      } else if (!networkUrl) {
        throw new Error(
          'Unable to host app on network. This is required to run a dev server on iOS.'
        )
      } else {
        networkUrl = networkUrl.replace(/\/$/, '')
      }
      setCapacitorConfig(platform, networkUrl || `http://10.0.2.2${port}`)

      info(
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
  async function setCapacitorConfig (platform, serverUrl, webDir) {
    let configPath
    // Read existing config
    if (platform === 'android') {
      configPath = './android/app/src/main/assets/capacitor.config.json'
    } else if (platform === 'ios') {
      configPath = './ios/App/App/capacitor.config.json'
    } else {
      configPath = './capacitor.config.json'
    }
    const capacitorConfig = JSON.parse(
      await fs.readFile(api.resolve(configPath), 'utf8')
    )
    if (serverUrl) {
      capacitorConfig.server = capacitorConfig.server || {}
      capacitorConfig.server.url = serverUrl
    }
    if (webDir) {
      capacitorConfig.webDir = webDir
    }
    // Write updated config
    await fs.writeFile(api.resolve(configPath), JSON.stringify(capacitorConfig))
  }
}

module.exports.defaultModes = {
  'capacitor:build': 'production',
  'capacitor:serve': 'development'
}
