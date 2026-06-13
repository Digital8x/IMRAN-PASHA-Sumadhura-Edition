document.addEventListener('DOMContentLoaded', async () => {

    // Function to check session status from backend
    const checkSession = async () => {
        try {
            const res = await fetch('../backend/auth.php?action=check');
            const data = await res.json();
            return data.logged_in;
        } catch (e) {
            return false;
        }
    };

    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // Check if already logged in
        const isLoggedIn = await checkSession();
        if (isLoggedIn) {
            window.location.href = 'dashboard.html';
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const errorMsg = document.getElementById('login-error');
            const loginCard = document.getElementById('login-card');
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';

            const formData = new FormData();
            formData.append('username', user);
            formData.append('password', pass);

            try {
                const res = await fetch('../backend/auth.php?action=login', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.success) {
                    window.location.href = 'dashboard.html';
                } else {
                    errorMsg.textContent = data.message || 'Invalid credentials.';
                    errorMsg.style.display = 'block';
                    loginCard.classList.remove('shake');
                    void loginCard.offsetWidth; // trigger reflow
                    loginCard.classList.add('shake');
                }
            } catch (err) {
                errorMsg.textContent = 'Network error. Please try again.';
                errorMsg.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }


    // --- DASHBOARD LOGIC ---
    const leadsTbody = document.getElementById('leads-tbody');
    if (leadsTbody) {
        // Auth check
        const isLoggedIn = await checkSession();
        if (!isLoggedIn) {
            window.location.href = 'login.html';
            return;
        }

        // Logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await fetch('../backend/auth.php?action=logout');
            window.location.href = 'login.html';
        });

        let allLeads = [];
        let currentBhkFilter = 'All';

        // Fetch Leads
        const fetchLeads = async () => {
            try {
                const res = await fetch('../backend/leads.php?action=fetch');
                const result = await res.json();
                if (result.success) {
                    allLeads = result.data;
                    updateMetrics();
                    renderTable();
                } else {
                    console.error('Failed to fetch leads:', result.message);
                }
            } catch (err) {
                console.error('Network error fetching leads', err);
            }
        };

        fetchLeads();

        // Update Metrics
        const updateMetrics = () => {
            document.getElementById('metric-total').textContent = allLeads.length;
            
            const today = new Date().toISOString().split('T')[0];
            const todaysLeads = allLeads.filter(l => l.timestamp.startsWith(today)).length;
            document.getElementById('metric-today').textContent = todaysLeads;

            const bhk2 = allLeads.filter(l => l.bhk === '2 BHK').length;
            document.getElementById('metric-2bhk').textContent = bhk2;

            const bhk34 = allLeads.filter(l => l.bhk === '3 BHK' || l.bhk === '4 BHK').length;
            document.getElementById('metric-34bhk').textContent = bhk34;
        };

        // Render Table
        const renderTable = () => {
            const searchVal = document.getElementById('search-input').value.toLowerCase();
            const statusVal = document.getElementById('status-filter').value;

            const filtered = allLeads.filter(lead => {
                // Search filter
                const matchesSearch = lead.name.toLowerCase().includes(searchVal) || 
                                      lead.phone.includes(searchVal) || 
                                      lead.email.toLowerCase().includes(searchVal);
                
                // Status filter
                const matchesStatus = statusVal === 'All' || lead.status === statusVal;

                // BHK Sidebar filter
                const matchesBhk = currentBhkFilter === 'All' || lead.bhk === currentBhkFilter;

                return matchesSearch && matchesStatus && matchesBhk;
            });

            leadsTbody.innerHTML = '';

            filtered.forEach((lead, index) => {
                const tr = document.createElement('tr');
                
                let badgeClass = 'status-new';
                if(lead.status === 'Called') badgeClass = 'status-called';
                if(lead.status === 'Closed') badgeClass = 'status-closed';

                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td style="cursor:pointer; color:#1976d2; font-weight:500;" onclick="toggleMessage(${lead.id})">${lead.name}</td>
                    <td>${lead.phone}</td>
                    <td>${lead.email}</td>
                    <td>${lead.bhk}</td>
                    <td>${lead.source}</td>
                    <td>${new Date(lead.timestamp).toLocaleString()}</td>
                    <td><span class="status-badge ${badgeClass}">${lead.status}</span></td>
                    <td>
                        <div class="actions-flex">
                            <button class="action-icon icon-green" title="Mark as Called" onclick="updateStatus(${lead.id}, 'Called')"><i class="ti ti-check"></i></button>
                            <button class="action-icon icon-gray" title="Mark as Closed" onclick="updateStatus(${lead.id}, 'Closed')"><i class="ti ti-x"></i></button>
                            <button class="action-icon icon-red" title="Delete" onclick="deleteLead(${lead.id})"><i class="ti ti-trash"></i></button>
                        </div>
                    </td>
                `;
                leadsTbody.appendChild(tr);

                // Hidden Message Row
                if (lead.message) {
                    const msgTr = document.createElement('tr');
                    msgTr.className = 'message-row';
                    msgTr.id = `msg-${lead.id}`;
                    msgTr.innerHTML = `
                        <td colspan="9"><strong>Message:</strong> ${lead.message}</td>
                    `;
                    leadsTbody.appendChild(msgTr);
                }
            });
        };

        // Make functions global for inline onclick
        window.toggleMessage = (id) => {
            const row = document.getElementById(`msg-${id}`);
            if(row) {
                row.style.display = row.style.display === 'table-row' ? 'none' : 'table-row';
            }
        };

        window.updateStatus = async (id, status) => {
            const formData = new FormData();
            formData.append('id', id);
            formData.append('status', status);

            try {
                const res = await fetch('../backend/leads.php?action=update_status', {
                    method: 'POST',
                    body: formData
                });
                const result = await res.json();
                if (result.success) {
                    fetchLeads(); // Refresh data
                } else {
                    alert('Error updating status');
                }
            } catch (err) {
                console.error(err);
            }
        };

        window.deleteLead = async (id) => {
            if (confirm('Are you sure you want to delete this lead?')) {
                const formData = new FormData();
                formData.append('id', id);

                try {
                    const res = await fetch('../backend/leads.php?action=delete', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await res.json();
                    if (result.success) {
                        fetchLeads(); // Refresh data
                    } else {
                        alert('Error deleting lead');
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        };

        // Event Listeners for Filters
        document.getElementById('search-input').addEventListener('input', renderTable);
        document.getElementById('status-filter').addEventListener('change', renderTable);

        // Sidebar Navigation filtering
        const navItems = document.querySelectorAll('.nav-item[data-filter]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                currentBhkFilter = item.getAttribute('data-filter');
                renderTable();
            });
        });

        // Export CSV
        document.getElementById('export-btn').addEventListener('click', () => {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "ID,Name,Phone,Email,BHK,Source,Message,Status,Date\n";

            allLeads.forEach(row => {
                const msg = row.message ? row.message.replace(/,/g, ' ') : ''; // escape commas
                const line = `${row.id},${row.name},${row.phone},${row.email},${row.bhk},${row.source},${msg},${row.status},${row.timestamp}`;
                csvContent += line + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `sumadhura_leads_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});
