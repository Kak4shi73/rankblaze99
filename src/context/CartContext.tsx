import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createOrder } from '../utils/cashfree';
import { db } from '../config/firebase';
import { ref, set } from 'firebase/database';
import { useAuth } from './AuthContext';

interface CartItem {
  id: number;
  name: string;
  price: number;
  billingCycle?: 'monthly' | 'annual';
  type?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
  pendingOrderId: string | null;
  isCreatingOrder: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Load cart from localStorage on initial load
    const storedCart = localStorage.getItem('cart');
    const storedOrderId = localStorage.getItem('pendingOrderId');
    
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
    
    if (storedOrderId) {
      setPendingOrderId(storedOrderId);
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // If cart is empty, clear pending order ID
    if (cartItems.length === 0) {
      setPendingOrderId(null);
      localStorage.removeItem('pendingOrderId');
    }
  }, [cartItems]);

  useEffect(() => {
    // Save pending order ID to localStorage
    if (pendingOrderId) {
      localStorage.setItem('pendingOrderId', pendingOrderId);
    } else {
      localStorage.removeItem('pendingOrderId');
    }
  }, [pendingOrderId]);

  const createCashfreeOrder = async (items: CartItem[]) => {
    if (!items.length || !user) return null;
    
    try {
      setIsCreatingOrder(true);
      
      // Calculate total
      const subtotal = items.reduce((total, item) => total + item.price, 0);
      const transactionFee = subtotal * 0.022; // 2.2% transaction fee
      const gstOnFee = transactionFee * 0.18; // 18% GST on transaction fee
      const total = subtotal + transactionFee + gstOnFee;
      
      // Generate a unique order ID
      const uniqueOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Create an order in Cashfree
      const orderOptions = {
        amount: Math.round(total * 100) / 100, // Ensure proper rounding
        currency: 'INR',
        customerName: user?.name || '',
        customerPhone: '9999999999', // Use a default phone number
        customerEmail: user?.email || '',
        notes: {
          userId: user?.id || '',
          items: JSON.stringify(items.map(item => ({ id: item.id, name: item.name })))
        }
      };
      
      console.log('Creating pre-order with options:', orderOptions);
      
      // Save pending order to database
      const pendingOrderRef = ref(db, `orders/${uniqueOrderId}`);
      await set(pendingOrderRef, {
        userId: user?.id,
        amount: Math.round(total * 100) / 100,
        items: items,
        status: 'pending',
        paymentMethod: 'cashfree',
        createdAt: new Date().toISOString(),
      });
      
      // Create order with Cashfree
      const order = await createOrder(orderOptions);
      
      if (!order || !order.payment_session_id) {
        throw new Error('Failed to create pre-order');
      }
      
      // Update order with payment session ID
      await set(pendingOrderRef, {
        userId: user?.id,
        amount: Math.round(total * 100) / 100,
        items: items,
        status: 'pre_order',
        paymentMethod: 'cashfree',
        orderId: order.orderId,
        paymentSessionId: order.payment_session_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log('Pre-order created:', order);
      setPendingOrderId(order.orderId);
      
      return order.orderId;
    } catch (error) {
      console.error('Failed to create pre-order:', error);
      return null;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const addToCart = async (item: CartItem) => {
    // Check if item already exists in cart
    if (!isInCart(item.id)) {
      const newCartItems = [...cartItems, item];
      setCartItems(newCartItems);
      
      // Don't create an order on cart add - only create when checking out
      // This prevents multiple orders from being created
      /* 
      if (user) {
        await createCashfreeOrder(newCartItems);
      }
      */
    }
  };

  const removeFromCart = (id: number) => {
    const newItems = cartItems.filter((item) => item.id !== id);
    setCartItems(newItems);
    
    // Don't create an order when removing items either
    /*
    // If there are still items in the cart, create a new order
    if (newItems.length > 0 && user) {
      createCashfreeOrder(newItems);
    }
    */
  };

  const clearCart = () => {
    setCartItems([]);
    setPendingOrderId(null);
  };

  const isInCart = (id: number) => {
    return cartItems.some((item) => item.id === id);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        pendingOrderId,
        isCreatingOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};