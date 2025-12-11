// GSAPプラグインの登録
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ============================================
// 1. Lenis (慣性スクロール) の設定
// これを入れるだけで「ルミネ」のような高級感が出ます
// ============================================
let lenis; // グローバル変数化

function initLenis() {
    // モバイル以外のみ慣性スクロールを有効にする場合
    if (window.innerWidth > 768) {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            smooth: true,
        });

        // GSAPのTickerと同期（必須）
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }
}

// ============================================
// 2. ローディングアニメーション
// (いただいたコードをベースに調整)
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    initLenis(); // Lenis初期化

    const loader = document.getElementById("loader");
    const body = document.body;
    
    if (loader) {
        body.classList.add("loading");
        
        window.addEventListener("load", () => {
            const animationDuration = 2000;
            const maxDelay = 270;
            const totalWaitTime = animationDuration + maxDelay - 500; 
            
            setTimeout(() => {
                const loadingBars = loader.querySelectorAll(".loading-bar");
                const loadingContainer = loader.querySelector(".loading-container");
                
                // アニメーション停止処理
                loadingBars.forEach((bar) => {
                    bar.style.animation = "none";
                    bar.style.transform = "translateX(0) scaleY(1)";
                    bar.style.opacity = "1";
                });
                
                if (loadingContainer) {
                    loadingContainer.style.transform = "translate(0, 0)";
                }
                
                requestAnimationFrame(() => {
                    gsap.to(loader, {
                        opacity: 0,
                        duration: 1.0, 
                        ease: "power2.inOut",
                        onComplete: () => {
                            loader.classList.add("hidden");
                            loader.style.display = "none"; // 完全に消す
                            body.classList.remove("loading");
                                
                            // メインコンテンツのフェードイン開始
                            setTimeout(() => {
                                revealSiteContent();
                            }, 100);
                        }
                    });
                });
            }, totalWaitTime);
        });
    } else {
        window.addEventListener("load", () => {
            revealSiteContent();
        });
    }
});

// サイト表示時の演出
function revealSiteContent() {
    const heroTitle = document.querySelector(".hero-title");
    const scrollIndicator = document.querySelector(".scroll-indicator");
    const footer = document.getElementById("footer");
    
    // ヒーロータイトルなどをふわっと表示
    gsap.to([heroTitle, scrollIndicator, footer], {
        opacity: 1,
        y: 0, // CSSで translateY(50px) などを設定しておくと下から浮き上がります
        duration: 1.5,
        ease: "power3.out",
        stagger: 0.2, // 順番に表示
        onComplete: () => {
            initMainAnimations(); // アニメーション開始
        }
    });
}


// ============================================
// 3. メインアニメーション初期化 (PC / Mobile分岐)
// ScrollTrigger.matchMedia を使うのが最も現代的でバグが少ない方法です
// ============================================
function initMainAnimations() {
    
    ScrollTrigger.matchMedia({
        
        // ------------------------------------------------
        // PC表示 (769px以上)
        // ------------------------------------------------
        "(min-width: 769px)": function() {
            const track = document.getElementById("horizontal-track");
            const content = document.querySelector(".horizontal-content");
            const arrow = document.querySelector('.horizontal-scroll-indicator');

            // (A) 横スクロールのメイン処理
            const scrollAmount = content.offsetWidth - window.innerWidth;
            
            const scrollTween = gsap.to(content, {
                x: -scrollAmount, 
                ease: "none", // 慣性はLenisに任せる
                scrollTrigger: {
                    trigger: "#horizontal-track",
                    pin: true,
                    start: "top top",
                    end: "+=" + scrollAmount,
                    scrub: 1, // 少し遅れて追従する滑らかさ
                    invalidateOnRefresh: true,
                    anticipatePin: 1,
                    onUpdate: (self) => {
                        // 矢印のフェードアウト
                        if(arrow) arrow.style.opacity = 1 - self.progress * 2;
                    }
                }
            });

            // (B) 重要な改善点：containerAnimationを使ったフェードイン
            // 以前の getBoundingClientRect ループより圧倒的に軽いです
            const fadeElements = document.querySelectorAll('.item-intro, .item-work, .item-services, .item-blog, .item-profile, .item-contact');
            
            fadeElements.forEach((el) => {
                // 初期状態セット
                gsap.set(el, { opacity: 0, y: 50 });

                gsap.to(el, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: el,
                        containerAnimation: scrollTween, // ★ここが重要！横スクロールと連動
                        start: "left 80%", // 画面の80%の位置に来たら
                        toggleActions: "play none none reverse"
                    }
                });
            });

            // (C) ルミネ風パララックス（画像の奥行き）
            // 画像(.work-img)を、親要素の移動よりも「逆方向」や「遅く」動かす
            const parallaxImages = document.querySelectorAll(".work-img, .profile-img");
            parallaxImages.forEach((img) => {
                gsap.to(img, {
                    x: 200, // 画像を右へ動かす（コンテンツは左へ行くので、視差が生まれる）
                    ease: "none",
                    scrollTrigger: {
                        trigger: img,
                        containerAnimation: scrollTween, // ★ここも連動
                        start: "left right", // 画面右端に入ったら
                        end: "right left",   // 画面左端へ消えたら
                        scrub: true // 常にスクロール位置と同期
                    }
                });
            });

            // (D) SCROLLボタンの挙動
            const scrollIndicator = document.querySelector(".scroll-indicator");
            if (scrollIndicator) {
                scrollIndicator.onclick = () => {
                    // Lenisを使っている場合はlenis.scrollToを使うのがベスト
                    if(lenis) {
                        lenis.scrollTo('#horizontal-track');
                    } else {
                        window.scrollTo({ top: track.offsetTop, behavior: 'smooth' });
                    }
                };
            }
        },

        // ------------------------------------------------
        // スマホ表示 (768px以下)
        // ------------------------------------------------
        "(max-width: 768px)": function() {
            // シンプルな縦スクロールフェードイン
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
