import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos/principal.css'
import Aplicacion from './Aplicacion.jsx'

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <Aplicacion />
  </StrictMode>,
)
