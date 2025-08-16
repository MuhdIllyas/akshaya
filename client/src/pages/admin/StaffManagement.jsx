import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import StaffTable from "../../components/StaffTable";
import AddStaffForm from "../../components/AddStaffForm";
import { Link } from "react-router-dom";
import { FiPlus, FiSearch, FiFilter, FiDownload, FiGrid, FiList, FiUser } from "react-icons/fi";

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  const departments = ["All", "Accounts", "Reception", "Front Office", "Aadhaar", "Staff Executive", "Customer Relations"];
  const statuses = ["All", "Active", "On Leave", "Terminated"];

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const role = localStorage.getItem("role");
        const centreId = localStorage.getItem("centre_id");
        const url = role === "superadmin" ? "http://localhost:5000/api/staff/all" : `http://localhost:5000/api/staff/all?centre_id=${centreId}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();
        if (response.ok) {
          setStaffList(data);
        } else {
          throw new Error(data.error || "Failed to fetch staff");
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
        toast.error(err.message, { position: "top-right", autoClose: 5000, theme: "light" });
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const handleAddStaff = async () => {
    try {
      const role = localStorage.getItem("role");
      const centreId = localStorage.getItem("centre_id");
      const url = role === "superadmin" ? "http://localhost:5000/api/staff/all" : `http://localhost:5000/api/staff/all?centre_id=${centreId}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStaffList(data);
        toast.success("Staff added successfully", { position: "top-right", autoClose: 3000, theme: "light" });
      } else {
        throw new Error(data.error || "Failed to refresh staff list");
      }
    } catch (error) {
      console.error("Failed to refresh staff list:", error);
      toast.error(error.message, { position: "top-right", autoClose: 5000, theme: "light" });
    }
    setShowAddForm(false);
  };

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.phone?.includes(searchTerm) ||
      staff.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "All" || staff.department === selectedDepartment;
    const matchesStatus = selectedStatus === "All" || staff.status === selectedStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const StaffCardView = ({ staffList }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {staffList.length > 0 ? (
          staffList.map((staff) => (
            <div key={staff.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start">
                {staff.photo ? (
                  <img
                    src={staff.photo}
                    alt={staff.name}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl w-16 h-16 flex items-center justify-center">
                    <FiUser className="text-gray-400 text-xl" />
                  </div>
                )}
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{staff.name}</h3>
                  <p className="text-gray-600 text-sm mt-1 truncate">@{staff.username}</p>
                  <p className="text-gray-600 text-sm truncate">{staff.role}</p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-500">Department</span>
                      <span className="text-gray-900 font-medium truncate">{staff.department || "N/A"}</span>
                    </div>
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-500">Status</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                          staff.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : staff.status === "On Leave"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {staff.status}
                      </span>
                    </div>
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-500">Phone</span>
                      <a href={`tel:${staff.phone}`} className="text-blue-600 hover:underline truncate">
                        {staff.phone || "N/A"}
                      </a>
                    </div>
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-500">Email</span>
                      <a href={`mailto:${staff.email}`} className="text-blue-600 hover:underline truncate">
                        {staff.email}
                      </a>
                    </div>
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-500">Joined</span>
                      <span className="text-gray-900">{staff.joinDate.split("T")[0]}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <Link
                      to={`/dashboard/management/staff/edit/${staff.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/dashboard/management/staff/${staff.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">No staff members found</div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage your team members, roles, and permissions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 md:mt-0 bg-navy-700 hover:bg-navy-800 text-white font-medium px-4 py-2.5 rounded-xl flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <FiPlus className="mr-2" />
          Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-6">
        <div className="relative md:col-span-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, username, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent text-gray-700 placeholder-gray-400"
          />
        </div>
        <div className="relative md:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-gray-400" />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 appearance-none bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent text-gray-700 truncate"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="relative md:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-gray-400" />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 appearance-none bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent text-gray-700 truncate"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-800 font-medium">Total Staff</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{staffList.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-sm text-green-800 font-medium">Active</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {staffList.filter((s) => s.status === "Active").length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
          <p className="text-sm text-yellow-800 font-medium">On Leave</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">
            {staffList.filter((s) => s.status === "On Leave").length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <p className="text-sm text-purple-800 font-medium">Departments</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {[...new Set(staffList.map((s) => s.department))].filter(Boolean).length}
          </p>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800 mr-4">Staff Members</h3>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              className={`px-3 py-1.5 flex items-center text-sm font-medium ${
                viewMode === "table" ? "bg-navy-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setViewMode("table")}
            >
              <FiList className="mr-1.5" />
              Table
            </button>
            <button
              className={`px-3 py-1.5 flex items-center text-sm font-medium ${
                viewMode === "card" ? "bg-navy-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setViewMode("card")}
            >
              <FiGrid className="mr-1.5" />
              Cards
            </button>
          </div>
        </div>
        <button className="flex items-center text-gray-600 hover:text-gray-900 text-sm">
          <FiDownload className="mr-1.5" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-8 w-8 text-navy-600 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-gray-600">Loading...</span>
        </div>
      ) : viewMode === "table" ? (
        <StaffTable staffList={filteredStaff} />
      ) : (
        <StaffCardView staffList={filteredStaff} />
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AddStaffForm onAdd={handleAddStaff} onClose={() => setShowAddForm(false)} />
          </div>
        </div>
      )}

      <style>{`
        .bg-navy-700 { background-color: #1e3a5f; }
        .bg-navy-800 { background-color: #172a45; }
      `}</style>
    </div>
  );
};

export default StaffManagement;