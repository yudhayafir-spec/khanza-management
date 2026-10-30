import mysql from 'mysql2/promise';

// Membuat connection pool agar koneksi ke TiDB Cloud lebih stabil di Vercel Serverless
const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.TIDB_HOST,
    port: Number(process.env.DB_PORT || process.env.TIDB_PORT || 4000),
    user: process.env.DB_USER || process.env.TIDB_USER,
    password: process.env.DB_PASSWORD || process.env.TIDB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.TIDB_DATABASE || 'khanza',
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default async function handler(req, res) {
    // Header CORS untuk mengizinkan akses dari frontend statis
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const action = req.method === 'POST' ? req.body.action : req.query.action;

        // 1. Ambil Data Produk
        if (action === 'get_products') {
            const [rows] = await pool.execute('SELECT * FROM products');
            return res.status(200).json({ success: true, data: rows });
        }

        // 2. Ambil Data Pesanan/Orders
        if (action === 'get_orders') {
            const [rows] = await pool.execute('SELECT * FROM orders');
            return res.status(200).json({ success: true, data: rows });
        }

        // 3. Tambah Produk Baru
        if (action === 'add_product' && req.method === 'POST') {
            const { name, hpp, price, stock } = req.body;
            
            if (!name || hpp === undefined || price === undefined || stock === undefined) {
                return res.status(400).json({ success: false, message: 'Data produk tidak lengkap!' });
            }

            await pool.execute(
                'INSERT INTO products (name, hpp, price, stock) VALUES (?, ?, ?, ?)',
                [name, Number(hpp), Number(price), Number(stock)]
            );
            return res.status(200).json({ success: true, message: 'Produk berhasil ditambahkan' });
        }

        // 4. Tambah Pesanan Baru & Kurangi Stok Produk
        if (action === 'add_order' && req.method === 'POST') {
            const { product_id, product_name, qty, price, hpp, awb, status } = req.body;

            if (!product_name || !qty || !price || !awb) {
                return res.status(400).json({ success: false, message: 'Data pesanan tidak lengkap!' });
            }

            await pool.execute(
                'INSERT INTO orders (product_id, product_name, qty, price, hpp, awb, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [product_id || null, product_name, Number(qty), Number(price), Number(hpp || 0), awb, status || 'Dikemas']
            );
            
            if (product_id) {
                await pool.execute(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [Number(qty), product_id]
                );
            }

            return res.status(200).json({ success: true, message: 'Pesanan berhasil disimpan' });
        }

        return res.status(400).json({ success: false, message: `Action '${action}' tidak dikenal` });

    } catch (error) {
        console.error("Database Error Detail:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
}
