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
import NovoServico from '../pages/NovoServico';
import EditarServico from '../pages/EditarServico';
import Carrinho from '../pages/Carrinho';
import NotFound from '../pages/NotFound';
import ServiceRegister from '@/pages/ServiceRegister';

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
      { path: '/meus-servicos/novo', element: <NovoServico /> },
      { path: '/meus-servicos/editar/:id', element: <EditarServico /> },
      { path: '/dashboard/carrinho', element: <Carrinho /> },
    ],
  },
]);

export default router;
