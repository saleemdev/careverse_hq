import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import 'dayjs/locale/en'
import './index.css'
import App from './App.tsx'

// Leaflet CSS and marker icon fix
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found!')
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ConfigProvider theme={theme} locale={enUS}>
        <App />
      </ConfigProvider>
    </StrictMode>,
  )
}
