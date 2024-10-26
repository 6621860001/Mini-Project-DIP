import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MainScreen = () => {
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();
    const [loggedIn, setLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');

    // ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const name = localStorage.getItem('userName');
        console.log("userId:", userId, "userName:", name);  // เพิ่ม log เพื่อตรวจสอบค่า
        if (userId) {
            setLoggedIn(true);
            setUserName(name);  // ดึงชื่อผู้ใช้จาก localStorage
        }
    }, []);

    // ฟังก์ชันนำไปสู่หน้าจอ login ถ้าไม่ล็อกอิน
    const handleBooking = (roomId) => {
        if (!loggedIn) {
            navigate('/login');  // ถ้าไม่ได้ล็อกอิน ให้ไปหน้า login
        } else {
            navigate(`/booking/${roomId}`);  // ถ้าล็อกอินแล้ว ไปหน้าจอเลือกเวลา
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleSignUp = () => {
        navigate('/signup');
    };

    useEffect(() => {
        // ฟังก์ชันดึงข้อมูลห้องประชุมจาก API
        const fetchRooms = async () => {
            try {
                const response = await fetch('http://localhost:3000/rooms');
                const data = await response.json();
                setRooms(data);  // บันทึกข้อมูลห้องประชุม
            } catch (error) {
                console.error('Error fetching rooms:', error);
            }
        };

        fetchRooms();
    }, []);

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                {!loggedIn ? (
                    <>
                        <button onClick={handleLogin}>Login</button>
                        <button onClick={handleSignUp}>Sign Up</button>
                    </>
                ) : (
                    <p>Welcome, {userName}!</p>  // แสดงชื่อผู้ใช้ถ้าล็อกอินแล้ว
                )}
            </div>

            <h1>Meeting Rooms</h1>
            {rooms.map((room) => (
                <div key={room.RoomID} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                    <h2>{room.RoomName}</h2>
                    <img src={room.RoomImage} alt={room.RoomName} style={{ width: '100%', height: '200px' }} />
                    <p>Max Capacity: {room.Capacity}</p>
                    <button onClick={() => handleBooking(room.RoomID)}>Book</button>
                </div>
            ))}
        </div>
    );
};

export default MainScreen;
