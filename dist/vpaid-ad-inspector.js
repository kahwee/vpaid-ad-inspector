(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  if (this._destroyed) return;

  _toggles.$removeAll.call(this);
  _trigger2.default.call(this, 'AdStopped');
};

var _trigger = require('../trigger');

var _trigger2 = _interopRequireDefault(_trigger);

var _toggles = require('../toggles');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

},{"../toggles":6,"../trigger":7}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  if (this._destroyed) return;

  var videoSlot = this._videoSlot;
  var percentPlayed = _mapNumber(0, videoSlot.duration, 0, 100, videoSlot.currentTime);
  var last = this._lastQuartilePosition;

  if (percentPlayed < last.position) return;

  if (last.hook) last.hook();

  _trigger2.default.call(this, last.event);

  var quartile = this._quartileEvents;
  this._lastQuartilePosition = quartile[quartile.indexOf(last) + 1];
};

var _trigger = require('../trigger');

var _trigger2 = _interopRequireDefault(_trigger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _normNumber(start, end, value) {
  return (value - start) / (end - start);
}

function _mapNumber(fromStart, fromEnd, toStart, toEnd, value) {
  return toStart + (toEnd - toStart) * _normNumber(fromStart, fromEnd, value);
}

},{"../trigger":7}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _loadCss = require('./util/load-css');

var _loadCss2 = _interopRequireDefault(_loadCss);

var _trigger = require('./trigger');

var _trigger2 = _interopRequireDefault(_trigger);

var _toggles = require('./toggles');

var _vastEnded = require('./handler/vast-ended');

var _vastEnded2 = _interopRequireDefault(_vastEnded);

var _vastTimeupdate = require('./handler/vast-timeupdate');

