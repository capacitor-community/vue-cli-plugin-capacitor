const execa = require('execa')
const fs = require('fs-extra')

module.exports = (api, { capacitor: answers }) => {
  const pkg = {
    scripts: {
      'capacitor:build': 'vue-cli-service capacitor:build',
      'capacitor:serve': 'vue-cli-service capacitor:serve'
    },
    dependencies: {
      '@capacitor/cli': '^1.0.0',
      '@capacitor/core': '^1.0.0'
    }
  }
  answers.platforms.forEach(platform => {
    pkg.dependencies[`@capacitor/${platform}`] = '^1.0.0'
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
  })
}
