'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/app/lib/store';
import { supabase } from '@/app/lib/supabase';

export default function AdvisorHub() {
  const { user, addNotification } = useStore();
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdvisor, setNewAdvisor] = useState({
    name: '',
    role: '',
    expertise: '',
    availability: '',
    contact: '',
  });

  useEffect(() => {
    loadAdvisors();
  }, []);

  const loadAdvisors = async () => {
    const { data } = await supabase
      .from('advisors')
      .select('*')
      .order('created_at', { ascending: false });

    setAdvisors(data || []);
  };

  const filteredAdvisors = advisors.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.expertise?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addAdvisor = async () => {
    if (!newAdvisor.name || !newAdvisor.role) {
      alert('Please fill name and role');
      return;
    }

    const { data } = await supabase
      .from('advisors')
      .insert([{ ...newAdvisor, user_id: user?.id }])
      .select();

    if (data) {
      setAdvisors([...data, ...advisors]);
      setNewAdvisor({ name: '', role: '', expertise: '', availability: '', contact: '' });
      setShowAddForm(false);
      addNotification({ type: 'success', message: 'Advisor added!' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text">👨‍🏫 Board of Advisors</h2>
          <p className="text-gray-400 text-sm">Connect with expert mentors & teachers</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          {showAddForm ? '✕ Cancel' : '+ Add Advisor'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass p-6 rounded-lg border border-cyan-500/30">
          <h3 className="text-xl font-bold mb-4">Add New Advisor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Name *"
              value={newAdvisor.name}
              onChange={(e) => setNewAdvisor({ ...newAdvisor, name: e.target.value })}
            />
            <input
              placeholder="Role/Position *"
              value={newAdvisor.role}
              onChange={(e) => setNewAdvisor({ ...newAdvisor, role: e.target.value })}
            />
            <input
              placeholder="Expertise (e.g., JEE Math)"
              value={newAdvisor.expertise}
              onChange={(e) => setNewAdvisor({ ...newAdvisor, expertise: e.target.value })}
            />
            <input
              placeholder="Availability"
              value={newAdvisor.availability}
              onChange={(e) => setNewAdvisor({ ...newAdvisor, availability: e.target.value })}
            />
            <input
              placeholder="Contact (email/phone)"
              value={newAdvisor.contact}
              onChange={(e) => setNewAdvisor({ ...newAdvisor, contact: e.target.value })}
              className="md:col-span-2"
            />
          </div>
          <button onClick={addAdvisor} className="btn btn-primary mt-4">
            Save Advisor
          </button>
        </div>
      )}

      <input
        placeholder="🔍 Search by name, expertise, or role..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAdvisors.map((advisor) => (
          <div
            key={advisor.id}
            className="glass p-5 rounded-lg border border-cyan-500/20 hover:border-cyan-500/50 transition hover:scale-105"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-bold">
                {advisor.name?.[0] || 'A'}
              </div>
              <div>
                <h3 className="font-bold text-lg">{advisor.name}</h3>
                <p className="text-sm text-gray-400">{advisor.role}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {advisor.expertise && (
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">📖</span>
                  <span className="text-gray-300">{advisor.expertise}</span>
                </div>
              )}
              {advisor.availability && (
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">🕐</span>
                  <span className="text-gray-300">{advisor.availability}</span>
                </div>
              )}
              {advisor.contact && (
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">📧</span>
                  <span className="text-gray-300 truncate">{advisor.contact}</span>
                </div>
              )}
            </div>

            <a
              href={`mailto:${advisor.contact}`}
              className="w-full mt-4 btn btn-primary text-sm block text-center"
            >
              Contact Advisor
            </a>
          </div>
        ))}
      </div>

      {filteredAdvisors.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p>No advisors found. Add new advisors or try a different search.</p>
        </div>
      )}
    </div>
  );
}
