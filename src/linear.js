import Linear from 'vpaid-ad/src/linear.js'
import htmlTemplate from './harness.html'

function log (evName, args) {
  const logTextArea = document.getElementById('last-vpaid-event')
  if (logTextArea) {
    logTextArea.value = evName
    if (args) {
      logTextArea.value += ' ➠ (' + args.join(', ') + ')'
    }
  }
}

export default class VpaidAdInspector extends Linear {
  initAd (width, height, viewMode, desiredBitrate, creativeData, environmentVars) {
    this._attributes.width = width
    this._attributes.height = height
    this._attributes.viewMode = viewMode
    this._attributes.desiredBitrate = desiredBitrate
    this._slot = environmentVars.slot
    this._videoSlot = environmentVars.videoSlot

    log('initAd', [width + 'x' + height, viewMode, desiredBitrate])
    this.renderSlot_()
    this.ui = {
      eventSelect: document.getElementById('eventSelect'),
      trigger: document.getElementById('trigger')
    }
    this.ui.eventSelect.addEventListener('change', this.eventSelected_.bind(this))
    this.ui.trigger.addEventListener('click', this.trigger_.bind(this))
    this.fillProperties_()
    this.emit('AdLoaded')
  }

  resizeAd (width, height, viewMode) {
    super.resizeAd(width, height, viewMode)
    log('resizeAd', [width + 'x' + height, viewMode])
    this._attributes.width = width
    this._attributes.height = height
    this._attributes.viewMode = viewMode
    this.fillProperties_()
    this.emit('AdSizeChange')
  }

  pauseAd () {
    super.pauseAd()
    log('pauseAd')
  }

  expandAd () {
    super.expandAd()
    log('expandAd')
  }

  collapseAd () {
    super.collapseAd()
    log('collapseAd')
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
 * Triggers an event.
 * @private
 */
VpaidAdInspector.prototype.trigger_ = function () {
  var eventSelect = document.getElementById('eventSelect')
  var value = eventSelect.value
  if (value === 'AdClickThru') {
    const clickThruUrl = document.getElementById('clickThruUrl').value
    const clickThruId = document.getElementById('clickThruId').value
    const clickThruPlayerHandles = document.getElementById('clickThruPlayerHandels').value
    log('AdClickThru', [
      clickThruUrl,
      clickThruId,
      clickThruPlayerHandles
    ])
    this.emit('AdClickThru', [
      clickThruUrl,
      clickThruId,
      clickThruPlayerHandles
    ])
  } else if (value === 'AdError') {
    const adError = document.getElementById('adErrorMsg').value
    log(value, [adError])
    this.emit(value, [adError])
  } else if (value === 'AdLog') {
    const adLogMsg = document.getElementById('adLogMsg').value
    log(value, [adLogMsg])
    this.emit(value, [adLogMsg])
  } else if (value === 'AdInteraction') {
    const adInteraction = document.getElementById('adInteractionId').value
    log(value, [adInteraction])
    this.emit(value, [adInteraction])
  } else {
    log(value)
    this.emit(value)
  }
}

/**
 * Callback function when an event is selected from the dropdown.
 *
 * @private
 */
VpaidAdInspector.prototype.eventSelected_ = function () {
  const clickThruParams = document.getElementById('AdClickThruOptions')
  const adErrorParams = document.getElementById('AdErrorOptions')
  const adLogParams = document.getElementById('AdLogOptions')
  const adInteractionParams = document.getElementById('AdInteractionOptions')
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
