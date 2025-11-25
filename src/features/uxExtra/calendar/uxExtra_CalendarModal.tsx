
import React, { useState, useEffect } from 'react';
import { CalendarEvent, useUxExtraCalendar } from './useUxExtraCalendar';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUserUid: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CATEGORIES = [
    { label: 'Date Night', emoji: '🍷' },
    { label: 'Birthday', emoji: '🎂' },
    { label: 'Anniversary', emoji: '💍' },
    { label: 'Trip', emoji: '✈️' },
    { label: 'Meeting', emoji: '🤝' },
    { label: 'Reminder', emoji: '⏰' },
];

const UxExtra_CalendarModal: React.FC<Props> = ({ isOpen, onClose, chatId, currentUserUid }) => {
  const { events, saveEvent, deleteEvent } = useUxExtraCalendar(chatId, currentUserUid);
  
  // View State: 'calendar' (Grid) or 'timeline' (List)
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('📅');

  if (!isOpen) return null;

  // --- Calendar Grid Logic ---
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const formatDate = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  
  const handleDayClick = (day: number) => {
    const dateStr = formatDate(day);
    setSelectedDate(dateStr);
    setIsEditing(false);
    resetForm();
    // Auto-scroll to details on mobile if needed, though split view handles this.
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setEmoji('📅');
    setEditId(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !selectedDate) return;
    
    const newEvent: CalendarEvent = {
      id: editId || uuidv4(),
      date: selectedDate,
      title,
      description: desc,
      emoji,
      createdBy: currentUserUid,
      createdAt: Date.now()
    };
    
    await saveEvent(newEvent);
    setIsEditing(false);
    resetForm();
  };

  const handleEdit = (evt: CalendarEvent) => {
    setEditId(evt.id);
    setTitle(evt.title);
    setDesc(evt.description);
    setEmoji(evt.emoji);
    setSelectedDate(evt.date); // Switch to that date
    setIsEditing(true);
  };

  const setCategory = (cat: { label: string, emoji: string }) => {
      setTitle(cat.label);
      setEmoji(cat.emoji);
  };

  // --- Data filtering ---
  const eventsForDay = (dateStr: string) => events.filter(e => e.date === dateStr);
  const todayStr = new Date().toISOString().split('T')[0];

  // Timeline Data
  const upcomingEvents = events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents = events.filter(e => e.date < todayStr).sort((a, b) => b.date.localeCompare(a.date)); // Newest past first

  // --- RENDERERS ---

  const renderForm = () => (
    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
        <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-sm text-gray-600 dark:text-gray-300">
                {isEditing ? 'Edit Event' : 'Add New Event'}
            </h4>
            {isEditing && (
                <button onClick={() => { setIsEditing(false); resetForm(); }} className="text-xs text-red-500 hover:underline">Cancel</button>
            )}
        </div>

        {/* Categories Chips */}
        {!isEditing && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((cat, i) => (
                    <button 
                        key={i}
                        onClick={() => setCategory(cat)} 
                        className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-md text-xs whitespace-nowrap hover:bg-pink-50 dark:hover:bg-gray-500 transition flex items-center gap-1 shrink-0"
                    >
                        <span>{cat.emoji}</span> {cat.label}
                    </button>
                ))}
            </div>
        )}
        
        {/* Date Picker (Visible in Timeline Mode or Edit) */}
        {(viewMode === 'timeline' || isEditing) && (
            <input 
                type="date"
                value={selectedDate || todayStr}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full mb-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            />
        )}

        <div className="flex gap-2 mb-2">
            <input 
                type="text" 
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                className="w-12 text-center p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Emo"
                maxLength={2}
            />
            <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Title (e.g. Anniversary)"
            />
        </div>
        <textarea 
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm mb-3"
            placeholder="Details (time, place)..."
            rows={2}
        />
        <button 
            onClick={handleSave}
            className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2"
        >
            <i className="fas fa-plus-circle"></i> {isEditing ? 'Update Event' : 'Add to Calendar'}
        </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in">
        
        {/* HEADER & TABS */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
                     <i className="fas fa-heart text-pink-500 mr-2"></i> Couple Calendar
                 </h2>
                 {/* Tabs */}
                 <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                     <button 
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-700 shadow text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                     >
                         <i className="fas fa-calendar-alt mr-1"></i> Calendar
                     </button>
                     <button 
                        onClick={() => setViewMode('timeline')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'timeline' ? 'bg-white dark:bg-gray-700 shadow text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                     >
                         <i className="fas fa-list-ul mr-1"></i> Timeline
                     </button>
                 </div>
             </div>
             <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-white p-2">
                 <i className="fas fa-times text-xl"></i>
             </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* VIEW 1: CALENDAR GRID (Left on Desktop, Top on Mobile) */}
            {viewMode === 'calendar' && (
                <div className="flex-1 md:flex-row flex flex-col h-full overflow-hidden">
                    {/* Calendar Grid Area */}
                    <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col overflow-y-auto">
                        {/* Month Nav */}
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><i className="fas fa-chevron-left"></i></button>
                            <span className="font-bold text-lg dark:text-white">{MONTHS[month]} {year}</span>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><i className="fas fa-chevron-right"></i></button>
                        </div>
                        
                        {/* Days Grid */}
                        <div className="grid grid-cols-7 mb-2 shrink-0">
                            {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-gray-400">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                             {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
                             {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = formatDate(day);
                                const dayEvents = eventsForDay(dateStr);
                                const isSelected = selectedDate === dateStr;
                                const isToday = todayStr === dateStr;

                                return (
                                    <div 
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        aspect-square rounded-lg cursor-pointer flex flex-col items-center justify-start pt-1 border transition relative
                                        ${isSelected ? 'bg-pink-500 text-white border-pink-600 shadow-md transform scale-105 z-10' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-transparent hover:border-pink-300 hover:bg-pink-50'}
                                        ${isToday && !isSelected ? 'ring-2 ring-blue-400' : ''}
                                    `}
                                    >
                                    <span className="text-xs font-medium">{day}</span>
                                    <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 px-0.5 w-full">
                                        {dayEvents.slice(0, 3).map((ev, idx) => (
                                            <span key={idx} className="text-[8px] leading-none">{ev.emoji}</span>
                                        ))}
                                        {dayEvents.length > 3 && <div className="w-1 h-1 bg-current rounded-full"></div>}
                                    </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Side Panel (Right on Desktop, Bottom on Mobile) */}
                    <div className="w-full md:w-80 border-t md:border-t-0 md:border-r bg-white dark:bg-gray-800 p-4 flex flex-col shadow-inner overflow-hidden h-[40vh] md:h-full shrink-0">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white border-b pb-2 dark:border-gray-700">
                             {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' }) : 'Select Date'}
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                            {eventsForDay(selectedDate || '').length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4 italic">No events.</p>
                            ) : (
                                eventsForDay(selectedDate || '').map(evt => (
                                    <div key={evt.id} className="p-3 bg-pink-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between group">
                                         <div className="flex items-center gap-3">
                                             <span className="text-xl">{evt.emoji}</span>
                                             <div>
                                                 <div className="font-bold text-sm dark:text-white">{evt.title}</div>
                                                 {evt.description && <div className="text-xs text-gray-500 dark:text-gray-400">{evt.description}</div>}
                                             </div>
                                         </div>
                                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                             <button onClick={() => handleEdit(evt)} className="text-blue-500"><i className="fas fa-pencil-alt"></i></button>
                                             <button onClick={() => { if(window.confirm('Delete?')) deleteEvent(evt.id); }} className="text-red-500"><i className="fas fa-trash"></i></button>
                                         </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {renderForm()}
                    </div>
                </div>
            )}

            {/* VIEW 2: TIMELINE (Agenda) */}
            {viewMode === 'timeline' && (
                <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
                    {/* Left: Event Stream */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="max-w-2xl mx-auto space-y-8">
                            
                            {/* Upcoming Section */}
                            <div>
                                <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2">
                                    <i className="fas fa-rocket"></i> Upcoming ("Kya aane wala h")
                                </h3>
                                {upcomingEvents.length === 0 && (
                                    <p className="text-gray-400 italic text-sm">Nothing planned yet. Use the form to add future dates!</p>
                                )}
                                <div className="space-y-3">
                                    {upcomingEvents.map(evt => (
                                        <div key={evt.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-purple-500 flex justify-between items-center hover:shadow-md transition">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 w-12 h-12 rounded-lg shrink-0">
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{new Date(evt.date).toLocaleDateString(undefined, {month:'short'})}</span>
                                                    <span className="text-lg font-bold text-gray-800 dark:text-white">{new Date(evt.date).getDate()}</span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 dark:text-white text-lg">{evt.emoji} {evt.title}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(evt.date).toLocaleDateString(undefined, {weekday: 'long'})} • {evt.description || 'No details'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                 <button onClick={() => handleEdit(evt)} className="text-gray-400 hover:text-blue-500 p-2"><i className="fas fa-pencil-alt"></i></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Past Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2 border-t pt-8 dark:border-gray-700">
                                    <i className="fas fa-history"></i> Memories ("Kya tha")
                                </h3>
                                {pastEvents.length === 0 && (
                                    <p className="text-gray-400 italic text-sm">No past events recorded.</p>
                                )}
                                <div className="space-y-3 opacity-80">
                                    {pastEvents.map(evt => (
                                        <div key={evt.id} className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl flex justify-between items-center grayscale hover:grayscale-0 transition duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="text-gray-400 font-mono text-sm w-24">
                                                    {new Date(evt.date).toLocaleDateString()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-700 dark:text-gray-300">{evt.emoji} {evt.title}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleEdit(evt)} className="text-gray-300 hover:text-blue-500 p-2"><i className="fas fa-pencil-alt"></i></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Right: Quick Add (Desktop only) or Sticky Bottom (Mobile) */}
                    <div className="w-full md:w-80 bg-white dark:bg-gray-800 p-4 border-l dark:border-gray-700 shadow-lg shrink-0">
                         <h3 className="font-bold mb-4 dark:text-white">Quick Add Event</h3>
                         {renderForm()}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default UxExtra_CalendarModal;
