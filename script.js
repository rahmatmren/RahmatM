document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smooth: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));

    // INITIALIZE OFUDA TRACKS
    const kanji = ["神", "霊", "符", "封", "滅", "龍", "鬼", "影", "光", "闇", "浄", "护", "界", "阵", "魂", "镜", "狱"];
    function populateOfuda(trackId) {
        const track = document.getElementById(trackId);
        let content = "";
        for(let i=0; i<40; i++) {
            let randomStr = "";
            const len = Math.floor(Math.random() * 3) + 4;
            for(let j=0; j<len; j++) randomStr += kanji[Math.floor(Math.random() * kanji.length)];
            content += `<div class=\"ofuda-item\">${randomStr}</div>`;
        }
        if(track) track.innerHTML = content + content;
    }
    populateOfuda('ofudaTrackLeft');
    populateOfuda('ofudaTrackRight');

    // HOTARU (FIREFLIES) LOGIC
    function initHotaru() {
        const container = document.getElementById('hotaruContainer');
        if(!container) return;
        const count = 30;
        for(let i = 0; i < count; i++) {
            const f = document.createElement('div');
            f.classList.add('firefly');
            container.appendChild(f);
            const x = Math.random() * 100;
            const y = 50 + Math.random() * 50; 
            gsap.set(f, { left: x + '%', top: y + '%', opacity: 0 });
            animateFirefly(f);
        }
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX; const y = e.clientY;
            document.querySelectorAll('.firefly').forEach(f => {
                const rect = f.getBoundingClientRect();
                const dx = rect.left - x; const dy = rect.top - y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 100) {
                    gsap.to(f, { x: "+=" + (dx/dist * 50), y: "+=" + (dy/dist * 50), duration: 0.5, ease: "power2.out" });
                }
            });
        });
    }
    function animateFirefly(el) {
        const duration = 2 + Math.random() * 4;
        gsap.to(el, { x: "random(-100, 100)", y: "random(-50, 50)", opacity: "random(0.3, 0.8)", duration: duration, ease: "sine.inOut", onComplete: () => animateFirefly(el) });
    }
    initHotaru();

    // PROFILE GLOW & 3D TILT
    const profileWrapper = document.querySelector('.about-img-wrapper');
    if (profileWrapper) {
        profileWrapper.addEventListener('mousemove', (e) => {
            const rect = profileWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            profileWrapper.style.setProperty('--x', `${x}px`);
            profileWrapper.style.setProperty('--y', `${y}px`);
            const xPos = (x / rect.width - 0.5); const yPos = (y / rect.height - 0.5);
            gsap.to(profileWrapper, { duration: 0.5, rotationY: xPos * 20, rotationX: -yPos * 20, scale: 1.05, transformPerspective: 1000, ease: "power2.out", overwrite: "auto" });
        });
        profileWrapper.addEventListener('mouseleave', () => {
            gsap.to(profileWrapper, { duration: 1.2, rotationY: 0, rotationX: 0, scale: 1, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
        });
    }

    // --- FEATURE: OMIKUJI ---
    const omikujiBtn = document.getElementById('omikujiBtn');
    const omikujiOverlay = document.getElementById('omikujiOverlay');
    const omikujiPaper = document.getElementById('omikujiPaper');
    const omikujiClose = document.getElementById('omikujiClose');
    const omiLuck = document.getElementById('omiLuck');
    const omiDesc = document.getElementById('omiDesc');
    const omiNote = document.getElementById('omiNote');
    const omiPrompt = document.getElementById('omiPrompt');

    let lastFortuneIndex = -1;
    const fortunes = [
        { luck: "大吉", text: "Kode Anda akan berjalan lancar tanpa bug hari ini. Koneksi stabil.", note: "Status: Optimal / Ping 1ms" },
        { luck: "中吉", text: "Konfigurasi routing Anda sempurna. Tidak ada packet loss hari ini.", note: "Status: 0% Packet Loss" },
        { luck: "小吉", text: "Deploy akan berhasil, namun periksa kembali semicolon Anda.", note: "Status: Stable Build" },
        { luck: "吉", text: "Pikiran Anda jernih. Saat yang tepat mempelajari protokol baru.", note: "Status: Learning Boost" },
        { luck: "末吉", text: "Waspada kabel LAN longgar. Periksa fisik jaringan Anda.", note: "Status: Layer 1 Warning" },
        { luck: "凶", text: "Hati-hati dengan syntax error yang tersembunyi. Teliti kembali.", note: "Status: Debug Required" },
        { luck: "大凶", text: "Sistem kritis. Segera siapkan backup sebelum segalanya runtuh.", note: "Status: Critical Error" }
    ];

    if (omikujiBtn) {
        omikujiBtn.addEventListener('click', () => {
            let randomIndex;
            do { randomIndex = Math.floor(Math.random() * fortunes.length); } while (randomIndex === lastFortuneIndex);
            lastFortuneIndex = randomIndex;
            const randomFortune = fortunes[randomIndex];
            omiLuck.innerText = randomFortune.luck;
            omiDesc.innerText = randomFortune.text;
            omiNote.innerText = randomFortune.note;
            omikujiPaper.classList.remove('is-open');
            omiPrompt.style.opacity = "1";
            omiPrompt.style.visibility = "visible";
            omikujiOverlay.classList.add('active');
        });
    }

    if (omikujiPaper) {
        omikujiPaper.addEventListener('click', (e) => {
            if (!omikujiPaper.classList.contains('is-open')) {
                omikujiPaper.classList.add('is-open');
                omiPrompt.style.opacity = "0";
                omiPrompt.style.visibility = "hidden";
            }
        });
    }
    if (omikujiClose) {
        omikujiClose.addEventListener('click', (e) => {
            e.stopPropagation(); 
            omikujiOverlay.classList.remove('active');
            setTimeout(() => {
                omikujiPaper.classList.remove('is-open');
                omiLuck.innerText = ""; omiDesc.innerText = ""; omiNote.innerText = "";
            }, 600); 
        });
    }

    // LOADER LOGIC
    const holoBar = document.getElementById('holoKanjiBar');
    if (holoBar) {
        holoBar.innerHTML = `<div class=\"holo-wrapper\" id=\"holoWrapper\"><div class=\"holo-group\"><span class=\"holo-furi\">なかの</span><span class=\"holo-main\">中野</span></div><div class=\"holo-group\"><span class=\"holo-furi\">みく</span><span class=\"holo-main\">三玖</span></div></div>`;
    }
    const holoWrapper = document.getElementById('holoWrapper');
    const loaderCounter = document.querySelector('.loader-counter');
    const loadStatus = { count: 0 };
    const introTl = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });
    const loaderTl = gsap.timeline({ onComplete: () => introTl.play() });
    
    loaderTl.to(loadStatus, { 
            count: 100, duration: 5.5, ease: "power2.inOut", 
            onUpdate: () => { 
                const progress = Math.floor(loadStatus.count);
                if(loaderCounter) loaderCounter.innerText = progress.toString().padStart(3, '0'); 
                if(holoWrapper) holoWrapper.style.setProperty('--progress', progress + '%');
            } 
        })
        .to(".loader-bar", { width: "100%", duration: 5.5, ease: "power2.inOut" }, "<")
        .to(".loader-status", { opacity: 0, duration: 0.5 }, "-=0.5")
        .to(".loader-content", { opacity: 0, duration: 0.5 })
        .to(".loader-top", { yPercent: -100, duration: 1.4, ease: "power4.inOut" }, "split")
        .to(".loader-bottom", { yPercent: 100, duration: 1.4, ease: "power4.inOut" }, "split");

    introTl.to(".layer-fog", { opacity: 1, duration: 2.5 }, 0.5)
        .to(".layer-torii", { opacity: 1, y: 0, duration: 2 }, 0.8)
        .to(".hero-separator", { width: "100px", duration: 1.5 }, 1.5)
        .to(".text-reveal span", { y: "0%", opacity: 1, duration: 1.2, stagger: 0.1 }, 1.8)
        .to(".hero-subtitle", { opacity: 1, scale: 1, duration: 1 }, 2.2)
        .call(startTypingLoop, null, "+=1");

    function startTypingLoop() {
        const textElement = document.querySelector(".text-reveal span");
        if (!textElement) return;
        const textToType = "RahmatM";
        let isDeleting = true; let charIndex = textToType.length;
        textElement.classList.add('cursor-active');
        function typeEffect() {
            textElement.textContent = textToType.substring(0, charIndex);
            let typeSpeed = 100;
            if (isDeleting && charIndex === 0) { isDeleting = false; typeSpeed = 800; } 
            else if (!isDeleting && charIndex === textToType.length) { isDeleting = true; typeSpeed = 4000; } 
            else { if (isDeleting) { charIndex--; typeSpeed /= 2; } else { charIndex++; } }
            setTimeout(typeEffect, typeSpeed);
        }
        setTimeout(typeEffect, 3000);
    }

    gsap.to(".layer-torii", { yPercent: 20, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 0 }});
    gsap.to(".layer-bg", { scale: 1.1, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 0 }});

    function typeTextSkill(element, text) {
        element.innerText = ""; let i = 0; let speed = 100; 
        if (element.typingTimeout) clearTimeout(element.typingTimeout);
        function type() { if (i < text.length) { element.innerText += text.charAt(i); i++; element.typingTimeout = setTimeout(type, speed); } }
        type();
    }

    document.querySelectorAll('.skill-card').forEach(card => {
        const level = card.querySelector('.skill-level');
        const targetText = level.getAttribute('data-type');
        const line = card.querySelector('.skill-line');
        if(line) gsap.to(line, { width: line.getAttribute('data-width'), duration: 1.5, scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play reset play reset" }});
        if(level && targetText) ScrollTrigger.create({ trigger: card, start: "top 85%", onEnter: () => typeTextSkill(level, targetText), onLeaveBack: () => { level.innerText = ""; if (level.typingTimeout) clearTimeout(level.typingTimeout); } });
    });

    gsap.from(".about-img-wrapper", { scrollTrigger: { trigger: "#about", start: "top 70%", toggleActions: "play reset play reset" }, x: -50, opacity: 0, rotate: -2, duration: 1.5 });
    gsap.from(".about-text", { scrollTrigger: { trigger: "#about", start: "top 70%", toggleActions: "play reset play reset" }, x: 50, opacity: 0, duration: 1.5, delay: 0.2 });
    document.querySelectorAll('.project-card').forEach((proj, i) => { gsap.from(proj, { scrollTrigger: { trigger: proj, start: "top 90%", toggleActions: "play reset play reset" }, y: 50, opacity: 0, scale: 0.95, duration: 1, delay: i * 0.1 }); });

    document.querySelectorAll('.work-card').forEach((card, i) => { 
        gsap.from(card, { scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play reset play reset" }, y: 50, opacity: 0, duration: 1, delay: i * 0.15 }); 
    });

    const fTl = gsap.timeline({ scrollTrigger: { trigger: ".final-section", start: "center 80%", toggleActions: "play reset play reset" }});
    fTl.fromTo(".find-me-title", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5 })
    .fromTo(".contact-text", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5 }, "-=1")
    .fromTo(".social-icons", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5 }, "-=1")
    .fromTo(".contact-email", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5 }, "-=1")
    .fromTo(".final-credits", { opacity: 0 }, { opacity: 1, duration: 2 }, "-=1");

});