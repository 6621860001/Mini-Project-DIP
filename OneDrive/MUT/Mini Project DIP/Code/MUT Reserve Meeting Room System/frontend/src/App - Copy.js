import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Login from './components/Login';
import Booking from './components/Booking';
import RoomManagement from './components/RoomManagement';

const Home = () => {
    return (
        <div>
            <h1>Welcome to MUT Reserve Meeting Room System</h1>
            <p>Please select a menu to navigate through the system.</p>
            <nav>
                <ul>
                    <li>
                        <Link to="/login">Login</Link>
                    </li>
                    <li>
                        <Link to="/booking">Booking</Link>
                    </li>
                    <li>
                        <Link to="/room-management">Room Management</Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/room-management" element={<RoomManagement />} />
            </Routes>
        </Router>
    );
};

export default App;
