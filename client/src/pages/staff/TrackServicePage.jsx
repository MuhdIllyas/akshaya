import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiMail, FiPhone, FiMessageSquare, FiCheckCircle, FiClock, FiRefreshCw, FiSend, FiEdit, FiAlertCircle, FiInfo } from 'react-icons/fi';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Set axios default headers for JWT
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

const TrackServicePage = () => {
  const [serviceEntries, setServiceEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [notificationModal, setNotificationModal] = useState({
    open: false,
    entryId: null,
    message: '',
    method: 'whatsapp',
  });
  const [statusUpdateModal, setStatusUpdateModal] = useState({
    open: false,
    entryId: null,
    newStatus: '',
  });
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');

  const statusOptions = [
    { id: 'pending', name: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'in_progress', name: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { id: 'ready_for_delivery', name: 'Ready for Delivery', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'delivered', name: 'Delivered', color: 'bg-purple-100 text-purple-800' },
    { id: 'completed', name: 'Completed', color: 'bg-green-100 text-green-800' },
    { id: 'cancelled', name: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  const categoryOptions = [
    { id: 'all', name: 'All Categories' },
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Home Appliances' },
    { id: '3', name: 'Furniture' },
    { id: '4', name: 'Automotive' },
    { id: '5', name: 'Jewelry' },
  ];

  const dateRangeOptions = [
    { id: 'all', name: 'All Dates' },
    { id: 'today', name: 'Today' },
    { id: 'this_week', name: 'This Week' },
    { id: 'this_month', name: 'This Month' },
    { id: 'last_week', name: 'Last Week' },
    { id: 'last_month', name: 'Last Month' },
  ];

  useEffect(() => {
    const fetchServiceEntries = async () => {
      setLoading(true);
      try {
        const staffId = localStorage.getItem('id');
        if (!staffId) {
          throw new Error('No staff ID found in localStorage. Please log in again.');
        }

        const response = await axios.get('http://localhost:5000/api/service/entries');
        setServiceEntries(response.data);
        setFilteredEntries(response.data);
        
        // Check WhatsApp connection status
        checkWhatsAppConnection();
      } catch (err) {
        console.error('Error fetching service entries:', err.response?.data || err.message);
        setError(`Failed to load service entries: ${err.response?.data?.error || err.message}`);
        toast.error(`Failed to load service entries: ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceEntries();
  }, []);

  useEffect(() => {
    let result = serviceEntries;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(entry => 
        entry.customerName.toLowerCase().includes(term) || 
        entry.phone.includes(term) ||
        (entry.tokenId && `T${entry.tokenId}`.includes(term)) ||
        (entry.id && `S${entry.id}`.includes(term)));
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(entry => entry.status === filters.status);
    }
    
    // Apply category filter
    if (filters.category !== 'all') {
      result = result.filter(entry => entry.category === filters.category);
    }
    
    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const today = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          result = result.filter(entry => {
            const entryDate = new Date(entry.createdAt);
            return entryDate.toDateString() === today.toDateString();
          });
          break;
        case 'this_week': {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          result = result.filter(entry => new Date(entry.createdAt) >= startOfWeek);
          break;
        }
        case 'this_month': {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          result = result.filter(entry => new Date(entry.createdAt) >= startOfMonth);
          break;
        }
        case 'last_week': {
          const startOfLastWeek = new Date(today);
          startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
          const endOfLastWeek = new Date(today);
          endOfLastWeek.setDate(today.getDate() - today.getDay());
          result = result.filter(entry => {
            const entryDate = new Date(entry.createdAt);
            return entryDate >= startOfLastWeek && entryDate < endOfLastWeek;
          });
          break;
        }
        case 'last_month': {
          const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
          result = result.filter(entry => {
            const entryDate = new Date(entry.createdAt);
            return entryDate >= startOfLastMonth && entryDate <= endOfLastMonth;
          });
          break;
        }
        default:
          break;
      }
    }
    
    setFilteredEntries(result);
  }, [searchTerm, filters, serviceEntries]);

  const checkWhatsAppConnection = async () => {
    try {
      // In a real app, this would call your backend to check WhatsApp connection status
      // For demo, we'll simulate the request
      const response = await axios.get('http://localhost:5000/api/whatsapp/status');
      setWhatsappConnected(response.data.connected);
      setWhatsappStatus(response.data.status);
    } catch (err) {
      console.error('Error checking WhatsApp status:', err);
      setWhatsappConnected(false);
      setWhatsappStatus('disconnected');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/service/entries');
      setServiceEntries(response.data);
      toast.success('Service entries refreshed successfully!');
      checkWhatsAppConnection();
    } catch (err) {
      console.error('Error refreshing service entries:', err.response?.data || err.message);
      toast.error(`Failed to refresh service entries: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openNotificationModal = (entryId) => {
    setNotificationModal({
      open: true,
      entryId,
      message: '',
      method: 'whatsapp'
    });
  };

  const closeNotificationModal = () => {
    setNotificationModal({
      open: false,
      entryId: null,
      message: '',
      method: 'whatsapp'
    });
  };

  const openStatusUpdateModal = (entryId, currentStatus) => {
    setStatusUpdateModal({
      open: true,
      entryId,
      newStatus: currentStatus
    });
  };

  const closeStatusUpdateModal = () => {
    setStatusUpdateModal({
      open: false,
      entryId: null,
      newStatus: ''
    });
  };

  const sendWhatsAppNotification = async (phone, message) => {
    try {
      // This would call your backend API that integrates with Libromi WhatsApp webhook
      const response = await axios.post('http://localhost:5000/api/whatsapp/send', {
        phone,
        message
      });
      
      return response.data;
    } catch (err) {
      console.error('Error sending WhatsApp message:', err);
      throw new Error('Failed to send WhatsApp notification');
    }
  };

  const handleNotificationSend = async () => {
    if (!notificationModal.message.trim()) {
      toast.error('Please enter a notification message');
      return;
    }

    try {
      // Find the entry
      const entry = serviceEntries.find(e => e.id === notificationModal.entryId);
      if (!entry) {
        throw new Error('Service entry not found');
      }
      
      // For WhatsApp, we need to format the phone number
      const formattedPhone = `+91${entry.phone.replace(/\D/g, '')}`;
      
      if (notificationModal.method === 'whatsapp') {
        await sendWhatsAppNotification(formattedPhone, notificationModal.message);
      } else {
        // For email, we would implement email sending logic
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast.success(`Notification sent via ${notificationModal.method === 'whatsapp' ? 'WhatsApp' : 'Email'}!`);
      closeNotificationModal();
    } catch (err) {
      console.error('Error sending notification:', err);
      toast.error(`Failed to send notification: ${err.message}`);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateModal.newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      // Find the entry to update
      const entry = serviceEntries.find(e => e.id === statusUpdateModal.entryId);
      if (!entry) {
        throw new Error('Service entry not found');
      }

      // Update the status in the backend
      const updatedEntry = await axios.put(`http://localhost:5000/api/service/entry/${entry.id}`, {
        status: statusUpdateModal.newStatus
      });

      // Update the local state
      const updatedEntries = serviceEntries.map(e => 
        e.id === entry.id ? updatedEntry.data : e
      );

      setServiceEntries(updatedEntries);
      toast.success(`Status updated to ${statusUpdateModal.newStatus.replace(/_/g, ' ')}!`);
      
      // Send automatic WhatsApp notification on status change
      if (whatsappConnected) {
        try {
          const formattedPhone = `+91${entry.phone.replace(/\D/g, '')}`;
          const statusName = getStatusName(statusUpdateModal.newStatus);
          const message = `Hello ${entry.customerName},\n\nYour service request (ID: ${entry.tokenId || entry.id}) status has been updated to: ${statusName}.\n\nThank you for choosing our service!`;
          
          await sendWhatsAppNotification(formattedPhone, message);
          toast.info(`WhatsApp notification sent to customer`);
        } catch (whatsappErr) {
          console.error('Error sending automatic WhatsApp notification:', whatsappErr);
          toast.warning('Status updated but failed to send WhatsApp notification');
        }
      }
      
      closeStatusUpdateModal();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.id === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusName = (status) => {
    const statusOption = statusOptions.find(s => s.id === status);
    return statusOption ? statusOption.name : status;
  };

  const getCategoryName = (categoryId) => {
    const category = categoryOptions.find(c => c.id === categoryId);
    return category ? category.name : 'N/A';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading service entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-xl max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center mx-auto"
          >
            <FiRefreshCw className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <ToastContainer />
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Service Tracking Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Monitor and manage customer service requests with WhatsApp integration
            </p>
          </div>
          <div className="flex gap-3">
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
              whatsappConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${whatsappConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              WhatsApp {whatsappConnected ? 'Connected' : 'Disconnected'}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center text-gray-700 hover:bg-gray-50"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center hover:bg-indigo-700"
            >
              <FiFilter className="mr-2" />
              Filters
              {showFilters ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
            </motion.button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by customer name, phone, or token ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-white to-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
          <div className="text-sm text-gray-500 font-medium">Total Entries</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{serviceEntries.length}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-sm">
          <div className="text-sm text-gray-500 font-medium">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {serviceEntries.filter(e => e.status === 'pending').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
          <div className="text-sm text-gray-500 font-medium">In Progress</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {serviceEntries.filter(e => e.status === 'in_progress').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
          <div className="text-sm text-gray-500 font-medium">Completed</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {serviceEntries.filter(e => e.status === 'completed').length}
          </div>
        </div>
      </div>
      
      {/* WhatsApp Integration Banner */}
      {!whatsappConnected && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <FiInfo className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800">WhatsApp Integration Required</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  To send automatic status updates to customers, connect your WhatsApp Business account via Libromi.
                </p>
              </div>
              <div className="mt-4">
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none">
                  Connect WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters Section */}
      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Service Entries</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(status => (
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="relative">
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  {categoryOptions.map(category => (
                    <option key={category.id} value={category.id}>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="relative">
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  {dateRangeOptions.map(range => (
                    <option key={range.id} value={range.id}>
                      {range.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FiChevronDown className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Service Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID & Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FiSearch className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No service entries found</h3>
                      <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-800 font-medium">
                            {entry.tokenId ? `T${entry.tokenId}` : `S${entry.id}`}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{entry.customerName}</div>
                          <div className="text-sm text-gray-500">{entry.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{getCategoryName(entry.category)}</div>
                      <div className="text-sm text-gray-500">{entry.subcategoryName || 'General Service'}</div>
                      <div className="mt-1 text-sm text-gray-700">
                        <span className="font-medium">₹{entry.totalCharge}</span> total
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                        {getStatusName(entry.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium">Created</div>
                      <div>{formatDate(entry.createdAt)}</div>
                      <div className="mt-2 font-medium">Last Updated</div>
                      <div>{formatDate(entry.updatedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openNotificationModal(entry.id)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          title="Notify Customer"
                        >
                          <FiSend className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openStatusUpdateModal(entry.id, entry.status)}
                          className="text-gray-600 hover:text-gray-900 flex items-center"
                          title="Update Status"
                        >
                          <FiEdit className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Notification Modal */}
      {notificationModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notify Customer</h3>
                <button 
                  onClick={closeNotificationModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notification Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNotificationModal(prev => ({ ...prev, method: 'whatsapp' }))}
                    className={`px-4 py-3 rounded-lg flex items-center justify-center ${
                      notificationModal.method === 'whatsapp' 
                        ? 'bg-green-100 border border-green-300 text-green-700' 
                        : 'bg-gray-100 border border-gray-200 text-gray-700'
                    }`}
                  >
                    <FiMessageSquare className="mr-2" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setNotificationModal(prev => ({ ...prev, method: 'email' }))}
                    className={`px-4 py-3 rounded-lg flex items-center justify-center ${
                      notificationModal.method === 'email' 
                        ? 'bg-indigo-100 border border-indigo-300 text-indigo-700' 
                        : 'bg-gray-100 border border-gray-200 text-gray-700'
                    }`}
                  >
                    <FiMail className="mr-2" />
                    Email
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={notificationModal.message}
                  onChange={(e) => setNotificationModal(prev => ({ ...prev, message: e.target.value }))}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your notification message here..."
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeNotificationModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNotificationSend}
                  className={`px-4 py-2 rounded-lg text-white transition-colors font-medium flex items-center ${
                    notificationModal.method === 'whatsapp' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <FiSend className="mr-2" />
                  {notificationModal.method === 'whatsapp' ? 'Send WhatsApp' : 'Send Email'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Status Update Modal */}
      {statusUpdateModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Update Service Status</h3>
                <button 
                  onClick={closeStatusUpdateModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <div className="grid grid-cols-2 gap-3">
                  {statusOptions.map(status => (
                    <button
                      key={status.id}
                      onClick={() => setStatusUpdateModal(prev => ({ ...prev, newStatus: status.id }))}
                      className={`px-4 py-3 rounded-lg flex items-center justify-center ${
                        statusUpdateModal.newStatus === status.id 
                          ? `${status.color} border border-current` 
                          : 'bg-gray-100 border border-gray-200 text-gray-700'
                      }`}
                    >
                      {status.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <FiInfo className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      When you update the status, an automatic WhatsApp notification will be sent to the customer.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeStatusUpdateModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center"
                >
                  <FiCheckCircle className="mr-2" />
                  Update Status
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TrackServicePage;