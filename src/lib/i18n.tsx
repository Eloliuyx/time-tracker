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
    settings: string;
  };

  landing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    authButton: string;
    footer: string;
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

  settings: {
  title: string;
  subtitle: string;
  languageTitle: string;
  languageDescription: string;
  exportTitle: string;
  exportDescription: string;
  exportButton: string;
  privacyTitle: string;
  privacyDescription: string;
  dangerTitle: string;
  deleteDescription: string;
  deleteButton: string;
  deleting: string;
  deleteSuccess: string;
  deleteError: string;
  contactTitle: string;
contactDescription: string;
contactButton: string;
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
      settings: "设置",
    },

    landing: {
      eyebrow: "反向时间追踪",
      title: "拥抱真实的发生。",
      subtitle:
        "拒绝死板日程表带来的伪计划与真焦虑。做完就记一下，多简单。",
      authButton: "即刻开始",
      footer: "百分之百地活在当下。看清你 24 小时每一刻的真实去向。",
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

    settings: {
  title: "设置",
  subtitle: "管理语言、数据和隐私相关选项。",
  languageTitle: "语言",
  languageDescription: "切换应用界面的显示语言。",
  exportTitle: "导出数据",
  exportDescription: "将你的时间记录导出为 CSV 文件。",
  exportButton: "导出 CSV",
  privacyTitle: "隐私",
  privacyDescription:
    "你的记录只用于生成你自己的时间线、回顾和趋势。我们不会出售你的数据。",
  dangerTitle: "危险操作",
  deleteDescription:
    "这会永久删除当前账号下的全部 {count} 条时间记录，并重置当前进行中的记录。请输入 DELETE RECORDS 确认。",
  deleteButton: "删除全部时间记录",
  deleting: "删除中...",
  deleteSuccess: "已删除全部时间记录。",
  deleteError: "删除失败，请稍后再试。",
  contactTitle: "反馈与联系",
contactDescription: "有问题、反馈或建议，欢迎联系作者。",
contactButton: "给作者发邮件",
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
      settings: "Settings",
    },

landing: {
  eyebrow: "Reverse Time Tracking",
  title: "Embrace what actually happened.",
  subtitle:
    "Most time tools are just perfectionist wishful thinking. Finished something? Drop a line. It’s that simple.",
  authButton: "Start Now",
  footer: "Be 100% present. Own every single minute of your actual life.",
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

    settings: {
  title: "Settings",
  subtitle: "Manage language, data, and privacy options.",
  languageTitle: "Language",
  languageDescription: "Switch the display language of the app.",
  exportTitle: "Export data",
  exportDescription: "Export your time records as a CSV file.",
  exportButton: "Export CSV",
  privacyTitle: "Privacy",
  privacyDescription:
    "Your records are used only to power your own timeline, reviews, and trends. We do not sell your data.",
  dangerTitle: "Danger zone",
  deleteDescription:
    "This will permanently delete all {count} time records in this account and reset the current session. Type DELETE RECORDS to confirm.",
  deleteButton: "Delete all time records",
  deleting: "Deleting...",
  deleteSuccess: "All time records have been deleted.",
  deleteError: "Delete failed. Please try again later.",
  contactTitle: "Feedback & contact",
contactDescription: "Questions, bugs, or ideas? Send a note to the creator.",
contactButton: "Email the creator",

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
