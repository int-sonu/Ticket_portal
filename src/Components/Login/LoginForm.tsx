import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useUserLogin } from '../../Hooks/useAuth';

const LoginForm: React.FC = () => {
  const { mutate: loginUser, isPending } = useUserLogin();

  const onFinish = (values: any) => {
    // Depending on your API, you might need to map fields
    // e.g., companyCode, username, password 
    const loginData = {
      username: values.username,
      passwordHash: values.password,
      cSchemaName: values.companyCode,
      cFcmId: "",
      cWebFcmId: "",
      cDeviceId: "",
      cDeviceType: "Web",
      cDeviceInfo: navigator.userAgent,
      bForceClearPrevious: true
    };

    loginUser(loginData, {
      onSuccess: (response) => {
        if (response.statusCode === 200) {
          message.success('Login Successful!');
          // Store the session data securely in the browser's sessionStorage
          sessionStorage.setItem('userSession', JSON.stringify(response.data));
          
          // You could also use React Router here to redirect to a dashboard:
          // navigate('/dashboard');
        } else {
          message.error(response.message || 'Login failed');
        }
      },
      onError: () => {
        message.error('An error occurred during login');
      }
    });
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div className="flex-1 bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-[450px]">
        <h1 className="text-[2.5rem] font-bold mb-1 text-black">Welcome back !</h1>
        
        <div className="relative mb-8 pb-4">
          <p className="text-base text-gray-500">Please enter your details to Login</p>
          <div className="absolute left-0 bottom-0 w-full max-w-[300px] h-px bg-gray-200"></div>
        </div>
        
        <Form
          name="login"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          className="[&_.ant-form-item-label>label]:font-medium [&_.ant-form-item-label>label]:text-gray-800"
          requiredMark={false}
        >
          <Form.Item
            label="Company Code"
            name="companyCode"
            rules={[{ required: true }]}
          >
            <Input size="large" className="bg-[#fcfdff]" />
          </Form.Item>

          <Form.Item
            label="User Name"
            name="username"
            rules={[{ required: true, message: 'username is required.' }]}
          >
            <Input size="large" className="bg-[#fcfdff]" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'password is required.' }]}
          >
            <Input.Password 
              size="large" 
              className="bg-[#fcfdff]"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <div className="text-right mb-6 -mt-2">
            <a href="/forgot-password" className="text-sm text-gray-500 hover:text-blue-500 no-underline">
              Forgot password?
            </a>
          </div>

          <div className="flex justify-end gap-4">
            <Button size="large" type="primary" className="!bg-[#0d3a8d] !border-[#0d3a8d] hover:!bg-[#0a2d6c] hover:!border-[#0a2d6c] text-white rounded min-w-[100px] font-medium">
              Register
            </Button>
            <Button size="large" type="primary" htmlType="submit" loading={isPending} className="!bg-[#0d3a8d] !border-[#0d3a8d] hover:!bg-[#0a2d6c] hover:!border-[#0a2d6c] text-white rounded min-w-[100px] font-medium">
              Sign In
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
