const firebaseConfig = {
    apiKey: "AIzaSyAN_YWsXr07D_Gi-J1YUyP5SQK9_tAp8Gw",
    authDomain: "friends-challenge-game.firebaseapp.com",
    databaseURL: "https://friends-challenge-game-default-rtdb.firebaseio.com",
    projectId: "friends-challenge-game",
    storageBucket: "friends-challenge-game.appspot.com"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let currentRoomRef = null; 

// ==========================================
// 1. بيانات الحساب
// ==========================================
let userData = { 
    username: "Baqer Hamed", 
    playerID: "885421",
    coins: 50000, 
    points: 0, // نقطة البداية
    nameChangesToday: 0, 
    lastChangeDate: new Date().toDateString(),
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Baqer",
    frame: "linear-gradient(45deg, var(--primary), var(--accent))" 
};
let isAudioInit = false;

const sfxMenu = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=click-button-140881.mp3');
const sfxPlay = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_10e0600bc1.mp3?filename=interface-button-154180.mp3');
const sfxCorrect = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3');
const sfxWrong = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=error-126627.mp3');
const sfxTimer = new Audio('https://cdn.pixabay.com/download/audio/2021/08/09/audio_82c219662b.mp3?filename=tick-tock-40075.mp3');
const bgMusic = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=chill-abstract-intention-116199.mp3');
bgMusic.loop = true; bgMusic.volume = 0.3; let sfxVolumeVal = 0.8;

function initAudio() { if(!isAudioInit) { bgMusic.play().catch(e=>{}); isAudioInit = true; } }
function playSfx(type) {
    let sound = { 'menu': sfxMenu, 'play': sfxPlay, 'correct': sfxCorrect, 'wrong': sfxWrong, 'timer': sfxTimer }[type];
    if(sound) { sound.currentTime = 0; sound.volume = sfxVolumeVal; sound.play().catch(e=>{}); }
}
function updateMusicVol(val) { bgMusic.volume = val / 100; }
function updateSfxVol(val) { sfxVolumeVal = val / 100; }

// ==========================================
// 2. تحديث واجهة المستخدم
// ==========================================
const titlesData = [ { name: "مبتدئ", req: 0, icon: "🥚" }, { name: "هاوي", req: 1000, icon: "🥉" }, { name: "محترف", req: 5000, icon: "🥈" }, { name: "خبير", req: 20000, icon: "🥇" }, { name: "أسطورة", req: 50000, icon: "💎" }, { name: "إمبراطور", req: 100000, icon: "👑" } ];
function getCurrentTitle() { let current = titlesData[0]; for (let i = 0; i < titlesData.length; i++) if (userData.points >= titlesData[i].req) current = titlesData[i]; return current; }

function updateGlobalUI() {
    document.getElementById('coinsDisplay').innerText = userData.coins;
    document.getElementById('pointsDisplay').innerText = userData.points;
    document.getElementById('sideUsername').innerHTML = `${userData.username} <br><small style="color:var(--primary); font-size:0.8rem; font-weight:bold;">[${getCurrentTitle().icon} ${getCurrentTitle().name}]</small>`;
    document.getElementById('sideID').innerText = userData.playerID;
    
    document.getElementById('sideAvatarImg').src = userData.avatar;
    document.getElementById('sideAvatarFrame').style.background = userData.frame;
}

// ==========================================
// 3. بنك المتجر (توليد الـ IDs، إطارات الحيوانات، الصور)
// ==========================================
const storeDB = { ids: [], frames: [], avatars: [], gifts: [], reactions: [] };

// 1. توليد 100 رقم ID متدرج الأسعار
for(let i=1; i<=3; i++) storeDB.ids.push({ name: `ID: ${i}`, val: `${i}`, price: 100000, bg: "rgba(255, 215, 0, 0.2)" }); 
for(let i=10; i<=14; i++) storeDB.ids.push({ name: `ID: ${i}`, val: `${i}`, price: 50000, bg: "rgba(255, 100, 0, 0.2)" }); 
for(let i=100; i<=115; i++) storeDB.ids.push({ name: `ID: ${i}`, val: `${i}`, price: 20000, bg: "rgba(100, 200, 255, 0.2)" }); 
for(let i=1000; i<=1025; i++) storeDB.ids.push({ name: `ID: ${i}`, val: `${i}`, price: 10000, bg: "rgba(0, 255, 100, 0.2)" }); 
for(let i=0; i<51; i++) {
    let r = Math.floor(Math.random()*9000000)+10000; 
    storeDB.ids.push({ name: `ID: ${r}`, val: `${r}`, price: 2000, bg: "rgba(255, 255, 255, 0.1)" });
}

// 2. توليد 50 إطار (حيوانات مميزة + نيون عصري)
const animalFrames = [
    { name: "إطار النمر 🐯", val: "repeating-linear-gradient(45deg, #ea580c, #ea580c 10px, #1c1917 10px, #1c1917 20px)", price: 8000 },
    { name: "إطار الحمار الوحشي 🦓", val: "repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #0f172a 10px, #0f172a 20px)", price: 7000 },
    { name: "إطار النحلة 🐝", val: "repeating-linear-gradient(45deg, #eab308, #eab308 10px, #000 10px, #000 20px)", price: 6000 },
    { name: "إطار الأسد 🦁", val: "radial-gradient(circle, #fcd34d 20%, #b45309 80%)", price: 10000 },
    { name: "إطار الذئب 🐺", val: "linear-gradient(135deg, #94a3b8, #334155, #0f172a)", price: 7500 },
    { name: "إطار الثعلب 🦊", val: "linear-gradient(135deg, #ea580c, #9a3412, #fff)", price: 6500 },
    { name: "إطار الباندا 🐼", val: "linear-gradient(135deg, #fff 40%, #000 60%)", price: 6000 },
    { name: "إطار التنين 🐉", val: "linear-gradient(135deg, #b91c1c, #f59e0b, #b91c1c)", price: 15000 }
];
storeDB.frames = [...animalFrames];

const neonColors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];
for(let i = animalFrames.length + 1; i <= 50; i++) {
    let c1 = neonColors[Math.floor(Math.random()*neonColors.length)];
    let c2 = neonColors[Math.floor(Math.random()*neonColors.length)];
    let grad = `linear-gradient(${Math.floor(Math.random()*360)}deg, ${c1}, ${c2})`;
    storeDB.frames.push({ name: `إطار عصري ${i} ✨`, val: grad, price: 1500 + (i*50), bg: grad });
}
storeDB.frames.forEach(f => { if(!f.bg) f.bg = f.val; });

