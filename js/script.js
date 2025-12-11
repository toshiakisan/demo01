// ============================================
// 安全装置付き script.js
// ============================================

// エラーが起きても強制的にローディングを消すための保険
window.onerror = function() {
    const loader = document.getElementById("loader");
    const body = document.body;
    if(loader) {
        loader.style.display = 'none';
        body.classList.remove("loading");
    }
};

// GSAPプラグインの登録（安全確認付き）
if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
} else {
    console.error("GSAP or ScrollTrigger is not loaded!");
}

// ============================================
// 1. Lenis (慣性スクロール) の設定
// ============================================
let lenis;

function initLenis() {
    // ライブラリが読み込まれていない場合はスキップ
    if (typeof Lenis === "undefined") {
        console.warn("Lenis library is not loaded. Skipping smooth scroll.");
        return;
    }

    if (window.innerWidth > 768) {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            smooth: true,
        });

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }
}

// ============================================
// 2. ローディングアニメーション制御
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    // Lenis初期化を試みる
    try {
        initLenis();
    } catch (e) {
        console.error("Lenis init error:", e);
    }

    const loader = document.getElementById("loader");
    const body = document.body;
    
    if (loader) {
        body.classList.add("loading");
        
        // 読み込み完了時
        window.addEventListener("load", () => {
            const animationDuration = 2000;
            const maxDelay = 270;
            const totalWaitTime = animationDuration + maxDelay - 500; 
            
            setTimeout(() => {
                const loadingBars = loader.querySelectorAll(".loading-bar");
                const loadingContainer = loader.querySelector(".loading-container");
                
                // アニメーション停止処理
                if(loadingBars) {
                    loadingBars.forEach((bar) => {
                        bar.style.animation = "none";
                        bar.style.transform = "translateX(0) scaleY(1)";
                        bar.style.opacity = "1";
                    });
                }
                
                if (loadingContainer) {
                    loadingContainer.style.transform = "translate(0, 0)";
                }
                
                requestAnimationFrame(() => {
                    // GSAPが使えるか確認してフェードアウト
                    if (typeof gsap !== "undefined") {
                        gsap.to(loader, {
                            opacity: 0,
                            duration: 1.0, 
                            ease: "power2.inOut",
                            onComplete: () => {
                                finalizeLoading(loader, body);
                            }
                        });
                    } else {
                        // GSAPがない場合は即座に消す（CSSで対応）
                        loader.style.opacity = 0;
                        loader.style.transition = "opacity 1s";
                        setTimeout(() => { finalizeLoading(loader, body); }, 1000);
                    }
                });
            }, totalWaitTime);
        });
    } else {
        // ローダーがない場合
        window.addEventListener("load", () => {
            revealSiteContent();
        });
    }
});

// ローディング完了後の共通処理
function finalizeLoading(loader, body) {
    loader.classList.add("hidden");
    loader.style.display = "none"; 
    body.classList.remove("loading");
    
    // コンテンツ表示開始
    setTimeout(() => {
        revealSiteContent();
    }, 100);
}

// サイト表示時の演出
function revealSiteContent() {
    const heroTitle = document.querySelector(".hero-title");
    const scrollIndicator = document.querySelector(".scroll-indicator");
    const footer = document.getElementById("footer");
    
    // GSAPがなければそのまま表示して終了
    if (typeof gsap === "undefined") {
        if(heroTitle) heroTitle.style.opacity = 1;
        if(scrollIndicator) scrollIndicator.style.opacity = 1;
        if(footer) footer.style.opacity = 1;
        return;
    }

    // 要素が存在するか確認してからアニメーション
    const targets = [heroTitle, scrollIndicator, footer].filter(el => el !== null);
    
    gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: "power3.out",
        stagger: 0.2,
        onComplete: () => {
            initMainAnimations();
        }
    });
}


// ============================================
// 3. メインアニメーション初期化
// ============================================
function initMainAnimations() {
    if (typeof ScrollTrigger === "undefined") return;

    ScrollTrigger.matchMedia({
        // PC表示 (769px以上)
        "(min-width: 769px)": function() {
            const track = document.getElementById("horizontal-track");
            const content = document.querySelector(".horizontal-content");
            const arrow = document.querySelector('.horizontal-scroll-indicator');

            // 要素が見つからなければ終了
            if (!track || !content) return;

            // コンテンツ幅の計算（offsetWidthよりscrollWidthの方が安全な場合がある）
            const contentWidth = content.scrollWidth;
            const scrollAmount = contentWidth - window.innerWidth;
            
            const scrollTween = gsap.to(content, {
                x: -scrollAmount, 
                ease: "none",
                scrollTrigger: {
                    trigger: "#horizontal-track",
                    pin: true,
                    start: "top top",
                    end: "+=" + scrollAmount,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    anticipatePin: 1,
                    onUpdate: (self) => {
                        if(arrow) arrow.style.opacity = 1 - self.progress * 2;
                    }
                }
            });

            // フェードインアニメーション
            const fadeElements = document.querySelectorAll('.item-intro, .item-work, .item-services, .item-blog, .item-profile, .item-contact');
            
            fadeElements.forEach((el) => {
                gsap.set(el, { opacity: 0, y: 50 }); // 初期状態を確実にセット

                gsap.to(el, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: el,
                        containerAnimation: scrollTween,
                        start: "left 80%", 
                        toggleActions: "play none none reverse"
                    }
                });
            });

            // パララックス（画像）
            const parallaxImages = document.querySelectorAll(".work-img, .profile-img");
            parallaxImages.forEach((img) => {
                gsap.to(img, {
                    x: 200, 
                    ease: "none",
                    scrollTrigger: {
                        trigger: img,
                        containerAnimation: scrollTween,
                        start: "left right", 
                        end: "right left",
                        scrub: true 
                    }
                });
            });

            // SCROLLボタン
            const scrollIndicator = document.querySelector(".scroll-indicator");
            if (scrollIndicator) {
                scrollIndicator.onclick = () => {
                    if(lenis) {
                        lenis.scrollTo('#horizontal-track');
                    } else {
                        window.scrollTo({ top: track.offsetTop, behavior: 'smooth' });
                    }
                };
            }
        },

        // スマホ表示
        "(max-width: 768px)": function() {
            const fadeElements = document.querySelectorAll('.item-work, .item-services, .item-profile, .item-blog');
            
            fadeElements.forEach((el) => {
                gsap.fromTo(el, 
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1, 
                        y: 0, 
                        duration: 0.8,
                        scrollTrigger: {
                            trigger: el,
                            start: "top 85%"
                        }
                    }
                );
            });
        }
    });
}
