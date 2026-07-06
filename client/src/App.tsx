import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from 'react';
import { Skeleton } from 'antd';
import BasicLayout from '@layouts/BasicLayout';
import ProtectedRoute from '@components/ProtectedRoute';
import UserGuide from '@components/UserGuide';

const Home = lazy(() => import('@pages/Home'));
const Login = lazy(() => import('@pages/Login'));
const Register = lazy(() => import('@pages/Register'));
const ForgotPassword = lazy(() => import('@pages/ForgotPassword'));
const NotFound = lazy(() => import('@pages/NotFound'));
const Products = lazy(() => import('@pages/Products'));
const ProductDetail = lazy(() => import('@pages/ProductDetail'));
const Cart = lazy(() => import('@pages/Cart'));
const Checkout = lazy(() => import('@pages/Checkout'));
const PaySuccess = lazy(() => import('@pages/PaySuccess'));
const Orders = lazy(() => import('@pages/Orders'));
const OrderDetail = lazy(() => import('@pages/OrderDetail'));
const User = lazy(() => import('@pages/User'));
const Games = lazy(() => import('@pages/Games'));
const WheelGame = lazy(() => import('@pages/WheelGame'));
const ScratchGame = lazy(() => import('@pages/ScratchGame'));
const MemoryGame = lazy(() => import('@pages/MemoryGame'));
const Game2048Page = lazy(() => import('@pages/Game2048'));
const ReactionGame = lazy(() => import('@pages/ReactionGame'));
const GameResult = lazy(() => import('@pages/GameResult'));
const Prizes = lazy(() => import('@pages/Prizes'));
const Admin = lazy(() => import('@pages/Admin'));
const SearchPage = lazy(() => import('@pages/SearchPage'));
const Achievements = lazy(() => import('@pages/Achievements'));
const Notifications = lazy(() => import('@pages/Notifications'));

function PageLoader() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
    <UserGuide />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<BasicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pay-success/:orderId"
            element={
              <ProtectedRoute>
                <PaySuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <User />
              </ProtectedRoute>
            }
          />
          <Route path="/games" element={<Games />} />
          <Route path="/games/wheel" element={<WheelGame />} />
          <Route path="/games/scratch" element={<ScratchGame />} />
          <Route path="/games/memory" element={<MemoryGame />} />
          <Route path="/games/2048" element={<Game2048Page />} />
          <Route path="/games/reaction" element={<ReactionGame />} />
          <Route path="/games/result" element={<GameResult />} />
          <Route
            path="/prizes"
            element={
              <ProtectedRoute>
                <Prizes />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="/search" element={<SearchPage />} />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
    </HelmetProvider>
  );
}
