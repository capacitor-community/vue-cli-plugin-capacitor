# Vue CLI Plugin Capacitor

> Turn your Vue SPA into an Android or iOS app with [Capacitor](https://capacitor.ionicframework.com/)

## Install

Open a terminal in the directory of a Vue CLI 3/4 project, or create one with `vue create my-app`, and run the following command:

```bash
vue add capacitor
```

Then, configure Capacitor to [hide your app's splash screen](https://capacitor.ionicframework.com/docs/apis/splash-screen/#hiding-the-splash-screen) when VueJS is ready by adding the following code to your `src/app.js`:

```diff
import Vue from 'vue'
import App from './App.vue'
+ import { Plugins } from '@capacitor/core'
+ const { SplashScreen } = Plugins

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
+ mounted() {
+   SplashScreen.hide()
+ }
}).$mount('#app')

```

## Start a Live Dev Server

Start the dev server by running:

With [Yarn](https://yarnpkg.com):

```shell
yarn capacitor:serve # add --android or --ios to specify a target platform
```

Or with npm:

```shell
npm run capacitor:serve # add --android or --ios to specify a target platform
```

This will start a dev server, then open your native IDE (Android Studio or XCode). From here, run your app on an emulator or physical device. The app will connect to the dev server, allowing HMR.

## Build Your App

Build your app by running:

With Yarn:

```shell
yarn capacitor:build # add --android and/or --ios to specify a target platform(s)
```

Or with npm:

```shell
npm run capacitor:build # add --android and/or --ios to specify a target platform(s)
```

This will bundle your app, then open your native IDE (Android Studio or XCode). From here, build your app with the IDE tooling to create an Android/iOS app.

## Further Configuration

To learn more about Capacitor and how to use it, visit [Capacitor's Website](https://capacitor.ionicframework.com/). This plugin simply provides an easy-to-use interface for Vue CLI projects.

## How It Works

### Dev Server

1. The normal development server is started with `vue-cli-service serve`.
2. Capacitor is configured to load your app from the dev server's network url.
3. The platform's native IDE is opened with `cap open [platform]`.
4. When the native app is run, it connects to the dev server, allowing for HMR.

### Build

1. Your app is built as normal with `vue-cli-service build`.
2. The bundled output is copied to the native app with `cap copy [platform]`. This runs for each platform specified.
3. The platform's native IDE is opened, allowing you to create a final build of the native app.
