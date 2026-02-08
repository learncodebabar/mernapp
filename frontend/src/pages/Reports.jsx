import { useState, useEffect } from "react";
import api from "../api/api";
import { API_ENDPOINTS } from "../api/EndPoints";

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    fetchReport();
  }, [dateRange, customStart, customEnd]);

  const fetchReport = async () => {
    try {
      let url = API_ENDPOINTS.SALE_REPORT;
      const params = new URLSearchParams();

      if (dateRange === "today") {
        const today = new Date().toISOString().split("T")[0];
        params.append("start", today);
        params.append("end", today);
      } else if (dateRange === "yesterday") {
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];
        params.append("start", yesterday);
        params.append("end", yesterday);
      } else if (dateRange === "last7") {
        const end = new Date().toISOString().split("T")[0];
        const start = new Date(Date.now() - 7 * 86400000)
          .toISOString()
          .split("T")[0];
        params.append("start", start);
        params.append("end", end);
      } else if (dateRange === "custom" && customStart && customEnd) {
        params.append("start", customStart);
        params.append("end", customEnd);
      }

      if (params.toString()) url += `?${params.toString()}`;

      const res = await api.get(url);
      setReportData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching report:", err);
      alert("Unable to load report");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
        />
        <p className="mt-3 text-muted">Loading report...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container-fluid py-5 text-center text-muted">
        No data available
      </div>
    );
  }

  // Calculate Recovered Credit
  const recoveredAmount = reportData.recoveredAmount || 0;
  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Sales Report</h2>

        <div className="d-flex gap-3 align-items-center">
          <select
            className="form-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === "custom" && (
            <div className="d-flex gap-2">
              <input
                type="date"
                className="form-control"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <input
                type="date"
                className="form-control"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="row g-3 mb-5">
        {/* Total Sales */}
        <div className="col-md-6 col-lg-3 col-xl">
          <div className="card border-0 shadow-sm h-100 text-center p-3 bg-danger text-white">
            <h6 className="mb-1 fw-bold">Total Sales</h6>
            <h3 className="fw-bold mb-0">
              RS{(reportData.totalSales || 0).toFixed(0)}
            </h3>
            <small className="opacity-75">
              {reportData.saleCount || 0} orders
            </small>
          </div>
        </div>

        {/* Cash Sales */}
        <div className="col-md-6 col-lg-3 col-xl">
          <div className="card border-0 shadow-sm h-100 text-center p-3 bg-success text-white">
            <h6 className="mb-1 fw-bold">Cash Sales</h6>
            <h3 className="fw-bold mb-0">
              RS{(reportData.cashSales || 0).toFixed(0)}
            </h3>
            <small className="opacity-75">
              {reportData.cashCount || 0} orders
            </small>
          </div>
        </div>

        {/* Credit Sales */}
        <div className="col-md-6 col-lg-3 col-xl">
          <div className="card border-0 shadow-sm h-100 text-center p-3 bg-warning text-dark">
            <h6 className="mb-1 fw-bold">Credit Sales</h6>
            <h3 className="fw-bold mb-0">
              RS{(reportData.creditSales || 0).toFixed(0)}
            </h3>
            <small>{reportData.creditCount || 0} orders</small>
          </div>
        </div>

        {/* Recovered Credit  */}
        <div className="col-md-6 col-lg-3 col-xl">
          <div
            className="card border-0 shadow-sm h-100 text-center p-3 bg-teal text-white"
            style={{ backgroundColor: "#20c997" }}
          >
            <h6 className="mb-1 fw-bold">Recovered Credit</h6>
            <h3 className="fw-bold mb-0">RS{recoveredAmount.toFixed(0)}</h3>
            <small className="opacity-75">In this period</small>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="col-md-12 col-lg-3 col-xl">
          <div className="card border-0 shadow-sm h-100 text-center p-3 bg-info text-white">
            <h6 className="mb-1 fw-bold">Estimated Profit</h6>
            <h3 className="fw-bold mb-0">
              RS{(reportData.profit || 0).toFixed(0)}
            </h3>
            <small className="opacity-75">After tax & charges</small>
          </div>
        </div>
      </div>

      {/* Rest of the page - unchanged */}
      <div className="row g-4">
        {/* Top Selling Products */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Top Selling Products</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Qty Sold</th>
                      <th className="text-end">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts?.length > 0 ? (
                      reportData.topProducts.map((p, i) => (
                        <tr key={i}>
                          <td>{p.name}</td>
                          <td className="text-center">{p.qty}</td>
                          <td className="text-end fw-bold">
                            RS{p.revenue.toFixed(0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-muted">
                          No sales in this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Current Credit Status */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Current Credit</h5>
              <small className="opacity-75">Total Recoverable Amount</small>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-4 py-3 border-bottom">
                <span className="fw-bold">Remaining Permanent Credit</span>
                <span className="fw-bold fs-5 text-danger">
                  RS{(reportData.permanentRemaining || 0).toFixed(0)}
                </span>
              </div>

              <div className="d-flex justify-content-between mb-4 py-3 border-bottom">
                <span className="fw-bold">Remaining Temporary Credit</span>
                <span className="fw-bold fs-5 text-warning">
                  RS{(reportData.temporaryRemaining || 0).toFixed(0)}
                </span>
              </div>

              <div className="d-flex justify-content-between py-4 bg-body rounded">
                <span className="fw-bold fs-5">Total Recoverable</span>
                <span className="fw-bold fs-4 text-primary">
                  RS
                  {(
                    (reportData.permanentRemaining || 0) +
                    (reportData.temporaryRemaining || 0)
                  ).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
