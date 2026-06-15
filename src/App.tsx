import React, { useState, useEffect } from 'react';
import { ClassRoster, Student } from './types';
import RosterManager from './components/RosterManager';
import LuckyDraw from './components/LuckyDraw';
import TeamGrouper from './components/TeamGrouper';
import { 
  Sparkles, 
  Users, 
  HelpCircle, 
  Shuffle, 
  UserSquare, 
  GraduationCap, 
  Info,
  Layers,
  Heart,
  Volume2,
  VolumeX
} from 'lucide-react';
import { playClick, getMuted, setMuted } from './utils/audio';
import { motion, AnimatePresence } from 'motion/react';

// Pre-loaded realistic class student data for teachers to evaluate features instantly!
const PRESET_ROSTERS: ClassRoster[] = [
  {
    id: 'roster_preset_1',
    className: '🎒 三年二班 (示範名單)',
    createdAt: Date.now(),
    students: [
      { id: 'p1_1', name: '陳小東', gender: 'M', seatNumber: '01' },
      { id: 'p1_2', name: '王大同', gender: 'M', seatNumber: '02' },
      { id: 'p1_3', name: '林小美', gender: 'F', seatNumber: '03' },
      { id: 'p1_4', name: '張小南', gender: 'M', seatNumber: '04' },
      { id: 'p1_5', name: '黃小梅', gender: 'F', seatNumber: '05' },
      { id: 'p1_6', name: '周杰倫', gender: 'M', seatNumber: '06' },
      { id: 'p1_7', name: '蔡依林', gender: 'F', seatNumber: '07' },
      { id: 'p1_8', name: '楊丞琳', gender: 'F', seatNumber: '08' },
      { id: 'p1_9', name: '劉德華', gender: 'M', seatNumber: '09' },
      { id: 'p1_10', name: '梁朝偉', gender: 'M', seatNumber: '10' },
      { id: 'p1_11', name: '金城武', gender: 'M', seatNumber: '11' },
      { id: 'p1_12', name: '林志玲', gender: 'F', seatNumber: '12' },
      { id: 'p1_13', name: '郭雪芙', gender: 'F', seatNumber: '13' },
      { id: 'p1_14', name: '詹姆斯', gender: 'M', seatNumber: '14' },
      { id: 'p1_15', name: '庫里', gender: 'M', seatNumber: '15' },
      { id: 'p1_16', name: '泰勒絲', gender: 'F', seatNumber: '16' }
    ]
  },
  {
    id: 'roster_preset_2',
    className: '🏫 六年四班 (精簡名單)',
    createdAt: Date.now() - 10000,
    students: [
      { id: 'p2_1', name: '張家豪', gender: 'M', seatNumber: '01' },
      { id: 'p2_2', name: '陳怡君', gender: 'F', seatNumber: '02' },
      { id: 'p2_3', name: '林冠宇', gender: 'M', seatNumber: '03' },
      { id: 'p2_4', name: '陳莉婷', gender: 'F', seatNumber: '04' },
      { id: 'p2_5', name: '張凱婷', gender: 'F', seatNumber: '05' },
      { id: 'p2_6', name: '李威廷', gender: 'M', seatNumber: '06' },
      { id: 'p2_7', name: '張雅雯', gender: 'F', seatNumber: '07' },
      { id: 'p2_8', name: '陳俊宇', gender: 'M', seatNumber: '08' }
    ]
  }
];

export default function App() {
  const [rosters, setRosters] = useState<ClassRoster[]>([]);
  const [currentRosterId, setCurrentRosterId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'draw' | 'group' | 'roster'>('draw');
  const [globalMute, setGlobalMute] = useState<boolean>(false);

  // Initialize and read from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('classroom_helper_rosters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ClassRoster[];
        if (parsed && parsed.length > 0) {
          setRosters(parsed);
          setCurrentRosterId(parsed[0].id);
        } else {
          setRosters(PRESET_ROSTERS);
          setCurrentRosterId(PRESET_ROSTERS[0].id);
        }
      } catch (e) {
        console.error('Failed to parse saved rosters, loading presets...', e);
        setRosters(PRESET_ROSTERS);
        setCurrentRosterId(PRESET_ROSTERS[0].id);
      }
    } else {
      setRosters(PRESET_ROSTERS);
      setCurrentRosterId(PRESET_ROSTERS[0].id);
    }

    // Audio sync state
    setGlobalMute(getMuted());
  }, []);

  // Save changes to localStorage
  const saveRostersToStorage = (updated: ClassRoster[]) => {
    setRosters(updated);
    localStorage.setItem('classroom_helper_rosters', JSON.stringify(updated));
  };

  const handleSelectRoster = (id: string) => {
    setCurrentRosterId(id);
  };

  const handleSaveRoster = (updatedRoster: ClassRoster) => {
    const nextRosters = rosters.map(r => r.id === updatedRoster.id ? updatedRoster : r);
    saveRostersToStorage(nextRosters);
  };

  const handleDeleteRoster = (id: string) => {
    const nextRosters = rosters.filter(r => r.id !== id);
    saveRostersToStorage(nextRosters);
    if (currentRosterId === id && nextRosters.length > 0) {
      setCurrentRosterId(nextRosters[0].id);
    }
  };

  const handleCreateRoster = (className: string) => {
    const newRoster: ClassRoster = {
      id: 'roster_' + Date.now(),
      className,
      students: [],
      createdAt: Date.now()
    };
    const next = [newRoster, ...rosters];
    saveRostersToStorage(next);
    setCurrentRosterId(newRoster.id);
    setActiveTab('roster'); // Switch to let them enter names right away!
  };

  const handleGlobalMuteToggle = () => {
    const isMutedNow = !globalMute;
    setGlobalMute(isMutedNow);
    setMuted(isMutedNow);
    playClick();
  };

  const currentRoster = rosters.find(r => r.id === currentRosterId) || rosters[0];

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#2D3436] flex flex-col font-sans transition-colors duration-150 relative">
      {/* Primary educational desk-friendly top header with Vibrant styling */}
      <header className="bg-white border-b-4 border-[#2D3436] sticky top-0 z-50 print:hidden shadow-[4px_4px_0px_0px_rgba(45,52,54,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4 sm:h-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#FF6B6B] rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_#2D3436] border-2 border-[#2D3436] text-white">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#2D3436]">
                  小學趣點名
                </h1>
                <p className="text-[#7F8C8D] font-black text-[10px] sm:text-xs">
                  FUN CLASS PICKER & GROUPS
                </p>
              </div>
            </div>

            {/* Class current picker indicator and quick settings */}
            <div className="flex items-center gap-3">
              {currentRoster && (
                <div className="bg-white text-[#2D3436] border-2 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] px-4 py-2 rounded-xl text-xs font-black">
                  {currentRoster.className} ({currentRoster.students.length}位學生)
                </div>
              )}
              <div className="bg-[#4ECDC4] text-white border-2 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] px-4 py-2 rounded-xl text-xs font-black">
                王老師，您好！
              </div>

              {/* Sound status indicator */}
              <button
                id="btn_global_mute"
                onClick={handleGlobalMuteToggle}
                className={`p-2 rounded-xl border-2 border-[#2D3436] transition shadow-[3px_3px_0px_0px_#2D3436] active:translate-y-0.5 active:shadow-none ${
                  globalMute 
                    ? 'bg-neutral-100 text-neutral-400' 
                    : 'bg-[#FFE66D] text-[#2D3436]'
                }`}
                title={globalMute ? '音效已關閉' : '音效已開啟'}
              >
                {globalMute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Navigation Tabs (Primary selector in Neo-Brutalist style) */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center print:hidden border-b-2 border-dashed border-[#2D3436]/40 pb-4 gap-4">
          <nav className="flex flex-wrap gap-3">
            <button
              id="tab_trigger_draw"
              onClick={() => { playClick(); setActiveTab('draw'); }}
              className={`px-5 py-3.5 rounded-2xl text-sm font-black transition border-2 border-[#2D3436] active:translate-y-0.5 active:shadow-none flex items-center gap-2 ${
                activeTab === 'draw'
                  ? 'bg-[#FF6B6B] text-white shadow-[4px_4px_0px_0px_#2D3436]'
                  : 'bg-white text-[#2D3436] hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#2D3436]'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              隨機點名抽籤
            </button>

            <button
              id="tab_trigger_group"
              onClick={() => { playClick(); setActiveTab('group'); }}
              className={`px-5 py-3.5 rounded-2xl text-sm font-black transition border-2 border-[#2D3436] active:translate-y-0.5 active:shadow-none flex items-center gap-2 ${
                activeTab === 'group'
                  ? 'bg-[#4ECDC4] text-white shadow-[4px_4px_0px_0px_#2D3436]'
                  : 'bg-white text-[#2D3436] hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#2D3436]'
              }`}
            >
              <Users className="w-4 h-4" />
              隨機分組
            </button>

            <button
              id="tab_trigger_roster"
              onClick={() => { playClick(); setActiveTab('roster'); }}
              className={`px-5 py-3.5 rounded-2xl text-sm font-black transition border-2 border-[#2D3436] active:translate-y-0.5 active:shadow-none flex items-center gap-2 ${
                activeTab === 'roster'
                  ? 'bg-[#FFE66D] text-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436]'
                  : 'bg-white text-[#2D3436] hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#2D3436]'
              }`}
            >
              <UserSquare className="w-4 h-4" />
              學生名單設定
            </button>
          </nav>

          <div id="quick_helper_tips" className="flex items-center gap-2 text-xs text-[#2D3436] font-bold bg-white px-4 py-3 border-2 border-[#2D3436] rounded-2xl shadow-[3px_3px_0px_0px_#2D3436]">
            <Info className="w-4 h-4 text-[#FF6B6B]" />
            <span>名冊資料皆保管於您目前的瀏覽器中</span>
          </div>
        </div>

        {/* Tab display Content panels */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'draw' && (
                <LuckyDraw currentRoster={currentRoster} />
              )}
              
              {activeTab === 'group' && (
                <TeamGrouper currentRoster={currentRoster} />
              )}

              {activeTab === 'roster' && (
                <RosterManager
                  rosters={rosters}
                  currentRosterId={currentRosterId}
                  onSelectRoster={handleSelectRoster}
                  onSaveRoster={handleSaveRoster}
                  onDeleteRoster={handleDeleteRoster}
                  onCreateRoster={handleCreateRoster}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Informative classroom guidelines card for teachers as a cool retro sticky card */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#2D3436] shadow-[6px_6px_0px_0px_#2D3436] print:hidden">
          <h3 className="text-sm font-black text-[#2D3436] flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4.5 h-4.5 text-[#FF6B6B]" />
            貼心老師導言與最佳實作：
          </h3>
          <ul className="text-xs text-[#2D3436] font-bold space-y-2.5 list-disc pl-5 leading-relaxed">
            <li>
              <strong>多班級管理</strong>：在「學生名單設定」中可建置多個班級。系統在網頁重啟時會自動載入前一次儲存的名冊。
            </li>
            <li>
              <strong>極速貼上</strong>：如果是其他管道（如 ClassDojo、Excel、LINE、Facebook 群組）的學生列表，直接框選姓名在文字框貼上，系統會智慧剔除無用逗號、數字座號及性別記號。
            </li>
            <li>
              <strong>無重抽籤與重置</strong>：預設「人員不得重複」好用在「一輪抽籤中，人人都有回答機會」。當全部輪過一輪，系統會主動提醒。您可以隨時點選「重設籤桶」來恢復完整的候選名冊。
            </li>
            <li>
              <strong>白板微調對調</strong>：在分組完畢後，若想要某個優秀學生與另一個害羞學生對調小組，直接點擊他們兩人的名字，他們就會在投影白板上當場對調！
            </li>
          </ul>
        </div>
      </main>

      {/* Simple elegant schoolyard footer footer */}
      <footer className="bg-white border-t-2 border-[#2D3436] py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-[#2D3436] font-black flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 教師課堂得力助手 🎒 小學趣點名 & 視覺化分組隨身包</p>
          <p className="flex items-center gap-1">
            由小學老師課堂需求精心設計，用
            <Heart className="w-3.5 h-3.5 text-[#FF6B6B] fill-[#FF6B6B] animate-pulse" />
            在繁體中/英文課堂推廣
          </p>
        </div>
      </footer>
    </div>
  );
}