var _vastTimeupdate2 = _interopRequireDefault(_vastTimeupdate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function $enableSkippable() {
  this._attributes.skippableState = true;
}

function $throwError(msg) {
  _trigger2.default.call(this, 'AdError', msg);
}

function $setVideoAd() {
  var videoSlot = this._videoSlot;

  if (!videoSlot) {
    return $throwError.call(this, 'no video');
  }
  _setSize(videoSlot, [this._attributes.width, this._attributes.height]);

  if (!_setSupportedVideo(videoSlot, this._parameters.videos || [])) {
    return $throwError.call(this, 'no supported video found');
  }
}

function _setSize(el, size) {
  el.setAttribute('width', size[0]);
  el.setAttribute('height', size[1]);
  el.style.width = size[0] + 'px';
  el.style.height = size[1] + 'px';
}

function _setSupportedVideo(videoEl, videos) {
  var supportedVideos = videos.filter(function (video) {
    return videoEl.canPlayType(video.mimetype);
  });

  if (supportedVideos.length === 0) return false;

  videoEl.setAttribute('src', supportedVideos[0].url);

  return true;
}

// function _createAndAppend (parent, tagName, className) {
//   var el = document.createElement(tagName || 'div')
//   el.className = className || ''
//   parent.appendChild(el)
//   return el
// }

var Linear = function () {
  function Linear() {
    _classCallCheck(this, Linear);

    this._slot = null;
    this._videoSlot = null;

    this._subscribers = {};

    this._attributes = {
      companions: '',
      desiredBitrate: 256,
      duration: 30,
      remainingTime: -1,
      expanded: false,
      icons: false,
      linear: true,
      skippableState: false,
      viewMode: 'normal',
      width: 0,
      height: 0,
      volume: 1.0
    };

    this.previousAttributes = _extends({}, this._attributes);

    // open interactive panel -> AdExpandedChange, AdInteraction
    // when close panel -> AdExpandedChange, AdInteraction

    this._quartileEvents = [{ event: 'AdVideoStart', position: 0 }, { event: 'AdVideoFirstQuartile', position: 25 }, { event: 'AdVideoMidpoint', position: 50 }, { event: 'AdSkippableStateChange', position: 65, hook: $enableSkippable.bind(this) }, { event: 'AdVideoThirdQuartile', position: 75 }, { event: 'AdVideoComplete', position: 100 }];

    this._lastQuartilePosition = this._quartileEvents[0];

    this._parameters = {};
  }

  _createClass(Linear, [{
    key: 'set',
    value: function set(attribute, newValue) {
      this.previousAttributes[attribute] = this._attributes[attribute];
      this._attributes[attribute] = newValue;
    }

    /**
     * The video player calls handshakeVersion immediately after loading the ad unit to indicate to the ad unit that VPAID will be used.
     * The video player passes in its latest VPAID version string.
     * The ad unit returns a version string minimally set to “1.0”, and of the form “major.minor.patch” (i.e. “2.1.05”).
     * The video player must verify that it supports the particular version of VPAID or cancel the ad.
     *
     * @param {string} playerVPAIDVersion
     * @return {string} adUnit VPAID version format 'major.minor.patch' minimum '1.0'
     */

  }, {
    key: 'handshakeVersion',
    value: function handshakeVersion(playerVPAIDVersion) {
      return '2.0';
    }

    /**
     * After the ad unit is loaded and the video player calls handshakeVersion, the video player calls initAd() to initialize the ad experience.
     *
     * The video player may preload the ad unit and delay calling initAd() until nearing the ad playback time; however, the ad unit does not load its assets until initAd() is called. Once the ad unit’s assets are loaded, the ad unit sends the AdLoaded event to notify the video player that it is ready for display. Receiving the AdLoaded response indicates that the ad unit has verified that all files are ready to execute.
     *
     * @param {number} width    indicates the available ad display area width in pixels
     * @param {number} height   indicates the available ad display area height in pixels
     * @param {string} viewMode indicates either “normal”, “thumbnail”, or “fullscreen” as the view mode
    for the video player as defined by the publisher. Default is “normal”.
     * @param {number} desiredBitrate indicates the desired bitrate as number for kilobits per second
    (kbps). The ad unit may use this information to select appropriate bitrate for any
    streaming content.
     * @param {object} creativeData (optional) used for additional initialization data. In a VAST context,
    the ad unit should pass the value for either the Linear or Nonlinear AdParameter
    element specified in the VAST document.
     * @param {object} environmentVars (optional) used for passing implementation-specific runtime
    variables. Refer to the language specific API description for more details.
     */

  }, {
    key: 'initAd',
    value: function initAd(width, height, viewMode, desiredBitrate, creativeData, environmentVars) {
      this._attributes.width = width;
      this._attributes.height = height;
      this._attributes.viewMode = viewMode;
      this._attributes.desiredBitrate = desiredBitrate;

      this._slot = environmentVars.slot;
      this._videoSlot = environmentVars.videoSlot;
      this._style = (0, _loadCss2.default)('ad.css');
      $setVideoAd.call(this);
      this._videoSlot.addEventListener('timeupdate', _vastTimeupdate2.default.bind(this), false);
      this._videoSlot.addEventListener('ended', _vastEnded2.default.bind(this), false);

      _trigger2.default.call(this, 'AdLoaded');
    }

    /**
     * startAd
     *
     */

  }, {
    key: 'startAd',
    value: function startAd() {
      this._videoSlot.play();
      this._ui = {};
      // this._ui.buy = _createAndAppend(this._slot, 'div', 'vpaidAdLinear')
      // this._ui.banner = _createAndAppend(this._slot, 'div', 'banner')
      // this._ui.xBtn = _createAndAppend(this._slot, 'button', 'close')
      // this._ui.interact = _createAndAppend(this._slot, 'div', 'interact')

      // this._ui.buy.addEventListener('click', $onClickThru.bind(this), false)
      // this._ui.banner.addEventListener('click', $toggleExpand.bind(this, true), false)
      // this._ui.xBtn.addEventListener('click', $toggleExpand.bind(this, false), false)
      _trigger2.default.call(this, 'AdStarted');
    }

    /**
     * stopAd
     *
     */

  }, {
    key: 'stopAd',
    value: function stopAd() {
      if (this._destroyed) return;
      _toggles.$removeAll.call(this);
      _trigger2.default.call(this, 'AdStopped');
    }

    /**
     * skipAd
     *
     */

  }, {
    key: 'skipAd',
    value: function skipAd() {
      if (this._destroyed) return;
      if (!this._attributes.skippableState) return;
      _toggles.$removeAll.call(this);
      _trigger2.default.call(this, 'AdSkipped');
      _trigger2.default.call(this, 'AdStopped');
    }

    /**
     * [resizeAd description]
     * @param  {number} width    The maximum display area allotted for the ad. The ad unit must resize itself to a width and height that is within the values provided. The video player must always provide width and height unless it is in fullscreen mode. In fullscreen mode, the ad unit can ignore width/height parameters and resize to any dimension.
     * @param  {number} height   The maximum display area allotted for the ad. The ad unit must resize itself to a width and height that is within the values provided. The video player must always provide width and height unless it is in fullscreen mode. In fullscreen mode, the ad unit can ignore width/height parameters and resize to any dimension.
     * @param  {string} viewMode Can be one of “normal” “thumbnail” or “fullscreen” to indicate the mode to which the video player is resizing. Width and height are not required when viewmode is fullscreen.
     * @return {[type]}          [description]
     */

  }, {
    key: 'resizeAd',
    value: function resizeAd(width, height, viewMode) {
      this._attributes.width = width;
      this._attributes.height = height;
      this._attributes.viewMode = viewMode;
      _trigger2.default.call(this, 'AdSizeChange');
    }

    /**
     * pauseAd
     *
     */

  }, {
    key: 'pauseAd',
    value: function pauseAd() {
      this._videoSlot.pause();
      _trigger2.default.call(this, 'AdPaused');
    }

    /**
     * resumeAd
     *
     */

  }, {
    key: 'resumeAd',
    value: function resumeAd() {
      this._videoSlot.play();
      _trigger2.default.call(this, 'AdPlaying');
    }

    /**
     * expandAd
     *
     */

  }, {
    key: 'expandAd',
    value: function expandAd() {
      this.set('expanded', true);
      _trigger2.default.call(this, 'AdExpandedChange');
    }

    /**
     * collapseAd
     *
     */

  }, {
    key: 'collapseAd',
    value: function collapseAd() {
      this.set('expanded', false);
      _trigger2.default.call(this, 'AdExpandedChange');
    }

    /**
     * subscribe
     *
     * @param {function} handler
     * @param {string} event
     * @param {object} context
     */

  }, {
    key: 'subscribe',
    value: function subscribe(handler, event, context) {
      if (!this._subscribers[event]) {
        this._subscribers[event] = [];
      }
      this._subscribers[event].push({
        callback: handler,
        context: context
      });
    }

    /**
     * unsubscribe
     *
     * @param {function} handler
     * @param {string} event
     */

  }, {
    key: 'unsubscribe',
    value: function unsubscribe(handler, event) {
      var eventSubscribers = this._subscribers[event];
      if (!Array.isArray(eventSubscribers)) return;
      this._subscribers[event] = eventSubscribers.filter(function (subscriber) {
        return handler !== subscriber;
      });
    }

    /**
     * getAdLinear
     *
     * @return {boolean}
     */

  }, {
    key: 'getAdLinear',
    value: function getAdLinear() {
      return this._attributes.linear;
    }

    /**
     * getAdWidth
     *
     * @return {number} pixel's size of the ad, is equal to or less than the values passed in resizeAd/initAd
     */

  }, {
    key: 'getAdWidth',
    value: function getAdWidth() {
      return this._attributes.width;
    }

    /**
     * getAdHeight
     *
     * @return {number} pixel's size of the ad, is equal to or less than the values passed in resizeAd/initAd
     */

  }, {
    key: 'getAdHeight',
    value: function getAdHeight() {
      return this._attributes.height;
    }

    /**
     * getAdExpanded
     *
     * @return {boolean}
     */

  }, {
    key: 'getAdExpanded',
    value: function getAdExpanded() {
      return this._attributes.expanded;
    }

    /**
     * getAdSkippableState - if the ad is in the position to be able to skip
     *
     * @return {boolean}
     */

  }, {
    key: 'getAdSkippableState',
    value: function getAdSkippableState() {
      return this._attributes.skippableState;
    }

    /**
     * getAdRemainingTime
     *
     * @return {number} seconds, if not implemented will return -1, or -2 if the time is unknown (user is engaged with the ad)
     */

  }, {
    key: 'getAdRemainingTime',
    value: function getAdRemainingTime() {
      return this._attributes.remainingTime;
    }

    /**
     * getAdDuration
     *
     * @return {number} seconds, if not implemented will return -1, or -2 if the time is unknown (user is engaged with the ad)
     */

  }, {
    key: 'getAdDuration',
    value: function getAdDuration() {
      return this._attributes.duration;
    }

    /**
     * getAdVolume
     *
     * @return {number} between 0 and 1, if is not implemented will return -1
     */

  }, {
    key: 'getAdVolume',
    value: function getAdVolume() {
      return this._attributes.volume;
    }

    /**
     * getAdCompanions - companions are banners outside the video player to reinforce the ad
     *
     * @return {string} VAST 3.0 formart string for <CompanionAds>
     */

  }, {
    key: 'getAdCompanions',
    value: function getAdCompanions() {
      return this._attributes.companions;
    }

    /**
     * getAdIcons
     *
     * @return {boolean} if true videoplayer may hide is own icons to not duplicate
     */

  }, {
    key: 'getAdIcons',
    value: function getAdIcons() {
      return this._attributes.icons;
    }

    /**
     * setAdVolume
     *
     * @param {number} volume  between 0 and 1
     */

  }, {
    key: 'setAdVolume',
    value: function setAdVolume(volume) {
      if (this.previousAttributes.volume === volume) {
        // no change, no fire
        return;
      }
      if (volume < 0 || volume > 1) {
        return $throwError('volume is not valid');
      }
      this.set('volume', volume);
      this._videoSlot.volume = volume;
      _trigger2.default.call(this, 'AdVolumeChange');
    }
  }]);

  return Linear;
}();

exports.default = Linear;

},{"./handler/vast-ended":3,"./handler/vast-timeupdate":4,"./toggles":6,"./trigger":7,"./util/load-css":8}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.$toggleExpand = $toggleExpand;
exports.$togglePlay = $togglePlay;
exports.$toggleUI = $toggleUI;
exports.$removeAll = $removeAll;

