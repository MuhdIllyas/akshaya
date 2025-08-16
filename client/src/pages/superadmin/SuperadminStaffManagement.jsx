import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AddStaffForm from "./AddStaffForm";
import EditStaffForm from "/src/components/EditStaffForm";
import { FiPlus, FiEdit, FiTrash2, FiUserPlus, FiFilter, FiRefreshCw, FiSearch, FiEye, FiUser, FiX, FiGrid, FiList } from "react-icons/fi";

const SuperadminStaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [centres, setCentres] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ role: "", centre_id: "", status: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [showStaffDetails, setShowStaffDetails] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const centresResponse = await axios.get("http://localhost:5000/api/centres", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCentres(centresResponse.data);
      console.log("Fetched centres:", centresResponse.data);

      const staffResponse = await axios.get("http://localhost:5000/api/staff/all", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: filters,
      });
      // Map recent_activity to recentActivity for consistency
      const staffWithActivity = staffResponse.data.map(staff => ({
        ...staff,
        recentActivity: staff.recent_activity || [],
      }));
      setStaffList(staffWithActivity);
      console.log("Fetched staff with activities:", staffWithActivity);
    } catch (err) {
      console.error("Error fetching data:", err);
      const errorMessage = err.response?.data?.error || "Failed to load data";
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        theme: "light",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/staff/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Staff deleted successfully", {
        position: "top-right",
        autoClose: 3000,
        theme: "light",
      });
      setStaffList(staffList.filter((staff) => staff.id !==id));
    } catch (err) {
      console.error("Error deleting staff:", err);
      toast.error(err.response?.data?.error || "Failed to delete staff", {
        position: "top-right",
        autoClose: 5000,
        theme: "light",
      });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredStaff = staffList.filter((staff) =>
    [staff.name, staff.username, staff.email].some((field) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusBadge = (status) => {
    return status === "Active" ? (
      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center w-fit">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        {status}
      </span>
    ) : (
      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center w-fit">
        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      superadmin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      staff: "bg-gray-100 text-gray-800",
      supervisor: "bg-amber-100 text-amber-800",
    };
    return (
      <span
        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
          roleColors[role?.toLowerCase()] || "bg-gray-100 text-gray-800"
        }`}
      >
        {role}
      </span>
    );
  };

  const getCentreName = (centreId) => {
    const centre = centres.find((c) => c.id === Number(centreId));
    return centre ? centre.name : "Unassigned";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-500 mt-1">Manage all staff members and their permissions</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-md flex items-center gap-1 ${
                  viewMode === "card" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
                disabled={loading}
              >
                <FiGrid className="text-gray-600" />
                <span className="text-sm font-medium hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md flex items-center gap-1 ${
                  viewMode === "table" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
                disabled={loading}
              >
                <FiList className="text-gray-600" />
                <span className="text-sm font-medium hidden sm:inline">Table</span>
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-[#1e3a5f] hover:bg-[#172a45] shadow-md transition-all"
              disabled={loading}
            >
              <FiUserPlus className="text-lg" />
              <span className="hidden sm:inline">Add New Staff</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-xl">
            {error}
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              onClick={() => setFilterExpanded(!filterExpanded)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
              disabled={loading}
            >
              <FiFilter />
              <span>Filters</span>
            </button>
            <button
              onClick={() => {
                setFilters({ role: "", centre_id: "", status: "" });
                setSearchTerm("");
              }}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
              disabled={loading}
            >
              <FiRefreshCw />
              <span>Reset</span>
            </button>
          </div>
          {filterExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={loading}
                >
                  <option value="">All Roles</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Centre</label>
                <select
                  name="centre_id"
                  value={filters.centre_id}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={loading}
                >
                  <option value="">All Centres</option>
                  {centres.map((centre) => (
                    <option key={centre.id} value={centre.id}>
                      {centre.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={loading}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Card View */}
        <div className={`${viewMode === "card" ? "block" : "hidden"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
                <p className="mt-4 text-gray-600">Loading staff data...</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                    <FiSearch className="text-gray-500 text-2xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No staff members found</h3>
                  <p className="mt-1 text-gray-600">Try adjusting your search or filter criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilters({ role: "", centre_id: "", status: "" });
                    }}
                    className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            ) : (
              filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all hover:shadow-lg"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {staff.photo ? (
                          <img
                            src={staff.photo}
                            alt={`${staff.name}'s profile`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.target.src = "";
                              e.target.nextSibling.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={`bg-gray-200 border-2 border-dashed rounded-full w-16 h-16 flex items-center justify-center ${
                            staff.photo ? "hidden" : ""
                          }`}
                        >
                          <FiUser className="text-gray-700 text-xl" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-gray-900 text-lg">{staff.name}</h3>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setShowStaffDetails(staff)}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="View details"
                            >
                              <FiEye className="text-lg" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStaff(staff);
                                setShowEditModal(true);
                              }}
                              className="text-gray-400 hover:text-indigo-600 p-1"
                              title="Edit staff"
                            >
                              <FiEdit className="text-lg" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {getRoleBadge(staff.role)}
                          {getStatusBadge(staff.status)}
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium w-20">Username:</span>
                            <span className="truncate">{staff.username}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium w-20">Email:</span>
                            <span className="truncate">{staff.email}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium w-20">Centre:</span>
                            <span className="truncate">{getCentreName(staff.centreId)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium w-20">Department:</span>
                            <span className="truncate">{staff.department || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => handleDelete(staff.id)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        <FiTrash2 />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table View */}
        <div className={`${viewMode === "table" ? "block" : "hidden"}`}>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Staff List</h2>
                <div className="flex items-center">
                  <div className="relative mr-4">
                    <input
                      type="text"
                      placeholder="Search staff..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={loading}
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <button
                    onClick={() => setFilterExpanded(!filterExpanded)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    disabled={loading}
                  >
                    <FiFilter className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Centre</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                        <p className="mt-4 text-gray-600">Loading staff data...</p>
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                            <FiSearch className="text-gray-500 text-2xl" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">No staff members found</h3>
                          <p className="mt-1 text-gray-600">Try adjusting your search or filter criteria</p>
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setFilters({ role: "", centre_id: "", status: "" });
                            }}
                            className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Reset filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {staff.photo ? (
                              <img
                                src={staff.photo}
                                alt={`${staff.name}'s profile`}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 mr-3"
                                onError={(e) => {
                                  e.target.src = "";
                                  e.target.nextSibling.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <div
                              className={`bg-gray-200 border-2 border-dashed rounded-full w-10 h-10 flex items-center justify-center mr-3 ${
                                staff.photo ? "hidden" : ""
                              }`}
                            >
                              <FiUser className="text-gray-700" />
                            </div>
                            <div className="font-medium text-gray-900">{staff.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{staff.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(staff.role)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{getCentreName(staff.centreId)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{staff.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(staff.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedStaff(staff);
                                setShowStaffDetails(staff);
                              }}
                              className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition"
                              title="View details"
                            >
                              <FiEye className="text-lg" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStaff(staff);
                                setShowEditModal(true);
                              }}
                              className="text-gray-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition"
                              title="Edit staff"
                            >
                              <FiEdit className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDelete(staff.id)}
                              className="text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
                              title="Delete staff"
                            >
                              <FiTrash2 className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
              <div className="mb-2 md:mb-0">
                Showing <span className="font-medium">{filteredStaff.length}</span> of{" "}
                <span className="font-medium">{staffList.length}</span> staff members
              </div>
              <div className="flex items-center">
                <span className="mr-2">Rows per page:</span>
                <select
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1"
                  disabled={loading}
                >
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <AddStaffForm
                  centres={centres}
                  onAdd={() => {
                    setShowAddModal(false);
                    fetchData();
                  }}
                  onClose={() => setShowAddModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEditModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Edit Staff Member</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedStaff(null);
                    }}
                    className="text-gray-400 hover:text-gray-500 text-2xl"
                  >
                    <FiX />
                  </button>
                </div>
                <EditStaffForm
                  staff={selectedStaff}
                  centres={centres}
                  onUpdate={() => {
                    setShowEditModal(false);
                    setSelectedStaff(null);
                    fetchData();
                  }}
                  onClose={() => {
                    setShowEditModal(false);
                    setSelectedStaff(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Staff Detail Modal */}
        {showStaffDetails && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Staff Details</h2>
                  <button
                    onClick={() => setShowStaffDetails(null)}
                    className="text-gray-400 hover:text-gray-500 text-2xl"
                  >
                    <FiX />
                  </button>
                </div>
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  <div className="flex-shrink-0">
                    {showStaffDetails.photo ? (
                      <img
                        src={showStaffDetails.photo}
                        alt={`${showStaffDetails.name}'s profile`}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.target.src = "";
                          e.target.nextSibling.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`bg-gray-100 border-2 border-dashed rounded-full w-24 h-24 flex items-center justify-center ${
                        showStaffDetails.photo ? "hidden" : ""
                      }`}
                    >
                      <FiUser className="text-3xl text-gray-700" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{showStaffDetails.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      {getRoleBadge(showStaffDetails.role)}
                      {getStatusBadge(showStaffDetails.status)}
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Username</p>
                        <p className="text-gray-900">{showStaffDetails.username}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900">{showStaffDetails.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Centre</p>
                        <p className="text-gray-900">{getCentreName(showStaffDetails.centreId)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Department</p>
                        <p className="text-gray-900">{showStaffDetails.department || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Employee ID</p>
                        <p className="text-gray-900">{showStaffDetails.employeeId || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Employment Type</p>
                        <p className="text-gray-900">{showStaffDetails.employmentType || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-gray-900">{showStaffDetails.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Salary</p>
                        <p className="text-gray-900">₹{showStaffDetails.salary || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Join Date</p>
                        <p className="text-gray-900">
                          {showStaffDetails.joinDate
                            ? new Date(showStaffDetails.joinDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Created At</p>
                        <p className="text-gray-900">
                          {new Date(showStaffDetails.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-md font-semibold text-gray-800 mb-4">Permissions</h3>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {(showStaffDetails.permissions || "")
                      .split(",")
                      .filter(Boolean)
                      .map((perm, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded"
                        >
                          {perm.trim() || "None"}
                        </span>
                      ))}
                  </div>
                  <h3 className="text-md font-semibold text-gray-800 mb-4">Recent Activities</h3>
                  {showStaffDetails.recentActivity?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {showStaffDetails.recentActivity.map((activity, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">{activity.action}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {new Date(activity.timestamp).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {activity.details || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No recent activities found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperadminStaffManagement;