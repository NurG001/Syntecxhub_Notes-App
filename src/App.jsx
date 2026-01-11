import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Search, ChevronLeft, Pin, Pencil, Moon, Sun, Layout, Clock, Grid, Settings, Heart, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Refined high-contrast color palette for maximum visibility in both modes
const APP_THEME_COLORS = {
  Personal: { light: 'bg-[#d1f386]', dark: 'dark:bg-[#3f6212] dark:text-lime-100' },
  Work: { light: 'bg-[#b0c2ff]', dark: 'dark:bg-[#3730a3] dark:text-indigo-100' },
  Study: { light: 'bg-[#ffc685]', dark: 'dark:bg-[#9a3412] dark:text-orange-100' },
  Urgent: { light: 'bg-[#7ae9f5]', dark: 'dark:bg-[#155e75] dark:text-cyan-100' },
  Ideas: { light: 'bg-[#f0afff]', dark: 'dark:bg-[#86198f] dark:text-purple-100' }
};

export default function App() {
  // --- STATE & PERSISTENCE ---
  const [notesList, setNotesList] = useState(() => {
    // Persistent storage using localstorage as required
    const savedData = localStorage.getItem('original-notes-app-storage'); 
    return savedData ? JSON.parse(savedData) : [];
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('notes-app-theme');
    return savedTheme === 'dark';
  });

  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, favorites, archive
  const [noteContent, setNoteContent] = useState('');
  const [activeCategory, setActiveCategory] = useState('Personal');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  
  // Ref for focusing on the input field as required
  const inputFocusRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('original-notes-app-storage', JSON.stringify(notesList));
  }, [notesList]);

  useEffect(() => {
    localStorage.setItem('notes-app-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- CORE ACTIONS: ADD, EDIT, DELETE ---
  const saveNoteAction = () => {
    if (!noteContent.trim()) return;
    
    const currentDate = new Date();
    const displayDate = `${currentDate.getDate()} ${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;

    if (editingNoteId) {
      setNotesList(notesList.map(note => 
        note.id === editingNoteId ? { ...note, text: noteContent, category: activeCategory } : note
      ));
      setEditingNoteId(null);
    } else {
      setNotesList([{ 
        id: Date.now(), 
        text: noteContent, 
        category: activeCategory, 
        isPinned: false, 
        isArchived: false,
        date: displayDate 
      }, ...notesList]);
    }
    setNoteContent('');
    setIsEditorOpen(false);
  };

  const togglePinStatus = (e, id) => {
    e.stopPropagation();
    setNotesList(notesList.map(note => 
      note.id === id ? { ...note, isPinned: !note.isPinned } : note
    ));
  };

  const toggleArchiveStatus = (e, id) => {
    e.stopPropagation();
    setNotesList(notesList.map(note => 
      note.id === id ? { ...note, isArchived: !note.isArchived, isPinned: false } : note
    ));
  };

  const openNoteForEditing = (note) => {
    setEditingNoteId(note.id);
    setNoteContent(note.text);
    setActiveCategory(note.category);
    setIsEditorOpen(true);
    // Smooth focus transition
    requestAnimationFrame(() => inputFocusRef.current?.focus());
  };

  // --- MEMOIZED LIST PROCESSING FOR SPEED ---
  const finalDisplayNotes = useMemo(() => {
    return notesList
      .filter(note => {
        const matchesSearch = note.text.toLowerCase().includes(searchTerm.toLowerCase());
        if (viewMode === 'favorites') return matchesSearch && note.isPinned && !note.isArchived;
        if (viewMode === 'archive') return matchesSearch && note.isArchived;
        return matchesSearch && !note.isArchived;
      })
      .sort((a, b) => (a.isPinned === b.isPinned ? b.id - a.id : a.isPinned ? -1 : 1));
  }, [notesList, searchTerm, viewMode]);

  const SidebarButton = ({ icon: Icon, label, onClick, active = false, variant = 'default' }) => {
    const isPrimary = variant === 'primary';
    return (
      <div className="relative group flex flex-col items-center">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={`relative p-3 md:p-4 rounded-2xl md:rounded-[1.8rem] transition-all duration-200 outline-none cursor-pointer flex items-center justify-center ${
            isPrimary 
            ? 'bg-black dark:bg-white text-white dark:text-black shadow-xl hidden md:flex' 
            : active 
              ? 'bg-slate-100 dark:bg-white/10 text-black dark:text-white border border-slate-200 dark:border-white/10' 
              : 'text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          {active && !isPrimary && (
            <motion.div layoutId="activeIndicator" className="absolute -left-1 w-1 h-6 bg-black dark:bg-white rounded-r-full hidden md:block" />
          )}
          <Icon size={22} md:size={24} strokeWidth={active || isPrimary ? 2.5 : 2} />
        </motion.button>
        <div className="absolute hidden md:block left-20 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-2xl">
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}>
      <div className={`flex flex-col md:flex-row min-h-screen font-sans ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        
        {/* RESPONSIVE SIDEBAR: Bottom for Mobile, Left for Desktop */}
        <aside className="fixed bottom-0 left-0 w-full md:w-28 md:h-screen md:sticky md:top-0 md:flex-col items-center py-3 px-6 md:px-0 md:py-12 border-t md:border-t-0 md:border-r border-slate-200 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-lg md:bg-white md:dark:bg-black z-50 flex justify-between md:justify-start transition-colors duration-200">
          <div className="hidden md:block mb-16">
            <div className="bg-slate-900 dark:bg-white p-4 rounded-[1.5rem] shadow-lg">
              <Layout size={22} className="text-white dark:text-black" />
            </div>
          </div>
          
          <nav className="flex md:flex-col items-center gap-4 md:gap-5 flex-1 md:flex-none justify-around md:justify-start w-full md:w-auto">
            <SidebarButton icon={Grid} label="Dashboard" active={viewMode === 'dashboard'} onClick={() => { setViewMode('dashboard'); setIsEditorOpen(false); }} />
            <SidebarButton icon={Heart} label="Favorites" active={viewMode === 'favorites'} onClick={() => { setViewMode('favorites'); setIsEditorOpen(false); }} />
            <SidebarButton icon={Archive} label="Archive" active={viewMode === 'archive'} onClick={() => { setViewMode('archive'); setIsEditorOpen(false); }} />
            <div className="md:hidden">
               <SidebarButton icon={darkMode ? Sun : Moon} label="Theme" onClick={() => setDarkMode(!darkMode)} />
            </div>
          </nav>

          <div className="hidden md:flex flex-col items-center gap-5 mt-auto">
            <SidebarButton icon={darkMode ? Sun : Moon} label="Theme" onClick={() => setDarkMode(!darkMode)} />
            <SidebarButton icon={Plus} label="New Note" variant="primary" onClick={() => { setIsEditorOpen(true); setEditingNoteId(null); setNoteContent(''); }} />
          </div>
        </aside>

        {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
        {!isEditorOpen && (
          <motion.button 
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => { setIsEditorOpen(true); setEditingNoteId(null); setNoteContent(''); }}
            className="fixed md:hidden bottom-20 right-6 z-50 bg-black dark:bg-white text-white dark:text-black p-4 rounded-full shadow-2xl"
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        )}

        {/* MAIN CONTENT SPACE */}
        <main className="flex-1 p-5 md:p-14 pb-24 md:pb-14 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {!isEditorOpen ? (
              <motion.div key={viewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-10 md:mb-20">
                  <div className="space-y-1 md:space-y-2">
                    <h1 className="text-4xl md:text-7xl font-black tracking-tighter">
                      {viewMode === 'favorites' ? 'Favorites' : viewMode === 'archive' ? 'Archive' : 'NotesApp'}
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-widest ml-1">
                      {viewMode === 'favorites' ? 'Your pinned thoughts' : viewMode === 'archive' ? 'Saved for later' : 'Capture your mind'}
                    </p>
                  </div>
                  <div className="relative group w-full md:w-96">
                    <Search className={`absolute left-5 md:left-6 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} size={20} md:size={22} />
                    <input
                      type="text" placeholder="Search thoughts..." value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-12 md:pl-16 pr-6 md:pr-8 py-3 md:py-5 rounded-full md:rounded-[2.5rem] outline-none transition-all duration-300 border shadow-sm text-base md:text-lg font-medium ${darkMode ? 'bg-white/5 text-white border-white/5 focus:ring-1 focus:ring-white/20' : 'bg-white text-black border-slate-200 placeholder:text-slate-300 focus:border-black focus:ring-1 focus:ring-black/5'}`}
                    />
                  </div>
                </div>

                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
                  <AnimatePresence mode="popLayout">
                    {finalDisplayNotes.length > 0 ? (
                      finalDisplayNotes.map((note) => (
                        <motion.div
                          layout key={note.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          onClick={() => openNoteForEditing(note)}
                          className={`relative ${APP_THEME_COLORS[note.category].light} ${APP_THEME_COLORS[note.category].dark} p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] h-[18rem] md:h-[22rem] flex flex-col justify-between group cursor-pointer shadow-xl hover:shadow-black/10 transition-all duration-300 border border-black/5 dark:hover:border-white/10 overflow-hidden`}
                        >
                          <div className="absolute top-6 md:top-10 right-6 md:right-10 flex gap-2 md:gap-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                            {!note.isArchived && (
                              <button onClick={(e) => togglePinStatus(e, note.id)} className={`p-2 md:p-4 rounded-xl md:rounded-[1.5rem] bg-white/40 dark:bg-black/30 backdrop-blur-xl ${note.isPinned ? 'text-black dark:text-white shadow-md' : 'text-slate-800 dark:text-slate-400'}`}><Pin size={18} md:size={22} fill={note.isPinned ? "currentColor" : "none"} /></button>
                            )}
                            <button onClick={(e) => toggleArchiveStatus(e, note.id)} className={`p-2 md:p-4 rounded-xl md:rounded-[1.5rem] bg-white/40 dark:bg-black/30 backdrop-blur-xl ${note.isArchived ? 'text-indigo-600' : 'text-slate-800 dark:text-slate-400'}`}><Archive size={18} md:size={22} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setNotesList(notesList.filter(n => n.id !== note.id)); }} className="p-2 md:p-4 rounded-xl md:rounded-[1.5rem] bg-white/40 dark:bg-black/30 backdrop-blur-xl text-slate-800 dark:text-slate-400 hover:text-red-600"><Trash2 size={18} md:size={22} /></button>
                          </div>
                          <div className="mt-2 md:mt-4"><p className="text-xl md:text-3xl font-black leading-tight tracking-tighter text-slate-900 dark:text-inherit line-clamp-4">{note.text}</p></div>
                          <div className="flex justify-between items-center mt-4 md:mt-8">
                            <div className="flex items-center gap-2 px-3 md:px-6 py-1.5 md:py-2.5 bg-black/10 dark:bg-white/10 rounded-full">
                              <Clock size={12} md:size={16} className="text-white dark:text-slate-200" /><span className="text-[9px] md:text-[11px] font-black text-white dark:text-slate-200 tracking-widest uppercase">{note.date}</span>
                            </div>
                            <div className="bg-black dark:bg-white text-white dark:text-black p-3 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] shadow-xl"><Pencil size={18} md:size={24} /></div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center opacity-30"><p className="text-xl md:text-2xl font-black italic">No notes found here...</p></div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ) : (
              /* EDITOR MODE */
              <motion.div key="editor" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="max-w-5xl mx-auto">
                <header className="flex justify-between items-center mb-10 md:mb-20">
                  <button onClick={() => setIsEditorOpen(false)} className={`p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] transition-all cursor-pointer border shadow-md ${darkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-200 text-black hover:bg-slate-50'}`}><ChevronLeft size={24} md:size={36} /></button>
                  <button onClick={saveNoteAction} className="bg-black dark:bg-white text-white dark:text-black px-8 md:px-16 py-3 md:py-5 rounded-full font-black text-base md:text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none">Save Note</button>
                </header>
                <div className="space-y-8 md:space-y-16">
                  <div className="flex flex-col gap-3 md:gap-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Context</span>
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(APP_THEME_COLORS).map(catName => (
                        <button key={catName} onClick={() => setActiveCategory(catName)} className={`px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-[1.5rem] text-[9px] md:text-[11px] font-black tracking-widest uppercase transition-all ${activeCategory === catName ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl scale-110' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>{catName}</button>
                      ))}
                    </div>
                  </div>
                  <textarea ref={inputFocusRef} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Capture your thoughts..." className={`w-full h-[50vh] md:h-[55vh] text-2xl md:text-6xl font-black border-none outline-none resize-none bg-transparent leading-tight tracking-tight ${darkMode ? 'text-white placeholder:text-white/5' : 'text-black placeholder:text-slate-100'}`} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}