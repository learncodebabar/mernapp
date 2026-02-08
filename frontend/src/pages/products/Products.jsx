import { useState, useEffect } from "react";
import api from "../../api/api";
import Barcode from "react-barcode";
import { API_ENDPOINTS } from "../../api/EndPoints";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 25;

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    supplier: "",
    location: "",
    stock: 0,
    costPrice: 0,
    salePrice: 0,
    minStockAlert: 10,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.PRODUCTS);
      // ✅ FIXED: Handle both response formats
      const productsData = res.data.products || res.data || [];
      console.log("Fetched products:", productsData); // Debug log
      setProducts(productsData);
      setFilteredProducts(productsData);
      setLoading(false);
    } catch (err) {
      console.error("Error loading products:", err);
      alert("Error loading products");
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.CATEGORIES);
      setCategories(res.data.filter((c) => c.isActive) || []);
    } catch (err) {
      console.error("Failed to load categories");
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.LOCATIONS);
      setLocations(res.data.filter((l) => l.isActive) || []);
    } catch (err) {
      console.error("Failed to load locations");
    }
  };

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.includes(query) ||
        p.category?.toLowerCase().includes(query),
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchQuery, products]);

  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (page) => setCurrentPage(page);

  const generateBarcode = () => {
    let code = Math.floor(Math.random() * 900000000000) + 100000000000;
    code = code.toString();
    let sum = 0;
    for (let i = 0; i < 12; i++)
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    const checksum = (10 - (sum % 10)) % 10;
    return code + checksum;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let barcodeValue = formData.barcode.trim() || generateBarcode();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("sku", formData.sku);
    data.append("barcode", barcodeValue);

    if (formData.category.trim()) {
      data.append("category", formData.category.trim());
    }

    data.append("supplier", formData.supplier);

    if (formData.location.trim()) {
      data.append("location", formData.location.trim());
    }

    data.append("stock", formData.stock);
    data.append("costPrice", formData.costPrice);
    data.append("salePrice", formData.salePrice);
    data.append("minStockAlert", formData.minStockAlert);
    if (imageFile) data.append("image", imageFile);

    try {
      if (editingProduct) {
        await api.put(API_ENDPOINTS.PRODUCT_BY_ID(editingProduct._id), data);
      } else {
        await api.post(API_ENDPOINTS.PRODUCTS, data);
      }
      setShowModal(false);
      resetForm();
      await fetchProducts(); // ✅ Wait for fresh data
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(API_ENDPOINTS.PRODUCT_BY_ID(id));
      await fetchProducts();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      category: product.category || "",
      supplier: product.supplier || "",
      location: product.location || "",
      stock: product.stock ?? 0,
      costPrice: product.costPrice ?? 0,
      salePrice: product.salePrice ?? 0,
      minStockAlert: product.minStockAlert ?? 10,
    });
    setImagePreview(
      product.image ? `${import.meta.env.VITE_REACT_BACKEND_BASE}${product.image}` : "",
    );
    setImageFile(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      barcode: "",
      category: "",
      supplier: "",
      location: "",
      stock: 0,
      costPrice: 0,
      salePrice: 0,
      minStockAlert: 10,
    });
    setImageFile(null);
    setImagePreview("");
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Products / Inventory</h2>
        <button
          className="btn add-btn bg-primary text-white"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <i className="bi bi-plus-circle me-2 text-white"></i> Add New Product
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="position-relative">
            <input
              type="text"
              className="form-control form-control-lg ps-5 rounded-pill"
              placeholder="Search by name, SKU, barcode or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-bordered table-hover mb-0 align-middle">
              <thead className="bg-light text-muted small text-uppercase">
                <tr>
                  <th className="px-2 py-1">ID</th>
                  <th className="px-2 py-1">Product</th>
                  <th className="px-2 py-1">Name</th>
                  <th className="px-2 py-1 text-center">Price</th>
                  <th className="px-2 py-1 text-center">Location</th>
                  <th className="px-2 py-1 text-center">Stock</th>
                  <th className="px-2 py-1 text-center">Value</th>
                  <th className="px-2 py-1 text-center">Reorder</th>
                  <th className="px-2 py-1 text-center">Level</th>
                  <th className="px-2 py-1 text-center">Category</th>
                  <th className="px-2 py-1 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {loading ? (
                  <tr>
                    <td colSpan="12" className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary" />
                    </td>
                  </tr>
                ) : currentProducts.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-5 text-muted">
                      No products found
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((product, index) => {
                    const globalIndex = indexOfFirst + index + 1;

                    const minAlert = product.minStockAlert ?? 10;
                    const currentStock = product.stock ?? 0;

                    const needsReorder = currentStock <= minAlert;
                    const inventoryValue =
                      currentStock * (product.costPrice ?? 0);

                    return (
                      <tr key={product._id}>
                        <td className="px-2 py-1 text-muted">#{globalIndex}</td>
                        <td className="px-2 py-1">
                          <div className="d-flex align-items-center gap-2">
                            {product.image ? (
                              <img
                                src={`${import.meta.env.VITE_REACT_BACKEND_BASE}${product.image}`}
                                alt={product.name}
                                className="rounded border"
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="bg-light border rounded d-flex align-items-center justify-content-center"
                                style={{ width: "30px", height: "30px" }}
                              >
                                <i className="bi bi-image text-muted small"></i>
                              </div>
                            )}
                            <div className="lh-sm">
                              <div className="fw-medium">
                                {product.name || "#N/A"}
                              </div>
                              <small className="text-muted">
                                SKU: {product.sku || "—"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1">{product.name || "#N/A"}</td>
                        <td className="px-2 py-1 text-center">
                          RS {product.salePrice?.toLocaleString() || "—"}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span className="badge bg-warning text-dark px-2 py-0">
                            {product.location || "All"}
                          </span>
                        </td>
                        <td
                          className="px-2 py-1 text-center fw-semibold"
                          style={{
                            color: needsReorder ? "#dc3545" : "inherit",
                          }}
                        >
                          {currentStock}
                        </td>
                        <td className="px-2 py-1 text-center">
                          RS {inventoryValue.toFixed(0)}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span
                            className={`badge ${needsReorder ? "bg-danger" : "bg-success"} px-2 py-0`}
                          >
                            {needsReorder ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-center">{minAlert}</td>
                        <td className="px-2 py-1 text-center">
                          {product.category || "All"}
                        </td>
                        <td className="px-2 py-1 text-end">
                          <button
                            className="btn btn-xs btn-outline-primary me-1"
                            onClick={() => openEditModal(product)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-xs btn-outline-danger"
                            onClick={() => handleDelete(product._id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="card-footer bg-light">
              <div className="d-flex justify-content-between align-items-center py-2">
                <div className="text-muted small">
                  Showing {indexOfFirst + 1} to{" "}
                  {Math.min(indexOfLast, filteredProducts.length)} of{" "}
                  {filteredProducts.length}
                </div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li
                      className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => paginate(currentPage - 1)}
                      >
                        Prev
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => paginate(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => paginate(currentPage + 1)}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Product Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">SKU</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Barcode</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Auto generate if empty"
                        value={formData.barcode}
                        onChange={(e) =>
                          setFormData({ ...formData, barcode: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary mt-2 w-100"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            barcode: generateBarcode(),
                          })
                        }
                      >
                        Generate
                      </button>
                    </div>

                    {formData.barcode && formData.barcode.length === 13 && (
                      <div className="col-12 text-center mt-3">
                        <Barcode
                          value={formData.barcode}
                          width={2}
                          height={100}
                          fontSize={16}
                        />
                      </div>
                    )}

                    <div className="col-md-4">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                      >
                        <option value="">All</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Supplier</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.supplier}
                        onChange={(e) =>
                          setFormData({ ...formData, supplier: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Location</label>
                      <select
                        className="form-select"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      >
                        <option value="">All</option>
                        {locations.map((loc) => (
                          <option key={loc._id} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Current Stock</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Cost Price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        required
                        value={formData.costPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            costPrice: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Sale Price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        required
                        value={formData.salePrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salePrice: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Low Stock Alert</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.minStockAlert}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minStockAlert: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Product Image</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      {imagePreview && (
                        <div className="mt-3 text-center">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="img-fluid rounded border"
                            style={{ maxHeight: "250px" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? "Update" : "Add"} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
