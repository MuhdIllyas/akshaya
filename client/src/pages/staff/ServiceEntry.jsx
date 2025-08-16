import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiPhone, FiCreditCard, FiDollarSign, FiCheck, FiX, FiCheckCircle, FiChevronDown, FiPlus, FiTrash2, FiCalendar, FiClock, FiEye } from 'react-icons/fi';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Set axios default headers for JWT
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

const ServiceEntry = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tokenId = queryParams.get('tokenId');

  const [formData, setFormData] = useState({
    tokenId: tokenId || '',
    customerName: '',
    phone: '',
    category: '',
    subcategory: '',
    serviceCharge: '',
    departmentCharge: '',
    totalCharge: '',
    status: 'pending',
    expiryDate: '',
    payments: [],
    serviceWalletId: null,
  });

  const [wallets, setWallets] = useState({ offline: [], online: [] });
  const [categories, setCategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [totalCharge, setTotalCharge] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [serviceEntries, setServiceEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const paymentStatusOptions = [
    { id: 'received', name: 'Received', color: 'bg-green-100 text-green-800' },
    { id: 'pending', name: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'not_received', name: 'Not Received', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const staffId = localStorage.getItem('id');
        console.log('Logged-in staffId:', staffId);
        if (!staffId) {
          throw new Error('No staff ID found in localStorage. Please log in again.');
        }

        // Fetch wallets
        const walletsRes = await axios.get('http://localhost:5000/api/wallet').catch(err => {
          console.error('Failed to fetch wallets:', err.response?.data || err.message);
          toast.error(`Failed to fetch wallets: ${err.response?.data?.error || err.message}`);
          return { data: [] };
        });
        console.log('Wallets response:', JSON.stringify(walletsRes.data, null, 2));
        const offlineWallets = walletsRes.data.filter(w => w.wallet_type === 'cash');
        const onlineWallets = walletsRes.data.filter(w => ['digital', 'bank', 'card'].includes(w.wallet_type) && w.status === 'online');
        setWallets({ offline: offlineWallets, online: onlineWallets });
        console.log('Set wallets:', JSON.stringify({ offline: offlineWallets, online: onlineWallets }, null, 2));
        if (offlineWallets.length === 0) {
          toast.warn('No offline wallets available.');
        }
        if (onlineWallets.length === 0) {
          toast.warn('No online wallets available.');
        }

        // Fetch categories
        const categoriesRes = await axios.get('http://localhost:5000/api/service/categories').catch(err => {
          console.error('Failed to fetch categories:', err.response?.data || err.message);
          toast.error(`Failed to fetch categories: ${err.response?.data?.error || err.message}`);
          return { data: [] };
        });
        console.log('Categories response:', JSON.stringify(categoriesRes.data, null, 2));
        setCategories(categoriesRes.data);

        // Fetch service entries
        const entriesRes = await axios.get('http://localhost:5000/api/service/entries').catch(err => {
          console.error('Failed to fetch entries:', err.response?.data || err.message);
          toast.error(`Failed to fetch service entries: ${err.response?.data?.error || err.message}`);
          return { data: [] };
        });
        setServiceEntries(entriesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.message}`);
        toast.error(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (tokenId) {
      const fetchTokenData = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/service/entry/${tokenId}`);
          console.log('Token data response:', JSON.stringify(res.data, null, 2));
          setFormData({
            tokenId,
            customerName: res.data.customerName || '',
            phone: res.data.phone || '',
            category: res.data.category ? String(res.data.category) : '',
            subcategory: res.data.subcategory ? String(res.data.subcategory) : '',
            serviceCharge: res.data.serviceCharge ? String(res.data.serviceCharge) : '',
            departmentCharge: res.data.departmentCharge ? String(res.data.departmentCharge) : '',
            totalCharge: res.data.totalCharge ? String(res.data.totalCharge) : '',
            status: res.data.status || 'pending',
            expiryDate: res.data.expiryDate || '',
            payments: res.data.payments || [],
            serviceWalletId: res.data.serviceWalletId || null,
          });
        } catch (err) {
          console.error('Error fetching token data:', err.response?.data || err.message);
          setError('Failed to load token data.');
          toast.error(`Failed to load token data: ${err.response?.data?.error || err.message}`);
        }
      };
      fetchTokenData();
    }
  }, [tokenId]);

  useEffect(() => {
    if (formData.category) {
      const category = categories.find(cat => cat.id === parseInt(formData.category));
      if (category) {
        setFilteredSubcategories(category.subcategories || []);
        setFormData(prev => ({ ...prev, serviceWalletId: category.walletId || null }));
        if (category.subcategories.length > 0 && !formData.subcategory) {
          const firstSub = category.subcategories[0];
          setFormData(prev => ({
            ...prev,
            subcategory: String(firstSub.id),
            serviceCharge: String(firstSub.serviceCharge),
            departmentCharge: String(firstSub.departmentCharge),
            totalCharge: String(parseFloat(firstSub.serviceCharge || 0) + parseFloat(firstSub.departmentCharge || 0)),
          }));
          setSelectedSubcategory(firstSub);
        }
      } else {
        setFormData(prev => ({ ...prev, subcategory: '', serviceCharge: '', departmentCharge: '', totalCharge: '', serviceWalletId: null }));
        setFilteredSubcategories([]);
        setSelectedSubcategory(null);
      }
    } else {
      setFilteredSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory: '', serviceCharge: '', departmentCharge: '', totalCharge: '', serviceWalletId: null }));
      setSelectedSubcategory(null);
    }
  }, [formData.category, categories]);

  useEffect(() => {
    const service = parseFloat(formData.serviceCharge) || 0;
    const dept = parseFloat(formData.departmentCharge) || 0;
    const total = service + dept;
    setTotalCharge(total);
    setFormData(prev => ({ ...prev, totalCharge: String(total) }));

    const received = formData.payments
      .filter(p => p.status === 'received')
      .reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

    const pending = formData.payments
      .filter(p => p.status === 'pending')
      .reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

    setPaidAmount(received);
    setPendingAmount(pending);
    setBalanceAmount(total - received);

    // Update status to 'completed' if fully paid
    if (received >= total && total > 0) {
      setFormData(prev => ({ ...prev, status: 'completed' }));
    } else {
      setFormData(prev => ({ ...prev, status: 'pending' }));
    }
  }, [formData.serviceCharge, formData.departmentCharge, formData.payments]);

  useEffect(() => {
    if (formData.subcategory) {
      const subcategory = filteredSubcategories.find(sub => sub.id === parseInt(formData.subcategory));
      setSelectedSubcategory(subcategory || null);
    } else {
      setSelectedSubcategory(null);
    }
  }, [formData.subcategory, filteredSubcategories]);

  useEffect(() => {
    if (formData.category && !formData.expiryDate) {
      const category = categories.find(cat => cat.id === parseInt(formData.category));
      if (category) {
        const today = new Date();
        const expiry = new Date();
        expiry.setDate(today.getDate() + 90);
        const formattedDate = expiry.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, expiryDate: formattedDate }));
        calculateDaysRemaining(formattedDate);
      }
    }
  }, [formData.category]);

  const calculateDaysRemaining = (dateString) => {
    if (!dateString) {
      setDaysRemaining(null);
      return;
    }
    const expiryDate = new Date(dateString);
    const today = new Date();
    const timeDiff = expiryDate - today;
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    setDaysRemaining(days);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Handle change: ${name} = ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'subcategory') {
      const category = categories.find(cat => cat.id === parseInt(formData.category));
      if (category) {
        const subcategory = category.subcategories.find(sub => sub.id === parseInt(value));
        if (subcategory) {
          const serviceCharge = parseFloat(subcategory.serviceCharge || 0);
          const departmentCharge = parseFloat(subcategory.departmentCharge || 0);
          const totalCharge = serviceCharge + departmentCharge;
          setFormData(prev => ({
            ...prev,
            serviceCharge: String(serviceCharge),
            departmentCharge: String(departmentCharge),
            totalCharge: String(totalCharge),
            payments: prev.payments.length === 0 ? [{
              method: 'cash', // Default to cash, but user can change
              wallet: wallets.offline.length > 0 ? String(wallets.offline[0].id) : wallets.online.length > 0 ? String(wallets.online[0].id) : '',
              amount: String(totalCharge),
              status: 'received'
            }] : prev.payments
          }));
          setSelectedSubcategory(subcategory);
        } else {
          setFormData(prev => ({ ...prev, serviceCharge: '', departmentCharge: '', totalCharge: '' }));
          setSelectedSubcategory(null);
        }
      }
    }

    if (name === 'expiryDate') {
      calculateDaysRemaining(value);
    }
  };

  const handlePaymentChange = (index, field, value) => {
    console.log(`Handle payment change: index=${index}, field=${field}, value=${value}`);
    const updatedPayments = [...formData.payments];
    updatedPayments[index] = { ...updatedPayments[index], [field]: value };
    setFormData(prev => ({ ...prev, payments: updatedPayments }));
  };

  const addPayment = () => {
    const defaultMethod = 'cash'; // Default to cash, user can switch to wallet
    const defaultWallet = wallets.offline.length > 0 ? String(wallets.offline[0].id) : wallets.online.length > 0 ? String(wallets.online[0].id) : '';
    setFormData(prev => ({
      ...prev,
      payments: [
        ...prev.payments,
        { method: defaultMethod, wallet: defaultWallet, amount: '', status: 'pending' },
      ],
    }));
  };

  const removePayment = (index) => {
    const updatedPayments = [...formData.payments];
    updatedPayments.splice(index, 1);
    setFormData(prev => ({ ...prev, payments: updatedPayments }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form data before validation:', JSON.stringify(formData, null, 2));

    // Validate form data
    const errors = [];
    if (!formData.customerName.trim()) errors.push('Customer name is required');
    if (!formData.phone.trim()) errors.push('Phone number is required');
    if (!formData.category || isNaN(parseInt(formData.category))) errors.push('Service category is required and must be a valid ID');
    if (!formData.subcategory || isNaN(parseInt(formData.subcategory))) errors.push('Service subcategory is required and must be a valid ID');
    if (!formData.serviceCharge || isNaN(parseFloat(formData.serviceCharge)) || parseFloat(formData.serviceCharge) < 0) {
      errors.push('Valid service charge is required and must be non-negative');
    }
    if (!formData.departmentCharge || isNaN(parseFloat(formData.departmentCharge)) || parseFloat(formData.departmentCharge) < 0) {
      errors.push('Valid department charge is required and must be non-negative');
    }
    if (!formData.totalCharge || isNaN(parseFloat(formData.totalCharge)) || parseFloat(formData.totalCharge) < 0) {
      errors.push('Valid total charge is required and must be non-negative');
    }
    if (!formData.expiryDate || isNaN(Date.parse(formData.expiryDate))) errors.push('Service expiry date is required and must be a valid date');
    if (formData.payments.length === 0) errors.push('At least one payment is required');
    if (balanceAmount > 0) errors.push(`Balance amount of ₹${balanceAmount} remains. Add payments to cover the full amount.`);
    const staffId = localStorage.getItem('id');
    if (!staffId || isNaN(parseInt(staffId))) errors.push('Staff ID is missing or invalid. Please log in again.');
    if (!formData.serviceWalletId || isNaN(parseInt(formData.serviceWalletId))) errors.push('Service must have an assigned wallet');

    // Validate payments
    formData.payments.forEach((p, index) => {
      if (!p.wallet || isNaN(parseInt(p.wallet))) errors.push(`Payment ${index + 1}: Valid wallet ID is required`);
      if (!p.method || !['cash', 'wallet'].includes(p.method)) errors.push(`Payment ${index + 1}: Valid payment method (cash or wallet) is required`);
      if (!p.amount || isNaN(parseFloat(p.amount)) || parseFloat(p.amount) <= 0) {
        errors.push(`Payment ${index + 1}: Valid amount greater than 0 is required`);
      }
      if (!p.status || !['received', 'pending', 'not_received'].includes(p.status)) {
        errors.push(`Payment ${index + 1}: Valid status (received, pending, not_received) is required`);
      }
    });

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      errors.forEach(error => toast.error(error));
      return;
    }

    try {
      const submissionData = {
        tokenId: formData.tokenId || null,
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        categoryId: parseInt(formData.category),
        subcategoryId: parseInt(formData.subcategory),
        serviceCharge: parseFloat(formData.serviceCharge),
        departmentCharge: parseFloat(formData.departmentCharge),
        totalCharge: parseFloat(formData.totalCharge),
        status: formData.status,
        expiryDate: formData.expiryDate,
        serviceWalletId: parseInt(formData.serviceWalletId),
        payments: formData.payments.map(p => ({
          wallet: parseInt(p.wallet),
          method: p.method,
          amount: parseFloat(p.amount),
          status: p.status,
        })),
        staffId: parseInt(staffId),
      };

      console.log('Submitting data:', JSON.stringify(submissionData, null, 2));

      const response = await axios.post('http://localhost:5000/api/service/entry', submissionData);
      console.log('Submission response:', JSON.stringify(response.data, null, 2));
      toast.success('Service entry submitted successfully!');

      setFormData({
        tokenId: tokenId || '',
        customerName: '',
        phone: '',
        category: '',
        subcategory: '',
        serviceCharge: '',
        departmentCharge: '',
        totalCharge: '',
        status: 'pending',
        expiryDate: '',
        payments: [],
        serviceWalletId: null,
      });
      setFilteredSubcategories([]);
      setSelectedSubcategory(null);
      setTotalCharge(0);
      setPaidAmount(0);
      setPendingAmount(0);
      setBalanceAmount(0);
      setDaysRemaining(null);

      const entriesRes = await axios.get('http://localhost:5000/api/service/entries');
      setServiceEntries(entriesRes.data);
    } catch (err) {
      console.error('Error submitting service entry:', err.response?.data || err.message);
      if (err.response?.data?.details) {
        err.response.data.details.forEach(detail => toast.error(detail));
      } else {
        toast.error(err.response?.data?.error || 'Failed to submit service entry.');
      }
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === parseInt(categoryId));
    return category ? category.name : 'N/A';
  };

  const getSubcategoryName = (categoryId, subcategoryId) => {
    const category = categories.find(c => c.id === parseInt(categoryId));
    if (category) {
      const subcategory = category.subcategories.find(s => s.id === parseInt(subcategoryId));
      return subcategory ? subcategory.name : 'N/A';
    }
    return 'N/A';
  };

  const formatPayments = (payments) => {
    return payments.map(p => {
      let walletName = '';
      if (p.method === 'cash') {
        const wallet = wallets.offline.find(w => w.id === parseInt(p.wallet));
        walletName = wallet ? wallet.name : 'Offline Payment';
      } else {
        const wallet = wallets.online.find(w => w.id === parseInt(p.wallet));
        walletName = wallet ? wallet.name : 'Digital Wallet';
      }
      return `${walletName}: ₹${p.amount} (${p.status})`;
    }).join(', ');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <ToastContainer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {tokenId ? 'Token-Based Service Entry' : 'New Service Entry'}
            </h2>
            <p className="text-gray-600 mt-2">
              {tokenId ? `Processing token #${tokenId}` : 'Create a new service entry'}
            </p>
          </div>
          {tokenId && (
            <div className="bg-indigo-100 p-3 rounded-xl">
              <div className="text-center">
                <span className="text-xs text-indigo-800 block">Token ID</span>
                <span className="text-lg font-bold text-indigo-900">#{tokenId}</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {tokenId && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <FiCheck className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-blue-800">
                  Working from token #{tokenId} - Customer information pre-filled
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2 space-y-6">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  Customer Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiUser className="mr-2 text-indigo-600" />
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiPhone className="mr-2 text-indigo-600" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      pattern="\+?[1-9]\d{1,14}"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  Service Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Category *
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category.id} value={String(category.id)}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <FiChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Subcategory *
                    </label>
                    <div className="relative">
                      <select
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleChange}
                        required
                        disabled={!formData.category}
                        className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none ${!formData.category ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select subcategory</option>
                        {filteredSubcategories.map(subcategory => (
                          <option key={subcategory.id} value={String(subcategory.id)}>
                            {subcategory.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <FiChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Charge (₹)
                    </label>
                    <input
                      type="number"
                      name="serviceCharge"
                      value={formData.serviceCharge}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department Charge (₹)
                    </label>
                    <input
                      type="number"
                      name="departmentCharge"
                      value={formData.departmentCharge}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Charge (₹)
                    </label>
                    <input
                      type="number"
                      name="totalCharge"
                      value={formData.totalCharge}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-1/2 space-y-6">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FiClock className="mr-2 text-indigo-600" />
                  Service Expiry
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiCalendar className="mr-2 text-indigo-600" />
                      Service Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-indigo-700">Days Remaining</p>
                      {daysRemaining !== null ? (
                        <p className={`text-2xl font-bold ${
                          daysRemaining < 0 ? 'text-red-900' :
                          daysRemaining < 7 ? 'text-yellow-900' : 'text-indigo-900'
                        }`}>
                          {daysRemaining}
                        </p>
                      ) : (
                        <p className="text-gray-500">Set expiry date</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FiCreditCard className="mr-2 text-indigo-600" />
                    Payment Information
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={addPayment}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center text-sm"
                  >
                    <FiPlus className="mr-1" />
                    Add Payment
                  </motion.button>
                </div>
                {formData.payments.length === 0 ? (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-gray-200 text-center">
                    <p className="text-yellow-700">No payments added yet. Click "Add Payment" to add payment methods.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {formData.payments.map((payment, index) => (
                      <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 relative">
                        <button
                          type="button"
                          onClick={() => removePayment(index)}
                          className="absolute top-3 right-3 p-1 text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Method *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex items-center cursor-pointer bg-gray-100 p-2 rounded-lg">
                                <input
                                  type="radio"
                                  name={`paymentMethod-${index}`}
                                  value="cash"
                                  checked={payment.method === 'cash'}
                                  onChange={() => handlePaymentChange(index, 'method', 'cash')}
                                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                                  required
                                />
                                <span className="ml-2 text-gray-700">Offline Payment</span>
                              </label>
                              <label className="flex items-center cursor-pointer bg-gray-100 p-2 rounded-lg">
                                <input
                                  type="radio"
                                  name={`paymentMethod-${index}`}
                                  value="wallet"
                                  checked={payment.method === 'wallet'}
                                  onChange={() => handlePaymentChange(index, 'method', 'wallet')}
                                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                                  required
                                />
                                <span className="ml-2 text-gray-700">Digital Wallet</span>
                              </label>
                            </div>
                          </div>
                          {payment.method === 'cash' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Offline Payment Type *
                              </label>
                              <div className="relative">
                                <select
                                  value={payment.wallet || ''}
                                  onChange={(e) => handlePaymentChange(index, 'wallet', e.target.value)}
                                  required
                                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                >
                                  <option value="">Select payment type</option>
                                  {wallets.offline.length === 0 ? (
                                    <option value="" disabled>No offline wallets available</option>
                                  ) : (
                                    wallets.offline.map(wallet => (
                                      <option key={wallet.id} value={String(wallet.id)}>
                                        {wallet.name}
                                      </option>
                                    ))
                                  )}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                  <FiChevronDown className="h-5 w-5" />
                                </div>
                              </div>
                            </div>
                          )}
                          {payment.method === 'wallet' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Digital Wallet *
                              </label>
                              <div className="relative">
                                <select
                                  value={payment.wallet || ''}
                                  onChange={(e) => handlePaymentChange(index, 'wallet', e.target.value)}
                                  required
                                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                >
                                  <option value="">Select wallet</option>
                                  {wallets.online.length === 0 ? (
                                    <option value="" disabled>No online wallets available</option>
                                  ) : (
                                    wallets.online.map(wallet => (
                                      <option key={wallet.id} value={String(wallet.id)}>
                                        {wallet.name}
                                      </option>
                                    ))
                                  )}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                  <FiChevronDown className="h-5 w-5" />
                                </div>
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <FiDollarSign className="mr-2 text-indigo-600" />
                              Amount (₹) *
                            </label>
                            <input
                              type="number"
                              value={payment.amount || ''}
                              onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                              required
                              min="0.01"
                              step="0.01"
                              max={balanceAmount + (parseFloat(payment.amount) || 0)}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter amount"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Max: ₹{balanceAmount + (parseFloat(payment.amount) || 0)}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Status *
                            </label>
                            <div className="relative">
                              <select
                                value={payment.status || 'pending'}
                                onChange={(e) => handlePaymentChange(index, 'status', e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                              >
                                {paymentStatusOptions.map(status => (
                                  <option key={status.id} value={status.id}>
                                    {status.name}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <FiChevronDown className="h-5 w-5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-white p-4 rounded-xl border border-gray-200 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-700 font-medium">Total Charge</div>
                      <div className="text-xl font-bold text-blue-900">₹{totalCharge}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-green-700 font-medium">Amount Received</div>
                      <div className="text-xl font-bold text-green-900">₹{paidAmount}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-sm text-yellow-700 font-medium">Amount Pending</div>
                      <div className="text-xl font-bold text-yellow-900">₹{pendingAmount}</div>
                    </div>
                    <div className={`p-3 rounded-lg ${balanceAmount > 0 ? 'bg-red-50' : 'bg-indigo-50'}`}>
                      <div className="text-sm font-medium">
                        {balanceAmount > 0 ? 'Balance Amount' : 'Payment Status'}
                      </div>
                      <div className={`text-xl font-bold ${balanceAmount > 0 ? 'text-red-900' : 'text-indigo-900'}`}>
                        {balanceAmount > 0 ? `₹${balanceAmount}` : 'Fully Paid'}
                      </div>
                    </div>
                  </div>
                  {balanceAmount > 0 && (
                    <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="text-yellow-700 text-sm">
                        <span className="font-medium">Note:</span> Balance amount of ₹{balanceAmount} remains.
                        Please add another payment method or mark the balance as credit.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                setFormData({
                  tokenId: tokenId || '',
                  customerName: '',
                  phone: '',
                  category: '',
                  subcategory: '',
                  serviceCharge: '',
                  departmentCharge: '',
                  totalCharge: '',
                  status: 'pending',
                  expiryDate: '',
                  payments: [],
                  serviceWalletId: null,
                });
                setFilteredSubcategories([]);
                setSelectedSubcategory(null);
                setTotalCharge(0);
                setPaidAmount(0);
                setPendingAmount(0);
                setBalanceAmount(0);
                setDaysRemaining(null);
              }}
              className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center"
            >
              <FiX className="mr-2" />
              Reset
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center shadow-md"
            >
              <FiCheck className="mr-2" />
              {tokenId ? 'Complete Service' : 'Create Service Entry'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <FiEye className="mr-2 text-indigo-600" />
          Service Entries
        </h3>
        {serviceEntries.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center">
            <FiCheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No service entries yet. Submit a service entry to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Charges
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payments
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.tokenId ? `T${entry.tokenId}` : `S${entry.id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.customerName}</div>
                      <div className="text-sm text-gray-500">{entry.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getCategoryName(entry.category)}</div>
                      <div className="text-sm text-gray-500">{getSubcategoryName(entry.category, entry.subcategory)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Total: ₹{entry.totalCharge}</div>
                      <div className="text-green-600">Paid: ₹{entry.paidAmount}</div>
                      {entry.balanceAmount > 0 && (
                        <div className="text-red-600">Balance: ₹{entry.balanceAmount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      {formatPayments(entry.payments)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.expiryDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                          entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceEntry;