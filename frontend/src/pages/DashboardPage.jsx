import React from 'react';
import Dashboard from '../component/Dashboard/dashboard';

const DashboardPage = ({ profile, onLogout }) => {
  return <Dashboard profile={profile} onLogout={onLogout} />;
};

export default DashboardPage;
