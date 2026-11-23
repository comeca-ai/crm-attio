import { getUsers } from "@/lib/data";
import { MembersSettings } from "@/components/settings-views";
export default async function Page() {
  const users = await getUsers();
  return <MembersSettings members={users} />;
}
