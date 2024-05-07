import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import React, { useState, useRef, use } from "react";

export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  return (
    <>
      <h1 style={{ padding: 20 }}>Upload Your Avatar</h1>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);

          if (!inputFileRef.current?.files) {
            throw new Error("No file selected");
          }

          const file = inputFileRef.current.files[0];
          const username = usernameRef.current?.value.replace(/[^a-z]/g, "");

          const newBlob = await upload(username + "/" + file.name, file, {
            access: "public",
            handleUploadUrl: "/api/uploadFile",
          });

          setBlob(newBlob);
        }}
      >
        <div
          style={{
            padding: 20,
            margin: 20,
            background: "#eeeeee55",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <label htmlFor="username">Username</label>
            <input
              name="username"
              ref={usernameRef}
              type="text"
              required
              style={{ width: "100%", padding: 5 }}
            />{" "}
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <label htmlFor="file">File</label>
            <input name="file" ref={inputFileRef} type="file" required />
          </div>
          <button type="submit" style={{ padding: 5 }}>
            Upload
          </button>
        </div>
      </form>
      {!blob && loading && <div>Uploading...</div>}
      {blob && (
        <div>
          Blob url: <a href={blob.url}>{blob.url}</a>
        </div>
      )}
    </>
  );
}
