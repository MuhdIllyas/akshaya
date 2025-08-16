import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSend,
  FiPaperclip,
  FiSearch,
  FiMoreVertical,
  FiBell,
  FiMenu,
  FiX,
  FiFile,
  FiChevronLeft,
  FiPlus,
  FiMic,
  FiVideo as FiVideoCall,
  FiPhoneCall,
  FiUserPlus,
  FiStar,
  FiInfo,
  FiTrash2,
  FiMail,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiMapPin,
  FiCheckSquare,
  FiCheck,
  FiMessageSquare,
  FiActivity,
  FiClock,
  FiGrid
} from "react-icons/fi";
import { FaRegSmile, FaEllipsisH } from "react-icons/fa";
import { IoMdCheckmarkCircle, IoMdClose } from "react-icons/io";
import { BsCircleFill } from "react-icons/bs";

const MessengerPage = () => {
  const [activeView, setActiveView] = useState("chats");
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isContactPanelOpen, setIsContactPanelOpen] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [tasks, setTasks] = useState({});
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    priority: "medium"
  });
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setIsEmojiPickerOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Mock data
  const conversations = [
    { id: 1, name: "Marketing Team", isGroup: true, lastMessage: "Sarah: The campaign is ready for review", time: "10:30 AM", unread: 0, participants: ["Sarah", "Mike", "David", "You"], avatarColor: "bg-navy-700" },
    { id: 2, name: "David Wilson", isGroup: false, lastMessage: "Can you send me the Q3 report?", time: "9:45 AM", unread: 2, participants: ["David", "You"], avatarColor: "bg-blue-600" },
    { id: 3, name: "Sarah Johnson", isGroup: false, lastMessage: "I've scheduled the meeting for tomorrow", time: "Yesterday", unread: 0, participants: ["Sarah", "You"], avatarColor: "bg-pink-500" },
    { id: 4, name: "Product Team", isGroup: true, lastMessage: "Mike: The new design is approved", time: "Yesterday", unread: 0, participants: ["Mike", "Emma", "James", "You"], avatarColor: "bg-purple-600" },
    { id: 5, name: "Client Meeting", isGroup: true, lastMessage: "You: I'll prepare the presentation", time: "Wednesday", unread: 5, participants: ["Alex", "Lisa", "Mark", "You"], avatarColor: "bg-orange-500" },
  ];

  const contactDetails = {
    2: {
      name: "David Wilson",
      email: "david.wilson@company.com",
      position: "Marketing Director",
      department: "Marketing",
      phone: "+1 (555) 123-4567",
      location: "New York Office",
      joinedDate: "Jan 15, 2020",
      sharedFiles: [
        { id: 1, name: "Q3_Report.pdf", size: "2.4 MB", date: "Jul 12, 2023" },
        { id: 2, name: "Project_Overview.pptx", size: "8.1 MB", date: "Aug 2, 2023" },
        { id: 3, name: "Budget_Planning.xlsx", size: "1.2 MB", date: "Aug 5, 2023" }
      ]
    },
    3: {
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      position: "Product Manager",
      department: "Product Development",
      phone: "+1 (555) 987-6543",
      location: "San Francisco Office",
      joinedDate: "Mar 22, 2019",
      sharedFiles: [
        { id: 1, name: "Product_Roadmap.pdf", size: "3.1 MB", date: "Jul 28, 2023" },
        { id: 2, name: "User_Research.docx", size: "0.8 MB", date: "Aug 1, 2023" }
      ]
    },
    5: {
      name: "Client Meeting",
      participants: [
        { name: "Alex Carter", role: "CEO", email: "alex@clientcompany.com" },
        { name: "Lisa Morgan", role: "CTO", email: "lisa@clientcompany.com" },
        { name: "Mark Taylor", role: "CFO", email: "mark@clientcompany.com" }
      ],
      createdDate: "Aug 1, 2023",
      sharedFiles: [
        { id: 1, name: "Presentation_Deck.pptx", size: "5.7 MB", date: "Aug 8, 2023" },
        { id: 2, name: "Contract_Draft.pdf", size: "1.9 MB", date: "Aug 9, 2023" },
        { id: 3, name: "Financials.xlsx", size: "2.1 MB", date: "Aug 9, 2023" },
        { id: 4, name: "Scope_of_Work.docx", size: "0.9 MB", date: "Aug 10, 2023" }
      ]
    }
  };

  const messages = {
    1: [
      { id: 1, sender: "Sarah", text: "Hi team, the new marketing campaign is ready for review.", time: "10:15 AM", isFile: false },
      { id: 2, sender: "You", text: "Looks great! Can we add competitor analysis?", time: "10:30 AM", isFile: false },
      { id: 3, sender: "Mike", text: "I'll gather competitor data by EOD.", time: "10:32 AM", isFile: false },
      { id: 4, sender: "David", text: "The budget looks good to me.", time: "10:45 AM", isFile: false },
    ],
    2: [
      { id: 1, sender: "David", text: "Hi, can you send me the Q3 sales report?", time: "9:30 AM", isFile: false },
      { id: 2, sender: "You", text: "Sure, sending now.", time: "9:35 AM", isFile: true, fileName: "Q3_Report.pdf" },
      { id: 3, sender: "David", text: "Thanks! Also, do you have the projections for Q4?", time: "9:40 AM", isFile: false },
    ],
    5: [
      { id: 1, sender: "Alex", text: "Looking forward to our meeting tomorrow.", time: "Yesterday", isFile: false },
      { id: 2, sender: "You", text: "I'll prepare the presentation deck and share it with you this evening.", time: "Yesterday", isFile: false },
      { id: 3, sender: "Lisa", text: "Great! We'll review it first thing in the morning.", time: "Yesterday", isFile: false },
      { id: 4, sender: "Mark", text: "Can you include the financial projections section?", time: "Today", isFile: false },
      { id: 5, sender: "You", text: "Yes, I've added that section with updated numbers.", time: "Today", isFile: true, fileName: "Financials.xlsx" },
    ],
  };

  // Initialize tasks for each conversation
  useEffect(() => {
    const initialTasks = {
      1: [
        { 
          id: 'task-1-1', 
          title: 'Review campaign materials', 
          description: 'Go through all campaign assets and provide feedback', 
          assignee: 'David', 
          dueDate: '2023-08-15', 
          priority: 'high', 
          completed: false,
          createdBy: 'You',
          createdAt: '2023-08-09T10:00:00'
        },
        { 
          id: 'task-1-2', 
          title: 'Prepare competitor analysis', 
          description: 'Research main competitors and their strategies', 
          assignee: 'Mike', 
          dueDate: '2023-08-12', 
          priority: 'medium', 
          completed: true,
          createdBy: 'Sarah',
          createdAt: '2023-08-08T14:30:00'
        }
      ],
      5: [
        { 
          id: 'task-5-1', 
          title: 'Finalize presentation deck', 
          description: 'Complete all slides for client meeting', 
          assignee: 'You', 
          dueDate: '2023-08-10', 
          priority: 'high', 
          completed: false,
          createdBy: 'You',
          createdAt: '2023-08-09T09:15:00'
        }
      ]
    };
    setTasks(initialTasks);
  }, []);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() && !fileToUpload) return;
    
    if (activeConversation) {
      const newMsg = {
        id: messages[activeConversation.id].length + 1,
        sender: "You",
        text: newMessage,
        time: "Just now",
        isFile: false
      };
      
      messages[activeConversation.id].push(newMsg);
    }
    
    setNewMessage("");
    setFileToUpload(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setFileToUpload({ name: file.name });
  };

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignTask = () => {
    if (!taskForm.title.trim() || !activeConversation) return;
    
    const newTask = {
      id: `task-${activeConversation.id}-${Date.now()}`,
      title: taskForm.title,
      description: taskForm.description,
      assignee: taskForm.assignee,
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      completed: false,
      createdBy: "You",
      createdAt: new Date().toISOString()
    };
    
    // Add to tasks state
    setTasks(prev => ({
      ...prev,
      [activeConversation.id]: [
        ...(prev[activeConversation.id] || []),
        newTask
      ]
    }));
    
    // Create a task message
    const taskMessage = {
      id: messages[activeConversation.id].length + 1,
      sender: "You",
      isTask: true,
      taskId: newTask.id,
      time: "Just now",
      text: `Assigned task: "${newTask.title}" to ${newTask.assignee}`
    };
    
    messages[activeConversation.id].push(taskMessage);
    
    // Reset form and close modal
    setTaskForm({
      title: "",
      description: "",
      assignee: "",
      dueDate: "",
      priority: "medium"
    });
    setIsTaskModalOpen(false);
  };

  const toggleTaskCompletion = (conversationId, taskId) => {
    setTasks(prev => ({
      ...prev,
      [conversationId]: prev[conversationId].map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const deleteTask = (conversationId, taskId) => {
    setTasks(prev => ({
      ...prev,
      [conversationId]: prev[conversationId].filter(task => task.id !== taskId)
    }));
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji.native);
    setIsEmojiPickerOpen(false);
  };

  useEffect(() => {
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation, messages]);

  const renderConversationList = () => (
    <div className="flex flex-col bg-white text-gray-800 h-full border-r border-gray-200">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-navy-700 w-10 h-10 rounded-lg flex items-center justify-center">
            <FiSend className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Professional Chat</h2>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition">
            <FiBell className="text-gray-600" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition">
            <FiPlus className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4 relative">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="pl-12 pr-4 py-3 w-full rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 border border-gray-200 transition text-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2 text-xs text-gray-500 px-4 py-2">Recent searches</div>
              <div className="p-2 hover:bg-gray-50 cursor-pointer">Marketing Team</div>
              <div className="p-2 hover:bg-gray-50 cursor-pointer">David Wilson</div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
          <span>Recent Chats</span>
          <button className="text-xs text-navy-700 font-medium">New Group</button>
        </div>
        {filteredConversations.map((c) => (
          <motion.div
            key={c.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveConversation(c)}
            className={`flex items-center p-4 cursor-pointer transition-all duration-200 ${
              activeConversation?.id === c.id 
                ? "bg-blue-50 border-l-4 border-navy-700" 
                : "hover:bg-gray-50 border-l-4 border-transparent"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${c.avatarColor} mr-3 flex-shrink-0`}
            >
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 truncate">{c.name}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{c.time}</span>
              </div>
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-500 truncate">{c.lastMessage}</p>
                {c.unread > 0 && (
                  <span className="bg-navy-700 text-xs text-white rounded-full px-1.5 py-0.5 ml-2 flex-shrink-0">
                    {c.unread} new
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderContactPanel = () => {
    if (!activeConversation || !contactDetails[activeConversation.id]) return null;
    
    const contact = contactDetails[activeConversation.id];
    
    return (
      <div className="flex flex-col bg-white border-l border-gray-200 h-full">
        <div className="p-6 flex flex-col items-center border-b border-gray-200">
          <div className="w-24 h-24 rounded-full bg-navy-700 flex items-center justify-center text-white text-3xl mb-4">
            {activeConversation.name[0]}
          </div>
          <h3 className="text-xl font-bold text-gray-800">{contact.name || activeConversation.name}</h3>
          {!activeConversation.isGroup && (
            <p className="text-gray-500 flex items-center mt-1">
              <BsCircleFill className="text-green-500 mr-2" /> Online
            </p>
          )}
          {activeConversation.isGroup && (
            <p className="text-gray-500 mt-1">{contact.participants?.length || activeConversation.participants.length} members</p>
          )}
        </div>

        {!activeConversation.isGroup ? (
          <div className="p-4 overflow-y-auto custom-scrollbar">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              <FiUser className="mr-2" /> Contact Information
            </h4>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <FiMail className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-700">{contact.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <FiBriefcase className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="text-gray-700">{contact.position}</p>
                  <p className="text-sm text-gray-500 mt-1">Department</p>
                  <p className="text-gray-700">{contact.department}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <FiPhoneCall className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-700">{contact.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <FiMapPin className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-gray-700">{contact.location}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <FiCalendar className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joined Date</p>
                  <p className="text-gray-700">{contact.joinedDate}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto custom-scrollbar">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              <FiUser className="mr-2" /> Group Information
            </h4>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Created</p>
              <p className="text-gray-700">{contact.createdDate || "Aug 1, 2023"}</p>
            </div>
            
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              <FiUserPlus className="mr-2" /> Participants
            </h4>
            <div className="space-y-3">
              {(contact.participants || activeConversation.participants.filter(p => p !== "You")).map((p, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-3">
                    {typeof p === 'string' ? p[0] : p.name[0]}
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">{typeof p === 'string' ? p : p.name}</p>
                    {typeof p !== 'string' && (
                      <p className="text-xs text-gray-500">{p.role}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto p-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
            <FiFile className="mr-2" /> Shared Files
          </h4>
          <div className="space-y-2">
            {(contact.sharedFiles || []).map(file => (
              <motion.div 
                key={file.id}
                whileHover={{ x: 5 }}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
              >
                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                  <FiFile className="text-gray-500" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{file.size} · {file.date}</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <FiMoreVertical />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskModal = () => (
    <AnimatePresence>
      {isTaskModalOpen && activeConversation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsTaskModalOpen(false)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-white rounded-xl w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Assign New Task</h3>
                <button 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <IoMdClose className="text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    name="title"
                    value={taskForm.title}
                    onChange={handleTaskFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-700 focus:border-transparent"
                    placeholder="What needs to be done?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={taskForm.description}
                    onChange={handleTaskFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-700 focus:border-transparent"
                    placeholder="Add details..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    name="assignee"
                    value={taskForm.assignee}
                    onChange={handleTaskFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-700 focus:border-transparent"
                  >
                    <option value="">Select assignee</option>
                    {activeConversation.participants
                      .filter(p => p !== "You")
                      .map(participant => (
                        <option key={participant} value={participant}>
                          {participant}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={taskForm.dueDate}
                      onChange={handleTaskFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-700 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      value={taskForm.priority}
                      onChange={handleTaskFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-700 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTask}
                  className="px-4 py-2 bg-navy-700 text-white rounded-lg font-medium hover:bg-navy-800 transition"
                >
                  Assign Task
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderTask = (task) => {
    const priorityColors = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200"
    };
    
    return (
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <button
              onClick={() => toggleTaskCompletion(activeConversation.id, task.id)}
              className={`mt-1 p-1 rounded ${task.completed ? 'bg-navy-700 text-white' : 'border border-gray-300 text-transparent'}`}
            >
              <FiCheck size={14} />
            </button>
            <div>
              <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[task.priority]}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <FiCalendar size={14} />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <FiUser size={14} />
                  <span>{task.assignee}</span>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => deleteTask(activeConversation.id, task.id)}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderNavigationSidebar = () => (
    <div className="hidden md:flex flex-col items-center py-4 w-16 bg-white border-r border-gray-200">
      <nav className="flex-1">
        <ul className="space-y-6">
          <li>
            <button
              onClick={() => setActiveView("chats")}
              className={`p-3 rounded-lg flex items-center justify-center ${
                activeView === "chats"
                  ? "bg-navy-700 text-white"
                  : "hover:bg-gray-100 text-gray-600"
              } transition`}
              title="Chats"
            >
              <FiMessageSquare size={20} />
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveView("activity")}
              className={`p-3 rounded-lg flex items-center justify-center ${
                activeView === "activity"
                  ? "bg-navy-700 text-white"
                  : "hover:bg-gray-100 text-gray-600"
              } transition`}
              title="Activity"
            >
              <FiActivity size={20} />
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveView("calendar")}
              className={`p-3 rounded-lg flex items-center justify-center ${
                activeView === "calendar"
                  ? "bg-navy-700 text-white"
                  : "hover:bg-gray-100 text-gray-600"
              } transition`}
              title="Calendar"
            >
              <FiCalendar size={20} />
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveView("files")}
              className={`p-3 rounded-lg flex items-center justify-center ${
                activeView === "files"
                  ? "bg-navy-700 text-white"
                  : "hover:bg-gray-100 text-gray-600"
              } transition`}
              title="Files"
            >
              <FiGrid size={20} />
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveView("tasks")}
              className={`p-3 rounded-lg flex items-center justify-center ${
                activeView === "tasks"
                  ? "bg-navy-700 text-white"
                  : "hover:bg-gray-100 text-gray-600"
              } transition`}
              title="Tasks"
            >
              <FiCheckSquare size={20} />
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveView("schedules")}
              className={`p-3 rounded-lg flex items-center justify-center ${
                activeView === "schedules"
                  ? "bg-navy-700 text-white"
                  : "hover:bg-gray-100 text-gray-600"
              } transition`}
              title="Schedules"
            >
              <FiClock size={20} />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );

  const renderPlaceholderView = (title) => (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-6">
        {activeView === "chats" && <FiMessageSquare size={24} className="text-gray-500" />}
        {activeView === "activity" && <FiActivity size={24} className="text-gray-500" />}
        {activeView === "calendar" && <FiCalendar size={24} className="text-gray-500" />}
        {activeView === "files" && <FiGrid size={24} className="text-gray-500" />}
        {activeView === "tasks" && <FiCheckSquare size={24} className="text-gray-500" />}
        {activeView === "schedules" && <FiClock size={24} className="text-gray-500" />}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title} View</h3>
      <p className="text-gray-500 max-w-md">
        {title} content will be displayed here. This is a placeholder view.
      </p>
    </div>
  );

  const renderChatArea = () => {
    if (!activeConversation) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-navy-700 w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
          >
            <FiSend className="text-white text-4xl" />
          </motion.div>
          <motion.h3 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-800 mb-2"
          >
            Professional Chat
          </motion.h3>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 max-w-md mb-6"
          >
            Select a conversation or start a new chat to begin messaging with your team
          </motion.p>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="px-5 py-3 bg-navy-700 text-white rounded-xl flex items-center gap-2 hover:bg-navy-800 transition shadow-lg"
          >
            <FiPlus /> Start New Conversation
          </motion.button>
        </div>
      );
    }

    const currentMessages = messages[activeConversation.id] || [];
    const conversationTasks = tasks[activeConversation.id] || [];

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 flex items-center border-b border-gray-200 bg-white shadow-sm">
          <button
            className="md:hidden mr-3 text-gray-500 hover:text-gray-700"
            onClick={() => setActiveConversation(null)}
          >
            <FiChevronLeft size={24} />
          </button>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${activeConversation.avatarColor} mr-3 flex-shrink-0`}
          >
            {activeConversation.name[0]}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-800 truncate">{activeConversation.name}</h2>
            <div className="flex items-center gap-1">
              {activeConversation.isGroup ? (
                <>
                  <div className="flex">
                    {activeConversation.participants.slice(0, 3).map((p, i) => (
                      <div key={i} className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white -ml-1 flex items-center justify-center text-xs">
                        {p[0]}
                      </div>
                    ))}
                    {activeConversation.participants.length > 3 && (
                      <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white -ml-1 flex items-center justify-center text-xs">
                        +{activeConversation.participants.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">
                    {activeConversation.participants.length} members
                  </span>
                </>
              ) : (
                <div className="flex items-center">
                  <BsCircleFill className="text-green-500 text-xs mr-1" />
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              )}
            </div>
          </div>
          <div className="ml-auto flex gap-1 relative">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition"
            >
              <FiVideoCall size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition"
            >
              <FiPhoneCall size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsTaskModalOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition"
              title="Assign Task"
            >
              <FiCheckSquare size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition relative"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            >
              <FiMoreVertical size={20} />
            </motion.button>
            
            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                >
                  <button className="flex items-center w-full p-3 text-sm hover:bg-gray-50">
                    <FiUserPlus className="mr-3" /> Add People
                  </button>
                  <button className="flex items-center w-full p-3 text-sm hover:bg-gray-50">
                    <FiStar className="mr-3" /> Mark as Favorite
                  </button>
                  <button className="flex items-center w-full p-3 text-sm hover:bg-gray-50">
                    <FiInfo className="mr-3" /> View Details
                  </button>
                  <button className="flex items-center w-full p-3 text-sm text-red-500 hover:bg-gray-50">
                    <FiTrash2 className="mr-3" /> Delete Conversation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages - Fixed height with scrolling */}
        <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50 space-y-6 custom-scrollbar">
          <div className="text-center">
            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
              Today
            </span>
          </div>
          
          {currentMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
            >
              {msg.isTask ? (
                <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-md w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCheckSquare className="text-navy-700" />
                    <span className="font-semibold text-gray-800">Task Assigned</span>
                  </div>
                  {tasks[activeConversation.id]?.find(t => t.id === msg.taskId) && 
                    renderTask(tasks[activeConversation.id].find(t => t.id === msg.taskId))
                  }
                  <div className="text-xs text-gray-500 mt-2 flex justify-between">
                    <span>{msg.time}</span>
                    {msg.sender === "You" && <IoMdCheckmarkCircle className="text-blue-500" />}
                  </div>
                </div>
              ) : (
                <div className="flex max-w-xs">
                  {msg.sender !== "You" && !activeConversation.isGroup ? null : (
                    <div className="mr-2 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                        {msg.sender[0]}
                      </div>
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.sender === "You"
                        ? "bg-navy-700 text-white rounded-br-none"
                        : "bg-white text-gray-700 rounded-bl-none shadow-sm border border-gray-200"
                    }`}
                  >
                    {msg.isFile ? (
                      <div className="flex items-center gap-2">
                        <FiFile className="flex-shrink-0" />
                        <span className="truncate">{msg.fileName || "Document"}</span>
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                    <div className={`flex justify-between items-center mt-1 ${
                      msg.sender === "You" ? "text-blue-200" : "text-gray-500"
                    }`}>
                      <span className="text-xs">{msg.time}</span>
                      {msg.sender === "You" && (
                        <IoMdCheckmarkCircle className="text-xs" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          
          {/* TASK LIST SECTION */}
          {conversationTasks.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FiCheckSquare className="text-navy-700" />
                  Active Tasks
                </h3>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                  {conversationTasks.length} tasks
                </span>
              </div>
              
              <div className="space-y-3">
                {conversationTasks.map(task => renderTask(task))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Fixed position at bottom */}
        <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 relative">
          <div className="relative">
            <button 
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="p-2 text-gray-500 hover:text-navy-700 rounded-full hover:bg-gray-100 transition"
            >
              <FaRegSmile size={20} />
            </button>
            
            {/* Emoji Picker */}
            <AnimatePresence>
              {isEmojiPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 z-10"
                  ref={emojiPickerRef}
                >
                  <Picker
                    onSelect={handleEmojiSelect}
                    theme="light"
                    title="Pick an emoji"
                    emoji="smile"
                    native={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2 flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-700"
            />
            <div className="flex items-center gap-1">
              <input
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="fileUpload"
                className="p-2 text-gray-500 hover:text-navy-700 cursor-pointer rounded-full hover:bg-gray-200 transition"
              >
                <FiPaperclip size={18} />
              </label>
              <button className="p-2 text-gray-500 hover:text-navy-700 rounded-full hover:bg-gray-200 transition">
                <FiFile size={18} />
              </button>
            </div>
          </div>
          
          {newMessage || fileToUpload ? (
            <motion.button
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              className="bg-navy-700 text-white p-3 rounded-xl shadow-md hover:bg-navy-800 transition"
            >
              <FiSend size={18} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-200 text-gray-600 p-3 rounded-xl shadow"
            >
              <FiMic size={18} />
            </motion.button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Task Assignment Modal */}
      {renderTaskModal()}
      
      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-800/50 z-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="bg-white w-4/5 h-full shadow-xl"
            >
              <div className="flex justify-between p-4 border-b border-gray-200">
                <h2 className="text-gray-800 font-bold">Professional Chat</h2>
                <FiX
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-500 cursor-pointer"
                  size={24}
                />
              </div>
              {renderConversationList()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-4 bg-navy-700 text-white z-10 flex items-center shadow-lg">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-white"
        >
          <FiMenu size={24} />
        </button>
        <h2 className="text-lg font-bold ml-4">Professional Chat</h2>
        <div className="ml-auto flex gap-3">
          <FiBell />
          <FiPlus />
        </div>
      </div>

      {/* New Navigation Sidebar */}
      {renderNavigationSidebar()}

      {/* Conversation List (only visible in chat view) */}
      {activeView === "chats" && (
        <div className="hidden md:flex md:w-1/3 lg:w-1/4 h-full">
          {renderConversationList()}
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 ${activeView === "chats" && isContactPanelOpen ? 'lg:w-1/2' : 'lg:w-3/4'} flex flex-col pt-16 md:pt-0 h-full`}>
        {activeView === "chats" ? (
          renderChatArea()
        ) : activeView === "activity" ? (
          renderPlaceholderView("Activity")
        ) : activeView === "calendar" ? (
          renderPlaceholderView("Calendar")
        ) : activeView === "files" ? (
          renderPlaceholderView("Files")
        ) : activeView === "tasks" ? (
          renderPlaceholderView("Tasks")
        ) : activeView === "schedules" ? (
          renderPlaceholderView("Schedules")
        ) : (
          renderPlaceholderView("Chat")
        )}
      </div>

      {/* Contact Panel (only in chat view) */}
      {activeView === "chats" && activeConversation && contactDetails[activeConversation.id] && (
        <div className={`hidden lg:flex ${isContactPanelOpen ? 'lg:w-1/4' : 'w-0'} h-full transition-all duration-300 overflow-hidden`}>
          <div className="flex-1">
            {renderContactPanel()}
          </div>
          <button 
            onClick={() => setIsContactPanelOpen(!isContactPanelOpen)}
            className="w-6 h-24 bg-gray-100 hover:bg-gray-200 rounded-l-lg flex items-center justify-center my-auto transition"
          >
            <FiChevronLeft 
              className={`text-gray-600 transition-transform ${isContactPanelOpen ? '' : 'rotate-180'}`} 
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessengerPage;

// CSS for custom scrollbar and navy blue colors
const styles = `
  :root {
    --navy-700: #1e3a8a;
    --navy-800: #172554;
  }
  
  .bg-navy-700 {
    background-color: var(--navy-700);
  }
  
  .bg-navy-800 {
    background-color: var(--navy-800);
  }
  
  .text-navy-700 {
    color: var(--navy-700);
  }
  
  .hover\\:bg-navy-800:hover {
    background-color: var(--navy-800);
  }
  
  .hover\\:text-navy-700:hover {
    color: var(--navy-700);
  }
  
  .border-navy-700 {
    border-color: var(--navy-700);
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c5c5c5;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

export const MessengerStyle = () => <style>{styles}</style>;