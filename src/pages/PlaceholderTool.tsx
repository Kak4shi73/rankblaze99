import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PlaceholderTool = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Since we're not using temporary tools anymore, redirect to tools page
    navigate('/tools');
  }, [navigate]);

  return null;
};

export default PlaceholderTool; 