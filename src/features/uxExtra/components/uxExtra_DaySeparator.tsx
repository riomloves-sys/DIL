import React from 'react';

interface Props {
  date: string;
}

/**
 * Renders a centered pill with the date.
 * Responsive and theme-aware (Dark/Light mode).
 */
const UxExtra_DaySeparator: React.FC<Props> = ({ date }) => {
  return (
    <div className="flex items-center justify-center my-6 select-none pointer-events-none">
      <div className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold px-3 py-1 rounded-full shadow-sm border border-gray-300 dark:border-gray-600">
        {date}
      </div>
    </div>
  );
};

export default UxExtra_DaySeparator;