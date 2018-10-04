module.exports = [
  {
    name: 'capacitor.platforms',
    type: 'checkbox',
    message: 'Choose Target Platforms',
    choices: [
      {
        name: 'Android',
        value: 'android',
        checked: true
      },
      {
        name: 'iOS',
        value: 'ios'
      }
    ],
    validate: opt => opt && opt.length >= 1
  },
  {
    name: 'capacitor.name',
    type: 'string',
    message: "Your App's Name",
    default: 'Vue App'
  },
  {
    name: 'capacitor.id',
    type: 'string',
    message: "Your App's ID",
    default: 'org.vue.myApp'
  }
]
