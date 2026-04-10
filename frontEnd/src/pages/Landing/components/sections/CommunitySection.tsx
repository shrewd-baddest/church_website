import { Link } from 'react-router-dom';

function CommunitySection() {
  return (
    <section className="bg-white py-8 md:py-16 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8" id='explore'>
        <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-8 md:mb-12">Explore Our Community</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {/* Jumuiya */}
          <Link to="/jumuiya" className="group bg-gray-50 p-4 md:p-6 rounded-xl shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300 border border-transparent hover:border-gray-100 flex flex-col items-center text-center block focus:outline-none">
            <div className="text-blue-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" className="bi bi-grid" viewBox="0 0 16 16">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Jumuiya</h3>
            <p className="text-gray-600 text-sm">Join our local parish groups and connect with fellow community members in faith and fellowship.</p>
          </Link>

          {/* Activities */}
          <Link to="/devotions" className="group bg-gray-50 p-4 md:p-6 rounded-xl shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300 border border-transparent hover:border-gray-100 flex flex-col items-center text-center block focus:outline-none">
            <div className="text-blue-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" className="bi bi-activity" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2"/>
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Activities</h3>
            <p className="text-gray-600 text-sm">Participate in various church activities including prayer meeting and community events.</p>
          </Link>

          {/* Projects */}
          <a href="#projects" className="group bg-gray-50 p-4 md:p-6 rounded-xl shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300 border border-transparent hover:border-gray-100 flex flex-col items-center text-center block focus:outline-none">
            <div className="text-blue-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" className="bi bi-collection" viewBox="0 0 16 16">
                <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6v7zm6.258-6.437a.5.5 0 0 0-.507.013L1.5 7.5V6a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v1.173l-4.096-2.52a.5.5 0 0 0-.507-.013zM1.5 8.646l4.096 2.52a.5.5 0 0 0 .507.013L14.5 8.646V12a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V8.646z"/>
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Projects</h3>
            <p className="text-gray-600 text-sm">Discover our ongoing community development projects and see how you can contribute.</p>
          </a>

          {/* Officials */}
          <Link to="/officials" className="group bg-gray-50 p-4 md:p-6 rounded-xl shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300 border border-transparent hover:border-gray-100 flex flex-col items-center text-center block focus:outline-none">
            <div className="text-blue-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" className="bi bi-file-person-fill" viewBox="0 0 16 16">
                <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2m-1 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-3 4c2.623 0 4.146.826 5 1.755V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1.245C3.854 11.825 5.377 11 8 11"/>
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Officials</h3>
            <p className="text-gray-600 text-sm">Meet our dedicated parish leaders who guide our community in faith and service.</p>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CommunitySection
