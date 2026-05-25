import React from 'react';
import loginImg from '../../assets/Login/loginImg.png';

const LoginImgDiv: React.FC = () => {
  return (
    <div className="hidden md:flex flex-1 bg-[#f4f7fb] items-center justify-center relative overflow-hidden">
      {/* Soft glow behind the image */}
      <div className="absolute w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(255,200,200,0.3)_0%,rgba(244,247,251,0)_70%)] rounded-full left-[20%] top-[30%] z-0"></div>
      <img src={loginImg} alt="Login Illustration" className="max-w-[110%] max-h-[110%] object-contain z-10" />
    </div>
  );
};

export default LoginImgDiv;
