'use client';
import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import styles from './index.module.css';

export interface MapContainerProps {
  positionList: number[][];
  position?: number[];
}

export default function MapContainer({ positionList, position }: MapContainerProps) {
  const AMapRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  const LabelsData = positionList.map((position, index) => ({
    // name: '',
    position,
    // zooms: [3, 20],
    zooms: [1, 20],
    opacity: 1,
    zIndex: 10,
    icon: {
      type: 'image',
      // marker 1 ~ 10: line 4
      // marker 11 ~ 20: line 5
      image: 'https://a.amap.com/jsapi_demos/static/images/poi-marker.png',
      clipOrigin: [14 + 88 * (index % 10), 4 + 88 * (index >= 10 ? 4 : 3)],
      clipSize: [50, 68],
      size: [25, 34],
      anchor: 'bottom-center',
      angel: 0,
      retina: true,
    },
    text: {
      // content: '',
      direction: 'top',
      offset: [0, 0],
      style: {
        // fontSize: 15,
        // fontWeight: 'normal',
        // fillColor: '#333',
        // strokeColor: '#fff',
        // strokeWidth: 2,
        //
        fontSize: 13,
        fillColor: '#fff',
        padding: [2, 5, 2, 5],
        backgroundColor: '#22884f',
      },
    },
    extData: {
      index,
    },
  }));

  useEffect(() => {
    AMapLoader.load({
      key: process.env.NEXT_PUBLIC_AMAP_KEY,
      version: '1.4.15',
      plugins: ['AMap.Geolocation'],
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        const map = new AMap.Map('map-container', {
          zoom: 9,
          resizeEnable: true,
        });
        mapRef.current = map;
        const geolocation = new AMap.Geolocation({
          showButton: true, //是否显示定位按钮
          buttonPosition: 'LB', //定位按钮的位置
          /* LT LB RT RB */
          buttonOffset: new AMap.Pixel(10, 20), //定位按钮距离对应角落的距离
          showMarker: true, //是否显示定位点
          markerOptions: {
            //自定义定位点样式，同Marker的Options
            offset: new AMap.Pixel(-18, -36),
            content:
              '<img src="https://a.amap.com/jsapi_demos/static/resource/img/user.png" style="width:36px;height:36px"/>',
          },
          showCircle: true, //是否显示定位精度圈
          circleOptions: {
            //定位精度圈的样式
            strokeColor: '#0093FF',
            noSelect: true,
            strokeOpacity: 0.5,
            strokeWeight: 1,
            fillColor: '#02B0FF',
            fillOpacity: 0.25,
          },
        });
        map.addControl(geolocation);
        geolocation.getCurrentPosition();
        map.setFitView();
      })
      .catch((e) => {
        console.error(e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    const AMap = AMapRef.current;
    const map = mapRef.current;
    const prevLayer = layerRef.current;
    if (AMap && map) {
      if (prevLayer) {
        prevLayer.setMap(null);
      }
      const layer = new AMap.LabelsLayer({
        zooms: [1, 20],
        zIndex: 1000,
        // 开启标注避让，默认为开启，v1.4.15 新增属性
        // collision: true,
        // 开启标注淡入动画，默认为开启，v1.4.15 新增属性
        animation: true,
      });
      layerRef.current = layer;
      map.add(layer);
      const labelMarkers = LabelsData.map((item) => new AMap.LabelMarker(item));
      layer.add(labelMarkers);
      map.setFitView();
    }
  }, [positionList.map((item) => item.join(',')).join(';')]);

  return <div id="map-container" className={styles.container} />;
}
