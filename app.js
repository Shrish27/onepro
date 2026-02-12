(() => {
  const STORAGE_KEYS = {
    beneficiaries: 'pds-beneficiaries',
    stock: 'pds-stock',
    distributions: 'pds-distributions'
  };

  const initialStock = { rice: 200, wheat: 150, sugar: 80 };

  const shopDetails = {
    name: 'Green Valley Fair Price Shop',
    address: '12 Harvest Lane, Kisan Nagar',
    dealerName: 'Ramesh Patel',
    contact: '+91 98765 43210',
    shopId: 'PDS-TN-0487',
    area: 'Ward 11, River Side Block',
    status: 'Active'
  };

  let state = {
    beneficiaries: [],
    stock: { ...initialStock },
    distributions: []
  };

  function loadState() {
    const storedBeneficiaries = localStorage.getItem(STORAGE_KEYS.beneficiaries);
    const storedStock = localStorage.getItem(STORAGE_KEYS.stock);
    const storedDistributions = localStorage.getItem(STORAGE_KEYS.distributions);

    state.beneficiaries = storedBeneficiaries ? JSON.parse(storedBeneficiaries) : [];
    state.stock = storedStock ? JSON.parse(storedStock) : { ...initialStock };
    state.distributions = storedDistributions ? JSON.parse(storedDistributions) : [];
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.beneficiaries, JSON.stringify(state.beneficiaries));
    localStorage.setItem(STORAGE_KEYS.stock, JSON.stringify(state.stock));
    localStorage.setItem(STORAGE_KEYS.distributions, JSON.stringify(state.distributions));
  }

  function validateCardNumber(cardNumber) {
    return /^\d{10}$/.test(cardNumber);
  }

  function calculateEligibility(category, familyMembers) {
    const factor = {
      APL: 5,
      BPL: 8,
      Antyodaya: 10
    }[category] || 0;
    return factor * Number(familyMembers || 0);
  }

  function findBeneficiary(cardNumber) {
    return state.beneficiaries.find((item) => item.cardNumber === cardNumber) || null;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString();
  }

  function renderShopDetails() {
    const blocks = document.querySelectorAll('[data-shop-details]');
    blocks.forEach((block) => {
      block.innerHTML = `
        <p><strong>Shop Name:</strong> ${shopDetails.name}</p>
        <p><strong>Shop ID:</strong> ${shopDetails.shopId}</p>
        <p><strong>Dealer:</strong> ${shopDetails.dealerName}</p>
        <p><strong>Area:</strong> ${shopDetails.area}</p>
        <p><strong>Address:</strong> ${shopDetails.address}</p>
        <p><strong>Contact:</strong> ${shopDetails.contact}</p>
        <p><strong>Status:</strong> <span class="badge ${shopDetails.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${shopDetails.status}</span> <em class="small">Regular monthly distribution in progress.</em></p>
      `;
    });
  }

  function renderStock() {
    document.querySelectorAll('[data-stock-rice]').forEach((el) => { el.textContent = `${state.stock.rice} kg`; });
    document.querySelectorAll('[data-stock-wheat]').forEach((el) => { el.textContent = `${state.stock.wheat} kg`; });
    document.querySelectorAll('[data-stock-sugar]').forEach((el) => { el.textContent = `${state.stock.sugar} kg`; });
  }

  function renderBeneficiariesTable() {
    document.querySelectorAll('[data-beneficiaries-body]').forEach((tbody) => {
      tbody.textContent = '';
      state.beneficiaries.forEach((b, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td>${b.name}</td><td>${b.cardNumber}</td><td>${b.familyMembers}</td><td>${b.category}</td><td>${b.riceEligibility} kg</td><td>${b.address}</td>`;
        tbody.appendChild(tr);
      });
      if (!state.beneficiaries.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7">No beneficiaries added yet.</td>';
        tbody.appendChild(tr);
      }
    });
  }

  function renderDistributionReport() {
    document.querySelectorAll('[data-distribution-body]').forEach((tbody) => {
      tbody.textContent = '';
      state.distributions.forEach((entry, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${index + 1}</td><td>${formatDate(entry.dateTimeISO)}</td><td>${entry.cardNumber}</td><td>${entry.name}</td><td>${entry.category}</td><td>${entry.riceGiven} kg</td><td>${entry.wheatGiven} kg</td><td>${entry.sugarGiven} kg</td>`;
        tbody.appendChild(tr);
      });
      if (!state.distributions.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="8">No distributions have been recorded.</td>';
        tbody.appendChild(tr);
      }
    });
  }

  function checkLowStock() {
    const low = Object.entries(state.stock).filter(([, qty]) => qty < 20);
    document.querySelectorAll('[data-low-stock-alert]').forEach((el) => {
      if (!low.length) {
        el.textContent = 'Stock levels are healthy for all commodities.';
        el.className = 'alert alert-success';
      } else {
        const list = low.map(([item, qty]) => `${item} (${qty} kg)`).join(', ');
        el.textContent = `Low Stock Alert: ${list}`;
        el.className = 'alert alert-warning';
      }
    });
  }

  function attachBeneficiaryForm() {
    const form = document.getElementById('beneficiary-form');
    if (!form) return;

    const cardInput = document.getElementById('card-number');
    const errorEl = document.getElementById('card-error');
    const eligibilityEl = document.getElementById('eligibility-result');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name')).trim();
      const cardNumber = String(data.get('cardNumber')).trim();
      const familyMembers = Number(data.get('familyMembers'));
      const category = String(data.get('category'));
      const address = String(data.get('address')).trim();

      if (!validateCardNumber(cardNumber)) {
        errorEl.textContent = 'Ration card number must be exactly 10 digits.';
        cardInput.setAttribute('aria-invalid', 'true');
        return;
      }

      errorEl.textContent = '';
      cardInput.removeAttribute('aria-invalid');

      const riceEligibility = calculateEligibility(category, familyMembers);
      const beneficiary = { name, cardNumber, familyMembers, category, address, riceEligibility };

      state.beneficiaries.push(beneficiary);
      saveState();
      renderBeneficiariesTable();

      eligibilityEl.textContent = `${name} is eligible for ${riceEligibility} kg rice/month (${category}).`;
      eligibilityEl.className = 'alert alert-success';
      form.reset();
    });

    const clearBtn = document.getElementById('clear-form-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        form.reset();
        errorEl.textContent = '';
        eligibilityEl.textContent = 'Form cleared.';
        eligibilityEl.className = 'alert alert-success';
      });
    }
  }

  function attachSearchHandlers() {
    document.querySelectorAll('[data-search-form]').forEach((form) => {
      const input = form.querySelector('[data-search-input]');
      const output = form.querySelector('[data-search-output]');

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const card = input.value.trim();
        const result = findBeneficiary(card);

        if (!result) {
          output.textContent = 'No beneficiary found for this ration card number.';
          output.className = 'alert alert-error';
          return;
        }

        output.textContent = `Found: ${result.name} (${result.category}), Family: ${result.familyMembers}, Rice eligibility: ${result.riceEligibility} kg.`;
        output.className = 'alert alert-success';
      });
    });
  }

  function computeWheat(category, familyMembers) {
    const factor = category === 'Antyodaya' ? 4 : category === 'BPL' ? 3 : 2;
    return factor * Number(familyMembers || 0);
  }

  function distributeRation(cardNumber) {
    const person = findBeneficiary(cardNumber);
    if (!person) {
      return { ok: false, message: 'Beneficiary not found with this ration card number.' };
    }

    const riceGiven = person.riceEligibility;
    const wheatGiven = computeWheat(person.category, person.familyMembers);
    const sugarGiven = 1;

    if (state.stock.rice < riceGiven || state.stock.wheat < wheatGiven || state.stock.sugar < sugarGiven) {
      return { ok: false, message: 'Insufficient stock for this transaction.' };
    }

    state.stock.rice -= riceGiven;
    state.stock.wheat -= wheatGiven;
    state.stock.sugar -= sugarGiven;

    const record = {
      dateTimeISO: new Date().toISOString(),
      cardNumber: person.cardNumber,
      name: person.name,
      category: person.category,
      riceGiven,
      wheatGiven,
      sugarGiven
    };

    state.distributions.unshift(record);
    saveState();
    return { ok: true, record };
  }

  function attachDistributionPanel() {
    const form = document.getElementById('distribution-form');
    if (!form) return;

    const cardInput = document.getElementById('distribution-card');
    const output = document.getElementById('distribution-message');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const cardNumber = cardInput.value.trim();
      const result = distributeRation(cardNumber);

      if (!result.ok) {
        output.textContent = result.message;
        output.className = 'alert alert-error';
        return;
      }

      output.textContent = `Ration distributed to ${result.record.name}.`;
      output.className = 'alert alert-success';
      renderStock();
      renderDistributionReport();
      checkLowStock();
      cardInput.value = '';
    });
  }

  function attachResetSystem() {
    const btn = document.getElementById('reset-system-btn');
    if (!btn) return;

    const status = document.getElementById('reset-status');

    btn.addEventListener('click', () => {
      state.beneficiaries = [];
      state.distributions = [];
      state.stock = { ...initialStock };
      localStorage.removeItem(STORAGE_KEYS.beneficiaries);
      localStorage.removeItem(STORAGE_KEYS.distributions);
      localStorage.removeItem(STORAGE_KEYS.stock);
      saveState();
      renderStock();
      renderBeneficiariesTable();
      renderDistributionReport();
      checkLowStock();
      if (status) {
        status.textContent = 'System reset complete. All sample data cleared and stock restored.';
        status.className = 'alert alert-success';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderShopDetails();
    renderStock();
    renderBeneficiariesTable();
    renderDistributionReport();
    checkLowStock();

    attachBeneficiaryForm();
    attachSearchHandlers();
    attachDistributionPanel();
    attachResetSystem();
  });
})();
