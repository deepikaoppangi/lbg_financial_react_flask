import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import { fetchProfiles, fetchSnapshot } from './utils/api';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState('james_thompson');
  const [period, setPeriod] = useState('6M');
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length > 0) {
      loadSnapshot();
    }
  }, [currentProfile, period, profiles]);

  const loadProfiles = async () => {
    try {
      const data = await fetchProfiles();
      setProfiles(data.profiles || []);
      if (data.profiles && data.profiles.length > 0) {
        setCurrentProfile(data.profiles[0].id);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const data = await fetchSnapshot(period, '', currentProfile);
      setSnapshot(data.snapshot);
    } catch (error) {
      console.error('Error loading snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (profileId) => {
    setCurrentProfile(profileId);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const getCurrentProfileName = () => {
    const profile = profiles.find(p => p.id === currentProfile);
    return profile ? profile.name : 'Financial Wellbeing';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#f8faf9] to-[#f0f7f3]">
      <Header
        title={getCurrentProfileName()}
        profiles={profiles}
        currentProfile={currentProfile}
        period={period}
        onProfileChange={handleProfileChange}
        onPeriodChange={handlePeriodChange}
      />
      <main className="flex-1 overflow-hidden p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 border-4 border-lbg-green-pale border-t-lbg-salem rounded-full animate-spin"></div>
            <p className="text-lbg-grey-600 text-sm">Loading financial data...</p>
          </div>
        ) : (
          <Dashboard
            snapshot={snapshot}
            period={period}
            currentProfile={currentProfile}
          />
        )}
      </main>
    </div>
  );
}

export default App;
