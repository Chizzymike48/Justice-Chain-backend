import { FC, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import adminService, { UserRecord } from '../services/adminService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import SuccessAlert from '../components/common/SuccessAlert'
import PaginationControls from '../components/common/PaginationControls'

const UserManagementPage: FC = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const { data, pagination } = await adminService.getUsers(page, 20, selectedRole || undefined)
        setUsers(data)
        setTotalPages(pagination.pages ?? 1)
      } catch {
        setError('Failed to load users.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [page, selectedRole, isAdmin])

  const handleRoleChange = async (userId: string, newRole: 'citizen' | 'moderator' | 'admin'): Promise<void> => {
    setIsUpdating(userId)
    try {
      await adminService.updateUserRole(userId, newRole)
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
      setSuccess('User role updated successfully.')
    } catch {
      setError('Failed to update user role.')
    } finally {
      setIsUpdating(null)
    }
  }

  if (user && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." fullScreen={false} />
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>User Management</h1>
        <p className="jc-subtitle">Manage users and assign roles (admin, moderator, citizen).</p>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}

        <div className="jc-card" style={{ marginBottom: '1rem' }}>
          <label htmlFor="role-filter" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Filter by Role
          </label>
          <select
            id="role-filter"
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value)
              setPage(1)
            }}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '100%',
              maxWidth: '300px',
            }}
          >
            <option value="">All Roles</option>
            <option value="citizen">Citizens</option>
            <option value="moderator">Moderators</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {!isLoading && users.length === 0 && (
          <div className="jc-card">
            <p style={{ textAlign: 'center', color: '#666' }}>No users found.</p>
          </div>
        )}

        {users.length > 0 && (
          <div className="jc-card">
            <table className="jc-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Current Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.name}</td>
                    <td>
                      <span className="jc-chip" style={{ textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => {
                          void handleRoleChange(u.id, e.target.value as 'citizen' | 'moderator' | 'admin')
                        }}
                        disabled={isUpdating === u.id || u.id === user?.id}
                        style={{
                          padding: '0.35rem',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          cursor: isUpdating === u.id ? 'not-allowed' : 'pointer',
                          opacity: isUpdating === u.id ? 0.6 : 1,
                        }}
                      >
                        <option value="citizen">Citizen</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />
        )}
      </section>
    </div>
  )
}

export default UserManagementPage
