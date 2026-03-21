import { useState } from "react";
import {
  User,
  Bell,
  Lock,
  Globe,
  Palette,
  Eye,
  EyeOff,
  Moon,
  Sun,
} from "lucide-react";
import { NavBar } from "../components/nav-bar";

type Tab = "account" | "notifications" | "privacy" | "appearance" | "language";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language & Region", icon: Globe },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? "bg-[#9B1B30]" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-4" : ""}`}
      />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  );
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    matches: true,
    updates: true,
    marketing: false,
  });
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showEmail: false,
    twoFactor: false,
  });
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("America/Toronto");

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showBack title="Settings" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-start">
          {/* Sidebar */}
          <nav className="bg-white rounded-lg border border-gray-200 p-2 lg:sticky lg:top-24">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#9B1B30]/10 text-[#9B1B30]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {activeTab === "account" && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Account</h3>
                <p className="text-sm text-gray-400 mb-6">Manage your account details</p>

                <div className="space-y-0">
                  <SettingRow label="Full Name">
                    <input
                      defaultValue="Alex Nguyen"
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 w-52 focus:ring-1 focus:ring-[#9B1B30] focus:border-transparent"
                    />
                  </SettingRow>
                  <SettingRow label="Email">
                    <input
                      defaultValue="alex.nguyen@email.com"
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 w-52 focus:ring-1 focus:ring-[#9B1B30] focus:border-transparent"
                    />
                  </SettingRow>
                  <SettingRow label="Password">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        defaultValue="password123"
                        className="px-3 py-1.5 pr-9 border border-gray-200 rounded-lg text-sm text-gray-700 w-52 focus:ring-1 focus:ring-[#9B1B30] focus:border-transparent"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </SettingRow>
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="px-5 py-2 bg-[#9B1B30] text-white text-sm font-medium rounded-lg hover:bg-[#7A1420] transition-colors">
                    Save Changes
                  </button>
                  <button className="px-5 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </>
            )}

            {activeTab === "notifications" && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Notifications</h3>
                <p className="text-sm text-gray-400 mb-6">Choose what you want to be notified about</p>

                <SettingRow label="Email Notifications" description="Receive updates via email">
                  <Toggle enabled={notifications.email} onChange={() => setNotifications((p) => ({ ...p, email: !p.email }))} />
                </SettingRow>
                <SettingRow label="Push Notifications" description="Browser push notifications">
                  <Toggle enabled={notifications.push} onChange={() => setNotifications((p) => ({ ...p, push: !p.push }))} />
                </SettingRow>
                <SettingRow label="New Matches" description="When new programs match your profile">
                  <Toggle enabled={notifications.matches} onChange={() => setNotifications((p) => ({ ...p, matches: !p.matches }))} />
                </SettingRow>
                <SettingRow label="Product Updates" description="New features and improvements">
                  <Toggle enabled={notifications.updates} onChange={() => setNotifications((p) => ({ ...p, updates: !p.updates }))} />
                </SettingRow>
                <SettingRow label="Marketing" description="Tips, offers, and promotions">
                  <Toggle enabled={notifications.marketing} onChange={() => setNotifications((p) => ({ ...p, marketing: !p.marketing }))} />
                </SettingRow>
              </>
            )}

            {activeTab === "privacy" && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Privacy & Security</h3>
                <p className="text-sm text-gray-400 mb-6">Control your privacy and security settings</p>

                <SettingRow label="Public Profile" description="Allow others to view your profile">
                  <Toggle enabled={privacy.profilePublic} onChange={() => setPrivacy((p) => ({ ...p, profilePublic: !p.profilePublic }))} />
                </SettingRow>
                <SettingRow label="Show Email" description="Display email on your public profile">
                  <Toggle enabled={privacy.showEmail} onChange={() => setPrivacy((p) => ({ ...p, showEmail: !p.showEmail }))} />
                </SettingRow>
                <SettingRow label="Two-Factor Authentication" description="Add an extra layer of security">
                  <Toggle enabled={privacy.twoFactor} onChange={() => setPrivacy((p) => ({ ...p, twoFactor: !p.twoFactor }))} />
                </SettingRow>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button className="text-sm text-[#9B1B30] font-medium hover:underline">
                    Download my data
                  </button>
                </div>
              </>
            )}

            {activeTab === "appearance" && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Appearance</h3>
                <p className="text-sm text-gray-400 mb-6">Customize how SkillsBridge looks</p>

                <SettingRow label="Dark Mode" description="Switch between light and dark theme">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                      darkMode ? "border-[#9B1B30] text-[#9B1B30] bg-[#9B1B30]/5" : "border-gray-200 text-gray-700"
                    }`}
                  >
                    {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {darkMode ? "Dark" : "Light"}
                  </button>
                </SettingRow>

                <SettingRow label="Compact Mode" description="Reduce spacing for denser layout">
                  <Toggle enabled={false} onChange={() => {}} />
                </SettingRow>
              </>
            )}

            {activeTab === "language" && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Language & Region</h3>
                <p className="text-sm text-gray-400 mb-6">Set your language and regional preferences</p>

                <SettingRow label="Language">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 w-44 focus:ring-1 focus:ring-[#9B1B30] focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="fr">Français</option>
                    <option value="zh">中文</option>
                    <option value="ko">한국어</option>
                  </select>
                </SettingRow>
                <SettingRow label="Timezone">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 w-44 focus:ring-1 focus:ring-[#9B1B30] focus:border-transparent"
                  >
                    <option value="America/Toronto">Eastern (Toronto)</option>
                    <option value="America/Los_Angeles">Pacific (LA)</option>
                    <option value="Europe/London">GMT (London)</option>
                    <option value="Asia/Ho_Chi_Minh">ICT (Ho Chi Minh)</option>
                    <option value="Asia/Tokyo">JST (Tokyo)</option>
                  </select>
                </SettingRow>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
