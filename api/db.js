const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'khanza_db',
    port: process.env.DB_PORT || 4000,
    ssl: { rejectUnauthorized: true }
  });

  try {
    const action = req.method === 'GET' ? req.query.action : req.body.action;

    if (req.method === 'GET') {
      if (action === 'get_products') {
        const [rows] = await connection.execute('SELECT * FROM products ORDER BY id DESC');
        await connection.end();
        return res.status(200).json({ success: true, data: rows });
      }
      if (action === 'get_orders') {
        const [rows] = await connection.execute('SELECT * FROM orders ORDER BY id DESC');
        await connection.end();
        return res.status(200).json({ success: true, data: rows });
      }
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (body.action === 'add_order') {
        const { awb, product_name, status, price, profit, created_by } = body;
        await connection.execute(
          'INSERT INTO orders (awb, product_name, status, price, profit, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          [awb, product_name, status, price, profit, created_by]
        );
        await connection.end();
        return res.status(200).json({ success: true, message: 'Resi tersimpan!' });
      }
    }

    await connection.end();
    return res.status(400).json({ success: false, message: 'Action tidak valid' });
  } catch (error) {
    if (connection) await connection.end();
    return res.status(500).json({ success: false, error: error.message });
  }
}
