import React from 'react';
import Settings from '../component/Settings/settings';

const SettingsPage = ({ profile, onProfileUpdate }) => <Settings profile={profile} onProfileUpdate={onProfileUpdate} />;
export default SettingsPage;
