import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';
import '@/styles/globals.css';
import { initializeStorage } from '@/storage';

initializeStorage();

createRoot(document.getElementById('root')!).render(<Popup />);
