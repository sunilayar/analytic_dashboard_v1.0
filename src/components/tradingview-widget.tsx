"use client";

import { useEffect, useId, useMemo } from "react";

type TradingViewWidgetProps = {
  symbol: string;
  interval: string;
  theme: "light" | "dark";
};

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

export function TradingViewWidget({ symbol, interval, theme }: TradingViewWidgetProps) {
  const rawId = useId();
  const containerId = useMemo(() => `tv-${rawId.replace(/:/g, "")}`, [rawId]);

  useEffect(() => {
    const scriptId = "tradingview-widget-script";

    const renderWidget = () => {
      if (!window.TradingView) return;

      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = "";

      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval,
        timezone: "Asia/Kolkata",
        theme: theme === "dark" ? "dark" : "light",
        style: "1",
        locale: "en",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: true,
        container_id: containerId,
        studies: [
          "RSI@tv-basicstudies",
          "MACD@tv-basicstudies",
          "MASimple@tv-basicstudies",
          "BB@tv-basicstudies",
          "Volume@tv-basicstudies",
        ],
      });
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = renderWidget;
    document.body.appendChild(script);
  }, [containerId, interval, symbol, theme]);

  return <div id={containerId} className="h-[420px] w-full" />;
}
