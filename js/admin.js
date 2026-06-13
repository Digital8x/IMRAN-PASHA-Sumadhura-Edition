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

                const getFlagEmoji = (countryCode) => {
                    if (!countryCode) return '';
                    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
                    return String.fromCodePoint(...codePoints);
                };
                
                const emojiFlag = lead.country_code ? getFlagEmoji(lead.country_code) : (lead.country_flag || '');

                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>
                        <div style="font-weight: 500;">${lead.name}</div>
                        ${lead.message || lead.ip_address ? `<button style="background:none;border:none;color:var(--color-accent);font-size:0.75rem;cursor:pointer;padding:0;margin-top:0.2rem;" onclick="toggleMessage(${lead.id})">View Details</button>` : ''}
                    </td>
                    <td>${lead.phone}</td>
                    <td>${lead.email}</td>
                    <td>${lead.bhk}</td>
                    <td>
                        <div>${lead.source}</div>
                        ${emojiFlag ? `<div style="font-size: 0.8rem; color: #666; margin-top: 0.2rem;"><span title="${lead.country}" style="font-size: 1rem;">${emojiFlag}</span> ${lead.city ? lead.city : ''}</div>` : ''}
                    </td>
                    <td>${new Date(lead.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
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

                // Hidden Details Row
                if (lead.message || lead.ip_address) {
                    const msgTr = document.createElement('tr');
                    msgTr.className = 'message-row';
                    msgTr.id = `msg-${lead.id}`;
                    
                    let trackingHtml = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem; font-size: 0.85rem;">`;
                    trackingHtml += `<div><strong>IP Address:</strong> ${lead.ip_address || 'N/A'}</div>`;
                    trackingHtml += `<div><strong>Device:</strong> ${lead.device_type || 'N/A'}</div>`;
                    trackingHtml += `<div><strong>Browser:</strong> ${lead.browser || 'N/A'}</div>`;
                    trackingHtml += `<div><strong>Page URL:</strong> ${lead.page_url ? `<a href="${lead.page_url}" target="_blank" style="color:var(--color-accent);text-decoration:none;">Link</a>` : 'N/A'}</div>`;
                    if (lead.utm_source) trackingHtml += `<div><strong>UTM Source:</strong> ${lead.utm_source}</div>`;
                    if (lead.utm_campaign) trackingHtml += `<div><strong>UTM Campaign:</strong> ${lead.utm_campaign}</div>`;
                    if (lead.refer_url) trackingHtml += `<div><strong>Referrer:</strong> <a href="${lead.refer_url}" target="_blank" style="color:var(--color-accent);text-decoration:none;">Link</a></div>`;
                    trackingHtml += `</div>`;
                    
                    msgTr.innerHTML = `
                        <td colspan="9">
                            ${lead.message ? `<div style="margin-bottom: 0.8rem;"><strong>Message:</strong> ${lead.message}</div>` : ''}
                            ${lead.ip_address ? `
                                <div style="border-top:1px solid #e0e0e0; padding-top: 0.8rem;">
                                    <strong style="color: var(--color-accent);">Advanced Tracking Data:</strong>
                                    ${trackingHtml}
                                </div>
                            ` : ''}
                        </td>
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
            csvContent += "ID,Name,Phone,Email,BHK,Source,Message,Status,Date,IP,City,Country,Device,Browser,UTM Source,UTM Campaign,Referrer,Page URL\n";

            allLeads.forEach(row => {
                const msg = row.message ? row.message.replace(/,/g, ' ').replace(/\n/g, ' ') : ''; 
                const line = `${row.id},${row.name},${row.phone},${row.email},${row.bhk},${row.source},${msg},${row.status},${row.timestamp},${row.ip_address || ''},${row.city || ''},${row.country || ''},${row.device_type || ''},${row.browser || ''},${row.utm_source || ''},${row.utm_campaign || ''},${row.refer_url || ''},${row.page_url || ''}`;
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
