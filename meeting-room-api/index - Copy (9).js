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
