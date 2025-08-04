import React, { useState } from 'react';
import { 
  Plus,
  Check,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  ArrowUpDown,
  X,
  ClipboardCheck,
  CalendarCheck,
  Shield,
  GraduationCap,
  Search,
  ChevronDown,
  Edit
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';

const AgentManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const agentsData = [
    {
      id: 'AGT001',
      name: 'Michael Johnson',
      email: 'michael.johnson@email.com',
      phone: '+91 9876543220',
      properties: 12,
      registrationDate: '2023-01-10',
      status: 'Active',
      detailsCompleted: true,
      meetingScheduled: '2025-08-05',
      backgroundCheck: 'Approved',
      trainingCompleted: true,
      lastActivity: '2025-07-25'
    },
    {
      id: 'AGT002',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+91 9876543221',
      properties: 8,
      registrationDate: '2023-02-15',
      status: 'Active',
      detailsCompleted: false,
      meetingScheduled: null,
      backgroundCheck: 'Pending',
      trainingCompleted: false,
      lastActivity: '2025-07-20'
    },
    {
      id: 'AGT003',
      name: 'James Wilson',
      email: 'james.wilson@email.com',
      phone: '+91 9876543222',
      properties: 15,
      registrationDate: '2023-03-20',
      status: 'Suspended',
      detailsCompleted: true,
      meetingScheduled: '2025-08-10',
      backgroundCheck: 'Approved',
      trainingCompleted: true,
      lastActivity: '2025-07-18'
    },
    {
      id: 'AGT004',
      name: 'Jessica Brown',
      email: 'jessica.brown@email.com',
      phone: '+91 9876543223',
      properties: 6,
      registrationDate: '2023-04-12',
      status: 'Active',
      detailsCompleted: true,
      meetingScheduled: null,
      backgroundCheck: 'Approved',
      trainingCompleted: false,
      lastActivity: '2025-07-22'
    },
    {
      id: 'AGT005',
      name: 'Robert Garcia',
      email: 'robert.garcia@email.com',
      phone: '+91 9876543224',
      properties: 10,
      registrationDate: '2023-05-08',
      status: 'Active',
      detailsCompleted: false,
      meetingScheduled: '2025-08-15',
      backgroundCheck: 'Pending',
      trainingCompleted: true,
      lastActivity: '2025-07-24'
    },
    {
      id: 'AGT006',
      name: 'Amanda Martinez',
      email: 'amanda.martinez@email.com',
      phone: '+91 9876543225',
      properties: 4,
      registrationDate: '2023-06-25',
      status: 'Inactive',
      detailsCompleted: true,
      meetingScheduled: null,
      backgroundCheck: 'Approved',
      trainingCompleted: false,
      lastActivity: '2025-07-10'
    },
    {
      id: 'AGT007',
      name: 'Christopher Lee',
      email: 'christopher.lee@email.com',
      phone: '+91 9876543226',
      properties: 9,
      registrationDate: '2023-07-14',
      status: 'Active',
      detailsCompleted: true,
      meetingScheduled: '2025-08-20',
      backgroundCheck: 'Approved',
      trainingCompleted: true,
      lastActivity: '2025-07-26'
    },
    {
      id: 'AGT008',
      name: 'Michelle Taylor',
      email: 'michelle.taylor@email.com',
      phone: '+91 9876543227',
      properties: 7,
      registrationDate: '2023-08-19',
      status: 'Active',
      detailsCompleted: false,
      meetingScheduled: null,
      backgroundCheck: 'Pending',
      trainingCompleted: true,
      lastActivity: '2025-07-23'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAgents = agentsData.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAgents.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Agent Management" 
          breadcrumb="Agent Management"
        />

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Agent
              </button>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Agent Table */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center space-x-1">
                        <span>Agent ID</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center space-x-1">
                        <span>Registration Date</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {agent.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-medium">{agent.name.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{agent.email}</div>
                          <div className="text-gray-500">{agent.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          {agent.properties} Properties
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agent.registrationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <ClipboardCheck className={`w-3 h-3 ${agent.detailsCompleted ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className="text-xs">Details {agent.detailsCompleted ? 'Completed' : 'Pending'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CalendarCheck className={`w-3 h-3 ${agent.meetingScheduled ? 'text-blue-500' : 'text-gray-400'}`} />
                            <span className="text-xs">Meeting {agent.meetingScheduled ? new Date(agent.meetingScheduled).toLocaleDateString() : 'Not Scheduled'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Shield className={`w-3 h-3 ${agent.backgroundCheck === 'Approved' ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className="text-xs">Background {agent.backgroundCheck}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <GraduationCap className={`w-3 h-3 ${agent.trainingCompleted ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className="text-xs">Training {agent.trainingCompleted ? 'Completed' : 'Pending'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 cursor-pointer p-1" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800 cursor-pointer p-1" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          {agent.status === 'Active' ? (
                            <button className="text-red-600 hover:text-red-800 cursor-pointer p-1" title="Suspend">
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button className="text-green-600 hover:text-green-800 cursor-pointer p-1" title="Activate">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredAgents.length)} of {filteredAgents.length} entries
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm cursor-pointer ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add New Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add New Agent</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter agent's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Properties Assignment</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Number of properties to assign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagement;