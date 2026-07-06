'use client';

import * as React from 'react';
import { Plus, Loader2, Sparkles, Image as ImageIcon, Compass, MapPin, Radio, Activity } from 'lucide-react';
import { getActiveStories, getCurrentUser, ActiveStoryTray } from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import StoryViewer from './StoryViewer';
import CreateStoryModal from './CreateStoryModal';
import { cn } from '@/lib/utils';

// Helper to determine stable mock latitude and longitude for visual coordinates grouping (Feature 14)
function getUserCoordinates(userId: string, stories: any[]) {
  const explicitStory = stories.find(s => s.latitude !== undefined && s.longitude !== undefined);
  if (explicitStory) {
    return { latitude: explicitStory.latitude, longitude: explicitStory.longitude };
  }
  // Fallback to deterministic coordinates based on userId hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = (Math.abs(hash % 300) / 1500) - 0.1; // -0.1 to +0.1 degrees
  const lngOffset = (Math.abs((hash >> 3) % 300) / 1500) - 0.1;
  return {
    latitude: 35.6895 + latOffset,
    longitude: 139.6917 + lngOffset,
  };
}

// Calculate simple Euclidean distance in km (Feature 14)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dx = (lat1 - lat2) * 111.32;
  const dy = (lon1 - lon2) * 40075 * Math.cos(lat1 * Math.PI / 180) / 360;
  return parseFloat(Math.sqrt(dx * dx + dy * dy).toFixed(2));
}

