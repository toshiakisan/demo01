// GSAPプラグインの登録
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// モバイル判定関数
function isMobile() {
    return window.innerWidth <= 768;
}

// ============================================
// ローディングアニメーション
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("loader");
    const body = document.body;
    
    if (loader) {
        // bodyにloadingクラスを追加（スクロール無効化）
        body.classList.add("loading");
        
        // ページ読み込み完了を待つ
        window.addEventListener("load", () => {
            // アニメーションが2回ループするまで待つ
            // アニメーションは1秒×2回 = 2秒、最後のバーの遅延は0.27秒
            // 合計で約2.27秒待機（少し早めるため2秒に短縮）
            const animationDuration = 2000; // 2秒（1秒×2回）
            const maxDelay = 270; // 最後のバーの遅延（0.27秒）
            const totalWaitTime = animationDuration + maxDelay - 500; // 500ms早める
            
            setTimeout(() => {
                // フェードアウト前にアニメーションを完全に停止して位置を固定
                const loadingBars = loader.querySelectorAll(".loading-bar");
                const loadingContainer = loader.querySelector(".loading-container");
                
                // アニメーションを完全に停止し、位置を確実に固定
                loadingBars.forEach((bar, index) => {
                    // CSSアニメーションを強制的に停止
                    bar.style.animation = "none";
                    bar.style.animationPlayState = "paused";
                    
                    // transformをリセットして位置を固定
                    bar.style.transform = "translateX(0) scaleY(1)";
                    bar.style.transformOrigin = "center center";
                    
                    // その他のスタイルをリセット
                    bar.style.willChange = "auto";
                    bar.style.position = "relative";
                    bar.style.left = "0";
                    bar.style.right = "auto";
                    bar.style.marginLeft = "0";
                    bar.style.marginRight = "0";
                    // フェードアウト中も表示されるように
                    bar.style.opacity = "1";
                    bar.style.visibility = "visible";
                });
                
                // コンテナの位置を固定
                if (loadingContainer) {
                    loadingContainer.style.transform = "translate(0, 0)";
                    loadingContainer.style.willChange = "auto";
                    loadingContainer.style.position = "relative";
                    loadingContainer.style.left = "0";
                    loadingContainer.style.right = "auto";
                }
                
                // 少し待ってからフェードアウト（アニメーション停止を確実に）
                requestAnimationFrame(() => {
                    // ローディング全体をフェードアウト
                    gsap.to(loader, {
                        opacity: 0,
                        duration: 1.5, // フェードアウト時間（1秒縮めた）
                        ease: "power1.inOut", // より滑らかなイージング
                        onComplete: () => {
                            loader.classList.add("hidden");
                            body.classList.remove("loading");
                                
                                // ローディングが消えた後、0.5秒待ってからサイト全体をフェードイン
                                setTimeout(() => {
                                    // サイト全体の要素を取得（ローディング以外）
                                    const hero = document.getElementById("hero");
                                    const heroTitle = document.querySelector(".hero-title");
                                    const scrollIndicator = document.querySelector(".scroll-indicator");
                                    const track = document.getElementById("horizontal-track");
                                    const footer = document.getElementById("footer");
                                    
                                    // heroセクションとtrackを先にフェードイン（背景として）
                                    // タイトル、SCROLLインジケーター、フッターはCSSで初期状態がopacity: 0に設定されている
                                    gsap.to([hero, track].filter(el => el !== null), {
                                        opacity: 1,
                                        duration: 1.5,
                                        ease: "power2.out"
                                    });
                                    
                                    // タイトル（andkou）、SCROLLインジケーター、フッターを同じタイミングでフェードイン
                                    gsap.to([heroTitle, scrollIndicator, footer].filter(el => el !== null), {
                                        opacity: 1,
                                        duration: 1.2,
                                        ease: "power2.out",
                                        delay: 0.8, // 0.8秒遅らせて表示
                                        onComplete: () => {
                                            // ローディング完了後にメインアニメーションを初期化
                                            initMainAnimations();
                                        }
                                    });
                                }, 500); // 0.5秒待機
                        }
                    });
                });
            }, totalWaitTime); // アニメーションが3回ループするまで待機
        });
    } else {
        // ローディング要素がない場合は直接メインアニメーションを初期化
        window.addEventListener("load", () => {
            initMainAnimations();
        });
    }
});

