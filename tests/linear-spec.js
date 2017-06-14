import VpaidAdInspector from '../src/linear.js'
let vpaid
let slot
let videoSlot
let btn
let lastVpaidEvent
const s = [
  'AdSizeChange',
  'AdExpandedChange',
  'AdVolumeChange'
]
describe('basic', function () {
  before(function () {
    vpaid = new VpaidAdInspector()
    slot = document.createElement('div')
    videoSlot = document.createElement('video')
    document.body.appendChild(slot)
    document.body.appendChild(videoSlot)
  })

  it('should init with a button and emit AdLoaded', function (done) {
    vpaid.subscribe(() => {
      done()
      btn = document.querySelector('#trigger')
      lastVpaidEvent = document.querySelector('#last-vpaid-event')
      expect(btn).to.be.an('object')
      expect(lastVpaidEvent).to.be.an('object')
    }, 'AdLoaded')
    vpaid.initAd(200, 300, 'normal', null, {}, {slot, videoSlot})
  })

  s.forEach((k) => {
    it(`should emit ${k} when clicked`, function (done) {
      document.querySelector(`#eventSelect option[value=${k}]`).selected = true
      vpaid.subscribe((s) => {
        expect(lastVpaidEvent.value).to.equal(`${k}()`)
        done()
      }, k)
      btn.dispatchEvent(new MouseEvent('click'))
    })
  })
})
