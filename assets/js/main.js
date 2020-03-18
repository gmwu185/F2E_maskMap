var _data = {
  jsonData: {}, // AJAX 取得資料
  positions:{
    default: { // 預設地理位置
      lat: 24.1338065,
      lon: 120.658394,
      name: '臺中市'
    },
    get: { // 透過服務另外取得或更動地位理位置
      lat: '',
      lon: '',
      name: ''
    },
  },
  iconTypeFilePath: { // 圖標圖示路徑
    anchor: './assets/img/marker-icon-2x-anchor.png',
    greenIcon: './assets/img/marker-icon-2x-green.png', 
    redIcon: './assets/img/marker-icon-2x-red.png', 
    violetIcon: './assets/img/marker-icon-2x-violet.png', 
    greyIcon: './assets/img/marker-icon-2x-grey.png', 
  },
};

/** DOM 元素 */
var mapEL = document.getElementById('map');


/** Geolocation API 取得裝置的地理位置
 */
function getGeolocation() {
	if (navigator.geolocation) {
    // 瀏覽器或裝置可使用 Geolocation API
    navigator.geolocation.getCurrentPosition(success, error);
    function success(position) {
      // console.log('navigator position', position);
      _data.positions.get.lat = position.coords.latitude;
      _data.positions.get.lon = position.coords.longitude;
      console.log(
        'getCurrentPosition() position.lat', _data.positions.get.lat, 
        'getCurrentPosition() position.lon', _data.positions.get.lon
      );
      getIPLocation();
      renderMap( _data.positions.get.lat, _data.positions.get.lon, _data.jsonData);
      lodeAnimation();
    };
    function error() {
      renderMap(_data.positions.default.lat, _data.positions.default.lon, _data.jsonData);
      lodeAnimation();
    };
	} else {
    // 瀏灠器無法使用 Geolocation API 由裝置IP來取得使用者的地理位置。
    getIPLocation();
    renderMap( _data.positions.get.lat, _data.positions.get.lon, _data.jsonData);
    lodeAnimation();
  }
}

/** ipinfo.io (https://ipinfo.io/developers) 取得使用者的地理位置
 * 定位較為精準，服務無法連續呼叫使用 IP 會被鎖
 * 資料來源一：[ipinfo.io - jQuery 取得使用者地理位置](https://codepen.io/meyu/pen/pPeBzx)
 * 資料來源二：[用 https://ipinfo.io/ 檢查IP來源](http://itopnet.blogspot.com/2018/06/httpsipinfoio-ip.html ) 文章介紹 (https://ipinfo.io/168.95.1.1/json) 直接由瀏覽器開啟 JSON 頁面，裡面會有使用者的地理位置資料，'168.95.1.1' -> 中華電信 DNS 加速。
 * 會有 CORS 無法取得 AJAX 資料，透過代理伺服器 (https://cors-anywhere.herokuapp.com/) 處理。
*/
function getIPLocation() {
  var corsUrl = 'https://cors-anywhere.herokuapp.com/';
  var url = "https://ipinfo.io/168.95.1.1/json";
  var xhr = new XMLHttpRequest();
  xhr.open(
    "get",
    corsUrl+url,
  );
  xhr.send();
  xhr.onload = function(){
    ipJsonData = JSON.parse(xhr.responseText);
    var locSplit = ipJsonData.loc.split(',');
    _data.positions.get.lat = parseFloat(locSplit[0]);
    _data.positions.get.lon = parseFloat(locSplit[1]);
    console.log(
      'parseFloat(locSplit[0])', parseFloat(locSplit[0]),
      'parseFloat(locSplit[1])', parseFloat(locSplit[1])
    );
  }
};


/* components
-------------------------------------------------- */

function bindMenu() {
  document.querySelector('.js-toggleMenu__btn').addEventListener( 'click', function(e) { 
    this.parentNode.classList.toggle('js-toggleMenu--switch');
    mapEL.classList.toggle('js-map--switch');
  });
}

