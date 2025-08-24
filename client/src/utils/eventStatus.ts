import { EventWithFights } from '../types';

/**
 * Determines the actual event status based on current date/time and whether results have been entered
 * @param event - The event to check
 * @returns The calculated status: 'upcoming', 'live', or 'completed'
 */
export const getActualEventStatus = (event: EventWithFights): 'upcoming' | 'live' | 'completed' => {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // If event has results, it's completed
  if (event.fights && event.fights.some(fight => fight.isCompleted)) {
    return 'completed';
  }
  
  // If event date has passed, it should be live
  if (eventDate <= now) {
    return 'live';
  }
  
  // Otherwise, it's upcoming
  return 'upcoming';
};

/**
 * Gets the display text for an event status
 * @param status - The event status
 * @returns Human-readable status text
 */
export const getEventStatusText = (status: string): string => {
  switch (status) {
    case 'upcoming':
      return 'Upcoming';
    case 'live':
      return 'Live';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

/**
 * Gets the CSS color classes for an event status
 * @param status - The event status
 * @returns CSS classes for styling
 */
export const getEventStatusColor = (status: string): string => {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-600 text-white';
    case 'completed':
      return 'bg-green-600 text-white';
    case 'live':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};
