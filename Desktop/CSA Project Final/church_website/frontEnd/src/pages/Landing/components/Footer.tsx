function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className='first_footer'>
            <h4 className="text-white font-semibold text-lg mb-4">CSA Kirinyaga</h4>
            <p className="text-sm">A vibrant Catholic community dedicated to serving the people of Kirinyaga through faith, education, and community outreach.</p>
          </div>
          
          {/* Quick Links */}
          <div className='second_footer'>
            <h4 className="text-white font-semibold text-lg mb-4">About CSA</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="hover:text-white transition-colors">Our Mission</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Our Values</a></li>
              <li><a href="#explore" className="hover:text-white transition-colors">Our History</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div className='third_footer'>
            <h4 className="text-white font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Prayers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Daily Readings</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Saints Info</a></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className='fourth_footer'>
            <h4 className="text-white font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>St. Thomas Aquinas Parish</li>
              <li>Kirinyaga, Kenya</li>
              <li className="pt-2">Email: info@csakirinyaga.org</li>
              <li>Phone: +254 700 000000</li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {currentYear} CSA Kirinyaga. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
