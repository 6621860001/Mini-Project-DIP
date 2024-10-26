const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');


// Load environment variables
dotenv.config();

// Enable CORS
fastify.register(cors, { 
    origin: '*'  // ปรับค่าให้รองรับทุกการเชื่อมต่อ (คุณสามารถเปลี่ยนตามความต้องการ)
});

// เชื่อมต่อกับ JawsDB MySQL
let connection;

const connectDB = async () => {
    try {
        connection = await mysql.createConnection({
            host: 'otwsl2e23jrxcqvx.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
            user: 'xnb85gnqu6g8d7x8',
            password: 'urf3qgeccvzcmof7',
            database: 'ctma9d50r4lvzca1',
        });
        console.log('Connected to MySQL Database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
};


// Route ทดสอบเซิร์ฟเวอร์
fastify.get('/', async (request, reply) => {
    return { hello: 'MUT Reserve Meeting Room Backend Running' };
});



/*
// Login โดยตรวจสอบจากฐานข้อมูล 1
fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    try {
        // ดึงข้อมูลผู้ใช้จากฐานข้อมูลตามอีเมล
        const [rows] = await connection.execute('SELECT * FROM Users WHERE Email = ?', [email]);

        if (rows.length === 0) {
            return reply.status(401).send({ error: 'Invalid email or password' });
        }

        const user = rows[0];

        // ตรวจสอบว่ารหัสผ่านตรงกันหรือไม่
        if (user.Password === password) {
            reply.send({ message: 'Login successful' });
        } else {
            reply.status(401).send({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        reply.status(500).send({ error: 'Failed to login' });
    }
});
*/


/*
// เส้นทาง login ตรวจสอบข้อมูลผู้ใช้ในฐานข้อมูล ใหม่จาก frontend
fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    try {
        // ค้นหาผู้ใช้ในฐานข้อมูลด้วยอีเมล
        const [rows] = await connection.execute('SELECT * FROM Users WHERE Email = ?', [email]);

        if (rows.length === 0) {
            return reply.status(401).send({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = rows[0];

        // ตรวจสอบรหัสผ่าน
        if (user.Password === password) {
            // ส่งข้อความหรือ token กลับไปยัง frontend
            reply.send({ message: 'เข้าสู่ระบบสำเร็จ', token: 'fake-jwt-token' });
        } else {
            reply.status(401).send({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        reply.status(500).send({ error: 'การเข้าสู่ระบบล้มเหลว' });
    }
});
*/



//2
fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    try {
        const [rows] = await connection.execute('SELECT * FROM Users WHERE Email = ?', [email]);

        if (rows.length === 0) {
            return reply.status(401).send({ error: 'Invalid email or password' });
        }

        const user = rows[0];

        // ตรวจสอบรหัสผ่าน
        if (user.Password === password) {
            // ส่ง UserID กลับไปที่ frontend
            reply.send({ message: 'Login successful', userId: user.UserID });
        } else {
            reply.status(401).send({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        reply.status(500).send({ error: 'Failed to login' });
    }
});



// Logout แบบง่าย
fastify.post('/logout', async (request, reply) => {
    reply.send({ message: 'Logout successful' });
});




// เพิ่มการไม่มารายงานตัวของผู้ใช้ (No-Show)
fastify.put('/bookings/:id/noshow', async (request, reply) => {
    const { id } = request.params;
    
    try {
        // ดึงข้อมูลผู้ใช้จากการจอง
        const [booking] = await connection.execute('SELECT UserID FROM Booking WHERE BookingID = ?', [id]);

        if (booking.length === 0) {
            reply.status(404).send({ message: 'Booking not found' });
        } else {
            const { UserID } = booking[0];

            // ดึง NoShowCount ปัจจุบันของผู้ใช้
            const [user] = await connection.execute('SELECT NoShowCount FROM Users WHERE UserID = ?', [UserID]);

            if (user.length === 0) {
                reply.status(404).send({ message: 'User not found' });
            } else {
                const { NoShowCount } = user[0];

                // เพิ่มค่า NoShowCount
                const newNoShowCount = NoShowCount + 1;

                // อัปเดตจำนวน No-Show ของผู้ใช้ในฐานข้อมูล
                await connection.execute(
                    'UPDATE Users SET NoShowCount = ? WHERE UserID = ?',
                    [newNoShowCount, UserID]
                );

                // หากผู้ใช้ไม่มารายงานตัวครบ 3 ครั้ง ให้ล็อกบัญชี
                if (newNoShowCount >= 3) {
                    await connection.execute('UPDATE Users SET Status = "Locked" WHERE UserID = ?', [UserID]);
                    reply.send({ message: 'User has been locked due to 3 No-Shows' });
                } else {
                    reply.send({ message: `No-Show count updated to ${newNoShowCount}` });
                }
            }
        }
    } catch (error) {
        console.error('Error updating No-Show count:', error);
        reply.status(500).send({ error: 'Failed to update No-Show count' });
    }
});



// ปลดล็อกผู้ใช้ที่ถูกล็อก
fastify.put('/users/:id/unlock', async (request, reply) => {
    const { id } = request.params;

    try {
        // อัปเดตสถานะผู้ใช้ให้เป็น Active
        const [result] = await connection.execute(
            'UPDATE Users SET Status = "Active", NoShowCount = 0 WHERE UserID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'User not found' });
        } else {
            reply.send({ message: 'User has been unlocked successfully' });
        }
    } catch (error) {
        console.error('Error unlocking user:', error);
        reply.status(500).send({ error: 'Failed to unlock user' });
    }
});



// API สำหรับดึงรายงานการใช้ห้องประชุมตาม RoomID และช่วงเวลา
fastify.get('/rooms/:roomId/usage-report', async (request, reply) => {
    const { roomId } = request.params;
    const { startDate, endDate } = request.query;

    try {
        // ดึงข้อมูลการจองทั้งหมดภายในช่วงเวลาที่กำหนด
        const [rows] = await connection.execute(
            'SELECT BookingDate, StartTime, EndTime, PurposeOfUse, BookingStatus FROM Booking WHERE RoomID = ? AND BookingDate BETWEEN ? AND ?',
            [roomId, startDate, endDate]
        );

        // คำนวณจำนวนการจองและเวลาที่ใช้งาน
        let totalBookings = rows.length;
        let totalHoursUsed = 0;

        rows.forEach(booking => {
            const startTime = new Date(`1970-01-01T${booking.StartTime}Z`);
            const endTime = new Date(`1970-01-01T${booking.EndTime}Z`);
            const hoursUsed = (endTime - startTime) / (1000 * 60 * 60); // แปลงเป็นชั่วโมง
            totalHoursUsed += hoursUsed;
        });

        // ส่งผลลัพธ์รายงานกลับไป
        reply.send({
            totalBookings,
            totalHoursUsed,
            bookings: rows
        });
    } catch (error) {
        console.error('Error generating room usage report:', error);
        reply.status(500).send({ error: 'Failed to generate room usage report' });
    }
});




// Route สำหรับเพิ่มผู้ใช้
fastify.post('/users', async (request, reply) => {
    const { userId, name, email, password, role, contactNumber, department } = request.body;

    try {
        const [result] = await connection.execute(
            'INSERT INTO Users (UserID, Name, Email, Password, Role, ContactNumber, Department) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, name, email, password, role, contactNumber, department]
        );
        reply.send({ message: 'User added successfully', userId });
    } catch (error) {
        console.error('Error adding user:', error);
        reply.status(500).send({ error: 'Failed to add user' });
    }
});


// ดึงข้อมูลผู้ใช้ทั้งหมด
fastify.get('/users', async (request, reply) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM Users');
        reply.send(rows); // ส่งข้อมูลผู้ใช้ทั้งหมดกลับไปยัง client
    } catch (error) {
        console.error('Error fetching users:', error);
        reply.status(500).send({ error: 'Failed to fetch users' });
    }
});

// ดึงข้อมูลผู้ใช้ตาม UserID
fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params;

    try {
        const [rows] = await connection.execute('SELECT * FROM Users WHERE UserID = ?', [id]);
        if (rows.length === 0) {
            reply.status(404).send({ message: 'User not found' });
        } else {
            reply.send(rows[0]);
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        reply.status(500).send({ error: 'Failed to fetch user' });
    }
});



