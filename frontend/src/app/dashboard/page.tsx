'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface Email {
  id: string
  toEmail: string
  subject: string
  scheduledAt: string
  status: string
  sentAt?: string
  sender: {
    fromEmail: string
    fromName: string
  }
}

interface Sender {
  id: number
  fromEmail: string
  fromName: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([])
  const [sentEmails, setSentEmails] = useState<Email[]>([])
  const [senders, setSenders] = useState<Sender[]>([])
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled')
  const [showCompose, setShowCompose] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    loadEmails()
    loadSenders()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
        credentials: 'include'
      })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const loadEmails = async () => {
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/emails/scheduled`, { credentials: 'include' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/emails/sent`, { credentials: 'include' })
      ])

      if (scheduledRes.ok) {
        const scheduledData = await scheduledRes.json()
        setScheduledEmails(scheduledData)
      }

      if (sentRes.ok) {
        const sentData = await sentRes.json()
        setSentEmails(sentData)
      }
    } catch (error) {
      console.error('Failed to load emails:', error)
    }
  }

  const loadSenders = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/emails/senders`, { credentials: 'include' })
      if (res.ok) {
        const sendersData = await res.json()
        setSenders(sendersData)
      }
    } catch (error) {
      console.error('Failed to load senders:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">ReachInbox</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Email Dashboard</h2>
            <button
              onClick={() => setShowCompose(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Compose New Email
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scheduled'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Scheduled Emails ({scheduledEmails.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sent Emails ({sentEmails.length})
              </button>
            </nav>
          </div>

          {/* Email Lists */}
          {activeTab === 'scheduled' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {scheduledEmails.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No scheduled emails</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {scheduledEmails.map((email) => (
                    <li key={email.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{email.subject}</p>
                          <p className="text-sm text-gray-500">To: {email.toEmail}</p>
                          <p className="text-sm text-gray-500">
                            From: {email.sender.fromName} ({email.sender.fromEmail})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Scheduled: {new Date(email.scheduledAt).toLocaleString()}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {email.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {sentEmails.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No sent emails</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {sentEmails.map((email) => (
                    <li key={email.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{email.subject}</p>
                          <p className="text-sm text-gray-500">To: {email.toEmail}</p>
                          <p className="text-sm text-gray-500">
                            From: {email.sender.fromName} ({email.sender.fromEmail})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Sent: {email.sentAt ? new Date(email.sentAt).toLocaleString() : 'N/A'}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {email.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          senders={senders}
          onClose={() => setShowCompose(false)}
          onEmailScheduled={loadEmails}
        />
      )}
    </div>
  )
}

interface ComposeModalProps {
  senders: Sender[]
  onClose: () => void
  onEmailScheduled: () => void
}

function ComposeModal({ senders, onClose, onEmailScheduled }: ComposeModalProps) {
  const [formData, setFormData] = useState({
    senderId: '',
    subject: '',
    body: '',
    startTime: '',
    delayMs: '2000',
    hourlyLimit: '200'
  })
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailCount, setEmailCount] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCsvFile(file)
      // Simple email count estimation
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        setEmailCount(lines.length - 1) // Subtract header
      }
      reader.readAsText(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) {
      alert('Please select a CSV file')
      return
    }
    setLoading(true)

    const formDataToSend = new FormData()
    formDataToSend.append('csvFile', csvFile)
    formDataToSend.append('senderId', formData.senderId)
    formDataToSend.append('subject', formData.subject)
    formDataToSend.append('body', formData.body)
    formDataToSend.append('startTime', formData.startTime)
    formDataToSend.append('delayMs', formData.delayMs)
    formDataToSend.append('hourlyLimit', formData.hourlyLimit)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/emails/schedule`, {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      })

      if (res.ok) {
        onEmailScheduled()
        onClose()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to schedule emails')
      }
    } catch (error) {
      console.error('Failed to schedule emails:', error)
      alert('Failed to schedule emails')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compose New Email</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sender</label>
              <select
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.senderId}
                onChange={(e) => setFormData({ ...formData, senderId: e.target.value })}
              >
                <option value="">Select a sender</option>
                {senders.map((sender) => (
                  <option key={sender.id} value={sender.id}>
                    {sender.fromName} ({sender.fromEmail})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CSV File</label>
              <input
                type="file"
                accept=".csv"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                onChange={handleFileChange}
              />
              {emailCount > 0 && (
                <p className="mt-1 text-sm text-gray-600">{emailCount} email addresses detected</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Body</label>
              <textarea
                required
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="datetime-local"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Delay Between Emails (ms)</label>
              <input
                type="number"
                required
                min="1000"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.delayMs}
                onChange={(e) => setFormData({ ...formData, delayMs: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hourly Limit</label>
              <input
                type="number"
                required
                min="1"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.hourlyLimit}
                onChange={(e) => setFormData({ ...formData, hourlyLimit: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule Emails'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
