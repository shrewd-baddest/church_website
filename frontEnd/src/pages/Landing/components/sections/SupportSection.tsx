import { useState } from 'react';
import DonationModal from '../DonationModal';

function SupportSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <section id="support" className="relative py-14 md:py-24 bg-blue-50 overflow-hidden">
      {/* Very faint gradient to give subtle depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-blue-100/60 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
        <p className="text-blue-500 font-bold tracking-widest uppercase text-xs mb-4">Make a Difference</p>
        <h3 className="text-2xl md:text-4xl font-extrabold mb-4 tracking-tight text-slate-900">
          Support the Growth of Our Community
        </h3>
        <p className="text-slate-500 mb-8 md:mb-10 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto">
          Your generous contributions help us continue our mission of serving the people of Kirinyaga through faith, education, and community outreach. Every donation makes a difference.
        </p>

        {/* Donate button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-10 py-3 md:py-4 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300 text-sm md:text-base"
        >
          Donate Now
        </button>
      </div>
      <DonationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}

export default SupportSection
