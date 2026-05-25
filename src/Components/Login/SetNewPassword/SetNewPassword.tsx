import React from 'react';
import { Button, Form, Input, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ResetPasswordLayout from '../ResetPasswordLayout';

type SetNewPasswordForm = {
  password: string;
  newPassword: string;
};

const SetNewPassword: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = () => {
    message.success('Password updated successfully.');
    navigate('/login');
  };

  return (
    <ResetPasswordLayout>
      <h1 className="text-[36px] leading-tight font-bold text-black mb-2">Set New Password</h1>
      <div className="relative mb-5 pb-5">
        <p className="text-base text-gray-700">Secure Your Account with a New Password</p>
        <div className="absolute left-0 bottom-0 w-full max-w-[288px] h-px bg-gray-200"></div>
      </div>

      <Form<SetNewPasswordForm>
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="[&_.ant-form-item-label>label]:font-medium [&_.ant-form-item-label>label]:text-black"
      >
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Password is required.' }]}
        >
          <Input.Password
            size="large"
            className="bg-[#fcfdff]"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          label="New Password"
          name="newPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'New Password is required.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match.'));
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            className="bg-[#fcfdff]"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
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

export default SetNewPassword;
