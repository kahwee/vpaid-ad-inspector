import 'babel-polyfill'
import VpaidAd from './linear'
window.getVPAIDAd = function () {
  return new VpaidAd()
}
