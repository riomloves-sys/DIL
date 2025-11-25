
import React from 'react';

interface Props {
  onClick: () => void;
}

const UxExtra_CalendarButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="p-2 text-pink-500 hover:bg-pink-50 dark:hover:bg-gray-700 rounded-full transition"
      title="Shared Calendar"
    >
      <i className="fas fa-calendar-alt"></i>
    </button>
  );
};

export default UxExtra_CalendarButton;
