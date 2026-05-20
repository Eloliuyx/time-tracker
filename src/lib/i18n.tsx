"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "zh" | "en";

const STORAGE_KEY = "time-sandglass-language";

type Translation = {
  languageToggle: string;
  signOut: string;
  appName: string;

  nav: {
    track: string;
    review: string;
    trend: string;
  };

  auth: {
    signIn: string;
    signUp: string;
    signInSubtitle: string;
    signUpSubtitle: string;
    email: string;
    password: string;
    passwordSignup: string;
    submitting: string;
    missingFields: string;
    passwordTooShort: string;
    signUpSuccessSignedIn: string;
    signUpSuccessConfirmEmail: string;
  };

  track: {
    inProgress: string;
    inputPlaceholder: string;
    submit: string;
    emptyTimeline: string;
    undo: string;
    confirmUndo: string;
    interruptedNotice: string;
  };

  categories: {
    Work: string;
    Learning: string;
    Admin: string;
    Life: string;
    "Self-Care": string;
    Exercise: string;
    Entertainment: string;
    Rest: string;
    Interrupted: string;
    Uncategorized: string;
  };
};

const copy: Record<Language, Translation> = {
  zh: {
    languageToggle: "EN | 中",
    signOut: "退出登录",
    appName: "刚才",

    nav: {
      track: "记录",
      review: "回顾",
      trend: "趋势",
    },

    auth: {
      signIn: "登录",
      signUp: "注册",
      signInSubtitle: "登录后继续记录你的时间。",
      signUpSubtitle: "创建账号，开始记录你的时间。",
      email: "邮箱",
      password: "密码",
      passwordSignup: "密码，至少 6 位",
      submitting: "处理中...",
      missingFields: "请输入邮箱和密码。",
      passwordTooShort: "密码至少需要 6 位。",
      signUpSuccessSignedIn: "注册成功，已自动登录。",
      signUpSuccessConfirmEmail: "注册成功。请检查邮箱，点击确认链接后再登录。",
    },

    track: {
      inProgress: "进行中",
      inputPlaceholder: "刚刚在做什么...",
      submit: "记录",
      emptyTimeline: "还没有记录，输入刚刚做的事情开始吧",
      undo: "撤销",
      confirmUndo: "确定撤销这条记录吗？",
      interruptedNotice: "上次记录似乎中断了，已为你从现在重新开始。",
    },

    categories: {
      Work: "工作",
      Learning: "学习",
      Admin: "事务",
      Life: "生活",
      "Self-Care": "自我照料",
      Exercise: "运动",
      Entertainment: "娱乐",
      Rest: "休息",
      Interrupted: "记录中断",
      Uncategorized: "未分类",
    },
  },

  en: {
    languageToggle: "EN | 中",
    signOut: "Sign out",
    appName: "JustNow",

    nav: {
      track: "Track",
      review: "Review",
      trend: "Trends",
    },

    auth: {
      signIn: "Sign in",
      signUp: "Sign up",
      signInSubtitle: "Sign in to continue tracking your time.",
      signUpSubtitle: "Create an account to start tracking your time.",
      email: "Email",
      password: "Password",
      passwordSignup: "Password, at least 6 characters",
      submitting: "Working...",
      missingFields: "Please enter your email and password.",
      passwordTooShort: "Password must be at least 6 characters.",
      signUpSuccessSignedIn: "Account created. You are signed in.",
      signUpSuccessConfirmEmail:
        "Account created. Please check your email and confirm before signing in.",
    },

    track: {
      inProgress: "In progress",
      inputPlaceholder: "What were you just doing?",
      submit: "Save",
      emptyTimeline: "No records yet. Type what you just did to begin.",
      undo: "Undo",
      confirmUndo: "Undo this record?",
      interruptedNotice:
        "Your last session seemed interrupted. A new session has started from now.",
    },

    categories: {
      Work: "Work",
      Learning: "Learning",
      Admin: "Admin",
      Life: "Life",
      "Self-Care": "Self-Care",
      Exercise: "Exercise",
      Entertainment: "Entertainment",
      Rest: "Rest",
      Interrupted: "Interrupted",
      Uncategorized: "Uncategorized",
    },
  },
};

type I18nContextValue = {
  language: Language;
  setLanguage: (nextLanguage: Language) => void;
  toggleLanguage: () => void;
  t: Translation;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "zh" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  }

  function toggleLanguage() {
    setLanguage(language === "zh" ? "en" : "zh");
  }

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: copy[language],
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
