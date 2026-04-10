import React from 'react';

const CommunityHub: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: '80vh' }}>
          <iframe 
            src="http://localhost:3001/community-hub" 
            className="w-full h-full border-none"
            title="Community Hub"
          />
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;
