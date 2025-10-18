import { useState } from 'react'
import avata from '../assets/pngtree-user-profile-avatar-png-image_10211467.png'
function ProfileSetting() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block text-left">
      {/* Avatar button */}
      <img
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full cursor-pointer"
        src={avata}
        alt="User dropdown"
      />

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 dark:divide-gray-600"
        >
          <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
            <div>Bonnie Green</div>
            <div className="font-medium truncate">name@flowbite.com</div>
          </div>
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
            <li>
              <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                Profile
              </a>
            </li>
            <li>
              <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                Settings
              </a>
            </li>
          </ul>
          <div className="py-1">
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
              Sign out
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSetting
