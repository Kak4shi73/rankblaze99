import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import PaymentPage from './pages/PaymentPage';
import Tools from './pages/Tools';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import RefundPolicy from './pages/RefundPolicy';
import NotFound from './pages/NotFound';
import ToolAccess from './pages/ToolAccess';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import UpdateTokens from './pages/UpdateTokens';
import Reviews from './pages/Reviews';
import About from './pages/About';
// import FAQ from './pages/FAQ';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MainLayout from './components/layout/MainLayout';
import AuthGuard from './components/auth/AuthGuard';
import AdminGuard from './components/auth/AdminGuard';
import SessionManager from './components/SessionManager';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
            {/* Session timeout manager */}
            <SessionManager />
            <MainLayout>
              <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 text-gray-100 flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/about" element={<About />} />
                    {/* <Route path="/faq" element={<FAQ />} /> */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <AuthGuard>
                          <Dashboard />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/tool-access/:toolId" 
                      element={
                        <AuthGuard>
                          <ToolAccess />
                        </AuthGuard>
                      } 
                    />
                    <Route path="/cart" element={<Cart />} />
                    <Route 
                      path="/payment" 
                      element={
                        <AuthGuard>
                          <PaymentPage />
                        </AuthGuard>
                      } 
                    />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/refund" element={<RefundPolicy />} />
                    <Route path="/support" element={<Navigate to="/" replace />} />
                    <Route path="/reviews" element={<Reviews />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                      path="/admin"
                      element={
                        <AdminGuard>
                          <Admin />
                        </AdminGuard>
                      }
                    />
                    <Route
                      path="/admin/update-tokens"
                      element={
                        <AdminGuard>
                          <UpdateTokens />
                        </AdminGuard>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </MainLayout>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;