// อัปเดตข้อมูลผู้ใช้ตาม UserID
fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params; // รับค่า UserID จาก URL พารามิเตอร์
    const { name, email, password, role, contactNumber, department } = request.body; // รับข้อมูลใหม่จาก body

    try {
        // อัปเดตข้อมูลผู้ใช้ในฐานข้อมูล
        const [result] = await connection.execute(
            'UPDATE Users SET Name = ?, Email = ?, Password = ?, Role = ?, ContactNumber = ?, Department = ? WHERE UserID = ?',
            [name, email, password, role, contactNumber, department, id]
        );

        // ตรวจสอบว่ามีการอัปเดตข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'User not found' });
        } else {
            reply.send({ message: 'User updated successfully' });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        reply.status(500).send({ error: 'Failed to update user' });
    }
});


// ลบผู้ใช้ตาม UserID
fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params; // รับค่า UserID จาก URL พารามิเตอร์

    try {
        // ลบข้อมูลผู้ใช้จากฐานข้อมูล
        const [result] = await connection.execute('DELETE FROM Users WHERE UserID = ?', [id]);

        // ตรวจสอบว่ามีการลบข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'User not found' });
        } else {
            reply.send({ message: 'User deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        reply.status(500).send({ error: 'Failed to delete user' });
    }
});



/* 1
// เพิ่มการจองห้องประชุม
fastify.post('/bookings', async (request, reply) => {
    const { roomId, userId, bookingDate, startTime, endTime, purposeOfUse, bookingStatus, adminId } = request.body;

    try {
        // เพิ่มข้อมูลการจองลงในฐานข้อมูล
        const [result] = await connection.execute(
            'INSERT INTO Booking (RoomID, UserID, BookingDate, StartTime, EndTime, PurposeOfUse, BookingStatus, AdminID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [roomId, userId, bookingDate, startTime, endTime, purposeOfUse, bookingStatus, adminId]
        );
        reply.send({ message: 'Booking added successfully', bookingId: result.insertId });
    } catch (error) {
        console.error('Error adding booking:', error.message);
        reply.status(500).send({ error: 'Failed to add booking' });
    }
});
*/


