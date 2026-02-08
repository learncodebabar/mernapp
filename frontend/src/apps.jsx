import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./api/api";

import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Layout from "./components/layout.jsx";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/products/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import SalesPOS from "./pages/SalesPOS.jsx";
import CashCustomers from "./pages/customers/CashCustomers.jsx";
import PermanentCredit from "./pages/customers/PermanentCredit.jsx";
import TemporaryCredit from "./pages/customers/TemporaryCredit.jsx";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import Layout from "./components/layout.jsx";
import Setting from "./pages/Settings.jsx";
import SalesHistoryPage from "./pages/SalesHistory.jsx";
import Categories from "./pages/products/Categories.jsx";
import Locations from "./pages/products/Locations.jsx";

function App() {
  const [isChecking, setIsChecking] = useState(true);
  const [needsRegister, setNeedsRegister] = useState(false);

  useEffect(() => {
    const checkFirstAdmin = async () => {
      try {
        const res = await api.get("/auth/check-first-admin");
        setNeedsRegister(res.data.needsRegister);
      } catch (err) {
        console.error("Check failed", err);
        setNeedsRegister(true);
      } finally {
        setIsChecking(false);
      }
    };
    checkFirstAdmin();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* First-time: Register only */}
        {needsRegister ? (
          <>
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* Protected Routes (baad mein add karenge) */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route path="products" element={<Products />} />
        <Route path="locations" element={<Locations />} />
        <Route path="categories" element={<Categories />} />

        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="sales/pos" element={<SalesPOS />} />
        <Route path="sales/history" element={<SalesHistoryPage />} />
        <Route path="customers/cash" element={<CashCustomers />} />
        <Route
          path="customers/permanent-credit"
          element={<PermanentCredit />}
        />
        <Route
          path="customers/temporary-credit"
          element={<TemporaryCredit />}
        />
        <Route path="employees" element={<Employees />} />
        <Route path="reports" element={<Reports />} />
        <Route path="setting" element={<Setting />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
