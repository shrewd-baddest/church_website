import { FaAward, FaTrophy } from 'react-icons/fa'
import type { FC } from 'react';


interface CompletionContainerProps {
  onReset: () => void;
}

export  const CompletionContainer: FC<CompletionContainerProps> = ({ onReset }) => {
  return (
    <div className="relative mt-10 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-lg p-8 text-center shadow-lg overflow-hidden">
      {/* Decorative bouncing balls */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <div className="animate-bounce w-6 h-6 bg-pink-300 rounded-full mx-2"></div>
        <div className="animate-bounce w-8 h-8 bg-pink-400 rounded-full mx-2 delay-150"></div>
        <div className="animate-bounce w-5 h-5 bg-pink-200 rounded-full mx-2 delay-300"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <div className="flex justify-center gap-6 mb-4 text-pink-600 text-4xl">
          <FaAward className="animate-pulse" />
          <FaTrophy className="animate-pulse" />
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">
          🎉 Congratulations on Today’s Quiz!
        </h3>
        <p className="text-gray-700 mb-4">
          You’ve earned recognition for your attempt — every step builds wisdom.
        </p>

        <div className="mt-4">
          <span className="inline-block bg-pink-200 text-pink-700 text-sm font-semibold px-4 py-2 rounded-full shadow-sm">
            Total Attempts: 5
          </span>
          <span className="inline-block bg-yellow-200 text-yellow-700 text-sm font-semibold px-4 py-2 rounded-full shadow-sm ml-3">
            Awards Earned: 2
          </span>
        </div>

        <p className="mt-6 text-pink-600 font-medium">
          🌟 Come back tomorrow for more quizzes and keep shining!
        </p>

         <button
        onClick={onReset}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Return Home
      </button>
      </div>
    </div>
  )
}