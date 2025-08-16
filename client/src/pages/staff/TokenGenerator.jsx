import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiPhone, FiBriefcase, FiSend, FiX, FiChevronDown, FiCalendar, FiBook, FiAward, FiClock, FiRefreshCw } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TokenGenerator = () => {
  // Service categories
  const serviceCategories = {
    'Passport': ['New Passport', 'Minor Passport', 'Renewal', 'Lost Passport'],
    'Visa': ['Tourist Visa', 'Business Visa', 'Student Visa'],
    'Notary': ['Document Notarization', 'Apostille'],
    'Other': ['Consultation', 'Documentation']
  };

  // Campaign categories with end dates
  const campaignCategories = {
    'Scholarship': {
      types: ['Merit Scholarship', 'Sports Scholarship', 'Need-Based'],
      endDate: '2023-12-31'
    },
    'HSCap': {
      types: ['New Application', 'Renewal', 'Transfer'],
      endDate: '2023-11-15'
    },
    'Government': {
      types: ['Subsidy Application', 'Grant Request', 'License Renewal'],
      endDate: '2024-01-20'
    }
  };

  // State management
  const [activeTab, setActiveTab] = useState('service');
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    assignedStaff: '',
    serviceCategory: '',
    serviceSubCategory: '',
    campaignCategory: '',
    campaignSubCategory: '',
  });
  
  const [staffList] = useState([
    { id: 'staff1', name: 'John Doe', role: 'Agent' },
    { id: 'staff2', name: 'Jane Smith', role: 'Manager' },
    { id: 'staff3', name: 'Mike Johnson', role: 'Agent' }
  ]);

  const [recentTokens, setRecentTokens] = useState([]);
  const [dailyCount, setDailyCount] = useState(1);
  const [campaignCounts, setCampaignCounts] = useState({
    Scholarship: 1,
    HSCap: 1,
    Government: 1
  });
  const [lastResetDate, setLastResetDate] = useState(new Date().toISOString().split('T')[0]);

  // Check if we need to reset daily tokens
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (today !== lastResetDate) {
      resetDailyTokens();
      setLastResetDate(today);
      toast.info("Daily service tokens have been reset");
    }
  }, []);

  // Reset daily tokens
  const resetDailyTokens = () => {
    setDailyCount(1);
    toast.info("Service tokens have been reset for the new day");
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'serviceCategory') {
        return { ...prev, [name]: value, serviceSubCategory: '' };
      }
      if (name === 'campaignCategory') {
        return { ...prev, [name]: value, campaignSubCategory: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  // Generate token ID
  const generateTokenId = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    if (activeTab === 'service') {
      const tokenId = `#S-${dateStr}-${dailyCount.toString().padStart(3, '0')}`;
      setDailyCount(prev => prev + 1);
      return tokenId;
    } else {
      const campaignKey = formData.campaignCategory;
      if (!campaignKey) return '#C-ERROR-001';
      
      const count = campaignCounts[campaignKey] || 1;
      const tokenId = `#C-${campaignKey.slice(0,3).toUpperCase()}-${count.toString().padStart(3, '0')}`;
      
      setCampaignCounts(prev => ({
        ...prev,
        [campaignKey]: count + 1
      }));
      
      return tokenId;
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.customerName || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (activeTab === 'service' && (!formData.serviceCategory || !formData.serviceSubCategory)) {
      toast.error('Please select a service category and sub-category');
      return;
    }
    
    if (activeTab === 'campaign' && (!formData.campaignCategory || !formData.campaignSubCategory)) {
      toast.error('Please select a campaign category and sub-category');
      return;
    }
    
    // Generate token
    const tokenId = generateTokenId();
    const serviceType = activeTab === 'service' ? 
      `${formData.serviceCategory} - ${formData.serviceSubCategory}` : 
      `${formData.campaignCategory} - ${formData.campaignSubCategory}`;
    
    // Add to recent tokens
    const newToken = {
      id: tokenId,
      customer: formData.customerName,
      service: serviceType,
      status: 'Pending',
      type: activeTab,
      timestamp: new Date().toISOString()
    };
    
    setRecentTokens(prev => [newToken, ...prev.slice(0, 9)]);
    
    // Show success toast
    toast.success(
      <div>
        <div className="font-bold">Token Generated Successfully!</div>
        <div className="text-sm mt-1">ID: {tokenId}</div>
        <div className="text-sm">For: {formData.customerName}</div>
      </div>
    );
    
    // Reset form
    setFormData({
      customerName: '',
      phone: '',
      assignedStaff: '',
      serviceCategory: '',
      serviceSubCategory: '',
      campaignCategory: '',
      campaignSubCategory: '',
    });
  };

  // Status colors
  const statusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get icon for token type
  const getIcon = (type) => {
    if (type === 'campaign') return <FiAward className="h-5 w-5 text-purple-600" />;
    return <FiBriefcase className="h-5 w-5 text-indigo-600" />;
  };

  // Calculate days until campaign ends
  const daysUntilEnd = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center">
            <FiCalendar className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Token Management System</h1>
              <p className="text-indigo-200">Generate service and campaign tokens</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg flex items-center">
              <FiClock className="mr-2" />
              <div>
                <span className="text-xs block">Last Reset</span>
                <span className="font-medium">{lastResetDate}</span>
              </div>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <div className="text-center">
                <span className="text-xs block">Today's Date</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Token Type Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`px-6 py-3 font-medium flex items-center ${activeTab === 'service' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('service')}
            >
              <FiBriefcase className="mr-2" />
              Service Token
            </button>
            <button
              className={`px-6 py-3 font-medium flex items-center ${activeTab === 'campaign' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('campaign')}
            >
              <FiAward className="mr-2" />
              Campaign Token
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <FiUser className="mr-2 text-indigo-600" />
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Full name"
                    />
                  </div>
                  
                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <FiPhone className="mr-2 text-indigo-600" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>
              
              {/* Service/Campaign Selection */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {activeTab === 'service' ? 'Service Selection' : 'Campaign Details'}
                </h2>
                
                {activeTab === 'service' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Service Category */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Service Category *
                      </label>
                      <div className="relative">
                        <select
                          name="serviceCategory"
                          value={formData.serviceCategory}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Select a category</option>
                          {Object.keys(serviceCategories).map((category, index) => (
                            <option key={index} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    {/* Service Sub-Category */}
                    {formData.serviceCategory && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Service Type *
                        </label>
                        <div className="relative">
                          <select
                            name="serviceSubCategory"
                            value={formData.serviceSubCategory}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                          >
                            <option value="">Select a type</option>
                            {serviceCategories[formData.serviceCategory].map((sub, index) => (
                              <option key={index} value={sub}>
                                {sub}
                              </option>
                            ))}
                          </select>
                          <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Campaign Category */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Campaign *
                        </label>
                        <div className="relative">
                          <select
                            name="campaignCategory"
                            value={formData.campaignCategory}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                          >
                            <option value="">Select campaign</option>
                            {Object.keys(campaignCategories).map((category, index) => (
                              <option key={index} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                          <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      
                      {/* Campaign Sub-Category */}
                      {formData.campaignCategory && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Application Type *
                          </label>
                          <div className="relative">
                            <select
                              name="campaignSubCategory"
                              value={formData.campaignSubCategory}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                            >
                              <option value="">Select type</option>
                              {campaignCategories[formData.campaignCategory].types.map((sub, index) => (
                                <option key={index} value={sub}>
                                  {sub}
                                </option>
                              ))}
                            </select>
                            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Campaign Info */}
                    {formData.campaignCategory && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`mt-4 p-4 rounded-lg border bg-purple-50 border-purple-200`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="bg-purple-100 p-2 rounded-lg mr-3">
                              <FiAward className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Campaign End Date</p>
                              <p className="font-bold">
                                {new Date(campaignCategories[formData.campaignCategory].endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">Days Remaining</p>
                            <p className="font-bold text-purple-700">
                              {daysUntilEnd(campaignCategories[formData.campaignCategory].endDate)} days
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
                
                {(formData.serviceCategory && formData.serviceSubCategory) || 
                (formData.campaignCategory && formData.campaignSubCategory) ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-4 p-4 rounded-lg border ${
                      activeTab === 'service' 
                        ? 'bg-indigo-50 border-indigo-200' 
                        : 'bg-purple-50 border-purple-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        activeTab === 'service' 
                          ? 'bg-indigo-100' 
                          : 'bg-purple-100'
                      }`}>
                        {activeTab === 'service' ? 
                          <FiBriefcase className="h-5 w-5 text-indigo-600" /> : 
                          <FiAward className="h-5 w-5 text-purple-600" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Selected {activeTab === 'service' ? 'Service' : 'Campaign'}</p>
                        <p className="font-bold">
                          {activeTab === 'service' ? 
                            `${formData.serviceCategory} - ${formData.serviceSubCategory}` : 
                            `${formData.campaignCategory} - ${formData.campaignSubCategory}`
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            </div>
            
            {/* Right Column - Token Actions */}
            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Token Details</h2>
                  {activeTab === 'service' && (
                    <button 
                      onClick={resetDailyTokens}
                      className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      <FiRefreshCw className="mr-1" /> Reset Daily
                    </button>
                  )}
                </div>
                
                <div className={`p-5 rounded-xl mb-6 ${
                  activeTab === 'service' 
                    ? 'bg-indigo-50 border border-indigo-200' 
                    : 'bg-purple-50 border border-purple-200'
                }`}>
                  <div className="text-center">
                    <span className="text-xs block mb-1">
                      {activeTab === 'service' ? 'Service Token ID' : 'Campaign Token ID'}
                    </span>
                    <div className={`text-2xl font-bold ${
                      activeTab === 'service' ? 'text-indigo-900' : 'text-purple-900'
                    }`}>
                      {activeTab === 'service' ? (
                        <>
                          #S-{new Date().toISOString().slice(0,10).replace(/-/g, '')}
                          <span className="text-indigo-600">-{dailyCount.toString().padStart(3, '0')}</span>
                        </>
                      ) : formData.campaignCategory ? (
                        `#C-${formData.campaignCategory.slice(0,3).toUpperCase()}-${(campaignCounts[formData.campaignCategory] || 1).toString().padStart(3, '0')}`
                      ) : (
                        '#C-SELECT-000'
                      )}
                    </div>
                    <div className="mt-2 text-xs">
                      {activeTab === 'service' 
                        ? 'Resets daily at midnight' 
                        : `Expires on ${formData.campaignCategory ? new Date(campaignCategories[formData.campaignCategory].endDate).toLocaleDateString() : 'campaign end'}`}
                    </div>
                  </div>
                </div>
                
                {/* Staff Assignment */}
                <div className="space-y-2 mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Assign to Staff (Optional)
                  </label>
                  <div className="relative">
                    <select
                      name="assignedStaff"
                      value={formData.assignedStaff}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                      <option value="">Unassigned (available to all)</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} - {staff.role}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded-lg mt-2">
                    {formData.assignedStaff 
                      ? 'Selected staff will be notified immediately' 
                      : 'All staff will see this token in their queue'}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    onClick={handleSubmit}
                    className={`px-5 py-3 text-white rounded-xl font-medium flex items-center justify-center shadow-md ${
                      activeTab === 'service' 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <FiSend className="mr-2" />
                    Generate Token
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setFormData({
                      customerName: '',
                      phone: '',
                      assignedStaff: '',
                      serviceCategory: '',
                      serviceSubCategory: '',
                      campaignCategory: '',
                      campaignSubCategory: '',
                    })}
                    className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
                  >
                    <FiX className="mr-2" />
                    Clear Form
                  </motion.button>
                </div>
              </div>
              
              {/* Recent Tokens */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Recent Tokens</h2>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {recentTokens.length} tokens
                  </span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {recentTokens.map((token, index) => (
                      <motion.div 
                        key={token.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center p-3 rounded-lg border ${
                          token.type === 'service' 
                            ? 'bg-indigo-50 border-indigo-100' 
                            : 'bg-purple-50 border-purple-100'
                        }`}
                      >
                        <div className="mr-3">
                          {getIcon(token.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline">
                            <span className="font-medium truncate">{token.customer}</span>
                            <span className="text-xs ml-2 bg-gray-200 px-1 rounded">{token.id}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{token.service}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(token.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(token.status)}`}>
                            {token.status}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {recentTokens.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FiClock className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2">No tokens generated yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 border-t border-gray-200 text-center text-sm text-gray-600">
          Token Management System • Daily Reset: {lastResetDate}
        </div>
      </motion.div>
      
      {/* Toast Container */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default TokenGenerator;