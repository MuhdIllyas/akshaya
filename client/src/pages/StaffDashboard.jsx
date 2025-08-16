// src/pages/dashboard/StaffDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const StaffDashboard = () => {
  // Sample data - replace with real API data
  const stats = [
    { title: "Pending Tasks", value: 8, color: "bg-orange-500" },
    { title: "Completed Tasks", value: 24, color: "bg-green-500" },
    { title: "Upcoming Shifts", value: 3, color: "bg-blue-500" },
    { title: "Performance Score", value: "92%", color: "bg-purple-500" },
  ];

  const recentTasks = [
    { id: 1, title: "Client Report - Q3", due: "Today", priority: "High", completed: false },
    { id: 2, title: "Onboard New Client", due: "Tomorrow", priority: "Medium", completed: false },
    { id: 3, title: "Team Meeting Prep", due: "Aug 2", priority: "Low", completed: true },
  ];

  const schedule = [
    { day: "Mon", date: "29", shift: "9:00 AM - 5:00 PM" },
    { day: "Tue", date: "30", shift: "10:00 AM - 6:00 PM" },
    { day: "Wed", date: "31", shift: "9:00 AM - 5:00 PM" },
    { day: "Thu", date: "1", shift: "Remote" },
    { day: "Fri", date: "2", shift: "9:00 AM - 5:00 PM" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, Sarah!</h1>
          <p className="text-gray-600">Here's what's happening today</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg mt-2 md:mt-0">
          <p className="text-blue-800 font-medium">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-600 font-medium">{stat.title}</h3>
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xl font-bold">{stat.value}</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${stat.color}`}
                  style={{ width: `${typeof stat.value === 'number' ? Math.min(stat.value * 8, 100) : 92}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">My Tasks</h2>
            <Link to="/dashboard/staff/tasks" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentTasks.map(task => (
              <div key={task.id} className={`flex items-center p-3 rounded-lg ${task.completed ? 'bg-green-50' : 'bg-orange-50'}`}>
                <div className={`w-3 h-3 rounded-full mr-3 ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <div className="flex-1">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-gray-600">Due: {task.due}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {task.completed ? (
                    <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">Completed</span>
                  ) : (
                    <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-50">
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">My Schedule</h2>
            <Link to="/dashboard/staff/schedule" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Calendar →
            </Link>
          </div>
          
          <div className="space-y-3">
            {schedule.map((day, index) => (
              <div key={index} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                <div className="text-center mr-4">
                  <div className="text-sm text-gray-500">{day.day}</div>
                  <div className="text-lg font-bold">{day.date}</div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{day.shift}</p>
                  {day.shift === "Remote" && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Remote Work</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">My Performance</h2>
          <Link to="/dashboard/staff/performance" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View Details →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-gray-600 font-medium">Task Completion</h3>
            <div className="mt-2 flex items-end">
              <span className="text-3xl font-bold text-blue-700">92%</span>
              <span className="ml-2 text-green-600 font-medium">↑ 4%</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Above team average</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-gray-600 font-medium">Productivity</h3>
            <div className="mt-2 flex items-end">
              <span className="text-3xl font-bold text-purple-700">88%</span>
              <span className="ml-2 text-green-600 font-medium">↑ 2%</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Consistent performer</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-gray-600 font-medium">Feedback Score</h3>
            <div className="mt-2 flex items-end">
              <span className="text-3xl font-bold text-green-700">4.8</span>
              <span className="ml-2 text-gray-600 text-sm">/5.0</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">12 client reviews</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;