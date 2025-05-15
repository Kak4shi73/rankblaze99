import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MyTools from './MyTools';

const Dashboard = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.uid) return;
      
      try {
        // Fetch user data from Firebase
        const response = await fetch(
          `https://us-central1-rankblaze-138f7.cloudfunctions.net/api/getUserData?userId=${user.uid}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {userData?.name || user?.displayName || 'User'}!</h1>
        <p>Manage your SEO tools and track your progress</p>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>My Tools</h2>
          <MyTools />
        </div>
        
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {userData?.recentActivity?.length > 0 ? (
              userData.recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-details">
                    <p className="activity-text">{activity.text}</p>
                    <p className="activity-time">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-activity">
                <p>No recent activity to display.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .dashboard-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .dashboard-header h1 {
          font-size: 28px;
          margin-bottom: 10px;
          color: #333;
        }
        
        .dashboard-header p {
          color: #666;
        }
        
        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        
        @media (min-width: 768px) {
          .dashboard-content {
            grid-template-columns: 3fr 1fr;
          }
        }
        
        .dashboard-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .dashboard-section h2 {
          font-size: 20px;
          margin-bottom: 20px;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .activity-item {
          display: flex;
          align-items: center;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 6px;
        }
        
        .activity-icon {
          width: 40px;
          height: 40px;
          background: #e0f7fa;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 20px;
          color: #0097a7;
        }
        
        .activity-details {
          flex: 1;
        }
        
        .activity-text {
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .activity-time {
          font-size: 12px;
          color: #999;
        }
        
        .empty-activity {
          text-align: center;
          padding: 20px;
          color: #999;
        }
        
        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 