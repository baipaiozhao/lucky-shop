import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    setTransitionStage('fadeOut');
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage('fadeIn');
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      className={`page-transition ${transitionStage}`}
      style={{
        transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
        opacity: transitionStage === 'fadeIn' ? 1 : 0,
        transform: transitionStage === 'fadeIn' ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {displayChildren}
    </div>
  );
}
