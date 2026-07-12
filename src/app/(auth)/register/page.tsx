import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ROLES } from "@/lib/constants/roles";

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create User</CardTitle>
        <CardDescription>Admin-only account provisioning.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/api/auth/register" method="post" className="grid gap-4">
          <Input label="Name" name="name" required />
          <Input label="Email" name="email" type="email" required />
          <Input label="Password" name="password" type="password" required />
          <Select label="Role" name="role" options={ROLES.map((role) => ({ label: role.replaceAll("_", " "), value: role }))} />
          <Button type="submit">Create account</Button>
        </form>
      </CardContent>
    </Card>
  );
}
