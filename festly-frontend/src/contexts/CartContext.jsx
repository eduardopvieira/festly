import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getCarrinho,
  adicionarServico,
  removerItem,
  removerSlot,
  limparCarrinho,
} from '../services/carrinhoService';

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
      setItems(data.itens ?? []);
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
  }, [user?.id, fetchCart]);

  const addItem = useCallback(async (servicoId, payload) => {
    if (!user) return;
    if (!payload?.inicio || !payload?.fim) throw new Error('Início e fim são obrigatórios.');
    await adicionarServico(user.id, servicoId, payload);
    await fetchCart();
  }, [user?.id, fetchCart]);

  const addItems = useCallback(async (servicoId, slots, dadosEvento = {}) => {
    if (!user) return;
    if (!slots?.length) return;
    for (const { inicio, fim } of slots) {
      await adicionarServico(user.id, servicoId, { inicio, fim, ...dadosEvento });
    }
    await fetchCart();
  }, [user?.id, fetchCart]);

  const removeItemById = useCallback(async (itemId) => {
    if (!user) return;
    await removerItem(user.id, itemId);
    await fetchCart();
  }, [user?.id, fetchCart]);

  const removeSlot = useCallback(async (servicoId, inicio, fim) => {
    if (!user) return;
    await removerSlot(user.id, servicoId, inicio, fim);
    await fetchCart();
  }, [user?.id, fetchCart]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    await limparCarrinho(user.id);
    setItems([]);
    setTotal(0);
  }, [user?.id]);

  const isInCart = useCallback(
    (servicoId) => items.some((item) => item.servico.id === servicoId),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount: items.length,
        loading,
        addItem,
        addItems,
        removeItem: removeItemById,
        removeSlot,
        clearCart,
        isInCart,
        fetchCart,
      }}
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
