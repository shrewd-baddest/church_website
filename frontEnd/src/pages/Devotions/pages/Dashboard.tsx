import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Welcome Back, Robert Macharia.</h1>
        <p className="text-gray-600">
          Your spiritual journey continues today. Explore readings and prayers
          below.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Bible Readings */}
        <Link
          to="readings"
          className="flex flex-col sm:flex-row items-center bg-gradient-to-br from-orange-400 to-orange-200 hover:from-orange-500 hover:to-orange-300 transition rounded-lg p-4 shadow-md"
        >
          <div className="sm:w-1/4 w-full flex justify-center ">
            <img
              src="../src/assets/images/hory-bible.png"
              alt="Bible Readings"
              className="w-24 sm:w-32 md:w-40 lg:w-48 object-contain drop-shadow-lg"
            />
          </div>
          <div className="sm:w-1/2 w-full text-center sm:text-left">
            <h2 className="text-xl font-semibold mb-2">Bible Readings</h2>
            <p className="text-sm text-gray-700 break-words">
              "The Lord is my shepherd; I shall not want..."
            </p>
            <span className="mt-4 inline-block bg-white text-sm px-3 py-2 rounded">
              Open Scroll
            </span>
          </div>
        </Link>

        {/* Daily Challenge */}
        <Link
          to="challenge"
          className="flex flex-col sm:flex-row items-center bg-gradient-to-br from-blue-500 to-blue-300 hover:from-blue-600 hover:to-blue-400 transition rounded-lg p-4 shadow-md"
        >
          <div className="sm:w-1/4 w-full flex justify-center mb-4 sm:mb-0">
            <img
              src="../src/assets/images/challange.png"
              alt="Daily Challenge"
              className="w-24 sm:w-32 md:w-40 lg:w-48 object-contain drop-shadow-lg"
            />
          </div>
          <div className="sm:w-1/2 w-full text-center sm:text-left">
            <h3 className="font-semibold">Daily Challenge</h3>
            <p className="text-sm text-gray-700 mt-2 break-words">
              What color vestments does the priest wear during Ordinary Time?
            </p>
            <div className="mt-4 space-y-2">
              <div className="bg-blue-50 px-3 py-2 rounded">Green</div>
              <div className="bg-white px-3 py-2 rounded">Purple</div>
            </div>
          </div>
        </Link>

        {/* Rosary */}
        <Link
          to="rosary"
          className="flex flex-col sm:flex-row items-center bg-purple-200 hover:bg-purple-300 transition rounded-lg p-4 shadow-md"
        >
          <div className="sm:w-1/4 w-full flex justify-center mb-4 sm:mb-0">
            <img
              src="../src/assets/images/rosary.png"
              alt="Rosary"
              className="w-24 sm:w-32 md:w-40 lg:w-48 object-contain drop-shadow-lg"
            />
          </div>
          <div className="sm:w-1/2 w-full text-center sm:text-left">
            <h3 className="font-semibold mb-2">The Joyful Mysteries</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 text-left">
              <li>The Annunciation</li>
              <li>The Visitation</li>
              <li>The Nativity</li>
            </ul>
          </div>
        </Link>

        {/* Liturgy */}
        <Link
          to="liturgy"
          className="flex flex-col sm:flex-row items-center bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 transition text-white rounded-lg p-4 shadow-md"
        >
         
          <div className="sm:w-1/2 w-full text-center sm:text-left">
            <h3 className="font-semibold">Order of the Mass</h3>
            <p className="text-sm text-gray-100 mt-2 break-words">
              Introductory Rites, Liturgy of the Word, Eucharist, Concluding Rites
            </p>
            <button className="m-4 bg-white text-sm px-3 py-2 rounded text-gray-800">
              Explore
            </button>
          </div>

           <div className="sm:w-1/4 w-full flex justify-center mx-5 sm:mx-0">
            <img
              src="../src/assets/images/maria.png"
              alt="Order of the Mass"
              className="w-24 sm:w-32 md:w-40 lg:w-48 object-contain drop-shadow-lg"
            />
          </div>

        </Link>

      </div>
    </div>
  );
}
