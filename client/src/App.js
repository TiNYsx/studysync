import { Users, BookOpen, Calendar, FileText, Plus, Search, TrendingUp, Award, LogOut, X, Moon, Sun } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

// Fetch wrapper to replace axios
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    console.error('API Error:', response.status, response.statusText, error);
    throw error;
  }

  return response.json();
};

// Login Component
const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const response = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onLogin(response.user);
    } catch (error) {
      setError(error.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          StudySync
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {isRegister ? 'Create your account' : 'Welcome back!'}
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-blue-600 ml-2 font-semibold hover:text-blue-700"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
  );
};

// Main App Component
const StudyGroupPlatform = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [studyGroups, setStudyGroups] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showBrowseGroups, setShowBrowseGroups] = useState(false);
  const [showNoteDetail, setShowNoteDetail] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showEditNote, setShowEditNote] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [filterGroup, setFilterGroup] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [allGroups, setAllGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const fetchData = useCallback(async (currentEmail) => {
    try {
      setLoading(true);
      
      const groupsRes = await apiCall('/groups/my-groups');
      setStudyGroups(groupsRes);
      
      const notesRes = await apiCall('/notes');
      setNotes(notesRes);
      
      const sessionsRes = await apiCall('/sessions');
      setSessions(sessionsRes);
      
      const progressRes = await apiCall('/progress/me');
      
      const updatedUser = {
        id: progressRes.user.id,
        name: progressRes.user.name,
        email: currentEmail || '', 
        points: progressRes.user.points
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchData(parsedUser.email);
    } else {
      setLoading(false);
    }
  }, [fetchData]);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (userData) => {
    setUser(userData);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setStudyGroups([]);
    setNotes([]);
    setSessions([]);
  };

  const handleCreateGroup = async (groupData) => {
    try {
      await apiCall('/groups', {
        method: 'POST',
        body: JSON.stringify(groupData)
      });
      setShowCreateGroup(false);
      fetchData();
    } catch (error) {
      alert(error.error || 'Failed to create group');
    }
  };

  const handleCreateNote = async (noteData) => {
    try {
      setActionLoading(true);
      
      await apiCall('/notes', {
        method: 'POST',
        body: JSON.stringify(noteData)
      });
      
      setShowCreateNote(false);
      fetchData();
      alert('Note uploaded successfully!');
    } catch (error) {
      alert(error.error || 'Failed to create note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSession = async (sessionData) => {
    try {
      await apiCall('/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });
      setShowCreateSession(false);
      fetchData();
    } catch (error) {
      alert(error.error || 'Failed to create session');
    }
  };

  const handleUpdateProgress = async (groupId, newProgress) => {
    try {
      await apiCall(`/groups/${groupId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ progress: newProgress })
      });
      fetchData();
    } catch (error) {
      alert(error.error || 'Failed to update progress');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await apiCall(`/groups/${groupId}/join`, { method: 'POST' });
      fetchData();
      setShowBrowseGroups(false);
      alert('Successfully joined the group!');
    } catch (error) {
      alert(error.error || 'Failed to join group');
    }
  };

  const fetchAllGroups = async () => {
    try {
      const res = await apiCall('/groups');
      setAllGroups(res);
    } catch (error) {
      console.error('Error fetching all groups:', error);
    }
  };

  const handleViewNote = async (noteId) => {
    try {
      const res = await apiCall(`/notes/${noteId}`);
      setSelectedNote(res);
      setShowNoteDetail(true);
    } catch (error) {
      alert('Failed to load note details');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setActionLoading(true);
      await apiCall(`/notes/${noteId}`, { method: 'DELETE' });
      setShowNoteDetail(false);
      setSelectedNote(null);
      fetchData();
      alert('Note deleted successfully!');
    } catch (error) {
      alert(error.error || 'Failed to delete note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditNote = async (noteId, noteData) => {
    try {
      setActionLoading(true);
      await apiCall(`/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify(noteData)
      });
      setShowEditNote(false);
      setShowNoteDetail(false);
      setSelectedNote(null);
      fetchData();
      alert('Note updated successfully!');
    } catch (error) {
      alert(error.error || 'Failed to update note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to leave "${groupName}"?`)) return;
    
    try {
      setActionLoading(true);
      await apiCall(`/groups/${groupId}/leave`, { method: 'POST' });
      fetchData();
      alert('Successfully left the group!');
    } catch (error) {
      alert(error.error || 'Failed to leave group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`)) return;
    
    try {
      setActionLoading(true);
      await apiCall(`/groups/${groupId}`, { method: 'DELETE' });
      fetchData();
      alert('Group deleted successfully!');
    } catch (error) {
      alert(error.error || 'Failed to delete group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      setActionLoading(true);
      await apiCall(`/sessions/${sessionId}/join`, { method: 'POST' });
      fetchData();
      alert('Successfully joined the session!');
    } catch (error) {
      alert(error.error || 'Failed to join session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      setActionLoading(true);
      await apiCall(`/sessions/${sessionId}`, { method: 'DELETE' });
      fetchData();
      alert('Session deleted successfully!');
    } catch (error) {
      alert(error.error || 'Failed to delete session');
    } finally {
      setActionLoading(false);
    }
  };

  const CreateGroupModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      subject: '',
      description: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreateGroup(formData);
      setFormData({ name: '', subject: '', description: '' });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Create Study Group</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                placeholder="e.g., Data Structures" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                placeholder="e.g., Computer Science" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                rows="3" 
                placeholder="What will you study together?"
                required
              ></textarea>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CreateNoteModal = () => {
    const [formData, setFormData] = useState({
      title: '',
      content: '',
      group: '',
      tags: []
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreateNote(formData);
      setFormData({ title: '', content: '', group: '', tags: [] });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Upload Note</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" 
                placeholder="Note title" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Study Group *</label>
              <select 
                value={formData.group}
                onChange={(e) => setFormData({...formData, group: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select a group</option>
                {studyGroups.map(group => (
                  <option key={group._id} value={group._id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea 
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" 
                rows="4" 
                placeholder="Write your notes here..."
                required
              ></textarea>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => {
                  setShowCreateNote(false);
                  setFormData({ title: '', content: '', group: '', tags: [] });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {actionLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CreateSessionModal = () => {
    const [formData, setFormData] = useState({
      group: '',
      topic: '',
      date: '',
      time: '',
      duration: '',
      location: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreateSession(formData);
      setFormData({ group: '', topic: '', date: '', time: '', duration: '', location: '' });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Schedule Study Session</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Study Group *</label>
              <select 
                value={formData.group}
                onChange={(e) => setFormData({...formData, group: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select a group</option>
                {studyGroups.map(group => (
                  <option key={group._id} value={group._id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
              <input 
                type="text" 
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                placeholder="e.g., Dynamic Programming" 
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input 
                  type="time" 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
              <input 
                type="text" 
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                placeholder="e.g., 2h" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                placeholder="e.g., Library Room 3 or Zoom link" 
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowCreateSession(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Schedule
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const BrowseGroupsModal = () => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredGroups = allGroups.filter(group => {
      const isNotMember = !studyGroups.some(myGroup => myGroup._id === group._id);
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           group.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return isNotMember && matchesSearch;
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Browse Study Groups</h3>
            <button 
              onClick={() => setShowBrowseGroups(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by group name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>{searchQuery ? 'No groups found matching your search.' : 'No new groups available to join.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroups.map(group => (
                <div key={group._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800">{group.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.members.length} members
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{group.subject}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-gray-700 font-semibold">{group.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full"
                          style={{ width: `${group.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinGroup(group._id)}
                      className="ml-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const NoteDetailModal = () => {
    const isOwner = selectedNote.author?._id === user?.id || selectedNote.author?.id === user?.id;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800">{selectedNote.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {selectedNote.author?.name}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {selectedNote.group?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedNote.createdAt).toLocaleDateString()}
                </span>
                <span className="text-gray-500">{selectedNote.views} views</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowNoteDetail(false);
                setSelectedNote(null);
              }}
              className="text-gray-500 hover:text-gray-700 ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-4">
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-6 text-gray-800 whitespace-pre-wrap">
                {selectedNote.content}
              </div>
            </div>
          </div>

          {selectedNote.tags && selectedNote.tags.length > 0 && (
            <div className="mt-6 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Tags:</span>
              {selectedNote.tags.map((tag, index) => (
                <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      setShowNoteDetail(false);
                      setShowEditNote(true);
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteNote(selectedNote._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => {
                setShowNoteDetail(false);
                setSelectedNote(null);
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditNoteModal = () => {
    const [formData, setFormData] = useState({
      title: selectedNote.title,
      content: selectedNote.content,
      tags: selectedNote.tags || []
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleEditNote(selectedNote._id, formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Note</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea 
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                rows="6" 
                required
              ></textarea>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowEditNote(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ProfileModal = () => {
    const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      alert('Profile update will be available in the next update!');
      setShowProfile(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Profile Settings</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Your Stats</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>Total Points: <span className="font-bold">{user?.points || 0}</span></p>
                <p>Study Groups: <span className="font-bold">{studyGroups.length}</span></p>
                <p>Notes Shared: <span className="font-bold">{notes.filter(n => n.author?._id === user?.id).length}</span></p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowProfile(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button 
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Study Groups</p>
              <p className="text-3xl font-bold mt-1">{studyGroups.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Notes</p>
              <p className="text-3xl font-bold mt-1">{notes.length}</p>
            </div>
            <FileText className="w-12 h-12 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Study Points</p>
              <p className="text-3xl font-bold mt-1">{user.points}</p>
            </div>
            <Award className="w-12 h-12 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Upcoming</p>
              <p className="text-3xl font-bold mt-1">{sessions.length}</p>
            </div>
            <Calendar className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            My Study Groups
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                fetchAllGroups();
                setShowBrowseGroups(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              Browse Groups
            </button>
            <button 
              onClick={() => setShowCreateGroup(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </div>
        </div>
        {studyGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>You haven't joined any study groups yet.</p>
            <button 
              onClick={() => setShowCreateGroup(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create your first group
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {studyGroups.map(group => (
              <div key={group._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.members.length} members
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{group.subject}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-semibold">{group.progress}%</span>
                          {(group.creator && group.creator._id === user?.id) ? (
                            <button
                              onClick={() => {
                                const newProgress = Math.min(group.progress + 10, 100);
                                handleUpdateProgress(group._id, newProgress);
                              }}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                              title="Increase progress by 10%"
                            >
                              +10%
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${group.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {(group.creator && group.creator._id === user?.id) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group._id, group.name);
                      }}
                      disabled={actionLoading}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Delete Group
                    </button>
                  ) : null}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveGroup(group._id, group.name);
                    }}
                    disabled={actionLoading}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition disabled:opacity-50"
                  >
                    Leave Group
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            Upcoming Study Sessions
          </h2>
          <button 
            onClick={() => setShowCreateSession(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Schedule Session
          </button>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No upcoming study sessions scheduled.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session._id} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{session.topic} @{session.location}</h3>
                    <p className="text-sm text-gray-600 mt-1">{session.group?.name}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(session.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">{session.time} ({session.duration})</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleJoinSession(session._id)}
                        disabled={actionLoading}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded disabled:opacity-50"
                      >
                        RSVP
                      </button>
                      {(session.creator && session.creator._id === user?.id) ? (
                        <button
                          onClick={() => handleDeleteSession(session._id)}
                          disabled={actionLoading}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded disabled:opacity-50 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const NotesView = () => {
    let filteredNotes = notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           note.group?.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    if (filterGroup !== 'all') {
      filteredNotes = filteredNotes.filter(note => note.group?._id === filterGroup);
    }

    if (sortBy === 'recent') {
      filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'popular') {
      filteredNotes.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'oldest') {
      filteredNotes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-600" />
              Shared Notes
            </h2>
            <button 
              onClick={() => setShowCreateNote(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Upload Note
            </button>
          </div>
          
          <div className="mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Groups</option>
                {studyGroups.map(group => (
                  <option key={group._id} value={group._id}>{group.name}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>{searchTerm ? 'No notes found matching your search.' : 'No notes available yet.'}</p>
              {!searchTerm && (
                <button 
                  onClick={() => setShowCreateNote(true)}
                  className="mt-4 text-green-600 hover:text-green-700 font-semibold"
                >
                  Upload your first note
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => (
                <div 
                  key={note._id} 
                  onClick={() => handleViewNote(note._id)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer hover:border-green-500"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-lg p-3">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 hover:text-green-600">{note.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{note.group?.name}</p>
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>by {note.author?.name}</span>
                        <span>{note.views} views</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProgressView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-600" />
          My Learning Progress
        </h2>
        
        {studyGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Join study groups to track your progress!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studyGroups.map(group => (
                <div key={group._id} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 text-lg mb-4">{group.name}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Overall Progress</span>
                        <span className="text-gray-800 font-semibold">{group.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all"
                          style={{ width: `${group.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Members</p>
                        <p className="text-xl font-bold text-blue-600 mt-1">
                          {group.members.length}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Subject</p>
                        <p className="text-sm font-bold text-green-600 mt-1">
                          {group.subject}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Achievement Status</h3>
              <p className="text-purple-100">You've earned {user.points} study points! Keep sharing notes and participating in sessions.</p>
              <div className="flex items-center gap-2 mt-4">
                <Award className="w-8 h-8" />
                {user.points >= 100 && <Award className="w-8 h-8" />}
                {user.points >= 500 && <Award className="w-8 h-8" />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      <header className={`shadow-md sticky top-0 z-40 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>StudySync</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Collaborative Learning Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{user?.name || 'User'}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user?.points || 0} points</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`ml-2 p-2 rounded-lg transition ${darkMode ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className={`ml-2 p-2 rounded-lg transition ${darkMode ? 'text-gray-300 hover:text-red-400 hover:bg-gray-700' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'}`}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className={`ml-2 p-2 rounded-lg transition ${darkMode ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
                title="Profile Settings"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className={`shadow-sm border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
                currentView === 'dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('notes')}
              className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
                currentView === 'notes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Notes
            </button>
            <button
              onClick={() => setCurrentView('progress')}
              className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
                currentView === 'progress'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Progress
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'notes' && <NotesView />}
        {currentView === 'progress' && <ProgressView />}
      </main>

      {showCreateGroup && <CreateGroupModal />}
      {showCreateNote && <CreateNoteModal />}
      {showCreateSession && <CreateSessionModal />}
      {showBrowseGroups && <BrowseGroupsModal />}
      {showNoteDetail && selectedNote && <NoteDetailModal />}
      {showEditNote && selectedNote && <EditNoteModal />}
      {showProfile && <ProfileModal />}

      <footer className={`border-t mt-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className="text-sm">StudySync - Collaborative Study Group Platform</p>
            <p className="text-xs mt-1">CS 319 - COZY Group</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudyGroupPlatform;