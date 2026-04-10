import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function Dashboard() {

const {user} = useAuth();


  return (
    <div className="container mx-auto p-6 pb-32">
      <header className="mb-10 mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Welcome Back, {user?.name}
        </h1>
        <p className="text-lg text-gray-600 mt-2 max-w-2xl">
          Your spiritual journey continues today. Explore readings, daily challenges, and prayers below.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Bible Readings */}
        <Link
          to="readings"
          className="group flex flex-col sm:flex-row items-center bg-gradient-to-br from-orange-400 to-orange-200 hover:shadow-xl transition-all duration-300 rounded-2xl p-6 shadow-md border border-orange-100"
        >
          <div className="sm:w-1/3 w-full flex justify-center mb-6 sm:mb-0">
            <img
              src="../src/assets/images/hory-bible.png"
              alt="Bible Readings"
              className="w-40 sm:w-48 object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="sm:w-2/3 w-full text-center sm:text-left sm:pl-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Bible Readings</h2>
            <p className="text-base text-gray-800 opacity-90 mb-4 italic">
              "The Lord is my shepherd; I shall not want..."
            </p>
            <span className="inline-block bg-white text-orange-700 font-bold px-6 py-2.5 rounded-xl shadow-sm group-hover:bg-orange-50 transition-colors">
              Open Scroll
            </span>
          </div>
        </Link>

        {/* Daily Challenge */}
        <Link
          to="challenge"
          className="group flex flex-col sm:flex-row items-center bg-gradient-to-br from-blue-500 to-blue-300 hover:shadow-xl transition-all duration-300 rounded-2xl p-6 shadow-md border border-blue-100"
        >
          <div className="sm:w-1/3 w-full flex justify-center mb-6 sm:mb-0">
            <img
              src="../src/assets/images/challange.png"
              alt="Daily Challenge"
              className="w-40 sm:w-48 object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="sm:w-2/3 w-full text-center sm:text-left sm:pl-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Daily Challenge</h3>
            <p className="text-base text-gray-800 opacity-90 mb-4">
              What color vestments does the priest wear during Ordinary Time?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-xl font-semibold shadow-inner border border-blue-200 flex-1 text-center">Green</div>
              <div className="bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold shadow-sm border border-blue-100 flex-1 text-center">Purple</div>
            </div>
          </div>
        </Link>

        {/* Rosary */}
        <Link
          to="rosary"
          className="group flex flex-col sm:flex-row items-center bg-gradient-to-br from-purple-200 to-purple-100 hover:shadow-xl transition-all duration-300 rounded-2xl p-6 shadow-md border border-purple-200"
        >
          <div className="sm:w-1/3 w-full flex justify-center mb-6 sm:mb-0">
            <img
              src="../src/assets/images/rosary.png"
              alt="Rosary"
              className="w-40 sm:w-48 object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="sm:w-2/3 w-full text-center sm:text-left sm:pl-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Mysteries</h3>
            <ul className="space-y-1 text-base text-gray-700 inline-block text-left">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> The Annunciation</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> The Visitation</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> The Nativity</li>
            </ul>
          </div>
        </Link>

        {/* Liturgy */}
        <Link
          to="liturgy"
          className="group flex flex-col sm:flex-row items-center bg-gradient-to-br from-purple-600 to-indigo-800 hover:shadow-xl transition-all duration-300 text-white rounded-2xl p-6 shadow-md"
        >
          <div className="sm:w-2/3 w-full text-center sm:text-left order-2 sm:order-1">
            <h3 className="text-2xl font-bold mb-3">Order of the Mass</h3>
            <p className="text-base text-purple-100 opacity-90 mb-5">
              Introductory Rites, Liturgy of the Word, Eucharist, Concluding Rites
            </p>
            <span className="inline-block bg-white text-purple-800 font-bold px-6 py-2.5 rounded-xl shadow-sm group-hover:bg-purple-50 transition-colors">
              Explore
            </span>
          </div>
           <div className="sm:w-1/3 w-full flex justify-center mb-6 sm:mb-0 order-1 sm:order-2">
            <img
              src="../src/assets/images/maria.png"
              alt="Order of the Mass"
              className="w-40 sm:w-48 object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>

      </div>
    </div>
  );
}