// ============================================
// メインアニメーション初期化
// ============================================
function initMainAnimations() {
    // 要素を取得
    const hero = document.getElementById("hero");
    const heroTitle = document.querySelector(".hero-title");
    const track = document.getElementById("horizontal-track");
    const content = document.querySelector(".horizontal-content");

    // モバイルの場合はGSAPアニメーションを無効化
    if (isMobile()) {
        // モバイルではScrollTriggerを無効化
        return;
    }

    // 1. Heroセクションのフェードアウトアニメーション（上に消える）
    gsap.to(heroTitle, {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    });

    // 2. 横スクロールアニメーションの設定（PCのみ）
    if (content && track) {
        // 横スクロールの距離を計算
        const getScrollDistance = () => {
            return content.scrollWidth - window.innerWidth;
        };
        
        const scrollTween = gsap.to(content, {
            x: () => -getScrollDistance(), // コンテンツの端まで左に動かす
            ease: "none", // 一定の速度で
            scrollTrigger: {
                trigger: track, // このエリアに来たら発動
                pin: true,      // 画面を固定する
                pinSpacing: true, // pin解除後のスペースを確保（横スクロールを正常に動作させるため）
                scrub: 1,       // スクロールに合わせて滑らかに動く
                start: "top top", // 画面の一番上に来たらスタート
                end: () => "+=" + getScrollDistance(), // スクロール量（横幅分だけ縦にスクロールさせる）
                invalidateOnRefresh: true, // リサイズ時に再計算
                anticipatePin: 1, // pinの動作をスムーズにする
                onUpdate: (self) => {
                    // 横スクロールの進行度に応じて矢印をフェードアウト
                    const progress = self.progress;
                    const horizontalIndicator = document.querySelector('.horizontal-scroll-indicator');
                    if (horizontalIndicator) {
                        // スクロールが進むほど矢印をフェードアウト（80%で完全に非表示）
                        const opacity = Math.max(0, 1 - (progress / 0.8));
                        gsap.to(horizontalIndicator, {
                            opacity: opacity,
                            duration: 0.1,
                            ease: "none"
                        });
                    }
                }
            }
        });
        
        // 3. 横スクロールエリアの各要素をふわっとフェードイン（CSSアニメーション使用）
        // item-introはアニメーションなし
        const horizontalItems = content.querySelectorAll('.item-work, .item-services, .item-blog, .item-profile, .item-contact');
        
        horizontalItems.forEach((item, index) => {
            // fadeupクラスを追加
            item.classList.add('anim-box', 'fadeup');
            
            // 横スクロールの進行に応じてアニメーションを発動
            ScrollTrigger.create({
                trigger: track,
                start: "top top",
                end: () => "+=" + getScrollDistance(),
                scrub: 0.5,
                onUpdate: (self) => {
                    // 要素の現在の位置を取得（スクロールを考慮）
                    const itemRect = item.getBoundingClientRect();
                    const itemScreenLeft = itemRect.left;
                    const itemScreenRight = itemRect.right;
                    const itemWidth = itemRect.width;
                    
                    // 画面の幅を取得
                    const windowWidth = window.innerWidth;
                    
                    // 要素が画面に入っているかチェック
                    // 要素の中心が画面の左端から右端の80%以内に入ったら発動
                    const itemCenter = itemScreenLeft + itemWidth / 2;
                    const triggerPoint = windowWidth * 0.7; // 画面の70%の位置で発動
                    
                    const isVisible = itemScreenRight > 0 && itemScreenLeft < windowWidth;
                    const isTriggered = itemCenter < triggerPoint && itemCenter > 0;
                    
                    // 要素が画面に入ってトリガーポイントに来たらアニメーションを発動（1回だけ）
                    if (isVisible && isTriggered && !item.classList.contains('is-animated')) {
                        item.classList.add('is-animated');
                    }
                }
            });
        });
    }

    // 3. ヒーローエリアのスクロールリンク
    // SCROLLボタンを押した時に、スムーズに横スクロールエリアへ移動
    const scrollIndicator = document.querySelector(".scroll-indicator");
    if (scrollIndicator && track) {
        scrollIndicator.addEventListener("click", () => {
            const trackPosition = track.getBoundingClientRect().top + window.pageYOffset;
            gsap.to(window, { 
                duration: 1.5, 
                scrollTo: trackPosition,
                ease: "power2.inOut"
            });
        });
    }
}

// リサイズ時にScrollTriggerを更新
let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (!isMobile()) {
            ScrollTrigger.refresh();
        }
    }, 250);
});