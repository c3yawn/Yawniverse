import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CampaignPage from './pages/CampaignPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/campaign/:systemId/:campaignId" element={<CampaignPage />} />
    </Routes>
  );
}
