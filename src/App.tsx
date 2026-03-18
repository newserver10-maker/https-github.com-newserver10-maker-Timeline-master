import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Copy, XCircle, UploadCloud } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  duration: number;
}

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async (files: FileList) => {
    const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
    if (audioFiles.length === 0) {
      alert('오디오 파일만 추가할 수 있습니다.');
      return;
    }

    const newTracks: Track[] = [];
    for (const file of audioFiles) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const duration = await getAudioDuration(file);
      newTracks.push({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        name: cleanName,
        duration
      });
    }

    setTracks(prev => {
      const combined = [...prev, ...newTracks];
      return combined.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const audio = new Audio(objectUrl);
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      });
    });
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    if (hours > 0) {
      const paddedHours = String(hours).padStart(2, '0');
      return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  const updateTrackName = (id: string, newName: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const deleteTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const clearAll = () => {
    setTracks([]);
  };

  // Calculate timeline text and total duration
  let currentTotalSeconds = 0;
  let timelineText = '';
  const emojis = ['🎵', '🎶', '🎧', '💿', '🎸', '🎹', '✨', '💖'];

  tracks.forEach((track, index) => {
    const emoji = emojis[index % emojis.length];
    const startTime = formatTime(currentTotalSeconds);
    timelineText += `${emoji} ${startTime} ${track.name}\n`;
    currentTotalSeconds += track.duration;
  });
  timelineText = timelineText.trim();
  const totalDurationText = formatTime(currentTotalSeconds);

  const copyToClipboard = async () => {
    if (!timelineText) {
      alert('복사할 타임라인이 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(timelineText);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = timelineText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333333] flex justify-center p-10 font-sans">
      <div className="bg-white w-full max-w-[800px] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-8 flex flex-col gap-6 relative">
        <h1 className="text-2xl font-bold text-center text-[#1a1a1a]">음악 플레이리스트 타임라인 마스터</h1>
        
        {/* Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors relative ${isDragging ? 'border-[#FF0000] bg-[#fff5f5]' : 'border-[#cccccc] bg-[#fafafa] hover:border-[#FF0000] hover:bg-[#fff5f5]'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadCloud className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <p className="text-[#666666] font-medium pointer-events-none text-base">이곳에 음악 파일들을 끌어다 놓거나 클릭하여 추가하세요</p>
          <input 
            type="file" 
            ref={fileInputRef}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            accept="audio/*" 
            multiple 
            onChange={handleFileChange}
          />
        </div>

        {/* Track List */}
        <div className="max-h-[350px] overflow-y-auto border border-[#eeeeee] rounded-lg bg-[#fafafa]">
          {tracks.length === 0 ? (
            <div className="p-10 text-center text-[#999999] text-[15px]">추가된 음악 파일이 없습니다.</div>
          ) : (
            <ul className="list-none m-0 p-0">
              {tracks.map(track => (
                <li key={track.id} className="flex items-center p-3 px-4 bg-white border-b border-[#eeeeee] hover:bg-[#f9f9f9] transition-colors last:border-b-0">
                  <input 
                    type="text" 
                    value={track.name}
                    onChange={(e) => updateTrackName(track.id, e.target.value)}
                    className="flex-grow border border-transparent px-3 py-2 text-[15px] rounded-md outline-none focus:border-[#FF0000] focus:bg-white bg-transparent transition-colors"
                  />
                  <span className="text-[14px] text-[#888888] mx-4 tabular-nums min-w-[45px] text-right">
                    {formatTime(track.duration)}
                  </span>
                  <button 
                    onClick={() => deleteTrack(track.id)}
                    className="bg-transparent border border-[#dddddd] text-[#666666] hover:text-[#FF0000] hover:bg-[#ffeeee] px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:border-[#FF0000]"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Total Duration */}
        <div className="text-right text-[#FF0000] font-semibold text-[15px] -mt-2">
          총 재생 시간: {totalDurationText}
        </div>

        {/* Result Area */}
        <div className="flex flex-col gap-2">
          <label className="text-[15px] font-semibold text-[#444444]">타임라인 결과</label>
          <textarea 
            readOnly 
            value={timelineText}
            placeholder="파일을 추가하면 타임라인이 이곳에 자동 생성됩니다."
            className="w-full h-[200px] p-4 border border-[#dddddd] rounded-lg resize-y font-mono text-[15px] leading-relaxed outline-none focus:border-[#FF0000] bg-[#fafafa] focus:bg-white transition-colors text-[#333333]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button 
            onClick={clearAll}
            className="flex-1 bg-[#f1f3f5] hover:bg-[#e9ecef] text-[#495057] border border-[#ced4da] py-4 px-6 rounded-lg font-semibold text-[16px] transition-colors flex justify-center items-center gap-2 active:scale-98"
          >
            <XCircle className="w-5 h-5" />
            전체 지우기
          </button>
          <button 
            onClick={copyToClipboard}
            className="flex-1 bg-[#FF0000] hover:bg-[#cc0000] text-white py-4 px-6 rounded-lg font-semibold text-[16px] transition-colors flex justify-center items-center gap-2 active:scale-98"
          >
            <Copy className="w-5 h-5" />
            전체 텍스트 복사하기
          </button>
        </div>

        {/* Tooltip */}
        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#333333] text-white px-6 py-3 rounded-full text-[15px] font-medium shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 z-[1000] ${showTooltip ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-5 invisible'}`}>
          복사되었습니다!
        </div>
      </div>
    </div>
  );
}
