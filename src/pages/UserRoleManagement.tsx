import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserCog } from 'lucide-react';

interface User {
  id: string;
  email: string;
  roles: string[];
}

export function UserRoleManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Get role assignments for all users
      const { data: roleAssignments, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rolesError) throw rolesError;

      // Combine user data with roles
      const usersWithRoles = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || '',
        roles: roleAssignments
          ?.filter(ra => ra.user_id === user.id)
          .map(ra => ra.role) || []
      }));

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (userId: string, role: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .match({ user_id: userId, role });

        if (error) throw error;
      } else {
        // Add role
        const { error } = await supabase.rpc('assign_role', {
          target_user_id: userId,
          role_name: role
        });

        if (error) throw error;
      }

      await loadUsers();
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roles = ['admin', 'operator', 'field_operator', 'service_provider'];

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <UserCog className="h-8 w-8 mr-2" />
                User Role Management
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage user roles and permissions
              </p>
            </div>
          </div>

          <div className="mt-4 relative">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        {roles.map(role => (
                          <th
                            key={role}
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            {role.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan={roles.length + 1} className="px-3 py-4 text-sm text-gray-500 text-center">
                            Loading...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={roles.length + 1} className="px-3 py-4 text-sm text-gray-500 text-center">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {user.email}
                            </td>
                            {roles.map(role => (
                              <td key={role} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={user.roles.includes(role)}
                                    onChange={() => handleRoleToggle(user.id, role, user.roles.includes(role))}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                  />
                                </label>
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}