import { requireUser } from "@/lib/auth";
import { ProfileSettings } from "@/components/settings-views";

export default async function Page() {
  const u = await requireUser();
  return <ProfileSettings profile={{ firstName: u.firstName, lastName: u.lastName, email: u.email, timezone: u.timezone, weekStart: u.weekStart, avatarColor: u.avatarColor }} />;
}
