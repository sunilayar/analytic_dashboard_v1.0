"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  CandlestickData,
  ColorType,
  createChart,
  HistogramData,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  Time,
} from "lightweight-charts";
import { Candle } from "@/lib/market";

type LiveCandlestickChartProps = {
  candles: Candle[];
  darkMode: boolean;
};

export function LiveCandlestickChart({ candles, darkMode }: LiveCandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: {
          type: ColorType.Solid,
          color: darkMode ? "#0d1320" : "#ffffff",
        },
        textColor: darkMode ? "#dce7fb" : "#273449",
      },
      grid: {
        vertLines: { color: darkMode ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.2)" },
        horzLines: { color: darkMode ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.2)" },
      },
      crosshair: {
        vertLine: { color: "rgba(69, 166, 255, 0.5)" },
        horzLine: { color: "rgba(69, 166, 255, 0.5)" },
      },
      rightPriceScale: {
        borderColor: darkMode ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.14)",
      },
      timeScale: {
        borderColor: darkMode ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.14)",
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#fb7185",
      borderUpColor: "#22c55e",
      borderDownColor: "#fb7185",
      wickUpColor: "#22c55e",
      wickDownColor: "#fb7185",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(69, 166, 255, 0.45)",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [darkMode]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const candleData: CandlestickData<Time>[] = candles.map((candle) => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData: HistogramData<Time>[] = candles.map((candle) => ({
      time: candle.time as Time,
      value: candle.volume,
      color: candle.close >= candle.open ? "rgba(34, 197, 94, 0.35)" : "rgba(251, 113, 133, 0.4)",
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} className="h-[320px] w-full" />;
}
