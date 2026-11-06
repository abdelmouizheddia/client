import { initials } from '../../utils/format';

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = { 
  sm: 'h-8 w-8 text-xs', 
  md: 'h-10 w-10 text-sm', 
  lg: 'h-16 w-16 text-lg', 
  xl: 'h-24 w-24 text-2xl' 
};

export default function Avatar({ src, firstName, lastName, size = 'md' }: AvatarProps) {
  // الحل الاحترافي: دعم الصور القديمة (Render) والحديثة (Supabase)
  const API_URL = 'https://azzouz-gym-api.onrender.com';
  let imageUrl = src;
  
  if (src && src.startsWith('/')) {
    imageUrl = `${API_URL}${src}`;
  }

  return (
    <div className={`flex items-center justify-center rounded-full bg-navy-100 text-navy-600 dark:bg-white/10 dark:text-gold-200 font-display font-bold overflow-hidden shrink-0 ${sizeMap[size]}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={`${firstName || ''} ${lastName || ''}`} className="h-full w-full object-cover" />
      ) : (
        initials(firstName, lastName)
      )}
    </div>
  );
}