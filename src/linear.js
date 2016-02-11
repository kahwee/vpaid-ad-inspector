import Linear from 'vpaid-ad/src/linear'
import $trigger from 'vpaid-ad/src/trigger'
const path = require('path')
const fs = require('fs')
const htmlTemplate = fs.readFileSync(path.join(__dirname, 'harness.html'), {
  encoding: 'utf8'
})

export default class VpaidAdInspector extends Linear {

  initAd (width, height, viewMode, desiredBitrate, creativeData, environmentVars) {
    this._attributes.width = width
    this._attributes.height = height
    this._attributes.viewMode = viewMode
    this._attributes.desiredBitrate = desiredBitrate
    this._slot = environmentVars.slot
    this._videoSlot = environmentVars.videoSlot

    this.log('initAd ' + width + 'x' + height + ' ' + viewMode + ' ' + desiredBitrate)
    this.renderSlot_()
    this.addButtonListeners_()
    this.fillProperties_()
    $trigger.call(this, 'AdLoaded')
  }

  resizeAd (width, height, viewMode) {
    super.resizeAd(width, height, viewMode)
    this.log('resizeAd ' + width + 'x' + height + ' ' + viewMode)
    this._attributes.width = width
    this._attributes.height = height
    this._attributes.viewMode = viewMode
    this.fillProperties_()
    $trigger.call(this, 'AdSizeChange')
  }

  pauseAd () {
    super.pauseAd()
    this.log('pauseAd')
  }

  expandAd () {
    super.expandAd()
    this.log('expandAd')
  }

  collapseAd () {
    super.collapseAd()
    this.log('collapseAd')
  }
}

VpaidAdInspector.prototype.renderSlot_ = function () {
  var slotExists = this._slot && this._slot.tagName === 'DIV'
  if (!slotExists) {
    this._slot = document.createElement('div')
    if (!document.body) {
      document.body = document.createElement('body')
    }
    document.body.appendChild(this._slot)
  }
  this._slot.innerHTML = htmlTemplate
}

/**
 * Adds all listeners to buttons.
 * @private
 */
VpaidAdInspector.prototype.addButtonListeners_ = function () {
  var eventSelect = document.getElementById('eventSelect')
  eventSelect.addEventListener('change', this.eventSelected_.bind(this))
  var triggerEvent = document.getElementById('triggerEvent')
  triggerEvent.addEventListener('click', this.triggerEvent_.bind(this))
}

/**
 * Triggers an event.
 * @private
 */
VpaidAdInspector.prototype.triggerEvent_ = function () {
  var eventSelect = document.getElementById('eventSelect')
  var value = eventSelect.value
  if (value === 'AdClickThru') {
    const clickThruUrl = document.getElementById('clickThruUrl').value
    const clickThruId = document.getElementById('clickThruId').value
    const clickThruPlayerHandles = document.getElementById('clickThruPlayerHandels').value
    this.log('AdClickThu(' + clickThruUrl + ',' + clickThruId + ',' + clickThruPlayerHandles + ')')
    $trigger.call(this, 'AdClickThru', [
      clickThruUrl,
      clickThruId,
      clickThruPlayerHandles
    ])
  } else if (value === 'AdError') {
    const adError = document.getElementById('adErrorMsg').value
    this.log(`${value}(${adError})`)
    $trigger.call(this, 'AdError', [adError])
  } else if (value === 'AdLog') {
    const adLogMsg = document.getElementById('adLogMsg').value
    this.log(`${value}(${adLogMsg})`)
    $trigger.call(this, 'AdLog', [adLogMsg])
  } else if (value === 'AdInteraction') {
    const adInteraction = document.getElementById('adInteractionId').value
    this.log(`${value}(${adInteraction})`)
    $trigger.call(this, 'AdInteraction', [adInteraction])
  } else {
    this.log(`${value}()`)
    $trigger.call(this, value)
  }
}

/**
 * Logs events and messages.
 *
 * @param {string} message
 */
VpaidAdInspector.prototype.log = function (message) {
  const logTextArea = document.getElementById('lastVpaidEvent')
  if (logTextArea != null) {
    logTextArea.value = message
  }
}

/**
 * Callback function when an event is selected from the dropdown.
 *
 * @private
 */
VpaidAdInspector.prototype.eventSelected_ = function () {
  var clickThruParams = document.getElementById('AdClickThruOptions')
  var adErrorParams = document.getElementById('AdErrorOptions')
  var adLogParams = document.getElementById('AdLogOptions')
  var adInteractionParams = document.getElementById('AdInteractionOptions')
  clickThruParams.style.display = 'none'
  adErrorParams.style.display = 'none'
  adLogParams.style.display = 'none'
  adInteractionParams.style.display = 'none'
  var eventSelect = document.getElementById('eventSelect')
  var value = eventSelect.value
  if (value === 'AdClickThru') {
    clickThruParams.style.display = 'inline'
  } else if (value === 'AdError') {
    adErrorParams.style.display = 'inline'
  } else if (value === 'AdLog') {
    adLogParams.style.display = 'inline'
  } else if (value === 'AdInteraction') {
    adInteractionParams.style.display = 'inline'
  }
}

/**
 * Populates all of the vpaid ad properties.
 *
 * @private
 */
VpaidAdInspector.prototype.fillProperties_ = function () {
  for (const key in this._attributes) {
    if (key && document.getElementById(key)) {
      document.getElementById(key).textContent = this._attributes[key]
    }
  }
}
