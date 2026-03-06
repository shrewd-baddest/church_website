/**
 * Projects Section Component
 * 
 * This component displays information about ongoing and past church projects
 */

import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';

interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  image: string;
}

const ProjectsSection: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      console.log('Fetching projects...');
      const data = await apiService.getProjects();
      console.log('Projects data:', data);
      setProjects(data);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div id="projects" className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="projects" className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="projects" className="py-8 md:py-16 bg-white">
      <div className="container mx-auto px-3 md:px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 md:mb-4">Our Projects</h2>
        <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
          Supporting our community through various initiatives
        </p>
        
        {projects.length === 0 ? (
          <p className="text-center text-gray-500">No projects found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-green-50 rounded-lg shadow-md p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                  <h3 className="text-lg md:text-xl font-bold text-green-800">{project.title}</h3>
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${project.status === 'completed' ? 'bg-green-200 text-green-800' : project.status === 'ongoing' ? 'bg-blue-200 text-blue-800' : project.status === 'planned' ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-800'}`}>
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-gray-700 mb-3 text-sm md:text-base">{project.description}</p>
                )}
                <div className="text-xs md:text-sm text-gray-600">
                  {project.start_date && (
                    <p>📅 Started: {new Date(project.start_date).toLocaleDateString()}</p>
                  )}
                  {project.end_date && (
                    <p>🏁 Target: {new Date(project.end_date).toLocaleDateString()}</p>
                  )}
                  {project.budget && (
                    <p>💰 Budget: KES {project.budget.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsSection;
