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
