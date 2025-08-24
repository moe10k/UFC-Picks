// Utility function to format fighter records
export const formatFighterRecord = (record: any): string => {
  if (!record) return 'N/A';
  
  // If it's already a string, return it
  if (typeof record === 'string') return record;
  
  // If it's an object with wins, losses, draws properties
  if (record && typeof record === 'object' && record.wins !== undefined) {
    const { wins, losses, draws } = record;
    if (draws > 0) {
      return `${wins}-${losses}-${draws}`;
    } else {
      return `${wins}-${losses}`;
    }
  }
  
  // If it's any other object, try to convert to string
  if (typeof record === 'object') {
    return 'N/A';
  }
  
  return String(record);
};


