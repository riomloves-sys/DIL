
import React from 'react';

interface Props {
  comm: number;
  aff: number;
  mood: number;
}

const UxLoveReport_Graphs: React.FC<Props> = ({ comm, aff, mood }) => {
  const renderBar = (label: string, value: number, color: string, icon: string) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1 text-sm font-bold text-gray-700 dark:text-gray-200">
        <span className="flex items-center gap-2"><i className={`fas ${icon}`}></i> {label}</span>
        <span>{value}/100</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      {renderBar('Communication', comm, 'bg-blue-500', 'fa-comments')}
      {renderBar('Affection', aff, 'bg-pink-500', 'fa-heart')}
      {renderBar('Mood', mood, 'bg-purple-500', 'fa-smile-beam')}
    </div>
  );
};

export default UxLoveReport_Graphs;
