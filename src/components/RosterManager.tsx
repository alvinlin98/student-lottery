import React, { useState, useRef } from 'react';
import { Student, ClassRoster } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  FileUp, 
  ClipboardPaste, 
  UserPlus, 
  X, 
  HelpCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { playClick, playSuccess } from '../utils/audio';

interface RosterManagerProps {
  rosters: ClassRoster[];
  currentRosterId: string;
  onSelectRoster: (id: string) => void;
  onSaveRoster: (roster: ClassRoster) => void;
  onDeleteRoster: (id: string) => void;
  onCreateRoster: (className: string) => void;
}

export default function RosterManager({
  rosters,
  currentRosterId,
  onSelectRoster,
  onSaveRoster,
  onDeleteRoster,
  onCreateRoster,
}: RosterManagerProps) {
  const currentRoster = rosters.find(r => r.id === currentRosterId) || rosters[0];
  
  const [newClassName, setNewClassName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteGender, setPasteGender] = useState<'M' | 'F' | 'unknown'>('unknown');
  
  // Single student manual add
  const [singleName, setSingleName] = useState('');
  const [singleGender, setSingleGender] = useState<'M' | 'F' | 'unknown'>('unknown');
  const [singleSeat, setSingleSeat] = useState('');

  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    playClick();
    onCreateRoster(newClassName.trim());
    setNewClassName('');
  };

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim() || !currentRoster) return;
    playClick();

    const newStudent: Student = {
      id: 'student_' + Date.now() + Math.random().toString(36).substr(2, 5),
      name: singleName.trim(),
      gender: singleGender,
      seatNumber: singleSeat.trim() || undefined
    };

    const updatedRoster: ClassRoster = {
      ...currentRoster,
      students: [...currentRoster.students, newStudent]
    };

    onSaveRoster(updatedRoster);
    setSingleName('');
    setSingleGender('unknown');
    setSingleSeat('');
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!currentRoster) return;
    playClick();
    const updatedRoster: ClassRoster = {
      ...currentRoster,
      students: currentRoster.students.filter(s => s.id !== studentId)
    };
    onSaveRoster(updatedRoster);
  };

  // Safe and comprehensive paste text parser
  const handlePasteSubmit = () => {
    if (!pasteText.trim() || !currentRoster) return;
    playClick();

    // Split by comma, space, newline, semicolon, dot, or ideographic character
    const rawTokens = pasteText.split(/[\n,，\s、;；|]+/);
    const parsedStudents: Student[] = [];

    rawTokens.forEach(token => {
      const cleaned = token.trim();
      if (!cleaned) return;

      // Smart details parser, e.g. "1號王大同(男)", "林小美(女)", "陳小明 [男]", "張三-男", "05 李四 M"
      // Match gender markers
      let gender: 'M' | 'F' | 'unknown' = 'unknown';
      let name = cleaned;
      let seatNumber: string | undefined = undefined;

      // Try extract gender in parenthesis or labels
      if (/[(（]男[)）]|\[男\]|-男/i.test(cleaned)) {
        gender = 'M';
        name = cleaned.replace(/[(（]男[)）]|\[男\]|-男/i, '');
      } else if (/[(（]女[)）]|\[女\]|-女/i.test(cleaned)) {
        gender = 'F';
        name = cleaned.replace(/[(（]女[)）]|\[女\]|-女/i, '');
      } else if (/[(（](M|Male)[)）]|\[M\]/i.test(cleaned)) {
        gender = 'M';
        name = cleaned.replace(/[(（](M|Male)[)）]|\[M\]/i, '');
      } else if (/[(（](F|Female)[)）]|\[F\]/i.test(cleaned)) {
        gender = 'F';
        name = cleaned.replace(/[(（](F|Female)[)）]|\[F\]/i, '');
      }

      // Try extract seat number from the prefix, e.g. "01號" or "2_" or "15." or "12"
      const numMatch = name.match(/^(\d+)(號|号|\.|_|\s|-)?/);
      if (numMatch) {
        seatNumber = numMatch[1];
        // Clean seat number prefix from name
        name = name.substring(numMatch[0].length).trim();
      }

      // Final sanitization of the name (remove wrapping dots, hyphens etc.)
      name = name.replace(/^[-_.\s]+|[-_.\s]+$/g, '').trim();

      if (name.length > 0) {
        parsedStudents.push({
          id: 'student_' + Date.now() + Math.random().toString(36).substr(2, 9),
          name,
          gender,
          seatNumber
        });
      }
    });

    if (parsedStudents.length > 0) {
      const updatedRoster: ClassRoster = {
        ...currentRoster,
        students: [...currentRoster.students, ...parsedStudents]
      };
      onSaveRoster(updatedRoster);
      playSuccess();
      setPasteText('');
    }
  };

  // File parsing (CSV & Text)
  const parseFileContent = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return;

    const parsedStudents: Student[] = [];
    let isCSV = text.includes(',') || text.includes(';');

    if (isCSV) {
      // Find separator
      const separator = text.includes(';') ? ';' : ',';
      
      // Parse CSV lines
      let headers: string[] = [];
      let nameIndex = -1;
      let genderIndex = -1;
      let seatIndex = -1;

      // Examine first 3 lines to detect headers
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const lineParts = lines[i].split(separator).map(s => s.trim().replace(/^["']|["']$/g, ''));
        
        // Look for keywords
        const tempNameIdx = lineParts.findIndex(p => p === '姓名' || p.toLowerCase() === 'name');
        const tempGenderIdx = lineParts.findIndex(p => p === '性別' || p === '性别' || p.toLowerCase() === 'gender' || p.toLowerCase() === 'sex');
        const tempSeatIdx = lineParts.findIndex(p => p === '座號' || p === '座号' || p === '學號' || p === '学号' || p.toLowerCase() === 'seat' || p.toLowerCase() === 'no' || p.toLowerCase() === 'id');

        if (tempNameIdx !== -1) {
          headers = lineParts;
          nameIndex = tempNameIdx;
          genderIndex = tempGenderIdx;
          seatIndex = tempSeatIdx;
          // Splice headers from rows to parse
          lines.splice(i, 1);
          break;
        }
      }

      // If headers not found, guess position: 
      // index 0 = seat number (if numeric), index 1 = name, index 2 = gender (if 男/女/M/F)
      if (nameIndex === -1) {
        // Let's inspect first non-empty line
        const testLine = lines.find(l => l.trim().length > 0);
        if (testLine) {
          const parts = testLine.split(separator).map(p => p.trim());
          if (parts.length === 1) {
            nameIndex = 0;
          } else if (parts.length === 2) {
            // Check if one is a number
            if (/^\d+$/.test(parts[0])) {
              seatIndex = 0;
              nameIndex = 1;
            } else {
              nameIndex = 0;
              // Check if parts[1] is gender
              if (/^[男女MF]$/i.test(parts[1])) {
                genderIndex = 1;
              }
            }
          } else {
            // standard layout: [seat, name, gender]
            if (/^\d+$/.test(parts[0])) {
              seatIndex = 0;
              nameIndex = 1;
              genderIndex = parts[2] ? 2 : -1;
            } else {
              nameIndex = 0;
              genderIndex = /^[男女MF]$/i.test(parts[1]) ? 1 : (/^[男女MF]$/i.test(parts[2]) ? 2 : -1);
            }
          }
        }
      }

      // Read rows
      lines.forEach(line => {
        if (!line.trim()) return;
        const row = line.split(separator).map(s => s.trim().replace(/^["']|["']$/g, ''));
        
        const name = row[nameIndex !== -1 ? nameIndex : 0];
        if (!name) return;

        let gender: 'M' | 'F' | 'unknown' = 'unknown';
        if (genderIndex !== -1 && row[genderIndex]) {
          const gVal = row[genderIndex].toLowerCase();
          if (gVal.startsWith('男') || gVal.startsWith('m')) {
            gender = 'M';
          } else if (gVal.startsWith('女') || gVal.startsWith('f')) {
            gender = 'F';
          }
        }

        let seatNumber = seatIndex !== -1 ? row[seatIndex] : undefined;

        parsedStudents.push({
          id: 'student_' + Date.now() + Math.random().toString(36).substr(2, 9),
          name,
          gender,
          seatNumber
        });
      });

    } else {
      // Normal flat txt file: one name per line
      lines.forEach(line => {
        const cleaned = line.trim();
        if (!cleaned) return;
        
        let gender: 'M' | 'F' | 'unknown' = 'unknown';
        let name = cleaned;
        let seatNumber: string | undefined = undefined;

        // Try extract gender in parenthesis
        if (/[(（]男[)）]|\[男\]|-男/i.test(cleaned)) {
          gender = 'M';
          name = cleaned.replace(/[(（]男[)）]|\[男\]|-男/i, '');
        } else if (/[(（]女[)）]|\[女\]|-女/i.test(cleaned)) {
          gender = 'F';
          name = cleaned.replace(/[(（]女[)）]|\[女\]|-女/i, '');
        }

        // Try extract seat number
        const numMatch = name.match(/^(\d+)(號|号|\.|_|\s|-)?/);
        if (numMatch) {
          seatNumber = numMatch[1];
          name = name.substring(numMatch[0].length).trim();
        }

        name = name.replace(/^[-_.\s]+|[-_.\s]+$/g, '').trim();

        if (name.length > 0) {
          parsedStudents.push({
            id: 'student_' + Date.now() + Math.random().toString(36).substr(2, 9),
            name,
            gender,
            seatNumber
          });
        }
      });
    }

    if (parsedStudents.length > 0 && currentRoster) {
      const updatedRoster: ClassRoster = {
        ...currentRoster,
        students: [...currentRoster.students, ...parsedStudents]
      };
      onSaveRoster(updatedRoster);
      playSuccess();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseFileContent(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseFileContent(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleClearRoster = () => {
    if (!currentRoster) return;
    if (confirm(`確定要清除【${currentRoster.className}】內的所有學生嗎？`)) {
      playClick();
      onSaveRoster({
        ...currentRoster,
        students: []
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* List controls & class selector (Left Card) */}
      <div className="lg:col-span-4 space-y-6">
        <div id="class_selector_panel" className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-neutral-800">班級名單選擇</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-2">
                當前選擇班級
              </label>
              <select
                id="roster_dropdown"
                value={currentRosterId}
                onChange={(e) => {
                  playClick();
                  onSelectRoster(e.target.value);
                }}
                className="w-full bg-neutral-50 hover:bg-neutral-100 transition border border-neutral-200 text-neutral-800 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {rosters.map((roster) => (
                  <option key={roster.id} value={roster.id}>
                    {roster.className} ({roster.students.length}人)
                  </option>
                ))}
              </select>
            </div>

            <hr className="border-neutral-100" />

            {/* Create new class form */}
            <form onSubmit={handleCreateClass} className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-500">
                新增一個班級名冊
              </label>
              <div className="flex gap-2">
                <input
                  id="new_class_input"
                  type="text"
                  placeholder="例: 三年甲班"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                <button
                  id="btn_create_class"
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 active:scale-95 transition text-white px-3.5 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  新增
                </button>
              </div>
            </form>

            {/* Rename / Delete Actions */}
            {rosters.length > 1 && (
              <div className="pt-2 flex justify-end">
                <button
                  id="btn_delete_roster"
                  onClick={() => {
                    const activeRoster = rosters.find(r => r.id === currentRosterId);
                    if (!activeRoster) return;
                    if (confirm(`確定要永久刪除班級【${activeRoster.className}】嗎？`)) {
                      playClick();
                      onDeleteRoster(currentRosterId);
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-red-50 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  刪除此班級名冊
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick manual child add */}
        <div id="student_add_panel" className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-neutral-800">手動安插學生</h2>
          </div>

          <form onSubmit={handleSingleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">
                  姓名 (必填)
                </label>
                <input
                  id="add_student_name"
                  type="text"
                  required
                  placeholder="姓名"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">
                  座號 (選填)
                </label>
                <input
                  id="add_student_seat"
                  type="text"
                  placeholder="座號 (如01)"
                  value={singleSeat}
                  onChange={(e) => setSingleSeat(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">
                性別 (選填，分組平衡用)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="btn_gender_unknown"
                  type="button"
                  onClick={() => { playClick(); setSingleGender('unknown'); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition border ${
                    singleGender === 'unknown'
                      ? 'bg-neutral-800 text-white border-neutral-800'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  未指定
                </button>
                <button
                  id="btn_gender_m"
                  type="button"
                  onClick={() => { playClick(); setSingleGender('M'); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition border ${
                    singleGender === 'M'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  男生 ♂
                </button>
                <button
                  id="btn_gender_f"
                  type="button"
                  onClick={() => { playClick(); setSingleGender('F'); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition border ${
                    singleGender === 'F'
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  女生 ♀
                </button>
              </div>
            </div>

            <button
              id="btn_add_student_submit"
              type="submit"
              disabled={!singleName.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none text-white font-bold py-2 px-4 rounded-xl text-sm flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-4 h-4" />
              新增至學生名冊
            </button>
          </form>
        </div>
      </div>

      {/* Roster database contents & import wizard (Right Column) */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        {/* Input/Importing Card */}
        <div id="list_inputs_panel" className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex border-b border-neutral-100 mb-4 pb-2 justify-between items-center">
            <div className="flex gap-4">
              <button
                id="tab_input_paste"
                onClick={() => { playClick(); setInputMode('paste'); }}
                className={`pb-2.5 text-sm font-bold border-b-2 transition flex items-center gap-1 ${
                  inputMode === 'paste'
                    ? 'text-amber-500 border-amber-500'
                    : 'text-neutral-400 border-transparent hover:text-neutral-600'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                貼上姓名文字
              </button>
              <button
                id="tab_input_upload"
                onClick={() => { playClick(); setInputMode('upload'); }}
                className={`pb-2.5 text-sm font-bold border-b-2 transition flex items-center gap-1 ${
                  inputMode === 'upload'
                    ? 'text-amber-500 border-amber-500'
                    : 'text-neutral-400 border-transparent hover:text-neutral-600'
                }`}
              >
                <FileUp className="w-4 h-4" />
                上傳名單檔案 (CSV/TXT)
              </button>
            </div>

            <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-lg">
              <Sparkles className="w-3 h-3" />
              <span>現加至: {currentRoster?.className}</span>
            </div>
          </div>

          {inputMode === 'paste' ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                  💡 <strong>智慧剖析</strong>：在下方框內輸入姓名。姓名之間可用 <strong>空格、換行、頓號、或英文逗號</strong> 區隔。
                  <br />
                  您也可以附帶座號與性別（例如：<code>01王小明(男)</code>、<code>02林小美(女)</code>），系統會自動偵測建立。
                </p>
                <textarea
                  id="paste_names_textarea"
                  rows={4}
                  placeholder={`請輸入或貼上學生名單，例如：
01陳大同 男, 02林小美 女, 張中強
李阿寶, 04黃小鴨(女)`}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="w-full bg-neutral-50 text-neutral-800 font-mono text-sm border border-neutral-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>
              <div className="flex justify-end">
                <button
                  id="btn_submit_parsed_names"
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  確認並批次追加
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                id="file_drop_zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  dragOver
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-150/40'
                }`}
              >
                <input
                  id="file_uploader_input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <FileUp className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-neutral-700">
                  將 CSV 或 TXT 檔案拖曳至此處，或點擊選擇檔案
                </p>
                <p className="text-xs text-neutral-400 mt-2">
                  支援 TXT (每行一個名字) 或 CSV 格式 (支援「姓名, 性別, 座號」欄位)
                </p>
              </div>

              <div className="bg-neutral-50 rounded-xl p-3.5 text-xs text-neutral-500 border border-neutral-100 flex gap-2">
                <HelpCircle className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-neutral-700 mb-0.5">CSV 範例格式：</h4>
                  <p className="font-mono bg-white inline-block px-1.5 py-0.5 rounded border border-neutral-200 mt-1">
                    座號, 姓名, 性別
                    <br />
                    1, 王大同, 男
                    <br />
                    2, 林小美, 女
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Existing students list container */}
        <div id="roster_contents_panel" className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-800 flex items-center gap-1.5">
                名單總覽
                <span className="bg-neutral-100 px-2 py-0.5 rounded-full text-xs font-semibold text-neutral-500">
                  {currentRoster?.students.length || 0} 人
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                班級：{currentRoster?.className}
              </p>
            </div>

            {currentRoster?.students.length > 0 && (
              <button
                id="btn_clear_roster"
                onClick={handleClearRoster}
                className="text-xs text-neutral-400 hover:text-red-500 transition px-2.5 py-1 rounded-lg hover:bg-red-50 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空名單
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[340px] pr-2 scrollbar-thin scrollbar-thumb-neutral-200">
            {currentRoster?.students.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center py-12 text-neutral-400 text-center">
                <Users className="w-10 h-10 mb-2 stroke-1" />
                <p className="text-sm font-semibold">此班級尚無學生名冊</p>
                <p className="text-xs mt-1 max-w-[280px]">
                  請在上方貼上姓名文字或上傳 CSV 檔案，以快速匯入學生名單。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {currentRoster?.students.map((student, idx) => (
                  <div
                    key={student.id}
                    className="group relative bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/60 rounded-xl px-3 py-2 pr-6 flex items-center gap-1.5 transition duration-150"
                  >
                    {/* Unique layout design for boy/girl */}
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      student.gender === 'M' 
                        ? 'bg-blue-400' 
                        : student.gender === 'F' 
                        ? 'bg-pink-400' 
                        : 'bg-neutral-300'
                    }`} />
                    
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-neutral-700 truncate leading-tight">
                        {student.name}
                      </div>
                      {student.seatNumber && (
                        <div className="text-[10px] font-mono font-medium text-neutral-400">
                          #{student.seatNumber}
                        </div>
                      )}
                    </div>

                    <button
                      id={`btn_delete_student_${student.id}`}
                      onClick={() => handleDeleteStudent(student.id)}
                      className="absolute right-1 leading-none opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-1 rounded transition duration-100"
                      title="刪除學生"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
