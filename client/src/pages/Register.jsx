import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Leaf,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import axios from "../api/axios";

const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register() {
  const navigate = useNavigate();
  const userRef = useRef();
  const errRef = useRef();

  const [email, setEmail] = useState("");
  const [validEmail, setValidEmail] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const [name, setName] = useState("");
  const [validName, setValidName] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);

  const [pwd, setPwd] = useState("");
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const [matchPwd, setMatchPwd] = useState("");
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);

  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setValidEmail(EMAIL_REGEX.test(email));
  }, [email]);

  useEffect(() => {
    setValidName(USER_REGEX.test(name));
  }, [name]);

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
    setValidMatch(pwd === matchPwd);
  }, [pwd, matchPwd]);

  useEffect(() => {
    setErrMsg("");
  }, [name, pwd, matchPwd]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // if button enabled with JS hack
    const v1 = USER_REGEX.test(name);
    const v2 = PWD_REGEX.test(pwd);
    if (!v1 || !v2) {
      setErrMsg("Invalid Entry");
      return;
    }
    try {
      const response = await axios.post(
        "/register",
        JSON.stringify({email, name, pwd }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );
      console.log(response?.data);
      console.log(JSON.stringify(response));
      navigate("/login");
      //clear state and controlled inputs
      //need value attrib on inputs for this
      setName("");
      setPwd("");
      setMatchPwd("");
    } catch (err) {
      if (!err?.response) {
        setErrMsg("No Server Response");
      } else if (err.response?.status === 409) {
        setErrMsg("Username Taken");
      } else {
        setErrMsg("Registration Failed");
      }
      errRef.current.focus();
    }
  };


return (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10">
    {/* Background */}
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
            Create an account
          </CardTitle>

          <CardDescription className="text-zinc-400">
            Register to manage your fields and IoT devices
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* Server error */}
        <div
          ref={errRef}
          role="alert"
          aria-live="assertive"
          className={
            errMsg
              ? "mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
              : "sr-only"
          }
        >
          {errMsg && (
            <>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errMsg}</span>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">
              Email
            </Label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

              <Input
                ref={userRef}
                type="email"
                id="email"
                value={email}
                placeholder="name@example.com"
                autoComplete="email"
                required
                aria-invalid={email && !validEmail ? "true" : "false"}
                aria-describedby="email-error"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                className={`h-11 bg-zinc-950/60 pl-10 text-white placeholder:text-zinc-600 ${
                  email && !validEmail
                    ? "border-red-500 focus-visible:ring-red-500/20"
                    : "border-zinc-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                }`}
              />
            </div>

            {emailFocus && email && !validEmail && (
              <p
                id="email-error"
                className="flex items-center gap-1.5 text-xs text-red-400"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Please enter a valid email address.
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-300">
              Username
            </Label>

            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

              <Input
                type="text"
                id="username"
                value={name}
                placeholder="Enter your username"
                autoComplete="username"
                required
                aria-invalid={name && !validName ? "true" : "false"}
                aria-describedby="username-error"
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
                className={`h-11 bg-zinc-950/60 pl-10 text-white placeholder:text-zinc-600 ${
                  name && !validName
                    ? "border-red-500 focus-visible:ring-red-500/20"
                    : "border-zinc-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                }`}
              />
            </div>

            {nameFocus && name && !validName && (
              <p
                id="username-error"
                className="flex items-center gap-1.5 text-xs text-red-400"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Username must contain 4 to 20 characters.
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">
              Password
            </Label>

            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

              <Input
                type="password"
                id="password"
                value={pwd}
                placeholder="Create a password"
                autoComplete="new-password"
                required
                aria-invalid={pwd && !validPwd ? "true" : "false"}
                aria-describedby="password-error"
                onChange={(e) => setPwd(e.target.value)}
                onFocus={() => setPwdFocus(true)}
                onBlur={() => setPwdFocus(false)}
                className={`h-11 bg-zinc-950/60 pl-10 text-white placeholder:text-zinc-600 ${
                  pwd && !validPwd
                    ? "border-red-500 focus-visible:ring-red-500/20"
                    : "border-zinc-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                }`}
              />
            </div>

            {pwdFocus && pwd && !validPwd && (
              <p
                id="password-error"
                className="flex items-center gap-1.5 text-xs text-red-400"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Password must contain 8 to 20 characters.
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-zinc-300">
              Confirm password
            </Label>

            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

              <Input
                type="password"
                id="confirmPassword"
                value={matchPwd}
                placeholder="Enter your password again"
                autoComplete="new-password"
                required
                aria-invalid={
                  matchPwd && !validMatch ? "true" : "false"
                }
                aria-describedby="confirm-password-error"
                onChange={(e) => setMatchPwd(e.target.value)}
                onFocus={() => setMatchFocus(true)}
                onBlur={() => setMatchFocus(false)}
                className={`h-11 bg-zinc-950/60 pl-10 text-white placeholder:text-zinc-600 ${
                  matchPwd && !validMatch
                    ? "border-red-500 focus-visible:ring-red-500/20"
                    : "border-zinc-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                }`}
              />
            </div>

            {matchFocus && matchPwd && !validMatch && (
              <p
                id="confirm-password-error"
                className="flex items-center gap-1.5 text-xs text-red-400"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={
              !validName ||
              !validEmail ||
              !validPwd ||
              !validMatch
            }
            className="mt-2 h-11 w-full bg-emerald-500 font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:shadow-none"
          >
            Create account
          </Button>

          {/* Login link */}
          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              to="/"
              className="font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>

    <p className="absolute bottom-5 text-center text-xs text-zinc-600">
      IoT Agriculture Monitoring System
    </p>
  </div>
);
}

export default Register;
