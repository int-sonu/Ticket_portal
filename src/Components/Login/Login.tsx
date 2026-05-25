import React from 'react';
import LoginImgDiv from './LoginImgDiv';
import LoginForm from './LoginForm';

const Login: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans">
      <LoginImgDiv />
      <LoginForm />
    </div>
  );
};

export default Login;
