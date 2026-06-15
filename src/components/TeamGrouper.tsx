import React, { useState } from 'react';
import { Student, ClassRoster, TeamGroup, GroupingMethod, BalancingMode } from '../types';
import { 
  Users, 
  Settings, 
  HelpCircle, 
  Printer, 
  Copy, 
  Check, 
  RefreshCw,
  ArrowRightLeft,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import { playClick, playSuccess } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface TeamGrouperProps {
  currentRoster: ClassRoster;
}

// 12 beautiful thematic emojis and matching warm, modern pastel colors for group cards
const GROUP_THEMES = [
  { color: 'border-emerald-200 bg-emerald-50/40 text-emerald-800', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', emoji: '🦊' },
  { color: 'border-blue-200 bg-blue-50/40 text-blue-800', badge: 'bg-blue-100 text-blue-800 border-blue-300', emoji: '🐼' },
  { color: 'border-pink-200 bg-pink-50/40 text-pink-800', badge: 'bg-pink-100 text-pink-800 border-pink-300', emoji: '🐨' },
  { color: 'border-amber-200 bg-amber-50/40 text-amber-800', badge: 'bg-amber-100 text-amber-800 border-amber-300', emoji: '🦁' },
  { color: 'border-purple-200 bg-purple-50/40 text-purple-800', badge: 'bg-purple-100 text-purple-800 border-purple-300', emoji: '🦉' },
  { color: 'border-teal-200 bg-teal-50/40 text-teal-800', badge: 'bg-teal-100 text-teal-800 border-teal-300', emoji: '🐙' },
  { color: 'border-rose-200 bg-rose-50/40 text-rose-800', badge: 'bg-rose-100 text-rose-800 border-rose-300', emoji: '🦄' },
  { color: 'border-cyan-200 bg-cyan-50/40 text-cyan-800', badge: 'bg-cyan-100 text-cyan-800 border-cyan-300', emoji: '🐬' },
  { color: 'border-orange-200 bg-orange-50/40 text-orange-800', badge: 'bg-orange-100 text-orange-800 border-orange-300', emoji: '🐿️' },
  { color: 'border-indigo-200 bg-indigo-50/40 text-indigo-800', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', emoji: '🦘' },
  { color: 'border-violet-200 bg-violet-50/40 text-violet-800', badge: 'bg-violet-100 text-violet-800 border-violet-300', emoji: '🦕' },
  { color: 'border-lime-200 bg-lime-50/40 text-lime-800', badge: 'bg-lime-100 text-lime-800 border-lime-300', emoji: '🦚' }
];

export default function TeamGrouper({ currentRoster }: TeamGrouperProps) {
  const students = currentRoster?.students || [];

  const [groupingMethod, setGroupingMethod] = useState<GroupingMethod>('byGroupCount');
  const [targetCount, setTargetCount] = useState<number>(4); // Default to 4 groups/4 members
  const [balanceMode, setBalanceMode] = useState<BalancingMode>('none');
  
  // Active grouping result state
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Manual interactive student dragging/swapping state
  // Supports mouse-less tap click selection, which works perfectly on mobile & classroom projectors!
  const [selectedSeat, setSelectedSeat] = useState<{
    studentId: string;
    groupId: string;
  } | null>(null);

  // Core smart grouping algorithm
  const generateGroups = () => {
    if (students.length === 0) return;
    playClick();

    let finalGroupCount = 4;
    if (groupingMethod === 'byGroupCount') {
      finalGroupCount = targetCount;
    } else {
      // "By member count": e.g., 5 students per group
      // Total 30 students / 5 = 6 groups
      // Round to ensure we don't have extremely uneven distributions
      if (targetCount <= 0) return;
      finalGroupCount = Math.max(1, Math.ceil(students.length / targetCount));
    }

    // Limit maximum groups to 12
    finalGroupCount = Math.min(12, finalGroupCount);

    // Prepare group template buckets
    const generatedGroups: TeamGroup[] = Array.from({ length: finalGroupCount }, (_, idx) => {
      const theme = GROUP_THEMES[idx % GROUP_THEMES.length];
      return {
        id: `gp_${idx}_${Date.now()}`,
        name: `第 ${idx + 1} 組`,
        avatar: theme.emoji,
        color: theme.color,
        students: []
      };
    });

    let poolStudents = [...students];

    // Shuffle algorithm
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    if (balanceMode === 'gender') {
      // Smart balance: split candidates, shuffle, distribute round-robin
      const boys = shuffleArray(poolStudents.filter(s => s.gender === 'M'));
      const girls = shuffleArray(poolStudents.filter(s => s.gender === 'F'));
      const unknown = shuffleArray(poolStudents.filter(s => s.gender === 'unknown'));

      // Draw round-robin
      let curGpIdx = 0;
      boys.forEach(b => {
        generatedGroups[curGpIdx % finalGroupCount].students.push(b);
        curGpIdx++;
      });
      girls.forEach(g => {
        generatedGroups[curGpIdx % finalGroupCount].students.push(g);
        curGpIdx++;
      });
      unknown.forEach(u => {
        generatedGroups[curGpIdx % finalGroupCount].students.push(u);
        curGpIdx++;
      });
    } else {
      // Simple fully random partition
      const shuffled = shuffleArray(poolStudents);
      shuffled.forEach((student, idx) => {
        generatedGroups[idx % finalGroupCount].students.push(student);
      });
    }

    setGroups(generatedGroups);
    setSelectedSeat(null);
    playSuccess();
  };

  // Interactive Student Move/Swap handler (glowing select-click interface)
  const handleStudentClick = (studentId: string, groupId: string) => {
    playClick();

    if (!selectedSeat) {
      // 1st Select
      setSelectedSeat({ studentId, groupId });
    } else {
      // 2nd Select: Swap!
      if (selectedSeat.studentId === studentId) {
        // Cancel if same student is tapped
        setSelectedSeat(null);
        return;
      }

      // Perform deep nested swapping
      const updatedGroups = groups.map(gp => {
        let newStudents = [...gp.students];
        
        // Find if this group has our active clicks
        const isSourceGroup = gp.id === selectedSeat.groupId;
        const isDestGroup = gp.id === groupId;

        if (isSourceGroup && isDestGroup) {
          // If within the SAME group, we just swap their visual positions or leave as-is
          // No actual crossover needed
        } else {
          if (isSourceGroup) {
            // Replace the selected student with the target student
            const targetStudent = groups.find(g => g.id === groupId)!.students.find(s => s.id === studentId)!;
            newStudents = newStudents.map(s => s.id === selectedSeat.studentId ? targetStudent : s);
          }
          if (isDestGroup) {
            // Replace the target student with the selected student
            const sourceStudent = groups.find(g => g.id === selectedSeat.groupId)!.students.find(s => s.id === selectedSeat.studentId)!;
            newStudents = newStudents.map(s => s.id === studentId ? sourceStudent : s);
          }
        }
        return { ...gp, students: newStudents };
      });

      setGroups(updatedGroups);
      setSelectedSeat(null);
      playSuccess();
    }
  };

  // Click group head or whitespace to direct-move a student to that group (no swap)
  const handleMoveToGroup = (destGroupId: string) => {
    if (!selectedSeat) return;
    if (selectedSeat.groupId === destGroupId) {
      setSelectedSeat(null);
      return;
    }
    
    playClick();

    // Remove student from old group and push to new group
    const sourceStudent = groups
      .find(g => g.id === selectedSeat.groupId)!
      .students.find(s => s.id === selectedSeat.studentId)!;

    const updatedGroups = groups.map(gp => {
      if (gp.id === selectedSeat.groupId) {
        return {
          ...gp,
          students: gp.students.filter(s => s.id !== selectedSeat.studentId)
        };
      }
      if (gp.id === destGroupId) {
        return {
          ...gp,
          students: [...gp.students, sourceStudent]
        };
      }
      return gp;
    });

    setGroups(updatedGroups);
    setSelectedSeat(null);
    playSuccess();
  };

  // Clipboard copy formatter
  const handleCopyToClipboard = () => {
    if (groups.length === 0) return;
    playClick();

    let textOut = `🎒 【${currentRoster?.className}】 視覺化隨機分組名單 🎒\n\n`;
    groups.forEach(gp => {
      const names = gp.students.map(s => s.name + (s.seatNumber ? `(#${s.seatNumber})` : '')).join('、');
      textOut += `${gp.avatar} ${gp.name} (${gp.students.length}人): ${names}\n`;
    });

    navigator.clipboard.writeText(textOut).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Trigger web print
  const handlePrint = () => {
    playClick();
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
      {/* Grouping configurations panel (Left) */}
      <div className="lg:col-span-4 space-y-6 print:hidden">
        <div id="group_setting_panel" className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <h2 className="text-lg font-bold text-neutral-800">隨機分組設定</h2>
          </div>

          {students.length === 0 ? (
            <div className="py-6 text-center text-neutral-400 text-xs">
              ⚠️ 尚無學生名冊，請先到「學生名單設定」新增名冊！
            </div>
          ) : (
            <div className="space-y-5">
              {/* Partition method choices */}
              <div>
                <label className="text-xs font-bold text-neutral-500 block mb-2">
                  分組模式基準
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn_group_by_count"
                    type="button"
                    onClick={() => {
                      playClick();
                      setGroupingMethod('byGroupCount');
                      setTargetCount(4);
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition border flex flex-col items-center justify-center gap-0.5 ${
                      groupingMethod === 'byGroupCount'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>固定分幾組</span>
                    <span className="text-[10px] opacity-75 font-normal">(例: 班級平分成4組)</span>
                  </button>
                  <button
                    id="btn_group_by_size"
                    type="button"
                    onClick={() => {
                      playClick();
                      setGroupingMethod('byMemberCount');
                      setTargetCount(5);
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition border flex flex-col items-center justify-center gap-0.5 ${
                      groupingMethod === 'byMemberCount'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>指定每組人數</span>
                    <span className="text-[10px] opacity-75 font-normal">(例: 每 5 人為一組)</span>
                  </button>
                </div>
              </div>

              {/* Slider for count selection */}
              <div>
                <label className="text-xs font-bold text-neutral-500 block mb-1.5">
                  {groupingMethod === 'byGroupCount' ? '目標總組數：' : '每組理想人數：'}{' '}
                  <span className="text-emerald-600 font-extrabold text-base font-mono">{targetCount}</span> {groupingMethod === 'byGroupCount' ? '組' : '人'}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 font-bold font-mono">
                    {groupingMethod === 'byGroupCount' ? '2' : '1'}
                  </span>
                  <input
                    id="group_target_count_slider"
                    type="range"
                    min={groupingMethod === 'byGroupCount' ? '2' : '1'}
                    max={groupingMethod === 'byGroupCount' ? '12' : Math.min(15, students.length)}
                    value={targetCount}
                    onChange={(e) => {
                      playClick();
                      setTargetCount(parseInt(e.target.value));
                    }}
                    className="flex-1 accent-emerald-500 h-2 bg-neutral-100 rounded-lg cursor-pointer appearance-none"
                  />
                  <span className="text-xs text-neutral-400 font-bold font-mono">
                    {groupingMethod === 'byGroupCount' ? '12' : Math.min(15, students.length)}
                  </span>
                </div>
              </div>

              <hr className="border-neutral-100" />

              {/* Smart gender balancing tool! */}
              <div>
                <label className="text-xs font-bold text-neutral-500 block mb-2">
                  智慧平衡分組模式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn_balance_none"
                    type="button"
                    onClick={() => { playClick(); setBalanceMode('none'); }}
                    className={`py-2 text-xs font-bold rounded-xl transition border flex flex-col items-center justify-center ${
                      balanceMode === 'none'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>完全隨機</span>
                  </button>
                  <button
                    id="btn_balance_gender"
                    type="button"
                    onClick={() => { playClick(); setBalanceMode('gender'); }}
                    className={`py-2 text-xs font-bold rounded-xl transition border flex flex-col items-center justify-center gap-0.5 ${
                      balanceMode === 'gender'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span>平衡男女比例 ⚖️</span>
                    <span className="text-[9px] opacity-75 font-normal">(依性別欄位合理均分)</span>
                  </button>
                </div>

                <div className="mt-3 bg-neutral-50 rounded-xl p-3 text-[11px] text-neutral-450 leading-relaxed border border-neutral-100 flex gap-1.5">
                  <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>對稱機制提示：</strong>
                    {groupingMethod === 'byGroupCount' ? (
                      <span>
                        名冊內有 {students.length} 位學生，將自動分成 <strong>{targetCount} 組</strong>，每組約為{' '}
                        <strong>{Math.floor(students.length / targetCount)} ~ {Math.ceil(students.length / targetCount)} 人</strong>。
                      </span>
                    ) : (
                      <span>
                        每組預計 {targetCount} 人。總人數 {students.length} 人，將產生 حوالي{' '}
                        <strong>{Math.max(1, Math.ceil(students.length / targetCount))} 組</strong>，並將學生尺寸和諧化均分。
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                id="btn_shuffle_grouping"
                onClick={generateGroups}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition duration-200 shadow-md active:scale-95"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                立即隨機分組
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Drag-and-swap guidelines explanation */}
        {groups.length > 0 && (
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/50 text-xs text-amber-800 space-y-1.5 leading-relaxed">
            <h4 className="font-bold flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
              電子白板／觸控螢幕微調小技巧：
            </h4>
            <p>
              若分組不夠滿意，您可以 <strong>點選任一學生姓名</strong>（會呈現綠色外框），再 <strong>點選另一學生姓名</strong> 來 <strong>快速對調位置</strong>！
            </p>
            <p>
              或者，點選學生後，<strong>點選其他組的標題或空白處</strong>，即可將該學生 <strong>直接搬移</strong> 到該組！
            </p>
          </div>
        )}
      </div>

      {/* Group rendering Workspace (Right / Print Layout) */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        {/* Actions header tool */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex justify-between items-center print:hidden">
          <div>
            <h3 className="text-sm font-extrabold text-neutral-800">
              分組成果視覺看板
            </h3>
            <p className="text-xs text-neutral-400">支援快速微調、複製與 A4 列印</p>
          </div>

          {groups.length > 0 && (
            <div className="flex gap-2">
              <button
                id="btn_copy_group_text"
                onClick={handleCopyToClipboard}
                className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 transition flex items-center gap-1"
                title="複製文字名冊"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已複製！' : '複製分組'}
              </button>
              <button
                id="btn_print_groups"
                onClick={handlePrint}
                className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 transition flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                列印 A4
              </button>
            </div>
          )}
        </div>

        {/* Group visualization panel results */}
        <div id="group_output_workspace" className="flex-1 min-h-[420px]">
          {groups.length === 0 ? (
            <div className="h-full bg-white rounded-2xl border border-neutral-100 flex flex-col justify-center items-center py-16 text-neutral-400 text-center">
              <div className="bg-neutral-50 text-neutral-300 p-4 rounded-full mb-3">
                <Users className="w-12 h-12 stroke-1" />
              </div>
              <h4 className="text-base font-bold text-neutral-600">尚未產生分組名冊</h4>
              <p className="text-xs text-neutral-400 max-w-[320px] mt-1">
                請在左側選擇合適的分組模式與進階過濾器，點選【立即隨機分組】！
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:text-black">
              <AnimatePresence mode="popLayout">
                {groups.map((group, gIdx) => {
                  const mCount = group.students.filter(s => s.gender === 'M').length;
                  const fCount = group.students.filter(s => s.gender === 'F').length;
                  
                  // Double check if the selected candidate is in this source group
                  const isSelectedInsideThisGroup = selectedSeat?.groupId === group.id;

                  return (
                    <motion.div
                      key={group.id}
                      id={`group_card_${group.id}`}
                      layout
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 100 }}
                      onClick={() => {
                        // If we have selected student from ANOTHER group, clicking this group container moves that student here
                        if (selectedSeat && selectedSeat.groupId !== group.id) {
                          handleMoveToGroup(group.id);
                        }
                      }}
                      className={`rounded-2xl border-2 p-4 flex flex-col justify-between shadow-sm hover:shadow transition duration-150 relative group ${group.color} cursor-pointer ${
                        selectedSeat && selectedSeat.groupId !== group.id ? 'hover:border-amber-400 hover:bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Group Header */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl print:text-base leading-none bg-white p-1 rounded-lg border border-neutral-200/50 shadow-sm">
                            {group.avatar}
                          </span>
                          <h4 className="font-sans font-black text-sm print:text-xs">
                            {group.name}
                          </h4>
                        </div>
                        
                        {/* Status detail badges */}
                        <div className="flex items-center gap-1.5">
                          {/* Boys & Girls ratio summary tool */}
                          {(mCount > 0 || fCount > 0) && (
                            <span className="text-[10px] bg-white/65 px-1.5 py-0.5 rounded-md border text-neutral-500 font-mono scale-95">
                              {mCount > 0 && `♂${mCount}`} {fCount > 0 && `♀${fCount}`}
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold bg-white text-neutral-800 border px-2 py-0.5 rounded-full scale-95 shrink-0">
                            {group.students.length} 人
                          </span>
                        </div>
                      </div>

                      {/* Group members list */}
                      <div className="space-y-2 mt-1 flex-1">
                        {group.students.length === 0 ? (
                          <div className="py-6 border-2 border-dashed border-neutral-200/40 rounded-xl text-center text-xs text-neutral-400 font-medium">
                            👻 放空組（無成員）
                            <br />
                            <span className="text-[10px] opacity-75">點選他組學生按此可放入</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            {group.students.map((student) => {
                              const isThisStudentSelected = selectedSeat?.studentId === student.id;

                              return (
                                <div
                                  key={student.id}
                                  id={`student_seat_${student.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Avoid triggering group-level moves
                                    handleStudentClick(student.id, group.id);
                                  }}
                                  className={`rounded-xl px-2.5 py-2 flex items-center justify-between border cursor-pointer select-none transition duration-150 relative ${
                                    isThisStudentSelected
                                      ? 'bg-amber-500 text-white border-amber-600 scale-95 font-bold shadow-md animate-pulse ring-2 ring-amber-400'
                                      : 'bg-white hover:bg-amber-50 text-neutral-800 border-neutral-200/80 shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      isThisStudentSelected 
                                        ? 'bg-white' 
                                        : student.gender === 'M' 
                                        ? 'bg-blue-400' 
                                        : student.gender === 'F' 
                                        ? 'bg-pink-400' 
                                        : 'bg-neutral-300'
                                    }`} />
                                    <span className="text-xs font-bold truncate leading-tight">
                                      {student.name}
                                    </span>
                                  </div>
                                  
                                  {student.seatNumber && (
                                    <span className={`text-[9px] font-mono shrink-0 pr-0.5 ${
                                      isThisStudentSelected ? 'text-amber-200' : 'text-neutral-400'
                                    }`}>
                                      #{student.seatNumber}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
