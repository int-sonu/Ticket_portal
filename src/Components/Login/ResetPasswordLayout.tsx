import type { ReactNode } from 'react';
import LoginImgDiv from './LoginImgDiv';

type ResetPasswordLayoutProps = {
  children: ReactNode;
};

const ResetPasswordLayout = ({ children }: ResetPasswordLayoutProps) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans">
      <LoginImgDiv />
      <main className="flex-1 bg-white flex items-center justify-center px-6 py-10 md:px-10">
        <section className="w-full max-w-[594px]">{children}</section>
      </main>
    </div>
  );
};

export default ResetPasswordLayout;
