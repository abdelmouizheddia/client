import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  goldEdge?: boolean;
}

export default function Card({ children, padded = true, goldEdge = false, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`glass-panel rounded-xl2 shadow-glass dark:shadow-glass-dark ${goldEdge ? 'gold-edge' : ''} ${
        padded ? 'p-5' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
