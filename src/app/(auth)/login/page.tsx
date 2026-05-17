"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      if (result?.ok) {
        // Get the session to determine role
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        const role = (session?.user as any)?.role;

        // Redirect based on role
        if (role === "EMPLOYEE") {
          router.push("/employee");
        } else if (role === "MANAGER") {
          router.push("/manager");
        } else if (role === "ADMIN") {
          router.push("/admin");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">AtomQuest</h1>
            <p className="text-gray-600 text-sm mt-2">Goal Management System</p>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                placeholder="Enter your email"
                type="email"
                {...register("email")}
                error={errors.email?.message}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                type="password"
                {...register("password")}
                error={errors.password?.message}
              />

              <Button
                variant="primary"
                size="md"
                type="submit"
                loading={loading}
                className="w-full"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">Demo Credentials:</p>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <p className="font-medium">Admin:</p>
                  <p>admin@demo.com / password123</p>
                </div>
                <div>
                  <p className="font-medium">Manager:</p>
                  <p>manager@demo.com / password123</p>
                </div>
                <div>
                  <p className="font-medium">Employee:</p>
                  <p>employee@demo.com / password123</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
