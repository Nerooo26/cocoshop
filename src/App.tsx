import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SellerLayout } from './layouts/SellerLayout';
import { LoginPage } from './pages/LoginPage';
import { StorefrontEditorPage } from './pages/StorefrontEditorPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { InventoryReportPage } from './pages/InventoryReportPage';
import { RequireSellerAuth } from './components/RequireSellerAuth';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SellerLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/storefront-editor"
            element={
              <RequireSellerAuth>
                <StorefrontEditorPage />
              </RequireSellerAuth>
            }
          />
          <Route
            path="/inventory"
            element={
              <RequireSellerAuth>
                <InventoryPage />
              </RequireSellerAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireSellerAuth>
                <ReportsPage />
              </RequireSellerAuth>
            }
          />
          <Route
            path="/inventory-report"
            element={
              <RequireSellerAuth>
                <InventoryReportPage />
              </RequireSellerAuth>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
