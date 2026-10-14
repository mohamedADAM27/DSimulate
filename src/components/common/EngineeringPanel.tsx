/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Reusable Engineering Panel
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

interface EngineeringPanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const EngineeringPanel: React.FC<EngineeringPanelProps> = ({
  title,
  subtitle,
  children,
  className = '',
  headerActions,
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col overflow-hidden ${className}`}>
      {/* Panel Header */}
      <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-[#5E666D] hover:text-[#20252A] p-0.5"
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <span className="text-[11.5px] font-semibold text-[#20252A] truncate tracking-tight">{title}</span>
          {subtitle && (
            <span className="text-[10px] text-[#7A8289] truncate hidden sm:inline">
              · {subtitle}
            </span>
          )}
        </div>

        {headerActions && (
          <div className="flex items-center gap-1">
            {headerActions}
          </div>
        )}
      </div>

      {/* Panel Body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto p-2">
          {children}
        </div>
      )}
    </div>
  );
};
