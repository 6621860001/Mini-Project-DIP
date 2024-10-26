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
