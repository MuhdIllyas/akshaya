import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// GET /api/servicemanagement/services
router.get('/services', authenticateToken, async (req, res) => {
  const { search } = req.query;
  const client = await pool.connect();
  try {
    let query = `
      SELECT s.*, (
        SELECT COALESCE(json_agg(sc), '[]'::json)
        FROM (
          SELECT sc.*, (
            SELECT COALESCE(json_agg(rd), '[]'::json)
            FROM required_documents rd
            WHERE rd.sub_category_id = sc.id
          ) AS required_documents
          FROM subcategories sc
          WHERE sc.service_id = s.id
        ) sc
      ) AS subcategories,
      (
        SELECT COALESCE(json_agg(rd), '[]'::json)
        FROM required_documents rd
        WHERE rd.service_id = s.id AND rd.sub_category_id IS NULL
      ) AS required_documents
      FROM services s
    `;
    let values = [];
    if (search) {
      query += ` WHERE s.name ILIKE $1 OR s.description ILIKE $1
                OR EXISTS (
                  SELECT 1 FROM subcategories sc
                  WHERE sc.service_id = s.id AND sc.name ILIKE $1
                )`;
      values = [`%${search}%`];
    }
    const result = await client.query(query, values);
    const services = result.rows.map(service => ({
      ...service,
      wallet_name: null,
      balance: null,
      wallet_type: null,
      is_shared: null,
      wallet_status: null,
      assigned_staff_id: null
    }));

    for (let service of services) {
      if (service.wallet_id) {
        const walletQuery = `SELECT * FROM wallets WHERE id = $1`;
        const walletResult = await client.query(walletQuery, [service.wallet_id]);
        if (walletResult.rows.length > 0) {
          const wallet = walletResult.rows[0];
          service.wallet_name = wallet.name;
          service.balance = wallet.balance;
          service.wallet_type = wallet.wallet_type;
          service.is_shared = wallet.is_shared;
          service.wallet_status = wallet.status;
          service.assigned_staff_id = wallet.assigned_staff_id;
        }
      }
    }

    res.json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/servicemanagement/services
router.post('/services', authenticateToken, async (req, res) => {
  const {
    name,
    description,
    wallet_id,
    website,
    status,
    department_charges,
    service_charges,
    requires_wallet,
    requiredDocuments,
    has_expiry
  } = req.body;

  const client = await pool.connect();
  try {
    if (!name || !description || !website || !status || department_charges == null || service_charges == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await client.query('BEGIN');

    let finalWalletId = null;
    if (req.user.role === 'superadmin') {
      if (wallet_id) {
        throw new Error('Superadmins cannot set wallet_id for services');
      }
    } else if (requires_wallet && wallet_id) {
      const walletQuery = `SELECT id, centre_id FROM wallets WHERE id = $1`;
      const walletResult = await client.query(walletQuery, [wallet_id]);
      if (walletResult.rows.length === 0) {
        throw new Error('Invalid wallet selected');
      }
      if (walletResult.rows[0].centre_id !== req.user.centre_id) {
        throw new Error('Wallet does not belong to your centre');
      }
      finalWalletId = wallet_id;
    } else if (requires_wallet && !wallet_id) {
      throw new Error('Wallet ID is required when requires_wallet is true for admins');
    } else if (!requires_wallet && wallet_id) {
      throw new Error('Wallet ID should not be provided when requires_wallet is false');
    }

    const serviceQuery = `
      INSERT INTO services (name, description, wallet_id, website, status, department_charges, service_charges, requires_wallet, has_expiry, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    const serviceValues = [
      name,
      description,
      finalWalletId,
      website,
      status,
      department_charges,
      service_charges,
      requires_wallet || false,
      has_expiry || false
    ];
    const serviceResult = await client.query(serviceQuery, serviceValues);
    const newService = serviceResult.rows[0];

    let documents = [];
    if (requiredDocuments && Array.isArray(requiredDocuments) && requiredDocuments.length > 0) {
      const docQuery = `
        INSERT INTO required_documents (service_id, document_name)
        VALUES ($1, $2)
        RETURNING *
      `;
      for (const doc of requiredDocuments) {
        const docResult = await client.query(docQuery, [newService.id, doc]);
        documents.push(docResult.rows[0]);
      }
    }

    const auditDetails = `Created service ${name} by ${req.user.role}`;
    await client.query(
      `
      INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      ['Service Created', req.user.username, auditDetails, req.user.centre_id]
    );

    await client.query('COMMIT');

    let wallet = null;
    if (newService.wallet_id) {
      const walletQuery = `SELECT * FROM wallets WHERE id = $1`;
      const walletResult = await client.query(walletQuery, [newService.wallet_id]);
      wallet = walletResult.rows[0];
    }

    const subcategoriesQuery = `
      SELECT *, (
        SELECT COALESCE(json_agg(rd), '[]'::json)
        FROM required_documents rd
        WHERE rd.sub_category_id = subcategories.id
      ) AS required_documents
      FROM subcategories WHERE service_id = $1
    `;
    const subcategoriesResult = await client.query(subcategoriesQuery, [newService.id]);

    res.status(201).json({
      ...newService,
      wallet_name: wallet?.name,
      balance: wallet?.balance,
      wallet_type: wallet?.wallet_type,
      is_shared: wallet?.is_shared,
      wallet_status: wallet?.status,
      assigned_staff_id: wallet?.assigned_staff_id,
      subcategories: subcategoriesResult.rows,
      required_documents: documents
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating service:', err);
    res.status(400).json({ error: err.message || 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/servicemanagement/services/:id
router.put('/services/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    wallet_id,
    website,
    status,
    department_charges,
    service_charges,
    requires_wallet,
    requiredDocuments,
    has_expiry
  } = req.body;

  const client = await pool.connect();
  try {
    if (!name || !description || !website || !status || department_charges == null || service_charges == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await client.query('BEGIN');

    const serviceCheck = await client.query('SELECT * FROM services WHERE id = $1', [id]);
    if (serviceCheck.rows.length === 0) {
      throw new Error('Service not found');
    }

    let finalWalletId = null;
    if (req.user.role === 'superadmin') {
      if (wallet_id) {
        throw new Error('Superadmins cannot set wallet_id for services');
      }
    } else if (requires_wallet && wallet_id) {
      const walletQuery = `SELECT id, centre_id FROM wallets WHERE id = $1`;
      const walletResult = await client.query(walletQuery, [wallet_id]);
      if (walletResult.rows.length === 0) {
        throw new Error('Invalid wallet selected');
      }
      if (walletResult.rows[0].centre_id !== req.user.centre_id) {
        throw new Error('Wallet does not belong to your centre');
      }
      finalWalletId = wallet_id;
    } else if (requires_wallet && !wallet_id) {
      throw new Error('Wallet ID is required when requires_wallet is true for admins');
    } else if (!requires_wallet && wallet_id) {
      throw new Error('Wallet ID should not be provided when requires_wallet is false');
    }

    const serviceQuery = `
      UPDATE services
      SET name = $1, description = $2, wallet_id = $3, website = $4, status = $5,
          department_charges = $6, service_charges = $7, requires_wallet = $8, has_expiry = $9,
          updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;
    const serviceValues = [
      name,
      description,
      finalWalletId,
      website,
      status,
      department_charges,
      service_charges,
      requires_wallet || false,
      has_expiry || false,
      id
    ];
    const serviceResult = await client.query(serviceQuery, serviceValues);
    if (serviceResult.rows.length === 0) {
      throw new Error('Service not found');
    }
    const updatedService = serviceResult.rows[0];

    await client.query('DELETE FROM required_documents WHERE service_id = $1 AND sub_category_id IS NULL', [id]);

    let documents = [];
    if (requiredDocuments && Array.isArray(requiredDocuments) && requiredDocuments.length > 0) {
      const docQuery = `
        INSERT INTO required_documents (service_id, document_name)
        VALUES ($1, $2)
        RETURNING *
      `;
      for (const doc of requiredDocuments) {
        const docResult = await client.query(docQuery, [id, doc]);
        documents.push(docResult.rows[0]);
      }
    }

    const auditDetails = `Updated service ${name} by ${req.user.role}`;
    await client.query(
      `
      INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      ['Service Updated', req.user.username, auditDetails, req.user.centre_id]
    );

    await client.query('COMMIT');

    let wallet = null;
    if (updatedService.wallet_id) {
      const walletQuery = `SELECT * FROM wallets WHERE id = $1`;
      const walletResult = await client.query(walletQuery, [updatedService.wallet_id]);
      wallet = walletResult.rows[0];
    }

    const subcategoriesQuery = `
      SELECT *, (
        SELECT COALESCE(json_agg(rd), '[]'::json)
        FROM required_documents rd
        WHERE rd.sub_category_id = subcategories.id
      ) AS required_documents
      FROM subcategories WHERE service_id = $1
    `;
    const subcategoriesResult = await client.query(subcategoriesQuery, [id]);

    res.json({
      ...updatedService,
      wallet_name: wallet?.name,
      balance: wallet?.balance,
      wallet_type: wallet?.wallet_type,
      is_shared: wallet?.is_shared,
      wallet_status: wallet?.status,
      assigned_staff_id: wallet?.assigned_staff_id,
      subcategories: subcategoriesResult.rows,
      required_documents: documents
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating service:', err);
    res.status(err.message === 'Service not found' ? 404 : 400).json({ error: err.message || 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/servicemanagement/services/:id
router.delete('/services/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const serviceCheck = await client.query('SELECT * FROM services WHERE id = $1', [id]);
    if (serviceCheck.rows.length === 0) {
      throw new Error('Service not found');
    }

    await client.query('DELETE FROM required_documents WHERE service_id = $1', [id]);
    await client.query('DELETE FROM subcategories WHERE service_id = $1', [id]);
    await client.query('DELETE FROM services WHERE id = $1', [id]);

    const auditDetails = `Deleted service ID ${id} by ${req.user.role}`;
    await client.query(
      `
      INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      ['Service Deleted', req.user.username, auditDetails, req.user.centre_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting service:', err);
    res.status(err.message === 'Service not found' ? 404 : 400).json({ error: err.message || 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/servicemanagement/services/:id/subcategories
router.post('/services/:id/subcategories', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, department_charges, service_charges, requires_wallet, requiredDocuments } = req.body;
  const client = await pool.connect();
  try {
    if (!name || department_charges == null || service_charges == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await client.query('BEGIN');

    const serviceCheck = await client.query('SELECT requires_wallet FROM services WHERE id = $1', [id]);
    if (serviceCheck.rows.length === 0) {
      throw new Error('Service not found');
    }
    const serviceRequiresWallet = serviceCheck.rows[0].requires_wallet;

    if (requires_wallet !== serviceRequiresWallet) {
      throw new Error('Subcategory requires_wallet must match the parent service');
    }

    const subcategoryQuery = `
      INSERT INTO subcategories (service_id, name, department_charges, service_charges, requires_wallet, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const subcategoryValues = [id, name, department_charges, service_charges, requires_wallet || false];
    const subcategoryResult = await client.query(subcategoryQuery, subcategoryValues);
    const newSubcategory = subcategoryResult.rows[0];

    let documents = [];
    if (requiredDocuments && Array.isArray(requiredDocuments) && requiredDocuments.length > 0) {
      const docQuery = `
        INSERT INTO required_documents (service_id, sub_category_id, document_name)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      for (const doc of requiredDocuments) {
        const docResult = await client.query(docQuery, [id, newSubcategory.id, doc]);
        documents.push(docResult.rows[0]);
      }
    }

    const auditDetails = `Added subcategory ${name} to service ID ${id} by ${req.user.role}`;
    await client.query(
      `
      INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      ['Subcategory Created', req.user.username, auditDetails, req.user.centre_id]
    );

    await client.query('COMMIT');

    res.status(201).json({ ...newSubcategory, required_documents: documents });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding subcategory:', err);
    res.status(err.message === 'Service not found' ? 404 : 400).json({ error: err.message || 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/servicemanagement/services/:id/subcategories/:subId
router.delete('/services/:id/subcategories/:subId', authenticateToken, async (req, res) => {
  const { id, subId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subcategoryCheck = await client.query('SELECT * FROM subcategories WHERE id = $1 AND service_id = $2', [subId, id]);
    if (subcategoryCheck.rows.length === 0) {
      throw new Error('Subcategory not found');
    }

    await client.query('DELETE FROM required_documents WHERE sub_category_id = $1', [subId]);
    await client.query('DELETE FROM subcategories WHERE id = $1 AND service_id = $2', [subId, id]);

    const auditDetails = `Deleted subcategory ID ${subId} from service ID ${id} by ${req.user.role}`;
    await client.query(
      `
      INSERT INTO audit_logs (action, performed_by, details, centre_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      ['Subcategory Deleted', req.user.username, auditDetails, req.user.centre_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting subcategory:', err);
    res.status(err.message === 'Subcategory not found' ? 404 : 400).json({ error: err.message || 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/servicemanagement/wallets
router.get('/wallets', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    let query = 'SELECT * FROM wallets';
    let values = [];
    if (req.user.role !== 'superadmin') {
      query += ' WHERE centre_id = $1';
      values = [req.user.centre_id];
    }
    const result = await client.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching wallets:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;