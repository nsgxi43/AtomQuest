"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { Copy, CheckCircle2, ShieldCheck, Briefcase, UserCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string>("");

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const autofill = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", "password123", { shouldValidate: true });
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">AtomQuest</h1>
          <p className="text-gray-500 mt-2 text-lg">Enterprise Goal Management</p>
        </div>

        <Card className="shadow-2xl border-0 ring-1 ring-gray-200/50 bg-white/95 backdrop-blur-sm">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Email Address"
                  placeholder="Enter your corporate email"
                  type="email"
                  {...register("email")}
                  error={errors.email?.message}
                  className="bg-gray-50/80"
                />

                <Input
                  label="Password"
                  placeholder="••••••••"
                  type="password"
                  {...register("password")}
                  error={errors.password?.message}
                  className="bg-gray-50/80"
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                loading={loading}
                className="w-full shadow-blue-500/30 shadow-lg text-base font-semibold py-3"
              >
                Sign In to Portal
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="border border-indigo-100 shadow-lg bg-white/90 backdrop-blur-md overflow-hidden">
          <div className="bg-indigo-50/50 border-b border-indigo-100 px-6 py-3">
            <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider text-center">Try Demo Workspace</h3>
          </div>
          <CardBody className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { role: "ADMIN", email: "admin@demo.com", icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", hover: "hover:border-purple-300 hover:shadow-md hover:shadow-purple-100" },
                { role: "MANAGER", email: "manager@demo.com", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", hover: "hover:border-blue-300 hover:shadow-md hover:shadow-blue-100" },
                { role: "EMPLOYEE", email: "priya@demo.com", icon: UserCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", hover: "hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100" },
              ].map((account) => (
                <div 
                  key={account.role} 
                  onClick={() => autofill(account.email)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${account.bg} ${account.border} ${account.hover} group`}
                >
                  <account.icon className={`w-6 h-6 mb-1.5 ${account.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${account.color}`}>{account.role}</span>
                  <span className="text-xs font-medium text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute translate-y-6 bg-white/90 px-2 py-0.5 rounded shadow-sm">Autofill</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-500 font-medium">Password for all demo accounts: </span>
              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">password123</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