/* 2
// เพิ่มการจองห้องประชุม พร้อมตรวจสอบการจองซ้ำ
fastify.post('/bookings', async (request, reply) => {
    const { roomId, userId, bookingDate, startTime, endTime, purposeOfUse, bookingStatus, adminId } = request.body;

    if (!userId) {
        return reply.status(400).send({ error: 'UserID is required' });
    }

    // เพิ่มการจองตามข้อมูลที่ได้รับ
    const roomID = roomId || null;
    const userID = userId || null;
    const booking_Date = bookingDate || null;
    const start_Time = startTime || null;
    const end_Time = endTime || null;
    const purpose_Of_Use = purposeOfUse || null;
    const booking_Status = bookingStatus || 'Pending';
    //const admin_ID = adminId || null;
    const admin_ID = adminId || 'A660001234';
    

    console.log('Backend received data:', { roomID, userID, booking_Date, start_Time, end_Time, purpose_Of_Use, booking_Status, admin_ID }); 

    try {
        const [result] = await connection.execute(
            'INSERT INTO Booking (RoomID, UserID, BookingDate, StartTime, EndTime, PurposeOfUse, BookingStatus, AdminID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [roomID, userID, booking_Date, start_Time, end_Time, purpose_Of_Use, booking_Status, admin_ID]
        );
        reply.send({ message: 'Booking added successfully', bookingId: result.insertId });
    } catch (error) {
        console.error('Error adding booking:', error.message);
        reply.status(500).send({ error: 'Failed to add booking' });
    }
});
*/

// 3
fastify.post('/bookings', async (request, reply) => {
    const { roomId, userId, bookingDate, startTime, endTime, purposeOfUse } = request.body;

    console.log('Received UserID:', userId);  // เพิ่ม log เพื่อตรวจสอบ UserID ที่ได้รับจาก frontend

    try {
        // ตรวจสอบว่ามี UserID ในฐานข้อมูลหรือไม่
        const [user] = await connection.execute('SELECT * FROM Users WHERE UserID = ?', [userId]);
        
        if (user.length === 0) {
            return reply.status(400).send({ error: 'Invalid UserID' });
        }

        // เพิ่มการจองห้องในฐานข้อมูล
        const [result] = await connection.execute(
            'INSERT INTO Booking (RoomID, UserID, BookingDate, StartTime, EndTime, PurposeOfUse, BookingStatus, AdminID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [roomId, userId, bookingDate, startTime, endTime, purposeOfUse, 'Pending', 'A660001234']
        );
        reply.send({ message: 'Booking added successfully', bookingId: result.insertId });
    } catch (error) {
        console.error('Error adding booking:', error.message);
        reply.status(500).send({ error: 'Failed to add booking' });
    }
});





// ดึงข้อมูลการจองทั้งหมด
fastify.get('/bookings', async (request, reply) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM Booking');
        reply.send(rows); // ส่งข้อมูลการจองทั้งหมดกลับไป
    } catch (error) {
        console.error('Error fetching bookings:', error);
        reply.status(500).send({ error: 'Failed to fetch bookings' });
    }
});

// ดึงข้อมูลการจองตาม BookingID
fastify.get('/bookings/:id', async (request, reply) => {
    const { id } = request.params;

    try {
        const [rows] = await connection.execute('SELECT * FROM Booking WHERE BookingID = ?', [id]);
        if (rows.length === 0) {
            reply.status(404).send({ message: 'Booking not found' });
        } else {
            reply.send(rows[0]);
        }
    } catch (error) {
        console.error('Error fetching booking:', error);
        reply.status(500).send({ error: 'Failed to fetch booking' });
    }
});


// แก้ไขข้อมูลการจองตาม BookingID
fastify.put('/bookings/:id', async (request, reply) => {
    const { id } = request.params; // รับค่า BookingID จาก URL พารามิเตอร์
    const { startTime, endTime, purposeOfUse, bookingStatus, cancellationReason, roomManagerRejectionReason, roomManagerApprovalStatus } = request.body; // รับข้อมูลที่ต้องการแก้ไข

    try {
        // อัปเดตข้อมูลการจองในฐานข้อมูล
        const [result] = await connection.execute(
            'UPDATE Booking SET StartTime = ?, EndTime = ?, PurposeOfUse = ?, BookingStatus = ?, CancellationReason = ?, RoomManagerRejectionReason = ?, RoomManagerApprovalStatus = ? WHERE BookingID = ?',
            [startTime, endTime, purposeOfUse, bookingStatus, cancellationReason, roomManagerRejectionReason, roomManagerApprovalStatus, id]
        );

        // ตรวจสอบว่ามีการแก้ไขข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Booking not found' });
        } else {
            reply.send({ message: 'Booking updated successfully' });
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        reply.status(500).send({ error: 'Failed to update booking' });
    }
});



