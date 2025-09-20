import React from "react";
import { Button } from "./ui/button";
import {
  PenBox,
  LayoutDashboard,
  FileText,
  GraduationCap,
  ChevronDown,
  Stars,
  Target,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { checkUser } from "@/lib/checkUser";

export default async function Header() {
  await checkUser();

  return (
    <header className="top-0 w-full bg-gray-100 z-50 shadow-md">
      <nav className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-black rounded-full"></div>
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-black">CareerCoach</h1>
              <p className="text-xs text-gray-600">Smarter careers start here.</p>
            </div>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button className="flex items-center gap-3 py-3 px-6 text-lg font-medium bg-black text-white border border-white">
                <LayoutDashboard className="h-5 w-5" />
                Industry Insights
              </Button>
            </Link>

            {/* Growth Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-3 py-3 px-6 text-lg font-medium bg-black text-white border border-white">
                  <Stars className="h-5 w-5" />
                  <span className="hidden md:block">Growth Tools</span>
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white shadow-lg rounded-md">
                <DropdownMenuItem asChild>
                  <Link href="/resume" className="flex items-center gap-3 py-3 px-6 text-lg font-medium text-gray-800 hover:bg-gray-100">
                    <FileText className="h-5 w-5" />
                    Build Resume With Gemini AI
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ai-cover-letter" className="flex items-center gap-3 py-3 px-6 text-lg font-medium text-gray-800 hover:bg-gray-100">
                    <PenBox className="h-5 w-5" />
                    Generate Cover Letters With AI
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/interview" className="flex items-center gap-3 py-3 px-6 text-lg font-medium text-gray-800 hover:bg-gray-100">
                    <GraduationCap className="h-5 w-5" />
                    Interview Prep & Feedback with AI
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portfolio" className="flex items-center gap-3 py-3 px-6 text-lg font-medium text-gray-800 hover:bg-gray-100">
                    <FileText className="h-5 w-5" />
                    Portfolio Builder
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ats-optimization" className="flex items-center gap-3 py-3 px-6 text-lg font-medium text-gray-800 hover:bg-gray-100">
                    <Target className="h-5 w-5" />
                    ATS Score Optimization
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications" className="flex items-center gap-3 py-3 px-6 text-lg font-medium text-gray-800 hover:bg-gray-100">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          {/* Sign In Button */}
          <SignedOut>
            <SignInButton>
              <Button className="bg-black text-white border border-black text-lg font-semibold rounded-lg px-6 py-3">
                SIGN IN TO USE FEATURES
              </Button>
            </SignInButton>
          </SignedOut>

          {/* User Profile */}
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
