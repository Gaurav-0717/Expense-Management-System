import React from 'react';
import './contact.css';

const Contact = () => {
  return (
    <div className="contact-panel">
      <h2>Contact & Support</h2>
      <p className="small">If you need help, email support@example.com or use the form below.</p>

      <div className="card">
        <p><strong>Email:</strong> support@example.com</p>
        <p><strong>Phone:</strong> +1 555 123 4567</p>
      </div>

      <div className="card">
        <h3>Send a message</h3>
        <input placeholder="Your name" />
        <input placeholder="Your email" />
        <textarea placeholder="Describe your issue" rows="4"></textarea>
        <button className="save-btn">Send</button>
      </div>
    </div>
  );
};

export default Contact;
