"use client"

import { signIn } from "next-auth/react"
import { Calendar } from "lucide-react"

export default function LoginButton() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-12 rounded-3xl shadow-2xl text-center max-w-md w-full">
                <div className="w-20 h-20 bg-blue-500/20 border border-blue-500/50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                    <Calendar className="w-10 h-10 text-blue-400" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                    Calendar Sync
                </h1>
                <p className="text-slate-400 mb-10 text-lg">
                    Connect your Google Calendar to manage your schedule seamlessly.
                </p>
                <button
                    onClick={() => signIn("google")}
                    className="group relative w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-white/10"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Sign up with Google
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-slate-900/50 text-slate-400">or</span>
                    </div>
                </div>

                <button
                    onClick={() => signIn("google")}
                    className="group relative w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg border border-white/20 hover:border-white/40 hover:shadow-white/10"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Log in
                </button>

                <p className="mt-8 text-xs text-slate-500">
                    Secure authentication via Google OAuth
                </p>
            </div>
        </div>
    )
}
