import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface FacilityMapProps {
    latitude: number;
    longitude: number;
    facilityName: string;
    height?: string | number;
}

const FacilityMap: React.FC<FacilityMapProps> = ({
    latitude,
    longitude,
    facilityName,
    height = 400,
}) => {
    return (
        <div style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer
                center={[latitude, longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[latitude, longitude]}>
                    <Popup>
                        <strong>{facilityName}</strong>
                        <br />
                        Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default FacilityMap;
