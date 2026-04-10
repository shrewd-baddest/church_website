function AboutSection() {
  return (
    <section
      id="about"
      className="max-w-7xl mx-auto px-3 py-8 md:px-6 md:py-16 lg:px-8"
    >
      <div className="text-center max-w-4xl mx-auto mb-8 md:mb-16">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-700 mb-4 md:mb-6">
          Welcome to CSA Kirinyaga University
        </h1>
        <p className="text-gray-600 text-sm md:text-lg leading-relaxed">
          St. Thomas Aquinas welcomes you to our Catholic movement which is
          aimed at spreading the Gospel and enriching Catholic faith to members
          through prayers and upholding Catholic principles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-12">
        {/* Mission */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
          <div className="text-blue-600 mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="currentColor"
              className="bi bi-journal"
              viewBox="0 0 16 16"
            >
              <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2" />
              <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z" />
            </svg>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
            Our Mission
          </h3>
          <p className="text-gray-600 text-sm md:text-base">
            Achiving grater heights spiritually in Catholic faith through prayers as an instrument of hope to human
          </p>
        </div>

        {/* Vision */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
          <div className="text-blue-600 mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="currentColor"
              className="bi bi-send"
              viewBox="0 0 16 16"
            >
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
            </svg>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
            Our Vision
          </h3>
          <p className="text-gray-600 text-sm md:text-base">
            To produce spiritually and morally upright christians who will spread the Gospel throughout the world
          </p>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
