import { useState, useEffect } from "react";
import api from "../../api/api";
import { API_ENDPOINTS } from "../../api/EndPoints";

export default function TemporaryCredit() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [paymentInput, setPaymentInput] = useState("");
  const [popupMsg, setPopupMsg] = useState("");
  const [popupType, setPopupType] = useState("");

  useEffect(() => {
    fetchTemporaryCredit();
  }, []);

  const fetchTemporaryCredit = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.TEMPORARY_SALES);
      const data = res.data || [];

      // ✅ FILTER: Only temporary sales
      const tempSales = data.filter((sale) => sale.saleType === "temporary");

      // ✅ Group by customer name + phone to get unique customers
      const customersMap = new Map();

      tempSales.forEach((sale) => {
        const name = sale.customerInfo?.name;
        const phone = sale.customerInfo?.phone || "";

        // ✅ Skip if no name
        if (!name || name.trim() === "") return;

        const key = `${name}-${phone}`;

        if (!customersMap.has(key)) {
          customersMap.set(key, {
            _id: key,
            customerInfo: { name, phone },
            sales: [],
            total: 0,
            paidAmount: 0,
            createdAt: sale.createdAt,
          });
        }

        const customer = customersMap.get(key);
        customer.sales.push(sale);
        customer.total += sale.total || 0;
        customer.paidAmount += sale.paidAmount || 0;

        // Keep latest date
        if (new Date(sale.createdAt) > new Date(customer.createdAt)) {
          customer.createdAt = sale.createdAt;
        }
      });

      // ✅ Convert to array and sort by latest
      const customers = Array.from(customersMap.values()).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setEntries(customers);
    } catch (err) {
      setPopupMsg("Error loading temporary credit data");
      setPopupType("error");
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (entry) => {
    setCurrentEntry(entry);
    setPaymentInput("");
    setPopupMsg("");
    setPopupType("");
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setCurrentEntry(null);
    setPaymentInput("");
    setPopupMsg("");
    setPopupType("");
  };

  const remainingAmount =
    (currentEntry?.total || 0) - (currentEntry?.paidAmount || 0);

  const handlePaymentChange = (e) => {
    let value = Number(e.target.value);
    if (value < 0) value = 0;
    if (value > remainingAmount) value = remainingAmount;
    setPaymentInput(value);
  };

  const savePayment = async () => {
    const newPayment = Number(paymentInput);
    if (!newPayment || newPayment <= 0) {
      setPopupMsg("Please enter valid amount");
      setPopupType("error");
      return;
    }

    try {
      // ✅ Update all sales for this customer
      const updatePromises = currentEntry.sales.map((sale) => {
        const saleRemaining = (sale.total || 0) - (sale.paidAmount || 0);
        if (saleRemaining <= 0) return null;

        const paymentForThisSale = Math.min(newPayment, saleRemaining);
        const newPaid = (sale.paidAmount || 0) + paymentForThisSale;
        const newRemaining = sale.total - newPaid;

        return api.patch(API_ENDPOINTS.SALE_BY_ID(sale._id), {
          paidAmount: newPaid,
          remainingDue: newRemaining > 0 ? newRemaining : 0,
        });
      });

      await Promise.all(updatePromises.filter(Boolean));

      setPopupMsg(`RS ${newPayment} payment recorded successfully!`);
      setPopupType("success");

      await fetchTemporaryCredit();

      setTimeout(() => {
        closePaymentModal();
      }, 1500);
    } catch (err) {
      console.error("Payment error:", err);
      setPopupMsg("Payment update failed");
      setPopupType("error");
    }
  };

  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4 fw-bold">Temporary Credit Customers</h2>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Total Sales</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Remaining</th>
                  <th>Last Sale Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <div className="spinner-border text-primary" />
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-muted">
                      No temporary credit customers
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const remaining =
                      (entry.total || 0) - (entry.paidAmount || 0);
                    const isPaid =
                      remaining <= 0 && (entry.paidAmount || 0) > 0;

                    return (
                      <tr key={entry._id}>
                        <td className="fw-bold">
                          {entry.customerInfo?.name || "Unknown"}
                        </td>
                        <td>{entry.customerInfo?.phone || "-"}</td>
                        <td>
                          <span className="badge bg-info">
                            {entry.sales.length} sale(s)
                          </span>
                        </td>
                        <td>RS{(entry.total || 0).toFixed(2)}</td>
                        <td className="text-success fw-bold">
                          RS{(entry.paidAmount || 0).toFixed(2)}
                        </td>
                        <td className={isPaid ? "text-success" : "text-danger"}>
                          <strong>RS{remaining.toFixed(2)}</strong>
                        </td>
                        <td>{formatDateTime(entry.createdAt)}</td>
                        <td>
                          <span
                            className={`badge ${
                              isPaid ? "bg-success" : "bg-danger"
                            }`}
                          >
                            {isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td>
                          {!isPaid && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => openPaymentModal(entry)}
                            >
                              <i className="bi bi-cash-coin me-1"></i> Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && currentEntry && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  Record Payment -{" "}
                  {currentEntry.customerInfo?.name || "Customer"}
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={closePaymentModal}
                />
              </div>

              <div className="modal-body text-center">
                <p>
                  Total Sales:{" "}
                  <strong className="badge bg-info">
                    {currentEntry.sales.length}
                  </strong>
                </p>
                <p>
                  Total Amount:{" "}
                  <strong>RS{currentEntry.total?.toFixed(2)}</strong>
                </p>
                <p>
                  Remaining: <strong>RS{remainingAmount.toFixed(2)}</strong>
                </p>

                <div className="input-group w-75 mx-auto">
                  <span className="input-group-text">RS</span>
                  <input
                    type="number"
                    className="form-control text-center"
                    value={paymentInput}
                    onChange={handlePaymentChange}
                    max={remainingAmount}
                    min="0"
                  />
                </div>

                {popupMsg && (
                  <div
                    className={`mt-3 alert ${
                      popupType === "success" ? "alert-success" : "alert-danger"
                    } py-2`}
                  >
                    {popupMsg}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={closePaymentModal}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success px-4"
                  onClick={savePayment}
                  disabled={!paymentInput || paymentInput <= 0}
                >
                  Save Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
