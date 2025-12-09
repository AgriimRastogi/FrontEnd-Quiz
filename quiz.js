let questions = [];
let index = 0;
let score =  0;

const quizBox      = document.getElementById("quiz-box");
const qText        = document.getElementById("q-text");
const optionsBox   = document.getElementById("options");
const explanation  = document.getElementById("explanation");
const nextBtn      = document.getElementById("nextBtn");
const progressBar  = document.getElementById("progress");
const scoreBox     = document.getElementById("scoreBox");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn   = document.getElementById("restart");
const soundToggle  = document.getElementById("soundToggle");

let audioCtx = null;
let soundEnabled = true;

/* ================= SOUND TOGGLE ================= */
soundToggle.onclick = () =>{
    soundEnabled = !soundEnabled;
    soundToggle.innerText = soundEnabled ? "🔊" : "🔇";
};

/* ================= SOUND ENGINE ================= */
function getAudioCtx(){
    if (!audioCtx){
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}
function playBeep(freq, duration, type="sine", volume=0.25){
    if(!soundEnabled) return;
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
    playBeep(880,0.15);
    setTimeout(()=>playBeep(1320,0.18),120);
}
function playWrongSound(){
    playBeep(220,0.28,"square",0.30);
}

/* ================= LOAD QUESTIONS (WITH SHUFFLE) ================= */
async function loadQuestions(){
    try{
        const res = await fetch("questions.json");
        questions = await res.json();

        if(!Array.isArray(questions) || questions.length === 0){
            qText.innerText = "No questions found.";
            return;
        }

        // 🔥 SHUFFLE QUESTIONS HERE
        questions.sort(() => Math.random() - 0.5);

        renderQuestion();
        initParticles();
    }catch(err){
        qText.innerText = "Error loading questions.json";
    }
}

/* ================= RENDER QUESTION ================= */
function renderQuestion(){
    const q = questions[index];

    qText.innerText = q.question;
    optionsBox.innerHTML = "";
    explanation.style.display = "none";
    nextBtn.style.display = "none";

    progressBar.style.width = (index/questions.length)*100 + "%";

    q.options.forEach((text,i)=>{
        const opt = document.createElement("div");
        opt.className = "option";
        opt.innerText = text;

        opt.onmousemove = e =>{
            const r = opt.getBoundingClientRect();
            opt.style.setProperty("--x", e.clientX-r.left+"px");
            opt.style.setProperty("--y", e.clientY-r.top +"px");
        };

        opt.onmouseenter=()=>opt.classList.add("hover-active");
        opt.onmouseleave=()=>opt.classList.remove("hover-active");

        opt.onclick=e=>checkAnswer(i,opt,q,e);
        optionsBox.appendChild(opt);
    });
}

/* ================= CHECK ANSWER ================= */
function checkAnswer(selectedIndex, clickedEl, q, event){
    disableOptions();
    triggerCardWobble();
    createRippleTrails(clickedEl,event);

    const correctEl=document.querySelectorAll(".option")[q.answerIndex];

    if(selectedIndex===q.answerIndex){
        clickedEl.classList.add("correct");
        score++;
        confetti(false);
        playCorrectSound();
    }else{
        clickedEl.classList.add("wrong");
        correctEl.classList.add("correct");
        playWrongSound();
    }

    clickedEl.classList.add("goo-bounce");

    explanation.innerText=q.explanation||"";
    explanation.style.display="block";
    nextBtn.style.display="inline-block";
}

function disableOptions(){
    document.querySelectorAll(".option").forEach(o=>o.style.pointerEvents="none");
}

/* ================= ANIMATIONS ================= */
function triggerCardWobble(){
    quizBox.classList.remove("wobble-card");
    void quizBox.offsetWidth; // restart animation
    quizBox.classList.add("wobble-card");
}
function createRippleTrails(opt,e){
    const r=opt.getBoundingClientRect();
    const x=e.clientX-r.left;
    const y=e.clientY-r.top;

    for(let i=0;i<3;i++){
        const wave=document.createElement("div");
        wave.className="option-ripple";
        wave.style.left=x+"px";
        wave.style.top =y+"px";
        wave.style.animationDelay=(i*0.08)+"s";
        opt.appendChild(wave);
        setTimeout(()=>wave.remove(),800);
    }
}

/* ================= NEXT / FINISH ================= */
nextBtn.onclick=()=>{
    index++;
    if(index>=questions.length) return finishQuiz();
    renderQuestion();
};

function finishQuiz(){
    progressBar.style.width="100%";
    quizBox.style.display="none";
    scoreBox.style.display="block";

    const pct=Math.round((score/questions.length)*100);
    finalScoreEl.innerText=`Score: ${score}/${questions.length} (${pct}%)`;
    confetti(true);
}

/* ================= CONFETTI ================= */
function confetti(big){
    const amount=big?45:18;
    for(let i=0;i<amount;i++){
        const p=document.createElement("div");
        p.style.cssText=`
            position:fixed;width:8px;height:8px;
            background:hsl(${Math.random()*360},100%,60%);
            top:${innerHeight/2}px;left:${innerWidth/2}px;
            transform:translate(-50%,-50%);
            border-radius:2px;z-index:9999;`;
        document.body.appendChild(p);
        setTimeout(()=>{
            p.style.transition="1.4s cubic-bezier(.2,.82,.22,1)";
            p.style.transform=`translate(${Math.random()*600-300}px,${Math.random()*600-300}px) rotate(${Math.random()*720}deg)`;
            p.style.opacity="0";
        },10);
        setTimeout(()=>p.remove(),1600);
    }
}

/* ================= PARTICLES ================= */
function initParticles(){
    const c=document.getElementById("particles"),x=c.getContext("2d");
    let P=[];
    function resize(){
        c.width=innerWidth;c.height=innerHeight;P=[];
        for(let i=0;i<100;i++)P.push({x:Math.random()*c.width,y:Math.random()*c.height,s:1+Math.random()*3,v:.2+Math.random()});
    }
    function loop(){
        x.clearRect(0,0,c.width,c.height);
        P.forEach(p=>{
            x.fillStyle="#00ffe588";
            x.beginPath();x.arc(p.x,p.y,p.s,0,6.28);x.fill();
            p.y+=p.v;if(p.y>c.height)p.y=-10;
        });
        requestAnimationFrame(loop);
    }
    resize();loop();window.addEventListener("resize",resize);
}

restartBtn.onclick=()=>location.reload();
loadQuestions();

