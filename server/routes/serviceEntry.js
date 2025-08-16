import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

router.use(authenticateToken);

// Get categories and subcategories
router.get('/categories', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT id, name, wallet_id
      FROM services
      WHERE id IS NOT NULL
      ORDER BY name ASC
    `);
    const categories = result.rows;

    const subcategoriesResult = await req.db.query(`
      SELECT id, name, service_id AS category_id, service_charges, department_charges, requires_wallet
      FROM subcategories
      ORDER BY name ASC
    `);
    const subcategories = subcategoriesResult.rows;

    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      walletId: category.wallet_id,
      subcategories: subcategories
        .filter(sub => sub.category_id === category.id)
        .map(sub => ({
          id: sub.id,
          name: sub.name,
          serviceCharge: parseFloat(sub.service_charges || 0),
          departmentCharge: parseFloat(sub.department_charges || 0),
          requiresWallet: sub.requires_wallet,
        })),
    }));

    res.json(formattedCategories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories: ' + err.message });
  }
});

// Get all service entries
router.get('/entries', async (req, res) => {
  try {
    const entriesResult = await req.db.query(`
      SELECT se.*, sc.name AS subcategory_name, s.wallet_id AS service_wallet_id, s.name AS service_name
      FROM service_entries se
      JOIN subcategories sc ON se.subcategory_id::integer = sc.id
      JOIN services s ON se.category_id::integer = s.id
      ORDER BY se.created_at DESC
    `);

    const entries = [];
    for (const entry of entriesResult.rows) {
      const paymentsResult = await req.db.query(`
        SELECT p.id, p.wallet_id, p.amount, p.status, w.name AS wallet_name, w.wallet_type
        FROM payments p
        JOIN wallets w ON p.wallet_id = w.id
        WHERE p.service_entry_id = $1
      `, [entry.id]);

      entries.push({
        id: entry.id,
        tokenId: entry.token_id,
        customerName: entry.customer_name,
        phone: entry.phone,
        category: entry.category_id,
        subcategory: entry.subcategory_id,
        subcategoryName: entry.subcategory_name,
        serviceCharge: parseFloat(entry.service_charges),
        departmentCharge: parseFloat(entry.department_charges),
        totalCharge: parseFloat(entry.total_charges),
        serviceWalletId: entry.service_wallet_id,
        paidAmount: paymentsResult.rows
          .filter(p => p.status === 'received')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0),
        pendingAmount: paymentsResult.rows
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0),
        balanceAmount: parseFloat(entry.total_charges) - paymentsResult.rows
          .filter(p => p.status === 'received')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0),
        expiryDate: entry.expiry_date ? entry.expiry_date.toISOString().split('T')[0] : null,
        status: entry.status,
        payments: paymentsResult.rows.map(p => ({
          id: p.id,
          wallet: p.wallet_id,
          method: p.wallet_type === 'cash' ? 'cash' : 'wallet',
          amount: parseFloat(p.amount),
          status: p.status,
        })),
      });
    }

    res.json(entries);
  } catch (err) {
    console.error('Error fetching service entries:', err);
    res.status(500).json({ error: 'Failed to fetch service entries: ' + err.message });
  }
});

// Get service entry by tokenId
router.get('/entry/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  try {
    const result = await req.db.query(`
      SELECT se.*, sc.name AS subcategory_name, s.wallet_id AS service_wallet_id, s.name AS service_name
      FROM service_entries se
      JOIN subcategories sc ON se.subcategory_id::integer = sc.id
      JOIN services s ON se.category_id::integer = s.id
      WHERE se.token_id = $1
    `, [tokenId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service entry not found' });
    }

    const entry = result.rows[0];
    const paymentsResult = await req.db.query(`
      SELECT p.id, p.wallet_id, p.amount, p.status, w.name AS wallet_name, w.wallet_type
      FROM payments p
      JOIN wallets w ON p.wallet_id = w.id
      WHERE p.service_entry_id = $1
    `, [entry.id]);

    const formattedEntry = {
      id: entry.id,
      tokenId: entry.token_id,
      customerName: entry.customer_name,
      phone: entry.phone,
      category: entry.category_id,
      subcategory: entry.subcategory_id,
      subcategoryName: entry.subcategory_name,
      serviceCharge: parseFloat(entry.service_charges),
      departmentCharge: parseFloat(entry.department_charges),
      totalCharge: parseFloat(entry.total_charges),
      serviceWalletId: entry.service_wallet_id,
      paidAmount: paymentsResult.rows
        .filter(p => p.status === 'received')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
      pendingAmount: paymentsResult.rows
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
      balanceAmount: parseFloat(entry.total_charges) - paymentsResult.rows
        .filter(p => p.status === 'received')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
      expiryDate: entry.expiry_date ? entry.expiry_date.toISOString().split('T')[0] : null,
      status: entry.status,
      payments: paymentsResult.rows.map(p => ({
        id: p.id,
        wallet: p.wallet_id,
        method: p.wallet_type === 'cash' ? 'cash' : 'wallet',
        amount: parseFloat(p.amount),
        status: p.status,
      })),
    };

    res.json(formattedEntry);
  } catch (err) {
    console.error('Error fetching service entry:', err);
    res.status(500).json({ error: 'Failed to fetch service entry: ' + err.message });
  }
});

// Create a new service entry
router.post('/entry', async (req, res) => {
  const {
    tokenId,
    customerName,
    phone,
    categoryId,
    subcategoryId,
    serviceCharge,
    departmentCharge,
    totalCharge,
    status,
    expiryDate,
    serviceWalletId,
    payments,
    staffId,
  } = req.body;

  console.log('Received payload:', JSON.stringify(req.body, null, 2));

  // Detailed validation
  const errors = [];
  if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
    errors.push('customerName is required and must be a non-empty string');
  }
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    errors.push('phone is required and must be a non-empty string');
  }
  if (!categoryId || isNaN(parseInt(categoryId))) {
    errors.push('categoryId is required and must be a valid integer');
  }
  if (!subcategoryId || isNaN(parseInt(subcategoryId))) {
    errors.push('subcategoryId is required and must be a valid integer');
  }
  if (serviceCharge == null || isNaN(parseFloat(serviceCharge)) || parseFloat(serviceCharge) < 0) {
    errors.push('serviceCharge is required and must be a non-negative number');
  }
  if (departmentCharge == null || isNaN(parseFloat(departmentCharge)) || parseFloat(departmentCharge) < 0) {
    errors.push('departmentCharge is required and must be a non-negative number');
  }
  const calculatedTotalCharge = parseFloat(serviceCharge || 0) + parseFloat(departmentCharge || 0);
  if (totalCharge == null || isNaN(parseFloat(totalCharge)) || parseFloat(totalCharge) !== calculatedTotalCharge) {
    errors.push('totalCharge must match serviceCharge + departmentCharge');
  }
  if (!status || !['pending', 'completed', 'not_received'].includes(status)) {
    errors.push('status is required and must be one of: pending, completed, not_received');
  }
  if (!expiryDate || isNaN(Date.parse(expiryDate))) {
    errors.push('expiryDate is required and must be a valid date');
  }
  if (!staffId || isNaN(parseInt(staffId))) {
    errors.push('staffId is required and must be a valid integer');
  }
  if (!serviceWalletId || isNaN(parseInt(serviceWalletId))) {
    errors.push('serviceWalletId is required and must be a valid integer');
  }
  if (!Array.isArray(payments) || payments.length === 0) {
    errors.push('payments must be a non-empty array');
  }

  if (payments) {
    for (const [index, payment] of payments.entries()) {
      if (!payment.wallet || isNaN(parseInt(payment.wallet))) {
        errors.push(`Payment ${index + 1}: wallet is required and must be a valid integer`);
      }
      if (!payment.method || !['cash', 'wallet'].includes(payment.method)) {
        errors.push(`Payment ${index + 1}: method is required and must be one of: cash, wallet`);
      }
      if (!payment.amount || isNaN(parseFloat(payment.amount)) || parseFloat(payment.amount) <= 0) {
        errors.push(`Payment ${index + 1}: amount is required and must be a positive number`);
      }
      if (!payment.status || !['received', 'pending', 'not_received'].includes(payment.status)) {
        errors.push(`Payment ${index + 1}: status is required and must be one of: received, pending, not_received`);
      }
    }
  }

  if (errors.length > 0) {
    console.log('Validation errors:', errors);
    return res.status(400).json({ error: 'Missing or invalid fields', details: errors });
  }

  try {
    await req.db.query('BEGIN');

    // Verify category and subcategory
    const categoryResult = await req.db.query('SELECT id, wallet_id, name FROM services WHERE id = $1', [parseInt(categoryId)]);
    if (categoryResult.rows.length === 0) {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Category ID ${categoryId} not found in services table` });
    }
    const serviceWallet = categoryResult.rows[0];
    const serviceName = serviceWallet.name;
    if (parseInt(serviceWalletId) !== serviceWallet.wallet_id) {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Service wallet ID ${serviceWalletId} does not match category wallet ID ${serviceWallet.wallet_id}` });
    }

    const subcategoryResult = await req.db.query(
      'SELECT id, service_id, requires_wallet, service_charges, department_charges, name FROM subcategories WHERE id = $1 AND service_id = $2',
      [parseInt(subcategoryId), parseInt(categoryId)]
    );
    if (subcategoryResult.rows.length === 0) {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Subcategory ID ${subcategoryId} not found for service ID ${categoryId}` });
    }

    // Verify charges
    const sub = subcategoryResult.rows[0];
    const subcategoryName = sub.name;
    if (parseFloat(serviceCharge) !== parseFloat(sub.service_charges) || parseFloat(departmentCharge) !== parseFloat(sub.department_charges)) {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Service or department charges do not match subcategory ${subcategoryId}` });
    }

    // Verify staff
    const staffResult = await req.db.query('SELECT id FROM staff WHERE id = $1', [parseInt(staffId)]);
    if (staffResult.rows.length === 0) {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Staff ID ${staffId} not found` });
    }

    // Verify service wallet and balance for department charge
    const serviceWalletResult = await req.db.query(
      'SELECT id, balance, wallet_type, status FROM wallets WHERE id = $1 AND (is_shared = true OR assigned_staff_id = $2)',
      [parseInt(serviceWalletId), parseInt(staffId)]
    );
    if (serviceWalletResult.rows.length === 0) {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Service wallet ID ${serviceWalletId} not found or access denied for staff ${staffId}` });
    }
    const serviceWalletData = serviceWalletResult.rows[0];
    if (serviceWalletData.status !== 'online' && parseFloat(departmentCharge) > 0) {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Service wallet ID ${serviceWalletId} is offline` });
    }
    if (parseFloat(serviceWalletData.balance) < parseFloat(departmentCharge)) {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient balance in service wallet ${serviceWalletId} (${serviceWalletData.balance} < ${departmentCharge})` });
    }

    // Verify payment wallets
    const totalReceived = payments
      .filter(p => p.status === 'received')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    if (totalReceived < calculatedTotalCharge && status === 'completed') {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Total received amount (${totalReceived}) is less than total charge (${calculatedTotalCharge}) for completed status` });
    }

    for (const payment of payments) {
      const walletResult = await req.db.query(
        'SELECT id, balance, wallet_type, status FROM wallets WHERE id = $1 AND (is_shared = true OR assigned_staff_id = $2)',
        [parseInt(payment.wallet), parseInt(staffId)]
      );
      if (walletResult.rows.length === 0) {
        await req.db.query('ROLLBACK');
        return res.status(400).json({ error: `Wallet ID ${payment.wallet} not found or access denied for staff ${staffId}` });
      }
      const wallet = walletResult.rows[0];
      if (payment.method === 'cash' && wallet.wallet_type !== 'cash') {
        await req.db.query('ROLLBACK');
        return res.status(400).json({ error: `Wallet ID ${payment.wallet} is not a cash wallet` });
      }
      if (payment.method === 'wallet' && wallet.status !== 'online') {
        await req.db.query('ROLLBACK');
        return res.status(400).json({ error: `Wallet ID ${payment.wallet} is not online` });
      }
    }

    // Insert service entry
    const finalTotalCharge = parseFloat(totalCharge);
    const result = await req.db.query(
      `INSERT INTO service_entries (
        token_id, customer_name, phone, category_id, subcategory_id, 
        service_charges, department_charges, total_charges, status, expiry_date, staff_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        tokenId || null,
        customerName.trim(),
        phone.trim(),
        parseInt(categoryId),
        parseInt(subcategoryId),
        parseFloat(serviceCharge),
        parseFloat(departmentCharge),
        finalTotalCharge,
        status || 'pending',
        expiryDate || null,
        parseInt(staffId),
      ]
    );
    const serviceEntryId = result.rows[0].id;

    // Debit department charge from service wallet
    if (parseFloat(departmentCharge) > 0) {
      await req.db.query(
        'UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [parseFloat(departmentCharge), parseInt(serviceWalletId)]
      );

      await req.db.query(
        `INSERT INTO wallet_transactions (
          wallet_id, staff_id, type, amount, description, category, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          parseInt(serviceWalletId),
          parseInt(staffId),
          'debit',
          parseFloat(departmentCharge),
          `Department charge for ${serviceName} - ${subcategoryName} (Service Entry #${serviceEntryId})`,
          'Department Payment',
        ]
      );
    }

    // Insert payments and update wallet balances
    for (const payment of payments) {
      await req.db.query(
        `INSERT INTO payments (service_entry_id, wallet_id, amount, status, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [serviceEntryId, parseInt(payment.wallet), parseFloat(payment.amount), payment.status]
      );

      if (payment.status === 'received') {
        if (payment.method === 'cash') {
          // Credit cash payment to wallet balance
          await req.db.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [parseFloat(payment.amount), parseInt(payment.wallet)]
          );

          await req.db.query(
            `INSERT INTO wallet_transactions (
              wallet_id, staff_id, type, amount, description, category, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [
              parseInt(payment.wallet),
              parseInt(staffId),
              'credit',
              parseFloat(payment.amount),
              `Cash payment for ${serviceName} - ${subcategoryName} (Service Entry #${serviceEntryId})`,
              'Service Payment',
            ]
          );
        } else if (payment.method === 'wallet') {
          // For online payments, no balance update (assumed handled externally)
          await req.db.query(
            `INSERT INTO wallet_transactions (
              wallet_id, staff_id, type, amount, description, category, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [
              parseInt(payment.wallet),
              parseInt(staffId),
              'credit',
              parseFloat(payment.amount),
              `Online payment for ${serviceName} - ${subcategoryName} (Service Entry #${serviceEntryId})`,
              'Service Payment',
            ]
          );
        }
      }
    }

    await req.db.query('COMMIT');
    res.status(201).json({ message: 'Service entry created successfully', serviceEntryId });
  } catch (err) {
    await req.db.query('ROLLBACK');
    console.error('Error creating service entry:', err);
    res.status(500).json({ error: 'Failed to create service entry: ' + err.message });
  }
});

export default router;