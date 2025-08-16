import React, { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiCreditCard, FiCalendar, FiFolder, FiLink, FiPlus, FiEdit, FiTrash2, FiSearch, FiChevronDown, FiCheck, FiX, FiRefreshCw, FiMail, FiMessageSquare, FiEye } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CustomerProfileSystem = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [applications, setApplications] = useState([]);
  const [services, setServices] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Mock data - in a real app, this would come from API calls
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      // Mock customers
      const mockCustomers = [
        {
          id: 1,
          name: "Rajesh Kumar",
          phone: "+91 9876543210",
          aadhaar: "1234 5678 9012",
          rationCard: "RC/2023/001",
          address: "123 Main Street, Ward 5, Bangalore",
          photo: null,
          wardNo: "5",
          createdAt: "2023-01-15"
        },
        {
          id: 2,
          name: "Priya Sharma",
          phone: "+91 8765432109",
          aadhaar: "2345 6789 0123",
          rationCard: "RC/2023/002",
          address: "456 Park Avenue, Ward 7, Bangalore",
          photo: null,
          wardNo: "7",
          createdAt: "2023-02-20"
        },
        {
          id: 3,
          name: "Vikram Singh",
          phone: "+91 7654321098",
          aadhaar: "3456 7890 1234",
          rationCard: "RC/2023/003",
          address: "789 Oak Road, Ward 3, Bangalore",
          photo: null,
          wardNo: "3",
          createdAt: "2023-03-10"
        }
      ];
      
      // Mock applications
      const mockApplications = [
        {
          id: 101,
          customerId: 1,
          appNumber: "APP-2023-001",
          type: "Passport",
          subType: "New Application",
          status: "Pending",
          createdDate: "2023-04-01",
          expiryDate: "2035-08-14",
          linkedApps: [102],
          assignedStaff: 1001
        },
        {
          id: 102,
          customerId: 1,
          appNumber: "APP-2023-002",
          type: "Income Certificate",
          subType: "Verification",
          status: "In Progress",
          createdDate: "2023-04-05",
          expiryDate: "2025-04-05",
          linkedApps: [103],
          assignedStaff: 1002
        },
        {
          id: 103,
          customerId: 1,
          appNumber: "APP-2023-003",
          type: "Pension",
          subType: "Senior Citizen",
          status: "Approved",
          createdDate: "2023-04-10",
          expiryDate: "2024-04-10",
          linkedApps: [],
          assignedStaff: 1003
        },
        {
          id: 104,
          customerId: 2,
          appNumber: "APP-2023-004",
          type: "Ration Card",
          subType: "Correction",
          status: "Completed",
          createdDate: "2023-03-15",
          expiryDate: "2030-03-15",
          linkedApps: [],
          assignedStaff: 1001
        }
      ];
      
      // Mock staff members
      const mockStaff = [
        { id: 1001, name: "Ananya Patel", role: "Application Processor" },
        { id: 1002, name: "Rahul Sharma", role: "Verification Officer" },
        { id: 1003, name: "Priya Desai", role: "Senior Citizen Support" },
        { id: 1004, name: "Vikram Singh", role: "Document Specialist" }
      ];
      
      // Mock services
      const mockServices = [
        { id: 1, name: "Passport", subCategories: ["New Application", "Renewal", "Reissue"] },
        { id: 2, name: "Income Certificate", subCategories: ["New", "Renewal", "Correction"] },
        { id: 3, name: "Pension", subCategories: ["Senior Citizen", "Widow", "Disability"] },
        { id: 4, name: "Ration Card", subCategories: ["New", "Correction", "Transfer"] },
        { id: 5, name: "Aadhaar", subCategories: ["New", "Update", "Correction"] }
      ];
      
      setCustomers(mockCustomers);
      setApplications(mockApplications);
      setStaffMembers(mockStaff);
      setServices(mockServices);
      setSelectedCustomer(mockCustomers[0]);
      setLoading(false);
    }, 1000);
  }, []);
  
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.aadhaar.includes(searchTerm)
  );
  
  const getCustomerApplications = (customerId) => {
    return applications.filter(app => app.customerId === customerId);
  };
  
  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : "Unknown Service";
  };
  
  const getSubCategoryName = (serviceId, subCategory) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      return subCategory || "N/A";
    }
    return "N/A";
  };
  
  const getStaffName = (staffId) => {
    const staff = staffMembers.find(s => s.id === staffId);
    return staff ? staff.name : "Unassigned";
  };
  
  const getLinkedApplications = (appIds) => {
    return applications.filter(app => appIds.includes(app.id));
  };
  
  const handleAddApplication = () => {
    toast.info("This would open a form to add a new application in a real implementation");
  };
  
  const handleAssignStaff = (appId) => {
    toast.info(`Assign staff to application ${appId}`);
  };
  
  const handleLinkApplication = (appId) => {
    toast.info(`Link another application to ${appId}`);
  };
  
  const handleNotifyCustomer = () => {
    toast.success("Notification sent to customer");
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading customer profiles...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Customer Service Management</h1>
            <p className="text-indigo-200 mt-1">Track applications and manage customer profiles</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center">
              <FiRefreshCw className="mr-2" /> Refresh
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Customer List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-4 h-fit">
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              {filteredCustomers.map(customer => (
                <motion.div
                  key={customer.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedCustomer?.id === customer.id 
                      ? 'bg-indigo-50 border border-indigo-200 shadow-sm' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex items-center">
                    <div className="bg-indigo-100 w-10 h-10 rounded-full flex items-center justify-center">
                      <FiUser className="text-indigo-700" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex text-xs">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                      Aadhaar: {customer.aadhaar}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      Ward: {customer.wardNo}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {filteredCustomers.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <FiSearch className="mx-auto h-8 w-8 mb-2" />
                  <p>No customers found</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Main content - Customer Profile */}
          <div className="lg:col-span-3 space-y-6">
            {selectedCustomer ? (
              <>
                {/* Customer Profile Header */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center">
                        <FiUser className="text-indigo-700 text-2xl" />
                      </div>
                      <div className="ml-4">
                        <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FiPhone className="mr-1" /> {selectedCustomer.phone}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Aadhaar: {selectedCustomer.aadhaar}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Ward: {selectedCustomer.wardNo}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex space-x-2">
                      <button 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                        onClick={handleNotifyCustomer}
                      >
                        <FiMail className="mr-2" /> Notify
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center">
                        <FiEdit className="mr-2" /> Edit
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Personal Details</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex">
                          <span className="text-gray-500 w-32">Address:</span>
                          <span className="text-gray-800">{selectedCustomer.address}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">Ration Card:</span>
                          <span className="text-gray-800">{selectedCustomer.rationCard}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">Member Since:</span>
                          <span className="text-gray-800">{selectedCustomer.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Document Status</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex">
                          <span className="text-gray-500 w-32">Aadhaar:</span>
                          <span className="text-green-600 font-medium">Verified</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">Ration Card:</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">Voter ID:</span>
                          <span className="text-yellow-600 font-medium">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8">
                    {['profile', 'applications', 'documents', 'history'].map((tab) => (
                      <button
                        key={tab}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Tab Content */}
                {activeTab === 'profile' && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Profile Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Personal Information</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                            <div className="font-medium">{selectedCustomer.name}</div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Phone Number</label>
                            <div className="font-medium">{selectedCustomer.phone}</div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Aadhaar Number</label>
                            <div className="font-medium">{selectedCustomer.aadhaar}</div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Ration Card Number</label>
                            <div className="font-medium">{selectedCustomer.rationCard}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Address Details</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Full Address</label>
                            <div className="font-medium">{selectedCustomer.address}</div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Ward Number</label>
                            <div className="font-medium">{selectedCustomer.wardNo}</div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Landmark</label>
                            <div className="font-medium">Near City Park</div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Pincode</label>
                            <div className="font-medium">560001</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <h4 className="font-medium text-gray-700 mb-3">Additional Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="block text-sm text-gray-500 mb-1">Voter ID</label>
                          <div className="font-medium">VOTER/KA/123456</div>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="block text-sm text-gray-500 mb-1">PAN Card</label>
                          <div className="font-medium">ABCDE1234F</div>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="block text-sm text-gray-500 mb-1">Bank Account</label>
                          <div className="font-medium">XXXXXX7890</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'applications' && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
                      <button 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                        onClick={handleAddApplication}
                      >
                        <FiPlus className="mr-2" /> New Application
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App Number</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getCustomerApplications(selectedCustomer.id).map(app => (
                            <tr key={app.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{app.appNumber}</div>
                                <div className="text-sm text-gray-500">{app.createdDate}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getServiceName(app.type)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {app.subType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  app.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  app.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {app.expiryDate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getStaffName(app.assignedStaff)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button 
                                    className="text-indigo-600 hover:text-indigo-900"
                                    onClick={() => handleAssignStaff(app.id)}
                                    title="Assign Staff"
                                  >
                                    <FiUser />
                                  </button>
                                  <button 
                                    className="text-green-600 hover:text-green-900"
                                    onClick={() => handleLinkApplication(app.id)}
                                    title="Link Application"
                                  >
                                    <FiLink />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900" title="Delete">
                                    <FiTrash2 />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Application Details */}
                    {getCustomerApplications(selectedCustomer.id).length > 0 && (
                      <div className="p-6 border-t">
                        <h4 className="font-semibold text-gray-900 mb-4">Application Relationships</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getCustomerApplications(selectedCustomer.id).map(app => (
                            <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-gray-900">{app.appNumber}</h5>
                                  <p className="text-sm text-gray-600">{getServiceName(app.type)} - {app.subType}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  app.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  app.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                              
                              <div className="mt-4 text-sm">
                                <div className="flex justify-between mb-2">
                                  <span className="text-gray-500">Expiry:</span>
                                  <span className="font-medium">{app.expiryDate}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                  <span className="text-gray-500">Assigned To:</span>
                                  <span className="font-medium">{getStaffName(app.assignedStaff)}</span>
                                </div>
                              </div>
                              
                              {app.linkedApps && app.linkedApps.length > 0 && (
                                <div className="mt-4">
                                  <h6 className="text-xs font-medium text-gray-500 uppercase mb-1">Linked Applications</h6>
                                  <div className="space-y-2">
                                    {getLinkedApplications(app.linkedApps).map(linkedApp => (
                                      <div key={linkedApp.id} className="flex items-center text-sm bg-blue-50 p-2 rounded">
                                        <FiLink className="text-blue-500 mr-2" />
                                        <div>
                                          <div className="font-medium">{linkedApp.appNumber}</div>
                                          <div className="text-xs text-gray-600">{getServiceName(linkedApp.type)}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No customer selected</h3>
                <p className="text-gray-500">Select a customer from the list to view their profile</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Quick Stats */}
      <div className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">1,248</div>
              <div className="text-indigo-200">Total Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">342</div>
              <div className="text-indigo-200">Active Applications</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">29</div>
              <div className="text-indigo-200">Staff Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-indigo-200">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileSystem;