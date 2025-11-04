// scripts.js

document.addEventListener("DOMContentLoaded", () => {
  // Dark Mode Toggle
  const toggleDarkModeBtn = document.getElementById("toggleDarkMode");
  const logoutBtn = document.getElementById("logoutBtn");
  let isDarkMode = true; // Default mode

  toggleDarkModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    isDarkMode = !isDarkMode;
    toggleDarkModeBtn.innerHTML = isDarkMode
      ? '<i class="fas fa-sun"></i> Light Mode'
      : '<i class="fas fa-moon"></i> Dark Mode';
    updateChartStyles();
  });

  // Logout Functionality
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    location.reload();
  });

  // Alert Function
  function showAlert(message, type = "success") {
    const alertContainer = document.getElementById("alertContainer");
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show alert-custom`;
    alert.role = "alert";
    alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
    alertContainer.appendChild(alert);
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      alert.classList.remove("show");
      alert.classList.add("hide");
      setTimeout(() => {
        if (alert.parentNode) {
          alert.remove();
        }
      }, 150);
    }, 3000);
  }

  // Sidebar Navigation
  const sidebarLinks = document.querySelectorAll(".sidebar .nav-link");
  const sections = document.querySelectorAll("main section");

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      // Remove active class from all links
      sidebarLinks.forEach((l) => l.classList.remove("active"));
      // Add active class to clicked link
      link.classList.add("active");
      // Hide all sections
      sections.forEach((section) => (section.style.display = "none"));
      // Show target section
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        target.style.display = "block";
      }

      // Special handling for Supplier & Purchase & Sales sections to render tables
      if (link.getAttribute("href") === "#suppliers") {
        renderSupplierTable();
      } else if (link.getAttribute("href") === "#purchases") {
        renderPurchaseTable();
        populateSupplierDropdown(); // Populate dropdown when purchase section is opened
      } else if (link.getAttribute("href") === "#sales") {
        renderSalesTable();
        populateProductSelectForSales(); // Populate product dropdown for sales
      }
    });
  });

  // Initial Display
  if (sidebarLinks.length > 0) {
    sidebarLinks[0].click();
  }

  // ---------------------------
  // Simple Authentication
  // ---------------------------
  const loginModal = new bootstrap.Modal(
    document.getElementById("loginModal"),
    {
      backdrop: "static",
      keyboard: false,
    }
  );

  const loginForm = document.getElementById("loginForm");

  // Check login status on load
  function checkLogin() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      loginModal.show();
    }
  }

  // Handle Login
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!loginForm.checkValidity()) {
      e.stopPropagation();
      loginForm.classList.add("was-validated");
      return;
    }

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // Simulated username and password validation
    const validUsername = "admin";
    const validPassword = "password123";

    if (username === validUsername && password === validPassword) {
      localStorage.setItem("isLoggedIn", "true");
      loginModal.hide();
      showAlert("Berhasil login!", "success");
    } else {
      showAlert("Username atau password salah!", "danger");
    }
  });

  // ---------------------------
  // BST for Product Stock Management
  // ---------------------------

  // Node for the Binary Search Tree
  class BarangNode {
    constructor(SKU, nama, kategori, harga, stok) {
      this.SKU = SKU;
      this.nama = nama;
      this.kategori = kategori;
      this.harga = harga;
      this.stok = stok;
      this.left = null;
      this.right = null;
    }
  }

  // Binary Search Tree for Products
  class BSTBarang {
    constructor() {
      this.root = null;
    }

    // Insert a new product into the BST
    insert(SKU, nama, kategori, harga, stok) {
      const newNode = new BarangNode(SKU, nama, kategori, harga, stok);
      if (!this.root) {
        this.root = newNode;
        return true;
      }
      let current = this.root;
      while (true) {
        if (SKU === current.SKU) return false; // SKU already exists
        if (SKU < current.SKU) {
          if (!current.left) {
            current.left = newNode;
            return true;
          }
          current = current.left;
        } else {
          if (!current.right) {
            current.right = newNode;
            return true;
          }
          current = current.right;
        }
      }
    }

    // Search for a product by SKU
    search(SKU) {
      let current = this.root;
      while (current) {
        if (SKU === current.SKU) return current;
        current = SKU < current.SKU ? current.left : current.right;
      }
      return null;
    }

    // Update stock for a product (restock or purchase)
    updateStok(SKU, jumlah, mode = "restok") {
      const barang = this.search(SKU);
      if (!barang) return false; // Product not found

      if (mode === "restok") {
        barang.stok += jumlah;
        return true;
      } else if (mode === "beli") {
        if (barang.stok < jumlah) return "not-enough"; // Not enough stock for purchase
        barang.stok -= jumlah;
        return true;
      }
      return false;
    }

    // Find the minimum value node in a subtree (helper for deletion)
    findMinNode(node) {
      while (node.left) {
        node = node.left;
      }
      return node;
    }

    // Delete a node by SKU
    deleteNode(SKU) {
      this.root = this._deleteNode(this.root, SKU);
    }

    _deleteNode(node, SKU) {
      if (!node) return null; // Node not found

      if (SKU < node.SKU) {
        node.left = this._deleteNode(node.left, SKU);
        return node;
      } else if (SKU > node.SKU) {
        node.right = this._deleteNode(node.right, SKU);
        return node;
      } else {
        // Node found, perform deletion
        if (!node.left && !node.right) {
          // Case 1: No children
          return null;
        } else if (!node.left) {
          // Case 2: One right child
          return node.right;
        } else if (!node.right) {
          // Case 2: One left child
          return node.left;
        } else {
          // Case 3: Two children
          const tempNode = this.findMinNode(node.right);
          node.SKU = tempNode.SKU;
          node.nama = tempNode.nama;
          node.kategori = tempNode.kategori;
          node.harga = tempNode.harga;
          node.stok = tempNode.stok;
          node.right = this._deleteNode(node.right, tempNode.SKU);
          return node;
        }
      }
    }

    // Perform in-order traversal (returns sorted array of products)
    inOrderTraversal(callback) {
      const result = [];
      function traverse(node) {
        if (!node) return;
        traverse(node.left);
        result.push({
          kode: node.SKU,
          nama: node.nama,
          kategori: node.kategori,
          harga: node.harga,
          stok: node.stok,
        });
        callback && callback(node); // Optional callback if needed
        traverse(node.right);
      }
      traverse(this.root);
      return result;
    }

    // Get all products as a sorted array
    tampilkanSemuaBarang() {
      return this.inOrderTraversal();
    }
  }

  const bstProduk = new BSTBarang();
  let produkData = []; // This array is generally not used as BST is the source

  // Initial product data (will be inserted into BST)
  const initialProdukData = [
    {
      kode: "EL001",
      nama: "Smartphone X",
      kategori: "Elektronik",
      harga: 2000000,
      stok: 50,
    },
    {
      kode: "EL002",
      nama: "Laptop Pro",
      kategori: "Elektronik",
      harga: 15000000,
      stok: 30,
    },
    {
      kode: "PK001",
      nama: "Kaos Polos",
      kategori: "Pakaian",
      harga: 150000,
      stok: 100,
    },
    {
      kode: "PK002",
      nama: "Jaket Kulit",
      kategori: "Pakaian",
      harga: 1200000,
      stok: 40,
    },
    {
      kode: "OB001",
      nama: "Paracetamol",
      kategori: "Obat",
      harga: 15000,
      stok: 500,
    },
    {
      kode: "OB002",
      nama: "Vitamin C",
      kategori: "Obat",
      harga: 50000,
      stok: 300,
    },
    {
      kode: "PR001",
      nama: "Mixer",
      kategori: "Peralatan",
      harga: 300000,
      stok: 25,
    },
    {
      kode: "PR002",
      nama: "Blender",
      kategori: "Peralatan",
      harga: 250000,
      stok: 35,
    },
    {
      kode: "PB001",
      nama: "Meja Kayu",
      kategori: "Perabotan",
      harga: 1000000,
      stok: 15,
    },
    {
      kode: "PB002",
      nama: "Kursi Kantor",
      kategori: "Perabotan",
      harga: 750000,
      stok: 20,
    },
    {
      kode: "EL003",
      nama: "Headphone Wireless",
      kategori: "Elektronik",
      harga: 500000,
      stok: 60,
    },
    {
      kode: "PK003",
      nama: "Celana Jeans",
      kategori: "Pakaian",
      harga: 300000,
      stok: 80,
    },
    {
      kode: "OB003",
      nama: "Cukupin",
      kategori: "Obat",
      harga: 20000,
      stok: 400,
    },
    {
      kode: "PR003",
      nama: "Microwave",
      kategori: "Peralatan",
      harga: 800000,
      stok: 18,
    },
    {
      kode: "PB003",
      nama: "Lemari Pakaian",
      kategori: "Perabotan",
      harga: 2500000,
      stok: 10,
    },
    {
      kode: "EL004",
      nama: "Tablet S",
      kategori: "Elektronik",
      harga: 1000000,
      stok: 45,
    },
    {
      kode: "PK004",
      nama: "Baju Koko",
      kategori: "Pakaian",
      harga: 200000,
      stok: 70,
    },
    {
      kode: "OB004",
      nama: "Antasida",
      kategori: "Obat",
      harga: 25000,
      stok: 350,
    },
    {
      kode: "PR004",
      nama: "Setrika",
      kategori: "Peralatan",
      harga: 180000,
      stok: 22,
    },
    {
      kode: "PB004",
      nama: "Sofa 3 Dudukan",
      kategori: "Perabotan",
      harga: 5000000,
      stok: 8,
    },
    {
      kode: "EL005",
      nama: "Smartwatch",
      kategori: "Elektronik",
      harga: 750000,
      stok: 55,
    },
    {
      kode: "PK005",
      nama: "Sepatu Sneakers",
      kategori: "Pakaian",
      harga: 600000,
      stok: 90,
    },
    {
      kode: "OB005",
      nama: "Ibuprofen",
      kategori: "Obat",
      harga: 30000,
      stok: 450,
    },
    {
      kode: "PR005",
      nama: "Rice Cooker",
      kategori: "Peralatan",
      harga: 350000,
      stok: 28,
    },
    {
      kode: "PB005",
      nama: "Rak Buku",
      kategori: "Perabotan",
      harga: 400000,
      stok: 25,
    },
  ];

  // ---------------------------
  // Produk Management
  // ---------------------------
  const produkTableBody = document.getElementById("produkTableBody");
  const formProduk = document.getElementById("formProduk");
  const produkModalElement = document.getElementById("produkModal");
  const produkModal = new bootstrap.Modal(produkModalElement);
  const produkModalLabel = document.getElementById("produkModalLabel");

  // Function to render Produk Table with Pagination
  function renderProdukTable(page = 1) {
    produkTableBody.innerHTML = "";
    // Always use the data from BST for rendering
    const allProducts = bstProduk.tampilkanSemuaBarang();

    // Apply search/sort filters if present before pagination
    let filteredAndSortedData = allProducts;
    const searchQuery = document
      .getElementById("searchProduk")
      .value.toLowerCase();
    if (searchQuery) {
      filteredAndSortedData = filteredAndSortedData.filter(
        (p) =>
          p.kode.toLowerCase().includes(searchQuery) ||
          p.nama.toLowerCase().includes(searchQuery) ||
          p.kategori.toLowerCase().includes(searchQuery)
      );
    }

    const sortBy = document.getElementById("sortProduk").value;
    if (sortBy) {
      filteredAndSortedData.sort((a, b) => {
        if (sortBy === "harga") {
          return a.harga - b.harga;
        } else {
          return a[sortBy].localeCompare(b[sortBy]);
        }
      });
    }

    const start = (page - 1) * produkPerPage;
    const end = start + produkPerPage;
    const paginatedData = filteredAndSortedData.slice(start, end);

    if (paginatedData.length === 0 && page > 1) {
      // If current page is empty after filter/sort/delete, go to previous page
      renderProdukTable(page - 1);
      return;
    }

    paginatedData.forEach((produk, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${produk.kode}</td>
                <td>${produk.nama}</td>
                <td>${produk.kategori}</td>
                <td>Rp ${produk.harga.toLocaleString("id-ID")}</td>
                <td>${produk.stok}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2 edit-btn" data-kode="${
                      produk.kode
                    }">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger hapus-btn" data-kode="${
                      produk.kode
                    }">
                        <i class="fas fa-trash-alt"></i> Hapus
                    </button>
                </td>
            `;
      produkTableBody.appendChild(tr);
    });

    renderProdukPagination(filteredAndSortedData.length, page);
    highlightLowStockInTable(); // Highlight low stock after rendering
  }

  // Pagination for Produk
  const produkPerPage = 10;
  let currentProdukPage = 1;

  function renderProdukPagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / produkPerPage);
    const produkPagination = document.getElementById("produkPagination");
    produkPagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentProdukPage = i;
        renderProdukTable(currentProdukPage);
      });
      produkPagination.appendChild(li);
    }
  }

  // Handle Add/Edit Produk Form Submission
  formProduk.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!formProduk.checkValidity()) {
      e.stopPropagation();
      formProduk.classList.add("was-validated");
      return;
    }

    const kode = document.getElementById("kodeProduk").value.trim();
    const nama = document.getElementById("namaProduk").value.trim();
    const kategori = document.getElementById("kategoriProduk").value;
    const harga = parseInt(document.getElementById("hargaProduk").value);
    const stok = parseInt(document.getElementById("stokProduk").value);

    // Check if editing or adding new
    const isEdit = produkModalLabel.textContent === "Edit Produk";

    if (isEdit) {
      // Find the product in BST, update its properties
      const existingProduk = bstProduk.search(kode);
      if (existingProduk) {
        existingProduk.nama = nama;
        existingProduk.kategori = kategori;
        existingProduk.harga = harga;
        existingProduk.stok = stok; // Stok bisa diubah saat edit
        showAlert("Produk berhasil diperbarui!", "success");
      } else {
        showAlert("Produk tidak ditemukan untuk diedit!", "danger");
      }
    } else {
      const success = bstProduk.insert(kode, nama, kategori, harga, stok);
      if (!success) {
        showAlert("Kode produk sudah ada!", "danger");
        return;
      }
      showAlert("Produk berhasil ditambahkan!", "success");
    }

    saveData(); // Save updated BST to localStorage
    formProduk.reset();
    formProduk.classList.remove("was-validated");
    produkModal.hide();
    renderProdukTable(currentProdukPage); // Re-render table to show changes
  });

  // Handle "Tambah Produk" button click
  document.getElementById("tambahProdukBtn").addEventListener("click", () => {
    formProduk.reset();
    formProduk.classList.remove("was-validated");
    produkModalLabel.textContent = "Tambah Produk";
    document.getElementById("kodeProduk").readOnly = false; // Enable editing kode Produk for new entry
  });

  // Handle Edit button click (delegated)
  produkTableBody.addEventListener("click", (e) => {
    if (e.target.closest(".edit-btn")) {
      const kode = e.target.closest(".edit-btn").dataset.kode;
      const produkToEdit = bstProduk.search(kode);
      if (produkToEdit) {
        produkModalLabel.textContent = "Edit Produk";
        document.getElementById("kodeProduk").value = produkToEdit.SKU;
        document.getElementById("kodeProduk").readOnly = true; // Prevent changing SKU
        document.getElementById("namaProduk").value = produkToEdit.nama;
        document.getElementById("kategoriProduk").value = produkToEdit.kategori;
        document.getElementById("hargaProduk").value = produkToEdit.harga;
        document.getElementById("stokProduk").value = produkToEdit.stok;
        produkModal.show();
      } else {
        showAlert("Produk tidak ditemukan!", "danger");
      }
    } else if (e.target.closest(".hapus-btn")) {
      const kode = e.target.closest(".hapus-btn").dataset.kode;
      if (confirm(`Anda yakin ingin menghapus produk dengan kode ${kode}?`)) {
        bstProduk.deleteNode(kode);
        saveData();
        showAlert("Produk berhasil dihapus!", "success");
        renderProdukTable(currentProdukPage); // Re-render table
      }
    }
  });

  // Search and Sort for Produk
  const searchProduk = document.getElementById("searchProduk");
  const sortProduk = document.getElementById("sortProduk");

  searchProduk.addEventListener("input", () => renderProdukTable(1));
  sortProduk.addEventListener("change", () => renderProdukTable(1));

  // ---------------------------
  // Supplier Management
  // ---------------------------
  const supplierTableBody = document.getElementById("supplierTableBody");
  const formSupplier = document.getElementById("formSupplier");
  const supplierModalElement = document.getElementById("supplierModal");
  const supplierModal = new bootstrap.Modal(supplierModalElement);
  const supplierModalLabel = document.getElementById("supplierModalLabel");

  let supplierData = [];
  let currentSupplierPage = 1;
  const supplierPerPage = 10; // Number of suppliers per page

  function renderSupplierTable(page = 1) {
    supplierTableBody.innerHTML = "";
    const start = (page - 1) * supplierPerPage;
    const end = start + supplierPerPage;
    const paginatedData = supplierData.slice(start, end);

    if (paginatedData.length === 0 && page > 1) {
      renderSupplierTable(page - 1);
      return;
    }

    if (paginatedData.length === 0 && supplierData.length === 0) {
      supplierTableBody.innerHTML =
        '<tr><td colspan="4" class="text-center">Tidak ada data supplier.</td></tr>';
      renderSupplierPagination(0, 1);
      return;
    }

    paginatedData.forEach((supplier) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${supplier.id}</td>
                <td>${supplier.nama}</td>
                <td>${supplier.kontak}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2 edit-supplier-btn" data-id="${supplier.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger hapus-supplier-btn" data-id="${supplier.id}">
                        <i class="fas fa-trash-alt"></i> Hapus
                    </button>
                </td>
            `;
      supplierTableBody.appendChild(tr);
    });
    renderSupplierPagination(supplierData.length, page);
  }

  function renderSupplierPagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / supplierPerPage);
    const supplierPagination = document.getElementById("supplierPagination");
    supplierPagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentSupplierPage = i;
        renderSupplierTable(currentSupplierPage);
      });
      supplierPagination.appendChild(li);
    }
  }

  // Handle Add/Edit Supplier Form Submission
  formSupplier.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!formSupplier.checkValidity()) {
      e.stopPropagation();
      formSupplier.classList.add("was-validated");
      return;
    }

    const id = document.getElementById("idSupplier").value.trim();
    const nama = document.getElementById("namaSupplier").value.trim();
    const kontak = document.getElementById("kontakSupplier").value.trim();

    const isEdit = supplierModalLabel.textContent === "Edit Supplier";

    if (isEdit) {
      const index = supplierData.findIndex((s) => s.id === id);
      if (index !== -1) {
        supplierData[index] = { id, nama, kontak };
        showAlert("Supplier berhasil diperbarui!", "success");
      } else {
        showAlert("Supplier tidak ditemukan untuk diedit!", "danger");
      }
    } else {
      if (supplierData.some((s) => s.id === id)) {
        showAlert("ID Supplier sudah ada!", "danger");
        return;
      }
      supplierData.push({ id, nama, kontak });
      showAlert("Supplier berhasil ditambahkan!", "success");
    }

    saveData();
    formSupplier.reset();
    formSupplier.classList.remove("was-validated");
    supplierModal.hide();
    renderSupplierTable(currentSupplierPage);
  });

  // Handle "Tambah Supplier" button click
  document.getElementById("tambahSupplierBtn").addEventListener("click", () => {
    formSupplier.reset();
    formSupplier.classList.remove("was-validated");
    supplierModalLabel.textContent = "Tambah Supplier";
    document.getElementById("idSupplier").readOnly = false;
  });

  // Handle Edit/Delete Supplier button click (delegated)
  supplierTableBody.addEventListener("click", (e) => {
    if (e.target.closest(".edit-supplier-btn")) {
      const id = e.target.closest(".edit-supplier-btn").dataset.id;
      const supplierToEdit = supplierData.find((s) => s.id === id);
      if (supplierToEdit) {
        supplierModalLabel.textContent = "Edit Supplier";
        document.getElementById("idSupplier").value = supplierToEdit.id;
        document.getElementById("idSupplier").readOnly = true;
        document.getElementById("namaSupplier").value = supplierToEdit.nama;
        document.getElementById("kontakSupplier").value = supplierToEdit.kontak;
        supplierModal.show();
      } else {
        showAlert("Supplier tidak ditemukan!", "danger");
      }
    } else if (e.target.closest(".hapus-supplier-btn")) {
      const id = e.target.closest(".hapus-supplier-btn").dataset.id;
      if (confirm(`Anda yakin ingin menghapus supplier dengan ID ${id}?`)) {
        supplierData = supplierData.filter((s) => s.id !== id);
        saveData();
        showAlert("Supplier berhasil dihapus!", "success");
        renderSupplierTable(currentSupplierPage);
      }
    }
  });

  // ---------------------------
  // Purchase (Pembelian) Management
  // ---------------------------
  const purchaseTableBody = document.getElementById("purchaseTableBody");
  const formPurchase = document.getElementById("formPurchase");
  const purchaseModalElement = document.getElementById("purchaseModal");
  const purchaseModal = new bootstrap.Modal(purchaseModalElement);
  const supplierPembelianSelect = document.getElementById("supplierPembelian");

  let purchaseData = [];
  let currentPurchasePage = 1;
  const purchasePerPage = 10;

  function renderPurchaseTable(page = 1) {
    purchaseTableBody.innerHTML = "";
    const start = (page - 1) * purchasePerPage;
    const end = start + purchasePerPage;
    const paginatedData = purchaseData.slice(start, end);

    if (paginatedData.length === 0 && page > 1) {
      renderPurchaseTable(page - 1);
      return;
    }

    if (paginatedData.length === 0 && purchaseData.length === 0) {
      purchaseTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center">Tidak ada data pembelian.</td></tr>'; // Adjusted colspan
      renderPurchasePagination(0, 1);
      return;
    }

    paginatedData.forEach((purchase) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${purchase.id}</td>
                <td>${purchase.tanggal}</td>
                <td>${purchase.kodeProduk}</td>
                <td>${purchase.namaProduk}</td>
                <td>${purchase.jumlah}</td>
                <td>${purchase.namaSupplier}</td>
                <td>Rp ${purchase.totalBiaya.toLocaleString("id-ID")}</td>
            `;
      purchaseTableBody.appendChild(tr);
    });
    renderPurchasePagination(purchaseData.length, page);
  }

  function renderPurchasePagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / purchasePerPage);
    const purchasePagination = document.getElementById("purchasePagination");
    purchasePagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentPurchasePage = i;
        renderPurchaseTable(currentPurchasePage);
      });
      purchasePagination.appendChild(li);
    }
  }

  function populateSupplierDropdown() {
    supplierPembelianSelect.innerHTML =
      '<option value="">Pilih Supplier</option>';
    supplierData.forEach((supplier) => {
      const option = document.createElement("option");
      option.value = supplier.id;
      option.textContent = supplier.nama;
      supplierPembelianSelect.appendChild(option);
    });
  }

  formPurchase.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!formPurchase.checkValidity()) {
      e.stopPropagation();
      formPurchase.classList.add("was-validated");
      return;
    }

    const tanggal = document.getElementById("tanggalPembelian").value;
    const kodeProduk = document
      .getElementById("kodeProdukPembelian")
      .value.trim();
    const jumlah = parseInt(document.getElementById("jumlahPembelian").value);
    const totalBiaya = parseInt(
      document.getElementById("totalBiayaPembelian").value
    ); // Get total biaya directly
    const supplierId = document.getElementById("supplierPembelian").value;

    const produk = bstProduk.search(kodeProduk);
    if (!produk) {
      showAlert("Kode Produk tidak ditemukan!", "danger");
      return;
    }

    const supplier = supplierData.find((s) => s.id === supplierId);
    if (!supplier) {
      showAlert("Supplier tidak ditemukan!", "danger");
      return;
    }

    // Generate unique ID for purchase
    const purchaseId = `PO-${Date.now()}`; // Simple unique ID

    // Update product stock (restock)
    const restockSuccess = bstProduk.updateStok(kodeProduk, jumlah, "restok");

    if (restockSuccess) {
      const newPurchase = {
        id: purchaseId,
        tanggal: tanggal,
        kodeProduk: kodeProduk,
        namaProduk: produk.nama,
        jumlah: jumlah,
        totalBiaya: totalBiaya, // Use directly entered total cost
        idSupplier: supplierId,
        namaSupplier: supplier.nama,
      };
      purchaseData.push(newPurchase);
      saveData();
      showAlert("Pembelian berhasil dicatat dan stok diperbarui!", "success");
      formPurchase.reset();
      formPurchase.classList.remove("was-validated");
      purchaseModal.hide();
      renderPurchaseTable(currentPurchasePage);
      renderProdukTable(currentProdukPage); // Update produk table to reflect new stock
    } else {
      showAlert("Gagal memperbarui stok produk.", "danger");
    }
  });

  // ---------------------------
  // Sales (Penjualan) Management
  // ---------------------------
  const salesTableBody = document.getElementById("salesTableBody");
  const formSales = document.getElementById("formSales");
  const salesModalElement = document.getElementById("salesModal");
  const salesModal = new bootstrap.Modal(salesModalElement);
  const kodeProdukPenjualanSelect = document.getElementById(
    "kodeProdukPenjualan"
  );
  const namaProdukPenjualanDisplay = document.getElementById(
    "namaProdukPenjualanDisplay"
  );
  const jumlahPenjualanInput = document.getElementById("jumlahPenjualan");
  const totalPembayaranDisplay = document.getElementById(
    "totalPembayaranDisplay"
  );

  let salesRecords = [];
  let currentSalesPage = 1;
  const salesPerPage = 10;

  function renderSalesTable(page = 1) {
    salesTableBody.innerHTML = "";
    const start = (page - 1) * salesPerPage;
    const end = start + salesPerPage;
    const paginatedData = salesRecords.slice(start, end);

    if (paginatedData.length === 0 && page > 1) {
      renderSalesTable(page - 1);
      return;
    }

    if (paginatedData.length === 0 && salesRecords.length === 0) {
      salesTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center">Tidak ada data penjualan.</td></tr>';
      renderSalesPagination(0, 1);
      return;
    }

    paginatedData.forEach((sale) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${sale.id}</td>
                <td>${sale.tanggal}</td>
                <td>${sale.kodeProduk}</td>
                <td>${sale.namaProduk}</td>
                <td>${sale.jumlah}</td>
                <td>${sale.namaPelanggan}</td>
                <td>Rp ${sale.totalPembayaran.toLocaleString("id-ID")}</td>
            `;
      salesTableBody.appendChild(tr);
    });
    renderSalesPagination(salesRecords.length, page);
  }

  function renderSalesPagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / salesPerPage);
    const salesPagination = document.getElementById("salesPagination");
    salesPagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentSalesPage = i;
        renderSalesTable(currentSalesPage);
      });
      salesPagination.appendChild(li);
    }
  }

  function populateProductSelectForSales() {
    kodeProdukPenjualanSelect.innerHTML =
      '<option value="">Pilih Produk</option>';
    const allProducts = bstProduk.tampilkanSemuaBarang();
    allProducts.forEach((produk) => {
      const option = document.createElement("option");
      option.value = produk.kode;
      option.textContent = `${produk.kode} - ${produk.nama}`;
      kodeProdukPenjualanSelect.appendChild(option);
    });
  }

  // Update product info when selected in sales form
  kodeProdukPenjualanSelect.addEventListener("change", () => {
    const selectedKode = kodeProdukPenjualanSelect.value;
    const produk = bstProduk.search(selectedKode);
    if (produk) {
      namaProdukPenjualanDisplay.value = produk.nama;
      jumlahPenjualanInput.max = produk.stok; // Set max quantity to available stock
      calculateTotalPembayaran();
    } else {
      namaProdukPenjualanDisplay.value = "";
      jumlahPenjualanInput.max = "";
      totalPembayaranDisplay.value = "";
    }
  });

  jumlahPenjualanInput.addEventListener("input", calculateTotalPembayaran);

  function calculateTotalPembayaran() {
    const selectedKode = kodeProdukPenjualanSelect.value;
    const produk = bstProduk.search(selectedKode);
    const jumlah = parseInt(jumlahPenjualanInput.value);

    if (produk && !isNaN(jumlah) && jumlah > 0) {
      const total = produk.harga * jumlah;
      totalPembayaranDisplay.value = `Rp ${total.toLocaleString("id-ID")}`;
    } else {
      totalPembayaranDisplay.value = "";
    }
  }

  formSales.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!formSales.checkValidity()) {
      e.stopPropagation();
      formSales.classList.add("was-validated");
      return;
    }

    const tanggal = document.getElementById("tanggalPenjualan").value;
    const kodeProduk = kodeProdukPenjualanSelect.value;
    const jumlah = parseInt(jumlahPenjualanInput.value);
    const namaPelanggan = document
      .getElementById("namaPelangganPenjualan")
      .value.trim();

    const produk = bstProduk.search(kodeProduk);
    if (!produk) {
      showAlert("Produk tidak ditemukan!", "danger");
      return;
    }

    if (produk.stok < jumlah) {
      showAlert(
        `Stok ${produk.nama} tidak mencukupi. Stok tersedia: ${produk.stok}`,
        "danger"
      );
      return;
    }

    // Deduct stock
    const deductSuccess = bstProduk.updateStok(kodeProduk, jumlah, "beli");

    if (deductSuccess === true) {
      const totalPembayaran = produk.harga * jumlah;
      const salesId = `SALES-${Date.now()}`; // Simple unique ID

      const newSale = {
        id: salesId,
        tanggal: tanggal,
        kodeProduk: kodeProduk,
        namaProduk: produk.nama,
        jumlah: jumlah,
        hargaJualSatuan: produk.harga, // Store for record
        namaPelanggan: namaPelanggan,
        totalPembayaran: totalPembayaran,
      };
      salesRecords.push(newSale);
      saveData();
      showAlert("Penjualan berhasil dicatat dan stok diperbarui!", "success");
      formSales.reset();
      formSales.classList.remove("was-validated");
      salesModal.hide();
      renderSalesTable(currentSalesPage);
      renderProdukTable(currentProdukPage); // Update produk table to reflect new stock
      updateDashboardMetrics();
      initializeSalesData(); // Re-initialize and update sales chart
    } else {
      showAlert("Gagal mencatat penjualan atau memperbarui stok.", "danger");
    }
  });

  document
    .getElementById("tambahPenjualanBtn")
    .addEventListener("click", () => {
      formSales.reset();
      formSales.classList.remove("was-validated");
      populateProductSelectForSales(); // Repopulate to ensure latest products are there
      namaProdukPenjualanDisplay.value = "";
      totalPembayaranDisplay.value = "";
      jumlahPenjualanInput.max = ""; // Reset max for quantity
    });

  // ---------------------------
  // Dashboard Metrics and Sales Chart
  // ---------------------------
  const totalTransaksiEl = document.getElementById("totalTransaksi");
  const totalPendapatanEl = document.getElementById("totalPendapatan");
  const totalBarangTerjualEl = document.getElementById("totalBarangTerjual");

  let metrics = {
    totalTransaksi: 0,
    totalPendapatan: 0,
    totalBarangTerjual: 0,
  };

  // Removed transaksiData as it's no longer used for real-time transactions
  let salesData = {}; // Stores sales data by date for the chart

  const salesChartCanvas = document.getElementById("salesChart");
  let salesChart; // To hold the Chart.js instance

  function initializeSalesChart() {
    const ctx = salesChartCanvas.getContext("2d");
    salesChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [], // Dates
        datasets: [
          {
            label: "Total Pendapatan Harian",
            data: [], // Revenue for each date
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value, index, values) {
                return "Rp " + value.toLocaleString("id-ID");
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return (
                  context.dataset.label +
                  ": Rp " +
                  context.raw.toLocaleString("id-ID")
                );
              },
            },
          },
        },
      },
    });
    updateChartStyles(); // Apply initial dark mode styles
  }

  function updateChartStyles() {
    if (!salesChart) return;
    const textColor = isDarkMode ? "#ffffff" : "#212529";
    const gridColor = isDarkMode
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(0, 0, 0, 0.1)";

    salesChart.options.scales.y.ticks.color = textColor;
    salesChart.options.scales.x.ticks.color = textColor;
    salesChart.options.scales.y.grid.color = gridColor;
    salesChart.options.scales.x.grid.color = gridColor;
    salesChart.options.plugins.legend.labels.color = textColor;
    salesChart.update();
  }

  function updateDashboardMetrics() {
    metrics.totalTransaksi = salesRecords.length;
    metrics.totalPendapatan = salesRecords.reduce(
      (sum, s) => sum + s.totalPembayaran,
      0
    );
    metrics.totalBarangTerjual = salesRecords.reduce(
      (sum, s) => sum + s.jumlah,
      0
    );

    totalTransaksiEl.textContent =
      metrics.totalTransaksi.toLocaleString("id-ID");
    totalPendapatanEl.textContent = `Rp ${metrics.totalPendapatan.toLocaleString(
      "id-ID"
    )}`;
    totalBarangTerjualEl.textContent =
      metrics.totalBarangTerjual.toLocaleString("id-ID");
  }

  function initializeSalesData() {
    salesData = {}; // Clear previous data
    salesRecords.forEach((s) => {
      const date = s.tanggal;
      if (!salesData[date]) {
        salesData[date] = 0;
      }
      salesData[date] += s.totalPembayaran;
    });
    updateSalesChart();
  }

  function updateSalesChart() {
    const labels = Object.keys(salesData).sort(); // Sort dates
    const data = labels.map((date) => salesData[date]);

    salesChart.data.labels = labels;
    salesChart.data.datasets[0].data = data;
    salesChart.update();
  }

  // Filter Sales Report by Date
  const filterTanggalInput = document.getElementById("filterTanggal");
  const applyFilterBtn = document.getElementById("applyFilter");

  applyFilterBtn.addEventListener("click", () => {
    const filterDate = filterTanggalInput.value; // Format ISO-MM-DD
    if (filterDate) {
      const filteredSalesData = {};
      salesRecords.forEach((s) => {
        if (s.tanggal === filterDate) {
          if (!filteredSalesData[filterDate]) {
            filteredSalesData[filterDate] = 0;
          }
          filteredSalesData[filterDate] += s.totalPembayaran;
        }
      });
      salesChart.data.labels = Object.keys(filteredSalesData).sort();
      salesChart.data.datasets[0].data = Object.values(filteredSalesData);
      salesChart.update();
    } else {
      // If filter is cleared, show all data
      initializeSalesData();
    }
  });

  // ---------------------------
  // Backup & Restore Functionality
  // ---------------------------

  function backupData() {
    try {
      const data = {
        produk: bstProduk.tampilkanSemuaBarang(),
        supplier: supplierData,
        purchase: purchaseData,
        sales: salesRecords,
        timestamp: new Date().toISOString(),
        version: "1.0",
      };

      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-sistem-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showAlert("Backup data berhasil!", "success");
    } catch (error) {
      console.error("Backup error:", error);
      showAlert("Gagal membuat backup data", "danger");
    }
  }

  function restoreData(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.name.endsWith(".json")) {
      showAlert("Hanya file JSON yang didukung", "danger");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);

        // Validasi struktur data
        if (!data.produk || !Array.isArray(data.produk)) {
          throw new Error("Format data tidak valid");
        }

        if (
          confirm(
            "PERINGATAN: Restore data akan mengganti semua data saat ini. Lanjutkan?"
          )
        ) {
          // Clear existing data
          bstProduk = new BSTBarang();
          supplierData = [];
          purchaseData = [];
          salesRecords = [];

          // Restore data produk ke BST
          data.produk.forEach((p) => {
            bstProduk.insert(p.kode, p.nama, p.kategori, p.harga, p.stok);
          });

          // Restore data lainnya
          supplierData = data.supplier || [];
          purchaseData = data.purchase || [];
          salesRecords = data.sales || [];

          // Save to localStorage
          saveData();

          // Refresh UI
          renderProdukTable(1);
          renderSupplierTable(1);
          renderPurchaseTable(1);
          renderSalesTable(1);
          updateDashboardMetrics();
          initializeSalesData();

          showAlert("Data berhasil di-restore!", "success");
        }

        // Reset file input
        event.target.value = "";
      } catch (error) {
        console.error("Restore error:", error);
        showAlert("File backup tidak valid atau rusak", "danger");
        event.target.value = "";
      }
    };

    reader.onerror = function () {
      showAlert("Gagal membaca file", "danger");
      event.target.value = "";
    };

    reader.readAsText(file);
  }

  // ---------------------------
  // Low Stock Alert Functionality
  // ---------------------------

  function checkLowStock() {
    const lowStockProducts = bstProduk
      .tampilkanSemuaBarang()
      .filter((p) => p.stok < 10);

    if (lowStockProducts.length > 0) {
      // Remove existing low stock alerts
      const existingAlerts = document.querySelectorAll(".alert-low-stock");
      existingAlerts.forEach((alert) => alert.remove());

      const alertContainer = document.getElementById("alertContainer");
      const alert = document.createElement("div");
      alert.className =
        "alert alert-warning alert-dismissible fade show alert-custom alert-low-stock";
      alert.role = "alert";
      alert.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Peringatan Stok Rendah!</strong> ${lowStockProducts.length} produk memiliki stok di bawah 10.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      alertContainer.appendChild(alert);

      // Auto dismiss after 10 seconds
      setTimeout(() => {
        if (alert.parentNode) {
          alert.classList.remove("show");
          setTimeout(() => alert.remove(), 150);
        }
      }, 10000);
    }
  }

  function highlightLowStockInTable() {
    const rows = document.querySelectorAll("#produkTableBody tr");
    rows.forEach((row) => {
      const stokCell = row.cells[4]; // Stok column
      const stokValue = parseInt(stokCell.textContent);

      if (stokValue < 10) {
        row.classList.add("low-stock");
      } else {
        row.classList.remove("low-stock");
      }
    });
  }

  // ---------------------------
  // Local Storage Management
  // ---------------------------

  function saveData() {
    localStorage.setItem(
      "produkData",
      JSON.stringify(bstProduk.tampilkanSemuaBarang())
    );
    localStorage.setItem("supplierData", JSON.stringify(supplierData));
    localStorage.setItem("purchaseData", JSON.stringify(purchaseData));
    localStorage.setItem("salesRecords", JSON.stringify(salesRecords)); // Save sales records
    localStorage.setItem("metrics", JSON.stringify(metrics)); // Save dashboard metrics
    localStorage.setItem("salesData", JSON.stringify(salesData)); // Save sales chart data
  }

  function loadData() {
    const storedProduk = JSON.parse(localStorage.getItem("produkData"));
    if (storedProduk) {
      storedProduk.forEach((p) =>
        bstProduk.insert(p.kode, p.nama, p.kategori, p.harga, p.stok)
      );
    } else {
      // If no data in local storage, use initial data
      initialProdukData.forEach((p) =>
        bstProduk.insert(p.kode, p.nama, p.kategori, p.harga, p.stok)
      );
    }

    const storedSupplier = JSON.parse(localStorage.getItem("supplierData"));
    if (storedSupplier) {
      supplierData = storedSupplier;
    } else {
      // Example initial supplier data if needed
      supplierData = [
        { id: "S001", nama: "PT Maju Jaya", kontak: "08123456789" },
        { id: "S002", nama: "CV Sumber Elektronik", kontak: "08765432100" },
      ];
    }

    const storedPurchase = JSON.parse(localStorage.getItem("purchaseData"));
    if (storedPurchase) {
      purchaseData = storedPurchase;
    }

    const storedSalesRecords = JSON.parse(localStorage.getItem("salesRecords"));
    if (storedSalesRecords) {
      salesRecords = storedSalesRecords;
    }

    const storedMetrics = JSON.parse(localStorage.getItem("metrics"));
    if (storedMetrics) {
      metrics = storedMetrics;
    }

    const storedSalesData = JSON.parse(localStorage.getItem("salesData"));
    if (storedSalesData) {
      salesData = storedSalesData;
    }
  }

  // ---------------------------
  // Event Listeners for Backup/Restore
  // ---------------------------

  // Backup/Restore functionality
  document.getElementById("backupBtn").addEventListener("click", backupData);
  document.getElementById("restoreBtn").addEventListener("click", () => {
    document.getElementById("restoreFile").click();
  });
  document
    .getElementById("restoreFile")
    .addEventListener("change", restoreData);

  // Check low stock periodically
  setInterval(checkLowStock, 30000); // Check every 30 seconds
  setTimeout(checkLowStock, 2000); // Initial check after 2 seconds

  // Initial Load and Render
  loadData();
  renderProdukTable(currentProdukPage);
  renderSupplierTable(currentSupplierPage);
  renderPurchaseTable(currentPurchasePage);
  renderSalesTable(currentSalesPage); // Render sales table on load
  updateDashboardMetrics();
  initializeSalesChart();
  initializeSalesData(); // Initialize chart data from loaded historical sales
  checkLogin();
});
