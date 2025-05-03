import React, { useState, useEffect } from 'react';
import styles from './ScheduledStreams.module.css';
import { FiCalendar, FiSearch, FiEdit2, FiTrash2, FiClock, FiUsers, FiGlobe, FiEye, FiRepeat } from 'react-icons/fi';
import { BsPlayCircle, BsFillCalendarPlusFill } from 'react-icons/bs';
import StreamScheduler from './StreamScheduler';

interface Stream {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  scheduledStart: Date;
  status: 'live' | 'upcoming' | 'ended' | 'cancelled';
  visibility: 'public' | 'unlisted' | 'private';
  recurring: boolean;
  tags: string[];
  estimatedDuration: number;
}

type FilterStatus = 'all' | 'live' | 'upcoming' | 'ended' | 'cancelled';

const ScheduledStreams: React.FC = () => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch streams data
  useEffect(() => {
    const fetchStreams = async () => {
      setIsLoading(true);
      try {
        // This would be replaced with an actual API call
        // For now we'll use mock data
        setTimeout(() => {
          const mockStreams: Stream[] = [
            {
              id: '1',
              title: 'Introducing PRX Blockchain Features',
              description: 'Join us for a live demonstration of the latest PRX Blockchain features, including token distribution and staking mechanisms.',
              thumbnail: '/assets/thumbnails/stream1.jpg',
              scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
              status: 'upcoming',
              visibility: 'public',
              recurring: false,
              tags: ['blockchain', 'crypto', 'tutorial'],
              estimatedDuration: 60 // minutes
            },
            {
              id: '2',
              title: 'Weekly Development Update',
              description: 'Our weekly session discussing the latest development updates, roadmap progress, and community feedback implementation.',
              thumbnail: '/assets/thumbnails/stream2.jpg',
              scheduledStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
              status: 'upcoming',
              visibility: 'public',
              recurring: true,
              tags: ['dev-updates', 'roadmap', 'community'],
              estimatedDuration: 45 // minutes
            },
            {
              id: '3',
              title: 'RED X Integration Walkthrough',
              description: 'Learn how to integrate RED X WASM components into your existing web applications for enhanced performance.',
              thumbnail: '/assets/thumbnails/stream3.jpg',
              scheduledStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
              status: 'ended',
              visibility: 'public',
              recurring: false,
              tags: ['wasm', 'integration', 'tutorial'],
              estimatedDuration: 90 // minutes
            },
          ];
          
          setStreams(mockStreams);
          setFilteredStreams(mockStreams);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching scheduled streams:', error);
        setIsLoading(false);
      }
    };

    fetchStreams();
  }, []);

  // Filter streams based on search query and status filter
  useEffect(() => {
    let result = streams;
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(stream => 
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(stream => stream.status === filterStatus);
    }
    
    setFilteredStreams(result);
  }, [searchQuery, filterStatus, streams]);

  // Handle new stream scheduling
  const handleScheduleStream = (streamData: any) => {
    // In a real application, you would send this to your API
    console.log('Scheduling new stream:', streamData);
    
    // For demo purposes, add it to the local state
    const newStream: Stream = {
      id: `stream-${Date.now()}`,
      title: streamData.title,
      description: streamData.description,
      thumbnail: streamData.thumbnail || '/assets/thumbnails/default.jpg',
      scheduledStart: new Date(streamData.scheduledStart),
      status: 'upcoming',
      visibility: streamData.visibility,
      recurring: streamData.recurring,
      tags: streamData.tags.split(',').map((tag: string) => tag.trim()),
      estimatedDuration: parseInt(streamData.duration, 10)
    };
    
    setStreams(prevStreams => [newStream, ...prevStreams]);
    setIsScheduling(false);
  };

  // Format time until stream starts
  const formatTimeUntil = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `In ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Starting soon';
    }
  };

  // Handle edit stream
  const handleEditStream = (streamId: string) => {
    console.log('Edit stream:', streamId);
    // In a real app, you would open an edit form or modal
  };

  // Handle delete stream
  const handleDeleteStream = (streamId: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled stream?')) {
      setStreams(prevStreams => prevStreams.filter(stream => stream.id !== streamId));
    }
  };

  return (
    <div className={styles.scheduledStreamsContainer}>
      {isScheduling ? (
        <div className={styles.schedulerWrapper}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Schedule New Stream</h2>
            <p className={styles.subtitle}>Set up your live stream's details and schedule</p>
          </div>
          <StreamScheduler onSchedule={handleScheduleStream} />
          <button 
            className={styles.cancelButton} 
            onClick={() => setIsScheduling(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div className={styles.headerActions}>
            <div className={styles.heading}>
              <h2 className={styles.title}>Scheduled Streams</h2>
              <p className={styles.subtitle}>Manage your upcoming, live, and past scheduled streams</p>
            </div>
            <button 
              className={styles.scheduleButton} 
              onClick={() => setIsScheduling(true)}
            >
              <BsFillCalendarPlusFill size={18} />
              Schedule New Stream
            </button>
          </div>

          <div className={styles.filterBar}>
            <div className={styles.searchBar}>
              <span className={styles.searchIcon}>
                <FiSearch size={16} />
              </span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search streams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterOptions}>
              <button 
                className={`${styles.filterOption} ${filterStatus === 'all' ? styles.active : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All
              </button>
              <button 
                className={`${styles.filterOption} ${filterStatus === 'live' ? styles.active : ''}`}
                onClick={() => setFilterStatus('live')}
              >
                Live
              </button>
              <button 
                className={`${styles.filterOption} ${filterStatus === 'upcoming' ? styles.active : ''}`}
                onClick={() => setFilterStatus('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={`${styles.filterOption} ${filterStatus === 'ended' ? styles.active : ''}`}
                onClick={() => setFilterStatus('ended')}
              >
                Past
              </button>
              <button 
                className={`${styles.filterOption} ${filterStatus === 'cancelled' ? styles.active : ''}`}
                onClick={() => setFilterStatus('cancelled')}
              >
                Cancelled
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.emptyState}>
              <FiClock size={48} className={styles.emptyIcon} />
              <h3>Loading streams...</h3>
              <p>Please wait while we fetch your scheduled streams.</p>
            </div>
          ) : filteredStreams.length === 0 ? (
            <div className={styles.emptyState}>
              <FiCalendar size={48} className={styles.emptyIcon} />
              <h3>No scheduled streams found</h3>
              <p>{searchQuery || filterStatus !== 'all' ? 
                'Try adjusting your search or filters' : 
                'Click "Schedule New Stream" to create your first stream'}
              </p>
            </div>
          ) : (
            <div className={styles.streamsList}>
              {filteredStreams.map(stream => (
                <div key={stream.id} className={styles.streamCard}>
                  <div className={styles.streamThumbnail}>
                    <img 
                      src={stream.thumbnail} 
                      alt={stream.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/thumbnails/default.jpg';
                      }}
                    />
                    <div className={`${styles.statusBadge} ${styles[stream.status]}`}>
                      {stream.status === 'live' ? 'LIVE NOW' : 
                       stream.status === 'upcoming' ? 'UPCOMING' : 
                       stream.status === 'ended' ? 'ENDED' : 'CANCELLED'}
                    </div>
                  </div>
                  <div className={styles.streamDetails}>
                    <div className={styles.streamHeader}>
                      <h3 className={styles.streamTitle}>{stream.title}</h3>
                      <div className={styles.streamActions}>
                        <button 
                          className={styles.editButton}
                          onClick={() => handleEditStream(stream.id)}
                        >
                          <FiEdit2 size={14} /> Edit
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDeleteStream(stream.id)}
                        >
                          <FiTrash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                    <div className={styles.streamMeta}>
                      <div className={styles.metaItem}>
                        <FiClock size={14} />
                        {stream.scheduledStart.toLocaleString()}
                      </div>
                      <div className={styles.metaItem}>
                        <BsPlayCircle size={14} />
                        {stream.estimatedDuration} minutes
                      </div>
                      <div className={`${styles.metaItem} ${
                        stream.visibility === 'public' ? styles.public : 
                        stream.visibility === 'unlisted' ? styles.unlisted : ''
                      }`}>
                        {stream.visibility === 'public' ? <FiGlobe size={14} /> : 
                         stream.visibility === 'unlisted' ? <FiEye size={14} /> : 
                         <FiUsers size={14} />}
                        {stream.visibility.charAt(0).toUpperCase() + stream.visibility.slice(1)}
                      </div>
                      {stream.recurring && (
                        <div className={`${styles.metaItem} ${styles.recurring}`}>
                          <FiRepeat size={14} />
                          Recurring
                        </div>
                      )}
                    </div>
                    <p className={styles.streamDescription}>
                      {stream.description.length > 150 
                        ? stream.description.substring(0, 150) + '...' 
                        : stream.description}
                    </p>
                    <div className={styles.streamFooter}>
                      <div className={styles.tagsList}>
                        {stream.tags.map((tag, index) => (
                          <span key={index} className={styles.tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {stream.status === 'upcoming' && (
                        <div className={styles.timeUntil}>
                          {formatTimeUntil(stream.scheduledStart)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScheduledStreams;