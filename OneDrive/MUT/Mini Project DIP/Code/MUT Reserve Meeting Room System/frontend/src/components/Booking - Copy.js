import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Booking = () => {
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingDetails, setBookingDetails] = useState({
        bookingDate: '',
        startTime: '',
        endTime: '',
        purposeOfUse: ''
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    // ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            navigate('/login');
        }
    }, [navigate]);

    // ดึงข้อมูลห้องประชุมทั้งหมดจากฐานข้อมูล
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch('http://localhost:3000/rooms');
                const data = await response.json();
                setRooms(data);
            } catch (error) {
                console.error('Error fetching rooms:', error);
            }
        };

        fetchRooms();
    }, []);

    // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลการจอง
    const handleChange = (e) => {
        setBookingDetails({
            ...bookingDetails,
            [e.target.name]: e.target.value
        });
    };

    // ฟังก์ชันเมื่อผู้ใช้กดปุ่ม "จอง"
    const handleBookRoom = async (roomId) => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            setErrorMessage('Please login before booking.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...bookingDetails,
                    roomId,
                    userId
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(`Booking successful for Room ID: ${roomId}`);
            } else {
                setErrorMessage(data.error || 'Failed to book room.');
            }
        } catch (error) {
            setErrorMessage('Something went wrong. Please try again.');
        }
    };

    return (
        <div>
            <h1>Booking a Room</h1>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            <form>
                <div>
                    <label>Booking Date:</label>
                    <input
                        type="date"
                        name="bookingDate"
                        value={bookingDetails.bookingDate}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Start Time:</label>
                    <input
                        type="time"
                        name="startTime"
                        value={bookingDetails.startTime}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>End Time:</label>
                    <input
                        type="time"
                        name="endTime"
                        value={bookingDetails.endTime}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Purpose of Use:</label>
                    <textarea
                        name="purposeOfUse"
                        value={bookingDetails.purposeOfUse}
                        onChange={handleChange}
                        required
                    />
                </div>
            </form>

            <h2>Available Rooms</h2>
            <ul>
                {rooms.map((room) => (
                    <li key={room.RoomID}>
                        <strong>{room.RoomName}</strong> (Room ID: {room.RoomID})
                        <button onClick={() => handleBookRoom(room.RoomID)}>Book</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Booking;
