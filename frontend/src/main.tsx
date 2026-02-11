import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import 'dayjs/locale/en'
import './index.css'
import App from './App.tsx'

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
