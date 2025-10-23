'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import DataTable from '../../../components/shared/DataTable';
import StatsCard from '../../../components/shared/StatsCard';
import Modal from '../../../components/shared/Modal';
import FormInput from '../../../components/shared/FormInput';
import { LifeBuoy, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import supportService from '../../../lib/services/supportService';

export default function SupportTicketsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'superadmin') {
      router.push('/vendor');
      return;
    }
    if (user) {
      fetchTickets();
      fetchStats();
    }
  }, [user, isLoading, router]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.getAllTickets();
      setTickets(response.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await supportService.getTicketStatistics();
      setStats(response.data || { total: 0, open: 0, inProgress: 0, resolved: 0 });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    
    try {
      await supportService.replyToTicket(selectedTicket._id, reply);
      setReply('');
      setShowModal(false);
      fetchTickets();
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await supportService.updateTicketStatus(ticketId, newStatus);
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const columns = [
    { 
      key: 'ticketNumber', 
      label: 'Ticket #', 
      sortable: true,
      render: (value) => <span className="font-mono text-blue-600">{value}</span>
    },
    { key: 'subject', label: 'Subject', sortable: true },
    { 
      key: 'category', 
      label: 'Category', 
      sortable: true,
      render: (value) => <span className="capitalize">{value}</span>
    },
    { 
      key: 'priority', 
      label: 'Priority', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'urgent' ? 'bg-red-100 text-red-800' :
          value === 'high' ? 'bg-orange-100 text-orange-800' :
          value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'resolved' ? 'bg-green-100 text-green-800' :
          value === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value.replace('_', ' ')}
        </span>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Created', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTicket(row);
          setShowModal(true);
        }}
        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
      >
        View & Reply
      </button>
      {row.status === 'open' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStatusUpdate(row.id, 'resolved');
          }}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
        >
          Resolve
        </button>
      )}
    </div>
  );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="superadmin"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="superadmin"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-1">Manage customer and vendor support requests</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatsCard title="Total Tickets" value={stats.total} icon={LifeBuoy} color="blue" />
            <StatsCard title="Open" value={stats.open} icon={AlertCircle} color="yellow" />
            <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} color="indigo" />
            <StatsCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="green" />
          </div>

          <DataTable
            data={tickets}
            columns={columns}
            actions={actions}
            searchable={true}
            pagination={true}
            emptyMessage="No support tickets found"
          />

          <Modal
            isOpen={showModal}
            onClose={() => { setShowModal(false); setSelectedTicket(null); setReply(''); }}
            title="Ticket Details"
            size="xl"
            footer={
              <>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Close</button>
                <button onClick={handleReply} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Send Reply</button>
              </>
            }
          >
            {selectedTicket && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-gray-600">Ticket #</label><p className="font-mono">{selectedTicket.ticketNumber}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Status</label><p className="capitalize">{selectedTicket.status}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Category</label><p className="capitalize">{selectedTicket.category}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Priority</label><p className="capitalize">{selectedTicket.priority}</p></div>
                </div>
                <div><label className="text-sm font-medium text-gray-600">Subject</label><p>{selectedTicket.subject}</p></div>
                <div><label className="text-sm font-medium text-gray-600">Description</label><p>{selectedTicket.description}</p></div>
                
                {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Replies</label>
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {selectedTicket.replies.map((r, i) => (
                        <div key={i} className={`p-3 rounded ${r.userType === 'admin' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <div className="text-xs text-gray-500">{r.userType} - {new Date(r.createdAt).toLocaleString()}</div>
                          <p className="text-sm mt-1">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <FormInput
                  label="Your Reply"
                  name="reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your response..."
                />
              </div>
            )}
          </Modal>
        </main>
      </div>
    </div>
  );
}

