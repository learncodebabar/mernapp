import { useState, useEffect } from "react";
import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";
import { API_ENDPOINTS } from "../api/EndPoints";

export default function Setting() {
  const [formData, setFormData] = useState({
    shopName: "",
    address: "",
    location: "",
    phone: "",
    email: "",
    about: "",
    logo: null,
  });

  const [previewLogo, setPreviewLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchShopSettings();
  }, []);

  const fetchShopSettings = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.SHOP_SETTINGS);
      const data = res.data || {};

      setFormData({
        shopName: data.shopName || "",
        address: data.address || "",
        location: data.location || "",
        phone: data.phone || "",
        email: data.email || "",
        about: data.about || "",
        logo: null, // File field reset
      });

      if (data.logo) {
        const logoUrl = data.logo.startsWith("http")
          ? data.logo
          : `${import.meta.env.VITE_REACT_BACKEND_BASE}${data.logo}`;
        setPreviewLogo(logoUrl);
      }

      setLoading(false);
    } catch (err) {
      addNotification("error", "Failed to load shop settings");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const form = new FormData();
      form.append("shopName", formData.shopName);
      form.append("address", formData.address);
      form.append("location", formData.location);
      form.append("phone", formData.phone);
      form.append("email", formData.email);
      form.append("about", formData.about);

      if (formData.logo) {
        form.append("logo", formData.logo);
      }

      const res = await api.post(API_ENDPOINTS.SHOP_SETTINGS, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      addNotification("success", "Shop settings updated successfully!");

      fetchShopSettings();

      // Reset file input
      setFormData((prev) => ({ ...prev, logo: null }));
    } catch (err) {
      addNotification("error", "Failed to update settings");
      console.error("Settings error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="fw-bold mb-4">Shop Settings</h2>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Shop Logo */}
              <div className="col-12 text-center mb-4">
                <label className="form-label fw-medium d-block">
                  Shop Logo
                </label>

                {previewLogo ? (
                  <img
                    src={previewLogo}
                    alt="Shop Logo"
                    className="img-fluid rounded-circle mb-3"
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                      border: "3px solid #ddd",
                    }}
                    onError={(e) => {
                      e.target.src = "/default-shop-logo.png";
                      console.error("Logo load failed:", previewLogo);
                    }}
                  />
                ) : (
                  <div
                    className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-3 mx-auto"
                    style={{ width: "150px", height: "150px" }}
                  >
                    <i className="bi bi-shop fs-1 text-muted"></i>
                  </div>
                )}

                <input
                  type="file"
                  className="form-control form-control-sm w-50 mx-auto"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <small className="text-muted d-block mt-2">
                  Recommended: 1:1 ratio (PNG/JPG, max 2MB)
                </small>
              </div>

              {/* Shop Name */}
              <div className="col-md-6">
                <label className="form-label fw-medium">Shop Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="col-md-6">
                <label className="form-label fw-medium">Phone Number *</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="col-md-6">
                <label className="form-label fw-medium">
                  Email (for notifications)
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Location */}
              <div className="col-md-6">
                <label className="form-label fw-medium">
                  Location (City/Area)
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Lahore, Punjab"
                />
              </div>

              {/* Address */}
              <div className="col-12">
                <label className="form-label fw-medium">Full Address</label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                ></textarea>
              </div>

              {/* About Shop */}
              <div className="col-12">
                <label className="form-label fw-medium">About Shop</label>
                <textarea
                  className="form-control"
                  rows="4"
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="Short description about your shop..."
                ></textarea>
              </div>
            </div>

            <div className="mt-5 text-end">
              <button
                type="submit"
                className="btn btn-primary btn-lg px-5"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
