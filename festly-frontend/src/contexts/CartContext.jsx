import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getCarrinho,
  adicionarServico,
  removerServico,
  removerSlot,
  limparCarrinho,
  finalizarCompra,
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

  const addItem = useCallback(async (servicoId, dataEvento, horarioEvento = null) => {
    if (!user) return;
    if (!dataEvento) throw new Error('A data do evento é obrigatória.');
    await adicionarServico(user.id, servicoId, dataEvento, horarioEvento);
    await fetchCart();
  }, [user?.id, fetchCart]);

  const addItems = useCallback(async (servicoId, slots) => {
    if (!user) return;
    if (!slots?.length) return;
    for (const { dataEvento, horarioEvento } of slots) {
      await adicionarServico(user.id, servicoId, dataEvento, horarioEvento ?? null);
    }
    await fetchCart();
  }, [user?.id, fetchCart]);

  const removeItem = useCallback(async (servicoId) => {
    if (!user) return;
    await removerServico(user.id, servicoId);
    await fetchCart();
  }, [user?.id, fetchCart]);

  const removeSlot = useCallback(async (servicoId, dataEvento, horarioEvento) => {
    if (!user) return;
    await removerSlot(user.id, servicoId, dataEvento, horarioEvento);
    await fetchCart();
  }, [user?.id, fetchCart]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    await limparCarrinho(user.id);
    setItems([]);
    setTotal(0);
  }, [user?.id]);

  const checkout = useCallback(async () => {
    if (!user) return;
    await finalizarCompra(user.id);
    await fetchCart();
  }, [user?.id, fetchCart]);

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
        removeItem,
        removeSlot,
        clearCart,
        isInCart,
        fetchCart,
        checkout,
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
