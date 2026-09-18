import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Return a greeting based on the current time.
 * @returns {string} A localized greeting.
 */
const useGreeting = (username: string) => {
  const { t } = useTranslation()
  // Map the current hour to a greeting.
  const getGreeting = (hour: number) => {
    if (hour >= 5 && hour < 12) {
      return `${t("home.morning")},${username}`
    } else if (hour >= 12 && hour < 14) {
      return `${t("home.noon")},${username}`
    } else if (hour >= 14 && hour < 18) {
      return `${t("home.afternoon")},${username}`
    } else {
      return `${t("home.evening")},${username}`
    }
  }

  // Initialize with the current greeting.
  const [greeting, setGreeting] = useState(() => getGreeting(new Date().getHours()));

  useEffect(() => {
    // Update the greeting.
    const updateGreeting = () => {
      const hour = new Date().getHours();
      setGreeting(getGreeting(hour));
    };

    // Sync once on mount.
    updateGreeting();

    // Check once per minute for time-period changes.
    const timer = setInterval(updateGreeting, 60000);

    // Clean up the timer.
    return () => clearInterval(timer);
  }, []);

  return [greeting]
};

export default useGreeting