// ลบข้อมูลการจองตาม BookingID
fastify.delete('/bookings/:id', async (request, reply) => {
    const { id } = request.params; // รับค่า BookingID จาก URL พารามิเตอร์

    try {
        // ลบข้อมูลการจองในฐานข้อมูล
        const [result] = await connection.execute('DELETE FROM Booking WHERE BookingID = ?', [id]);

        // ตรวจสอบว่ามีการลบข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Booking not found' });
        } else {
            reply.send({ message: 'Booking deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        reply.status(500).send({ error: 'Failed to delete booking' });
    }
});



// เพิ่มห้องประชุมใหม่
fastify.post('/rooms', async (request, reply) => {
    const { roomId, roomName, roomType, capacity, roomStatus, building, floor, openingHours, closingHours, roomManagerId } = request.body;

    try {
        // เพิ่มข้อมูลห้องประชุมลงในฐานข้อมูล
        const [result] = await connection.execute(
            'INSERT INTO Room (RoomID, RoomName, RoomType, Capacity, RoomStatus, Building, Floor, OpeningHours, ClosingHours, RoomManagerID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [roomId, roomName, roomType, capacity, roomStatus, building, floor, openingHours, closingHours, roomManagerId]
        );
        reply.send({ message: 'Room added successfully', roomId });
    } catch (error) {
        console.error('Error adding room:', error);
        reply.status(500).send({ error: 'Failed to add room' });
    }
});


// ดึงข้อมูลห้องประชุมทั้งหมด
fastify.get('/rooms', async (request, reply) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM Room');
        reply.send(rows); // ส่งข้อมูลห้องประชุมทั้งหมดกลับไปยัง client
    } catch (error) {
        console.error('Error fetching rooms:', error);
        reply.status(500).send({ error: 'Failed to fetch rooms' });
    }
});

// ดึงข้อมูลห้องประชุมตาม RoomID
fastify.get('/rooms/:id', async (request, reply) => {
    const { id } = request.params;

    try {
        const [rows] = await connection.execute('SELECT * FROM Room WHERE RoomID = ?', [id]);
        if (rows.length === 0) {
            reply.status(404).send({ message: 'Room not found' });
        } else {
            reply.send(rows[0]);
        }
    } catch (error) {
        console.error('Error fetching room:', error);
        reply.status(500).send({ error: 'Failed to fetch room' });
    }
});


// แก้ไขข้อมูลห้องประชุมตาม RoomID
fastify.put('/rooms/:id', async (request, reply) => {
    const { id } = request.params; // รับ RoomID จาก URL พารามิเตอร์
    const { roomName, roomType, capacity, roomStatus, building, floor, openingHours, closingHours, roomManagerId, requiresApproval } = request.body; // รับข้อมูลที่ต้องการแก้ไขจาก body

    try {
        // อัปเดตข้อมูลห้องประชุมในฐานข้อมูล
        const [result] = await connection.execute(
            'UPDATE Room SET RoomName = ?, RoomType = ?, Capacity = ?, RoomStatus = ?, Building = ?, Floor = ?, OpeningHours = ?, ClosingHours = ?, RoomManagerID = ?, RequiresApproval = ? WHERE RoomID = ?',
            [roomName, roomType, capacity, roomStatus, building, floor, openingHours, closingHours, roomManagerId, requiresApproval, id]
        );

        // ตรวจสอบว่ามีการแก้ไขข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Room not found' });
        } else {
            reply.send({ message: 'Room updated successfully' });
        }
    } catch (error) {
        console.error('Error updating room:', error);
        reply.status(500).send({ error: 'Failed to update room' });
    }
});


