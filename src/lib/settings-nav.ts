import type { MessageKey } from "@/i18n/dict";

export type SettingsItem = { href: string; key: MessageKey; beta?: boolean };
/** Seções do menu de configurações, na mesma ordem do Attio. */
export const SETTINGS_SECTIONS: { title: MessageKey | null; items: SettingsItem[] }[] = [
  { title: "set.personal", items: [
    { href: "profile", key: "set.profile" }, { href: "appearance", key: "set.appearance" }, { href: "email-calendar-accounts", key: "set.emailCalendar" },
    { href: "call-intelligence", key: "set.callIntel" }, { href: "storage", key: "set.storage" }, { href: "refer", key: "set.refer" },
    { href: "notifications", key: "set.notifications" }, { href: "ask-attio", key: "set.askAttio" }, { href: "app-connections", key: "set.appConnections" },
  ] },
  { title: "set.workspace", items: [
    { href: "general", key: "set.general" }, { href: "members", key: "set.members" }, { href: "workspace-ask-attio", key: "set.askAttio" },
    { href: "call-recorder", key: "set.callRecorder" }, { href: "plans", key: "set.plans" }, { href: "billing", key: "set.billing" },
    { href: "developers", key: "set.developers" }, { href: "support", key: "set.support" }, { href: "migrate", key: "set.migrate" },
    { href: "labs", key: "set.labs" }, { href: "apps", key: "set.apps" },
  ] },
  { title: null, items: [{ href: "security", key: "set.security" }, { href: "email-calendar", key: "set.emailAndCal" }, { href: "expert-access", key: "set.expert" }] },
  { title: "set.data", items: [
    { href: "objects", key: "set.objects" }, { href: "lists", key: "set.lists" }, { href: "activities", key: "set.activities", beta: true },
    { href: "data-connectors", key: "set.connectors" }, { href: "import-history", key: "set.importHistory" }, { href: "dashboards", key: "set.dashboards" },
  ] },
];
