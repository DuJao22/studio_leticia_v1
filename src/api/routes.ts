import { Router } from 'express';
import { getDb } from '../db/database';

const router = Router();

// Get all services
router.get('/services', async (req, res) => {
  try {
    const db = getDb();
    const services = await db.sql('SELECT * FROM services');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

// Get available times on a specific date
router.get('/availability', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    const db = getDb();
    const appointments = await db.sql(
      "SELECT time FROM appointments WHERE date = ? AND status != 'Cancelado'",
      date
    ) as { time: string }[];

    const bookedTimes = appointments.map(a => a.time);
    
    // Generate times from 09:00 to 18:00 every hour
    const allTimes = [];
    for (let i = 9; i <= 18; i++) {
      allTimes.push(`${i.toString().padStart(2, '0')}:00`);
    }

    const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));
    res.json(availableTimes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
  }
});

// Create an appointment
router.post('/appointments', async (req, res) => {
  const { user_id, client_name, client_phone, service_id, date, time } = req.body;
  
  if (!client_name || !client_phone || !service_id || !date || !time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const db = getDb();
    
    // Check if time is still available
    const existing = await db.sql(
      "SELECT id FROM appointments WHERE date = ? AND time = ? AND status != 'Cancelado'",
      date, time
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Time slot is no longer available' });
    }

    const result = await db.sql(
      'INSERT INTO appointments (user_id, client_name, client_phone, service_id, date, time) VALUES (?, ?, ?, ?, ?, ?)',
      user_id || null, client_name, client_phone, service_id, date, time
    );

    res.json({ message: 'Appointment created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// Admin: Get all appointments
router.get('/admin/appointments', async (req, res) => {
  try {
    const db = getDb();
    const appointments = await db.sql(`
      SELECT a.*, s.name as service_name 
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      ORDER BY a.date DESC, a.time DESC
    `);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// Admin: Update appointment status
router.patch('/admin/appointments/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['Agendado', 'Confirmado', 'Finalizado', 'Cancelado'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const db = getDb();
    await db.sql('UPDATE appointments SET status = ? WHERE id = ?', status, id);
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Admin: Login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username?.trim() === 'Leticiaadm' && password?.trim() === '30031936') {
    res.json({ token: 'fake-jwt-token', success: true });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// --- User Authentication Routes ---

// Check if phone exists
router.post('/users/check', async (req, res) => {
  const { phone } = req.body;
  try {
    const db = getDb();
    const results = await db.sql('SELECT id, name FROM users WHERE phone = ?', phone);
    if (results && results.length > 0) {
      res.json({ exists: true, name: results[0].name });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar usuário' });
  }
});

// Register user
router.post('/users/register', async (req, res) => {
  const { name, phone, password } = req.body;
  try {
    const db = getDb();
    await db.sql('INSERT INTO users (name, phone, password) VALUES (?, ?, ?)', name, phone, password);
    // Get the last inserted id
    const results = await db.sql('SELECT last_insert_rowid() as id');
    res.json({ success: true, user_id: results[0].id, name, phone });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao registrar usuário. Telefone já existe?' });
  }
});

// Login user
router.post('/users/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const db = getDb();
    const results = await db.sql('SELECT id, name, phone FROM users WHERE phone = ? AND password = ?', phone, password);
    if (results && results.length > 0) {
      res.json({ success: true, user: results[0] });
    } else {
      res.status(401).json({ error: 'Senha incorreta' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Get user profile & appointments
router.get('/users/:id/appointments', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const appointments = await db.sql(`
      SELECT a.*, s.name as service_name, s.price, s.promotional_price, s.image
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.user_id = ? OR a.client_phone = (SELECT phone FROM users WHERE id = ?)
      ORDER BY a.date DESC, a.time DESC
    `, id, id);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos do usuário' });
  }
});

// Admin: Create service
router.post('/admin/services', async (req, res) => {
  const { name, description, duration, price, promotional_price, image } = req.body;
  try {
    const db = getDb();
    await db.sql(
      'INSERT INTO services (name, description, duration, price, promotional_price, image) VALUES (?, ?, ?, ?, ?, ?)',
      name, description, duration, price, promotional_price || null, image
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

// Admin: Update service
router.put('/admin/services/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, duration, price, promotional_price, image } = req.body;
  try {
    const db = getDb();
    await db.sql(
      'UPDATE services SET name = ?, description = ?, duration = ?, price = ?, promotional_price = ?, image = ? WHERE id = ?',
      name, description, duration, price, promotional_price || null, image, id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

// Admin: Delete service
router.delete('/admin/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    await db.sql('DELETE FROM services WHERE id = ?', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir serviço' });
  }
});

// Admin: Dashboard Stats
router.get('/admin/stats', async (req, res) => {
  try {
    const db = getDb();
    
    // Total Revenue (Finalizado or Confirmado)
    const revenueResult = await db.sql(`
      SELECT SUM(COALESCE(s.promotional_price, s.price)) as total
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('Finalizado', 'Confirmado')
    `);
    
    // Total Appointments
    const appointmentsCount = await db.sql(`SELECT COUNT(*) as count FROM appointments WHERE status != 'Cancelado'`);
    
    // Total Clients
    const clientsCount = await db.sql(`SELECT COUNT(*) as count FROM users`);

    // Revenue by Day (Last 7 days)
    const revenueByDay = await db.sql(`
      SELECT a.date, SUM(COALESCE(s.promotional_price, s.price)) as revenue
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('Finalizado', 'Confirmado')
      GROUP BY a.date
      ORDER BY a.date DESC
      LIMIT 7
    `);

    // Appointments by Service
    const appointmentsByService = await db.sql(`
      SELECT s.name, COUNT(a.id) as count
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.status != 'Cancelado'
      GROUP BY s.id
      ORDER BY count DESC
    `);

    res.json({
      totalRevenue: revenueResult[0]?.total || 0,
      totalAppointments: appointmentsCount[0]?.count || 0,
      totalClients: clientsCount[0]?.count || 0,
      revenueByDay: revenueByDay.reverse(), // chronological order
      appointmentsByService
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Admin: CRM Clients List
router.get('/admin/crm/clients', async (req, res) => {
  try {
    const db = getDb();
    const clients = await db.sql(`
      SELECT 
        u.id, 
        u.name, 
        u.phone, 
        u.created_at,
        COUNT(a.id) as total_appointments,
        SUM(CASE WHEN a.status IN ('Finalizado', 'Confirmado') THEN COALESCE(s.promotional_price, s.price) ELSE 0 END) as total_spent,
        MAX(a.date) as last_appointment
      FROM users u
      LEFT JOIN appointments a ON u.id = a.user_id
      LEFT JOIN services s ON a.service_id = s.id
      GROUP BY u.id
      ORDER BY total_spent DESC, total_appointments DESC
    `);
    
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lista de clientes' });
  }
});

export default router;
