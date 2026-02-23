"use client";

import { useRef, useState, useTransition } from "react";
import { updateDisplayName, updateAvatar } from "./actions";
import { createClient } from "@/lib/supabase";
import { resizeImage } from "@/lib/resize-image";
import UserAvatar from "@/components/UserAvatar";

export default function ProfileForm({
  displayName,
  email,
  avatarUrl,
  userId,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateDisplayName(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Display name updated." });
      }
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const resized = await resizeImage(file, 200);
      const supabase = createClient();
      const path = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, resized, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Add cache-busting param so the browser shows the new image
      const freshUrl = `${publicUrl}?t=${Date.now()}`;

      const result = await updateAvatar(freshUrl);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setCurrentAvatarUrl(freshUrl);
        setMessage({ type: "success", text: "Avatar updated." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to upload avatar. Please try again." });
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      {/* Avatar upload */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Avatar
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="relative group"
          >
            <UserAvatar
              avatarUrl={currentAvatarUrl}
              displayName={displayName}
              size="lg"
              gradient
            />
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              {isUploading ? (
                <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </div>
          </button>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? "Uploading\u2026" : "Change avatar"}
            </button>
            <p className="text-xs text-text-secondary mt-0.5">
              JPG, PNG, or WebP. Will be resized to 200&times;200.
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {/* Display Name */}
      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName}
          maxLength={50}
          required
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-shadow"
          placeholder="Your display name"
        />
        <p className="mt-1 text-xs text-text-secondary">
          This is how other players see you on leaderboards and in leagues.
        </p>
      </div>

      {/* Email (read-only) */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          disabled
          className="w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-2.5 text-sm text-text-secondary cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-text-secondary">
          Email cannot be changed here. Contact support if needed.
        </p>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl aurora-gradient px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Saving\u2026" : "Save changes"}
      </button>
    </form>
  );
}
