'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import Image from 'next/image';

interface ProfileCardProps {
  profile: UserProfile;
}

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const [imageIndex, setImageIndex] = useState(0);

  // Reset image index when profile changes
  useEffect(() => {
    setImageIndex(0);
  }, [profile.id]);
  
  const age = calculateAge(profile.dateOfBirth);
  const totalImages = profile.images?.length || 0;
  const currentImage = (profile.images && profile.images.length > 0) ? profile.images[imageIndex] : null;


  const handleAreaClick = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    if (totalImages <= 1) return;

    if (side === 'right') {
      setImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200">
        {/* Image Progress Bars */}
        {totalImages > 1 && (
            <div className="absolute top-2 left-2 right-2 z-10 flex gap-1 px-1">
                {profile.images.map((_, index) => (
                <div key={index} className="relative h-1 flex-1 bg-white/40 rounded-full overflow-hidden">
                    <div
                    className="absolute top-0 left-0 h-full bg-white transition-all duration-300"
                    style={{
                        width: index === imageIndex ? '100%' : '0%',
                        opacity: index === imageIndex ? 1 : 0.6,
                    }}
                    />
                </div>
                ))}
            </div>
        )}

        {/* Clickable Areas for Navigation */}
        {totalImages > 1 && (
          <>
            <div
              className="absolute left-0 top-0 h-full w-1/2 z-20"
              onClick={(e) => handleAreaClick(e, 'left')}
            ></div>
            <div
              className="absolute right-0 top-0 h-full w-1/2 z-20"
              onClick={(e) => handleAreaClick(e, 'right')}
            ></div>
          </>
        )}

        {currentImage ? (
          <Image
            src={currentImage}
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
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white z-10 pointer-events-none">
          <h3 className="text-2xl font-bold">{profile.fullName}{age && `, ${age}`}</h3>
          {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
        </div>
    </div>
  );
}