// ลบห้องประชุมตาม RoomID
fastify.delete('/rooms/:id', async (request, reply) => {
    const { id } = request.params; // รับ RoomID จาก URL พารามิเตอร์

    try {
        // ลบข้อมูลห้องประชุมจากฐานข้อมูล
        const [result] = await connection.execute('DELETE FROM Room WHERE RoomID = ?', [id]);

        // ตรวจสอบว่ามีการลบข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Room not found' });
        } else {
            reply.send({ message: 'Room deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        reply.status(500).send({ error: 'Failed to delete room' });
    }
});



// เพิ่มอุปกรณ์ในห้องประชุม
fastify.post('/rooms/:roomId/equipment', async (request, reply) => {
    const { roomId } = request.params;
    const { equipmentName, equipmentStatus } = request.body;

    try {
        // เพิ่มข้อมูลอุปกรณ์ลงในฐานข้อมูล
        const [result] = await connection.execute(
            'INSERT INTO Equipment (RoomID, EquipmentName, EquipmentStatus) VALUES (?, ?, ?)',
            [roomId, equipmentName, equipmentStatus]
        );
        reply.send({ message: 'Equipment added successfully', equipmentName });
    } catch (error) {
        console.error('Error adding equipment:', error);
        reply.status(500).send({ error: 'Failed to add equipment' });
    }
});



// ดึงข้อมูลอุปกรณ์ทั้งหมดในห้องประชุมตาม RoomID
fastify.get('/rooms/:roomId/equipment', async (request, reply) => {
    const { roomId } = request.params;

    try {
        const [rows] = await connection.execute('SELECT * FROM Equipment WHERE RoomID = ?', [roomId]);
        reply.send(rows); // ส่งข้อมูลอุปกรณ์ทั้งหมดในห้องประชุม
    } catch (error) {
        console.error('Error fetching equipment:', error);
        reply.status(500).send({ error: 'Failed to fetch equipment' });
    }
});


// แก้ไขข้อมูลอุปกรณ์ตาม EquipmentID
fastify.put('/rooms/:roomId/equipment/:id', async (request, reply) => {
    const { id } = request.params; // รับ EquipmentID จาก URL พารามิเตอร์
    const { equipmentName, equipmentStatus } = request.body; // รับข้อมูลที่ต้องการแก้ไขจาก body

    try {
        // อัปเดตข้อมูลอุปกรณ์ในฐานข้อมูล
        const [result] = await connection.execute(
            'UPDATE Equipment SET EquipmentName = ?, EquipmentStatus = ? WHERE EquipmentID = ?',
            [equipmentName, equipmentStatus, id]
        );

        // ตรวจสอบว่ามีการแก้ไขข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Equipment not found' });
        } else {
            reply.send({ message: 'Equipment updated successfully' });
        }
    } catch (error) {
        console.error('Error updating equipment:', error);
        reply.status(500).send({ error: 'Failed to update equipment' });
    }
});



// ลบอุปกรณ์ตาม EquipmentID
fastify.delete('/rooms/:roomId/equipment/:id', async (request, reply) => {
    const { id } = request.params; // รับ EquipmentID จาก URL พารามิเตอร์

    try {
        // ลบข้อมูลอุปกรณ์จากฐานข้อมูล
        const [result] = await connection.execute('DELETE FROM Equipment WHERE EquipmentID = ?', [id]);

        // ตรวจสอบว่ามีการลบข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Equipment not found' });
        } else {
            reply.send({ message: 'Equipment deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting equipment:', error);
        reply.status(500).send({ error: 'Failed to delete equipment' });
    }
});


// เพิ่มรายงานการใช้ห้องประชุม
fastify.post('/rooms/:roomId/reports', async (request, reply) => {
    const { roomId } = request.params;
    const { dateOfUsage, totalHoursUsed, numberOfBookings, roomManagerId, generatedBy } = request.body;

    try {
        // เพิ่มข้อมูลรายงานการใช้ห้องประชุมลงในฐานข้อมูล
        const [result] = await connection.execute(
            'INSERT INTO RoomUsageReport (RoomID, DateOfUsage, TotalHoursUsed, NumberOfBookings, RoomManagerID, GeneratedBy) VALUES (?, ?, ?, ?, ?, ?)',
            [roomId, dateOfUsage, totalHoursUsed, numberOfBookings, roomManagerId, generatedBy]
        );
        reply.send({ message: 'Room usage report added successfully', reportId: result.insertId });
    } catch (error) {
        console.error('Error adding room usage report:', error);
        reply.status(500).send({ error: 'Failed to add room usage report' });
    }
});



/*
// ดึงข้อมูลรายงานการใช้ห้องประชุมทั้งหมดตาม RoomID
fastify.get('/rooms/:roomId/reports', async (request, reply) => {
    const { roomId } = request.params;

    try {
        const [rows] = await connection.execute('SELECT * FROM RoomUsageReport WHERE RoomID = ?', [roomId]);
        reply.send(rows); // ส่งข้อมูลรายงานการใช้ห้องประชุมทั้งหมดในห้องนี้
    } catch (error) {
        console.error('Error fetching room usage reports:', error);
        reply.status(500).send({ error: 'Failed to fetch room usage reports' });
    }
});
*/



// ดึงข้อมูลรายงานการใช้ห้องประชุมตาม ReportID
fastify.get('/reports/:reportId', async (request, reply) => {
    const { reportId } = request.params;

    try {
        const [rows] = await connection.execute('SELECT * FROM RoomUsageReport WHERE ReportID = ?', [reportId]);
        if (rows.length === 0) {
            reply.status(404).send({ message: 'Room usage report not found' });
        } else {
            reply.send(rows[0]);
        }
    } catch (error) {
        console.error('Error fetching room usage report:', error);
        reply.status(500).send({ error: 'Failed to fetch room usage report' });
    }
});



// แก้ไขข้อมูลรายงานการใช้ห้องประชุมตาม ReportID
fastify.put('/reports/:reportId', async (request, reply) => {
    const { reportId } = request.params;
    const { dateOfUsage, totalHoursUsed, numberOfBookings, roomManagerId, generatedBy } = request.body;

    try {
        // อัปเดตข้อมูลรายงานการใช้ห้องประชุมในฐานข้อมูล
        const [result] = await connection.execute(
            'UPDATE RoomUsageReport SET DateOfUsage = ?, TotalHoursUsed = ?, NumberOfBookings = ?, RoomManagerID = ?, GeneratedBy = ? WHERE ReportID = ?',
            [dateOfUsage, totalHoursUsed, numberOfBookings, roomManagerId, generatedBy, reportId]
        );

        // ตรวจสอบว่ามีการอัปเดตข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Room usage report not found' });
        } else {
            reply.send({ message: 'Room usage report updated successfully' });
        }
    } catch (error) {
        console.error('Error updating room usage report:', error);
        reply.status(500).send({ error: 'Failed to update room usage report' });
    }
});


// ลบข้อมูลรายงานการใช้ห้องประชุมตาม ReportID
fastify.delete('/reports/:reportId', async (request, reply) => {
    const { reportId } = request.params; // รับค่า ReportID จาก URL พารามิเตอร์

    try {
        // ลบข้อมูลรายงานการใช้ห้องประชุมในฐานข้อมูล
        const [result] = await connection.execute('DELETE FROM RoomUsageReport WHERE ReportID = ?', [reportId]);

        // ตรวจสอบว่ามีการลบข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Room usage report not found' });
        } else {
            reply.send({ message: 'Room usage report deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting room usage report:', error);
        reply.status(500).send({ error: 'Failed to delete room usage report' });
    }
});


// เพิ่มบันทึกการเข้าใช้งานห้องประชุม
fastify.post('/rooms/:roomId/accesslogs', async (request, reply) => {
    const { roomId } = request.params;
    const { userId, accessTime, exitTime, qrCodeScanned, status } = request.body;

    try {
        // เพิ่มข้อมูลบันทึกการเข้าใช้งานลงในฐานข้อมูล
        const [result] = await connection.execute(
            'INSERT INTO AccessLog (RoomID, UserID, AccessTime, ExitTime, QRCodeScanned, Status) VALUES (?, ?, ?, ?, ?, ?)',
            [roomId, userId, accessTime, exitTime, qrCodeScanned, status]
        );
        reply.send({ message: 'Access log added successfully', logId: result.insertId });
    } catch (error) {
        console.error('Error adding access log:', error);
        reply.status(500).send({ error: 'Failed to add access log' });
    }
});



// ดึงข้อมูลบันทึกการเข้าใช้งานห้องประชุมตาม RoomID
fastify.get('/rooms/:roomId/accesslogs', async (request, reply) => {
    const { roomId } = request.params;

    try {
        const [rows] = await connection.execute('SELECT * FROM AccessLog WHERE RoomID = ?', [roomId]);
        reply.send(rows); // ส่งข้อมูลบันทึกการเข้าใช้งานทั้งหมดในห้องนี้
    } catch (error) {
        console.error('Error fetching access logs:', error);
        reply.status(500).send({ error: 'Failed to fetch access logs' });
    }
});

// ดึงข้อมูลบันทึกการเข้าใช้งานตาม AccessLogID
fastify.get('/accesslogs/:logId', async (request, reply) => {
    const { logId } = request.params;

    try {
        const [rows] = await connection.execute('SELECT * FROM AccessLog WHERE AccessLogID = ?', [logId]);
        if (rows.length === 0) {
            reply.status(404).send({ message: 'Access log not found' });
        } else {
            reply.send(rows[0]);
        }
    } catch (error) {
        console.error('Error fetching access log:', error);
        reply.status(500).send({ error: 'Failed to fetch access log' });
    }
});


// แก้ไขบันทึกการเข้าใช้งานตาม AccessLogID
fastify.put('/accesslogs/:logId', async (request, reply) => {
    const { logId } = request.params; // รับ AccessLogID จาก URL พารามิเตอร์
    const { accessTime, exitTime, qrCodeScanned, status } = request.body; // รับข้อมูลที่ต้องการแก้ไขจาก body

    try {
        // อัปเดตข้อมูลบันทึกการเข้าใช้งานในฐานข้อมูล
        const [result] = await connection.execute(
            'UPDATE AccessLog SET AccessTime = ?, ExitTime = ?, QRCodeScanned = ?, Status = ? WHERE AccessLogID = ?',
            [accessTime, exitTime, qrCodeScanned, status, logId]
        );

        // ตรวจสอบว่ามีการแก้ไขข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Access log not found' });
        } else {
            reply.send({ message: 'Access log updated successfully' });
        }
    } catch (error) {
        console.error('Error updating access log:', error);
        reply.status(500).send({ error: 'Failed to update access log' });
    }
});


// ลบบันทึกการเข้าใช้งานตาม AccessLogID
fastify.delete('/accesslogs/:logId', async (request, reply) => {
    const { logId } = request.params; // รับค่า AccessLogID จาก URL พารามิเตอร์

    try {
        // ลบข้อมูลบันทึกการเข้าใช้งานจากฐานข้อมูล
        const [result] = await connection.execute('DELETE FROM AccessLog WHERE AccessLogID = ?', [logId]);

        // ตรวจสอบว่ามีการลบข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Access log not found' });
        } else {
            reply.send({ message: 'Access log deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting access log:', error);
        reply.status(500).send({ error: 'Failed to delete access log' });
    }
});


// เพิ่มข้อมูลสิทธิการใช้งานใหม่
fastify.post('/permissions', async (request, reply) => {
    const { role, canManageRooms, canApproveBookings, canGenerateReports, canManageUsers } = request.body;

    try {
        // เพิ่มข้อมูลสิทธิการใช้งานลงในฐานข้อมูล
        const [result] = await connection.execute(
            'INSERT INTO Permissions (Role, CanManageRooms, CanApproveBookings, CanGenerateReports, CanManageUsers) VALUES (?, ?, ?, ?, ?)',
            [role, canManageRooms, canApproveBookings, canGenerateReports, canManageUsers]
        );
        reply.send({ message: 'Permission added successfully', permissionId: result.insertId });
    } catch (error) {
        console.error('Error adding permission:', error);
        reply.status(500).send({ error: 'Failed to add permission' });
    }
});


// ดึงข้อมูลสิทธิการใช้งานทั้งหมด
fastify.get('/permissions', async (request, reply) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM Permissions');
        reply.send(rows); // ส่งข้อมูลสิทธิการใช้งานทั้งหมดกลับไปยัง client
    } catch (error) {
        console.error('Error fetching permissions:', error);
        reply.status(500).send({ error: 'Failed to fetch permissions' });
    }
});

