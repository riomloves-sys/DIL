
import React from 'react';

interface Props {
  onClick: () => void;
}

const UxExtra_LockedGalleryButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-700 rounded-full transition"
      title="Locked Gallery"
    >
      <i className="fas fa-lock"></i>
    </button>
  );
};

export default UxExtra_LockedGalleryButton;
