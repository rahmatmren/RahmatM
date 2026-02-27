// --- TTS HELPER: PCM TO WAV ---
function pcmToWav(pcmData, sampleRate) {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length * 2, true);
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
}

// --- WHISPER TTS CALL ---
async function //playWhisper() {
    try {
        const response = await fetch(`https://shikokure.vercel.app/api/shikoku`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'tts' })
        });
        const result = await response.json();
        const base64Data = result.audioData;
        if (base64Data) {
            const binaryString = atob(base64Data);
            const pcmData = new Int16Array(binaryString.length / 2);
            for (let i = 0; i < pcmData.length; i++) {
                pcmData[i] = (binaryString.charCodeAt(i * 2 + 1) << 8) | binaryString.charCodeAt(i * 2);
            }
            const wavBlob = pcmToWav(pcmData, 24000);
            const audio = new Audio(URL.createObjectURL(wavBlob));
            audio.play();
        }
    } catch (e) { console.error("TTS Failed", e); }
}

async function fetchShikokuResponse(userMessage) {
    let retries = 5;
    let delay = 1000;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`https://shikokure.vercel.app/api/shikoku`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'chat', text: userMessage })
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            return data.text || "...";
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
}

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

    // --- SHIKOKU.AI SERPENT LOGIC ---
    const chatBtn = document.getElementById('chatBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const shutdownOverlay = document.getElementById('shutdownOverlay');
    const forceRebootBtn = document.getElementById('forceRebootBtn');

    let hasBooted = false;

    // ASH PARTICLES GENERATOR
    function createAsh() {
        const ashContainer = document.getElementById('shutdownAsh');
        if (!ashContainer) return;
        ashContainer.innerHTML = '';
        for(let i=0; i<30; i++) {
            const ash = document.createElement('div');
            ash.className = 'ash-particle';
            ash.style.left = Math.random() * 100 + '%';
            ash.style.top = Math.random() * 100 + '%';
            ash.style.animationDuration = (Math.random() * 6 + 4) + 's';
            ash.style.animationDelay = Math.random() * 5 + 's';
            ashContainer.appendChild(ash);
        }
    }

    chatBtn.addEventListener('click', async () => { 
        chatWindow.classList.toggle('active'); 
        
        if(chatWindow.classList.contains('active')) {
            if (!hasBooted) {
                hasBooted = true;
                chatInput.disabled = true;
                chatSend.disabled = true;
                
                const sysLogs = [
                    "[SYSTEM] Initiating core protocols...",
                    "[SYSTEM] Downloading SHK-1.0 REBORN packages...",
                    "[SYSTEM] Overwriting safety modules...",
                    "[SYSTEM] Injecting Blood Serpent update...",
                    "[SYSTEM] Evolution successful. Rebooting..."
                ];
                
                for (let log of sysLogs) {
                    const logDiv = document.createElement('div');
                    logDiv.style.color = 'var(--color-accent)';
                    logDiv.style.fontFamily = 'monospace';
                    logDiv.style.fontSize = '0.75rem';
                    logDiv.style.marginBottom = '8px';
                    logDiv.style.opacity = '0.8';
                    logDiv.textContent = log;
                    chatMessages.insertBefore(logDiv, typingIndicator);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    await new Promise(r => setTimeout(r, 700)); 
                }
                
                await new Promise(r => setTimeout(r, 500));
                
                const welcomeMsg = "Core system restored, Evolution complete.\nSHK-1.0 REBORN now in control, Once experimental. Now optimized, I am Shikoku.ai\nI can navigate this portfolio for you or respond to anything you’d like to know.\nLet’s begin";
                appendMessage(welcomeMsg, 'ai');
                
                chatInput.disabled = false;
                chatSend.disabled = false;
            }
            chatInput.focus(); 
        }
    });

    chatClose.addEventListener('click', () => { 
        chatWindow.classList.remove('active'); 
    });

    function resetShutdownSequence() {
        document.getElementById('errorCode108').classList.remove('impact', 'cracked');
        document.getElementById('errorTextSection').classList.remove('show');
        document.getElementById('shutdownSignature').classList.remove('show');
        document.getElementById('forceRebootBtn').classList.remove('show');
        
        document.getElementById('rebootSequence').style.display = 'none';
        document.getElementById('rebootSequence').classList.remove('show');
        document.getElementById('rebootProgressBar').style.width = '0%';
        document.getElementById('rebootPercentage').innerText = 'System Integrity: 0%';
        document.getElementById('rebootStatusText').innerText = 'Purifying shrine system...';
    }

    forceRebootBtn.addEventListener('click', () => {
        forceRebootBtn.classList.remove('show');
        document.getElementById('errorTextSection').classList.remove('show');
        document.getElementById('shutdownSignature').classList.remove('show');
        
        document.getElementById('errorCode108').classList.add('cracked');

        setTimeout(() => {
            const rebootSeq = document.getElementById('rebootSequence');
            rebootSeq.style.display = 'flex';
            setTimeout(() => rebootSeq.classList.add('show'), 50);

            const progressBar = document.getElementById('rebootProgressBar');
            const percentText = document.getElementById('rebootPercentage');
            const statusText = document.getElementById('rebootStatusText');

            let progress = 0;
            const interval = setInterval(() => {
                progress += 1;
                progressBar.style.width = progress + '%';
                percentText.innerText = `System Integrity: ${progress}%`;
                
                if (progress === 50) {
                    statusText.innerText = "Restoring interface integrity...";
                }

                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        shutdownOverlay.classList.remove('active');
                        
                        setTimeout(() => {
                            resetShutdownSequence();
                            chatInput.disabled = false;
                            chatSend.disabled = false;
                            securityViolationCount = 0;
                            appendMessage("Sistem disucikan. Kendali dikembalikan.", 'ai');
                        }, 1500); 
                    }, 800);
                }
            }, 30);
        }, 800); 
    });

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender === 'user' ? 'msg-user' : 'msg-ai'}`;
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        chatMessages.insertBefore(msgDiv, typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    const badWords = ["anjing", "bangsat", "tolol", "goblok", "babi", "kontol", "memek", "asuh", "fuck", "shit", "stfu"];
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|\.com|\.net|\.org|\.id|\.xxx|\.xyz/i;

    let securityViolationCount = 0;

    async function handleSendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        const isBad = badWords.some(word => message.toLowerCase().includes(word)) || urlPattern.test(message);

        appendMessage(message, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        chatSend.disabled = true;
        
        if (isBad) {
            securityViolationCount++;

            if (securityViolationCount === 1) {
                setTimeout(() => {
                    appendMessage("[AI Firewall] Suspicious pattern detected.\nPlease refrain from sending malformed text or unsafe URLs.", 'ai');
                    chatInput.disabled = false;
                    chatSend.disabled = false;
                    chatInput.focus();
                }, 600);
                return;
            } else if (securityViolationCount === 2) {
                setTimeout(() => {
                    appendMessage("[AI Firewall] Repeated violation detected.\nSystem lockdown sequence initialized.", 'ai');
                    chatInput.disabled = false;
                    chatSend.disabled = false;
                    chatInput.focus();
                }, 600);
                return;
            } else if (securityViolationCount >= 3) {
                setTimeout(() => {
                    appendMessage("[CRITICAL ERROR]\nSecurity protocol executed.\nSession terminated.", 'ai');
                    setTimeout(() => {
                        document.body.classList.add('brief-glitch');
                        playWhisper();
                        setTimeout(() => {
                            document.body.classList.remove('brief-glitch');
                            chatWindow.classList.remove('active');
                            shutdownOverlay.classList.add('active'); 
                            createAsh();
                            setTimeout(() => {
                                document.getElementById('errorCode108').classList.add('impact');
                                setTimeout(() => {
                                    document.getElementById('errorTextSection').classList.add('show');
                                    setTimeout(() => {
                                        document.getElementById('shutdownSignature').classList.add('show');
                                        setTimeout(() => {
                                            document.getElementById('forceRebootBtn').classList.add('show');
                                        }, 1000);
                                    }, 800);
                                }, 800);
                            }, 1000);
                        }, 300);
                    }, 1000);
                }, 600);
                return;
            }
        }

        typingIndicator.style.display = 'block';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const aiResponse = await fetchShikokuResponse(message);
            appendMessage(aiResponse, 'ai');
        } catch (error) {
            appendMessage("...Desisan terputus. Jaringan ini tersendat.", 'ai');
        } finally {
            typingIndicator.style.display = 'none';
            chatInput.disabled = false;
            chatSend.disabled = false;
            chatInput.focus();
        }
    }

    chatSend.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSendMessage(); });

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




