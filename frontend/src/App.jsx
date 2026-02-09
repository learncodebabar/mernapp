import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider } from "./context/AuthContext";  //
// import ProtectedRoute from "./components/ProtectedRoute";  //

// Pages aaded
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

// Auth Pages - OPTIONAL ab ye pages ki zarurat nahi
// import OwnerLogin from "./pages/auth/OwnerLogin";
// import EmployeeLogin from "./pages/auth/EmployeeLogin";
// import OwnerRegister from "./pages/auth/OwnerRegister";
// import ForgotPassword from "./pages/auth/ForgotPassword.jsx";

function App() {
  return (
    <BrowserRouter>
      {/* <AuthProvider> sREMOVE */}
      <Routes>
        {/* Public Routes - Ab zarurat nahi */}
        {/* <Route path="/login" element={<OwnerLogin />} />
          <Route path="/owner-login" element={<OwnerLogin />} />
          <Route path="/employee-login" element={<EmployeeLogin />} />
          <Route path="/owner-register" element={<OwnerRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> */}

        {/*  Direct Routes WITHOUT Protection */}
        <Route path="/*" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="locations" element={<Locations />} />
          <Route path="categories" element={<Categories />} />
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
        </Route>

        {/* Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* </AuthProvider>  ❌ REMOVE */}
    </BrowserRouter>
  );
}

export default App;
