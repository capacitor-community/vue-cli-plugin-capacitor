const execa = require('execa')
const fs = require('fs-extra')

module.exports = (api, { capacitor: answers }) => {
  const pkg = {
    scripts: {
      'capacitor:build': 'vue-cli-service capacitor:build',
      'capacitor:serve': 'vue-cli-service capacitor:serve'
    },
    dependencies: {
      '@capacitor/cli': '^2.0.0',
      '@capacitor/core': '^2.0.0'
    }
  }
  answers.platforms.forEach(platform => {
    pkg.dependencies[`@capacitor/${platform}`] = '^2.0.0'
  })
  api.extendPackage(pkg)
  api.onCreateComplete(async () => {
    await fs.writeFile(
      api.resolve('./capacitor.config.json'),
      JSON.stringify({
        appId: answers.id,
        appName: answers.name,
        bundledWebRuntime: false,
        webDir: 'dist'
      })
    )
    await fs.ensureFile(api.resolve('dist/index.html'))
    for (const platform of answers.platforms) {
      await execa('cap', ['add', platform])
    }
    if (answers.platforms.includes('android')) {
      const androidManifestPath = api.resolve(
        'android/app/src/main/AndroidManifest.xml'
      )
      // Enable cleartext support in manifest
      let androidManifest = await fs.readFile(androidManifestPath, 'utf8')
      androidManifest = androidManifest.replace(
        '<application',
        '<application\n        android:usesCleartextTraffic="true"'
      )
      await fs.writeFile(androidManifestPath, androidManifest)
    }
  })
}
