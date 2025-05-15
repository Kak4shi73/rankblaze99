import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentError from './components/PaymentError';
import MyTools from './components/MyTools';
import Cart from './components/Cart';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-error" element={<PaymentError />} />
        <Route path="/my-tools" element={<MyTools />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App; 