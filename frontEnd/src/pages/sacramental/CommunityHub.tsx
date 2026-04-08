import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CommunityHub: React.FC = () => {
  const { moduleSlug } = useParams<{ moduleSlug?: string }>();
  const navigate = useNavigate();

  // Listen for navigation messages from the Hub iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log(event.data);
      // Hub messenger signals a user clicked a module card
      if (event.data?.type === 'HUB_NAVIGATE') {
        const slug = event.data.slug;
        navigate(`/community/${slug}`);
      }
      // Hub messenger signals a specific module page was loaded (e.g. choir)
      if (event.data?.type === 'HUB_MODULE_LOADED') {
        const slug = event.data.slug;
        console.log('Community Hub Integrated Module:', slug || 'Grid');
      }

      // Hub messenger signals a JS error inside the iframe
      if (event.data?.type === 'HUB_ERROR') {
        process.env.NODE_ENV === 'development' && console.error('Community Hub Iframe ERROR:', event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);
  console.log(moduleSlug);
  const iframeSrc = moduleSlug ? `/community-view/${moduleSlug}` : '/community-view/';

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: '80vh' }}>
          <iframe 
            src={iframeSrc}
            className="w-full h-full border-none"
            title="Community"
          />
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;
