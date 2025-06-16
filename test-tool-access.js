// Test script to verify tool access functionality
// Run this in browser console on the tool access page

console.log('🧪 Starting Tool Access Test...');

// Function to test subscription access checking
function testToolAccess() {
  const userId = 'test-user-id'; // Replace with actual user ID
  const toolId = 'chatgpt_plus'; // Replace with actual tool ID
  
  console.log(`Testing access for user: ${userId}, tool: ${toolId}`);
  
  // Test the new subscription structure checking
  const subscriptionsRef = firebase.database().ref('subscriptions');
  
  subscriptionsRef.once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const allSubscriptions = snapshot.val();
        console.log('📋 All subscriptions:', allSubscriptions);
        
        // Find user's active subscription
        const userSubscription = Object.entries(allSubscriptions).find(([subId, sub]) => 
          sub.userId === userId && sub.status === 'active'
        );
        
        if (userSubscription) {
          const [subId, subscription] = userSubscription;
          console.log(`✅ Found user subscription: ${subId}`, subscription);
          
          // Check if tool is in subscription
          if (subscription.tools) {
            const toolAccess = subscription.tools.find(tool => 
              typeof tool === 'object' ? tool.id === toolId && tool.status === 'active' : tool === toolId
            );
            
            if (toolAccess) {
              console.log('🎉 Tool access GRANTED!', toolAccess);
              console.log('🔑 User has access to:', toolId);
            } else {
              console.log('❌ Tool NOT found in subscription tools');
              console.log('Available tools:', subscription.tools);
            }
          } else {
            console.log('❌ No tools found in subscription');
          }
        } else {
          console.log('❌ No active subscription found for user');
        }
      } else {
        console.log('❌ No subscriptions found in database');
      }
    })
    .catch((error) => {
      console.error('❌ Error checking subscriptions:', error);
    });
}

// Function to test token fetching
function testTokenFetching() {
  const toolId = 'chatgpt_plus'; // Replace with actual tool ID
  
  console.log(`Testing token fetch for tool: ${toolId}`);
  
  const possibleIds = ['chatgpt_plus', 'chatgpt', 'tool_1', '1'];
  
  possibleIds.forEach(possibleId => {
    const tokenRef = firebase.database().ref(`toolTokens/${possibleId}`);
    
    tokenRef.once('value')
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log(`🔑 Found token for ${possibleId}:`, data);
          
          if (Array.isArray(data)) {
            console.log(`📝 Multiple tokens found (${data.length}):`, data);
          } else if (typeof data === 'object') {
            if (data.value) {
              console.log(`📝 Token value:`, data.value);
            } else {
              console.log(`📝 Token object:`, JSON.stringify(data));
            }
          } else {
            console.log(`📝 Token string:`, data);
          }
        } else {
          console.log(`❌ No token found for ${possibleId}`);
        }
      })
      .catch((error) => {
        console.error(`❌ Error fetching token for ${possibleId}:`, error);
      });
  });
}

// Function to check current page functionality
function testCurrentPage() {
  console.log('📄 Testing current page...');
  console.log('Current URL:', window.location.href);
  
  // Check if ToolAccess component elements exist
  const accessElements = {
    'Loading spinner': document.querySelector('.animate-spin'),
    'Access granted section': document.querySelector('[class*="Access Granted"]'),
    'Purchase button': document.querySelector('[class*="Purchase"]'),
    'Error message': document.querySelector('[class*="error"]')
  };
  
  Object.entries(accessElements).forEach(([name, element]) => {
    if (element) {
      console.log(`✅ Found: ${name}`);
    } else {
      console.log(`❌ Not found: ${name}`);
    }
  });
  
  // Check console for debug messages
  console.log('💡 Check browser console for ToolAccess debug messages starting with "🔍", "✅", or "❌"');
}

// Run all tests
console.log('🚀 Running all tests...');
testCurrentPage();
testToolAccess();
testTokenFetching();

console.log(`
📋 Test completed! 

To manually test:
1. Log in as a user who has admin-granted tools
2. Navigate to any tool access page (e.g., /tool-access/chatgpt_plus)
3. Check browser console for debug messages
4. Verify if you see "Access Granted" page with tokens

If you see "Access Required" page:
- Check if user has active subscription in database
- Verify tool is in subscription.tools array
- Check if tokens exist in toolTokens path

Admin can grant tools via Admin Panel → Users → Assign Tool
`); 