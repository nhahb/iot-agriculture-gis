import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Leaf, LockKeyhole, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useInput from "../hooks/useInput";
import useToggle from "../hooks/useToggle";

import * as z from "zod";

import axios from "../api/axios";

const Login = () => {
  
  const { setAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/dashboard";

  const emailRef = useRef();
  const errRef = useRef();

  const [email, resetEmail, emailAtrribs] = useInput("email", "");
  const [pwd, setPwd] = useState("");
  const [check, toggleCheck] = useToggle('persist', false);

  useEffect(() => {
    emailRef.current.focus();
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "/login",
        JSON.stringify({ email, pwd }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      console.log(response?.data);
      const acessToken = response?.data?.accessToken;
      const role = response?.data?.role;
      setAuth({ email, role, acessToken });
      resetEmail();
      setPwd("");
      if(role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      if(!err?.response) {
        toast.error("No Server Response");
      } else if (err.response?.status === 400) {
        toast.error("Missing Email or Password");
      } else if (err.response?.status === 401) {
        toast.error("Unauthorized");
      } else {
        toast.error("Login Failed");
      }
      errRef.current.focus();
    }
  };

  return (
 <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4">
    {/* Background decoration */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.15),transparent_35%)]" />

    <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
    <div className="absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />

    <Card className="relative z-10 w-full max-w-md border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <CardHeader className="space-y-4 text-center">
        {/* Logo */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
          <Leaf className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight text-white">
            Welcome back
          </CardTitle>

          <CardDescription className="text-zinc-400">
            Sign in to manage your fields and IoT devices
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">
              Email
            </Label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

              <Input
                type="email"
                id="email"
                ref={emailRef}
                value={email}
                {...emailAtrribs}
                placeholder="name@example.com"
                autoComplete="email"
                required
                className="h-11 border-zinc-700 bg-zinc-950/60 pl-10 text-white placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pwd" className="text-zinc-300">
                Password
              </Label>

              <button
                type="button"
                className="text-sm text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Forgot password?
              </button>
            </div>

            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

              <Input
                type="password"
                id="pwd"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="h-11 border-zinc-700 bg-zinc-950/60 pl-10 text-white placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Persist login */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="persist"
              onChange={toggleCheck}
              checked={check}
              className="h-4 w-4 cursor-pointer rounded border-zinc-700 bg-zinc-900 accent-emerald-500"
            />

            <Label
              htmlFor="persist"
              className="cursor-pointer text-sm font-normal text-zinc-400"
            >
              Trust this device
            </Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="h-11 w-full bg-emerald-500 font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30"
          >
            Sign in
          </Button>

          {/* Register */}
          <p className="text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>

    <p className="absolute bottom-6 text-center text-xs text-zinc-600">
      IoT Agriculture Monitoring System
    </p>
  </div>
  );
};

export default Login;
