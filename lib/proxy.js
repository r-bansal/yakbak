// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

var Promise = require('bluebird');
var https = require('https');
var http = require('http');
var url = require('url');
var debug = require('debug')('yakbak:proxy');
var querystring = require('querystring');

/**
 * Protocol to module map, natch.
 * @private
 */

var mods = { 'http:': http, 'https:': https };

/**
 * Proxy `req` to `host` and yield the response.
 * @param {http.IncomingMessage} req
 * @param {Array.<Buffer>} body
 * @param {String} host
 * @returns {Promise.<http.IncomingMessage>}
 */

module.exports = function proxy(req, body, host) {
  return new Promise(function (resolve /* , reject */) {
    var uri = url.parse(host);
    var mod = mods[uri.protocol] || http;

    // Modifying path to handle port
    let path = uri.port ?
      `${req.url.slice(uri.port.length + 1)}` :
      req.url

    // Modifying path to handle > 1 query param
    path = Object.keys(req.query).length > 0 && req.url.includes('?') ?
      `${path}&${querystring.stringify(req.query)}` :
      path

    var preq = mod.request({
      hostname: uri.hostname,
      port: uri.port,
      method: req.method,
      path,
      headers: req.headers,

      servername: uri.hostname,
      rejectUnauthorized: false
    }, function (pres) {
      resolve(pres);
    });

    preq.setHeader('Host', uri.host);

    debug('req', req.url, 'host', uri.host);

    body.forEach(function (buf) {
      preq.write(buf);
    });

    preq.end();
  });
};
