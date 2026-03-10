/**
 * Officials Section Component
 * 
 * This component displays information about church officials and leadership
 */

import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';

interface Official {
  id: number;
  name: string;
  category: string;
  position: string;
  photo: string;
  phone: string;
  email: string;
}

const OfficialsSection: React.FC = () => {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOfficials();
  }, []);

  const loadOfficials = async () => {
    try {
      console.log('Fetching officials...');
      const data = await apiService.getOfficials();
      console.log('Officials data:', data);
      setOfficials(data);
    } catch (err) {
      console.error('Error loading officials:', err);
      setError('Failed to load officials');
    } finally {
      setLoading(false);
    }
  };

  const groupedOfficials = officials.reduce((acc, official) => {
    const category = official.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(official);
    return acc;
  }, {} as Record<string, Official[]>);

  if (loading) {
    return (
      <div id="officials" className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-gray-500">Loading officials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="officials" className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="officials" className="py-8 md:py-16 bg-gray-50">
      <div className="container mx-auto px-3 md:px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 md:mb-4">Church Officials</h2>
        <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
          Meet our church leadership team
        </p>
        
        {officials.length === 0 ? (
          <p className="text-center text-gray-500">No officials found.</p>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {Object.entries(groupedOfficials).map(([category, categoryOfficials]) => (
              <div key={category}>
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-blue-800">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {categoryOfficials.map((official) => (
                    <div key={official.id} className="bg-white rounded-lg shadow-md p-4 md:p-6">
                      <div className="flex items-center mb-3">
                        {official.photo ? (
                          <img 
                            src={official.photo} 
                            alt={official.name}
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover mr-3 md:mr-4"
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-100 flex items-center justify-center mr-3 md:mr-4">
                            <span className="text-xl md:text-2xl text-blue-600">{official.name.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-gray-800">{official.name}</h4>
                          <p className="text-blue-600 font-medium text-sm md:text-base">{official.position}</p>
                        </div>
                      </div>
                      {official.phone && (
                        <p className="text-gray-600 text-xs md:text-sm">📞 {official.phone}</p>
                      )}
                      {official.email && (
                        <p className="text-gray-600 text-xs md:text-sm">✉️ {official.email}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficialsSection;
