let questions = [];
let index = 0;
let score = 0;

const quizBox      = document.getElementById("quiz-box");
const qText        = document.getElementById("q-text");
const optionsBox   = document.getElementById("options");
const explanation  = document.getElementById("explanation");
const nextBtn      = document.getElementById("nextBtn");
const progressBar  = document.getElementById("progress");
const scoreBox     = document.getElementById("scoreBox");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn   = document.getElementById("restart");

let audioCtx = null;

function getAudioCtx(){
    if (!audioCtx){
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

/* simple synth sounds */
function playBeep(freq, duration, type="sine", volume=0.2){
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = volume;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
}

function playCorrectSound(){
    playBeep(880, 0.15, "sine", 0.25);
    setTimeout(() => playBeep(1320, 0.18, "sine", 0.22), 120);
}

function playWrongSound(){
    playBeep(220, 0.28, "square", 0.28);
}

/* load questions */
async function loadQuestions(){
    try{
        const res = await fetch("questions.json");
        questions = await res.json();
        if(!Array.isArray(questions) || questions.length === 0){
            qText.innerText = "No questions found in questions.json";
            return;
        }
        renderQuestion();
        initParticles();
    }catch(err){
        console.error(err);
        qText.innerText = "Error loading questions.json";
    }
}

function renderQuestion(){
    const q = questions[index];

    qText.innerText = q.question;
    optionsBox.innerHTML = "";
    explanation.style.display = "none";
    nextBtn.style.display = "none";

    const percent = (index / questions.length) * 100;
    progressBar.style.width = percent + "%";

    q.options.forEach((text, i) => {
        const opt = document.createElement("div");
        opt.className = "option";
        opt.innerText = text;

        // mouse-based ripple origin
        opt.onmousemove = e => {
            const rect = opt.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            opt.style.setProperty("--x", x + "px");
            opt.style.setProperty("--y", y + "px");
        };

        opt.onmouseenter = () => opt.classList.add("hover-active");
        opt.onmouseleave = () => opt.classList.remove("hover-active");

        opt.onclick = e => checkAnswer(i, opt, q, e);
        optionsBox.appendChild(opt);
    });
}

function checkAnswer(selectedIndex, clickedEl, q, event){
    disableOptions();

    const allOptions   = document.querySelectorAll(".option");
    const correctOption = allOptions[q.answerIndex];

    // goo bounce + card wobble
    clickedEl.classList.add("goo-bounce");
    triggerCardWobble();

    // ripple trails (sonic boom)
    createRippleTrails(clickedEl, event);

    if(selectedIndex === q.answerIndex){
        clickedEl.classList.add("correct");
        score++;
        confetti(false);
        playCorrectSound();
    }else{
        clickedEl.classList.add("wrong");
        if(correctOption) correctOption.classList.add("correct");
        playWrongSound();
    }

    explanation.innerText = q.explanation || "";
    explanation.style.display = "block";
    nextBtn.style.display = "inline-block";
}

function disableOptions(){
    document.querySelectorAll(".option").forEach(o => {
        o.style.pointerEvents = "none";
    });
}

/* 3D wobble on card */
function triggerCardWobble(){
    quizBox.classList.remove("wobble-card");
    // force reflow to restart animation
    void quizBox.offsetWidth;
    quizBox.classList.add("wobble-card");
}

/* ripple trails from click position */
function createRippleTrails(opt, e){
    const rect = opt.getBoundingClientRect();
    const baseX = e.clientX - rect.left;
    const baseY = e.clientY - rect.top;

    for(let i = 0; i < 3; i++){
        const r = document.createElement("div");
        r.className = "option-ripple";
        r.style.left = baseX + "px";
        r.style.top  = baseY + "px";
        r.style.animationDelay = (i * 0.08) + "s";
        opt.appendChild(r);
        setTimeout(() => r.remove(), 800);
    }
}

nextBtn.onclick = () => {
    index++;
    if(index >= questions.length){
        finishQuiz();
    }else{
        renderQuestion();
    }
};

function finishQuiz(){
    progressBar.style.width = "100%";
    quizBox.style.display = "none";
    scoreBox.style.display = "block";

    const pct = Math.round((score / questions.length) * 100);
    finalScoreEl.innerText = `Score: ${score}/${questions.length} (${pct}%)`;
    confetti(true);
}

restartBtn.onclick = () => {
    location.reload();
};

/******** CONFETTI ********/
function confetti(big){
    const amount = big ? 45 : 18;
    for(let i = 0; i < amount; i++){
        const p = document.createElement("div");
        p.style.cssText = `
            position:fixed;
            width:8px;height:8px;
            background:hsl(${Math.random()*360},100%,60%);
            top:${innerHeight/2}px;
            left:${innerWidth/2}px;
            transform:translate(-50%,-50%);
            border-radius:2px;
            z-index:9999;
        `;
        document.body.appendChild(p);
        setTimeout(() => {
            p.style.transition = "1.4s cubic-bezier(.2,.82,.22,1)";
            p.style.transform = `translate(${Math.random()*600-300}px,${Math.random()*600-300}px) rotate(${Math.random()*720}deg)`;
            p.style.opacity = "0";
        }, 10);
        setTimeout(() => p.remove(), 1600);
    }
}

/******** PARTICLE BACKGROUND ********/
function initParticles(){
    const canvas = document.getElementById("particles");
    const ctx = canvas.getContext("2d");
    let particles = [];

    function resize(){
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        particles = [];
        for(let i = 0; i < 100; i++){
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                s: 1 + Math.random() * 3,
                v: 0.2 + Math.random() * 1
            });
        }
    }

    function loop(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.forEach(p => {
            ctx.fillStyle = "#00ffe588";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
            ctx.fill();
            p.y += p.v;
            if(p.y > canvas.height) p.y = -10;
        });
        requestAnimationFrame(loop);
    }

    resize();
    loop();
    window.addEventListener("resize", resize);
}

loadQuestions();
