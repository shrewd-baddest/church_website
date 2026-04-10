import { NavLink } from 'react-router-dom'
import { FaHome, FaBook, FaPrayingHands, FaChurch, FaBed, FaStar } from 'react-icons/fa'

export default function Sidebar() {
  const items = [
    { to: '/devotions', label: 'Dashboard', icon: <FaHome /> },
    { to: 'readings', label: 'Scripture', icon: <FaBook /> },
    { to: 'prayer', label: 'Prayer', icon: <FaPrayingHands /> },
    { to: 'liturgy', label: 'Liturgy', icon: <FaChurch /> },
    { to: 'rosary', label: 'Rosary', icon: <FaBed /> },
    { to: 'challenge', label: 'Daily Challenge', icon: <FaStar /> },
  ]

  return (
    <>
      {/* desktop/large screens sidebar */}
      <aside className="hidden md:block w-64 bg-gray-50 h-screen border-r border-gray-200 sticky top-0 left-0 shadow-sm">
        <div className="p-6">
          <nav className="space-y-2">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 ${
                    isActive
                      ? 'bg-pink-100 text-pink-700 font-semibold shadow-sm'
                      : 'text-gray-700 hover:text-pink-600 hover:bg-gray-100'
                  }`
                }
              >
                <span className="text-lg">{it.icon}</span>
                <span className="text-sm">{it.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-50  border-t border-gray-200 md:hidden flex justify-around py-2 shadow-sm">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center text-xs transition-colors ${
                isActive ? 'text-pink-600' : 'text-gray-700 hover:text-pink-600'
              }`
            }
          >
            <span className="text-lg">{it.icon}</span>
            <span className="sr-only">{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
