import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, message, Tag } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import mailIcon from '../../../assets/images/mailImg.png';
import { ticketApis } from '../../../Axios/TicketsApi';
import { getRequestPayload } from '../../../Utils/requestPayload';

interface EstimateShareModalProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  iconSrc?: string;
  iconAlt?: string;
  iconLabel?: string;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const EstimateShareModal: React.FC<EstimateShareModalProps> = ({
  open,
  onClose,
  pdfUrl,
  iconSrc,
  iconAlt = 'Mail',
  iconLabel = 'Mail',
}) => {
  const sessionPayload = useMemo(() => getRequestPayload(), []);
  const [email, setEmail] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setEmail('');
    setEmails([]);
    setIsSubmitting(false);
  }, [open]);

  const addEmail = () => {
    const nextEmail = normalizeEmail(email);

    if (!nextEmail) {
      return;
    }

    if (!isValidEmail(nextEmail)) {
      message.error('Please enter a valid email address');
      return;
    }

    if (emails.includes(nextEmail)) {
      setEmail('');
      return;
    }

    setEmails((prev) => [...prev, nextEmail]);
    setEmail('');
  };

  const handleOk = async () => {
    const finalEmails = [...emails];
    const inlineEmail = normalizeEmail(email);

    if (inlineEmail) {
      if (!isValidEmail(inlineEmail)) {
        message.error('Please enter a valid email address');
        return;
      }

      if (!finalEmails.includes(inlineEmail)) {
        finalEmails.push(inlineEmail);
      }
    }

    if (finalEmails.length === 0) {
      message.error('Please add at least one email address');
      return;
    }

    if (!pdfUrl) {
      message.error('PDF URL is missing');
      return;
    }

    setIsSubmitting(true);

    try {
      await ticketApis.sendEstimateMail({
        nCompanyId: Number(sessionPayload.nCompanyId ?? 0),
        nAgentId: Number(sessionPayload.nAgentId ?? sessionPayload.id ?? 0),
        cSchemaName: sessionPayload.cSchemaName ?? '',
        cDbName: sessionPayload.cDbName ?? '',
        toEmail: finalEmails.join(','),
        subject: 'Estimate PDF',
        body: 'Please find the estimate attached.',
        attachmentUrl: pdfUrl,
        cType: 'detailed',
      });

      message.success('Estimate sent successfully');
      onClose();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to send estimate email',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      destroyOnClose
      title={null}
      closeIcon={<CloseOutlined className="text-xl text-black" />}
      styles={{
        body: {
          padding: '14px 16px 16px',
        },
        content: {
          borderRadius: 10,
        },
      }}
    >
      <div className="space-y-4">
        <div className="text-[18px] font-medium text-slate-900">
          Share Estimate to Customer
        </div>

        <div className="h-px w-full bg-slate-200" />

        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100">
              <img src={iconSrc || mailIcon} alt={iconAlt} className="h-12 w-12" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {emails.map((item) => (
              <Tag
                key={item}
                closable
                onClose={() => setEmails((prev) => prev.filter((value) => value !== item))}
                className="m-0 rounded-full px-3 py-1 text-sm"
              >
                {item}
              </Tag>
            ))}
          </div>

          <div className="space-y-1">
            <div className="text-sm text-slate-600">{iconLabel}</div>
            <div className="flex items-center gap-2">
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onPressEnter={addEmail}
                placeholder="Enter email address"
                className="flex-1"
                suffix={email ? <CloseOutlined onClick={() => setEmail('')} /> : null}
              />
              <Button
                type="primary"
                onClick={addEmail}
                className="!h-9 !w-9 !min-w-9 !px-0 !bg-black !border-black"
                icon={<PlusOutlined />}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="primary"
            loading={isSubmitting}
            onClick={handleOk}
            className="!bg-black !border-black hover:!bg-slate-800 hover:!border-slate-800"
          >
            Ok
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EstimateShareModal;
