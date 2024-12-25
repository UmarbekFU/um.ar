document.addEventListener('DOMContentLoaded', () => {
    // Initialize rich text editor
    const editor = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['link', 'image', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean']
            ]
        }
    });

    // Page content management
    const pageSelect = document.getElementById('pageSelect');
    const publishBtn = document.querySelector('.publish-btn');
    let currentPageContent = {};

    // Load page content when page is selected
    pageSelect.addEventListener('change', async () => {
        const page = pageSelect.value;
        try {
            const response = await fetch(`/api/content/${page}`);
            currentPageContent = await response.json();
            
            // Update editor content
            editor.setContents(currentPageContent.content);
            
            // Update SEO fields
            document.querySelector('input[placeholder="Meta Title"]').value = currentPageContent.meta.title;
            document.querySelector('textarea[placeholder="Meta Description"]').value = currentPageContent.meta.description;
            document.querySelector('input[placeholder="Keywords"]').value = currentPageContent.meta.keywords;
        } catch (error) {
            console.error('Error loading page content:', error);
            showNotification('Error loading page content', 'error');
        }
    });

    // Handle content publishing
    publishBtn.addEventListener('click', async () => {
        const page = pageSelect.value;
        const content = editor.getContents();
        const meta = {
            title: document.querySelector('input[placeholder="Meta Title"]').value,
            description: document.querySelector('textarea[placeholder="Meta Description"]').value,
            keywords: document.querySelector('input[placeholder="Keywords"]').value
        };

        try {
            const response = await fetch('/api/content/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page,
                    content,
                    meta
                })
            });

            if (response.ok) {
                showNotification('Changes published successfully!', 'success');
            } else {
                throw new Error('Failed to publish changes');
            }
        } catch (error) {
            console.error('Error publishing changes:', error);
            showNotification('Error publishing changes', 'error');
        }
    });

    // Email Management
    const subscribersList = document.getElementById('subscribersList');
    const composeBtn = document.querySelector('.compose-btn');
    const emailModal = document.getElementById('emailModal');
    const emailEditor = new Quill('#emailEditor', {
        theme: 'snow',
        placeholder: 'Compose your email...'
    });

    // Load subscribers
    async function loadSubscribers() {
        try {
            const response = await fetch('/api/subscribers');
            const subscribers = await response.json();
            
            subscribersList.innerHTML = subscribers.map(sub => `
                <tr>
                    <td><input type="checkbox" value="${sub.id}"></td>
                    <td>${sub.name}</td>
                    <td>${sub.email}</td>
                    <td>${new Date(sub.subscribed_date).toLocaleDateString()}</td>
                    <td><span class="status ${sub.status}">${sub.status}</span></td>
                    <td>
                        <button class="action-btn small" onclick="editSubscriber(${sub.id})">Edit</button>
                        <button class="action-btn small danger" onclick="deleteSubscriber(${sub.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading subscribers:', error);
            showNotification('Error loading subscribers', 'error');
        }
    }

    // Send bulk email
    document.querySelector('.send-btn').addEventListener('click', async () => {
        const selectedSubscribers = Array.from(document.querySelectorAll('#subscribersList input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        
        const emailContent = emailEditor.getContents();
        const subject = document.querySelector('.composer-form input[type="text"]').value;

        try {
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscribers: selectedSubscribers,
                    subject,
                    content: emailContent
                })
            });

            if (response.ok) {
                showNotification('Email sent successfully!', 'success');
                emailModal.classList.remove('active');
            } else {
                throw new Error('Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            showNotification('Error sending email', 'error');
        }
    });

    // Navigation between sections
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.dashboard-section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;
            
            // Update active states
            menuItems.forEach(i => i.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(sectionId).classList.add('active');

            // Load section-specific data
            if (sectionId === 'subscribers') {
                loadSubscribers();
            } else if (sectionId === 'analytics') {
                loadAnalytics();
            }
        });
    });

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Initialize Analytics
    function loadAnalytics() {
        const trafficCtx = document.getElementById('trafficChart').getContext('2d');
        const pagesCtx = document.getElementById('pagesChart').getContext('2d');

        new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Visitors',
                    data: [1200, 1900, 3000, 5000, 6000, 4000],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                            color: '#fff',
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                            color: '#fff',
                        }
                    }
                }
            }
        });

        new Chart(pagesCtx, {
            type: 'bar',
            data: {
                labels: ['Home', 'About', 'Portfolio', 'Essays'],
                datasets: [{
                    label: 'Page Views',
                    data: [4000, 3000, 5000, 2000],
                    backgroundColor: '#2196F3',
                    borderColor: '#1976D2',
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                            color: '#fff',
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                            color: '#fff',
                        }
                    }
                }
            }
        });
    }

    // Initial load
    loadSubscribers();
    loadAnalytics();

    // Essays Management
    const essaysList = document.getElementById('essaysList');
    const essayEditor = new Quill('#essayEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['clean']
            ],
            keyboard: {
                bindings: {
                    'autosave': {
                        key: 'S',
                        shortKey: true,
                        handler: () => saveEssay('draft')
                    }
                }
            }
        },
        placeholder: 'Start writing your essay...'
    });

    // Auto-save functionality
    let autoSaveTimeout;
    essayEditor.on('text-change', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveEssay('draft');
        }, 3000);
    });

    // Load essays with enhanced UI
    async function loadEssays() {
        try {
            const response = await fetch('/api/essays');
            const essays = await response.json();
            
            essaysList.innerHTML = essays.map(essay => `
                <div class="essay-item" data-id="${essay.id}">
                    <div class="essay-item-title">${essay.title}</div>
                    <div class="essay-item-meta">
                        <span class="essay-status ${essay.status}">${essay.status}</span>
                        <span class="essay-date">Last edited: ${formatDate(essay.updated_at)}</span>
                        ${essay.word_count ? `<span class="essay-words">${essay.word_count} words</span>` : ''}
                    </div>
                </div>
            `).join('');

            // Add click handlers
            document.querySelectorAll('.essay-item').forEach(item => {
                item.addEventListener('click', () => loadEssay(item.dataset.id));
            });
        } catch (error) {
            console.error('Error loading essays:', error);
            showNotification('Error loading essays', 'error');
        }
    }

    // Helper function to format dates
    function formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 86400000) { // Less than 24 hours
            return `Today at ${d.toLocaleTimeString()}`;
        } else if (diff < 172800000) { // Less than 48 hours
            return `Yesterday at ${d.toLocaleTimeString()}`;
        } else {
            return d.toLocaleDateString();
        }
    }

    // Preview functionality
    document.querySelector('.preview-btn').addEventListener('click', () => {
        const content = essayEditor.getContents();
        const previewWindow = window.open('', '_blank');
        const title = document.getElementById('essayTitle').value;
        
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Preview: ${title}</title>
                <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
                <style>
                    body { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
                    .preview-banner { background: #333; color: white; padding: 1rem; margin-bottom: 2rem; }
                </style>
            </head>
            <body>
                <div class="preview-banner">Preview Mode</div>
                <div class="ql-editor">${essayEditor.root.innerHTML}</div>
            </body>
            </html>
        `);
    });

    // Load single essay
    async function loadEssay(id) {
        try {
            const response = await fetch(`/api/essays/${id}`);
            const essay = await response.json();
            
            document.getElementById('essayTitle').value = essay.title;
            document.querySelector('.essay-tags').value = essay.tags.join(', ');
            document.querySelector('.essay-image').value = essay.featured_image;
            essayEditor.setContents(essay.content);
            
            // Update active state
            document.querySelectorAll('.essay-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === id);
            });
        } catch (error) {
            console.error('Error loading essay:', error);
            showNotification('Error loading essay', 'error');
        }
    }

    // Save essay
    async function saveEssay(status = 'draft') {
        const title = document.getElementById('essayTitle').value;
        const content = essayEditor.getContents();
        const tags = document.querySelector('.essay-tags').value.split(',').map(tag => tag.trim());
        const featured_image = document.querySelector('.essay-image').value;

        try {
            const response = await fetch('/api/essays/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    tags,
                    featured_image,
                    status
                })
            });

            if (response.ok) {
                showNotification(`Essay ${status === 'published' ? 'published' : 'saved'} successfully!`, 'success');
                loadEssays(); // Refresh list
            } else {
                throw new Error('Failed to save essay');
            }
        } catch (error) {
            console.error('Error saving essay:', error);
            showNotification('Error saving essay', 'error');
        }
    }

    // Event listeners
    document.querySelector('.new-essay-btn').addEventListener('click', () => {
        document.getElementById('essayTitle').value = '';
        document.querySelector('.essay-tags').value = '';
        document.querySelector('.essay-image').value = '';
        essayEditor.setContents([]);
        document.querySelectorAll('.essay-item').forEach(item => item.classList.remove('active'));
    });

    document.querySelector('.save-draft-btn').addEventListener('click', () => saveEssay('draft'));
    document.querySelector('.publish-essay-btn').addEventListener('click', () => saveEssay('published'));

    // Search and filter
    document.querySelector('.search-essays').addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        document.querySelectorAll('.essay-item').forEach(item => {
            const title = item.querySelector('.essay-item-title').textContent.toLowerCase();
            item.style.display = title.includes(search) ? 'block' : 'none';
        });
    });

    document.querySelector('.essay-filter').addEventListener('change', (e) => {
        const filter = e.target.value;
        document.querySelectorAll('.essay-item').forEach(item => {
            const status = item.querySelector('.essay-item-meta').textContent.split('•')[0].trim();
            item.style.display = (filter === 'all' || status === filter) ? 'block' : 'none';
        });
    });
}); 