// ดึงข้อมูลสิทธิการใช้งานตาม PermissionID
fastify.get('/permissions/:id', async (request, reply) => {
    const { id } = request.params;

    try {
        const [rows] = await connection.execute('SELECT * FROM Permissions WHERE PermissionID = ?', [id]);
        if (rows.length === 0) {
            reply.status(404).send({ message: 'Permission not found' });
        } else {
            reply.send(rows[0]);
        }
    } catch (error) {
        console.error('Error fetching permission:', error);
        reply.status(500).send({ error: 'Failed to fetch permission' });
    }
});


// แก้ไขข้อมูลสิทธิการใช้งานตาม PermissionID
fastify.put('/permissions/:id', async (request, reply) => {
    const { id } = request.params;
    const { role, canManageRooms, canApproveBookings, canGenerateReports, canManageUsers } = request.body;

    try {
        // อัปเดตข้อมูลสิทธิการใช้งานในฐานข้อมูล
        const [result] = await connection.execute(
            'UPDATE Permissions SET Role = ?, CanManageRooms = ?, CanApproveBookings = ?, CanGenerateReports = ?, CanManageUsers = ? WHERE PermissionID = ?',
            [role, canManageRooms, canApproveBookings, canGenerateReports, canManageUsers, id]
        );

        // ตรวจสอบว่ามีการอัปเดตข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Permission not found' });
        } else {
            reply.send({ message: 'Permission updated successfully' });
        }
    } catch (error) {
        console.error('Error updating permission:', error);
        reply.status(500).send({ error: 'Failed to update permission' });
    }
});




