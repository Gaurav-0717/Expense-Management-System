import React from 'react';
import './help.css';

const Help = () => {
  return (
    <div className="help-panel">
      <h2>Help & FAQ</h2>
      <div className="card">
        <h3>How do I add an expense?</h3>
        <p>Use the form on the left of the Dashboard to add a new expense. Fill amount, category and date, then click Save.</p>
      </div>
      <div className="card">
        <h3>How do I change my profile?</h3>
        <p>Go to Settings to update your display name and other preferences.</p>
      </div>
      <div className="card">
        <h3>Contact Support</h3>
        <p>Email support@example.com or use the contact form in Contact page.</p>
      </div>
    </div>
  );
};

export default Help;
