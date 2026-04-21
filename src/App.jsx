import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CampaignPage from './pages/CampaignPage';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/campaign/:systemId/:campaignId" element={<CampaignPage />} />
      </Routes>
    </>
  );
}
