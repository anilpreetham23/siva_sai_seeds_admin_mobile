import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Search, Filter, Trash2, Mail, Phone, Calendar, MessageSquare } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const STATUS_COLORS = {
  'New': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Replied': 'bg-green-100 text-green-700',
  'Closed': 'bg-gray-100 text-gray-700',
};

export default function ContactMessages() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-contact-messages'],
    queryFn: () => adminService.getContactMessages(),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }) => adminService.updateContactMessageStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminService.deleteContactMessage(id),
    onSuccess: () => {
      toast.success('Message deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
    },
    onError: () => toast.error('Failed to delete message'),
  });

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || msg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-primary-600" />
            Contact Messages
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage and respond to user inquiries.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Replied">Replied</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No messages found</p>
            <p className="text-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                  <th className="px-6 py-4">Sender Info</th>
                  <th className="px-6 py-4">Subject & Message</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <p className="font-bold text-gray-900 text-sm mb-1">{msg.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        <Mail size={12} /> <a href={`mailto:${msg.email}`} className="hover:text-primary-600 truncate max-w-[150px]" title={msg.email}>{msg.email}</a>
                      </div>
                      {msg.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone size={12} /> <a href={`tel:${msg.phone}`} className="hover:text-primary-600">{msg.phone}</a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top max-w-xs">
                      <p className="font-bold text-gray-800 text-sm mb-1 truncate" title={msg.subject}>{msg.subject}</p>
                      <p className="text-xs text-gray-600 line-clamp-3" title={msg.message}>{msg.message}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <select
                        value={msg.status}
                        onChange={(e) => updateStatusMut.mutate({ id: msg.id, status: e.target.value })}
                        disabled={updateStatusMut.isPending}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full outline-none cursor-pointer appearance-none ${STATUS_COLORS[msg.status] || STATUS_COLORS['New']}`}
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Replied">Replied</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 align-top text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {format(new Date(msg.created_at), 'dd MMM yyyy, HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this message?')) {
                            deleteMut.mutate(msg.id);
                          }
                        }}
                        disabled={deleteMut.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Message"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
