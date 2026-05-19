import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';
import Services from '../pages/Services';
import Dashboard from '../pages/Dashboard';
import Perfil from '../pages/Perfil';
import MeusServicos from '../pages/MeusServicos';
import ServicoWizard from '../pages/ServicoWizard';
import EditarServico from '../pages/EditarServico';
import Carrinho from '../pages/Carrinho';
import MeusAgendamentos from '../pages/MeusAgendamentos';
import Solicitacoes from '../pages/Solicitacoes';
import MeusServicosAvaliacoes from '../pages/MeusServicosAvaliacoes';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/catalogo', element: <Services /> },
      { path: '/services', element: <Services /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/verify-email', element: <VerifyEmail /> },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/dashboard/servicos', element: <Services /> },
      { path: '/perfil', element: <Perfil /> },
      { path: '/meus-servicos', element: <MeusServicos /> },
      { path: '/meus-servicos/novo', element: <ServicoWizard /> },
      { path: '/meus-servicos/editar/:id', element: <EditarServico /> },
      { path: '/meus-servicos/:id/avaliacoes', element: <MeusServicosAvaliacoes /> },
      { path: '/dashboard/carrinho', element: <Carrinho /> },
      { path: '/meus-agendamentos', element: <MeusAgendamentos /> },
      { path: '/solicitacoes', element: <Solicitacoes /> },
    ],
  },
]);

export default router;
