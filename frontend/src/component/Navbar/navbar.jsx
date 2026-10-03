import React from 'react'
import { Home, BarChart3, Settings, HelpCircle, LogOut } from 'lucide-react';
import "./navbar.css"

const Navbar = ({ onLogout, onNavigate }) => {
  const handleClick = (e, id) => {
    e.preventDefault();
    if (onNavigate) onNavigate(id);
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="brand">Expense Management</div>
        <nav>
          <ul>
            <li><a href="#" onClick={(e) => handleClick(e, 'dashboard')}><Home size={18} /> Dashboard</a></li>
            <li><a href="#" onClick={(e) => handleClick(e, 'analysis')}><BarChart3 size={18} /> Analysis</a></li>
            <li><a href="#" onClick={(e) => handleClick(e, 'help')}><HelpCircle size={18} /> Help</a></li>
            <li><a href="#" onClick={(e) => handleClick(e, 'settings')}><Settings size={18} /> Settings</a></li>
          </ul>
        </nav>
      </div>
      <div className="nav-right">
        <button className="logout" onClick={onLogout}><LogOut size={16} /> Logout</button>
      </div>
    </header>
  )
}

export default Navbar
