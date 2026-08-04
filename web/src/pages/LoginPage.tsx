import { useState } from "react";
import Logo from '@/assets/svg/logo.svg?react';

export default function LoginPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="max-w-md mx-auto p-4">
      <Logo />
    </div>
  );
}
