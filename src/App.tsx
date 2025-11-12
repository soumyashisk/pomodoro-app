import { useCallback, useEffect, useRef, useState } from "@lynx-js/react";

import "./App.css";
import timerEndSound from "./assets/timer-end.mp3";

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 1; // 5 minutes in seconds
const LONG_BREAK = 15 * 60; // 15 minutes

type TimerMode = "work" | "shortBreak" | "longBreak";

export function App() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadedStyle = { opacity: isCompleted ? 0 : 1 };
  const rippleOffsets = [0, 0.8, 1.6];

  const getDuration = (timerMode: TimerMode) => {
    switch (timerMode) {
      case "work":
        return WORK_DURATION;
      case "shortBreak":
        return SHORT_BREAK;
      case "longBreak":
        return LONG_BREAK;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgress = () => {
    const duration = getDuration(mode);
    return ((duration - timeLeft) / duration) * 100;
  };

  const switchMode = useCallback((newMode: TimerMode) => {
    "background only";
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
    setIsRunning(false);
    setIsCompleted(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggleTimer = useCallback(() => {
    "background only";
    if (isCompleted) {
      setIsCompleted(false);
      setIsRunning(false);
      setTimeLeft(getDuration(mode));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setIsRunning((prev) => !prev);
  }, [isCompleted, mode]);

  const resetTimer = useCallback(() => {
    "background only";
    setTimeLeft(getDuration(mode));
    setIsRunning(false);
    setIsCompleted(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [mode]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            if (mode === "work") {
              setCompletedPomodoros((count) => count + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode]);

  useEffect(() => {
    if (audioRef.current || typeof Audio === "undefined") {
      return () => {};
    }

    const audio = new Audio(timerEndSound);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isCompleted) {
      audio.play().catch(() => {
        // playback might be blocked by interaction policies; ignore
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isCompleted]);

  return (
    <view className={isCompleted ? "container completed" : "container"}>
      {/* Header */}
      <view className="header" style={fadedStyle}>
        <text className="title">POMODORO</text>
        <text className="subtitle">Focus & Productivity</text>
      </view>

      {/* Mode Selector */}
      <view className="mode-selector" style={fadedStyle}>
        <view
          className={mode === "work" ? "mode-btn active" : "mode-btn"}
          bindtap={isCompleted ? undefined : () => switchMode("work")}
        >
          <text className="mode-text">Work</text>
        </view>
        <view
          className={mode === "shortBreak" ? "mode-btn active" : "mode-btn"}
          bindtap={isCompleted ? undefined : () => switchMode("shortBreak")}
        >
          <text className="mode-text">Short Break</text>
        </view>
        <view
          className={mode === "longBreak" ? "mode-btn active" : "mode-btn"}
          bindtap={isCompleted ? undefined : () => switchMode("longBreak")}
        >
          <text className="mode-text">Long Break</text>
        </view>
      </view>

      {/* Timer Circle */}
      <view className="timer-container">
        <view className="timer-circle">
          {rippleOffsets.map((delay, index) => {
            const className = isCompleted
              ? "timer-ripple ripple-active"
              : "timer-ripple";
            const style = isCompleted
              ? { opacity: 1, animationDelay: `${delay}s` }
              : { opacity: 0 };

            return (
              <view
                key={`ripple-${index}`}
                className={className}
                style={style}
              />
            );
          })}
          {/* Progress Ring */}
          <view
            className="progress-ring"
            style={{
              background: `conic-gradient(rgba(255, 255, 255, 0.9) ${getProgress()}%, transparent ${getProgress()}%)`,
            }}
          />

          {/* Inner Circle */}
          <view className="timer-inner">
            <text className="timer-display">{formatTime(timeLeft)}</text>
            <text className="timer-label">
              {mode === "work"
                ? "FOCUS TIME"
                : mode === "shortBreak"
                ? "SHORT BREAK"
                : "LONG BREAK"}
            </text>
          </view>
        </view>
      </view>

      {/* Controls */}
      <view className="controls">
        <view className="btn-primary" bindtap={toggleTimer}>
          <text className="btn-text">
            {isCompleted ? "DISMISS" : isRunning ? "PAUSE" : "START"}
          </text>
        </view>
        <view
          className="btn-secondary"
          style={fadedStyle}
          bindtap={isCompleted ? undefined : resetTimer}
        >
          <text className="btn-text-secondary">RESET</text>
        </view>
      </view>

      {/* Stats */}
      <view className="stats" style={fadedStyle}>
        <view className="stat-item">
          <text className="stat-number">{completedPomodoros}</text>
          <text className="stat-label">Completed</text>
        </view>
        <view className="stat-divider" />
        <view className="stat-item">
          <text className="stat-number">{completedPomodoros * 25}</text>
          <text className="stat-label">Minutes</text>
        </view>
      </view>
    </view>
  );
}
