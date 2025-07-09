/**
 * Reusable component for rendering a group of action buttons (e.g., Approve, Decline, etc.).
 * Each action can have a label, icon, click handler, and optional color/disabled state.
 */
import React from 'react';
import { Button } from '@/features/shared';

/**
 * Represents a single action button's configuration.
 */
interface Action {
  label: string;
  onClick: () => void;
  icon: React.ElementType;
  colorClass?: string;
  disabled?: boolean;
}

/**
 * Props for the ActionButtons component.
 */
interface ActionButtonsProps {
  actions: Action[];
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ actions }) => (
  <div className="flex items-center gap-1">
    {actions.map(({ label, onClick, icon: Icon, colorClass = '', disabled }, idx) => (
      <Button
        key={label + idx}
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 touch-manipulation ${colorClass}`}
        onClick={onClick}
        disabled={disabled}
        title={label}
      >
        <Icon className="h-4 w-4" />
      </Button>
    ))}
  </div>
); 