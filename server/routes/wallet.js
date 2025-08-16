import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Apply JWT middleware to all routes
router.use(authenticateToken);

// Get all wallets (for ServiceEntry.jsx)
router.get('/', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT id, name, balance, wallet_type, status, centre_id
      FROM wallets
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching wallets:', err);
    res.status(500).json({ error: 'Failed to fetch wallets: ' + err.message });
  }
});

// Get all wallets (existing route, possibly for WalletManagement.jsx)
router.get('/wallets', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT w.*, c.name AS centre_name
      FROM wallets w
      LEFT JOIN centres c ON w.centre_id = c.id
      ORDER BY w.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching wallets:', err);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

// Create a new wallet
router.post('/create', async (req, res) => {
  const { name, balance, wallet_type, is_shared, assigned_staff_id, status, centre_id } = req.body;
  const userCentreId = req.user.centre_id; // From JWT
  const finalCentreId = req.user.role === 'superadmin' ? centre_id : userCentreId; // Superadmins specify centre_id, admins use their own

  if (!finalCentreId) {
    return res.status(400).json({ error: 'Centre ID is required' });
  }

  const client = await req.db.connect();
  try {
    await client.query('BEGIN');

    // Insert wallet
    const walletResult = await client.query(
      `INSERT INTO wallets (
        name, balance, wallet_type, is_shared, assigned_staff_id, status, centre_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING *`,
      [name, balance, wallet_type, is_shared, assigned_staff_id || null, status, finalCentreId]
    );

    const wallet = walletResult.rows[0];

    // Insert initial transaction if balance > 0
    if (balance > 0) {
      await client.query(
        `INSERT INTO wallet_transactions (
          wallet_id, staff_id, type, amount, description, created_at
        ) VALUES (
          $1, $2, 'credit', $3, $4, NOW()
        )`,
        [wallet.id, assigned_staff_id || null, balance, `Initial balance for ${name}`]
      );
    }

    // Fetch centre name for audit log
    const centreResult = await client.query('SELECT name FROM centres WHERE id = $1', [finalCentreId]);
    const centreName = centreResult.rows[0]?.name || 'Unknown Centre';

    // Insert audit log with detailed description
    await client.query(
      `INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      ['Wallet Created', req.user.username, `Created wallet ${name} for ${centreName}`, finalCentreId]
    );

    await client.query('COMMIT');
    res.status(201).json(walletResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating wallet:', err);
    res.status(500).json({ error: 'Failed to create wallet' });
  } finally {
    client.release();
  }
});

// Update a wallet
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, balance, wallet_type, is_shared, assigned_staff_id, status } = req.body;

  const client = await req.db.connect();
  try {
    await client.query('BEGIN');

    // Get current wallet to get centre_id
    const currentWallet = await client.query('SELECT * FROM wallets WHERE id = $1', [id]);
    if (currentWallet.rows.length === 0) {
      throw new Error('Wallet not found');
    }
    const centreId = currentWallet.rows[0].centre_id;

    const result = await client.query(
      `UPDATE wallets SET
        name = $1,
        balance = $2,
        wallet_type = $3,
        is_shared = $4,
        assigned_staff_id = $5,
        status = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *`,
      [name, balance, wallet_type, is_shared, assigned_staff_id || null, status, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Wallet not found');
    }

    // Fetch centre name for audit log
    const centreResult = await client.query('SELECT name FROM centres WHERE id = $1', [centreId]);
    const centreName = centreResult.rows[0]?.name || 'Unknown Centre';

    // Insert audit log with detailed description
    await client.query(
      `INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      ['Wallet Updated', req.user.username, `Updated wallet ${name} for ${centreName}`, centreId]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating wallet:', err);
    res.status(err.message === 'Wallet not found' ? 404 : 500).json({ error: 'Failed to update wallet' });
  } finally {
    client.release();
  }
});

// Delete a wallet
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const client = await req.db.connect();
  try {
    await client.query('BEGIN');

    // Get wallet first to get centre_id
    const walletResult = await client.query(
      `SELECT * FROM wallets WHERE id = $1`,
      [id]
    );
    
    if (walletResult.rows.length === 0) {
      throw new Error('Wallet not found');
    }
    
    const wallet = walletResult.rows[0];
    const centreId = wallet.centre_id;

    // Fetch centre name for audit log
    const centreResult = await client.query('SELECT name FROM centres WHERE id = $1', [centreId]);
    const centreName = centreResult.rows[0]?.name || 'Unknown Centre';

    // Now delete the wallet
    await client.query(
      `DELETE FROM wallets WHERE id = $1`,
      [id]
    );

    // Insert audit log with detailed description
    await client.query(
      `INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      ['Wallet Deleted', req.user.username, `Deleted wallet ${wallet.name} for ${centreName}`, centreId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Wallet deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting wallet:', err);
    res.status(err.message === 'Wallet not found' ? 404 : 500).json({ error: 'Failed to delete wallet' });
  } finally {
    client.release();
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT 
        wt.*,
        w.name AS wallet_name,
        s.name AS staff_name,
        s.role AS staff_role,
        s.photo AS staff_photo
      FROM wallet_transactions wt
      LEFT JOIN wallets w ON wt.wallet_id = w.id
      LEFT JOIN staff s ON wt.staff_id = s.id
      ORDER BY wt.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get all staff
router.get('/all', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT 
        id, 
        name, 
        role, 
        photo AS "photoUrl",
        centre_id AS "centreId"
      FROM staff
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Create a new transaction
router.post('/transactions', async (req, res) => {
  const { wallet_id, staff_id, type, amount, description, category } = req.body;

  if (!wallet_id || !type || !amount) {
    return res.status(400).json({ error: 'wallet_id, type, and amount are required' });
  }
  if (!['credit', 'debit'].includes(type)) {
    return res.status(400).json({ error: 'type must be either "credit" or "debit"' });
  }
  if (amount <= 0) {
    return res.status(400).json({ error: 'amount must be positive' });
  }

  const client = await req.db.connect();
  try {
    await client.query('BEGIN');

    const walletResult = await client.query('SELECT * FROM wallets WHERE id = $1', [wallet_id]);
    if (walletResult.rows.length === 0) {
      throw new Error('Wallet not found');
    }
    
    const wallet = walletResult.rows[0];
    const centreId = wallet.centre_id;

    const transactionResult = await client.query(
      `INSERT INTO wallet_transactions (
        wallet_id, staff_id, type, amount, description, category, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW()
      ) RETURNING *`,
      [wallet_id, staff_id || null, type, amount, description, category]
    );

    const transaction = transactionResult.rows[0];

    if (type === 'credit') {
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
        [amount, wallet_id]
      );
    } else if (type === 'debit') {
      await client.query(
        `UPDATE wallets SET balance = balance - $1 WHERE id = $2`,
        [amount, wallet_id]
      );
    }

    // Fetch centre name for audit log
    const centreResult = await client.query('SELECT name FROM centres WHERE id = $1', [centreId]);
    const centreName = centreResult.rows[0]?.name || 'Unknown Centre';

    // Insert audit log with detailed description
    await client.query(
      `INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      ['Transaction Created', req.user.username, `Created transaction: ${description || 'No description'} for ${wallet.name} (${centreName})`, centreId]
    );

    await client.query('COMMIT');
    res.status(201).json(transaction);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating transaction:', err);
    if (err.message === 'Wallet not found') {
      res.status(404).json({ error: 'Wallet not found' });
    } else {
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  } finally {
    client.release();
  }
});

// Transfer between wallets
router.post('/transfer', async (req, res) => {
  const { from_wallet_id, to_wallet_id, amount, description, staff_id, category } = req.body;

  if (!from_wallet_id || !to_wallet_id || !amount || !staff_id) {
    return res.status(400).json({ error: 'from_wallet_id, to_wallet_id, amount, and staff_id are required' });
  }
  if (from_wallet_id === to_wallet_id) {
    return res.status(400).json({ error: 'Source and destination wallets cannot be the same' });
  }
  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }

  const client = await req.db.connect();
  try {
    await client.query('BEGIN');

    // Fetch wallet details
    const fromWalletResult = await client.query(
      'SELECT w.*, c.name AS centre_name FROM wallets w LEFT JOIN centres c ON w.centre_id = c.id WHERE w.id = $1',
      [from_wallet_id]
    );
    const toWalletResult = await client.query(
      'SELECT w.*, c.name AS centre_name FROM wallets w LEFT JOIN centres c ON w.centre_id = c.id WHERE w.id = $1',
      [to_wallet_id]
    );

    if (fromWalletResult.rows.length === 0) {
      throw new Error('Source wallet not found');
    }
    if (toWalletResult.rows.length === 0) {
      throw new Error('Destination wallet not found');
    }

    const fromWallet = fromWalletResult.rows[0];
    const toWallet = toWalletResult.rows[0];

    if (fromWallet.balance < amount) {
      throw new Error('Insufficient balance in source wallet');
    }

    const staffResult = await client.query('SELECT id FROM staff WHERE id = $1', [staff_id]);
    if (staffResult.rows.length === 0) {
      throw new Error('Staff not found');
    }

    // Create debit transaction
    const debitTransaction = await client.query(
      `INSERT INTO wallet_transactions (
        wallet_id, staff_id, type, amount, description, category, created_at
      ) VALUES (
        $1, $2, 'debit', $3, $4, $5, NOW()
      ) RETURNING *`,
      [from_wallet_id, staff_id, amount, description || `Transfer to ${toWallet.name} (${toWallet.centre_name || 'Unknown Centre'})`, category || 'Transfer']
    );

    // Create credit transaction
    const creditTransaction = await client.query(
      `INSERT INTO wallet_transactions (
        wallet_id, staff_id, type, amount, description, category, created_at
      ) VALUES (
        $1, $2, 'credit', $3, $4, $5, NOW()
      ) RETURNING *`,
      [to_wallet_id, staff_id, amount, description || `Transfer from ${fromWallet.name} (${fromWallet.centre_name || 'Unknown Centre'})`, category || 'Transfer']
    );

    // Update balances
    await client.query(
      `UPDATE wallets SET balance = balance - $1 WHERE id = $2`,
      [amount, from_wallet_id]
    );
    await client.query(
      `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
      [amount, to_wallet_id]
    );

    // Insert audit log with detailed description
    const auditDetails = description || `Transferred ${amount} from ${fromWallet.name} (${fromWallet.centre_name || 'Unknown Centre'}) to ${toWallet.name} (${toWallet.centre_name || 'Unknown Centre'})`;
    await client.query(
      `INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      ['Wallet Transfer', req.user.username, auditDetails, fromWallet.centre_id]
    );

    await client.query('COMMIT');
    res.status(201).json({
      debit_transaction: debitTransaction.rows[0],
      credit_transaction: creditTransaction.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error processing transfer:', err);
    if (err.message === 'Source wallet not found' || err.message === 'Destination wallet not found') {
      res.status(404).json({ error: err.message });
    } else if (err.message === 'Insufficient balance in source wallet') {
      res.status(400).json({ error: err.message });
    } else if (err.message === 'Staff not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Failed to process transfer' });
    }
  } finally {
    client.release();
  }
});

