import { useState, useEffect } from "react";
import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";
import { API_ENDPOINTS } from "../api/EndPoints";
import { format } from "date-fns";

export default function SaleHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.SALE);
      const data = res.data || [];
      setSales(
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      );
      setLoading(false);
    } catch (err) {
      addNotification("error", "Failed to load sales history");
      setLoading(false);
    }
  };

  const filteredSales = sales.filter((sale) => {
    const query = searchQuery.toLowerCase();
    return (
      sale._id?.toLowerCase().includes(query) ||
      sale.customer?.name?.toLowerCase().includes(query) ||
      sale.customer?.phone?.toLowerCase().includes(query) ||
      sale.customerInfo?.name?.toLowerCase().includes(query) ||
      sale.customerInfo?.phone?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  // Summary calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySales = sales.filter((s) => new Date(s.createdAt) >= today);
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

  const thisMonthSales = sales.filter((s) => {
    const date = new Date(s.createdAt);
    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  });
  const monthTotal = thisMonthSales.reduce((sum, s) => sum + s.total, 0);

  const allTotal = sales.reduce((sum, s) => sum + s.total, 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Customer Label –
  const getCustomerLabel = (sale) => {
    if (sale.customer) {
      const name = sale.customer.name?.trim() || "Unknown Customer";
      return (
        <>
          <strong>{name}</strong>
          <br />
          <small className="text-primary fw-medium">Permanent Credit</small>
        </>
      );
    }

    if (sale.customerInfo) {
      const name = sale.customerInfo.name?.trim() || "Walk-in Customer";
      const phone = sale.customerInfo.phone || "No phone";
      return (
        <>
          <strong>{name}</strong>
          <br />
          <small className="text-warning fw-medium">
            Temporary Credit • {phone}
          </small>
        </>
      );
    }

    return <span className="text-success fw-bold">Cash Sale</span>;
  };

  const getPaymentMethodLabel = (sale) => {
    if (sale.saleType === "permanent" || sale.saleType === "temporary") {
      return (
        <span className="badge bg-warning text-dark rounded-pill px-3 py-2">
          Credit
        </span>
      );
    }

    if (sale.saleType === "cash") {
      if (sale.payments && sale.payments.length > 0) {
        const methods = sale.payments
          .map((p) => {
            const method = p.method?.toLowerCase() || "cash";
            if (method.includes("cash")) return "Cash";
            if (method.includes("easy") || method.includes("easypaisa"))
              return "EasyPaisa";
            if (method.includes("jazz") || method.includes("jazzcash"))
              return "JazzCash";
            if (method.includes("bank") || method.includes("transfer"))
              return "Bank Transfer";
            if (method.includes("card")) return "Card";
            if (method.includes("upi")) return "UPI";
            return method.charAt(0).toUpperCase() + method.slice(1);
          })
          .filter(Boolean);

        const uniqueMethods = [...new Set(methods)];
        return (
          <span className="badge bg-success text-white rounded-pill px-3 py-2">
            {uniqueMethods.join(" + ")}
          </span>
        );
      }

      return (
        <span className="badge bg-success text-white rounded-pill px-3 py-2">
          Cash
        </span>
      );
    }

    return (
      <span className="badge bg-secondary rounded-pill px-3 py-2">Unknown</span>
    );
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="fw-bold mb-4">Sales History</h2>

      {/* Summary Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div
            className="card border-0 shadow-sm text-center p-4 text-white rounded-3"
            style={{ background: "rgb(253 126 20)" }}
          >
            <h5 className="mb-1">Today's Sales</h5>
            <h3 className="fw-bold mb-1">RS{todayTotal.toLocaleString()}</h3>
            <small>{todaySales.length} transactions</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center p-4 bg-success text-white rounded-3">
            <h5 className="mb-1">This Month</h5>
            <h3 className="fw-bold mb-1">RS{monthTotal.toLocaleString()}</h3>
            <small>{thisMonthSales.length} transactions</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center p-4 bg-info text-white rounded-3">
            <h5 className="mb-1">All Time</h5>
            <h3 className="fw-bold mb-1">RS{allTotal.toLocaleString()}</h3>
            <small>{sales.length} transactions</small>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-center">
            <div className="col-lg-8">
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control form-control-lg ps-5 rounded-pill"
                  placeholder="Search by Sale ID, Customer Name or Phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-5"></i>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <small className="text-muted">
                Showing {paginatedSales.length} of {filteredSales.length} sales
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="bg-light border-bottom">
                <tr>
                  <th className="ps-3 py-2 text-uppercase text-muted fw-semibold">
                    Date
                  </th>
                  <th className="py-2 text-uppercase text-muted fw-semibold">
                    Sale ID
                  </th>
                  <th className="py-2 text-uppercase text-muted fw-semibold">
                    Customer
                  </th>
                  <th className="py-2 text-uppercase text-muted fw-semibold">
                    Payment
                  </th>
                  <th className="text-end pe-3 py-2 text-uppercase text-muted fw-semibold">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedSales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="cursor-pointer border-bottom"
                    onClick={() => setSelectedSale(sale)}
                  >
                    <td className="ps-3 py-2 text-muted">
                      {formatDate(sale.createdAt)}
                    </td>

                    <td className="py-2 fw-semibold text-primary">
                      #{sale._id.slice(-6).toUpperCase()}
                    </td>

                    <td className="py-2 lh-sm">{getCustomerLabel(sale)}</td>

                    <td className="py-2">{getPaymentMethodLabel(sale)}</td>

                    <td className="text-end pe-3 py-2 fw-semibold text-success">
                      RS {sale.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-body border-top py-2 px-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Page {page} of {totalPages}
              </small>

              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Modal – same rahega */}
      {selectedSale && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-receipt me-2"></i>
                  Sale Details - #{selectedSale._id.slice(-6).toUpperCase()}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedSale(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <small className="text-muted">Date & Time</small>
                    <p className="fw-bold fs-5 mb-0">
                      {formatDate(selectedSale.createdAt)}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">Customer</small>
                    <p className="fw-bold fs-5 mb-0">
                      {getCustomerLabel(selectedSale)}
                    </p>
                  </div>
                </div>

                <h6 className="fw-bold mb-3">
                  Items Purchased ({selectedSale.items?.length || 0})
                </h6>
                <div className="table-responsive mb-4">
                  <table className="table table-bordered align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end">Discount</th>
                        <th className="text-end">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="text-muted">{idx + 1}</td>
                          <td className="fw-medium">{item.name}</td>
                          <td className="text-center">{item.qty}</td>
                          <td className="text-end">
                            RS{item.price.toLocaleString()}
                          </td>
                          <td className="text-end text-danger">
                            -{item.itemDiscount || 0}
                          </td>
                          <td className="text-end fw-bold">
                            RS
                            {(
                              (item.price - (item.itemDiscount || 0)) *
                              item.qty
                            ).toLocaleString()}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            No items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-4">
                  <div className="col-md-6">
                    <div className="bg-light p-3 rounded">
                      <small className="text-muted">Payment Method</small>
                      <p className="fw-bold mb-0 fs-5">
                        {getPaymentMethodLabel(selectedSale)}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6 text-end">
                    <div className="bg-primary text-white p-4 rounded">
                      <small className="opacity-75">Grand Total</small>
                      <h2 className="fw-bold mb-0">
                        RS{selectedSale.total.toLocaleString()}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary px-4"
                  onClick={() => setSelectedSale(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
