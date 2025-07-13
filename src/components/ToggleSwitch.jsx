import React from 'react'
import { motion } from 'framer-motion'

const ToggleSwitch = ({label, onToggle, isOn}) => {
  return (
      <div className="flex items-center justify-between py-3">
          <span>{label}</span>
          <button
              onClick={onToggle}
              className={`w-12 h-6 flex cursor-pointer items-center rounded-full p-1 transition-all duration-300 ${isOn ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
          >
              <motion.div
                  className="bg-white w-4 h-4 rounded-full shadow-md"
                  animate={{ x: isOn ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
          </button>
      </div>
  )
}

export default ToggleSwitch