// ลบสิทธิการใช้งานตาม PermissionID
fastify.delete('/permissions/:id', async (request, reply) => {
    const { id } = request.params; // รับ PermissionID จาก URL พารามิเตอร์

    try {
        // ลบข้อมูลสิทธิการใช้งานจากฐานข้อมูล
        const [result] = await connection.execute('DELETE FROM Permissions WHERE PermissionID = ?', [id]);

        // ตรวจสอบว่ามีการลบข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Permission not found' });
        } else {
            reply.send({ message: 'Permission deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting permission:', error);
        reply.status(500).send({ error: 'Failed to delete permission' });
    }
});




// ดึงเวลาที่ห้องประชุมว่างสำหรับวันที่เลือก
fastify.get('/rooms/:roomId/availability', async (request, reply) => {
    const { roomId } = request.params;
    const { bookingDate } = request.query;

    try {
        // ดึงข้อมูลการจองทั้งหมดสำหรับห้องประชุมและวันที่เลือก
        const [bookings] = await connection.execute(
            'SELECT StartTime, EndTime FROM Booking WHERE RoomID = ? AND BookingDate = ?',
            [roomId, bookingDate]
        );

        // Log ข้อมูลการจอง
        console.log('Bookings fetched from DB:', bookings);

        // สมมุติว่าเวลาห้องประชุมเปิดตั้งแต่ 07:30 ถึง 21:00
        const openingTime = '07:30:00';
        const closingTime = '21:00:00';

        let availableTimes = [{ start: openingTime, end: closingTime }];

        // ตรวจสอบเวลาที่ห้องถูกจองและลบออกจากเวลาที่ว่าง
        bookings.forEach(booking => {
            const startTime = booking.StartTime;
            const endTime = booking.EndTime;

            console.log(`Checking booking from ${startTime} to ${endTime}`); // Log เวลาเพื่อ debug

            availableTimes = availableTimes.flatMap(time => {
                if (startTime >= time.end || endTime <= time.start) {
                    return [time]; // เวลานี้ยังคงว่างอยู่
                } else if (startTime > time.start && endTime < time.end) {
                    return [
                        { start: time.start, end: startTime },
                        { start: endTime, end: time.end }
                    ]; // แบ่งช่วงเวลาออก
                } else if (startTime <= time.start && endTime >= time.end) {
                    return []; // เวลาถูกจองทั้งช่วง
                } else if (startTime <= time.start) {
                    return [{ start: endTime, end: time.end }]; // ช่วงเวลาต้นถูกจอง
                } else if (endTime >= time.end) {
                    return [{ start: time.start, end: startTime }]; // ช่วงเวลาท้ายถูกจอง
                }
            });
        });

        // ส่งช่วงเวลาที่ห้องประชุมว่างกลับไปที่ client
        reply.send(availableTimes);
    } catch (error) {
        console.error('Error fetching room availability:', error);
        reply.status(500).send({ error: 'Failed to fetch room availability' });
    }
});



// API สำหรับอัปเดตสถานะการจอง
fastify.put('/bookings/:id/confirm', async (request, reply) => {
    const { id } = request.params;
    const { status, roomManagerRejectionReason } = request.body;

    // ตรวจสอบสถานะการจอง (ต้องเป็น Confirmed หรือ Rejected)
    if (!['Confirmed', 'Rejected'].includes(status)) {
        return reply.status(400).send({ error: 'Invalid status' });
    }

    try {
        // อัปเดตสถานะการจองและเหตุผลในการปฏิเสธ (ถ้ามี)
        const [result] = await connection.execute(
            'UPDATE Booking SET BookingStatus = ?, RoomManagerRejectionReason = ? WHERE BookingID = ?',
            [status, roomManagerRejectionReason || null, id]
        );

        // ตรวจสอบว่ามีการอัปเดตข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Booking not found' });
        } else {
            reply.send({ message: 'Booking status updated successfully' });
        }
    } catch (error) {
        console.error('Error confirming booking:', error);
        reply.status(500).send({ error: 'Failed to confirm booking' });
    }
});