function lodeAnimation(){
  var lodeEL = document.querySelector('.js-load');
  var zIndexZero = function (){
    setTimeout(function(){
      lodeEL.setAttribute("style", "opacity: 0; z-index: 0;");
    }, 1000);
  }
  var opacityZero = function(callback){
    lodeEL.setAttribute("style", "opacity: 0;");
    typeof callback === 'function' ? callback() : ''
  }
  opacityZero(zIndexZero);
}

/* End of components
-------------------------------------------------- */


/** 
  * @param iconPath string 不同狀態圖示圖片路徑
*/
function makeMarkerIconFn( iconPath ) {
  var iconFormat = {
    iconUrl: iconPath,
    shadowUrl: './assets/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  };
  return new L.Icon( iconFormat );
};


/** 使用地圖框架 (leaflet) 與圖資服務 (OSM) 執行渲染畫面
  * @param lat 緯度(LatLng)
  * @param lon 經度(Longitude)
  * @param data AJAX 取得後傳入的資料
*/
function renderMap(lat, lon, data){

  var map = L.map(mapEL, {
    center: [lat, lon],
    zoom: 16 // zoom 地圖最大可放大到 18
  });
  
  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  ).addTo(map);
  
  // 使用 leaflet 框架原生 marker() 圖層加入定位點圖示，不使用 MarkerClusterGroup 才不會被群化。
  L.marker(
    [ lat, lon ], 
    { 
      icon: makeMarkerIconFn( _data.iconTypeFilePath.anchor ),
      clickable: false, // 可點擊
      // draggable: true, // 可拖移
    }
  ).addTo(map)

  var markers = new L.MarkerClusterGroup();

  for( let i=0; i<data.length; i++ ){
    var maskIconType;
    if( data[i].properties.mask_adult !== 0 && data[i].properties.mask_child !== 0){
      // 成人與小孩都有 -> greenIcon
      maskIconType = makeMarkerIconFn( _data.iconTypeFilePath.greenIcon );
    } else if ( data[i].properties.mask_adult == 0 && data[i].properties.mask_child == 0 ) {
      // 成人與小孩都沒有 -> greyIcon
      maskIconType = makeMarkerIconFn( _data.iconTypeFilePath.greyIcon );
    } else if ( data[i].properties.mask_child == 0 ) {
      // 小孩 == 0 -> redIcon
      maskIconType = makeMarkerIconFn( _data.iconTypeFilePath.redIcon );
    } else if ( data[i].properties.mask_adult == 0 ) {
      // 成人 == 0 -> violetIcon
      maskIconType = makeMarkerIconFn( _data.iconTypeFilePath.violetIcon );
    }
    markers
      .addLayer(
        L.marker(
            [ data[i].geometry.coordinates[1], data[i].geometry.coordinates[0] ], 
            { icon: maskIconType }
          )
          .bindPopup(`
            <div style='text-align: center;'>
              <h1>${ data[i].properties.name }</h1>
              <p>
                成人口罩數量：${data[i].properties.mask_adult} <br>
                小孩口罩數量：${data[i].properties.mask_child} <br>
                地址：${data[i].properties.address} 
              </p>
            </div>
          `)
      )
  };

  // 輸出方式選一種
  // markers.addTo(map);
  map.addLayer(markers);
};

function init() {
  var xhr = new XMLHttpRequest();
  xhr.open(
    "get",
    // 取得資料於遠端
    "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json",
    // 取得資料於本地端
    // "data/points.json"
  );
  xhr.send();
  xhr.onload = function(){
    if (xhr.readyState === 4 && xhr.status === 200) {
      _data.jsonData = JSON.parse(xhr.responseText).features;
      bindMenu();
      getGeolocation();
    };
  };
  // 畫面初始化執行函式
  // window.onload = function(){};
};
init();