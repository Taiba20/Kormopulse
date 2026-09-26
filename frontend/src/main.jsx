import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from './store/store';
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Only wrap with the provider when a client id is configured: it starts loading Google's
// script as soon as it mounts, which is pointless (and noisy in the console) without one.
const Root = (
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{Root}</GoogleOAuthProvider> : Root}
  </StrictMode>,
);
