/**
 * Jumuiya Section Component
 * 
 * This component displays information about different Jumuiya groups
 */

import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';

interface Jumuiya {
  id: number;
  name: string;
  location: string;
  leader: string;
  members_count: number;
  description: string;
  meeting_day: string;
}

const JumuiyaSection: React.FC = () => {
  const [jumuiyas, setJumuiyas] = useState<Jumuiya[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJumuiyas();
  }, []);

  const loadJumuiyas = async () => {
    try {
      console.log('Fetching jumuiya...');
      const data = await apiService.getJumuiya();
      console.log('Jumuiya data:', data);
      setJumuiyas(data);
    } catch (err) {
      console.error('Error loading jumuiyas:', err);
      setError('Failed to load jumuiya groups');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div id="jumuiya" className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-gray-500">Loading Jumuiya groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="jumuiya" className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="jumuiya" className="py-8 md:py-16 bg-white">
      <div className="container mx-auto px-3 md:px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 md:mb-4">Jumuiya Groups</h2>
        <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
          Our community groups - connected in faith and fellowship
        </p>
        
        {jumuiyas.length === 0 ? (
          <p className="text-center text-gray-500">No Jumuiya groups found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {jumuiyas.map((jumuiya) => (
              <div key={jumuiya.id} className="bg-blue-50 rounded-lg shadow-md p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-blue-800 mb-2">{jumuiya.name}</h3>
                {jumuiya.location && (
                  <p className="text-gray-600 text-xs md:text-sm mb-1">📍 {jumuiya.location}</p>
                )}
                {jumuiya.leader && (
                  <p className="text-gray-600 text-xs md:text-sm mb-1">👤 Leader: {jumuiya.leader}</p>
                )}
                {jumuiya.members_count && (
                  <p className="text-gray-600 text-xs md:text-sm mb-2">👥 {jumuiya.members_count} members</p>
                )}
                {jumuiya.meeting_day && (
                  <p className="text-gray-600 text-xs md:text-sm mb-2">📅 Meets: {jumuiya.meeting_day}</p>
                )}
                {jumuiya.description && (
                  <p className="text-gray-700 text-xs md:text-sm">{jumuiya.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JumuiyaSection;
