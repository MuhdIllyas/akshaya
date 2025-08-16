import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFileText, FiChevronLeft, FiChevronRight, 
  FiRefreshCw, FiFilter, FiDownload, FiPrinter, FiBarChart2, FiX 
} from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuditLogs, getTransactions, getWallets } from '@/services/walletService';
import axios from 'axios';

const ReportsPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('audit');
  const [filterCentre, setFilterCentre] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    auditActions: {}
  });
  
  const itemsPerPage = 15;

  const formatAmount = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (typeof amount === 'number' ? amount : 0);
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(num);
  };

  // Memoized wallet name mapping
  const walletMap = useMemo(() => {
    const map = new Map();
    wallets.forEach(wallet => {
      map.set(wallet.id, wallet);
    });
    return map;
  }, [wallets]);

  const getWalletName = (id) => {
    if (!id) return 'N/A';
    const wallet = walletMap.get(id);
    if (!wallet) return 'Unknown Wallet';
    return wallet.centre_name ? `${wallet.centre_name} - ${wallet.name}` : wallet.name;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [auditRes, transactionRes, walletRes, centreRes] = await Promise.all([
          getAuditLogs(),
          getTransactions(),
          getWallets(),
          axios.get('http://localhost:5000/api/centres', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);
        
        // Handle different response structures
        setAuditLogs(
          Array.isArray(auditRes.data) 
            ? auditRes.data 
            : auditRes.data?.data || auditRes.data?.logs || []
        );
        
        setTransactions(transactionRes.data || []);
        setWallets(walletRes.data || []);
        setCentres(centreRes.data || []);
        
        // Calculate stats
        const totalAmount = transactionRes.data?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
        
        const auditActions = {};
        auditRes.data?.forEach(log => {
          auditActions[log.action] = (auditActions[log.action] || 0) + 1;
        });
        
        setStats({
          totalTransactions: transactionRes.data?.length || 0,
          totalAmount,
          auditActions
        });
        
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load report data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return filterType === 'audit'
      ? auditLogs.filter((log) =>
          (!filterCentre || log.centre_id === Number(filterCentre)) &&
          (!filterDate || log.created_at.startsWith(filterDate)) &&
          (log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.performed_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (log.centre_name && log.centre_name.toLowerCase().includes(searchQuery.toLowerCase())))
        )
      : transactions.filter((tx) => {
          const wallet = walletMap.get(tx.wallet_id);
          const centreMatch = !filterCentre || 
            (wallet && wallet.centre_id === Number(filterCentre));
          
          const dateMatch = !filterDate || tx.created_at.startsWith(filterDate);
          
          const searchMatch = 
            tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getWalletName(tx.wallet_id).toLowerCase().includes(searchQuery.toLowerCase());
          
          return centreMatch && dateMatch && searchMatch;
        });
  }, [auditLogs, transactions, filterType, filterCentre, filterDate, searchQuery, walletMap]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Function to format details for display
  const formatDetails = (details) => {
    if (!details || typeof details !== 'string') return 'N/A';
    if (details.length > 100) {
      return details.substring(0, 100) + '...';
    }
    return details;
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [auditRes, transactionRes] = await Promise.all([
        getAuditLogs(),
        getTransactions(),
      ]);
      
      setAuditLogs(
        Array.isArray(auditRes.data) 
          ? auditRes.data 
          : auditRes.data?.data || auditRes.data?.logs || []
      );
      
      setTransactions(transactionRes.data || []);
      
      // Calculate stats
      const totalAmount = transactionRes.data?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
      
      const auditActions = {};
      auditRes.data?.forEach(log => {
        auditActions[log.action] = (auditActions[log.action] || 0) + 1;
      });
      
      setStats({
        totalTransactions: transactionRes.data?.length || 0,
        totalAmount,
        auditActions
      });
      
      toast.success('Data refreshed successfully!');
    } catch (err) {
      console.error('Error refreshing data:', err);
      toast.error('Failed to refresh data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4 sm:p-6">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Financial Reports Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive view of all financial activities and audit logs
            </p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl border border-gray-200 shadow-sm hover:shadow-md"
            >
              <FiDownload className="text-indigo-600" />
              <span>Export</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl border border-gray-200 shadow-sm hover:shadow-md"
            >
              <FiPrinter className="text-indigo-600" />
              <span>Print</span>
            </motion.button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <FiBarChart2 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
                <p className="text-2xl font-bold text-gray-800">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-lg">
                <FiFileText className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <p className="text-2xl font-bold text-gray-800">{formatAmount(stats.totalAmount)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-lg">
                <FiRefreshCw className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Audit Actions</h3>
                <p className="text-2xl font-bold text-gray-800">{Object.keys(stats.auditActions).length}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 md:px-4 md:py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-sm md:text-base"
                  aria-label="Select report type"
                >
                  <option value="audit">Audit Logs</option>
                  <option value="transactions">Transactions</option>
                </select>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-sm font-medium ${
                  showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <FiFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white text-gray-700 rounded-xl border border-gray-200 shadow-sm hover:shadow-md text-sm md:text-base"
              >
                <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>

              {/* Applied filters badge */}
              {(filterCentre || filterDate) && (
                <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl text-sm">
                  <span>Filters Applied</span>
                  <button 
                    onClick={() => {
                      setFilterCentre('');
                      setFilterDate('');
                    }}
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                    aria-label="Clear all filters"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative flex-1 max-w-md min-w-[150px]">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${filterType === 'audit' ? 'audit logs' : 'transactions'}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm md:text-base"
                aria-label={`Search ${filterType === 'audit' ? 'audit logs' : 'transactions'}`}
              />
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-[auto_auto] gap-3 items-end"
            >
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Centre</label>
                <select
                  value={filterCentre}
                  onChange={(e) => {
                    setFilterCentre(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  aria-label="Filter by centre"
                >
                  <option value="">All Centres</option>
                  {centres.map((centre) => (
                    <option key={centre.id} value={centre.id}>
                      {centre.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    aria-label="Filter by date"
                  />
                  {filterDate && (
                    <button
                      onClick={() => setFilterDate('')}
                      className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                      aria-label="Clear date filter"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <FiRefreshCw className="h-16 w-16 text-indigo-500 animate-spin mx-auto" />
              <p className="text-gray-600 mt-4 text-lg">Loading financial data...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {filterType === 'audit' ? 'Action' : 'Category'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {filterType === 'audit' ? 'Performed By' : 'Staff'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {filterType === 'audit' ? 'Centre' : 'Wallet'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {filterType === 'audit' ? 'Details' : 'Amount'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-indigo-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(item.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              filterType === 'audit' 
                                ? 'bg-indigo-100 text-indigo-800'
                                : item.category === 'Recharge' 
                                  ? 'bg-green-100 text-green-800'
                                  : item.category === 'Transfer'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                              {filterType === 'audit' ? item.action : item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {filterType === 'audit' 
                              ? item.performed_by 
                              : item.staff_name || 'System'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {filterType === 'audit' 
                              ? item.centre_name || 'System' 
                              : getWalletName(item.wallet_id)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {filterType === 'audit' 
                              ? formatDetails(item.details) 
                              : (
                                <span className={item.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                  {formatAmount(item.amount)}
                                </span>
                              )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.description || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center">
                          <FiFileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-medium text-gray-700">No {filterType === 'audit' ? 'audit logs' : 'transactions'} found</h3>
                          <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center p-2 rounded-full ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-gray-200'
                      }`}
                      aria-label="Previous page"
                    >
                      <FiChevronLeft />
                    </motion.button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages)
                        .map((page) => (
                          <motion.button
                            key={page}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                            aria-label={`Go to page ${page}`}
                          >
                            {page}
                          </motion.button>
                        ))}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center p-2 rounded-full ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-gray-200'
                      }`}
                      aria-label="Next page"
                    >
                      <FiChevronRight />
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Summary Section */}
        {!loading && filteredData.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Total Records</span>
                  <span className="font-medium">{filteredData.length}</span>
                </div>
                {filterType === 'transactions' && (
                  <>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-medium">{formatAmount(filteredData.reduce((sum, tx) => sum + (tx.amount || 0), 0))}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Average Transaction</span>
                      <span className="font-medium">{formatAmount(filteredData.reduce((sum, tx) => sum + (tx.amount || 0), 0) / filteredData.length)}</span>
                    </div>
                  </>
                )}
                {filterType === 'audit' && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Unique Actions</span>
                    <span className="font-medium">{Object.keys(stats.auditActions).length}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center justify-center p-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <FiDownload className="h-6 w-6 mb-2" />
                  <span>Export CSV</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center justify-center p-4 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100 transition-colors"
                >
                  <FiPrinter className="h-6 w-6 mb-2" />
                  <span>Print Report</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center justify-center p-4 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors"
                >
                  <FiFilter className="h-6 w-6 mb-2" />
                  <span>Save Filter</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <FiBarChart2 className="h-6 w-6 mb-2" />
                  <span>View Analytics</span>
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;