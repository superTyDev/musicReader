// pages/upload/listFiles.tsx

import React, { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const ListFilesPage = () => {
  const [username, setUsername] = useState("");
  const debouncedUsername = useDebounce(username, 500);
  const [blobs, setBlobs] = useState([]);

  useEffect(() => {
    if (debouncedUsername !== "") {
      const usernameClean = debouncedUsername.replace(/[^a-z]/g, "");
      fetch(`/api/listFiles?username=${usernameClean}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setBlobs(data);
        });
    }
  }, [debouncedUsername]);

  return (
    <div>
      <h1 style={{ padding: 20 }}>Uploaded Files</h1>
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
            value={username}
            onChange={(event) =>
              setUsername(event.target.value.replace(/[^a-z]/g, ""))
            }
            type="text"
            required
            style={{ width: "100%", padding: 5 }}
          />{" "}
        </div>
      </div>
      <ul style={{ margin: 20 }}>
        {blobs.map((blob) => (
          <li key={blob.uploadedAt}>
            <Image src={blob.url} alt="" width={50} height={50} />
            <Link href={blob.url}>{blob.pathname}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListFilesPage;
