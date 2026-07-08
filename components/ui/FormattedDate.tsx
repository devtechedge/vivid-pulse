import React, { useState, useEffect } from 'react';

interface FormattedDateProps {
  date: string | Date;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  showTime?: boolean;
}

export const FormattedDate: React.FC<FormattedDateProps> = ({
  date,
  dateStyle = 'medium',
  timeStyle = 'short',
  showTime = true,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return empty space or placeholder to match server rendering exactly
    return <span className="opacity-0">Loading...</span>;
  }

  try {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = showTime
      ? { dateStyle, timeStyle }
      : { dateStyle };
    return <span suppressHydrationWarning>{d.toLocaleString([], options)}</span>;
  } catch (error) {
    return <span suppressHydrationWarning>{String(date)}</span>;
  }
};
