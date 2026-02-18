"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  const handleClick = async () => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Neel" }),
    });
    const data = await res.json();
    setMessage(data.result);
  };

  return (
    <main className="p-40">
      <h1>Github AI Resume Analyzer</h1>

      <button onClick={handleClick}>Call API</button>

      <p>{message}</p>
    </main>
  );
}
