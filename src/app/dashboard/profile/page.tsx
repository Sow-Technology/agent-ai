"use client";

import { useState, useRef, type ChangeEvent, useEffect, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription as DialogDesc,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, KeyRound } from "lucide-react";
import type { User } from "@/types/auth";
// Removed direct service import - using API route instead

import { getAuthHeaders } from "@/lib/authUtils";

const placeholderAvatars = [
  "https://picsum.photos/seed/avatar1/100/100",
  "https://picsum.photos/seed/avatar2/100/100",
  "https://picsum.photos/seed/avatar3/100/100",
  "https://picsum.photos/seed/avatar4/100/100",
];

const DEFAULT_FULL_NAME = "AssureQAI User";
const DEFAULT_EMAIL = "user@example.com";
const DEFAULT_USERNAME = "assure_qai_user";
const DEFAULT_ROLE = "Administrator";

const INITIAL_API_KEY = `sk_live_mock_${Array(24)
  .fill(0)
  .map(() => Math.random().toString(36).charAt(2))
  .join("")}`;
const LOCAL_STORAGE_LOGGED_IN_USER_DETAILS_KEY = "assureQaiLoggedInUserDetails";

export default function ProfilePage() {
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [customAvatarSrc, setCustomAvatarSrc] = useState<string | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileFullName, setProfileFullName] = useState(DEFAULT_FULL_NAME);
  const [profileEmail, setProfileEmail] = useState(DEFAULT_EMAIL);
  const [profileUsername, setProfileUsername] = useState(DEFAULT_USERNAME);
  const [profileRole, setProfileRole] = useState(DEFAULT_ROLE);
  const [apiKey, setApiKey] = useState(INITIAL_API_KEY);

  const [initialFullName, setInitialFullName] = useState(DEFAULT_FULL_NAME);
  const [initialEmail, setInitialEmail] = useState(DEFAULT_EMAIL);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const loadUserDetails = async () => {
        try {
          const response = await fetch("/api/auth/user", {
            headers: getAuthHeaders(),
          });
          const data = await response.json();

          let finalFullName = DEFAULT_FULL_NAME;
          let finalEmail = DEFAULT_EMAIL;
          let finalUsername = DEFAULT_USERNAME;
          let finalRole = DEFAULT_ROLE;

          if (response.ok && data.success && data.user) {
            finalFullName = data.user.fullName || DEFAULT_FULL_NAME;
            finalEmail = data.user.email || DEFAULT_EMAIL;
            finalUsername = data.user.username || DEFAULT_USERNAME;
            finalRole = data.user.role || DEFAULT_ROLE;
          }

          setProfileFullName(finalFullName);
          setInitialFullName(finalFullName);
          setProfileEmail(finalEmail);
          setInitialEmail(finalEmail);
          setProfileUsername(finalUsername);
          setProfileRole(finalRole);
        } catch (error) {
          console.error("Error loading user details:", error);
          // Set defaults on error
          setProfileFullName(DEFAULT_FULL_NAME);
          setInitialFullName(DEFAULT_FULL_NAME);
          setProfileEmail(DEFAULT_EMAIL);
          setInitialEmail(DEFAULT_EMAIL);
          setProfileUsername(DEFAULT_USERNAME);
          setProfileRole(DEFAULT_ROLE);
        }
      };

      loadUserDetails();
    }
  }, [isClient]);

  const currentDisplayedAvatar =
    customAvatarSrc || placeholderAvatars[currentAvatarIndex];

  const handleChangeAvatar = () => {
    setCustomAvatarSrc(null);
    setCurrentAvatarIndex(
      (prevIndex) => (prevIndex + 1) % placeholderAvatars.length
    );
  };

  const handlePasswordChangeSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsPasswordDialogOpen(false);
    toast({
      title: "Password Change Simulated",
      description: "In a real application, your password would be changed.",
    });
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image file smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (e.g., JPG, PNG, GIF).",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomAvatarSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast({
        title: "Avatar Updated",
        description:
          "Your new avatar is now previewing. Click 'Save Profile' to apply (mock save for avatar).",
      });
    }
  };

  const handleSaveProfile = () => {
    if (isClient) {
      (async () => {
        try {
          const response = await fetch("/api/user/profile", {
            method: "PUT",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullName: profileFullName,
              email: profileEmail,
            }),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Failed to update profile");
          }

          const result = await response.json();
          if (!result.success)
            throw new Error(result.error || "Failed to update profile");

          // Update UI
          setInitialFullName(profileFullName);
          setInitialEmail(profileEmail);

          toast({
            title: "Profile Saved",
            description: "Your profile information has been updated.",
          });
        } catch (error: any) {
          console.error("Error updating profile:", error);
          toast({
            title: "Save Failed",
            description: error.message || "Could not update profile",
            variant: "destructive",
          });
        }
      })();
    }
  };

  const handleDiscardChanges = () => {
    setProfileFullName(initialFullName);
    setProfileEmail(initialEmail);
    toast({
      title: "Changes Discarded",
      description:
        "Your profile information has been reverted to the last saved state.",
    });
  };

  const generateNewApiKey = () => {
    const newKey = `sk_live_mock_${Array(24)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join("")}`;
    setApiKey(newKey);
    toast({
      title: "API Key Generated",
      description: "A new mock API key has been generated.",
    });
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard
        .writeText(apiKey)
        .then(() => {
          toast({
            title: "API Key Copied",
            description: "The API key has been copied to your clipboard.",
          });
        })
        .catch((err) => {
          toast({
            title: "Copy Failed",
            description: "Could not copy API key to clipboard.",
            variant: "destructive",
          });
          console.error("Failed to copy API key: ", err);
        });
    }
  };

  if (!isClient) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="h-8 w-3/4 bg-muted rounded mb-2"></div>
            <div className="h-4 w-1/2 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center space-x-6">
              <div className="h-24 w-24 rounded-full bg-muted"></div>
              <div className="space-y-2">
                <div className="h-8 w-48 bg-muted rounded"></div>
                <div className="h-6 w-64 bg-muted rounded"></div>
                <div className="flex gap-2 mt-2">
                  <div className="h-8 w-24 bg-muted rounded"></div>
                  <div className="h-8 w-28 bg-muted rounded"></div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded mb-1"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded mb-1"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded mb-1"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded mb-1"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
            <div className="h-8 w-1/3 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="flex justify-end space-x-2">
              <div className="h-10 w-32 bg-muted rounded"></div>
              <div className="h-10 w-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="h-6 w-1/4 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">User Profile</CardTitle>
          <CardDescription>
            Manage your personal information and settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={currentDisplayedAvatar}
                alt="User Avatar"
                data-ai-hint="user portrait"
              />
              <AvatarFallback>
                {profileFullName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{profileFullName}</h2>
              <p className="text-muted-foreground">{profileEmail}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeAvatar}
                >
                  Change Avatar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadButtonClick}
                >
                  <Upload className="mr-2 h-4 w-4" /> Upload Photo
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileFullName}
                onChange={(e) => setProfileFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={profileUsername} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={profileRole} readOnly disabled />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Account Security</h3>
            <div className="space-y-4">
              <Dialog
                open={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">Change Password</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDesc>
                      Enter your current password and new password below.
                    </DialogDesc>
                  </DialogHeader>
                  <form
                    onSubmit={handlePasswordChangeSubmit}
                    className="space-y-4 py-4"
                  >
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmNewPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPasswordDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Change Password</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                Enable Two-Factor Authentication
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center">
              <KeyRound className="mr-2 h-5 w-5 text-primary" /> API Key
              Management
            </h3>
            <div className="space-y-3 p-4 border rounded-md bg-muted/30 shadow-sm">
              <div className="flex items-center justify-between">
                <Input
                  id="apiKey"
                  value={apiKey}
                  readOnly
                  className="flex-grow mr-2 font-mono text-sm bg-background"
                  aria-label="API Key"
                />
                <Button variant="outline" size="sm" onClick={copyApiKey}>
                  Copy Key
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={generateNewApiKey}>
                Generate New API Key
              </Button>
              <p className="text-xs text-muted-foreground">
                Treat your API keys like passwords. Keep them secret and secure.
                This is a mock API key for demonstration.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDiscardChanges}>
              Discard Changes
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleSaveProfile}
            >
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Profile Banner</CardTitle>
        </CardHeader>
        <CardContent>
          <Image
            src="https://picsum.photos/seed/profilebanner/1200/300"
            alt="Profile banner image"
            width={1200}
            height={300}
            className="w-full h-auto rounded-md object-cover"
            data-ai-hint="abstract background"
          />
        </CardContent>
      </Card>
    </div>
  );
}
