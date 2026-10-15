import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/Button.js';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-4 my-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-red-800">Error</h4>
        <p className="text-sm text-red-700 mt-0.5">{message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={onRetry} className="border-red-300 text-red-800 hover:bg-red-100">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
