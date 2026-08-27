import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { Org } from '../types';
import { coordsForCity, PILOT_AREA_CENTER } from '../lib/cityCoords';

// Vite doesn't resolve Leaflet's default marker icon URLs correctly out of
// the box — this is the standard fix (see react-leaflet docs/issues).
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface MapViewProps {
  orgs: Org[];
}

const POPUP_PREVIEW_COUNT = 8;

export function MapView({ orgs }: MapViewProps) {
  const byCity = new Map<string, Org[]>();
  for (const org of orgs) {
    const coords = coordsForCity(org.city);
    if (!coords) continue;
    const key = org.city.toLowerCase();
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key)!.push(org);
  }

  return (
    <MapContainer center={PILOT_AREA_CENTER} zoom={10} className="map-view" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {[...byCity.entries()].map(([cityKey, cityOrgs]) => {
        const coords = coordsForCity(cityKey);
        if (!coords) return null;
        return (
          <Marker key={cityKey} position={coords}>
            <Popup>
              <strong>{cityOrgs[0].city}</strong> — {cityOrgs.length} nonprofit{cityOrgs.length === 1 ? '' : 's'}
              <ul>
                {cityOrgs.slice(0, POPUP_PREVIEW_COUNT).map((org) => (
                  <li key={org.id}>{org.name}</li>
                ))}
              </ul>
              {cityOrgs.length > POPUP_PREVIEW_COUNT && (
                <em>+{cityOrgs.length - POPUP_PREVIEW_COUNT} more — use search to see all</em>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
