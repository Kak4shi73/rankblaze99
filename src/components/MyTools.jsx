import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MyTools = () => {
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserTools = async () => {
      try {
        if (!user || !user.uid) {
          throw new Error('User not authenticated');
        }

        // Fetch user's purchased tools
        const response = await fetch(
          `https://us-central1-rankblaze-138f7.cloudfunctions.net/api/getUserTools?userId=${user.uid}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch user tools');
        }

        const data = await response.json();
        setTools(data.tools || []);
      } catch (error) {
        console.error('Error fetching user tools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTools();
  }, [user]);

  // Function to get the purchased tool details from Firestore
  const fetchPurchasedToolDetails = async () => {
    try {
      if (!user || !user.uid) {
        throw new Error('User not authenticated');
      }

      // Get user document from Firestore to get purchased_tools array
      const response = await fetch(
        `https://us-central1-rankblaze-138f7.cloudfunctions.net/api/getUserPurchasedTools?userId=${user.uid}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch purchased tools');
      }

      const data = await response.json();
      if (data.purchased_tools && data.purchased_tools.length > 0) {
        setTools(data.purchased_tools);
      }
    } catch (error) {
      console.error('Error fetching purchased tools:', error);
    } finally {
      setLoading(false);
    }
  };

  // Call this function on component mount
  useEffect(() => {
    fetchPurchasedToolDetails();
  }, [user]);

  const handleToolClick = (tool) => {
    // Navigate to the tool's page
    navigate(`/tools/${tool.id}`);
  };

  if (loading) {
    return (
      <div className="my-tools-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your tools...</p>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="my-tools-container empty">
        <h2>My Tools</h2>
        <div className="empty-tools">
          <p>You haven't purchased any tools yet.</p>
          <button 
            className="browse-tools-btn"
            onClick={() => navigate('/marketplace')}
          >
            Browse Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-tools-container">
      <h2>My Tools</h2>
      <div className="tools-grid">
        {tools.map((tool) => (
          <div 
            key={tool.id} 
            className="tool-card"
            onClick={() => handleToolClick(tool)}
          >
            {tool.image && (
              <div className="tool-image">
                <img src={tool.image} alt={tool.name} />
              </div>
            )}
            <div className="tool-info">
              <h3>{tool.name}</h3>
              <p className="tool-description">
                {tool.description && tool.description.length > 100
                  ? `${tool.description.substring(0, 100)}...`
                  : tool.description}
              </p>
              <button className="use-tool-btn">Use Tool</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .my-tools-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        h2 {
          margin-bottom: 20px;
          font-size: 24px;
          color: #333;
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .tool-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }

        .tool-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .tool-image {
          height: 160px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .tool-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .tool-info {
          padding: 16px;
        }

        .tool-info h3 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #333;
        }

        .tool-description {
          color: #666;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .use-tool-btn {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .use-tool-btn:hover {
          background-color: #45a049;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-tools {
          text-align: center;
          padding: 40px 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .browse-tools-btn {
          background-color: #2196F3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 16px;
          transition: background-color 0.3s ease;
        }

        .browse-tools-btn:hover {
          background-color: #0b7dda;
        }
      `}</style>
    </div>
  );
};

export default MyTools; 