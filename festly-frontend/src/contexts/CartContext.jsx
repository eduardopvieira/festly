import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getCarrinho, adicionarServico, removerServico, limparCarrinho } from '../services/carrinhoService';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await getCarrinho(user.id);
      setItems(data.servicos ?? []);
      setTotal(data.valorTotal ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
      setTotal(0);
    }
  }, [user?.id]);

  const addItem = useCallback(async (servicoId) => {
    if (!user) return;
    await adicionarServico(user.id, servicoId);
    await fetchCart();
  }, [user?.id, fetchCart]);

  const removeItem = useCallback(async (servicoId) => {
    if (!user) return;
    await removerServico(user.id, servicoId);
    await fetchCart();
  }, [user?.id, fetchCart]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    await limparCarrinho(user.id);
    setItems([]);
    setTotal(0);
  }, [user?.id]);

  const isInCart = useCallback(
    (servicoId) => items.some((s) => s.id === servicoId),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, total, itemCount: items.length, loading, addItem, removeItem, clearCart, isInCart, fetchCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart deve ser usado dentro de CartProvider');
  return context;
}
