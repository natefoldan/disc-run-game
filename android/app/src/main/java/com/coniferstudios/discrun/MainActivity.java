package com.coniferstudios.discrun;

import android.annotation.SuppressLint;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

public class MainActivity extends AppCompatActivity {
    private static final String BANNER_AD_UNIT_ID = "ca-app-pub-4395267773413987/2921837450";
    private static final String REWARDED_AD_UNIT_ID = "ca-app-pub-4395267773413987/1218250842";

    private WebView webView;
    private AdView bannerAdView;
    private RewardedAd rewardedAd;
    private boolean isRewardedAdLoading = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Hardware accelerated window & keep screen on
        try {
            requestWindowFeature(Window.FEATURE_NO_TITLE);
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            );
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } catch (Exception ignored) {}

        // Root container
        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(0xFF060714);

        try {
            webView = new WebView(this);
            FrameLayout.LayoutParams webViewParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            );
            rootLayout.addView(webView, webViewParams);

            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
            settings.setMediaPlaybackRequiresUserGesture(false);

            webView.setBackgroundColor(0xFF060714);
            webView.setWebViewClient(new WebViewClient());
            webView.setWebChromeClient(new WebChromeClient());

            // Add JavaScript bridge for in-game ad triggers
            webView.addJavascriptInterface(new AdBridge(), "AndroidAds");

            // Load self-contained local web game directly from assets
            webView.loadUrl("file:///android_asset/index.html");
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Initialize Google Mobile Ads SDK
        try {
            MobileAds.initialize(this, initializationStatus -> {
                loadRewardedAd();
            });

            // Set up Banner Ad at the bottom
            bannerAdView = new AdView(this);
            bannerAdView.setAdUnitId(BANNER_AD_UNIT_ID);
            bannerAdView.setAdSize(AdSize.BANNER);

            FrameLayout.LayoutParams bannerParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            bannerParams.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
            rootLayout.addView(bannerAdView, bannerParams);
            bannerAdView.setVisibility(View.GONE);

            AdRequest adRequest = new AdRequest.Builder().build();
            bannerAdView.loadAd(adRequest);
        } catch (Exception e) {
            e.printStackTrace();
        }

        setContentView(rootLayout);
    }

    private void loadRewardedAd() {
        if (isRewardedAdLoading || rewardedAd != null) return;
        isRewardedAdLoading = true;

        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(this, REWARDED_AD_UNIT_ID, adRequest, new RewardedAdLoadCallback() {
            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                rewardedAd = null;
                isRewardedAdLoading = false;
            }

            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                rewardedAd = ad;
                isRewardedAdLoading = false;
                setupRewardedCallbacks();
            }
        });
    }

    private void setupRewardedCallbacks() {
        if (rewardedAd == null) return;
        rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                rewardedAd = null;
                loadRewardedAd();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                rewardedAd = null;
                loadRewardedAd();
            }
        });
    }

    // JavaScript interface exposed to the web game as window.AndroidAds
    public class AdBridge {
        @JavascriptInterface
        public void showRewardedAd(final String rewardType) {
            runOnUiThread(() -> {
                if (rewardedAd != null) {
                    rewardedAd.show(MainActivity.this, rewardItem -> {
                        // User watched the rewarded video, send reward to game
                        webView.post(() -> {
                            webView.evaluateJavascript(
                                "if (window.onAndroidRewardEarned) window.onAndroidRewardEarned('" + rewardType + "');",
                                null
                            );
                        });
                    });
                } else {
                    // Ad wasn't ready, retry loading and notify game fallback
                    loadRewardedAd();
                    webView.post(() -> {
                        webView.evaluateJavascript(
                            "if (window.onAndroidAdUnavailable) window.onAndroidAdUnavailable('" + rewardType + "');",
                            null
                        );
                    });
                }
            });
        }

        @JavascriptInterface
        public void showBanner() {
            runOnUiThread(() -> {
                if (bannerAdView != null) {
                    bannerAdView.setVisibility(View.VISIBLE);
                }
            });
        }

        @JavascriptInterface
        public void hideBanner() {
            runOnUiThread(() -> {
                if (bannerAdView != null) {
                    bannerAdView.setVisibility(View.GONE);
                }
            });
        }

        @JavascriptInterface
        public boolean isRewardedAdLoaded() {
            return rewardedAd != null;
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    );
                }
            } catch (Exception ignored) {}
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (bannerAdView != null) bannerAdView.resume();
    }

    @Override
    protected void onPause() {
        if (bannerAdView != null) bannerAdView.pause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (bannerAdView != null) bannerAdView.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
