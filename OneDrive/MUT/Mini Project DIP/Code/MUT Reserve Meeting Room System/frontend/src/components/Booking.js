import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const Booking = () => {
    const { roomId } = useParams();  // รับ roomId จาก URL
    const navigate = useNavigate();
    const [bookingDetails, setBookingDetails] = useState({
        date: '',
        startTime: '',
        endTime: '',
        purpose: ''
    });
    const [availableTimes, setAvailableTimes] = useState([]);

    // ตรวจสอบว่า UserID อยู่ใน localStorage หรือไม่
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            navigate('/login');  // ถ้าไม่เจอ UserID ให้กลับไปหน้า login
        }
    }, [navigate]);

    // ฟังก์ชันดึงเวลาว่างจาก backend
    const fetchAvailableTimes = async (selectedDate) => {
        try {
            const response = await fetch(`http://localhost:3000/rooms/${roomId}/availability?bookingDate=${selectedDate}`);
            const data = await response.json();
            setAvailableTimes(data);  // เก็บเวลาว่างที่ดึงมา
        } catch (error) {
            console.error('Error fetching available times:', error);
        }
    };

    // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
    const handleChange = (e) => {
        setBookingDetails({
            ...bookingDetails,
            [e.target.name]: e.target.value
        });

        // ถ้าเปลี่ยนวันที่ ให้ดึงเวลาว่างใหม่
        if (e.target.name === 'date') {
            fetchAvailableTimes(e.target.value);
        }
    };

    // ฟังก์ชันเมื่อผู้ใช้กดปุ่ม Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        const userId = localStorage.getItem('userId'); // ดึง UserID จาก localStorage
        if (userId) {
            const bookingData = {
                ...bookingDetails,
                userId,  // แนบ UserID ไปกับข้อมูลการจอง
                roomId   // แนบ RoomID ไปด้วย
            };

            try {
                const response = await fetch('http://localhost:3000/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bookingData),
                });

                if (response.ok) {
                    navigate('/');  // กลับไปที่หน้าหลักหลังจากจองสำเร็จ
                } else {
                    console.error('Booking error:', await response.json());
                }
            } catch (error) {
                console.error('Error making booking:', error);
            }
        } else {
            navigate('/login');  // ถ้าไม่มี UserID ให้ไปหน้า login
        }
    };

    return (
        <div>
            <h1>Booking a Room</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Date:</label>
                    <input
                        type="date"
                        name="date"
                        value={bookingDetails.date}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Start Time:</label>
                    <select
                        name="startTime"
                        value={bookingDetails.startTime}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Start Time</option>
                        {availableTimes.map((time, index) => (
                            <option key={index} value={time.start} disabled={time.disabled}>
                                {time.start} - {time.end}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>End Time:</label>
                    <select
                        name="endTime"
                        value={bookingDetails.endTime}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select End Time</option>
                        {availableTimes.map((time, index) => (
                            <option key={index} value={time.end} disabled={time.disabled}>
                                {time.start} - {time.end}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Purpose of Use:</label>
                    <textarea
                        name="purpose"
                        value={bookingDetails.purpose}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Submit Booking</button>
            </form>
        </div>
    );
};

export default Booking;
