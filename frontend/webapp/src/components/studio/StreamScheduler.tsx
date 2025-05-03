import { useState } from 'react';
import styles from './StreamScheduler.module.css';
import { useWallet } from '../../hooks/useWallet';

interface ScheduledStream {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  scheduledTime: string;
  duration: number; // in minutes
  category: string;
  tags: string[];
  visibility: 'public' | 'unlisted' | 'private';
  notificationsEnabled: boolean;
  autoStart: boolean;
  recurring: boolean;
  recurringPattern?: string;
}

interface StreamSchedulerProps {
  onScheduleStream: (stream: Omit<ScheduledStream, 'id'>) => void;
  onUpdateSchedule?: (stream: ScheduledStream) => void;
  editingStream?: ScheduledStream | null;
  categories: string[];
}

const StreamScheduler: React.FC<StreamSchedulerProps> = ({ 
  onScheduleStream, 
  onUpdateSchedule, 
  editingStream = null,
  categories = ['Gaming', 'Music', 'Art', 'Coding', 'Talk Show', 'Education', 'Cryptocurrency', 'Other']
}) => {
  const { account } = useWallet();
  const isEditing = !!editingStream;
  
  // Form state
  const [title, setTitle] = useState(editingStream?.title || '');
  const [description, setDescription] = useState(editingStream?.description || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(editingStream?.thumbnailUrl || '');
  const [scheduledTime, setScheduledTime] = useState(
    editingStream?.scheduledTime 
      ? new Date(editingStream.scheduledTime).toISOString().slice(0, 16) 
      : getDefaultScheduleTime()
  );
  const [duration, setDuration] = useState(editingStream?.duration || 60);
  const [category, setCategory] = useState(editingStream?.category || categories[0]);
  const [tags, setTags] = useState<string[]>(editingStream?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>(
    editingStream?.visibility || 'public'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    editingStream?.notificationsEnabled ?? true
  );
  const [autoStart, setAutoStart] = useState(editingStream?.autoStart ?? true);
  const [recurring, setRecurring] = useState(editingStream?.recurring ?? false);
  const [recurringPattern, setRecurringPattern] = useState(
    editingStream?.recurringPattern || 'weekly'
  );
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get default time (next hour)
  function getDefaultScheduleTime(): string {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.toISOString().slice(0, 16);
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // In a real app, upload to IPFS or server
      // For now, create object URL
      setIsUploading(true);
      
      // Simulate upload
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          const imageUrl = URL.createObjectURL(file);
          setThumbnailUrl(imageUrl);
          setIsUploading(false);
          setUploadProgress(0);
        }
      }, 200);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!scheduledTime) {
      newErrors.scheduledTime = 'Schedule time is required';
    } else {
      const scheduledDate = new Date(scheduledTime);
      const now = new Date();
      
      if (scheduledDate < now) {
        newErrors.scheduledTime = 'Schedule time cannot be in the past';
      }
    }
    
    if (duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const streamData = {
      title,
      description,
      thumbnailUrl: thumbnailUrl || '/assets/thumbnails/default.jpg',
      scheduledTime: new Date(scheduledTime).toISOString(),
      duration,
      category,
      tags,
      visibility,
      notificationsEnabled,
      autoStart,
      recurring,
      recurringPattern: recurring ? recurringPattern : undefined
    };
    
    if (isEditing && editingStream && onUpdateSchedule) {
      onUpdateSchedule({ ...streamData, id: editingStream.id });
    } else {
      onScheduleStream(streamData);
    }
    
    // Reset form if not editing
    if (!isEditing) {
      setTitle('');
      setDescription('');
      setThumbnailUrl('');
      setScheduledTime(getDefaultScheduleTime());
      setDuration(60);
      setCategory(categories[0]);
      setTags([]);
      setVisibility('public');
      setNotificationsEnabled(true);
      setAutoStart(true);
      setRecurring(false);
    }
  };

  return (
    <div className={styles.schedulerContainer}>
      <h2 className={styles.schedulerTitle}>
        {isEditing ? 'Edit Scheduled Stream' : 'Schedule New Stream'}
      </h2>
      
      <form className={styles.schedulerForm} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formColumn}>
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.formLabel}>
                Stream Title*
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${styles.formInput} ${errors.title ? styles.inputError : ''}`}
                placeholder="Enter a title for your stream"
              />
              {errors.title && <div className={styles.errorMessage}>{errors.title}</div>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.formLabel}>
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.formTextarea}
                placeholder="Describe your stream to viewers"
                rows={4}
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="scheduledTime" className={styles.formLabel}>
                  Date & Time*
                </label>
                <input
                  id="scheduledTime"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={`${styles.formInput} ${errors.scheduledTime ? styles.inputError : ''}`}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {errors.scheduledTime && (
                  <div className={styles.errorMessage}>{errors.scheduledTime}</div>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="duration" className={styles.formLabel}>
                  Duration (mins)
                </label>
                <input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className={`${styles.formInput} ${errors.duration ? styles.inputError : ''}`}
                  min="1"
                  max="1440"
                />
                {errors.duration && (
                  <div className={styles.errorMessage}>{errors.duration}</div>
                )}
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="category" className={styles.formLabel}>
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={styles.formSelect}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="visibility" className={styles.formLabel}>
                  Visibility
                </label>
                <select
                  id="visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className={styles.formSelect}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="tags" className={styles.formLabel}>
                Tags
              </label>
              <div className={styles.tagInputContainer}>
                <input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className={styles.formInput}
                  placeholder="Add tags (press Enter to add)"
                />
                <button
                  type="button"
                  className={styles.addTagButton}
                  onClick={handleAddTag}
                >
                  Add
                </button>
              </div>
              
              <div className={styles.tagsContainer}>
                {tags.map((tag) => (
                  <div key={tag} className={styles.tag}>
                    <span>{tag}</span>
                    <button
                      type="button"
                      className={styles.removeTagButton}
                      onClick={() => handleRemoveTag(tag)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className={styles.formColumn}>
            <div className={styles.thumbnailSection}>
              <h3 className={styles.sectionTitle}>Stream Thumbnail</h3>
              
              <div className={styles.thumbnailPreview}>
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Stream thumbnail preview"
                    className={styles.thumbnailImage}
                  />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>No thumbnail selected</span>
                  </div>
                )}
                
                {isUploading && (
                  <div className={styles.uploadProgressContainer}>
                    <div className={styles.uploadProgressBar}>
                      <div
                        className={styles.uploadProgressFill}
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className={styles.uploadProgressText}>
                      {uploadProgress}% Uploaded
                    </div>
                  </div>
                )}
              </div>
              
              <div className={styles.thumbnailActions}>
                <label htmlFor="thumbnailUpload" className={styles.uploadButton}>
                  {thumbnailUrl ? 'Change Thumbnail' : 'Upload Thumbnail'}
                </label>
                <input
                  type="file"
                  id="thumbnailUpload"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className={styles.fileInput}
                  disabled={isUploading}
                />
                
                {thumbnailUrl && (
                  <button
                    type="button"
                    className={styles.removeThumbnailButton}
                    onClick={() => setThumbnailUrl('')}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            
            <div className={styles.streamSettingsSection}>
              <h3 className={styles.sectionTitle}>Stream Settings</h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label htmlFor="notificationsEnabled" className={styles.settingLabel}>
                    Send notifications to followers
                  </label>
                  <div className={styles.settingDescription}>
                    Notify followers when this stream is about to start
                  </div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                  <label htmlFor="notificationsEnabled"></label>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label htmlFor="autoStart" className={styles.settingLabel}>
                    Auto-start stream
                  </label>
                  <div className={styles.settingDescription}>
                    Start streaming automatically at scheduled time
                  </div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="autoStart"
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                  />
                  <label htmlFor="autoStart"></label>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label htmlFor="recurring" className={styles.settingLabel}>
                    Recurring stream
                  </label>
                  <div className={styles.settingDescription}>
                    Schedule this stream to repeat regularly
                  </div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                  />
                  <label htmlFor="recurring"></label>
                </div>
              </div>
              
              {recurring && (
                <div className={styles.recurringOptions}>
                  <label htmlFor="recurringPattern" className={styles.formLabel}>
                    Repeat Pattern
                  </label>
                  <select
                    id="recurringPattern"
                    value={recurringPattern}
                    onChange={(e) => setRecurringPattern(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every Two Weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.formActions}>
          <button type="submit" className={styles.scheduleButton}>
            {isEditing ? 'Update Schedule' : 'Schedule Stream'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StreamScheduler;