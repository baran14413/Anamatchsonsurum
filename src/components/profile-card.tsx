
'use client';

import { motion, PanInfo } from 'framer-motion';
import { UserProfile } from '@/lib/types';
import Image from 'next/image';

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 80;

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function ProfileCard({ profile, onSwipe }: ProfileCardProps) {
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe('right');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe('left');
    }
  };
  
  const age = calculateAge(profile.dateOfBirth);
  const mainImage = (profile.images && profile.images.length > 0) ? profile.images[0] : null;

  return (
     <motion.div
      className="absolute w-full h-full max-w-sm"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200 cursor-grab active:cursor-grabbing relative"
      >
        {mainImage ? (
          <Image
            src={mainImage}
            alt={profile.fullName || 'Profile image'}
            fill
            style={{ objectFit: 'cover' }}
            className="pointer-events-none"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <p className="text-gray-500">No image</p>
          </div>
        )}

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
          <h3 className="text-2xl font-bold">{profile.fullName}{age && `, ${age}`}</h3>
          {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

    