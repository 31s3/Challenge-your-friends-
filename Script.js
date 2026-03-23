// ==========================================
// 1. إعدادات السيرفر (Firebase Configuration)
// ==========================================
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
// 2. بيانات اللاعب والصوتيات
// ==========================================
let userData = { 
    username: "Baqer Hamed", 
    playerID: "ID_" + Math.floor(Math.random() * 900000 + 100000),
    coins: 5000, points: 12450, nameChangesToday: 0, lastChangeDate: new Date().toDateString()
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
// 3. بنك الأسئلة والمراحل
// ==========================================
let qDB = {
    A: [ { q: "ما هي عاصمة العراق؟", a: ["البصرة", "بغداد", "أربيل"], c: 1 }, { q: "ما هو الكوكب الأحمر؟", a: ["الزهرة", "المشتري", "المريخ"], c: 2 }, { q: "أكبر محيط في العالم؟", a: ["الهادئ", "الهندي", "الأطلسي"], c: 0 } ],
    B: [ { img: "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=300", q: "أين يقع هذا المعلم؟", a: ["لندن", "باريس", "برلين"], c: 1 }, { img: "https://images.unsplash.com/photo-1539650116574-1ef250440bf0?w=300", q: "في أي دولة توجد هذه الأهرامات؟", a: ["مصر", "المكسيك", "السودان"], c: 0 } ],
    C: [ { q: "اكتب اسم عاصمة فرنسا:", ans: "باريس" }, { q: "ما هو ناتج 5 مضروباً في 6؟", ans: "30" } ],
    D: [ { text: "الأسد حيوان من الثدييات يُلقب بملك الغابة.", q: "بماذا يُلقب الأسد حسب النص؟", a: ["المفترس", "ملك الغابة", "الأسرع"], c: 1 } ]
};
let availableQs = { A:[], B:[], C:[], D:[] };
function getQuestion(stageType) {
    if(availableQs[stageType].length === 0) availableQs[stageType] = [...qDB[stageType]]; 
    let idx = Math.floor(Math.random() * availableQs[stageType].length);
    return availableQs[stageType].splice(idx, 1)[0];
}

// ==========================================
// 4. الواجهة والنوافذ
// ==========================================
const titlesData = [ { name: "مبتدئ", req: 0, icon: "🥚" }, { name: "هاوي", req: 100, icon: "🥉" }, { name: "محترف", req: 500, icon: "🥈" }, { name: "خبير", req: 1000, icon: "🥇" }, { name: "أسطورة", req: 5000, icon: "💎" }, { name: "ملك الذكاء", req: 10000, icon: "👑" } ];
function getCurrentTitle() { let current = titlesData[0]; for (let i = 0; i < titlesData.length; i++) if (userData.points >= titlesData[i].req) current = titlesData[i]; return current; }

function updateGlobalUI() {
    document.getElementById('coinsDisplay').innerText = userData.coins;
    document.getElementById('pointsDisplay').innerText = userData.points;
    let currentTitle = getCurrentTitle();
    document.getElementById('sideUsername').innerHTML = `${userData.username} <br><small style="color:var(--primary); font-size:0.8rem; font-weight:bold;">[${currentTitle.icon} ${currentTitle.name}]</small>`;
    document.getElementById('sideID').innerText = userData.playerID;
}

const achievements = []; for(let i = 1; i <= 30; i++) achievements.push({ id: i, name: `تحدي المستوى ${i}`, desc: `احصل على ${i * 100} نقطة إنجاز`, reqPoints: i * 100 });

function toggleMenu(e) { if(e) e.stopPropagation(); playSfx('menu'); const menu = document.getElementById('sideMenu'); const overlay = document.getElementById('sidebarOverlay'); menu.classList.toggle('active'); overlay.style.display = menu.classList.contains('active') ? 'block' : 'none'; }
function closeSidebarOutside(e) { const menu = document.getElementById('sideMenu'); if (menu.classList.contains('active')) { menu.classList.remove('active'); document.getElementById('sidebarOverlay').style.display = 'none'; } }

function openModal(type) {
    playSfx('menu'); const title = document.getElementById('modalTitle'); const body = document.getElementById('modalBody'); document.getElementById('modalOverlay').style.display = 'flex';
    if(document.getElementById('sideMenu').classList.contains('active')) { document.getElementById('sideMenu').classList.remove('active'); document.getElementById('sidebarOverlay').style.display = 'none'; }

    if (type === 'developer') { title.innerText = "حساب المطور 👨‍💻"; body.innerHTML = `<div style="text-align:center; line-height:2.5;"><p><b>الاسم:</b> Baqer Hamed</p></div>`; } 
    else if (type === 'achievements') { title.innerText = "إنجازات اللعبة 🏅"; let content = `<div class="achievements-list">`; achievements.forEach(ach => { let isUnl = userData.points >= ach.reqPoints; content += `<div class="ach-card ${isUnl ? 'unlocked' : 'locked'}"><div><b>${ach.name}</b><br><small style="color:#aaa;">${ach.desc}</small></div><div style="font-size:1.5rem;">${isUnl ? '🏆' : '🔒'}</div></div>`; }); body.innerHTML = content + `</div>`; }
    else if (type === 'settings') { title.innerText = "الإعدادات ⚙️"; body.innerHTML = `<div style="text-align:right; line-height:2.5;"><label>صوت الموسيقى 🎵</label><input type="range" min="0" max="100" value="${bgMusic.volume * 100}" oninput="updateMusicVol(this.value)" style="width:100%;"><label>مؤثرات اللعبة 🔊</label><input type="range" min="0" max="100" value="${sfxVolumeVal * 100}" oninput="updateSfxVol(this.value)" style="width:100%;"><button onclick="document.body.classList.toggle('dark-mode'); playSfx('menu');" class="premium-btn primary-btn" style="margin-top:10px;">تغيير الوضع 🌓</button></div>`; }
    else if (type === 'help') { title.innerText = "دليل اللعبة ❓"; body.innerHTML = `<div style="line-height:2; font-size:0.9rem; text-align:justify;"><h3 style="color:var(--primary);">نظام المباريات ⚔️</h3><p>المباراة تتكون من 4 مراحل ولن تبدأ الأونلاين إلا باجتماع لاعبين.</p></div>`; }
    else if (type === 'admin') { title.innerText = "لوحة التحكم 🛠️"; body.innerHTML = `<div style="display:flex; flex-direction:column; gap:10px;"><button class="premium-btn primary-btn" onclick="playSfx('play'); alert('مفعل!')">لوحة الأوامر 💻</button></div>`; }
    else if (type === 'account') { title.innerText = "الحساب 👤"; body.innerHTML = `<div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:15px; line-height:2;"><p>الاسم: <b>${userData.username}</b></p><p>ID: <b style="color:var(--primary)">${userData.playerID}</b></p></div><button class="premium-btn primary-btn" style="margin-top:15px;" onclick="promptNameChange()">تغيير الاسم</button>`; }
    else if (type === 'store') { title.innerText = "المتجر الملكي 🛒"; let content = `<p style="text-align:center;">رصيدك: 🪙 <b style="color:gold;">${userData.coins}</b></p><div class="grid-store">`; for(let i=0; i<20; i++) { let randID = Math.floor(Math.random() * 89999) + 1000; content += `<div class="store-item"><h3 style="color:var(--primary); margin:0 0 10px 0;">🆔 ${randID}</h3><button class="buy-btn" onclick="playSfx('play'); alert('تم شراء ${randID}')">💰 500</button></div>`; } body.innerHTML = content + `</div>`; }
    else if (type === 'titles') { title.innerText = "الألقاب 🎖️"; let content = `<div class="titles-list" style="display:flex; flex-direction:column; gap:10px;">`; titlesData.forEach(t => { let isUnl = userData.points >= t.req; let bg = isUnl ? "background:rgba(99,102,241,0.2); border:1px solid var(--primary);" : "background:rgba(0,0,0,0.3); opacity:0.6;"; content += `<div style="${bg} padding:15px; border-radius:15px; display:flex; justify-content:space-between;"><div><span style="font-size:1.5rem;">${t.icon}</span> <b>${t.name}</b></div><div>${isUnl ? "مكتسب ✅" : t.req + " 🔒"}</div></div>`; }); body.innerHTML = content + `</div>`; }
}

function promptNameChange() {
    playSfx('menu'); let today = new Date().toDateString();
    if (userData.lastChangeDate !== today) { userData.nameChangesToday = 0; userData.lastChangeDate = today; }
    if (userData.nameChangesToday >= 2) { alert("⚠️ استنفدت الحد اليومي لتغيير الاسم!"); return; }
    let newName = prompt("أدخل الاسم الجديد:");
    if (newName && newName.trim().length >= 3) { userData.username = newName.trim(); userData.nameChangesToday++; updateGlobalUI(); openModal('account'); }
}

function closeModal() { playSfx('menu'); document.getElementById('modalOverlay').style.display = 'none'; }
document.getElementById('modalOverlay').onclick = function(e) { if(e.target === this) closeModal(); };

// ==========================================
// 5. نظام غرفة الانتظار والمباريات
// ==========================================
let matchTimer, matchTimeLeft = 15;
let currentMatchStage = 0; 
let currentMatchScore = 0;
let matchMode = 'ai'; 
let currentQData = null;
let matchStarted = false;

function startMatch(mode) {
    playSfx('play'); matchMode = mode; currentMatchStage = 0; currentMatchScore = 0; matchStarted = false;
    
    document.getElementById('menuIconBtn').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('gameMatchScreen').style.display = 'flex';
    
    document.getElementById('onlineQuizArea').style.display = 'none';
    document.getElementById('waitingArea').style.display = 'flex';

    if(mode === 'online') {
        document.getElementById('matchPlayersBar').style.display = 'flex';
        document.getElementById('waitingText').innerText = "جارٍ الاتصال بالسيرفر...";
        joinOnlineRoom();
    } else {
        document.getElementById('matchPlayersBar').style.display = 'none';
        document.getElementById('waitingArea').style.display = 'none';
        document.getElementById('onlineQuizArea').style.display = 'flex';
        loadMatchStage();
    }
    updateMatchUI();
}

function joinOnlineRoom() {
    currentRoomRef = database.ref('matches/global_room/players/' + userData.playerID);
    currentRoomRef.set({ name: userData.username, score: 0 });
    currentRoomRef.onDisconnect().remove();

    database.ref('matches/global_room/players').on('value', (snapshot) => {
        const playersObj = snapshot.val();
        if(!playersObj) return;

        renderOnlinePlayers(playersObj);
        const playerCount = Object.keys(playersObj).length;
        
        if (playerCount >= 2 && !matchStarted) {
            matchStarted = true;
            playSfx('correct');
            document.getElementById('waitingText').innerText = "اكتمل العدد! المعركة ستبدأ الآن... ⚔️";
            document.getElementById('waitingText').style.color = "#10b981";
            
            setTimeout(() => {
                document.getElementById('waitingArea').style.display = 'none';
                document.getElementById('onlineQuizArea').style.display = 'flex';
                loadMatchStage();
            }, 2000);
            
        } else if (playerCount < 2 && !matchStarted) {
            document.getElementById('waitingText').innerText = "في انتظار دخول لاعب آخر للبدء... (1/2)";
            document.getElementById('waitingText').style.color = "white";
        }
    });
}

function renderOnlinePlayers(playersObj) {
    let html = "";
    Object.keys(playersObj).forEach(key => {
        let p = playersObj[key]; let isMe = (key === userData.playerID);
        html += `<div class="online-player ${isMe ? 'me' : ''}"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}"><span>${isMe ? 'أنت' : p.name}</span><span class="score-badge">${p.score}</span></div>`;
    });
    document.getElementById('matchPlayersBar').innerHTML = html;
}

function loadMatchStage() {
    clearInterval(matchTimer); matchTimeLeft = 15;
    if(currentMatchStage >= 4) { endMatch(); return; }

    const stages = ['A', 'B', 'C', 'D'];
    const currentType = stages[currentMatchStage];
    currentQData = getQuestion(currentType);

    document.getElementById('stageIndicator').innerText = `المرحلة ${currentType}`;
    document.getElementById('qImageContainer').style.display = 'none';
    document.getElementById('qTextContainer').style.display = 'none';
    document.getElementById('matchOptionsContainer').style.display = 'none';
    document.getElementById('matchInputContainer').style.display = 'none';
    document.getElementById('manualInputAnswer').value = ""; 
    document.getElementById('matchQuestionText').innerText = currentQData.q;

    if(currentType === 'A') { renderOptions(currentQData.a, currentQData.c); } 
    else if(currentType === 'B') { document.getElementById('qImageContainer').style.display = 'block'; document.getElementById('qImage').src = currentQData.img; renderOptions(currentQData.a, currentQData.c); }
    else if(currentType === 'C') { document.getElementById('matchInputContainer').style.display = 'block'; document.getElementById('manualInputAnswer').focus(); }
    else if(currentType === 'D') { document.getElementById('qTextContainer').style.display = 'block'; document.getElementById('qParagraph').innerText = currentQData.text; renderOptions(currentQData.a, currentQData.c); }

    const progress = document.getElementById('matchProgress'); progress.style.width = "100%";
    matchTimer = setInterval(() => {
        matchTimeLeft--; progress.style.width = (matchTimeLeft / 15) * 100 + "%";
        if(matchTimeLeft <= 3 && matchTimeLeft > 0) playSfx('timer');
        if(matchTimeLeft <= 0) { playSfx('wrong'); handleAnswer(false); }
    }, 1000);
}

function renderOptions(arr, correctIdx) {
    const container = document.getElementById('matchOptionsContainer');
    container.style.display = 'grid'; container.innerHTML = "";
    arr.forEach((opt, idx) => {
        let btn = document.createElement('button'); btn.className = "opt-btn"; btn.innerText = opt;
        btn.onclick = () => handleAnswer(idx === correctIdx);
        container.appendChild(btn);
    });
}

function submitManualAnswer() {
    const val = document.getElementById('manualInputAnswer').value.trim();
    if(val === "") return; 
    let isCorrect = val.replace(/[أإآا]/g, "ا") === currentQData.ans.replace(/[أإآا]/g, "ا");
    handleAnswer(isCorrect);
}

function handleAnswer(isCorrect) {
    clearInterval(matchTimer);
    if(isCorrect) {
        playSfx('correct'); currentMatchScore += 25; 
        if(matchMode === 'online' && currentRoomRef) currentRoomRef.update({ score: currentMatchScore });
    } else { playSfx('wrong'); }
    
    updateMatchUI(); currentMatchStage++; loadMatchStage();
}

function updateMatchUI() { document.getElementById('matchScoreDisplay').innerText = `نقاط المباراة: ${currentMatchScore}`; }

function endMatch() {
    if(currentMatchScore === 100) {
        userData.coins += 25; userData.points += 20; playSfx('correct');
        alert("🎉 الف مبروك! لقد فزت بالمباراة! \n+25 عملة 🪙\n+20 نقطة إنجاز 🏆");
    } else { alert(`نهاية المباراة! حصلت على ${currentMatchScore}/100 نقطة. \nحظاً أوفر!`); }
    updateGlobalUI(); exitToMain();
}

function exitToMain() {
    playSfx('menu'); clearInterval(matchTimer);
    document.getElementById('gameMatchScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'flex';
    document.getElementById('menuIconBtn').style.display = 'block'; 
    if(currentRoomRef) { currentRoomRef.remove(); database.ref('matches/global_room/players').off(); }
}

updateGlobalUI();