// Get a single wallet by ID
router.get('/wallets/:walletId', async (req, res) => {
  const { walletId } = req.params;
  try {
    const result = await req.db.query(
      `SELECT * FROM wallets WHERE id = $1`,
      [walletId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching wallet:', err);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// Get transactions for a specific wallet
router.get('/transactions/:walletId', async (req, res) => {
  const { walletId } = req.params;
  try {
    const result = await req.db.query(
      `
      SELECT 
        wt.*,
        w.name AS wallet_name,
        s.name AS staff_name,
        s.role AS staff_role,
        s.photo AS staff_photo
      FROM wallet_transactions wt
      LEFT JOIN wallets w ON wt.wallet_id = w.id
      LEFT JOIN staff s ON wt.staff_id = s.id
      WHERE wt.wallet_id = $1
      ORDER BY wt.created_at DESC
      `,
      [walletId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching wallet transactions:', err);
    res.status(500).json({ error: 'Failed to fetch wallet transactions' });
  }
});

// Get audit logs with centre names
router.get('/audit-logs', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT 
        al.*, 
        c.name AS centre_name
      FROM audit_logs al
      LEFT JOIN centres c ON al.centre_id = c.id
      ORDER BY al.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get centres
router.get('/centres', async (req, res) => {
  try {
    const result = await req.db.query('SELECT * FROM centres ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching centres:', err);
    res.status(500).json({ error: 'Failed to fetch centres' });
  }
});

export default router;