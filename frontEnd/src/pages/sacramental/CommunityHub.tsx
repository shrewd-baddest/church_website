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
      // Listen for resize messages
      if (event.data?.type === 'HUB_RESIZE') {
        const iframe = document.getElementById('community-iframe');
        if (iframe) {
          iframe.style.height = `${Math.max(event.data.height, 600)}px`;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const [isLoading, setIsLoading] = React.useState(true);
  const iframeSrc = moduleSlug ? `/community-view/${moduleSlug}` : '/community-view/';

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="w-full bg-gray-50 pt-6 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white p-8">
               <div className="animate-pulse space-y-8">
                  <div className="h-10 bg-gray-100 rounded-lg w-1/3"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-64 bg-gray-50 rounded-2xl"></div>
                    <div className="h-64 bg-gray-50 rounded-2xl"></div>
                    <div className="h-64 bg-gray-50 rounded-2xl"></div>
                  </div>
               </div>
            </div>
          )}
          <iframe 
            id="community-iframe"
            src={iframeSrc}
            onLoad={handleIframeLoad}
            className="w-full border-none"
            style={{ 
               minHeight: '400px', 
               width: '100%', 
               transition: 'opacity 0.5s ease-in-out',
               opacity: isLoading ? 0 : 1 
            }}
            title="Community"
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;
