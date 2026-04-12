import { Router } from 'express';
import { query } from '../db/database';

const router = Router();

// Get settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await query('SELECT * FROM settings');
    const settingsMap = settings.reduce((acc: any, curr: any) => {
      acc[curr.setting_key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Admin: Update settings
router.put('/admin/settings', async (req, res) => {
  try {
    // Helper function to insert or update setting
    const upsertSetting = async (key: string, value: string) => {
      const existing = await query`SELECT * FROM settings WHERE setting_key = ${key}`;
      if (existing && existing.length > 0) {
        await query`UPDATE settings SET value = ${value} WHERE setting_key = ${key}`;
      } else {
        await query`INSERT INTO settings (setting_key, value) VALUES (${key}, ${value})`;
      }
    };

    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        await upsertSetting(key, String(value));
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// Get all services
router.get('/services', async (req, res) => {
  try {
    const services = await query('SELECT * FROM services');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

// Get available times on a specific date
router.get('/availability', async (req, res) => {
  const { date, service_id } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    // Get service duration
    let duration = 40; // default to 40 minutes
    if (service_id) {
      const service = await query('SELECT duration FROM services WHERE id = ?', service_id) as { duration: number }[];
      if (service && service.length > 0) {
        duration = service[0].duration;
      }
    }
    
    // Get day of week (0-6)
    const dayOfWeek = new Date(date as string).getUTCDay();
    
    // Get working hours for this day
    const workingHours = await query(
      "SELECT * FROM working_hours WHERE day_of_week = ? AND is_active = 1",
      dayOfWeek
    ) as { start_time: string, end_time: string, start_time_2?: string, end_time_2?: string }[];

    if (!workingHours || workingHours.length === 0) {
      return res.json([]); // Closed on this day
    }

    const { start_time, end_time, start_time_2, end_time_2 } = workingHours[0];

    const appointments = await query(
      "SELECT time FROM appointments WHERE date = ? AND status != 'Cancelado'",
      date
    ) as { time: string }[];

    const bookedTimes = appointments.map(a => a.time);
    
    // Generate times based on working hours
    const allTimes: string[] = [];
    
    const addTimes = (start?: string, end?: string) => {
      if (!start || !end) return;
      
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);
      
      let currentInMinutes = startHour * 60 + startMinute;
      const endInMinutes = endHour * 60 + endMinute;
      
      while (currentInMinutes + duration <= endInMinutes) {
        const h = Math.floor(currentInMinutes / 60).toString().padStart(2, '0');
        const m = (currentInMinutes % 60).toString().padStart(2, '0');
        const timeStr = `${h}:${m}`;
        
        if (!allTimes.includes(timeStr)) {
          allTimes.push(timeStr);
        }
        
        currentInMinutes += duration; // Use service duration as interval
      }
    };

    addTimes(start_time, end_time);
    addTimes(start_time_2, end_time_2);
    
    allTimes.sort();

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
    // Check if time is still available
    const existing = await query(
      "SELECT id FROM appointments WHERE date = ? AND time = ? AND status != 'Cancelado'",
      date, time
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Time slot is no longer available' });
    }

    const result = await query(
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
    const appointments = await query(`
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
    await query('UPDATE appointments SET status = ? WHERE id = ?', status, id);
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Admin: Login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username?.trim().toLowerCase() === 'leticiaadm' && password?.trim() === '30031936') {
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
    const results = await query('SELECT id, name FROM users WHERE phone = ?', phone);
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
    await query('INSERT INTO users (name, phone, password) VALUES (?, ?, ?)', name, phone, password);
    // Get the last inserted id
    const results = await query('SELECT last_insert_rowid() as id');
    res.json({ success: true, user_id: results[0].id, name, phone });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao registrar usuário. Telefone já existe?' });
  }
});

// Login user
router.post('/users/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const results = await query('SELECT id, name, phone FROM users WHERE phone = ? AND password = ?', phone, password);
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
    const appointments = await query(`
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
    await query(
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
    await query(
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
    await query('DELETE FROM services WHERE id = ?', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir serviço' });
  }
});

// Admin: Dashboard Stats
router.get('/admin/stats', async (req, res) => {
  try {
    // Total Revenue (Finalizado or Confirmado)
    const revenueResult = await query(`
      SELECT SUM(COALESCE(s.promotional_price, s.price)) as total
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('Finalizado', 'Confirmado')
    `);
    
    // Total Appointments
    const appointmentsCount = await query(`SELECT COUNT(*) as count FROM appointments WHERE status != 'Cancelado'`);
    
    // Total Clients
    const clientsCount = await query(`SELECT COUNT(*) as count FROM users`);

    // Revenue by Day (Last 7 days)
    const revenueByDay = await query(`
      SELECT a.date, SUM(COALESCE(s.promotional_price, s.price)) as revenue
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('Finalizado', 'Confirmado')
      GROUP BY a.date
      ORDER BY a.date DESC
      LIMIT 7
    `);

    // Appointments by Service
    const appointmentsByService = await query(`
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
    const clients = await query(`
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

// Admin: Get working hours
router.get('/admin/working-hours', async (req, res) => {
  try {
    const hours = await query('SELECT * FROM working_hours ORDER BY day_of_week ASC');
    res.json(hours);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar horários de trabalho' });
  }
});

// Admin: Update working hours
router.put('/admin/working-hours', async (req, res) => {
  const hours = req.body; // Array of working hours
  try {
    for (const h of hours) {
      await query(
        'UPDATE working_hours SET start_time = ?, end_time = ?, start_time_2 = ?, end_time_2 = ?, is_active = ? WHERE day_of_week = ?',
        h.start_time, h.end_time, h.start_time_2 || null, h.end_time_2 || null, h.is_active ? 1 : 0, h.day_of_week
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar horários de trabalho' });
  }
});

export default router;
