/**
 * Activities Section Component
 * 
 * This component displays information about church activities and events
 */

import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';

interface Activity {
  id: number;
  title: string;
  description: string;
  activity_date: string;
  time: string;
  location: string;
  category: string;
}

const ActivitiesSection: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      console.log('Fetching activities...');
      const data = await apiService.getActivities();
      console.log('Activities data:', data);
      setActivities(data);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const groupedActivities = activities.reduce((acc, activity) => {
    const category = activity.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  if (loading) {
    return (
      <div id="activities" className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-gray-500">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="activities" className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="activities" className="py-8 md:py-16 bg-gray-50">
      <div className="container mx-auto px-3 md:px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 md:mb-4">Church Activities</h2>
        <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
          Join us in our various activities and events
        </p>
        
        {activities.length === 0 ? (
          <p className="text-center text-gray-500">No activities found.</p>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {Object.entries(groupedActivities).map(([category, categoryActivities]) => (
              <div key={category}>
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-purple-800">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {categoryActivities.map((activity) => (
                    <div key={activity.id} className="bg-white rounded-lg shadow-md p-4 md:p-6">
                      <h4 className="text-base md:text-lg font-bold text-gray-800 mb-2">{activity.title}</h4>
                      {activity.description && (
                        <p className="text-gray-600 text-xs md:text-sm mb-3">{activity.description}</p>
                      )}
                      <div className="text-xs md:text-sm text-gray-500">
                        {activity.activity_date && (
                          <p className="mb-1">📅 {new Date(activity.activity_date).toLocaleDateString()}</p>
                        )}
                        {activity.time && (
                          <p className="mb-1">🕒 {activity.time}</p>
                        )}
                        {activity.location && (
                          <p>📍 {activity.location}</p>
                        )}
                      </div>
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

export default ActivitiesSection;
