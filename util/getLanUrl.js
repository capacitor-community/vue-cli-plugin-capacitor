/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/facebookincubator/create-react-app/blob/master/LICENSE
 */

const url = require('url')
const address = require('address')

module.exports = function getLanUrl (protocol, host, port, pathname = '/') {
  pathname = isAbsoluteUrl(pathname) ? '/' : pathname
  const formatUrl = hostname =>
    url.format({
      protocol,
      hostname,
      port,
      pathname
    })

  const isUnspecifiedHost = host === '0.0.0.0' || host === '::'
  let lanUrlForBrowser
  if (isUnspecifiedHost) {
    try {
      // This can only return an IPv4 address
      lanUrlForBrowser = address.ip()
      if (lanUrlForBrowser) {
        // Check if the address is a private ip
        // https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
        if (
          /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(
            lanUrlForBrowser
          )
        ) {
          // Address is private, format it for later use
          lanUrlForBrowser = formatUrl(lanUrlForBrowser)
        } else {
          // Address is not private, so we will discard it
          lanUrlForBrowser = undefined
        }
      }
    } catch (_e) {
      // ignored
    }
  } else {
    lanUrlForBrowser = formatUrl(host)
  }
  return lanUrlForBrowser
}

function isAbsoluteUrl (url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//"
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url)
}
