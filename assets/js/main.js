// 預設位置
var _data = {
  jsonData: {},
  positions:{
    default: {
      lat: 24.1338065,
      lon: 120.658394,
      name: '臺中市'
    },
    get: {
      lat: '',
      lon: '',
      name: ''
    },
  },
  iconTypePath: {
    anchor: './assets/img/marker-icon-2x-anchor.png',
    greenIcon: './assets/img/marker-icon-2x-green.png', 
    redIcon: './assets/img/marker-icon-2x-red.png', 
    violetIcon: './assets/img/marker-icon-2x-violet.png', 
    greyIcon: './assets/img/marker-icon-2x-grey.png', 
  },
};

function ajaxFn(){
  var xhr = new XMLHttpRequest();
  // 取得資料於本地端
  // xhr.open("get", "data/points.json");
  // 取得資料於遠端
  xhr.open(
    "get",
    "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json"
  );
  xhr.send();
  xhr.onload = function(e){
    if (xhr.readyState === 4 && xhr.status === 200) {
      _data.jsonData = JSON.parse(xhr.responseText).features;
    }
  };
};

// 取得裝置的地理位置
function getLocation() {
	if (navigator.geolocation) {
    function success(position) {
      // console.log('navigator position', position);
      _data.positions.get.lat = position.coords.latitude;
      _data.positions.get.lon = position.coords.longitude;
      // console.log(
      //   'getCurrentPosition() position.lat', _data.positions.get.lat, 
      //   'getCurrentPosition() position.lon', _data.positions.get.lon
      // );
      renderMap( _data.positions.get.lat, _data.positions.get.lon, _data.jsonData);
    };
    function error(position) {
      renderMap(_data.positions.default.lat, _data.positions.default.lon, _data.jsonData);
    };
    navigator.geolocation.getCurrentPosition(success, error);
	} else {
    /** 瀏灠器無法使用 Geolocation API
      * 由裝置IP來取得使用者的地理位置。採用 ipinfo.io 方案 (https://ipinfo.io/developers)
    */
    // function getIPLocation() {
    //   var corsUrl = 'https://cors-anywhere.herokuapp.com/';
    //   var url = "https://ipinfo.io"
    //   $.getJSON(url, function(data) {
    //     console.log('data', data);
    //     var loc = data.loc.split(',');
    //     position.lat = parseFloat(loc[0]);
    //     position.lon = parseFloat(loc[1]);
    //     console.log('getJSON position.lat', position.lat);
    //     console.log('getJSON position.lon', position.lon);
    //   })
    //     .fail(function() {
    //       alert("不知道在那理，ipinfo.io 取不到地理座標位置");
    //       // renderMap(position.lat, position.lon);
    //     })
    //     .always(function() {
          
    //     });
    // };
    // getIPLocation();
	}
}




/** 使用地圖框架 (leaflet) 與圖資服務 (OSM) 執行渲染畫面
  * @param lat 緯度(LatLng)
  * @param lon 經度(Longitude)
  * @param data AJAX 取得後傳入的資料
*/
function renderMap(lat, lon, data){
  
  var map = L.map('map', {
    center: [lat, lon],
    zoom: 16 // zoom 地圖最大可放大到 18
  });
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  

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

  // 使用 leaflet 框架原生圖層加入定位點圖示
  map.addLayer(
    L.marker(
      [ lat, lon ], 
      { icon: makeMarkerIconFn( _data.iconTypePath.anchor ) }
    )
  );

  var markers = new L.MarkerClusterGroup().addTo(map);

  for( let i=0; i<data.length; i++ ){
    var maskIconType;
    if( data[i].properties.mask_adult !== 0 && data[i].properties.mask_child !== 0){
      // 成人與小孩都有 -> greenIcon
      maskIconType = makeMarkerIconFn( _data.iconTypePath.greenIcon );
    } else if ( data[i].properties.mask_adult == 0 && data[i].properties.mask_child == 0 ) {
      // 成人與小孩都沒有 -> greyIcon
      maskIconType = makeMarkerIconFn( _data.iconTypePath.greyIcon );
    } else if ( data[i].properties.mask_child == 0 ) {
      // 小孩 == 0 -> redIcon
      maskIconType = makeMarkerIconFn( _data.iconTypePath.redIcon );
    } else if ( data[i].properties.mask_adult == 0 ) {
      // 成人 == 0 -> violetIcon
      maskIconType = makeMarkerIconFn( _data.iconTypePath.violetIcon );
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
  // map.addLayer(markers);
};

function init() {
  ajaxFn();
  getLocation();
  // 畫面初始化執行函式
  // window.onload = function(){};
};
init();