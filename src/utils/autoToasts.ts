// Auto-toast notifications for the homepage
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// List of Indian names for fake purchase notifications
const indianNames = [
  "Aarav", "Priya", "Rohan", "Neha", "Kabir", "Sneha", "Vikram", "Anaya",
  "Karan", "Pooja", "Rajiv", "Ishita", "Siddharth", "Divya", "Arjun", "Ananya",
  "Aditya", "Meera", "Vivek", "Ritu", "Rahul", "Anjali", "Deepak", "Tanvi"
];

// Extract tool names from our tools data for fake purchase notifications
// This list will be populated from the tools.ts data
const toolNames = [
  "ChatGPT Plus", "Envato Elements", "Canva Pro", "Storyblocks", 
  "SEMrush", "Grammarly", "Netflix Premium", "Spotify Premium",
  "YouTube Premium", "Helium10", "Writesonic", "Leonardo.ai",
  "Coursera", "LinkedIn Learning", "Skillshare", "Prezi",
  "VistaCreate", "Vecteezy"
];

/**
 * Custom hook for managing automatic toasts on the homepage
 * @returns void
 */
export const useAutoToasts = () => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const loginReminderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fakePurchaseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to clear all intervals
  const cleanupIntervals = () => {
    if (loginReminderIntervalRef.current) {
      clearInterval(loginReminderIntervalRef.current);
      loginReminderIntervalRef.current = null;
    }
    
    if (fakePurchaseIntervalRef.current) {
      clearInterval(fakePurchaseIntervalRef.current);
      fakePurchaseIntervalRef.current = null;
    }
  };

  // Generate random fake purchase notification
  const generateFakePurchase = () => {
    const name = indianNames[Math.floor(Math.random() * indianNames.length)];
    const tool = toolNames[Math.floor(Math.random() * toolNames.length)];
    showToast(`🛒 ${name} just bought ${tool}!`, 'info');
  };

  useEffect(() => {
    // Clear any existing intervals first
    cleanupIntervals();

    // If user is not logged in, show reminder every 120 seconds
    if (!isAuthenticated) {
      loginReminderIntervalRef.current = setInterval(() => {
        showToast('🚫 Please sign in to use this tool.', 'warning');
      }, 120000); // 120 seconds
    } else {
      // If user is logged in and we just set up this effect, show success message
      // We use localStorage to check if we've already shown this message
      const loginSuccessShown = localStorage.getItem('login_success_shown');
      if (!loginSuccessShown) {
        showToast('🎉 Congratulations! You\'ve successfully logged in.', 'success');
        localStorage.setItem('login_success_shown', 'true');
      }
    }

    // Set up fake purchase notifications regardless of auth status
    // First one shows after 10 seconds
    const firstPurchaseTimeout = setTimeout(() => {
      generateFakePurchase();
      
      // Then every 5 minutes
      fakePurchaseIntervalRef.current = setInterval(generateFakePurchase, 300000); // 300 seconds / 5 minutes
    }, 10000);

    // Cleanup function
    return () => {
      cleanupIntervals();
      clearTimeout(firstPurchaseTimeout);
    };
  }, [isAuthenticated, showToast]);
}; 