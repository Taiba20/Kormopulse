import React, { useState } from "react";
import Login from "../components/LoginSignup/Login";
import Signup from "../components/LoginSignup/Signup";

function LoginSignUp() {
  const [loginSelected, setLoginSelected] = useState(true); // Start with Login

  const switchToSignup = () => {
    setLoginSelected(false);
  };

  const switchToLogin = () => {
    setLoginSelected(true);
  };

  return (
    <div>
      {loginSelected ? (
        <Login onSwitchToSignup={switchToSignup} />
      ) : (
        <Signup onSwitchToLogin={switchToLogin} />
      )}
    </div>
  );
}

export default LoginSignUp;
