import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Card } from './components/ui/Card';

const CookieBanner = () => {
  const [accepted, setAccepted] = useState(localStorage.getItem('cookiesAccepted') === 'true');
  
  if (accepted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-2xl z-50 flex justify-between items-center">
      <div>
        <h4 className="font-bold text-lg mb-1">We use cookies</h4>
        <p className="text-sm text-gray-300">We use cookies to improve your experience on our site and to analyze site traffic.</p>
      </div>
      <button 
        onClick={() => {
          localStorage.setItem('cookiesAccepted', 'true');
          setAccepted(true);
        }}
        className="bg-garmin-blue hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ml-4"
      >
        Accept All
      </button>
    </div>
  );
};

// Placeholder pages
const PlaceholderPage = ({ title }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <Card><p>This is the {title} page content based on schema data.</p></Card>
  </div>
);

function App() {
  return (
    <Router>
      <CookieBanner />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="activities" element={<PlaceholderPage title="Activities" />} />
          <Route path="nutrition" element={<PlaceholderPage title="Nutrition" />} />
          <Route path="goals" element={<PlaceholderPage title="Goals" />} />
          <Route path="achievements" element={<PlaceholderPage title="Achievements" />} />
          <Route path="devices" element={<PlaceholderPage title="Devices" />} />
          <Route path="health" element={<PlaceholderPage title="Health Metrics" />} />
          <Route path="social" element={<PlaceholderPage title="Social" />} />
          <Route path="trainers" element={<PlaceholderPage title="Trainers" />} />
          <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
          <Route path="profile" element={<PlaceholderPage title="Profile" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
