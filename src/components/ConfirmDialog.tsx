import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantColors = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-orange-500 hover:bg-orange-600',
    info: 'bg-blue-500 hover:bg-blue-600'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-start justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-500/20' : variant === 'warning' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
              <AlertTriangle className={variant === 'danger' ? 'text-red-500' : variant === 'warning' ? 'text-orange-500' : 'text-blue-500'} size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 ${variantColors[variant]} text-white rounded-lg font-semibold transition-colors`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
