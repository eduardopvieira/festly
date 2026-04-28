import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { buscarServico, atualizarServico, uploadFoto, deletarFoto } from '../services/servicoService';
import { toast } from 'sonner';
import ServicoForm from '../components/ServicoForm';
import DisponibilidadeSemanalEditor from '../components/DisponibilidadeSemanalEditor';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export default function EditarServico() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [defaultValues, setDefaultValues] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    buscarServico(id)
      .then(({ data }) => {
        setDefaultValues({
          nome: data.nome,
          preco: Number(data.preco),
          tipoCobranca: data.tipoCobranca,
          categoria: data.categoria,
          cidade: data.cidade,
          descricao: data.descricao ?? '',
          disponivel: data.disponivel,
        });
        setFotos(data.fotos ?? []);
      })
      .catch(() => {
        toast.error('Serviço não encontrado.');
        navigate('/meus-servicos');
      });
  }, [id]);

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      await atualizarServico(id, { ...values, usuarioId: user.id });
      toast.success('Serviço atualizado com sucesso!');
      navigate('/meus-servicos');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao atualizar serviço.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadFoto(id, file);
      setFotos((prev) => [...prev, data]);
    } catch {
      toast.error('Erro ao fazer upload da foto.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDeleteFoto(fotoId) {
    try {
      await deletarFoto(id, fotoId);
      setFotos((prev) => prev.filter((f) => f.id !== fotoId));
    } catch {
      toast.error('Erro ao remover foto.');
    }
  }

  if (!defaultValues) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-96 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/meus-servicos">
          <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Meus serviços
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Editar serviço</h1>
        <p className="mt-1 text-muted-foreground">Atualize os dados do seu serviço.</p>
      </div>

      <Card className="py-0">
        <CardContent className="p-6">
          <ServicoForm
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            titulo="Salvar alterações"
          />
        </CardContent>
      </Card>

      <div className="mt-6 space-y-6">
        <DisponibilidadeSemanalEditor servicoId={id} />

        <Card className="py-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Fotos do serviço</h2>
                <p className="text-xs text-muted-foreground">{fotos.length}/5 fotos</p>
              </div>
              {fotos.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar foto
                </Button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </div>

            {fotos.length === 0 && !uploading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma foto adicionada ainda.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {fotos.map((foto) => (
                  <div key={foto.id} className="relative group">
                    <img
                      src={`${API_BASE}${foto.url}`}
                      alt=""
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button
                      onClick={() => handleDeleteFoto(foto.id)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {uploading && (
                  <div className="w-full h-24 rounded-md bg-muted animate-pulse" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
