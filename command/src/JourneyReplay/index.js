import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// 🚗 Custom icon
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
});

export default function JourneyReplay() {
  const route = [
    [12.9716, 77.5946],
    [12.9750, 77.6000],
    [12.9780, 77.6050],
    [12.9820, 77.6100],
  ];

  const [position, setPosition] = useState(route[0]);
  const indexRef = useRef(0);

  useEffect(() => {
    let animation;
    function animate() {
      if (indexRef.current < route.length) {
        setPosition(route[indexRef.current]);
        indexRef.current++;
        animation = setTimeout(animate, 1000);
      }
    }
    animate();
    return () => clearTimeout(animation);
  }, [route]);

  return (
    <MapContainer
      center={route[0]}
      zoom={14}
      style={{ height: "100vh", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* Route line */}
      <Polyline positions={route} color="blue" />

      {/* Moving marker */}
      <Marker position={position} icon={carIcon}>
        <Popup>Journey Replay 🚗</Popup>
      </Marker>
    </MapContainer>
  );
}
