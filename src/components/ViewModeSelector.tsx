import { LayoutList, LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'list' | 'grid' | 'compact';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export default function ViewModeSelector({ currentMode, onModeChange }: ViewModeSelectorProps) {
  const modes: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
    { value: 'list', icon: <LayoutList size={18} />, label: 'List View' },
    { value: 'grid', icon: <LayoutGrid size={18} />, label: 'Grid View' },
    { value: 'compact', icon: <List size={18} />, label: 'Compact View' }
  ];

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onModeChange(mode.value)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
            currentMode === mode.value
              ? 'bg-orange-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title={mode.label}
        >
          {mode.icon}
          <span className="text-sm font-medium hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
