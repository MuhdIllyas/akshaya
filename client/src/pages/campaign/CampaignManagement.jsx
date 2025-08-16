import React, { useState } from 'react';
import { FiPlus, FiCalendar, FiUsers, FiBarChart2, FiChevronRight, FiTarget, FiCheckCircle, FiTrendingUp, FiMoreVertical } from 'react-icons/fi';

const CampaignManagement = () => {
  // Mock data for campaigns
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: "Summer Tax Filing Drive",
      startDate: "2023-06-01",
      endDate: "2023-08-31",
      service: "Tax Filing Services",
      progress: 75,
      performance: 94,
      status: "active",
      description: "Special campaign to boost tax filing services during summer months",
      teamPerformance: [
        { team: "Team Alpha", progress: 95 },
        { team: "Team Beta", progress: 88 },
        { team: "Team Gamma", progress: 72 },
      ],
      staffPerformance: [
        { name: "John Doe", completed: 42 },
        { name: "Jane Smith", completed: 38 },
        { name: "Robert Johnson", completed: 36 },
      ],
      servicesCompleted: [
        { name: "Income Tax Filing", count: 210 },
        { name: "Property Tax", count: 132 },
      ]
    },
    {
      id: 2,
      name: "Property Registration Month",
      startDate: "2023-07-15",
      endDate: "2023-08-15",
      service: "Property Registration",
      progress: 45,
      performance: 82,
      status: "active",
      description: "Campaign to streamline property registration services",
      teamPerformance: [
        { team: "Team Alpha", progress: 92 },
        { team: "Team Beta", progress: 78 },
        { team: "Team Gamma", progress: 85 },
      ],
      staffPerformance: [
        { name: "Michael Brown", completed: 32 },
        { name: "Emily Davis", completed: 30 },
      ],
      servicesCompleted: [
        { name: "Property Registration", count: 185 },
        { name: "Land Survey", count: 45 },
      ]
    },
    {
      id: 3,
      name: "Business License Renewal",
      startDate: "2023-09-01",
      endDate: "2023-09-30",
      service: "Business Licensing",
      progress: 15,
      performance: 65,
      status: "upcoming",
      description: "Renewal campaign for business licenses",
      teamPerformance: [
        { team: "Team Alpha", progress: 40 },
        { team: "Team Beta", progress: 55 },
        { team: "Team Gamma", progress: 35 },
      ],
      staffPerformance: [
        { name: "David Wilson", completed: 18 },
        { name: "Sarah Johnson", completed: 15 },
      ],
      servicesCompleted: [
        { name: "License Renewal", count: 33 },
      ]
    },
    {
      id: 4,
      name: "Document Verification Drive",
      startDate: "2023-05-01",
      endDate: "2023-05-31",
      service: "Document Verification",
      progress: 100,
      performance: 112,
      status: "completed",
      description: "Special document verification campaign",
      teamPerformance: [
        { team: "Team Alpha", progress: 118 },
        { team: "Team Beta", progress: 105 },
        { team: "Team Gamma", progress: 110 },
      ],
      staffPerformance: [
        { name: "Alex Thompson", completed: 48 },
        { name: "Maria Garcia", completed: 42 },
      ],
      servicesCompleted: [
        { name: "Document Verification", count: 220 },
      ]
    }
  ]);

  const [services] = useState([
    "Tax Filing Services", 
    "Property Registration", 
    "Business Licensing", 
    "Document Verification",
    "License Renewals"
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [targetServices, setTargetServices] = useState(100);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Create new campaign
  const handleCreateCampaign = (e) => {
    e.preventDefault();
    
    if (!campaignName || !startDate || !endDate || !selectedService) {
      alert("Please fill all required fields");
      return;
    }
    
    const newCampaign = {
      id: campaigns.length + 1,
      name: campaignName,
      startDate,
      endDate,
      service: selectedService,
      progress: 0,
      performance: 0,
      status: "upcoming",
      description,
      teamPerformance: [
        { team: "Team Alpha", progress: 0 },
        { team: "Team Beta", progress: 0 },
        { team: "Team Gamma", progress: 0 },
      ],
      staffPerformance: [],
      servicesCompleted: []
    };
    
    setCampaigns([...campaigns, newCampaign]);
    setShowCreateModal(false);
    
    // Reset form
    setCampaignName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setSelectedService("");
    setTargetServices(100);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case "active": return "bg-green-100 text-green-800";
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case "active": return <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>;
      case "upcoming": return <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>;
      case "completed": return <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>;
      default: return <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Campaign Dashboard</h1>
            <p className="text-gray-600 mt-1">Track and manage your marketing campaigns</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <FiPlus className="mr-2" />
            Create Campaign
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{campaigns.length}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <FiTarget className="text-indigo-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {campaigns.filter(c => c.status === "active").length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <FiTrendingUp className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Avg. Performance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {Math.round(campaigns.reduce((sum, c) => sum + c.performance, 0) / campaigns.length)}%
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-xl">
                <FiBarChart2 className="text-amber-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {campaigns.reduce((sum, c) => sum + c.servicesCompleted.reduce((s, sc) => s + sc.count, 0), 0)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <FiCheckCircle className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <div className="bg-indigo-100 text-indigo-800 p-2 rounded-lg mr-3">
                        <FiTarget />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                        <div className={`mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mt-3">{campaign.description}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <FiMoreVertical />
                  </button>
                </div>
                
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center">
                    <FiCalendar className="text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FiCheckCircle className="text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">{campaign.service}</span>
                  </div>
                </div>
                
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center">
                      <div className="mr-3 relative">
                        <svg className="w-14 h-14" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e6e6e6"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={campaign.status === 'completed' ? '#8b5cf6' : campaign.status === 'active' ? '#10b981' : '#3b82f6'}
                            strokeWidth="3"
                            strokeDasharray={`${campaign.progress}, 100`}
                          />
                        </svg>
                        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold">
                          {campaign.progress}%
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Progress</p>
                        <p className="text-sm font-medium">Timeline</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center">
                      <div className="mr-3 relative">
                        <svg className="w-14 h-14" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e6e6e6"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={campaign.performance > 100 ? '#f59e0b' : campaign.performance > 90 ? '#10b981' : campaign.performance > 70 ? '#3b82f6' : '#ef4444'}
                            strokeWidth="3"
                            strokeDasharray={`${campaign.performance > 100 ? 100 : campaign.performance}, 100`}
                          />
                        </svg>
                        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold">
                          {campaign.performance}%
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Performance</p>
                        <p className="text-sm font-medium">Against Target</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">Top Performing Teams</p>
                    <button className="text-xs text-indigo-600 hover:text-indigo-800">View All</button>
                  </div>
                  <div className="space-y-3">
                    {campaign.teamPerformance.slice(0, 2).map((team, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-3" />
                          <span className="text-sm font-medium">{team.team}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`text-sm font-medium mr-2 ${
                            team.progress > 100 ? 'text-amber-600' : 
                            team.progress > 90 ? 'text-green-600' : 
                            team.progress > 70 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {team.progress}%
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                team.progress > 100 ? 'bg-amber-500' : 
                                team.progress > 90 ? 'bg-green-500' : 
                                team.progress > 70 ? 'bg-blue-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${team.progress > 100 ? 100 : team.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button className="w-full mt-5 py-2.5 text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-center">
                  View Campaign Details
                  <FiChevronRight className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sticky top-0">
                <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
              </div>
              <form onSubmit={handleCreateCampaign} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Summer Promotion 2023"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Describe the campaign goals and target audience..."
                      rows={3}
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Service *</label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a service</option>
                      {services.map((service, index) => (
                        <option key={index} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Services: <span className="font-bold">{targetServices}</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="10"
                      value={targetServices}
                      onChange={(e) => setTargetServices(e.target.value)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>50</span>
                      <span>500</span>
                      <span>1000</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Create Campaign
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignManagement;