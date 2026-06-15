import React, { useState, useEffect, useRef } from 'react';
import { Student, ClassRoster } from '../types';
import { 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  History, 
  HelpCircle, 
  VolumeX, 
  Volume2, 
  Award,
  CheckCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { playTick, playTada, playSuccess, playClick, getMuted, setMuted } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface LuckyDrawProps {
  currentRoster: ClassRoster;
}

export default function LuckyDraw({ currentRoster }: LuckyDrawProps) {
  const students = currentRoster?.students || [];

  const [drawCount, setDrawCount] = useState<number>(1);
  const [noRepeat, setNoRepeat] = useState<boolean>(true);
  
  // Lottery pool state
  const [undrawnIds, setUndrawnIds] = useState<string[]>([]);
  const [drawnHistory, setDrawnHistory] = useState<Student[]>([]);
  const [currentDrawResults, setCurrentDrawResults] = useState<Student[]>([]);
  
  // Animation state
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [flashNames, setFlashNames] = useState<string[]>([]);
  const [mutedState, setMutedState] = useState<boolean>(getMuted());

  // Keep a ref to avoid stale status inside timers
  const stateRef = useRef({ undrawnIds, students, noRepeat });
  stateRef.current = { undrawnIds, students, noRepeat };

  // Sync undrawn pool when roster changes or when modes toggle
  useEffect(() => {
    resetPool();
  }, [currentRoster?.id]);

  const resetPool = () => {
    setUndrawnIds(students.map(s => s.id));
    setDrawnHistory([]);
    setCurrentDrawResults([]);
    setIsSpinning(false);
  };

  const handleMuteToggle = () => {
    const isNowMuted = !mutedState;
    setMutedState(isNowMuted);
    setMuted(isNowMuted);
    playClick();
  };

  // Perform random drawing with deceleration animation
  const startDraw = () => {
    if (students.length === 0 || isSpinning) return;
    playClick();

    const poolIds = noRepeat ? undrawnIds : students.map(s => s.id);
    
    if (noRepeat && poolIds.length === 0) {
      alert('籤桶已空！請點擊「重設籤桶」重新開始。');
      return;
    }

    // Determine how many we can actually draw
    const actualDrawCount = Math.min(drawCount, poolIds.length);
    if (actualDrawCount === 0) return;

    setIsSpinning(true);
    setCurrentDrawResults([]);

    // Select the final winners beforehand so we can guide the visual spin safely
    const shuffledPool = [...poolIds].sort(() => Math.random() - 0.5);
    const chosenIds = shuffledPool.slice(0, actualDrawCount);
    const winners = chosenIds.map(id => students.find(s => s.id === id)!).filter(Boolean) as Student[];

    // Deceleration simulation
    let tickCount = 0;
    const totalTicks = 24; // number of steps before slowing down to stop
    let currentInterval = 50; // starting speed in ms

    // Populate mock scroll names for simulation
    const nameFlashFiller = () => {
      const mockNames: string[] = [];
      for (let i = 0; i < actualDrawCount; i++) {
        const randStudent = students[Math.floor(Math.random() * students.length)];
        mockNames.push(randStudent ? randStudent.name : '???');
      }
      setFlashNames(mockNames);
    };

    const runTick = () => {
      tickCount++;
      nameFlashFiller();
      playTick();

      if (tickCount < totalTicks) {
        // Accelerate/Decelerate speed profile
        if (tickCount > totalTicks * 0.7) {
          currentInterval += 40; // gradual slowing down
        } else if (tickCount > totalTicks * 0.4) {
          currentInterval += 15;
        }
        setTimeout(runTick, currentInterval);
      } else {
        // Stop spinning and reveal actual winners
        setIsSpinning(false);
        setCurrentDrawResults(winners);
        
        if (noRepeat) {
          // Remove from undrawn pool
          setUndrawnIds(prev => prev.filter(id => !chosenIds.includes(id)));
        }

        // Add to history (front-load newer results)
        setDrawnHistory(prev => [...winners, ...prev]);

        // Play celebration audio chord
        if (actualDrawCount === 1) {
          playTada();
        } else {
          playSuccess();
        }
      }
    };

    setTimeout(runTick, currentInterval);
  };

  // Helper values
  const totalCount = students.length;
  const remainingCount = noRepeat ? undrawnIds.length : totalCount;
  const drawnCountNumber = totalCount - remainingCount;
  const progressPercent = totalCount > 0 ? (remainingCount / totalCount) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Configuration & Status metrics (Left Area) */}
      <div className="lg:col-span-4 space-y-6">
        <div id="draw_setup_panel" className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-rose-100 p-2 rounded-xl text-rose-700">
                <Shuffle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-neutral-800 font-sans">抽籤設定</h2>
            </div>

            {/* Mute toggle */}
            <button
              id="btn_mute_audio"
              onClick={handleMuteToggle}
              className={`p-2 rounded-xl transition ${
                mutedState 
                  ? 'bg-neutral-100 text-neutral-400 hover:text-neutral-500' 
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`}
              title={mutedState ? '已靜音' : '音效開啟'}
            >
              {mutedState ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {students.length === 0 ? (
            <div className="py-6 text-center text-neutral-400 text-xs">
              ⚠️ 當前尚無學生名冊，請先到「學生名單設定」新增名單！
            </div>
          ) : (
            <div className="space-y-5">
              {/* Draw size slider */}
              <div>
                <label className="text-xs font-bold text-neutral-500 block mb-2">
                  單次隨機抽取人數： <span className="text-rose-500 font-bold text-sm font-mono">{drawCount}</span> 人
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 font-bold font-mono">1</span>
                  <input
                    id="draw_count_slider"
                    type="range"
                    min="1"
                    max={Math.min(10, Math.max(1, students.length))}
                    value={drawCount}
                    onChange={(e) => {
                      playClick();
                      setDrawCount(parseInt(e.target.value));
                    }}
                    className="flex-1 accent-rose-500 h-2 bg-neutral-100 rounded-lg cursor-pointer appearance-none"
                  />
                  <span className="text-xs text-neutral-400 font-bold font-mono">
                    {Math.min(10, students.length)}
                  </span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 5].map(n => (
                    n <= students.length && (
                      <button
                        key={n}
                        id={`btn_quick_draw_${n}`}
                        onClick={() => { playClick(); setDrawCount(n); }}
                        className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition border ${
                          drawCount === n
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {n}人
                      </button>
                    )
                  ))}
                </div>
              </div>

              <hr className="border-neutral-100" />

              {/* Duplicate modes */}
              <div>
                <label className="text-xs font-bold text-neutral-500 block mb-2">
                  抽籤過濾機制
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn_mode_no_repeat"
                    type="button"
                    onClick={() => { playClick(); setNoRepeat(true); }}
                    className={`py-2 text-xs font-bold rounded-xl transition border flex flex-col items-center justify-center gap-1 ${
                      noRepeat
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>人員不得重複</span>
                    <span className="text-[10px] opacity-75 font-normal">(抽完即自籤桶剔除)</span>
                  </button>
                  <button
                    id="btn_mode_allow_repeat"
                    type="button"
                    onClick={() => { playClick(); setNoRepeat(false); }}
                    className={`py-2 text-xs font-bold rounded-xl transition border flex flex-col items-center justify-center gap-1 ${
                      !noRepeat
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>人員可重複</span>
                    <span className="text-[10px] opacity-75 font-normal">(每次均從完整名單抽取)</span>
                  </button>
                </div>
              </div>

              {/* Pool stats & dynamic gauges (Show purely in No-Repeat mode) */}
              {noRepeat && (
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-500">籤桶剩餘比例</span>
                    <span className="font-mono font-bold text-rose-500">
                      {remainingCount} / {totalCount} 人
                    </span>
                  </div>
                  
                  {/* Progress bar visualizer */}
                  <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-neutral-400 font-semibold">
                      已抽過 {drawnCountNumber} 人
                    </span>
                    <button
                      id="btn_reset_drawing_pool"
                      onClick={() => { playClick(); resetPool(); }}
                      className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1 hover:underline transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      重設籤桶
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* History records */}
        <div id="draw_history_panel" className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-neutral-100 p-2 rounded-xl text-neutral-600">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-neutral-800">本節抽選紀錄</h2>
            </div>
            {drawnHistory.length > 0 && (
              <button
                id="btn_clear_draw_history"
                onClick={() => { playClick(); setDrawnHistory([]); }}
                className="text-xs text-neutral-400 hover:text-red-500 transition font-bold"
              >
                清除紀錄
              </button>
            )}
          </div>

          <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {drawnHistory.length === 0 ? (
              <p className="text-center text-xs text-neutral-400 py-6">尚無抽選紀錄</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {drawnHistory.map((student, idx) => (
                  <div 
                    key={idx} 
                    className="bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-150 flex items-center gap-1.5 text-xs text-neutral-700 font-semibold shadow-sm"
                  >
                    <span className="bg-neutral-200/60 font-mono w-4 h-4 rounded-full text-[10px] inline-flex items-center justify-center text-neutral-500 shrink-0">
                      {drawnHistory.length - idx}
                    </span>
                    <span>{student.name}</span>
                    {student.seatNumber && <span className="text-[10px] text-neutral-400 font-mono">#{student.seatNumber}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main active Drawing board (Right Area) */}
      <div id="draw_board_main" className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col justify-between min-h-[460px]">
        {/* Board Top indicator */}
        <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-neutral-800 font-sans tracking-wide">
              {currentRoster?.className} 🎒 隨機點名抽籤板
            </h3>
            <p className="text-xs text-neutral-400">登台發言、分派作答、小組挑戰！</p>
          </div>
          <div className="text-xs text-rose-500 font-bold bg-rose-50 px-2.5 py-1 rounded-full">
            ● 籤桶：{remainingCount} 人
          </div>
        </div>

        {/* Dynamic Canvas Container with animations */}
        <div className="flex-1 flex items-center justify-center py-8">
          {students.length === 0 ? (
            <div className="text-center max-w-sm space-y-3">
              <QuestionIcon className="w-16 h-16 text-neutral-300 mx-auto stroke-1 animate-pulse" />
              <h4 className="text-base font-bold text-neutral-600">目前沒有可抽取的學生</h4>
              <p className="text-xs text-neutral-450 leading-relaxed">
                欲使用隨機抽籤功能，請先進入 <strong>學生名單設定</strong> 建立或匯入學生名單。
              </p>
            </div>
          ) : isSpinning ? (
            /* Running ticker effect */
            <div className="space-y-6 text-center w-full max-w-xl">
              <div className="text-xs text-rose-400 font-extrabold tracking-widest animate-pulse">
                🎲 系統隨機滾動中，請保持神祕驚喜...
              </div>
              <div className="flex flex-wrap gap-4 justify-center items-center">
                {flashNames.map((name, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-neutral-800 text-white shadow-lg border-2 border-amber-400 rounded-2xl px-8 py-5 min-w-[140px] text-center"
                  >
                    <span className="text-2xl font-black font-sans tracking-wider block">
                      {name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : currentDrawResults.length > 0 ? (
            /* Results Presentation */
            <div className="space-y-6 text-center w-full max-w-xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-sm mb-2"
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                恭喜抽中中籤生！
              </motion.div>

              <div className="flex flex-wrap gap-5 justify-center items-center">
                <AnimatePresence>
                  {currentDrawResults.map((student, i) => (
                    <motion.div
                      key={student.id}
                      initial={{ scale: 0.5, y: 30, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.15, type: 'spring', stiffness: 120 }}
                      className="bg-gradient-to-br from-amber-500 via-rose-500 to-rose-600 text-white rounded-3xl p-0.5 shadow-xl min-w-[180px] text-center relative overflow-hidden group hover:scale-105 transition-transform"
                    >
                      {/* Grid background mask for luxury card feeling */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:10px_10px]" />
                      
                      <div className="bg-neutral-900/90 rounded-[22px] px-6 py-8 relative z-10 space-y-2">
                        {student.seatNumber && (
                          <span className="inline-block bg-white/10 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                            座號 #{student.seatNumber}
                          </span>
                        )}
                        <h4 className="text-3xl font-black tracking-widest text-amber-300 drop-shadow-md">
                          {student.name}
                        </h4>
                        <div className="text-[11px] text-neutral-300 font-bold">
                          {student.gender === 'M' ? '男生 ♂' : student.gender === 'F' ? '女生 ♀' : '中籤學生'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Idle Ready board */
            <div className="text-center space-y-4">
              <div className="bg-rose-50 text-rose-500 p-4 rounded-full inline-flex items-center justify-center animate-bounce mb-2">
                <Award className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-extrabold text-neutral-700">準備抽取好幸運學生</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                點擊下方按鈕，系統將以活潑滾動動畫隨機抽取名單內的幸運同學！
              </p>
            </div>
          )}
        </div>

        {/* Trigger Button bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-100 justify-center">
          {students.length > 0 && (
            <button
              id="btn_trigger_lucky_draw"
              disabled={isSpinning || (noRepeat && undrawnIds.length === 0)}
              onClick={startDraw}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 disabled:opacity-50 disabled:pointer-events-none hover:opacity-95 text-white text-lg font-black tracking-wider px-10 py-4 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Shuffle className="w-5 h-5 animate-spin-slow" />
              {isSpinning 
                ? '滾動中...' 
                : noRepeat && undrawnIds.length === 0 
                ? '籤桶已空' 
                : `隨機抽取 ${Math.min(drawCount, noRepeat ? undrawnIds.length : students.length)} 人`}
            </button>
          )}

          {noRepeat && undrawnIds.length === 0 && students.length > 0 && (
            <button
              id="btn_reset_draw_trigger"
              onClick={() => { playClick(); resetPool(); }}
              className="w-full sm:w-auto bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-black px-6 py-4 rounded-2xl text-sm transition"
            >
              重置籤桶重新開始
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
