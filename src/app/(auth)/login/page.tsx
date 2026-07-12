import { Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-md bg-brand text-white"><Truck className="h-6 w-6" /></div>
        <CardTitle>Sankofa Express</CardTitle>
        <CardDescription>Sign in to manage shipments, riders, payments, and support.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/api/auth/login" method="post" className="grid gap-4">
          <Input label="Email" name="email" type="email" required defaultValue="admin@sankofaexpress.com" />
          <Input label="Password" name="password" type="password" required defaultValue="Admin@2026" />
          <Button type="submit">Sign in</Button>
        </form>
      </CardContent>
    </Card>
  );
}
