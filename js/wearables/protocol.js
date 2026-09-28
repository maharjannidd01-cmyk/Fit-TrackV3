/* FitTrack Pro v14 — wearable protocol definitions/parsers. */
(function(){
  const FT=window.FitTrack=window.FitTrack||{};
  const BLE_UUID={deviceInfo:'180A',battery:'180F',heartRate:'180D',batteryLevel:'2A19',heartRateMeasurement:'2A37',manufacturer:'2A29',model:'2A24'};
  function parseHeartRate(value){try{const flags=value.getUint8(0),sixteen=flags&1,bpm=sixteen?value.getUint16(1,true):value.getUint8(1);return bpm>0&&bpm<240?bpm:null}catch(e){return null}}
  function supportedMethods({bluetooth=false,secure=false,android=false}={}){return{ble:!!(bluetooth&&secure),healthConnect:!!android,noiseFit:'companion'}}
  FT.register('wearables',{BLE_UUID,parseHeartRate,supportedMethods});
})();
