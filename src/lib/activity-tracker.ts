/**
 * Frontend activity tracking service
 * Stores recent user activities in localStorage
 * Used to display on the home page dashboard
 */

export interface ActivityRecord {
  name: string;
  type: string;
  timestamp: number;
}

export interface ActivityDisplay extends ActivityRecord {
  date: string;
}

export class ActivityTracker {
  private static readonly STORAGE_KEY = 'tay_training_activity';
  private static readonly MAX_ACTIVITIES = 10;

  /**
   * Format a timestamp into a human-readable date string
   * Returns "Hoje, HH:mm" for today, "Ontem, HH:mm" for yesterday, or full date
   */
  static getFormattedDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check if today
    if (activityDate.getTime() === today.getTime()) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Check if yesterday
    if (activityDate.getTime() === yesterday.getTime()) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Otherwise show full date with time
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Add a new activity to the tracking history
   * Automatically stores the current timestamp
   * Keeps only the latest MAX_ACTIVITIES records
   */
  static addActivity(name: string, type: 'Exercício' | 'Método' | 'Ficha de Treino' | 'Treino'): void {
    try {
      const activities = this.getActivitiesRaw();
      
      const newActivity: ActivityRecord = {
        name,
        type,
        timestamp: Date.now(),
      };

      activities.unshift(newActivity);
      
      // Keep only the latest activities
      const trimmed = activities.slice(0, this.MAX_ACTIVITIES);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.error('Failed to save activity:', err);
    }
  }

  /**
   * Get raw activities without formatted dates
   * For internal use
   */
  private static getActivitiesRaw(): ActivityRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored) as ActivityRecord[];
    } catch (err) {
      console.error('Failed to retrieve activities:', err);
      return [];
    }
  }

  /**
   * Get activities with formatted dates
   * For display on UI
   */
  static getActivities(): ActivityDisplay[] {
    try {
      const activities = this.getActivitiesRaw();
      
      return activities.map(activity => ({
        ...activity,
        date: this.getFormattedDate(new Date(activity.timestamp)),
      }));
    } catch (err) {
      console.error('Failed to retrieve activities:', err);
      return [];
    }
  }

  /**
   * Clear all stored activities
   */
  static clearActivities(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear activities:', err);
    }
  }
}
