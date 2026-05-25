import React from 'react';
import { Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import ResetPasswordLayout from '../ResetPasswordLayout';

type ForgotPasswordForm = {
  email: string;
};

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = (values: ForgotPasswordForm) => {
    navigate('/forgot-password-otp', { state: { email: values.email } });
  };

  return (
    <ResetPasswordLayout>
      <h1 className="text-[36px] leading-tight font-bold text-black mb-2">Forgot Password?</h1>
      <div className="relative mb-6 pb-5">
        <p className="text-base text-gray-700">Enter your email for instructions</p>
        <div className="absolute left-0 bottom-0 w-full max-w-[288px] h-px bg-gray-200"></div>
      </div>

      <Form<ForgotPasswordForm>
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="[&_.ant-form-item-label>label]:font-medium [&_.ant-form-item-label>label]:text-black"
      >
        <Form.Item
          label="Email Id"
          name="email"
          rules={[
            { required: true, message: 'Email Id is required.' },
            { type: 'email', message: 'Please enter a valid email.' },
          ]}
        >
          <Input size="large" autoFocus className="bg-[#fcfdff]" />
        </Form.Item>

        <div className="flex justify-end">
          <Button
            size="large"
            type="primary"
            htmlType="submit"
            className="!bg-[#0d3a8d] !border-[#0d3a8d] hover:!bg-[#0a2d6c] hover:!border-[#0a2d6c] text-white rounded min-w-[100px] font-medium"
          >
            Next
          </Button>
        </div>
      </Form>
    </ResetPasswordLayout>
  );
};

export default ForgotPassword;
