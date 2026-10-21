'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Phone, ExternalLink } from 'lucide-react';
import { InstagramIcon as Instagram, LinkedInIcon as Linkedin } from '@/components/SocialIcons';

export interface ProfileCardData {
  id: string;
  name: string;
  role: string;
  category?: string;
  department?: string;
  graduationDate?: string;
  photoUrl?: string;
  instagramUsername?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  showSocialPublicly?: boolean;
  bio?: string;
  displayOrder?: number;
  email?: string;
  contact?: string;
  phone?: string;
  designation?: string;
  // Presentation & Animation fields
  imagePosition?: 'bottom' | 'center' | 'top';
  imageScale?: number;
  animationEnabled?: boolean;
  animationStyle?: 'fade-up' | 'soft-reveal' | 'gentle-float';
  animationDelay?: number;
  glowEnabled?: boolean;
  glowIntensity?: 'subtle' | 'medium' | 'vibrant';
  bgStyle?: 'radial-light' | 'soft-slate' | 'glass-glow' | 'minimal';
  isTransparent?: boolean;
  // AI Portrait fields
  originalPhotoUrl?: string;
  aiGeneratedPhotoUrl?: string;
  finalTransparentPhotoUrl?: string;
  aiApprovalStatus?: 'pending' | 'approved' | 'rejected';
  aiProcessingStatus?: 'idle' | 'processing' | 'completed' | 'failed';
}

interface AnimatedProfileCardProps {
  member: ProfileCardData;
  index?: number;
  containerHeight?: string;
  layoutVariant?: 'team' | 'faculty' | 'preview';
  showCardBackgroundInPreview?: boolean;
}

export default function AnimatedProfileCard({
  member,
  index = 0,
  containerHeight = 'h-80 sm:h-96',
  layoutVariant = 'team',
  showCardBackgroundInPreview = false
}: AnimatedProfileCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Stagger calculation: 120ms between nearby portraits (Section 9)
  const staggerDelay = (index % 4) * 0.12;

  // Animation settings strictly adhering to Section 9:
  // Initial: opacity 0, translateY 45px
  // Final: opacity 1, translateY 0
  // Duration: 800ms
  // Easing: Smooth ease-out
  // Trigger: once per page visit
  const scrollAnimationVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 45
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.8,
        ease: 'easeOut' as const,
        delay: shouldReduceMotion ? 0 : staggerDelay
      }
    }
  };

  const roleDisplay = member.role || member.designation || 'Innovation Leader';

  // Get monogram initials for placeholder if no photo
  const getInitials = (name: string) => {
    if (!name) return 'ID';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const imageSrc = member.photoUrl || member.finalTransparentPhotoUrl;

  return (
    <motion.div
      variants={scrollAnimationVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      whileHover={
        !shouldReduceMotion
          ? {
              scale: 1.02,
              transition: { duration: 0.28, ease: 'easeOut' }
            }
          : undefined
      }
      className={`group relative flex flex-col items-center text-center select-none ${
        showCardBackgroundInPreview
          ? 'p-4 rounded-3xl bg-neutral-900/80 border border-white/10'
          : 'bg-transparent border-0'
      }`}
    >
      {/* 
        PUBLIC IMAGE STYLE (Section 8):
        - Transparent cutout portrait directly against the website background.
        - No individual card background behind the portrait.
        - No border.
        - No glow.
        - No artificial shadow.
        - No decorative frame.
      */}
      <div className={`relative ${containerHeight} w-full flex items-end justify-center overflow-hidden`}>
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={`${member.name} - ${roleDisplay}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-contain object-bottom transition-opacity duration-700 ease-out ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          /* Subtle clean initials placeholder displayed if no portrait uploaded yet */
          <div className="w-40 h-52 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-white/50 space-y-2 mb-2">
            <span className="text-3xl font-black font-mono tracking-widest text-neutral-400">
              {getInitials(member.name)}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">IEDC Member</span>
          </div>
        )}
      </div>

      {/* 
        MEMBER DETAILS (Section 8):
        - Placed beneath the image
        - Name
        - Designation
        - Department, where applicable
        - Social media links, where available
      */}
      <div className="mt-4 w-full space-y-1.5 px-2">
        {/* Name */}
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug group-hover:text-[#F98A5B] transition-colors duration-200">
          {member.name}
        </h3>

        {/* Designation / Role */}
        <p className="text-xs sm:text-sm font-semibold text-[#F98A5B] tracking-wide">
          {roleDisplay}
        </p>

        {/* Department / Category */}
        {member.department && (
          <p className="text-xs text-neutral-400 line-clamp-1">
            {member.department}
          </p>
        )}

        {/* Approved Social Media Links */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {member.showSocialPublicly !== false && member.linkedinUrl && (
            <a
              href={member.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name}'s LinkedIn`}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-[#0077b5] hover:bg-white/5 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}

          {member.showSocialPublicly !== false && (() => {
            const rawUrl = (member.instagramUrl || '').trim() || (member.instagramUsername ? `https://www.instagram.com/${member.instagramUsername.replace(/^@/, '').trim()}/` : '');
            if (!rawUrl || rawUrl === 'https://instagram.com/' || rawUrl === 'https://www.instagram.com/' || rawUrl === 'https://instagram.com' || rawUrl === 'https://www.instagram.com') return null;
            const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://www.instagram.com/${rawUrl.replace(/^@/, '')}/`;
            return (
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name}'s Instagram profile`}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-[#E4405F] hover:bg-white/5 transition-colors group/insta"
                title={member.instagramUsername ? `@${member.instagramUsername.replace(/^@/, '')}` : 'Instagram Profile'}
              >
                <Instagram className="w-4 h-4 group-hover/insta:scale-110 transition-transform" />
              </a>
            );
          })()}

          {member.email && (
            <a
              href={`mailto:${member.email}`}
              aria-label={`Email ${member.name}`}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
