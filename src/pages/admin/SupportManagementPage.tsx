import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../utils/firebase';
import { SupportTicket, SupportTicketStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { X } from 'lucide-react';
import Button from '../../components/Button';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

// Modal component to display ticket details
const TicketDetailsModal: React.FC<{ ticket: SupportTicket; onClose: () => void }> = ({ ticket, onClose }) => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-base rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Ticket Details</h3>
                <button onClick={onClose}><X /></button>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <h4 className="font-semibold text-sm text-text-secondary">Customer</h4>
                    <p>{ticket.users?.first_name} {ticket.users?.last_name} ({ticket.users?.email})</p>
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-text-secondary">Subject</h4>
                    <p>{ticket.subject}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-text-secondary">Message</h4>
                    <p className="whitespace-pre-wrap bg-neutral p-3 rounded-md">{ticket.details}</p>
                </div>
                 <div className="text-right">
                     <Button variant="outline" onClick={onClose}>Close</Button>
                 </div>
            </div>
        </div>
    </div>
);


const SupportManagementPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const { showToast } = useToast();

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
        const q = db.ref('supportTickets').orderByChild('createdAt');
        const ticketsSnap = await q.get();
        const ticketsArray = snapshotToArray(ticketsSnap).sort((a: any, b: any) => b.createdAt - a.createdAt);

        const ticketsData = await Promise.all(ticketsArray.map(async (ticketData: any) => {
            let userData = { first_name: 'N/A', last_name: '', email: '' };
            if (ticketData.userId) {
                const userSnap = await db.ref('users/' + ticketData.userId).get();
                if(userSnap.exists()) {
                    userData = {
                        first_name: userSnap.val().firstName,
                        last_name: userSnap.val().lastName,
                        email: userSnap.val().email,
                    }
                }
            }
            return {
                ...ticketData,
                users: userData
            } as SupportTicket
        }));
        setTickets(ticketsData);
    } catch (error) {
        showToast('Failed to fetch support tickets', 'error');
        console.error(error);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId: string, newStatus: SupportTicketStatus) => {
    try {
        await db.ref('supportTickets/' + ticketId).update({
            status: newStatus,
            resolvedAt: newStatus === SupportTicketStatus.Closed ? new Date().toISOString() : null
        });
        showToast('Ticket status updated', 'success');
        fetchTickets();
    } catch (error) {
        showToast(`Failed to update ticket`, 'error');
    }
  };


  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Manage Support Tickets</h2>
      <div className="bg-base overflow-x-auto rounded-lg shadow">
        {loading ? <p className="p-4">Loading tickets...</p> : (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Customer</th>
                <th scope="col" className="px-6 py-3">Subject</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                      <div className="font-medium">{ticket.users?.first_name} {ticket.users?.last_name}</div>
                      <div className="text-xs text-text-secondary">{ticket.users?.email}</div>
                  </td>
                   <td className="px-6 py-4 font-medium max-w-xs truncate">{ticket.subject}</td>
                  <td className="px-6 py-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value as SupportTicketStatus)}
                      className="p-1 rounded-md border-gray-300 text-xs focus:ring-primary focus:border-primary"
                    >
                      {Object.values(SupportTicketStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedTicket(ticket)} className="font-medium text-primary hover:underline">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedTicket && <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </div>
  );
};

export default SupportManagementPage;
