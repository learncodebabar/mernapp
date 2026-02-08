import { useState, useEffect } from "react";
import api from "../../api/api";
import { API_ENDPOINTS } from "../../api/EndPoints";

export default function CashCustomers() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashSales();
  }, []);

  const fetchCashSales = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.CASH_SALE);
      setSales(res.data || []);
      setLoading(false);
    } catch (err) {
      alert("Error loading cash sales");
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Cash Customers / Payments</h2>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Invoice ID</th>
                  <th>Payment Method</th>
                  <th>Amount Paid</th>
                  <th>Change</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="spinner-border" />
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No cash sales yet
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id}>
                      <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                      <td>{sale._id.slice(-8)}</td>
                      <td>
                        {sale.payments?.map((p) => p.method).join(", ") ||
                          "Cash"}
                      </td>
                      <td className="fw-bold text-success">
                        RS{sale.paidAmount?.toFixed(2)}
                      </td>
                      <td>RS{(sale.paidAmount - sale.total).toFixed(2)}</td>
                      <td>{sale.items.length} items</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