export default function StoryTray() {
  const [trays, setTrays] = React.useState<ActiveStoryTray[]>([]);
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploadingStory, setUploadingStory] = React.useState(false);
  
  // Story modal state
  const [activeUserIndex, setActiveUserIndex] = React.useState<number | null>(null);
  const [isPublisherOpen, setIsPublisherOpen] = React.useState(false);

  // View Mode: 'timeline' (standard horizontal scroll) | 'radar' (Coordinate Node Rings)
  const [viewMode, setViewMode] = React.useState<'timeline' | 'radar'>('timeline');
  const [nowTime, setNowTime] = React.useState<number>(0);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const data = await getActiveStories();
      setTrays(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        Promise.resolve().then(() => {
          setCurrentUser(user);
        });
      }
    });
    Promise.resolve().then(() => {
      setNowTime(Date.now());
      fetchStories();
    });
  }, []);

  // Center coordinates of the viewer (Shinjuku reference center)
  const viewerCoordinates = { latitude: 35.6895, longitude: 139.6917 };

  // Parse trays with distances for Coordinate Node Rings (Feature 14)
  const traysWithCoordinates = React.useMemo(() => {
    return trays.map(tray => {
      const coords = getUserCoordinates(tray.userId, tray.stories);
      const distance = calculateDistance(viewerCoordinates.latitude, viewerCoordinates.longitude, coords.latitude, coords.longitude);
      return {
        ...tray,
        coords,
        distance
      };
    });
  }, [trays]);

  // Group into distance vector rings
  const proximalCore = traysWithCoordinates.filter(t => t.distance <= 4.0);
  const transitVector = traysWithCoordinates.filter(t => t.distance > 4.0 && t.distance <= 12.0);
  const horizonPerimeter = traysWithCoordinates.filter(t => t.distance > 12.0);

  // Calculate story expiration slice remaining ratio (Feature 20)
  const getExpirationRatio = (tray: ActiveStoryTray) => {
    if (tray.stories.length === 0) return 1;
    const latestStory = tray.stories[tray.stories.length - 1];
    const expiresTime = new Date(latestStory.expiresAt).getTime();
    const createdTime = new Date(latestStory.createdAt).getTime();
    const totalLifetime = expiresTime - createdTime || (24 * 60 * 60 * 1000);
    const now = nowTime || createdTime; // Pure lookup of initialized mount-time value
    const ratio = Math.max(0, Math.min(1, (expiresTime - now) / totalLifetime));
    return ratio;
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-900 rounded p-4 flex flex-col gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      
      {/* HEADER CONTROLS (Pulse Timeline vs. Vector Radar Node Rings toggle) */}
      <div className="flex items-center justify-between border-b border-slate-900/60 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">FRIENDS&apos; DAILY UPDATES</span>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex gap-1.5 bg-slate-900 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setViewMode('timeline')}
            className={cn(
              "px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer",
              viewMode === 'timeline' ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
            )}
          >
            ✨ Today&apos;s Updates
          </button>
          <button
            onClick={() => setViewMode('radar')}
            className={cn(
              "px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer flex items-center gap-1.5",
              viewMode === 'radar' ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
            📍 See Who Is Nearby
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        /* STANDARD HORIZONTAL PULSE FEED VIEW */
        <div className="flex gap-4 overflow-x-auto scrollbar-none py-1">
          
          {/* CURRENT USER "ADD STORY" BUBBLE */}
          {currentUser && (
            <div 
              onClick={() => setIsPublisherOpen(true)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer select-none group"
            >
              <div className="relative w-15 h-15 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
                <img
                  src={currentUser.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                  alt="My Avatar"
                  className="w-13 h-13 rounded-full object-cover p-0.5"
                />
                
                {/* Create Story badge */}
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-violet-600 rounded-full border border-slate-950 flex items-center justify-center text-white shadow-[0_0_8px_rgba(124,58,237,0.6)] group-hover:bg-violet-500 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                Your Pulse
              </span>
            </div>
          )}

          {/* LIVE STORIES TRAYS SCROLL */}
          {loading ? (
            <div className="flex items-center gap-3 py-2.5 text-xs font-sans text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              Loading updates...
            </div>
          ) : trays.length === 0 ? (
            <div className="flex items-center gap-2 text-xs font-sans text-slate-600 py-3 px-1 border border-dashed border-slate-900/60 rounded flex-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              No updates posted yet. Be the first to share your day!
            </div>
          ) : (
            trays.map((tray, index) => {
              const ratio = getExpirationRatio(tray);
              const strokeDashoffset = 100 - (ratio * 100);

              return (
                <div
                  key={tray.userId}
                  onClick={() => setActiveUserIndex(index)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer select-none group relative"
                >
                  {/* Colored Neon Border with Visual Expiration Slice indicator (Feature 20) */}
                  <div className="relative w-15 h-15 rounded-full flex items-center justify-center p-[2px] transition-all">
                    {/* Expiration SVG Pie Slice Ticker (Feature 20) */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10 scale-[1.08]" viewBox="0 0 36 36">
                      {/* Grey background circle track */}
                      <circle
                        cx="18"
                        cy="18"
                        r="16.5"
                        fill="transparent"
                        stroke="#0f172a" // slate-900
                        strokeWidth="1.5"
                      />
                      {/* Active countdown slice */}
                      <circle
                        cx="18"
                        cy="18"
                        r="16.5"
                        fill="transparent"
                        stroke={ratio < 0.2 ? '#f43f5e' : (ratio < 0.5 ? '#f59e0b' : '#14b8a6')} // red for critical time, orange, teal
                        strokeWidth="1.8"
                        strokeDasharray="103.6"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 shadow-lg"
                      />
                    </svg>

                    {/* Avatar Body */}
                    <div className="w-13 h-13 rounded-full bg-slate-950 flex items-center justify-center p-[2px] z-20 overflow-hidden border border-slate-900">
                      <img
                        src={tray.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                        alt={tray.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  
                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-100 truncate w-14 text-center mt-0.5">
                    @{tray.username}
                  </span>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* FEATURE 14: COORDINATE NODE RINGS RADAR MAP */
        <div className="w-full min-h-[220px] bg-slate-950 border border-slate-900/60 rounded p-4 flex flex-col gap-4 relative overflow-hidden">
          {/* Grid neon grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-violet-950/25 animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />

          <div className="z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-sans text-slate-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-violet-500 animate-pulse" /> Look who shared pictures near you!
              </span>
              <span className="text-[8px] font-sans text-slate-500">Location: Around Me</span>
            </div>

            {/* NEON ORBITAL NODE RINGS */}
            <div className="flex flex-col gap-3.5">
              {/* RING 1: PROXIMAL CORE */}
              <div className="flex flex-col gap-2 p-2 bg-slate-900/20 border border-violet-950/20 rounded">
                <div className="flex items-center justify-between text-[8px] font-sans">
                  <span className="text-violet-400 font-bold uppercase tracking-wider">● Right down the road (Less than 2 miles away)</span>
                  <span className="text-slate-500">{proximalCore.length} active user{proximalCore.length !== 1 ? 's' : ''}</span>
                </div>
                {proximalCore.length === 0 ? (
                  <span className="text-[9px] text-slate-600 italic font-sans pl-3">No updates found close to you right now.</span>
                ) : (
                  <div className="flex flex-wrap gap-3 pl-2 py-1">
                    {proximalCore.map(tray => {
                      const idx = trays.findIndex(t => t.userId === tray.userId);
                      return (
                        <div
                          key={tray.userId}
                          onClick={() => setActiveUserIndex(idx)}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded hover:border-violet-500 cursor-pointer transition-all hover:bg-slate-900/60"
                        >
                          <img src={tray.avatarUrl || 'https://picsum.photos/seed/placeholder'} alt={tray.username} className="w-5 h-5 rounded-full object-cover" />
                          <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-bold text-slate-200">@{tray.username}</span>
                            <span className="text-[8px] font-sans text-violet-400 mt-0.5">{tray.distance} km</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RING 2: TRANSIT VECTOR */}
              <div className="flex flex-col gap-2 p-2 bg-slate-900/20 border border-teal-950/20 rounded">
                <div className="flex items-center justify-between text-[8px] font-sans">
                  <span className="text-teal-400 font-bold uppercase tracking-wider">● A short drive away (2 to 7 miles away)</span>
                  <span className="text-slate-500">{transitVector.length} active user{transitVector.length !== 1 ? 's' : ''}</span>
                </div>
                {transitVector.length === 0 ? (
                  <span className="text-[9px] text-slate-600 italic font-sans pl-3">No updates found in this range.</span>
                ) : (
                  <div className="flex flex-wrap gap-3 pl-2 py-1">
                    {transitVector.map(tray => {
                      const idx = trays.findIndex(t => t.userId === tray.userId);
                      return (
                        <div
                          key={tray.userId}
                          onClick={() => setActiveUserIndex(idx)}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded hover:border-teal-500 cursor-pointer transition-all hover:bg-slate-900/60"
                        >
                          <img src={tray.avatarUrl || 'https://picsum.photos/seed/placeholder'} alt={tray.username} className="w-5 h-5 rounded-full object-cover" />
                          <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-bold text-slate-200">@{tray.username}</span>
                            <span className="text-[8px] font-sans text-teal-400 mt-0.5">{tray.distance} km</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RING 3: HORIZON PERIMETER */}
              <div className="flex flex-col gap-2 p-2 bg-slate-900/20 border border-slate-800/40 rounded">
                <div className="flex items-center justify-between text-[8px] font-sans">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">● A bit further out (Over 7 miles away)</span>
                  <span className="text-slate-500">{horizonPerimeter.length} active user{horizonPerimeter.length !== 1 ? 's' : ''}</span>
                </div>
                {horizonPerimeter.length === 0 ? (
                  <span className="text-[9px] text-slate-600 italic font-sans pl-3">No updates found far away.</span>
                ) : (
                  <div className="flex flex-wrap gap-3 pl-2 py-1">
                    {horizonPerimeter.map(tray => {
                      const idx = trays.findIndex(t => t.userId === tray.userId);
                      return (
                        <div
                          key={tray.userId}
                          onClick={() => setActiveUserIndex(idx)}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded hover:border-slate-500 cursor-pointer transition-all hover:bg-slate-900/60"
                        >
                          <img src={tray.avatarUrl || 'https://picsum.photos/seed/placeholder'} alt={tray.username} className="w-5 h-5 rounded-full object-cover" />
                          <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-bold text-slate-200">@{tray.username}</span>
                            <span className="text-[8px] font-sans text-slate-400 mt-0.5">{tray.distance} km</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STORY MODAL */}
      <CreateStoryModal
        isOpen={isPublisherOpen}
        onClose={() => setIsPublisherOpen(false)}
        onSuccess={fetchStories}
        currentUser={currentUser}
      />

      {/* IMMERSIVE STORY VIEWER MODAL PANEL */}
      {activeUserIndex !== null && (
        <StoryViewer
          trays={trays}
          initialUserIndex={activeUserIndex}
          isOpen={activeUserIndex !== null}
          onClose={() => setActiveUserIndex(null)}
        />
      )}

    </div>
  );
}
