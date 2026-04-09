import { useState } from 'react';
import DonationModal from '../DonationModal';

function SupportSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <section id="support" className='py-8 md:py-16 bg-blue-700 text-white'>
      <div className='max-w-4xl mx-auto px-3 md:px-4 text-center'>
        <h3 className='text-2xl md:text-3xl font-bold mb-3 md:mb-4'>Support the Growth of Our Community</h3>
        <p className='text-blue-100 mb-6 md:mb-8 text-sm md:text-lg'>Your generous contributions help us continue our mission of serving the people of Kirinyaga through faith, education, and community outreach. Every donation makes a difference.</p>

        {/* Donate button */}
        <div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className='bg-white text-blue-700 hover:bg-gray-100 px-6 md:px-8 py-2 md:py-3 rounded-full font-bold shadow-lg transition-colors text-sm md:text-base'
          >
            Donate Now
          </button>
        </div>
      </div>
      <DonationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}

export default SupportSection