fastify.get('/rooms/:roomId/reports', async (request, reply) => {
    const { roomId } = request.params;
    const { startDate, endDate } = request.query;

    try {
        if (startDate && endDate) {
            // ถ้ารับค่า startDate และ endDate สร้างรายงานการใช้งานตามช่วงเวลา
            const [rows] = await connection.execute(
                'SELECT BookingDate, StartTime, EndTime FROM Booking WHERE RoomID = ? AND BookingDate BETWEEN ? AND ?',
                [roomId, startDate, endDate]
            );

            let totalBookings = rows.length;
            let totalHoursUsed = 0;

            rows.forEach(booking => {
                const startTime = new Date(`1970-01-01T${booking.StartTime}Z`);
                const endTime = new Date(`1970-01-01T${booking.EndTime}Z`);
                const hoursUsed = (endTime - startTime) / (1000 * 60 * 60);
                totalHoursUsed += hoursUsed;
            });

            reply.send({
                totalBookings,
                totalHoursUsed,
                report: rows
            });
        } else {
            // ถ้าไม่ได้ระบุ startDate และ endDate ให้ดึงข้อมูลจาก RoomUsageReport
            const [rows] = await connection.execute('SELECT * FROM RoomUsageReport WHERE RoomID = ?', [roomId]);
            reply.send(rows); // ส่งข้อมูลรายงานการใช้ห้องประชุมทั้งหมดในห้องนี้
        }
    } catch (error) {
        console.error('Error generating report:', error);
        reply.status(500).send({ error: 'Failed to generate report' });
    }
});




// อัปเดตสถานะการจองห้องประชุม (การอนุมัติหรือปฏิเสธ)
fastify.put('/bookings/:id/approve', async (request, reply) => {
    const { id } = request.params;
    const { approvalStatus, rejectionReason } = request.body; 

    try {
        // ตรวจสอบสถานะการอนุมัติ
        let roomManagerApprovalStatus = approvalStatus === 'approve' ? 'Approved' : 'Rejected';
        
        // ถ้าไม่มี rejectionReason และสถานะเป็น 'Rejected' ให้กำหนดค่าเป็น null แทน
        const reason = rejectionReason || null;

        // อัปเดตสถานะการจองในฐานข้อมูล
        const [result] = await connection.execute(
            'UPDATE Booking SET RoomManagerApprovalStatus = ?, RoomManagerRejectionReason = ? WHERE BookingID = ?',
            [roomManagerApprovalStatus, reason, id]
        );

        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Booking not found' });
        } else {
            reply.send({ message: `Booking ${roomManagerApprovalStatus.toLowerCase()} successfully` });
        }
    } catch (error) {
        console.error('Error updating booking status:', error);
        reply.status(500).send({ error: 'Failed to update booking status' });
    }
});




// ยกเลิกการจอง
fastify.put('/bookings/:id/cancel', async (request, reply) => {
    const { id } = request.params;
    const { cancellationReason } = request.body;

    try {
        // อัปเดตสถานะการจองเป็น Cancelled พร้อมเหตุผล
        const [result] = await connection.execute(
            'UPDATE Booking SET BookingStatus = "Cancelled", CancellationReason = ? WHERE BookingID = ?',
            [cancellationReason, id]
        );

        if (result.affectedRows === 0) {
            reply.status(404).send({ message: 'Booking not found' });
        } else {
            reply.send({ message: 'Booking cancelled successfully' });
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        reply.status(500).send({ error: 'Failed to cancel booking' });
    }
});



// ดึงจำนวนการจองทั้งหมด
fastify.get('/reports/statistics/totalBookings', async (request, reply) => {
    try {
        const [totalBookings] = await connection.execute('SELECT COUNT(*) AS totalBookings FROM Booking');
        reply.send({ totalBookings: totalBookings[0].totalBookings });
    } catch (error) {
        console.error('Error fetching total bookings:', error);
        reply.status(500).send({ error: 'Failed to fetch total bookings' });
    }
});


// ดึงจำนวนการจองแยกตามห้องประชุม
fastify.get('/reports/statistics/roomUsage', async (request, reply) => {
    try {
        const [roomUsage] = await connection.execute('SELECT RoomID, COUNT(*) AS bookingsCount FROM Booking GROUP BY RoomID');
        reply.send(roomUsage);
    } catch (error) {
        console.error('Error fetching room usage:', error);
        reply.status(500).send({ error: 'Failed to fetch room usage' });
    }
});


// ดึงจำนวนชั่วโมงที่ห้องประชุมถูกใช้งาน
fastify.get('/reports/statistics/totalHoursUsed', async (request, reply) => {
    try {
        const [totalHoursUsed] = await connection.execute(
            'SELECT RoomID, SUM(TIMESTAMPDIFF(HOUR, StartTime, EndTime)) AS totalHoursUsed FROM Booking GROUP BY RoomID'
        );
        reply.send(totalHoursUsed);
    } catch (error) {
        console.error('Error fetching total hours used:', error);
        reply.status(500).send({ error: 'Failed to fetch total hours used' });
    }
});















// เริ่มเซิร์ฟเวอร์
const start = async () => {
    try {
        // เรียกใช้การเชื่อมต่อฐานข้อมูล
        await connectDB();
        await fastify.listen({ port: 3000 });
        console.log('Server listening on http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
