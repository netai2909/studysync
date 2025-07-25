// StudySync Frontend Application
class StudySync {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.isAuthenticated = false;
        this.goals = [];
        this.journalEntries = [];
        this.studySessions = [];
        this.timer = {
            isRunning: false,
            currentTime: 25 * 60, // 25 minutes in seconds
            mode: 'focus', // 'focus' or 'break'
            interval: null
        };
        
        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.showLoading();
            
            // Check if user is logged in
            const token = localStorage.getItem('authToken');
            if (token) {
                await this.validateToken(token);
            }
            
            // Initialize app
            this.setupEventListeners();
            this.setupServiceWorker();
            this.loadDailyQuote();
            
            // Hide loading screen
            setTimeout(() => {
                this.hideLoading();
                
                if (!this.isAuthenticated) {
                    this.showAuthModal();
                } else {
                    this.loadUserData();
                    this.showApp();
                }
            }, 1500);
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Error initializing app', 'error');
        }
    }

    showLoading() {
        document.getElementById('loading-screen').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-screen').style.display = 'none';
    }

    showAuthModal() {
        document.getElementById('auth-modal').classList.add('active');
    }

    hideAuthModal() {
        document.getElementById('auth-modal').classList.remove('active');
    }

    showApp() {
        document.getElementById('app').style.display = 'block';
        this.updateDashboard();
    }

    setupEventListeners() {
        // Authentication
        this.setupAuthEvents();
        
        // Navigation
        this.setupNavigationEvents();
        
        // Goals
        this.setupGoalsEvents();
        
        // Timer
        this.setupTimerEvents();
        
        // Journal
        this.setupJournalEvents();
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme.bind(this));
        
        // User menu
        this.setupUserMenuEvents();
        
        // Resources
        this.setupResourcesEvents();
    }

    setupAuthEvents() {
        const authForm = document.getElementById('auth-form');
        const authSwitchLink = document.getElementById('auth-switch-link');
        
        let isLogin = true;
        
        authSwitchLink.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;
            
            const title = document.getElementById('auth-title');
            const submitBtn = document.getElementById('auth-submit');
            const nameField = document.getElementById('name-field');
            const switchText = document.getElementById('auth-switch-text');
            const switchLink = document.getElementById('auth-switch-link');
            
            if (isLogin) {
                title.textContent = 'Welcome Back';
                submitBtn.textContent = 'Login';
                nameField.style.display = 'none';
                switchText.textContent = "Don't have an account?";
                switchLink.textContent = 'Sign up';
            } else {
                title.textContent = 'Create Account';
                submitBtn.textContent = 'Sign Up';
                nameField.style.display = 'block';
                switchText.textContent = 'Already have an account?';
                switchLink.textContent = 'Login';
            }
        });

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = document.getElementById('name').value;
            
            try {
                if (isLogin) {
                    await this.login(email, password);
                } else {
                    await this.register(name, email, password);
                }
            } catch (error) {
                this.showToast(error.message, 'error');
            }
        });
    }

    async login(email, password) {
        // Simulate API call - replace with actual backend call
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            
            const data = await response.json();
            
            localStorage.setItem('authToken', data.token);
            this.currentUser = data.user;
            this.isAuthenticated = true;
            
            this.hideAuthModal();
            this.showApp();
            this.loadUserData();
            
            this.showToast('Welcome back!', 'success');
            
        } catch (error) {
            // Fallback for demo - remove in production
            if (email === 'demo@studysync.com' && password === 'demo123') {
                this.currentUser = {
                    id: 'demo-user',
                    name: 'Demo User',
                    email: 'demo@studysync.com'
                };
                this.isAuthenticated = true;
                localStorage.setItem('authToken', 'demo-token');
                
                this.hideAuthModal();
                this.showApp();
                this.loadUserData();
                this.showToast('Welcome to StudySync!', 'success');
            } else {
                throw new Error('Invalid credentials. Try demo@studysync.com / demo123');
            }
        }
    }

    async register(name, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            if (!response.ok) {
                throw new Error('Registration failed');
            }
            
            const data = await response.json();
            
            localStorage.setItem('authToken', data.token);
            this.currentUser = data.user;
            this.isAuthenticated = true;
            
            this.hideAuthModal();
            this.showApp();
            this.loadUserData();
            
            this.showToast('Account created successfully!', 'success');
            
        } catch (error) {
            throw new Error('Registration failed. Please try again.');
        }
    }

    async validateToken(token) {
        try {
            const response = await fetch('/api/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.isAuthenticated = true;
            } else {
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            // Fallback for demo
            if (token === 'demo-token') {
                this.currentUser = {
                    id: 'demo-user',
                    name: 'Demo User',
                    email: 'demo@studysync.com'
                };
                this.isAuthenticated = true;
            }
        }
    }

    setupNavigationEvents() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.getAttribute('data-section');
                this.showSection(sectionId);
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.remove('active'));
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Load section-specific data
            this.loadSectionData(sectionId);
        }
    }

    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'goals':
                this.loadGoals();
                break;
            case 'timer':
                this.initializeTimer();
                break;
            case 'journal':
                this.loadJournalEntries();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'resources':
                this.loadResources();
                break;
        }
    }

    setupGoalsEvents() {
        const addGoalBtn = document.getElementById('add-goal-btn');
        const goalModal = document.getElementById('goal-modal');
        const goalForm = document.getElementById('goal-form');
        const cancelGoalBtn = document.getElementById('cancel-goal');
        const closeModalBtn = goalModal.querySelector('.modal-close');
        
        addGoalBtn.addEventListener('click', () => {
            goalModal.classList.add('active');
        });
        
        cancelGoalBtn.addEventListener('click', () => {
            goalModal.classList.remove('active');
            goalForm.reset();
        });
        
        closeModalBtn.addEventListener('click', () => {
            goalModal.classList.remove('active');
            goalForm.reset();
        });
        
        goalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveGoal();
        });
        
        // Goal tabs
        const goalTabs = document.querySelectorAll('.goals-tabs .tab-btn');
        goalTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                goalTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const filter = tab.getAttribute('data-tab');
                this.filterGoals(filter);
            });
        });
    }

    async saveGoal() {
        const title = document.getElementById('goal-title').value;
        const subject = document.getElementById('goal-subject').value;
        const deadline = document.getElementById('goal-deadline').value;
        const priority = document.getElementById('goal-priority').value;
        const description = document.getElementById('goal-description').value;
        
        const goal = {
            id: Date.now().toString(),
            title,
            subject,
            deadline,
            priority,
            description,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        try {
            // Save to backend
            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(goal)
            });
            
            if (response.ok) {
                this.goals.push(goal);
                this.saveToLocalStorage('goals', this.goals);
                this.renderGoals();
                
                document.getElementById('goal-modal').classList.remove('active');
                document.getElementById('goal-form').reset();
                
                this.showToast('Goal added successfully!', 'success');
            }
        } catch (error) {
            // Fallback to local storage
            this.goals.push(goal);
            this.saveToLocalStorage('goals', this.goals);
            this.renderGoals();
            
            document.getElementById('goal-modal').classList.remove('active');
            document.getElementById('goal-form').reset();
            
            this.showToast('Goal added successfully!', 'success');
        }
    }

    loadGoals() {
        // Load from local storage as fallback
        this.goals = this.getFromLocalStorage('goals') || [];
        this.renderGoals();
    }

    renderGoals() {
        const container = document.getElementById('goals-container');
        container.innerHTML = '';
        
        if (this.goals.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: 40px;">
                    <h3>No goals yet</h3>
                    <p>Create your first study goal to get started!</p>
                </div>
            `;
            return;
        }
        
        this.goals.forEach(goal => {
            const goalElement = this.createGoalElement(goal);
            container.appendChild(goalElement);
        });
    }

    createGoalElement(goal) {
        const div = document.createElement('div');
        div.className = 'goal-item';
        div.innerHTML = `
            <input type="checkbox" class="goal-checkbox" ${goal.completed ? 'checked' : ''}>
            <div class="goal-content">
                <div class="goal-title">${goal.title}</div>
                <div class="goal-meta">
                    <span>📚 ${goal.subject}</span>
                    <span>📅 ${new Date(goal.deadline).toLocaleDateString()}</span>
                    <span class="priority priority-${goal.priority}">🏷️ ${goal.priority}</span>
                </div>
            </div>
            <div class="goal-actions">
                <button class="btn-small edit-goal">Edit</button>
                <button class="btn-small delete-goal">Delete</button>
            </div>
        `;
        
        // Add event listeners
        const checkbox = div.querySelector('.goal-checkbox');
        checkbox.addEventListener('change', () => {
            goal.completed = checkbox.checked;
            this.updateGoal(goal);
        });
        
        const editBtn = div.querySelector('.edit-goal');
        editBtn.addEventListener('click', () => {
            this.editGoal(goal);
        });
        
        const deleteBtn = div.querySelector('.delete-goal');
        deleteBtn.addEventListener('click', () => {
            this.deleteGoal(goal.id);
        });
        
        return div;
    }

    async updateGoal(goal) {
        try {
            const response = await fetch(`/api/goals/${goal.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(goal)
            });
            
            if (response.ok) {
                this.saveToLocalStorage('goals', this.goals);
                this.updateDashboard();
            }
        } catch (error) {
            // Fallback to local storage
            this.saveToLocalStorage('goals', this.goals);
            this.updateDashboard();
        }
    }

    async deleteGoal(goalId) {
        if (!confirm('Are you sure you want to delete this goal?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/goals/${goalId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                this.goals = this.goals.filter(goal => goal.id !== goalId);
                this.saveToLocalStorage('goals', this.goals);
                this.renderGoals();
                this.showToast('Goal deleted', 'success');
            }
        } catch (error) {
            // Fallback to local storage
            this.goals = this.goals.filter(goal => goal.id !== goalId);
            this.saveToLocalStorage('goals', this.goals);
            this.renderGoals();
            this.showToast('Goal deleted', 'success');
        }
    }

    filterGoals(filter) {
        const goalItems = document.querySelectorAll('.goal-item');
        const today = new Date().toISOString().split('T')[0];
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        goalItems.forEach(item => {
            const goal = this.goals.find(g => g.title === item.querySelector('.goal-title').textContent);
            let show = true;
            
            switch (filter) {
                case 'today':
                    show = goal.deadline === today;
                    break;
                case 'week':
                    show = goal.deadline <= weekFromNow;
                    break;
                case 'completed':
                    show = goal.completed;
                    break;
                case 'all':
                default:
                    show = true;
            }
            
            item.style.display = show ? 'flex' : 'none';
        });
    }

    setupTimerEvents() {
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        const resetBtn = document.getElementById('reset-timer');
        const focusTimeSlider = document.getElementById('focus-time');
        const breakTimeSlider = document.getElementById('break-time');
        
        startBtn.addEventListener('click', () => this.startTimer());
        pauseBtn.addEventListener('click', () => this.pauseTimer());
        resetBtn.addEventListener('click', () => this.resetTimer());
        
        focusTimeSlider.addEventListener('input', (e) => {
            document.getElementById('focus-display').textContent = `${e.target.value} min`;
            if (!this.timer.isRunning && this.timer.mode === 'focus') {
                this.timer.currentTime = e.target.value * 60;
                this.updateTimerDisplay();
            }
        });
        
        breakTimeSlider.addEventListener('input', (e) => {
            document.getElementById('break-display').textContent = `${e.target.value} min`;
            if (!this.timer.isRunning && this.timer.mode === 'break') {
                this.timer.currentTime = e.target.value * 60;
                this.updateTimerDisplay();
            }
        });
    }

    initializeTimer() {
        this.updateTimerDisplay();
        this.updateTimerStats();
    }

    startTimer() {
        this.timer.isRunning = true;
        document.getElementById('start-timer').style.display = 'none';
        document.getElementById('pause-timer').style.display = 'inline-block';
        
        this.timer.interval = setInterval(() => {
            this.timer.currentTime--;
            this.updateTimerDisplay();
            
            if (this.timer.currentTime <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    pauseTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.interval);
        
        document.getElementById('start-timer').style.display = 'inline-block';
        document.getElementById('pause-timer').style.display = 'none';
    }

    resetTimer() {
        this.pauseTimer();
        
        if (this.timer.mode === 'focus') {
            this.timer.currentTime = document.getElementById('focus-time').value * 60;
        } else {
            this.timer.currentTime = document.getElementById('break-time').value * 60;
        }
        
        this.updateTimerDisplay();
    }

    timerComplete() {
        this.pauseTimer();
        
        // Send notification
        this.sendNotification(
            this.timer.mode === 'focus' ? 'Focus session complete!' : 'Break time over!',
            this.timer.mode === 'focus' ? 'Time for a break' : 'Back to work!'
        );
        
        // Update stats
        this.updateSessionStats();
        
        // Switch mode
        this.timer.mode = this.timer.mode === 'focus' ? 'break' : 'focus';
        document.getElementById('timer-mode').textContent = this.timer.mode === 'focus' ? 'Focus Time' : 'Break Time';
        
        // Reset timer for new mode
        this.resetTimer();
        
        this.showToast(`${this.timer.mode === 'focus' ? 'Break' : 'Focus'} session complete!`, 'success');
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.currentTime / 60);
        const seconds = this.timer.currentTime % 60;
        document.getElementById('timer-display').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress ring
        const totalTime = this.timer.mode === 'focus' ? 
            document.getElementById('focus-time').value * 60 : 
            document.getElementById('break-time').value * 60;
        
        const progress = (totalTime - this.timer.currentTime) / totalTime;
        // Update progress ring visualization here
    }

    updateSessionStats() {
        let sessions = this.getFromLocalStorage('todaySessions') || { focus: 0, break: 0, focusTime: 0, breakTime: 0 };
        
        if (this.timer.mode === 'focus') {
            sessions.focus++;
            sessions.focusTime += document.getElementById('focus-time').value;
        } else {
            sessions.break++;
            sessions.breakTime += document.getElementById('break-time').value;
        }
        
        this.saveToLocalStorage('todaySessions', sessions);
        this.updateTimerStats();
    }

    updateTimerStats() {
        const sessions = this.getFromLocalStorage('todaySessions') || { focus: 0, break: 0, focusTime: 0, breakTime: 0 };
        
        document.getElementById('sessions-count').textContent = sessions.focus;
        document.getElementById('focus-time-total').textContent = `${sessions.focusTime}m`;
        document.getElementById('break-time-total').textContent = `${sessions.breakTime}m`;
    }

    setupJournalEvents() {
        const addEntryBtn = document.getElementById('add-entry-btn');
        const journalModal = document.getElementById('journal-modal');
        const journalForm = document.getElementById('journal-form');
        const cancelEntryBtn = document.getElementById('cancel-entry');
        const closeModalBtn = journalModal.querySelector('.modal-close');
        
        addEntryBtn.addEventListener('click', () => {
            journalModal.classList.add('active');
        });
        
        cancelEntryBtn.addEventListener('click', () => {
            journalModal.classList.remove('active');
            journalForm.reset();
        });
        
        closeModalBtn.addEventListener('click', () => {
            journalModal.classList.remove('active');
            journalForm.reset();
        });
        
        journalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveJournalEntry();
        });
    }

    async saveJournalEntry() {
        const mood = document.querySelector('input[name="mood"]:checked')?.value;
        const content = document.getElementById('entry-content').value;
        const tags = document.getElementById('entry-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!mood || !content) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const entry = {
            id: Date.now().toString(),
            mood,
            content,
            tags,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        try {
            const response = await fetch('/api/journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(entry)
            });
            
            if (response.ok) {
                this.journalEntries.unshift(entry);
                this.saveToLocalStorage('journalEntries', this.journalEntries);
                this.renderJournalEntries();
                
                document.getElementById('journal-modal').classList.remove('active');
                document.getElementById('journal-form').reset();
                
                this.showToast('Journal entry saved!', 'success');
            }
        } catch (error) {
            // Fallback to local storage
            this.journalEntries.unshift(entry);
            this.saveToLocalStorage('journalEntries', this.journalEntries);
            this.renderJournalEntries();
            
            document.getElementById('journal-modal').classList.remove('active');
            document.getElementById('journal-form').reset();
            
            this.showToast('Journal entry saved!', 'success');
        }
    }

    loadJournalEntries() {
        this.journalEntries = this.getFromLocalStorage('journalEntries') || [];
        this.renderJournalEntries();
    }

    renderJournalEntries() {
        const container = document.getElementById('journal-entries');
        container.innerHTML = '';
        
        if (this.journalEntries.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: 40px;">
                    <h3>No journal entries yet</h3>
                    <p>Start documenting your study journey!</p>
                </div>
            `;
            return;
        }
        
        this.journalEntries.forEach(entry => {
            const entryElement = this.createJournalEntryElement(entry);
            container.appendChild(entryElement);
        });
    }

    createJournalEntryElement(entry) {
        const div = document.createElement('div');
        div.className = 'journal-entry';
        
        const moodEmojis = {
            great: '😄',
            good: '😊',
            okay: '😐',
            bad: '😟',
            terrible: '😢'
        };
        
        div.innerHTML = `
            <div class="entry-header">
                <span class="entry-date">${new Date(entry.date).toLocaleDateString()}</span>
                <span class="entry-mood">${moodEmojis[entry.mood]}</span>
            </div>
            <div class="entry-content">${entry.content}</div>
            <div class="entry-tags">
                ${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        
        return div;
    }

    setupUserMenuEvents() {
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');
        
        userMenuBtn.addEventListener('click', () => {
            userDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
        
        logoutBtn.addEventListener('click', () => {
            this.logout();
        });
    }

    logout() {
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.isAuthenticated = false;
        
        document.getElementById('app').style.display = 'none';
        this.showAuthModal();
        
        this.showToast('Logged out successfully', 'success');
    }

    setupResourcesEvents() {
        const resourceTabs = document.querySelectorAll('.resource-tabs .tab-btn');
        const searchInput = document.getElementById('resource-search');
        const bookmarkBtns = document.querySelectorAll('.bookmark-btn');
        
        resourceTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                resourceTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const filter = tab.getAttribute('data-tab');
                this.filterResources(filter);
            });
        });
        
        searchInput.addEventListener('input', (e) => {
            this.searchResources(e.target.value);
        });
        
        bookmarkBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                btn.classList.toggle('active');
                
                if (btn.classList.contains('active')) {
                    this.showToast('Resource bookmarked', 'success');
                } else {
                    this.showToast('Bookmark removed', 'success');
                }
            });
        });
    }

    filterResources(filter) {
        const resourceCards = document.querySelectorAll('.resource-card');
        
        resourceCards.forEach(card => {
            if (filter === 'all' || card.getAttribute('data-subject') === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchResources(query) {
        const resourceCards = document.querySelectorAll('.resource-card');
        const searchTerm = query.toLowerCase();
        
        resourceCards.forEach(card => {
            const title = card.querySelector('h4').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    loadResources() {
        // Resources are static in this demo
        // In a real app, you'd load from an API
    }

    updateDashboard() {
        this.updateStats();
        this.loadTodaysGoals();
        this.loadRecentActivity();
        this.updateProgressBars();
    }

    updateStats() {
        const goals = this.getFromLocalStorage('goals') || [];
        const completedGoals = goals.filter(goal => goal.completed).length;
        const sessions = this.getFromLocalStorage('todaySessions') || { focus: 0, focusTime: 0 };
        
        document.getElementById('total-study-time').textContent = `${sessions.focusTime || 0}h`;
        document.getElementById('goals-completed').textContent = completedGoals;
        document.getElementById('current-streak').textContent = this.calculateStreak();
    }

    loadTodaysGoals() {
        const today = new Date().toISOString().split('T')[0];
        const todaysGoals = this.goals.filter(goal => goal.deadline === today);
        
        const container = document.getElementById('today-goals');
        container.innerHTML = '';
        
        if (todaysGoals.length === 0) {
            container.innerHTML = '<li>No goals for today</li>';
            return;
        }
        
        todaysGoals.forEach(goal => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="checkbox" ${goal.completed ? 'checked' : ''}>
                <span>${goal.title}</span>
            `;
            container.appendChild(li);
        });
    }

    loadRecentActivity() {
        const container = document.getElementById('recent-activity');
        const activities = [
            'Completed "Linear Algebra Practice" goal',
            'Studied for 45 minutes (Python)',
            'Added new goal: "Finish NPTEL Lecture 5"',
            'Wrote journal entry',
            'Bookmarked new resource'
        ];
        
        container.innerHTML = '';
        activities.forEach(activity => {
            const li = document.createElement('li');
            li.textContent = activity;
            container.appendChild(li);
        });
    }

    updateProgressBars() {
        // This would be calculated based on actual study data
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }

    calculateStreak() {
        // Calculate study streak based on journal entries or study sessions
        const entries = this.getFromLocalStorage('journalEntries') || [];
        let streak = 0;
        let currentDate = new Date();
        
        for (let i = 0; i < 30; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const hasEntry = entries.some(entry => entry.date.split('T')[0] === dateStr);
            
            if (hasEntry) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    loadAnalytics() {
        // This would load and display charts using Chart.js
        // For demo purposes, we'll just show placeholder data
        setTimeout(() => {
            this.showToast('Analytics loaded', 'success');
        }, 500);
    }

    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('theme-toggle');
        
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        }
    }

    loadDailyQuote() {
        const quotes = [
            "Success is the sum of small efforts, repeated day in and day out.",
            "Don't watch the clock; do what it does. Keep going.",
            "Believe in yourself and all that you are.",
            "Your limitation—it's only your imagination.",
            "Push yourself, because no one else is going to do it for you.",
            "Great things never come from comfort zones.",
            "Dream it. Wish it. Do it.",
            "Stay positive, work hard, make it happen.",
            "The secret of getting ahead is getting started.",
            "It's going to be hard, but hard does not mean impossible."
        ];
        
        const today = new Date().toDateString();
        let savedQuote = localStorage.getItem('dailyQuote');
        let savedDate = localStorage.getItem('quoteDate');
        
        if (savedDate !== today) {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            localStorage.setItem('dailyQuote', randomQuote);
            localStorage.setItem('quoteDate', today);
            savedQuote = randomQuote;
        }
        
        document.getElementById('daily-quote').textContent = savedQuote;
    }

    async loadUserData() {
        if (this.currentUser) {
            // Set user initial
            document.getElementById('user-initial').textContent = this.currentUser.name.charAt(0).toUpperCase();
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('theme-toggle').textContent = '☀️';
        }
        
        // Load user data
        this.loadGoals();
        this.loadJournalEntries();
        this.updateDashboard();
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.log('Service Worker registration failed');
            }
        }
    }

    async sendNotification(title, body) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/icon-192.png' });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(title, { body, icon: '/icon-192.png' });
                }
            }
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    saveToLocalStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    getFromLocalStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            return null;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studySync = new StudySync();
});
