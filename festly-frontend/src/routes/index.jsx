import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';
import Services from '../pages/Services';
import MeusServicos from '../pages/MeusServicos';
import NovoServico from '../pages/NovoServico';
import EditarServico from '../pages/EditarServico';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/services', element: <Services /> },
      { path: '/meus-servicos', element: <MeusServicos /> },
      { path: '/meus-servicos/novo', element: <NovoServico /> },
      { path: '/meus-servicos/editar/:id', element: <EditarServico /> },
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
]);

export default router;
