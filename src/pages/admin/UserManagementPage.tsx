import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../utils/firebase';
import { User } from '../../types';
import { useToast } from '../../context/ToastContext';
import InputField from '../../components/InputField';
import { Search } from 'lucide-react';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
        const usersSnap = await db.ref('users').get();
        setUsers(snapshotToArray(usersSnap) as User[]);
    } catch (error) {
        showToast('Error fetching users', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <div>
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
         <h2 className="text-2xl md:text-3xl font-bold">Manage Users</h2>
         <div className="relative w-full md:w-80">
            <InputField 
                id="search-users"
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                label=''
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>
       </div>
      <div className="bg-base overflow-x-auto rounded-lg shadow">
        {loading ? <p className="p-6">Loading users...</p> : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Country</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{`${user.firstName} ${user.lastName}`}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">{user.country}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isAdmin ? 'bg-secondary/20 text-secondary' : 'bg-slate-100 text-slate-800'}`}>
                            {user.isAdmin ? 'Admin' : 'Customer'}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
