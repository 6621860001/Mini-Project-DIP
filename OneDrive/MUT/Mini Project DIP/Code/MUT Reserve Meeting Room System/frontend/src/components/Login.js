import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('userId', data.userId);  // บันทึก userId ลง localStorage
                localStorage.setItem('userName', data.name);  // บันทึกชื่อผู้ใช้ลง localStorage
                navigate('/');  // เปลี่ยนไปหน้าหลัก
            } else {
                console.error('Login error:', data.error);
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };

    const handleSignUp = () => {
        navigate('/signup');
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <button onClick={handleSignUp}>Sign Up</button>
        </div>
    );
};

export default Login;