// 3. قسم الصور (Avatars)
storeDB.avatars = [
    { name: "شبح الظلام", val: "https://api.dicebear.com/7.x/bottts/svg?seed=Ghost", price: 3000, bg: "rgba(31, 41, 55, 0.8)" },
    { name: "بطل المعركة", val: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hero", price: 5000, bg: "rgba(127, 29, 29, 0.8)" },
    { name: "المحارب", val: "https://api.dicebear.com/7.x/micah/svg?seed=Warrior", price: 4000, bg: "rgba(15, 118, 110, 0.8)" },
    { name: "القط المحظوظ", val: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cat", price: 2000, bg: "rgba(139, 92, 246, 0.8)" }
];

// 4. الهدايا والتفاعلات
storeDB.gifts = [ { name: "صندوق الحظ", icon: "🎁", price: 500, bg: "rgba(0,0,0,0.4)" }, { name: "باقة ورد", icon: "💐", price: 200, bg: "rgba(0,0,0,0.4)" } ];
storeDB.reactions = [ { name: "ضحك هستيري", icon: "😂", price: 100, bg: "rgba(0,0,0,0.4)" }, { name: "تفكير عميق", icon: "🤔", price: 100, bg: "rgba(0,0,0,0.4)" } ];

// ==========================================
// 4. تشغيل المتجر وعمليات الشراء
// ==========================================
function switchStoreTab(cat, btn) {
    playSfx('menu');
    document.querySelectorAll('.store-tab').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    const content = document.getElementById('storeContent');
    content.innerHTML = "";
    
    storeDB[cat].forEach(item => {
        let visual = "";
        if(cat === 'ids') visual = `<div class="item-icon-large" style="font-size:2.5rem; color:#fff;">🆔</div>`;
        else if(cat === 'frames') visual = `<div class="frame-preview" style="background:${item.val}; padding:5px;"><img src="${userData.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;"></div>`;
        else if(cat === 'avatars') visual = `<img src="${item.val}" class="item-icon-large">`;
        else visual = `<div class="item-icon-large">${item.icon}</div>`;

        content.innerHTML += `
            <div class="store-item-card" style="background: ${item.bg};">
                ${visual}
                <h4 class="item-name">${item.name}</h4>
                <button class="price-btn" onclick="buyItem('${cat}', '${item.name}', ${item.price}, '${item.val}')">🪙 ${item.price}</button>
            </div>
        `;
    });
}

function buyItem(category, name, price, value) {
    if (userData.coins >= price) {
        if(confirm(`هل تريد شراء "${name}" مقابل ${price} عملة؟`)) {
            userData.coins -= price;
            if(category === 'ids') userData.playerID = value;
            if(category === 'frames') userData.frame = value;
            if(category === 'avatars') userData.avatar = value;
            
            updateGlobalUI(); playSfx('correct');
            alert(`🎉 مبروك! تم تطبيق "${name}" على حسابك بنجاح.`);
            document.getElementById('modalStoreBalance').innerText = `🪙 ${userData.coins}`;
        }
    } else {
        playSfx('wrong'); alert("❌ رصيدك لا يكفي! العب أكثر لجمع العملات.");
    }
}

// ==========================================
// 5. نظام الإنجازات الاحترافي (50 إنجاز)
// ==========================================
const achievements = [];
for(let i=1; i<=50; i++) {
    let req = i <= 10 ? i * 200 : (i <= 30 ? i * 1000 : (i <= 45 ? i * 5000 : i * 20000));
    let name = `تحدي المستوى ${i}`;
    let icon = "🎖️";
    
    // أسماء مميزة للمراحل الكبيرة
    if(i===1) { name="الخطوة الأولى"; icon="🌱"; }
    else if(i===10) { name="المقاتل الصاعد"; icon="⚔️"; }
    else if(i===25) { name="المفترس الأكبر"; icon="🐅"; }
    else if(i===40) { name="أسطورة الذكاء"; icon="💎"; }
    else if(i===50) { name="إمبراطور اللعبة"; icon="👑"; }
    
    achievements.push({ id: i, name: name, desc: `الوصول إلى ${req} نقطة`, reqPoints: req, icon: icon });
}

function toggleMenu(e) { if(e) e.stopPropagation(); playSfx('menu'); const menu = document.getElementById('sideMenu'); const overlay = document.getElementById('sidebarOverlay'); menu.classList.toggle('active'); overlay.style.display = menu.classList.contains('active') ? 'block' : 'none'; }
function closeSidebarOutside(e) { const menu = document.getElementById('sideMenu'); if (menu.classList.contains('active')) { menu.classList.remove('active'); document.getElementById('sidebarOverlay').style.display = 'none'; } }

function openModal(type) {
    playSfx('menu'); const title = document.getElementById('modalTitle'); const body = document.getElementById('modalBody'); document.getElementById('modalOverlay').style.display = 'flex';
    if(document.getElementById('sideMenu').classList.contains('active')) { document.getElementById('sideMenu').classList.remove('active'); document.getElementById('sidebarOverlay').style.display = 'none'; }

    if (type === 'store') { 
        title.innerText = "المتجر الملكي 🛒"; 
        body.innerHTML = `
            <div class="store-header"><p>ثروتك الحالية</p><div id="modalStoreBalance" class="store-balance">🪙 ${userData.coins}</div></div>
            <div class="store-tabs">
                <div class="store-tab active" onclick="switchStoreTab('ids', this)">أرقام ID 🆔</div>
                <div class="store-tab" onclick="switchStoreTab('avatars', this)">الصور 👤</div>
                <div class="store-tab" onclick="switchStoreTab('frames', this)">الإطارات 🖼️</div>
                <div class="store-tab" onclick="switchStoreTab('gifts', this)">الهدايا 🎁</div>
                <div class="store-tab" onclick="switchStoreTab('reactions', this)">تفاعلات 💬</div>
            </div>
            <div id="storeContent" class="grid-store"></div>
        `;
        switchStoreTab('ids', document.querySelector('.store-tab.active'));
    }
    else if (type === 'achievements') { 
        title.innerText = "إنجازات اللعبة 🏅"; 
        let content = `<div class="achievements-list">`; 
        achievements.forEach(ach => { 
            let isUnl = userData.points >= ach.reqPoints; 
            content += `
                <div class="ach-card ${isUnl ? 'unlocked' : 'locked'}">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <span class="ach-icon">${ach.icon}</span>
                        <div><b>${ach.name}</b><br><small style="color:#aaa;">${ach.desc}</small></div>
                    </div>
                    <div style="font-size:1.5rem;">${isUnl ? '✅' : '🔒'}</div>
                </div>`; 
        }); 
        body.innerHTML = content + `</div>`; 
    }
    else if (type === 'developer') { title.innerText = "حساب المطور 👨‍💻"; body.innerHTML = `<div style="text-align:center; line-height:2.5;"><p><b>الاسم:</b> Baqer Hamed</p></div>`; } 
    else if (type === 'settings') { title.innerText = "الإعدادات ⚙️"; body.innerHTML = `<div style="text-align:right; line-height:2.5;"><label>صوت الموسيقى 🎵</label><input type="range" min="0" max="100" value="${bgMusic.volume * 100}" oninput="updateMusicVol(this.value)" style="width:100%;"><label>مؤثرات اللعبة 🔊</label><input type="range" min="0" max="100" value="${sfxVolumeVal * 100}" oninput="updateSfxVol(this.value)" style="width:100%;"><button onclick="document.body.classList.toggle('dark-mode'); playSfx('menu');" class="premium-btn primary-btn" style="margin-top:10px;">تغيير الوضع 🌓</button></div>`; }
    else if (type === 'help') { title.innerText = "دليل اللعبة ❓"; body.innerHTML = `<div style="line-height:2; font-size:0.9rem; text-align:justify;"><h3 style="color:var(--primary);">نظام المباريات ⚔️</h3><p>المباراة تتكون من 4 مراحل ولن تبدأ الأونلاين إلا باجتماع لاعبين.</p></div>`; }
    else if (type === 'admin') { title.innerText = "لوحة التحكم 🛠️"; body.innerHTML = `<div style="display:flex; flex-direction:column; gap:10px;"><button class="premium-btn primary-btn" onclick="playSfx('play'); alert('مفعل!')">لوحة الأوامر 💻</button></div>`; }
    else if (type === 'account') { title.innerText = "الحساب 👤"; body.innerHTML = `<div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; line-height:2;"><p>الاسم: <b>${userData.username}</b></p><p>ID: <b style="color:var(--primary)">${userData.playerID}</b></p></div><button class="premium-btn primary-btn" style="margin-top:15px;" onclick="promptNameChange()">تغيير الاسم</button>`; }
    else if (type === 'titles') { title.innerText = "الألقاب 🎖️"; let content = `<div class="titles-list" style="display:flex; flex-direction:column; gap:10px;">`; titlesData.forEach(t => { let isUnl = userData.points >= t.req; let bg = isUnl ? "background:rgba(99,102,241,0.2); border:1px solid var(--primary);" : "background:rgba(0,0,0,0.3); opacity:0.6;"; content += `<div style="${bg} padding:15px; border-radius:15px; display:flex; justify-content:space-between;"><div><span style="font-size:1.5rem;">${t.icon}</span> <b>${t.name}</b></div><div>${isUnl ? "مكتسب ✅" : t.req + " 🔒"}</div></div>`; }); body.innerHTML = content + `</div>`; }
}

function promptNameChange() { playSfx('menu'); let today = new Date().toDateString(); if (userData.lastChangeDate !== today) { userData.nameChangesToday = 0; userData.lastChangeDate = today; } if (userData.nameChangesToday >= 2) { alert("⚠️ استنفدت الحد اليومي لتغيير الاسم!"); return; } let newName = prompt("أدخل الاسم الجديد:"); if (newName && newName.trim().length >= 3) { userData.username = newName.trim(); userData.nameChangesToday++; updateGlobalUI(); openModal('account'); } }
function closeModal() { playSfx('menu'); document.getElementById('modalOverlay').style.display = 'none'; }
document.getElementById('modalOverlay').onclick = function(e) { if(e.target === this) closeModal(); };

// ==========================================
// 6. بنك الأسئلة والمباريات الأونلاين
// ==========================================
let qDB = {
    A: [ { q: "ما هي عاصمة العراق؟", a: ["البصرة", "بغداد", "أربيل"], c: 1 }, { q: "ما هو الكوكب الأحمر؟", a: ["الزهرة", "المشتري", "المريخ"], c: 2 } ],
    B: [ { img: "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=300", q: "أين يقع هذا المعلم؟", a: ["لندن", "باريس", "برلين"], c: 1 } ],
    C: [ { q: "اكتب اسم عاصمة فرنسا:", ans: "باريس" } ],
    D: [ { text: "الأسد حيوان من الثدييات يُلقب بملك الغابة.", q: "بماذا يُلقب الأسد حسب النص؟", a: ["المفترس", "ملك الغابة", "الأسرع"], c: 1 } ]
};
let availableQs = { A:[], B:[], C:[], D:[] };
function getQuestion(stageType) { if(availableQs[stageType].length === 0) availableQs[stageType] = [...qDB[stageType]]; let idx = Math.floor(Math.random() * availableQs[stageType].length); return availableQs[stageType].splice(idx, 1)[0]; }

let matchTimer, matchTimeLeft = 15, currentMatchStage = 0, currentMatchScore = 0, matchMode = 'ai', currentQData = null, matchStarted = false;

function startMatch(mode) {
    playSfx('play'); matchMode = mode; currentMatchStage = 0; currentMatchScore = 0; matchStarted = false;
    document.getElementById('menuIconBtn').style.display = 'none'; document.getElementById('mainScreen').style.display = 'none'; document.getElementById('gameMatchScreen').style.display = 'flex';
    document.getElementById('onlineQuizArea').style.display = 'none'; document.getElementById('waitingArea').style.display = 'flex';

    if(mode === 'online') { document.getElementById('matchPlayersBar').style.display = 'flex'; document.getElementById('waitingText').innerText = "جارٍ الاتصال بالسيرفر..."; joinOnlineRoom(); } 
    else { document.getElementById('matchPlayersBar').style.display = 'none'; document.getElementById('waitingArea').style.display = 'none'; document.getElementById('onlineQuizArea').style.display = 'flex'; loadMatchStage(); }
    updateMatchUI();
}

function joinOnlineRoom() {
    currentRoomRef = database.ref('matches/global_room/players/' + userData.playerID);
    currentRoomRef.set({ name: userData.username, score: 0, avatar: userData.avatar, frame: userData.frame });
    currentRoomRef.onDisconnect().remove();

    database.ref('matches/global_room/players').on('value', (snapshot) => {
        const playersObj = snapshot.val();
        if(!playersObj) return;
        renderOnlinePlayers(playersObj);
        const playerCount = Object.keys(playersObj).length;
        if (playerCount >= 2 && !matchStarted) {
            matchStarted = true; playSfx('correct'); document.getElementById('waitingText').innerText = "اكتمل العدد! المعركة ستبدأ الآن... ⚔️"; document.getElementById('waitingText').style.color = "#10b981";
            setTimeout(() => { document.getElementById('waitingArea').style.display = 'none'; document.getElementById('onlineQuizArea').style.display = 'flex'; loadMatchStage(); }, 2000);
        } else if (playerCount < 2 && !matchStarted) { document.getElementById('waitingText').innerText = "في انتظار دخول لاعب آخر للبدء... (1/2)"; document.getElementById('waitingText').style.color = "white"; }
    });
}

function renderOnlinePlayers(playersObj) {
    let html = "";
    Object.keys(playersObj).forEach(key => {
        let p = playersObj[key]; let isMe = (key === userData.playerID);
        html += `<div class="online-player ${isMe ? 'me' : ''}">
                    <div style="padding:4px; border-radius:50%; background:${p.frame || 'transparent'}; margin-bottom:5px; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
                        <img src="${p.avatar}" style="width:35px; height:35px; border-radius:50%; display:block; object-fit:cover; border:2px solid #222;">
                    </div>
                    <span>${isMe ? 'أنت' : p.name}</span><span class="score-badge">${p.score}</span>
                 </div>`;
    });
    document.getElementById('matchPlayersBar').innerHTML = html;
}

function loadMatchStage() {
    clearInterval(matchTimer); matchTimeLeft = 15;
    if(currentMatchStage >= 4) { endMatch(); return; }
    const stages = ['A', 'B', 'C', 'D']; const currentType = stages[currentMatchStage]; currentQData = getQuestion(currentType);
    document.getElementById('stageIndicator').innerText = `المرحلة ${currentType}`; document.getElementById('qImageContainer').style.display = 'none'; document.getElementById('qTextContainer').style.display = 'none'; document.getElementById('matchOptionsContainer