var _trigger = require('./trigger');

var _trigger2 = _interopRequireDefault(_trigger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function $toggleExpand(toExpand) {
  $toggleUI.call(this, toExpand);
  $togglePlay.call(this, toExpand);

  this._attributes.expandAd = toExpand;
  this._attributes.remainingTime = toExpand ? -2 : -1;

  _trigger2.default.call(this, 'AdExpandedChange');
  _trigger2.default.call(this, 'AdDurationChange');
}

function $togglePlay(toPlay) {
  if (toPlay) {
    this._videoSlot.pause();
  } else {
    this._videoSlot.play();
  }
}

function $toggleUI(show) {
  this._ui.interact.style.display = getDisplay();
  this._ui.xBtn.style.display = getDisplay();

  function getDisplay() {
    return show ? 'block' : 'none';
  }
}

function $removeAll() {
  this._destroyed = true;
  this._videoSlot.src = '';
  this._style.parentElement.removeChild(this._style);
  this._slot.innerHTML = '';
  this._ui = null;
}

},{"./trigger":7}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (event, msg) {
  var subscribers = this._subscribers[event] || [];
  subscribers.forEach(function (handlers) {
    handlers.callback.apply(handlers.context, msg);
  });
};

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (url) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  // parent returns Window object
  parent.document.body.appendChild(link);
  return link;
};

},{}],9:[function(require,module,exports){
'use strict';

var _linear = require('./linear');

var _linear2 = _interopRequireDefault(_linear);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.getVPAIDAd = function () {
  return new _linear2.default();
};

},{"./linear":10}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _linear = require('vpaid-ad/src/linear');

var _linear2 = _interopRequireDefault(_linear);

var _trigger = require('vpaid-ad/src/trigger');

var _trigger2 = _interopRequireDefault(_trigger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var path = require('path');

var htmlTemplate = "<div style=\"background:#f5f5f5; width:100%; height:100%\">\n  <div style=\"height: 100%; display: inline-block; float:left;\">\n    <select id=\"eventSelect\" size=\"10\">\n      <option value=\"AdStarted\" selected>AdStarted</option>\n      <option value=\"AdStopped\">AdStopped</option>\n      <option value=\"AdLoaded\">AdLoaded</option>\n      <option value=\"AdLinearChange\">AdLinearChange</option>\n      <option value=\"AdSizeChange\">AdSizeChange</option>\n      <option value=\"AdExpandedChange\">AdExpandedChange</option>\n      <option value=\"AdSkippableStateChange\">AdSkippableStateChange</option>\n      <option value=\"AdDurationChange\">AdDurationChange</option>\n      <option value=\"AdRemainingTimeChange\">AdRemainingTimeChange</option>\n      <option value=\"AdVolumeChange\">AdVolumeChange</option>\n      <option value=\"AdImpression\">AdImpression</option>\n      <option value=\"AdVideoStart\">AdVideoStart</option>\n      <option value=\"AdVideoFirstQuartile\">AdVideoFirstQuartile</option>\n      <option value=\"AdVideoMidpoint\">AdVideoMidpoint</option>\n      <option value=\"AdVideoThirdQuartile\">AdVideoThirdQuartile</option>\n      <option value=\"AdVideoComplete\">AdVideoComplete</option>\n      <option value=\"AdUserAcceptInvitation\">AdUserAcceptInvitation</option>\n      <option value=\"AdUserMinimize\">AdUserMinimize</option>\n      <option value=\"AdUserClose\">AdUserClose</option>\n      <option value=\"AdPaused\">AdPaused</option>\n      <option value=\"AdPlaying\">AdPlaying</option>\n      <option value=\"AdClickThru\">AdClickThru</option>\n      <option value=\"AdError\">AdError</option>\n      <option value=\"AdLog\">AdLog</option>\n      <option value=\"AdInteraction\">AdInteraction</option>\n    </select>\n  </div>\n  <div>\n    <table>\n      <tr>\n        <td>\n          <b>companions</b>\n          <br>\n          <span id=\"companions\">None</span>\n        </td>\n        <td>\n          <b>desired bitrate</b>\n          <br>\n          <span id=\"desiredBitrate\">-1</span>\n        </td>\n        <td>\n          <b>duration</b><br><span id=\"duration\">-1</span>\n        </td>\n      </tr>\n      <tr>\n        <td>\n          <b>expanded</b><br><span id=\"expanded\">false</span>\n        </td>\n        <td><b>height</b><br><span id=\"height\">-1</span></td>\n        <td><b>icons</b><br><span id=\"icons\">None</span></td>\n      </tr>\n      <tr>\n        <td><b>linear</b><br><span id=\"linear\">True</span></td>\n        <td><b>remaining time</b><br><span id=\"remainingTime\">-1</span></td>\n        <td>\n          <b>skippable state</b><br>\n          <span id=\"skippableState\">False</span>\n        </td>\n      </tr>\n      <tr>\n        <td><b>volume</b><br><span id=\"volume\">1.0</span></td>\n        <td><b>view mode</b><br><span id=\"viewMode\">normal</span></td>\n        <td><b>width</b><br><span id=\"width\">5</span></td>\n      </tr>\n    </table>\n    <div>\n      <hr>\n      <div id=\"AdClickThruOptions\" style=\"display:none;\">\n        Click Through URL <input type=\"text\" id=\"clickThruUrl\" value=\"http://example.com\"/><br>\n        ID <input type=\"text\" id=\"clickThruId\" value=\"1\"/><br>\n        Player Handles <input type=\"text\" id=\"clickThruPlayerHandels\" value=\"false\"/><br>\n      </div>\n      <div id=\"AdErrorOptions\" style=\"display:none;\">\n        AdError <input type=\"text\" id=\"adErrorMsg\" value=\"ad error message\"/>\n      </div>\n      <div id=\"AdLogOptions\" style=\"display:none;\">\n        AdLog <input type=\"text\" id=\"adLogMsg\" value=\"ad log message\"/>\n      </div>\n      <div id=\"AdInteractionOptions\" style=\"display:none;\">\n        AdInteraction\n        <input type=\"text\" id=\"adInteractionId\" value=\"1\"/>\n      </div>\n    </div>\n    <h2><input type=\"button\" id=\"triggerEvent\" value=\"Trigger Event\"/></h2>\n  </div>\n  <div style=\"position:fixed; bottom:30px\">\n    Last event from player <input type=\"text\" style=\"width:200px\" id=\"lastVpaidEvent\" value=\"\"/>\n  </div>\n</div>";

var VpaidAdInspector = function (_Linear) {
  _inherits(VpaidAdInspector, _Linear);

  function VpaidAdInspector() {
    _classCallCheck(this, VpaidAdInspector);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(VpaidAdInspector).apply(this, arguments));
  }

  _createClass(VpaidAdInspector, [{
    key: 'initAd',
    value: function initAd(width, height, viewMode, desiredBitrate, creativeData, environmentVars) {
      this._attributes.width = width;
      this._attributes.height = height;
      this._attributes.viewMode = viewMode;
      this._attributes.desiredBitrate = desiredBitrate;
      this._slot = environmentVars.slot;
      this._videoSlot = environmentVars.videoSlot;

      this.log('initAd ' + width + 'x' + height + ' ' + viewMode + ' ' + desiredBitrate);
      this.renderSlot_();
      this.addButtonListeners_();
      this.fillProperties_();
      _trigger2.default.call(this, 'AdLoaded');
    }
  }, {
    key: 'resizeAd',
    value: function resizeAd(width, height, viewMode) {
      _get(Object.getPrototypeOf(VpaidAdInspector.prototype), 'resizeAd', this).call(this, width, height, viewMode);
      this.log('resizeAd ' + width + 'x' + height + ' ' + viewMode);
      this._attributes.width = width;
      this._attributes.height = height;
      this._attributes.viewMode = viewMode;
      this.fillProperties_();
      _trigger2.default.call(this, 'AdSizeChange');
    }
  }, {
    key: 'pauseAd',
    value: function pauseAd() {
      _get(Object.getPrototypeOf(VpaidAdInspector.prototype), 'pauseAd', this).call(this);
      this.log('pauseAd');
    }
  }, {
    key: 'expandAd',
    value: function expandAd() {
      _get(Object.getPrototypeOf(VpaidAdInspector.prototype), 'expandAd', this).call(this);
      this.log('expandAd');
    }
  }, {
    key: 'collapseAd',
    value: function collapseAd() {
      _get(Object.getPrototypeOf(VpaidAdInspector.prototype), 'collapseAd', this).call(this);
      this.log('collapseAd');
    }
  }]);

  return VpaidAdInspector;
}(_linear2.default);

exports.default = VpaidAdInspector;


VpaidAdInspector.prototype.renderSlot_ = function () {
  var slotExists = this._slot && this._slot.tagName === 'DIV';
  if (!slotExists) {
    this._slot = document.createElement('div');
    if (!document.body) {
      document.body = document.createElement('body');
    }
    document.body.appendChild(this._slot);
  }
  this._slot.innerHTML = htmlTemplate;
};

/**
 * Adds all listeners to buttons.
 * @private
 */
VpaidAdInspector.prototype.addButtonListeners_ = function () {
  var eventSelect = document.getElementById('eventSelect');
  eventSelect.addEventListener('change', this.eventSelected_.bind(this));
  var triggerEvent = document.getElementById('triggerEvent');
  triggerEvent.addEventListener('click', this.triggerEvent_.bind(this));
};

/**
 * Triggers an event.
 * @private
 */
VpaidAdInspector.prototype.triggerEvent_ = function () {
  var eventSelect = document.getElementById('eventSelect');
  var value = eventSelect.value;
  if (value === 'AdClickThru') {
    var clickThruUrl = document.getElementById('clickThruUrl').value;
    var clickThruId = document.getElementById('clickThruId').value;
    var clickThruPlayerHandles = document.getElementById('clickThruPlayerHandels').value;
    this.log('AdClickThu(' + clickThruUrl + ',' + clickThruId + ',' + clickThruPlayerHandles + ')');
    _trigger2.default.call(this, 'AdClickThru', [clickThruUrl, clickThruId, clickThruPlayerHandles]);
  } else if (value === 'AdError') {
    var adError = document.getElementById('adErrorMsg').value;
    this.log(value + '(' + adError + ')');
    _trigger2.default.call(this, 'AdError', [adError]);
  } else if (value === 'AdLog') {
    var adLogMsg = document.getElementById('adLogMsg').value;
    this.log(value + '(' + adLogMsg + ')');
    _trigger2.default.call(this, 'AdLog', [adLogMsg]);
  } else if (value === 'AdInteraction') {
    var adInteraction = document.getElementById('adInteractionId').value;
    this.log(value + '(' + adInteraction + ')');
    _trigger2.default.call(this, 'AdInteraction', [adInteraction]);
  } else {
    this.log(value + '()');
    _trigger2.default.call(this, value);
  }
};

/**
 * Logs events and messages.
 *
 * @param {string} message
 */
VpaidAdInspector.prototype.log = function (message) {
  var logTextArea = document.getElementById('lastVpaidEvent');
  if (logTextArea != null) {
    logTextArea.value = message;
  }
};

/**
 * Callback function when an event is selected from the dropdown.
 *
 * @private
 */
VpaidAdInspector.prototype.eventSelected_ = function () {
  var clickThruParams = document.getElementById('AdClickThruOptions');
  var adErrorParams = document.getElementById('AdErrorOptions');
  var adLogParams = document.getElementById('AdLogOptions');
  var adInteractionParams = document.getElementById('AdInteractionOptions');
  clickThruParams.style.display = 'none';
  adErrorParams.style.display = 'none';
  adLogParams.style.display = 'none';
  adInteractionParams.style.display = 'none';
  var eventSelect = document.getElementById('eventSelect');
  var value = eventSelect.value;
  if (value === 'AdClickThru') {
    clickThruParams.style.display = 'inline';
  } else if (value === 'AdError') {
    adErrorParams.style.display = 'inline';
  } else if (value === 'AdLog') {
    adLogParams.style.display = 'inline';
  } else if (value === 'AdInteraction') {
    adInteractionParams.style.display = 'inline';
  }
};

/**
 * Populates all of the vpaid ad properties.
 *
 * @private
 */
VpaidAdInspector.prototype.fillProperties_ = function () {
  for (var key in this._attributes) {
    if (key && document.getElementById(key)) {
      document.getElementById(key).textContent = this._attributes[key];
    }
  }
};

},{"path":1,"vpaid-ad/src/linear":5,"vpaid-ad/src/trigger":7}]},{},[9]);
