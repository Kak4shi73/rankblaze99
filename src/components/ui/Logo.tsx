import { Zap } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-6 w-6" }) => {
  return (
    <div className={`${className} flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-gray-900`}>
      <Zap className="w-3/5 h-3/5" />
    </div>
  );
};

export default Logo;